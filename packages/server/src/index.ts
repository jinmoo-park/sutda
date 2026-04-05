import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFile } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ErrorPayload,
  GameState,
  RoundHistoryEntry,
  RoomPlayer,
} from '@sutda/shared';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RoomManager } from './room-manager.js';
import { GameEngine } from './game-engine.js';

const PORT = Number(process.env.PORT) || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_DIR = join(__dirname, '../../../packages/client/dist');
const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};
// 장기 캐싱 대상 확장자 (이미지, 폰트, 해시된 에셋)
const LONG_CACHE_EXT = new Set(['.png', '.jpg', '.webp', '.svg', '.ico', '.woff2', '.woff']);

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // socket.io는 자체 처리
  if (req.url?.startsWith('/socket.io')) return;

  const url = req.url?.split('?')[0] ?? '/';
  const filePath = url === '/' || !extname(url) ? join(STATIC_DIR, 'index.html') : join(STATIC_DIR, url);

  readFile(filePath, (err, data) => {
    if (err) {
      readFile(join(STATIC_DIR, 'index.html'), (err2, data2) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data2);
      });
      return;
    }
    const ext = extname(filePath);
    const headers: Record<string, string> = {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
    };
    // 이미지/폰트/해시된 JS·CSS는 1년 캐시, HTML은 no-cache
    if (LONG_CACHE_EXT.has(ext) || filePath.includes('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'https://sutda.duckdns.org',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
  pingTimeout: 60000,   // 모바일 백그라운드 대응: 기본 20s → 60s
  pingInterval: 25000,  // 기본값 유지
});

const roomManager = new RoomManager();
const gameEngines: Map<string, GameEngine> = new Map();

// 채팅 이력 (roomId → 최대 50개 메시지)
const chatHistories = new Map<string, Array<{ playerId: string; nickname: string; text: string; timestamp: number }>>();

// 등교 응답 추적 (roomId → Set<playerId>) — 등교 + 잠시쉬기 모두 포함
const schoolResponded: Map<string, Set<string>> = new Map();
// 다음 판 투표 추적 (roomId → Set<playerId>)
const nextRoundVotes: Map<string, Set<string>> = new Map();
// 대기실 끊김 유예 타이머 (roomId:socketId → timeout)
// 재접속 시 joinRoom이 nickname으로 ID를 갱신하므로, 타이머 만료 시 leaveRoom이 자동으로 no-op
const waitingDisconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
// 게임 중 끊김 유예 타이머 (roomId:playerId → timeout) — 30초 후 강제 퇴장 (D-17)
const gameDisconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
// 라운드 이력 (roomId → RoundHistoryEntry[])
const gameHistories = new Map<string, RoundHistoryEntry[]>();

// 에러 메시지 맵 (per UI-SPEC 에러 메시지 계약)
const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: '존재하지 않는 방입니다. 링크를 다시 확인해주세요.',
  ROOM_FULL: '방이 가득 찼습니다. (최대 6명)',
  NICKNAME_TAKEN: '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.',
  NOT_HOST: '방장만 게임을 시작할 수 있습니다.',
  MIN_PLAYERS: '최소 2명이 필요합니다.',
  GAME_IN_PROGRESS: '게임이 이미 진행 중입니다.',
  INVALID_CHIPS: '초기 칩은 10,000원 단위로 입력해주세요.',
  INVALID_PHASE: '현재 단계에서 수행할 수 없는 액션입니다.',
  NOT_YOUR_TURN: '아직 당신의 차례가 아닙니다.',
  INVALID_CUT: '잘못된 기리입니다. 카드를 다시 확인해주세요.',
  ALREADY_ATTENDED: '이미 등교했습니다.',
  INVALID_ACTION: '수행할 수 없는 액션입니다.',
  GAME_NOT_FOUND: '게임을 찾을 수 없습니다.',
  RECHARGE_IN_PROGRESS: '이미 재충전 요청이 진행 중입니다.',
  RECHARGE_NOT_FOUND: '재충전 요청을 찾을 수 없습니다.',
  INSUFFICIENT_CHIPS: '칩이 부족합니다.',
  CARD_ALREADY_TAKEN: '이미 선택된 카드입니다. 다른 카드를 선택하세요.',
  INVALID_PASSWORD: '암구호가 올바르지 않습니다.',
};

type ErrorCode = ErrorPayload['code'];

type TypedSocket = Parameters<Parameters<typeof io.on>[1]>[0];

function emitError(socket: { emit: (event: 'error', data: ErrorPayload) => void }, code: ErrorCode) {
  socket.emit('error', {
    code,
    message: ERROR_MESSAGES[code] || '알 수 없는 오류가 발생했습니다.',
  });
}

function getEngine(roomId: string): GameEngine {
  const engine = gameEngines.get(roomId);
  if (!engine) throw new Error('GAME_NOT_FOUND');
  return engine;
}

