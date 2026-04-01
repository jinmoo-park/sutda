import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameState, RoomState, ServerToClientEvents, ClientToServerEvents } from '@sutda/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface RechargeRequest {
  requesterId: string;
  requesterNickname: string;
  amount: number;
}

interface ChatMessage {
  playerId: string;
  nickname: string;
  text: string;
  timestamp: number;
}

interface GameStore {
  // 상태
  socket: AppSocket | null;
  gameState: GameState | null;
  roomState: RoomState | null;
  myPlayerId: string | null;
  error: string | null;
  rechargeRequest: RechargeRequest | null;
  chatMessages: ChatMessage[];

  // 액션
  connect: (serverUrl: string) => void;
  disconnect: () => void;
  clearError: () => void;
  sendChat: (roomId: string, text: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  roomState: null,
  myPlayerId: null,
  error: null,
  rechargeRequest: null,
  chatMessages: [],

  connect: (serverUrl: string) => {
    const existing = get().socket;
    if (existing?.connected) return; // 싱글턴 보장

    const socket: AppSocket = io(serverUrl, { autoConnect: true });

    socket.on('connect', () => {
      set({ myPlayerId: socket.id ?? null });
    });

    socket.on('set-player-id', ({ playerId }) => {
      set({ myPlayerId: playerId });
    });

    socket.on('game-state', (state: GameState) => {
      set({ gameState: state });
    });

    socket.on('room-state', (state: RoomState) => {
      set({ roomState: state });
    });

    socket.on('room-created', ({ roomId: _roomId, roomState }) => {
      set({ roomState });
    });

    socket.on('game-error', ({ message }) => {
      set({ error: message });
    });

    socket.on('error', ({ message }) => {
      set({ error: message });
    });

    socket.on('recharge-requested', (data) => {
      set({ rechargeRequest: data });
    });

    socket.on('recharge-result', () => {
      set({ rechargeRequest: null });
    });

    socket.on('chat-message', (msg) => {
      set(state => ({ chatMessages: [...state.chatMessages, msg] }));
    });

    socket.on('chat-history', ({ messages }) => {
      set({ chatMessages: messages });
    });

    socket.on('disconnect', () => {
      set({ error: '서버 연결이 끊겼어요. 페이지를 새로 고침해 주세요.' });
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, gameState: null, roomState: null, myPlayerId: null, rechargeRequest: null, chatMessages: [] });
  },

  clearError: () => set({ error: null }),

  sendChat: (roomId: string, text: string) => {
    get().socket?.emit('send-chat', { roomId, text });
  },
}));
