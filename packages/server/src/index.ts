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

function handleGameAction(
  socket: TypedSocket,
  roomId: string,
  action: () => void
): void {
  try {
    action();
    const engine = getEngine(roomId);
    io.to(roomId).emit('game-state', engine.getState() as GameState);
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
      // 참여한 플레이어에게 전체 방 상태 전송
      socket.emit('room-state', room);
      // 기존 플레이어들에게 새 플레이어 알림
      socket.to(roomId).emit('player-joined', player);
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
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).selectDealerCard(socket.data.playerId, cardIndex);
    });
  });

  socket.on('attend-school', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).attendSchool(socket.data.playerId);
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
    });
  });

  socket.on('reveal-card', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).revealCard(socket.data.playerId);
    });
  });

  socket.on('next-round', ({ roomId }) => {
    handleGameAction(socket, roomId, () => {
      getEngine(roomId).nextRound();
    });
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