async function handleGameAction(
  socket: TypedSocket,
  roomId: string,
  action: () => void
): Promise<void> {
  try {
    action();
    const engine = getEngine(roomId);

    // 항상 per-player emit — getStateFor가 인디언 모드에서만 마스킹 적용
    // 다른 모드에서는 getState()와 동일한 상태 반환 (성능 동등)
    const sockets = await io.in(roomId).fetchSockets();
    for (const s of sockets) {
      const pid = s.data?.playerId;
      s.emit('game-state', engine.getStateFor(pid) as GameState);
    }
  } catch (err: any) {
    socket.emit('game-error', {
      code: err.message || 'UNKNOWN_ERROR',
      message: ERROR_MESSAGES[err.message] || err.message || '알 수 없는 오류',
    });
  }
}

/**
 * result phase에서 투표가 충분히 모였으면 다음 판을 시작한다.
 * - disconnect + absent 플레이어는 투표 필요 인원에서 제외
 * - next-round 핸들러, take-break 핸들러, disconnect 핸들러에서 공통 호출
 */
async function tryAdvanceNextRound(roomId: string): Promise<void> {
  const engine = gameEngines.get(roomId);
  if (!engine) return;
  const state = engine.getState();
  if (state.phase !== 'result') return;

  const votes = nextRoundVotes.get(roomId);
  if (!votes) return;

  // disconnect + absent 제외한 투표 필요 인원 (0칩 플레이어는 어차피 강퇴 대상이므로 포함)
  const requiredCount = state.players.filter(
    p => !p.isAbsent && !p.isDisconnected && p.chips > 0
  ).length;

  if (votes.size < requiredCount) return;

  nextRoundVotes.delete(roomId);
  schoolResponded.delete(roomId);

  // 칩 0원 플레이어 강제 퇴장 (다음 판 앤티 납부 불가)
  const brokePlayers = state.players.filter(p => p.chips === 0 && !p.isAbsent);
  for (const broke of brokePlayers) {
    const leaveResult = roomManager.leaveRoom(roomId, broke.id);
    if (leaveResult) {
      io.to(broke.id).emit('kicked', { reason: 'NO_CHIPS' });
      const brokenSocket = io.sockets.sockets.get(broke.id);
      if (brokenSocket) brokenSocket.leave(roomId);
    }
  }
  if (brokePlayers.length > 0) {
    const roomAfterKick = roomManager.getRoom(roomId);
    const activePlayers = roomAfterKick?.players.filter(p => !p.isObserver) ?? [];
    if (activePlayers.length < 2) {
      // 1명 이하 남으면 대기실로 복귀
      if (roomAfterKick) roomAfterKick.gamePhase = 'waiting';
      if (roomAfterKick) io.to(roomId).emit('room-state', roomAfterKick);
      gameEngines.delete(roomId);
      return;
    }
    // 엔진 players를 남은 room players와 동기화
    const engineState = engine.getState();
    (engineState as any).players = engineState.players.filter(
      p => activePlayers.some(rp => rp.id === p.id)
    );
    // seatIndex 재정렬
    (engineState as any).players.forEach((p: any, i: number) => { p.seatIndex = i; });
  }

  // 이력 수집
  const lastHistory = (engine as any).lastRoundHistory;
  if (lastHistory) {
    if (!gameHistories.has(roomId)) gameHistories.set(roomId, []);
    gameHistories.get(roomId)!.push(lastHistory);
    io.to(roomId).emit('game-history', { entries: gameHistories.get(roomId)! });
  }

  // proxy-ante 데이터 보존
  const savedProxyBeneficiaries: string[] = (engine.getState() as any).schoolProxyBeneficiaryIds ?? [];
  const savedProxySponsorId: string | undefined = (engine.getState() as any).schoolProxySponsorId;

  engine.nextRound();

  // nextRound() 후 winnerId(=dealer) 보존 (Observer 합류 시 엔진 재생성용)
  const prevDealerId = engine.getState().players.find(p => p.isDealer)?.id;

  // Observer → 일반 플레이어 자동 합류
  const room = roomManager.getRoom(roomId)!;
  const observers = room.players.filter(p => p.isObserver);
  if (observers.length > 0) {
    const engineStatePlayers = engine.getState().players;
    for (const rp of room.players) {
      if (!rp.isObserver) {
        const ep = engineStatePlayers.find(p => p.id === rp.id);
        if (ep) rp.chips = ep.chips;
      }
    }
    for (const obs of observers) {
      obs.isObserver = false;
      obs.chips = obs.observerChips ?? 100000;
      obs.observerChips = undefined;
    }
    const currentState = engine.getState();
    const newEngine = new GameEngine(
      roomId,
      room.players.filter(p => !p.isObserver),
      currentState.mode,
      currentState.roundNumber,
    );
    if (prevDealerId) {
      newEngine.setDealerFromPreviousWinner(prevDealerId);
    }
    gameEngines.set(roomId, newEngine);
  }

  // 자동 앤티
  const activeEngine = gameEngines.get(roomId) ?? engine;
  if (activeEngine.getState().phase === 'attend-school') {
    const nonAbsentPlayers = activeEngine.getState().players.filter(p => !p.isAbsent && p.isAlive);
    for (const p of nonAbsentPlayers) {
      try {
        if (savedProxyBeneficiaries.includes(p.id) && savedProxySponsorId) {
          activeEngine.attendSchoolProxy(p.id, savedProxySponsorId);
        } else {
          activeEngine.attendSchool(p.id);
        }
      } catch { /* 이미 등교 */ }
      if (activeEngine.getState().phase !== 'attend-school') break;
    }
    if (activeEngine.getState().phase === 'attend-school') {
      activeEngine.completeAttendSchool();
    }
  }

  io.to(roomId).emit('room-state', room);
  io.to(roomId).emit('game-state', activeEngine.getState() as GameState);
}

const socketEventRateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 1,
});

io.on('connection', (socket) => {
  socket.use(async ([_event, ..._args], next) => {
    try {
      await socketEventRateLimiter.consume(socket.id);
      next();
    } catch {
      // rate limit 초과: 이벤트 무시, 연결 유지
      // next()를 호출하지 않으면 이벤트 핸들러 실행 안 됨
    }
  });

  // create-room 핸들러
  socket.on('create-room', ({ nickname, initialChips, password }) => {
    if (!RoomManager.validateChips(initialChips)) {
      return emitError(socket, 'INVALID_CHIPS');
    }
    const requiredPassword = process.env.ROOM_CREATE_PASSWORD;
    if (requiredPassword && password !== requiredPassword) {
      return emitError(socket, 'INVALID_PASSWORD');
    }
    const room = roomManager.createRoom(socket.id, nickname, initialChips);
    socket.data.playerId = socket.id;
    socket.data.nickname = nickname;
    socket.data.roomId = room.roomId;
    socket.join(room.roomId);
    socket.emit('set-player-id', { playerId: socket.id });
    socket.emit('room-created', { roomId: room.roomId, roomState: room });
  });

  // join-room 핸들러
  socket.on('join-room', ({ roomId, nickname, initialChips }) => {
    if (!RoomManager.validateChips(initialChips)) {
      return emitError(socket, 'INVALID_CHIPS');
    }
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        return emitError(socket, 'ROOM_NOT_FOUND');
      }

      // 게임 중 신규 입장 → Observer로 추가 (D-12, D-15)
      if (room.gamePhase === 'playing') {
        // 재접속 확인 (닉네임으로 기존 플레이어 찾기)
        const existing = room.players.find(p => p.nickname === nickname);
        if (existing) {
          // 기존 재접속 — roomManager.joinRoom으로 처리
          const { room: updatedRoom } = roomManager.joinRoom(roomId, socket.id, nickname, initialChips);
          socket.data.playerId = socket.id;
          socket.data.nickname = nickname;
          socket.data.roomId = roomId;
          socket.join(roomId);
          socket.emit('set-player-id', { playerId: socket.id });
          io.to(roomId).emit('room-state', updatedRoom);
          const chatHistory = chatHistories.get(roomId);
          if (chatHistory && chatHistory.length > 0) {
            socket.emit('chat-history', { messages: chatHistory });
          }
          const engine = gameEngines.get(roomId);
          if (engine) {
            if (!existing.isObserver) {
              // 일반 플레이어 재접속: nickname으로 엔진 플레이어 id를 새 socket.id로 갱신 후 isDisconnected 해제
              engine.markReconnected(nickname, socket.id);
              const afterReconnect = engine.getState().players.find(p => p.nickname === nickname);
              console.log(`[reconnect] nickname=${nickname} socket=${socket.id} enginePlayerFound=${!!afterReconnect} isDisconnected=${afterReconnect?.isDisconnected}`);
            } else {
              // Observer 재접속: 엔진에 없으므로 markReconnected 불필요
              console.log(`[reconnect-observer] nickname=${nickname} socket=${socket.id} isObserver=true`);
            }
            socket.emit('game-state', engine.getStateFor(socket.id) as GameState);
          }
          // 재접속 시 게임 disconnect 타이머 클리어 (nickname 기반 키)
          const gameTimerKey = `${roomId}:${nickname}`;
          if (gameDisconnectTimers.has(gameTimerKey)) {
            clearTimeout(gameDisconnectTimers.get(gameTimerKey)!);
            gameDisconnectTimers.delete(gameTimerKey);
          }
          // 재접속 알림 토스트용 이벤트 emit (observer 재접속 제외)
          if (!existing.isObserver) {
            io.to(roomId).emit('player-reconnected', { nickname });
          }
          return;
        }

        // 신규 입장 → Observer로 추가
        if (room.players.length >= room.maxPlayers) {
          return emitError(socket, 'ROOM_FULL');
        }

        const playerId = socket.id;
        const observer: RoomPlayer = {
          id: playerId,
          nickname,
          chips: 0,  // Observer 동안 칩 0 (합류 시 observerChips 사용)
          seatIndex: room.players.length,
          isConnected: true,
          isObserver: true,
          observerChips: initialChips,
        };

        room.players.push(observer);
        socket.data = { playerId, nickname, roomId };
        socket.join(roomId);

        socket.emit('set-player-id', { playerId });

        // Observer에게 현재 게임 상태 전송 (D-13)
        const engine = gameEngines.get(roomId);
        if (engine) {
          socket.emit('game-state', engine.getStateFor(playerId) as GameState);
        }

        // 방 상태 업데이트 broadcast
        io.to(roomId).emit('room-state', room);

        // 채팅 이력 전송
        const chatHistory = chatHistories.get(roomId);
        if (chatHistory && chatHistory.length > 0) {
          socket.emit('chat-history', { messages: chatHistory });
        }
        return;
      }

      // 대기실 입장 (기존 로직)
      const { room: updatedRoom } = roomManager.joinRoom(roomId, socket.id, nickname, initialChips);
      console.log(`[join-room] socket=${socket.id} nickname=${nickname} roomId=${roomId} isHost=${updatedRoom.hostId === socket.id} players=${updatedRoom.players.map(p => p.nickname).join(',')}`);
      socket.data.playerId = socket.id;
      socket.data.nickname = nickname;
      socket.data.roomId = roomId;
      socket.join(roomId);
      socket.emit('set-player-id', { playerId: socket.id });
      // 방 전체에 갱신된 상태 브로드캐스트 (방장 포함 모든 클라이언트 갱신)
      io.to(roomId).emit('room-state', updatedRoom);
      // 채팅 이력 전송 (입장 시 기존 채팅 복원)
      const chatHistory = chatHistories.get(roomId);
      if (chatHistory && chatHistory.length > 0) {
        socket.emit('chat-history', { messages: chatHistory });
      }
      // 재접속 시 disconnect 타이머 클리어 (nickname 기반 키)
      const reconnectGameKey = `${roomId}:${nickname}`;
      if (gameDisconnectTimers.has(reconnectGameKey)) {
        clearTimeout(gameDisconnectTimers.get(reconnectGameKey)!);
        gameDisconnectTimers.delete(reconnectGameKey);
      }
      const reconnectWaitKey = `${roomId}:wait:${nickname}`;
      if (waitingDisconnectTimers.has(reconnectWaitKey)) {
        clearTimeout(waitingDisconnectTimers.get(reconnectWaitKey)!);
        waitingDisconnectTimers.delete(reconnectWaitKey);
        // 대기실 재접속 알림 토스트용 이벤트 emit
        io.to(roomId).emit('player-reconnected', { nickname });
      }
    } catch (err: any) {
      emitError(socket, err.message as ErrorCode);
    }
  });

  // leave-room 핸들러
  socket.on('leave-room', ({ roomId }) => {
    const result = roomManager.leaveRoom(roomId, socket.id);
    if (result) {
      socket.leave(roomId);
      io.to(roomId).emit('player-left', {
        playerId: result.removedPlayerId,
        newHostId: result.newHostId,
        nickname: socket.data.nickname,
      });
      // 방이 비었으면 채팅 이력 정리
      const room = roomManager.getRoom(roomId);
      if (!room || room.players.length === 0) {
        chatHistories.delete(roomId);
      }
    }
  });

  // send-chat 핸들러
  socket.on('send-chat', ({ roomId, text }) => {
    // A01: 요청자가 해당 방에 속하는지 검증
    if (socket.data.roomId !== roomId) return;
    if (!text || text.trim().length === 0) return;
    const msg = {
      playerId: socket.data.playerId,
      nickname: socket.data.nickname,
      text: text.trim().slice(0, 200),
      timestamp: Date.now(),
    };
    if (!chatHistories.has(roomId)) chatHistories.set(roomId, []);
    const history = chatHistories.get(roomId)!;
    history.push(msg);
    if (history.length > 50) history.shift();
    io.to(roomId).emit('chat-message', msg);
  });

  // start-game 핸들러
  socket.on('start-game', ({ roomId }) => {
    const check = roomManager.canStartGame(roomId, socket.id);
    if (!check.ok) {
      return emitError(socket, check.code as ErrorCode);
    }
    const room = roomManager.startGame(roomId);
    if (room) {
      // GameEngine 생성 -- mode를 하드코딩하지 않는다.
      // constructor의 mode 파라미터는 초기값으로만 사용되며,
      // 실제 모드 선택은 select-mode 이벤트에서 selectMode() 메서드를 통해 이루어진다.
      // 첫 판(roundNumber=1)이면 dealer-select phase로 시작하고,
      // 모드 선택은 attend-school 이후 mode-select phase에서 처리된다.
      const engine = new GameEngine(roomId, room.players, 'original', 1);
      gameEngines.set(roomId, engine);
      io.to(roomId).emit('room-state', room);
      io.to(roomId).emit('game-state', engine.getState() as GameState);
    }
  });

  // 게임 이벤트 핸들러

  socket.on('select-dealer-card', ({ roomId, cardIndex }) => {
    try {
      const engine = getEngine(roomId);
      engine.selectDealerCard(socket.data.playerId, cardIndex);

      // 선 결정 완료 후 attend-school로 전환됐으면 자동 앤티
      if (engine.getState().phase === 'attend-school') {
        const nonAbsentPlayers = engine.getState().players.filter(p => !p.isAbsent && p.isAlive);
        for (const p of nonAbsentPlayers) {
          try { engine.attendSchool(p.id); } catch { /* 이미 등교 */ }
          if (engine.getState().phase !== 'attend-school') break;
        }
        if (engine.getState().phase === 'attend-school') {
          engine.completeAttendSchool();
        }
      }

      io.to(roomId).emit('game-state', engine.getState() as GameState);
    } catch (err: any) {
      socket.emit('game-error', {
        code: err.message || 'UNKNOWN_ERROR',
        message: ERROR_MESSAGES[err.message] || err.message || '알 수 없는 오류',
      });
    }
  });

  socket.on('attend-school', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      const engine = getEngine(roomId);
      const playerId = socket.data.playerId;

      // 학교 대납 체크 (proxy-ante 핸들러에서 설정한 수혜자 목록)
      const state = engine.getState();
      const proxies = state.schoolProxyBeneficiaryIds;
      if (proxies && proxies.includes(playerId)) {
        // 후원자: dealer(선) 플레이어 또는 schoolProxySponsorId
        const sponsorId = (state as any).schoolProxySponsorId ?? state.players.find(p => p.isDealer)?.id;
        if (sponsorId) {
          engine.attendSchoolProxy(playerId, sponsorId);
          // 수혜자 목록에서 제거 (1회성)
          (state as any).schoolProxyBeneficiaryIds = proxies.filter(id => id !== playerId);
        } else {
          engine.attendSchool(playerId);
        }
      } else {
        engine.attendSchool(playerId);
      }

      // 등교 응답 추적 (attendSchool 내부에서 completeAttendSchool 미호출 시)
      if (engine.getState().phase === 'attend-school') {
        if (!schoolResponded.has(roomId)) schoolResponded.set(roomId, new Set());
        const responded = schoolResponded.get(roomId)!;
        responded.add(playerId);
        // skip-school이 먼저 응답했을 수 있으므로 — 비-absent 플레이어 전원 응답 여부 확인
        const nonAbsentCount = engine.getState().players.filter(p => !p.isAbsent).length;
        if (responded.size >= nonAbsentCount) {
          engine.completeAttendSchool();
          schoolResponded.delete(roomId);
        }
      } else {
        // phase가 바뀌었으면 이미 완료됨 — 트래킹 초기화
        schoolResponded.delete(roomId);
      }
    });
  });

  socket.on('skip-school', ({ roomId }) => {
    try {
      const engine = getEngine(roomId);
      const state = engine.getState();
      if (state.phase !== 'attend-school') return;

      // 선 플레이어는 잠시 쉬기 불가
      const me = state.players.find(p => p.id === socket.data.playerId);
      if (me?.isDealer) {
        socket.emit('game-error', { code: 'INVALID_ACTION', message: '선 플레이어는 잠시 쉬기를 할 수 없습니다.' });
        return;
      }

      if (!schoolResponded.has(roomId)) schoolResponded.set(roomId, new Set());
      const responded = schoolResponded.get(roomId)!;
      responded.add(socket.data.playerId);

      // 비-absent 플레이어 전원 응답 시 completeAttendSchool 호출
      const nonAbsentCount = state.players.filter(p => !p.isAbsent).length;
      if (responded.size >= nonAbsentCount) {
        engine.completeAttendSchool();
        schoolResponded.delete(roomId);
        io.to(roomId).emit('game-state', engine.getState() as GameState);
      }
    } catch (err: any) {
      socket.emit('game-error', { code: err.message, message: err.message });
    }
  });

  socket.on('return-from-break', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      const engine = getEngine(roomId);
      engine.returnFromBreak(socket.data.playerId);
      // schoolResponded에서 제거 — 복귀 후 직접 attend-school 응답하게 함
      schoolResponded.get(roomId)?.delete(socket.data.playerId);
    });
  });

  socket.on('select-mode', ({ roomId, mode }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).selectMode(socket.data.playerId, mode);
    });
  });

  socket.on('shuffle', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).shuffle(socket.data.playerId);
    });
  });

  socket.on('giri-phase-update', ({ roomId, phase, piles, tapOrder }) => {
    // 게임 로직 불필요 — 순수 UI 브로드캐스트
    io.to(roomId).emit('giri-phase-update', {
      phase,
      piles,
      tapOrder,
      cutterNickname: socket.data.nickname,
    });
  });

  socket.on('cut', ({ roomId, cutPoints, order }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).cut(socket.data.playerId, cutPoints, order);
    });
  });

  socket.on('declare-ttong', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).declareTtong(socket.data.playerId);
    });
  });

  socket.on('bet-action', ({ roomId, action }) => {
    handleGameAction(socket, roomId, () => {
      const engine = getEngine(roomId);
      if (action.type === 'raise') {
        const state = engine.getState() as GameState;
        const currentPlayer = state.players.find(
          p => p.seatIndex === state.currentPlayerIndex
        );
        if (currentPlayer) {
          const effectiveMax = engine.calculateEffectiveMaxBet(currentPlayer.id);
          const callAmount = state.currentBetAmount - currentPlayer.currentBet;
          const totalNeeded = callAmount + action.amount;
          if (totalNeeded > effectiveMax) {
            throw new Error('INSUFFICIENT_CHIPS');
          }
        }
      }
      engine.processBetAction(socket.data.playerId, action);

      // 인디언 모드: betting-1 종료 후 dealing-extra 자동 처리
      const stateAfter = engine.getState();
      if (stateAfter.mode === 'indian' && stateAfter.phase === 'dealing-extra') {
        engine.dealExtraCardIndian();
      }
    });
  });

  socket.on('reveal-my-card', ({ roomId, cardIndex }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).revealMyCard(socket.data.playerId, cardIndex as number);
    });
  });

  socket.on('reveal-card', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).revealCard(socket.data.playerId);
    });
  });

  socket.on('muck-hand', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).muckHand(socket.data.playerId);
    });
  });

  socket.on('open-sejang-card', ({ roomId, cardIndex }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).openSejangCard(socket.data.playerId, cardIndex as 0 | 1);
    });
  });

  socket.on('select-cards', ({ roomId, cardIndices }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).selectCards(socket.data.playerId, cardIndices);
    });
  });

  socket.on('set-shared-card', ({ roomId, cardIndex }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).setSharedCard(socket.data.playerId, cardIndex);
    });
  });

  // reserve-gollagolla-card 핸들러 — 한 장씩 선착순 예약/취소 (2장 예약 시 자동 확정)
  socket.on('reserve-gollagolla-card', ({ roomId, cardIndex, reserve }) => {
    const playerId = socket.data.playerId;
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).reserveGollaCard(playerId, cardIndex, reserve);
    });
  });

  // select-gollagolla-cards 핸들러 — 골라골라 선착순 카드 선택 (per D-02)
  socket.on('select-gollagolla-cards', ({ roomId, cardIndices }) => {
    const playerId = socket.data.playerId;
    handleGameAction(socket, roomId, () => {
      const engine = getEngine(roomId);
      engine.selectGollaCards(playerId, cardIndices);
    });
  });

  socket.on('gusa-rejoin', ({ roomId, join }) => {
    handleGameAction(socket, roomId, () => {
      const engine = gameEngines.get(roomId);
      if (!engine) throw new Error('ROOM_NOT_FOUND');
      engine.recordGusaRejoinDecision(socket.data.playerId, join);
    });
  });

  socket.on('confirm-gusa-announce', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      const engine = getEngine(roomId);
      engine.confirmGusaAnnounce(socket.data.playerId);
    });
  });

  socket.on('start-rematch', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      const engine = getEngine(roomId);
      if (engine.getState().phase !== 'rematch-pending') return;
      engine.confirmRematch(socket.data.playerId);
    });
  });

  socket.on('next-round', async ({ roomId }) => {
    try {
      const engine = getEngine(roomId);
      const state = engine.getState();
      if (state.phase !== 'result') return;

      if (!nextRoundVotes.has(roomId)) nextRoundVotes.set(roomId, new Set());
      const votes = nextRoundVotes.get(roomId)!;
      votes.add(socket.data.playerId);

      // 투표 현황 브로드캐스트 (학교가기 상태 표시용)
      io.to(roomId).emit('next-round-votes', { votedPlayerIds: Array.from(votes) });

      // 투표 충족 여부 확인 후 다음 판 진행 (disconnect + absent 플레이어 제외)
      await tryAdvanceNextRound(roomId);
    } catch (err: any) {
      socket.emit('game-error', { code: err.message, message: err.message });
    }
  });

  socket.on('take-break', async ({ roomId }) => {
    try {
      const engine = getEngine(roomId);
      if (engine.getState().phase !== 'result') return;
      engine.takeBreak(socket.data.playerId);
      io.to(roomId).emit('game-state', engine.getState() as GameState);

      // take-break 후 투표 충족 여부 재계산 (disconnect + absent 플레이어 제외)
      await tryAdvanceNextRound(roomId);
    } catch (err: any) {
      socket.emit('game-error', { code: err.message, message: err.message });
    }
  });

  // kick-player 핸들러 — 방장이 대기실 플레이어를 강퇴
  socket.on('kick-player', ({ roomId, targetPlayerId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    // 방장 여부 검증
    if (room.hostId !== socket.id) return;
    // 게임 중에는 강퇴 불가 (대기실 전용)
    if (room.gamePhase !== 'waiting') return;
    // 자기 자신 강퇴 불가
    if (targetPlayerId === socket.id) return;

    const result = roomManager.leaveRoom(roomId, targetPlayerId);
    if (result) {
      // 강퇴된 플레이어에게 알림
      io.to(targetPlayerId).emit('kicked', { reason: 'BY_HOST' });
      const targetSocket = io.sockets.sockets.get(targetPlayerId);
      if (targetSocket) targetSocket.leave(roomId);

      // 방 상태 갱신
      io.to(roomId).emit('player-left', {
        playerId: result.removedPlayerId,
        newHostId: result.newHostId,
      });
      const updatedRoom = roomManager.getRoom(roomId);
      if (updatedRoom) io.to(roomId).emit('room-state', updatedRoom);
    }
  });

  // proxy-ante 핸들러 — 학교 대납 설정 (SCHOOL-PROXY 서버 측)
  socket.on('proxy-ante', ({ roomId, beneficiaryIds }) => {
    const engine = gameEngines.get(roomId);
    const room = roomManager.getRoom(roomId);
    if (!engine || !room) return;

    // schoolProxyBeneficiaryIds와 sponsorId 저장 — 다음 판 attend-school에서 소비
    const state = engine.getState() as any;
    state.schoolProxyBeneficiaryIds = beneficiaryIds;
    state.schoolProxySponsorId = socket.data.playerId;

    // proxy-ante-applied broadcast (토스트용) — 단일 emit으로 통합
    const sponsorNickname = socket.data.nickname;
    const beneficiaryNicknames = beneficiaryIds
      .map(bid => room.players.find(p => p.id === bid)?.nickname)
      .filter((n): n is string => !!n);
    if (beneficiaryNicknames.length > 0) {
      io.to(roomId).emit('proxy-ante-applied', {
        sponsorNickname,
        beneficiaryNicknames,
      });
    }
  });

  // 연결 끊김 처리
  socket.on('disconnect', (reason) => {
    const { roomId } = socket.data;
    console.log(`[disconnect] socket=${socket.id} reason=${reason} roomId=${roomId} playerId=${socket.data.playerId}`);
    if (roomId) {
      const room = roomManager.getRoom(roomId);
      console.log(`[disconnect] room found=${!!room} gamePhase=${room?.gamePhase} players=${room?.players.map(p => `${p.nickname}(${p.id})`).join(',')}`);
      if (room && room.gamePhase === 'playing') {
        // 게임 중 disconnect: 즉시 관전/대기 전환, 베팅 차례면 자동 다이
        roomManager.disconnectPlayer(roomId, socket.id);
        const updatedRoomAfterDisconnect = roomManager.getRoom(roomId);
        if (updatedRoomAfterDisconnect) io.to(roomId).emit('room-state', updatedRoomAfterDisconnect);
        const disconnectedPlayerId = socket.data.playerId;
        const disconnectedNickname = socket.data.nickname;
        const timerKey = `${roomId}:${disconnectedNickname}`; // nickname 기반 키 (재접속 시 socket.id 변경되므로)

        // 즉시: 퇴장 알림 토스트용 이벤트 emit (재접속 유예 타이머와 별개)
        io.to(roomId).emit('player-disconnected', { nickname: disconnectedNickname });

        // 즉시: 베팅/card-reveal/showdown 차례면 자동 처리
        const engine = gameEngines.get(roomId);
        if (engine) {
          try { engine.forceDisconnectedPlayerAction(disconnectedPlayerId); } catch { /* no-op */ }
          // 즉시 게임 상태 broadcast + result phase 진입 시 투표 재계산
          (async () => {
            const sockets2 = await io.in(roomId).fetchSockets();
            for (const s of sockets2) {
              s.emit('game-state', engine.getStateFor(s.data.playerId) as GameState);
            }
            // card-reveal → showdown → result 자동 전환 포함, result phase면 투표 재계산
            await tryAdvanceNextRound(roomId);
          })();
        }

        // 기존 타이머가 있으면 제거 (중복 방지)
        if (gameDisconnectTimers.has(timerKey)) {
          clearTimeout(gameDisconnectTimers.get(timerKey)!);
        }

        // 60초 후 세션 완전 종료 (방에서 제거)
        const timer = setTimeout(async () => {
          gameDisconnectTimers.delete(timerKey);
          const currentRoom = roomManager.getRoom(roomId);
          if (!currentRoom) return;

          const playerInRoom = currentRoom.players.find(p => p.nickname === disconnectedNickname);
          if (!playerInRoom || playerInRoom.isConnected) return; // 이미 재접속함

          // 게임 진행 중이면 자동 다이 처리
          const eng = gameEngines.get(roomId);
          if (eng) {
            try { eng.forcePlayerLeave(playerInRoom.id); } catch { /* no-op */ }
          }

          // 방에서 제거
          const result = roomManager.leaveRoom(roomId, playerInRoom.id);
          if (result) {
            io.to(roomId).emit('player-left', {
              playerId: result.removedPlayerId,
              newHostId: result.newHostId,
              nickname: disconnectedNickname,
            });

            // 게임 상태 업데이트 broadcast (per-player emit)
            if (eng) {
              const room2 = roomManager.getRoom(roomId);
              if (room2) {
                const sockets2 = await io.in(roomId).fetchSockets();
                for (const s of sockets2) {
                  s.emit('game-state', eng.getStateFor(s.data.playerId) as GameState);
                }
              }
            }

            // 2인 → 1인 남으면 대기실 전환 (D-18)
            const remainingRoom = roomManager.getRoom(roomId);
            if (remainingRoom && remainingRoom.players.filter(p => !p.isObserver).length < 2) {
              remainingRoom.gamePhase = 'waiting';
              gameEngines.delete(roomId);
              io.to(roomId).emit('room-state', remainingRoom);
            }
          }
        }, 60_000); // 60초

        gameDisconnectTimers.set(timerKey, timer);
      } else if (room) {
        // 대기실: 모바일 앱 전환 대응으로 60초 유예
        // 재접속 시 joinRoom이 nickname으로 기존 플레이어 ID를 갱신하므로,
        // 타이머 만료 후 leaveRoom(old socketId)는 자동으로 no-op
        const disconnectedId = socket.id;
        const disconnectedNickname2 = socket.data.nickname;
        const timerKey = `${roomId}:wait:${disconnectedNickname2}`; // nickname 기반 키
        const isHost = room.hostId === disconnectedId;
        const isAlone = room.players.length === 1;
        // 즉시: 퇴장 알림 토스트용 이벤트 emit (혼자인 경우 받을 사람 없으므로 생략)
        if (!isAlone) {
          io.to(roomId).emit('player-disconnected', { nickname: disconnectedNickname2 });
        }
        // 방장 단독: 1시간 유예, 그 외: 60초 유예 (모바일 앱 전환 대응)
        const waitDelay = (isHost && isAlone) ? 3_600_000 : 60_000;
        console.log(`[waiting-disconnect] scheduling leave for ${disconnectedNickname2} in room ${roomId}, timer ${waitDelay}ms (isHost=${isHost}, isAlone=${isAlone})`);
        const timer = setTimeout(() => {
          waitingDisconnectTimers.delete(timerKey);
          console.log(`[waiting-disconnect] timer fired for ${disconnectedNickname2} in room ${roomId}`);
          // nickname으로 현재 player id 찾기 (재접속 시 id 변경됨)
          const currentRoom2 = roomManager.getRoom(roomId);
          const currentPlayer = currentRoom2?.players.find(p => p.nickname === disconnectedNickname2);
          if (!currentPlayer || currentPlayer.isConnected) return; // 이미 재접속함
          const result = roomManager.leaveRoom(roomId, currentPlayer.id);
          console.log(`[waiting-disconnect] leaveRoom result=${!!result}`);
          if (result) {
            io.to(roomId).emit('player-left', {
              playerId: result.removedPlayerId,
              newHostId: result.newHostId,
            });
            // room-state도 보내서 클라이언트 플레이어 목록 갱신
            const remainingRoom = roomManager.getRoom(roomId);
            if (remainingRoom && remainingRoom.players.length > 0) {
              io.to(roomId).emit('room-state', remainingRoom);
            }
            // 방이 비었으면 채팅 이력 정리
            if (!remainingRoom || remainingRoom.players.length === 0) {
              chatHistories.delete(roomId);
            }
          }
        }, waitDelay);
        waitingDisconnectTimers.set(timerKey, timer);
      }
    }
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

process.on('exit', (code) => {
  console.error(`[process:exit] code=${code}`, new Error('exit stack').stack);
});

httpServer.on('error', (err) => {
  console.error('[httpServer:error]', err);
});

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Sutda server listening on port ${PORT}`);
  });
}

export { io, roomManager, httpServer, gameEngines };
