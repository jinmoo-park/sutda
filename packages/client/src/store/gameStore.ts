import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { GameState, RoomState, ServerToClientEvents, ClientToServerEvents, RoundHistoryEntry } from '@sutda/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

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
  chatMessages: ChatMessage[];
  roundHistory: RoundHistoryEntry[];
  nextRoundVotedIds: string[];

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
  chatMessages: [],
  roundHistory: [],
  nextRoundVotedIds: [],

  connect: (serverUrl: string) => {
    const existing = get().socket;
    if (existing?.connected) return; // 싱글턴 보장

    // 좀비 소켓 정리 — 연결 안 된 이전 소켓의 이벤트 리스너가 에러 상태를 오염시키는 것 방지
    if (existing) {
      existing.removeAllListeners();
      existing.disconnect();
    }

    const socket: AppSocket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });

    socket.on('connect', () => {
      set({ myPlayerId: socket.id ?? null, error: null });
    });

    socket.on('set-player-id', ({ playerId }) => {
      set({ myPlayerId: playerId });
    });

    socket.on('game-state', (state: GameState) => {
      const prev = get().gameState;
      // result phase에서 벗어나면 nextRoundVotedIds 초기화
      const wasResult = prev?.phase === 'result';
      const isResult = state.phase === 'result';
      if (wasResult && !isResult) {
        set({ gameState: state, nextRoundVotedIds: [] });
      } else {
        set({ gameState: state });
      }
    });

    socket.on('room-state', (state: RoomState) => {
      if (state.gamePhase === 'waiting') {
        set({ roomState: state, gameState: null });
      } else {
        set({ roomState: state });
      }
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

    socket.on('chat-message', (msg) => {
      set(state => ({ chatMessages: [...state.chatMessages, msg] }));
    });

    socket.on('chat-history', ({ messages }) => {
      set({ chatMessages: messages });
    });

    socket.on('game-history', ({ entries }) => {
      set({ roundHistory: entries });
    });

    socket.on('next-round-votes', ({ votedPlayerIds }) => {
      set({ nextRoundVotedIds: votedPlayerIds });
    });

    socket.on('proxy-ante-applied', ({ sponsorNickname, beneficiaryNickname }) => {
      toast(`${sponsorNickname}님이 ${beneficiaryNickname}의 학교를 대신 가줬습니다`);
    });

    socket.on('player-left', ({ nickname }) => {
      if (nickname) {
        toast.error(`${nickname}님 연결이 끊어졌습니다`);
      }
    });

    socket.on('disconnect', () => {
      set({ error: '연결이 끊겼어요. 자동 재연결 중...' });
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, gameState: null, roomState: null, myPlayerId: null, chatMessages: [], roundHistory: [], nextRoundVotedIds: [] });
  },

  clearError: () => set({ error: null }),

  sendChat: (roomId: string, text: string) => {
    get().socket?.emit('send-chat', { roomId, text });
  },
}));
