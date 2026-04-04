import type { RoomState, RoomPlayer } from './room.js';
import type { GameState, GameMode, BetAction, RoundHistoryEntry } from './game.js';

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
    | 'INSUFFICIENT_CHIPS'
    | 'CARD_ALREADY_TAKEN'
    | 'SELECTION_COMPLETE'
    | 'CHAT_TOO_FAST'
    | 'INVALID_PASSWORD';
  message: string;
}

/** 클라이언트 -> 서버 이벤트 */
export interface ClientToServerEvents {
  'create-room': (data: { nickname: string; initialChips: number; password?: string }) => void;
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
  'reveal-my-card': (data: { roomId: string; cardIndex: number }) => void;
  'reveal-card': (data: { roomId: string }) => void;
  'muck-hand': (data: { roomId: string }) => void;
  'next-round': (data: { roomId: string }) => void;
  'return-from-break': (data: { roomId: string }) => void;
  'take-break': (data: { roomId: string }) => void;
  'open-sejang-card': (data: { roomId: string; cardIndex: 0 | 1 }) => void;
  'select-cards': (data: { roomId: string; cardIndices: number[] }) => void;
  'set-shared-card': (data: { roomId: string; cardIndex: number }) => void;
  'select-gollagolla-cards': (data: { roomId: string; cardIndices: [number, number] }) => void;
  'reserve-gollagolla-card': (data: { roomId: string; cardIndex: number; reserve: boolean }) => void;
  'start-rematch': (data: { roomId: string }) => void;
  'gusa-rejoin': (data: { roomId: string; join: boolean }) => void;
  'confirm-gusa-announce': (data: { roomId: string }) => void;
  'send-chat': (data: { roomId: string; text: string }) => void;
  'proxy-ante': (data: { roomId: string; beneficiaryIds: string[] }) => void;
}

/** 서버 -> 클라이언트 이벤트 */
export interface ServerToClientEvents {
  'room-created': (data: { roomId: string; roomState: RoomState }) => void;
  'room-state': (data: RoomState) => void;
  'player-joined': (data: RoomPlayer) => void;
  'player-left': (data: { playerId: string; newHostId?: string; nickname?: string }) => void;
  'error': (data: ErrorPayload) => void;
  'game-state': (data: GameState) => void;
  'game-error': (data: { code: string; message: string }) => void;
  'set-player-id': (data: { playerId: string }) => void;
  'chat-message': (data: { playerId: string; nickname: string; text: string; timestamp: number }) => void;
  'chat-history': (data: { messages: Array<{ playerId: string; nickname: string; text: string; timestamp: number }> }) => void;
  'proxy-ante-applied': (data: { sponsorNickname: string; beneficiaryNickname: string }) => void;
  'game-history': (data: { entries: RoundHistoryEntry[] }) => void;
  'kicked': (data: { reason: string }) => void;
}

/** Socket.IO 서버 간 이벤트 (사용하지 않지만 타입 완전성) */
export interface InterServerEvents {}

/** Socket 데이터 (소켓별 저장 데이터) */
export interface SocketData {
  playerId: string;
  nickname: string;
  roomId: string;
}
