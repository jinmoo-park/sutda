import type { RoomState, RoomPlayer } from './room';
import type { GameState, GameMode, BetAction } from './game';

/** 에러 응답 (per UI-SPEC 에러 메시지 계약) */
export interface ErrorPayload {
  code:
    | 'ROOM_NOT_FOUND'
    | 'ROOM_FULL'
    | 'NICKNAME_TAKEN'
    | 'NOT_HOST'
    | 'MIN_PLAYERS'
    | 'GAME_IN_PROGRESS'
    | 'INVALID_CHIPS'
    | 'INVALID_PHASE'
    | 'NOT_YOUR_TURN'
    | 'INVALID_CUT'
    | 'ALREADY_ATTENDED'
    | 'INVALID_ACTION'
    | 'RECHARGE_IN_PROGRESS'
    | 'RECHARGE_NOT_FOUND'
    | 'INSUFFICIENT_CHIPS';
  message: string;
}

/** 클라이언트 -> 서버 이벤트 */
export interface ClientToServerEvents {
  'create-room': (data: { nickname: string; initialChips: number }) => void;
  'join-room': (data: { roomId: string; nickname: string; initialChips: number }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'start-game': (data: { roomId: string }) => void;
  'attend-school': (data: { roomId: string }) => void;
  'skip-school': (data: { roomId: string }) => void;
  'select-dealer-card': (data: { roomId: string; cardIndex: number }) => void;
  'select-mode': (data: { roomId: string; mode: GameMode }) => void;
  'shuffle': (data: { roomId: string }) => void;
  'cut': (data: { roomId: string; cutPoints: number[]; order: number[] }) => void;
  'declare-ttong': (data: { roomId: string }) => void;
  'bet-action': (data: { roomId: string; action: BetAction }) => void;
  'reveal-card': (data: { roomId: string }) => void;
  'muck-hand': (data: { roomId: string }) => void;
  'next-round': (data: { roomId: string }) => void;
  'recharge-request': (data: { roomId: string; amount: number }) => void;
  'recharge-vote': (data: { roomId: string; approved: boolean }) => void;
  'return-from-break': (data: { roomId: string }) => void;
  'take-break': (data: { roomId: string }) => void;
  'select-cards': (data: { roomId: string; cardIndices: number[] }) => void;
  'set-shared-card': (data: { roomId: string; cardIndex: number }) => void;
}

/** 서버 -> 클라이언트 이벤트 */
export interface ServerToClientEvents {
  'room-created': (data: { roomId: string; roomState: RoomState }) => void;
  'room-state': (data: RoomState) => void;
  'player-joined': (data: RoomPlayer) => void;
  'player-left': (data: { playerId: string; newHostId?: string }) => void;
  'error': (data: ErrorPayload) => void;
  'game-state': (data: GameState) => void;
  'game-error': (data: { code: string; message: string }) => void;
  'recharge-requested': (data: { requesterId: string; requesterNickname: string; amount: number }) => void;
  'recharge-vote-update': (data: { votedCount: number; totalNeeded: number; approved: boolean }) => void;
  'recharge-result': (data: { requesterId: string; approved: boolean; newChips?: number }) => void;
  'set-player-id': (data: { playerId: string }) => void;
}

/** Socket.IO 서버 간 이벤트 (사용하지 않지만 타입 완전성) */
export interface InterServerEvents {}

/** Socket 데이터 (소켓별 저장 데이터) */
export interface SocketData {
  playerId: string;
  nickname: string;
  roomId: string;
}
