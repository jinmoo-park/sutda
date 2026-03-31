import { createServer } from 'http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ErrorPayload,
  GameState,
} from '@sutda/shared';
import { RoomManager } from './room-manager.js';
import { GameEngine } from './game-engine.js';

const PORT = Number(process.env.PORT) || 3001;

const httpServer = createServer();
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();
const gameEngines: Map<string, GameEngine> = new Map();

// 등교 응답 추적 (roomId → Set<playerId>) — 등교 + 잠시쉬기 모두 포함
const schoolResponded: Map<string, Set<string>> = new Map();
// 다음 판 투표 추적 (roomId → Set<playerId>)
const nextRoundVotes: Map<string, Set<string>> = new Map();

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

io.on('connection', (socket) => {
  // create-room 핸들러
  socket.on('create-room', ({ nickname, initialChips }) => {
    if (!RoomManager.validateChips(initialChips)) {
      return emitError(socket, 'INVALID_CHIPS');
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
      const { room, player } = roomManager.joinRoom(roomId, socket.id, nickname, initialChips);
      socket.data.playerId = socket.id;
      socket.data.nickname = nickname;
      socket.data.roomId = roomId;
      socket.join(roomId);
      socket.emit('set-player-id', { playerId: socket.id });
      // 방 전체에 갱신된 상태 브로드캐스트 (방장 포함 모든 클라이언트 갱신)
      io.to(roomId).emit('room-state', room);
      // 게임 진행 중이면 현재 게임 상태도 전송 (재접속 / 뒤늦게 합류한 플레이어 대응)
      if (room.gamePhase === 'playing') {
        const engine = gameEngines.get(roomId);
        if (engine) {
          socket.emit('game-state', engine.getStateFor(socket.data.playerId) as GameState);
        }
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
      });
    }
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
      engine.attendSchool(socket.data.playerId);
      // 등교 응답 추적 (attendSchool 내부에서 completeAttendSchool 미호출 시)
      if (engine.getState().phase === 'attend-school') {
        if (!schoolResponded.has(roomId)) schoolResponded.set(roomId, new Set());
        const responded = schoolResponded.get(roomId)!;
        responded.add(socket.data.playerId);
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

  socket.on('next-round', ({ roomId }) => {
    try {
      const engine = getEngine(roomId);
      const state = engine.getState();
      if (state.phase !== 'result') return;

      if (!nextRoundVotes.has(roomId)) nextRoundVotes.set(roomId, new Set());
      const votes = nextRoundVotes.get(roomId)!;
      votes.add(socket.data.playerId);

      // 비-absent 플레이어 전원 투표 시 다음 판 시작
      const nonAbsentCount = state.players.filter(p => !p.isAbsent).length;
      if (votes.size >= nonAbsentCount) {
        nextRoundVotes.delete(roomId);
        schoolResponded.delete(roomId);
        engine.nextRound();

        // 모달 없이 자동 앤티: 비-absent 플레이어 전원 자동 등교
        if (engine.getState().phase === 'attend-school') {
          const nonAbsentPlayers = engine.getState().players.filter(p => !p.isAbsent && p.isAlive);
          for (const p of nonAbsentPlayers) {
            try { engine.attendSchool(p.id); } catch { /* 이미 등교 */ }
            if (engine.getState().phase !== 'attend-school') break;
          }
          // 아직 attend-school이면 (absent 플레이어 때문에 자동완료 안 된 경우) 강제 완료
          if (engine.getState().phase === 'attend-school') {
            engine.completeAttendSchool();
          }
        }

        io.to(roomId).emit('game-state', engine.getState() as GameState);
      }
    } catch (err: any) {
      socket.emit('game-error', { code: err.message, message: err.message });
    }
  });

  socket.on('take-break', ({ roomId }) => {
    try {
      const engine = getEngine(roomId);
      if (engine.getState().phase !== 'result') return;
      engine.takeBreak(socket.data.playerId);
      io.to(roomId).emit('game-state', engine.getState() as GameState);

      // take-break 후 비-absent 전원이 이미 투표했으면 다음 판 진행
      const newState = engine.getState();
      const votes = nextRoundVotes.get(roomId);
      if (votes) {
        const nonAbsentCount = newState.players.filter(p => !p.isAbsent).length;
        if (nonAbsentCount > 0 && votes.size >= nonAbsentCount) {
          nextRoundVotes.delete(roomId);
          schoolResponded.delete(roomId);
          engine.nextRound();

          // 자동 앤티
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
        }
      }
    } catch (err: any) {
      socket.emit('game-error', { code: err.message, message: err.message });
    }
  });

  // recharge-request 핸들러
  socket.on('recharge-request', ({ roomId, amount }) => {
    try {
      const result = roomManager.requestRecharge(roomId, socket.data.playerId, amount);
      // 요청자 제외 다른 플레이어에게 투표 요청 전송
      socket.to(roomId).emit('recharge-requested', {
        requesterId: result.requesterId,
        requesterNickname: result.requesterNickname,
        amount: result.amount,
      });
      // 요청자에게는 투표 진행 상태 전송
      socket.emit('recharge-vote-update', {
        votedCount: 0,
        totalNeeded: result.totalNeeded,
        approved: true,
      });
    } catch (err: any) {
      socket.emit('game-error', {
        code: err.message || 'UNKNOWN_ERROR',
        message: ERROR_MESSAGES[err.message] || err.message || '알 수 없는 오류',
      });
    }
  });

  // recharge-vote 핸들러
  socket.on('recharge-vote', ({ roomId, approved }) => {
    try {
      const result = roomManager.processRechargeVote(roomId, socket.data.playerId, approved);
      if (result.complete) {
        if (result.approved) {
          const rechargeResult = roomManager.applyRecharge(roomId);
          io.to(roomId).emit('recharge-result', {
            requesterId: rechargeResult.requesterId,
            approved: true,
            newChips: rechargeResult.newChips,
          });
          // GameEngine 상태에도 칩 반영 — applyRechargeToPlayer를 사용하여
          // chipBreakdown과 effectiveMaxBet이 자동으로 재계산되도록 보장
          const engine = gameEngines.get(roomId);
          if (engine) {
            engine.applyRechargeToPlayer(rechargeResult.requesterId, rechargeResult.newChips);
            io.to(roomId).emit('game-state', engine.getState() as GameState);
          }
        } else {
          // 거부 시: result.requesterId를 사용 (socket.data.playerId는 투표자이므로 사용 금지)
          io.to(roomId).emit('recharge-result', {
            requesterId: result.requesterId,
            approved: false,
          });
        }
      } else {
        // 투표 진행 상태 업데이트 (방 전체에)
        io.to(roomId).emit('recharge-vote-update', {
          votedCount: result.votedCount,
          totalNeeded: result.totalNeeded,
          approved: true,
        });
      }
    } catch (err: any) {
      socket.emit('game-error', {
        code: err.message || 'UNKNOWN_ERROR',
        message: ERROR_MESSAGES[err.message] || err.message || '알 수 없는 오류',
      });
    }
  });

  // 연결 끊김 처리
  socket.on('disconnect', () => {
    const { roomId } = socket.data;
    if (roomId) {
      const room = roomManager.getRoom(roomId);
      if (room && room.gamePhase === 'playing') {
        // 게임 중이면 연결만 끊김 처리 (재접속 대기, per D-05)
        roomManager.disconnectPlayer(roomId, socket.id);
      } else {
        // 대기실이면 퇴장 처리
        const result = roomManager.leaveRoom(roomId, socket.id);
        if (result) {
          io.to(roomId).emit('player-left', {
            playerId: result.removedPlayerId,
            newHostId: result.newHostId,
          });
        }
      }
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Sutda server listening on port ${PORT}`);
  });
}

export { io, roomManager, httpServer, gameEngines };
