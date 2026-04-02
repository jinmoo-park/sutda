import { create } from 'zustand';

export type GiriPhase = 'split' | 'tap' | 'merging' | 'done';

export interface Pile {
  id: number;        // 더미 식별자
  cardCount: number; // 해당 더미의 카드 수
  x: number;        // 컨테이너 내 x 위치
  y: number;        // 컨테이너 내 y 위치
}

interface GiriState {
  phase: GiriPhase;
  piles: Pile[];
  tapOrder: number[]; // 더미 id 순서 (1번 탭 = 맨 아래)
  isTtong: boolean;

  // Actions
  initSplit: (x?: number, y?: number) => void;
  addSplitPile: (pileId: number, deductCount: number, newX: number, newY: number) => void;
  addSplitPileWithLayout: (
    pileId: number,
    deductCount: number,
    layoutFn: (piles: Pile[]) => { id: number; x: number; y: number }[]
  ) => void;
  tapPile: (pileId: number) => void;
  untapPile: (pileId: number) => void;
  setMerging: () => void;
  setDone: () => void;
  setTtong: () => void;
  reset: () => void;
}

export const useGiriStore = create<GiriState>((set) => ({
  phase: 'split',
  piles: [{ id: 0, cardCount: 20, x: 150, y: 40 }],
  tapOrder: [],
  isTtong: false,

  initSplit: (x?: number, y?: number) =>
    set({
      phase: 'split',
      piles: [{ id: 0, cardCount: 20, x: x ?? 150, y: y ?? 40 }],
      tapOrder: [],
      isTtong: false,
    }),

  // 드래그 완료 시: 원래 더미에서 차감하고 새 더미를 드롭 위치에 추가
  addSplitPile: (pileId, deductCount, newX, newY) =>
    set((state) => {
      const idx = state.piles.findIndex((p) => p.id === pileId);
      if (idx === -1) return state;
      const pile = state.piles[idx];
      if (deductCount <= 0 || deductCount >= pile.cardCount) return state;
      const newPiles = [...state.piles];
      newPiles[idx] = { ...pile, cardCount: pile.cardCount - deductCount };
      const newId = Math.max(...newPiles.map((p) => p.id)) + 1;
      newPiles.push({ id: newId, cardCount: deductCount, x: newX, y: newY });
      return { piles: newPiles };
    }),

  // 스와이프 컷팅 완료 시: 새 더미 추가 후 layoutFn으로 전체 더미 재배치
  addSplitPileWithLayout: (pileId, deductCount, layoutFn) =>
    set((state) => {
      const idx = state.piles.findIndex((p) => p.id === pileId);
      if (idx === -1) return state;
      const pile = state.piles[idx];
      if (deductCount <= 0 || deductCount >= pile.cardCount) return state;
      const newPiles = [...state.piles];
      newPiles[idx] = { ...pile, cardCount: pile.cardCount - deductCount };
      const newId = Math.max(...newPiles.map((p) => p.id)) + 1;
      newPiles.push({ id: newId, cardCount: deductCount, x: 0, y: 0 });
      const positions = layoutFn(newPiles);
      const finalPiles = newPiles.map((p) => {
        const pos = positions.find((pos) => pos.id === p.id);
        return pos ? { ...p, x: pos.x, y: pos.y } : p;
      });
      return { piles: finalPiles };
    }),

  tapPile: (pileId) =>
    set((state) => {
      if (state.tapOrder.includes(pileId)) return state;
      return { tapOrder: [...state.tapOrder, pileId] };
    }),

  untapPile: (pileId) =>
    set((state) => ({
      tapOrder: state.tapOrder.filter((id) => id !== pileId),
    })),

  setMerging: () => set({ phase: 'merging' }),
  setDone: () => set({ phase: 'done' }),
  setTtong: () => set({ isTtong: true, phase: 'done' }),
  reset: () =>
    set({
      phase: 'split',
      piles: [{ id: 0, cardCount: 20, x: 150, y: 40 }],
      tapOrder: [],
      isTtong: false,
    }),
}));
