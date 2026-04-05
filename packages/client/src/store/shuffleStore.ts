import { create } from 'zustand';

export type ShufflePhase = 'idle' | 'peek' | 'hold' | 'rise' | 'drop' | 'rest';

interface ShuffleState {
  isShuffling: boolean;
  phase: ShufflePhase;
  pickedIdx: number; // 0 또는 1 — 두 카드 중 어느 쪽이 올라가는지
  startShuffle: () => void;
  stopShuffle: () => void;
  setPhase: (phase: ShufflePhase) => void;
  setPickedIdx: (idx: number) => void;
}

export const useShuffleStore = create<ShuffleState>((set) => ({
  isShuffling: false,
  phase: 'idle',
  pickedIdx: 0,
  startShuffle: () => set({ isShuffling: true, phase: 'peek' }),
  stopShuffle: () => set({ isShuffling: false, phase: 'idle', pickedIdx: 0 }),
  setPhase: (phase) => set({ phase }),
  setPickedIdx: (idx) => set({ pickedIdx: idx }),
}));
