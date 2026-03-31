import { create } from 'zustand';

export type GiriPhase = 'split' | 'tap' | 'merging' | 'done';

interface Pile {
  id: number;        // 더미 식별자
  cardCount: number; // 해당 더미의 카드 수
  offsetX: number;   // 드래그 결과 x 위치 오프셋
}

interface GiriState {
  phase: GiriPhase;
  piles: Pile[];
  tapOrder: number[]; // 더미 id 순서 (1번 탭 = 맨 아래)
  isTtong: boolean;

  // Actions
  initSplit: () => void;                                     // 초기 상태 (20장 1더미)
  splitPile: (pileId: number, splitPoint: number) => void;  // 더미 분리
  tapPile: (pileId: number) => void;                        // 순서 지정
  untapPile: (pileId: number) => void;                      // 순서 해제
  setMerging: () => void;
  setDone: () => void;
  setTtong: () => void;
  reset: () => void;
}

export const useGiriStore = create<GiriState>((set) => ({
  phase: 'split',
  piles: [{ id: 0, cardCount: 20, offsetX: 0 }],
  tapOrder: [],
  isTtong: false,

  initSplit: () =>
    set({
      phase: 'split',
      piles: [{ id: 0, cardCount: 20, offsetX: 0 }],
      tapOrder: [],
      isTtong: false,
    }),

  splitPile: (pileId, splitPoint) =>
    set((state) => {
      const idx = state.piles.findIndex((p) => p.id === pileId);
      if (idx === -1) return state;
      const pile = state.piles[idx];
      if (splitPoint <= 0 || splitPoint >= pile.cardCount) return state;
      const newPiles = [...state.piles];
      const newId = Math.max(...state.piles.map((p) => p.id)) + 1;
      newPiles.splice(
        idx,
        1,
        { id: pile.id, cardCount: splitPoint, offsetX: pile.offsetX - 30 },
        { id: newId, cardCount: pile.cardCount - splitPoint, offsetX: pile.offsetX + 30 },
      );
      return { piles: newPiles };
    }),

  tapPile: (pileId) =>
    set((state) => {
      if (state.tapOrder.includes(pileId)) return state;
      const newOrder = [...state.tapOrder, pileId];
      // 모든 더미가 선택되면 자동으로 tap phase 유지 (합치기 버튼 활성화)
      return { tapOrder: newOrder };
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
      piles: [{ id: 0, cardCount: 20, offsetX: 0 }],
      tapOrder: [],
      isTtong: false,
    }),
}));
