import { describe, it, expect } from 'vitest';
import { findRoundWinner } from './winner';
import { compareHands } from './compare';
import type { HandResult } from '../types/hand';

/** 기본 플래그가 모두 false인 HandResult 생성 헬퍼 */
function hand(overrides: Partial<HandResult> & Pick<HandResult, 'handType' | 'score'>): HandResult {
  return {
    isSpecialBeater: false,
    isGusa: false,
    isMeongtteongguriGusa: false,
    ...overrides,
  };
}

const ttaengJabi = (): HandResult => hand({ handType: 'kkut', score: 0, isSpecialBeater: true });
const amhaengEosa = (): HandResult => hand({ handType: 'kkut', score: 1, isSpecialBeater: true });
const sampalGwang = (): HandResult => hand({ handType: 'sam-pal-gwang-ttaeng', score: 1300 });
const ilpalGwang = (): HandResult => hand({ handType: 'il-pal-gwang-ttaeng', score: 1200 });
const ilsamGwang = (): HandResult => hand({ handType: 'il-sam-gwang-ttaeng', score: 1100 });
const jangTtaeng = (): HandResult => hand({ handType: 'jang-ttaeng', score: 1010 });
const guTtaeng = (): HandResult => hand({ handType: 'gu-ttaeng', score: 1009 });
const sajangTtaeng = (): HandResult => hand({ handType: 'sa-ttaeng', score: 1004 });
const ilTtaeng = (): HandResult => hand({ handType: 'il-ttaeng', score: 1001 });
const ali = (): HandResult => hand({ handType: 'ali', score: 60 });
const yukKkut = (): HandResult => hand({ handType: 'kkut', score: 6 });
const guKkut = (): HandResult => hand({ handType: 'kkut', score: 9 });
const oKkut = (): HandResult => hand({ handType: 'kkut', score: 5 });
const mangtong = (): HandResult => hand({ handType: 'kkut', score: 0 });

describe('findRoundWinner — 다인전 승자 결정', () => {
  describe('단일/빈 입력', () => {
    it('빈 배열 → winnerIndices=[]', () => {
      expect(findRoundWinner([])).toEqual({ winnerIndices: [] });
    });

    it('1명 → 그 인덱스 승', () => {
      expect(findRoundWinner([yukKkut()])).toEqual({ winnerIndices: [0] });
    });
  });

  describe('3인 땡잡이 사이클 — 핵심 버그 시나리오', () => {
    it('땡잡이 + 4땡 + 6끗 → 땡잡이 승 (핵심 버그)', () => {
      const result = findRoundWinner([ttaengJabi(), sajangTtaeng(), yukKkut()]);
      expect(result.winnerIndices).toEqual([0]);
    });

    it('순서 무관: 4땡 + 6끗 + 땡잡이 → 땡잡이 승', () => {
      const result = findRoundWinner([sajangTtaeng(), yukKkut(), ttaengJabi()]);
      expect(result.winnerIndices).toEqual([2]);
    });

    it('순서 무관: 6끗 + 땡잡이 + 4땡 → 땡잡이 승', () => {
      const result = findRoundWinner([yukKkut(), ttaengJabi(), sajangTtaeng()]);
      expect(result.winnerIndices).toEqual([1]);
    });

    it('땡잡이 + 일땡 + 6끗 → 땡잡이 승', () => {
      const result = findRoundWinner([ttaengJabi(), ilTtaeng(), yukKkut()]);
      expect(result.winnerIndices).toEqual([0]);
    });

    it('땡잡이 + 구땡 + 알리 → 땡잡이 승', () => {
      const result = findRoundWinner([ttaengJabi(), guTtaeng(), ali()]);
      expect(result.winnerIndices).toEqual([0]);
    });
  });

  describe('땡잡이 vs 장땡/광땡', () => {
    it('땡잡이 + 4땡 + 장땡 → 장땡 승 (땡잡이 불발)', () => {
      const result = findRoundWinner([ttaengJabi(), sajangTtaeng(), jangTtaeng()]);
      expect(result.winnerIndices).toEqual([2]);
    });

    it('땡잡이 + 4땡 + 삼팔광땡 → 삼팔광땡 승', () => {
      const result = findRoundWinner([ttaengJabi(), sajangTtaeng(), sampalGwang()]);
      expect(result.winnerIndices).toEqual([2]);
    });

    it('땡잡이 + 일땡 + 일팔광땡 → 일팔광땡 승', () => {
      const result = findRoundWinner([ttaengJabi(), ilTtaeng(), ilpalGwang()]);
      expect(result.winnerIndices).toEqual([2]);
    });
  });

  describe('땡잡이 — 땡 미존재 시 일반 비교 fallback', () => {
    it('땡잡이 + 6끗 (땡 없음) → 6끗 승', () => {
      const result = findRoundWinner([ttaengJabi(), yukKkut()]);
      expect(result.winnerIndices).toEqual([1]);
    });

    it('땡잡이 + 알리 + 6끗 (땡 없음) → 알리 승', () => {
      const result = findRoundWinner([ttaengJabi(), ali(), yukKkut()]);
      expect(result.winnerIndices).toEqual([1]);
    });

    it('땡잡이 + 망통 (모두 score=0) → tie', () => {
      const result = findRoundWinner([ttaengJabi(), mangtong()]);
      expect(result.winnerIndices.sort()).toEqual([0, 1]);
    });

    it('땡잡이 2명 + 일땡 → 두 땡잡이 tie', () => {
      const result = findRoundWinner([ttaengJabi(), ilTtaeng(), ttaengJabi()]);
      expect(result.winnerIndices.sort()).toEqual([0, 2]);
    });
  });

  describe('암행어사 특수 규칙', () => {
    it('암행어사 + 일팔광땡 + 6끗 → 암행어사 승', () => {
      const result = findRoundWinner([amhaengEosa(), ilpalGwang(), yukKkut()]);
      expect(result.winnerIndices).toEqual([0]);
    });

    it('암행어사 + 일삼광땡 + 6끗 → 암행어사 승', () => {
      const result = findRoundWinner([amhaengEosa(), ilsamGwang(), yukKkut()]);
      expect(result.winnerIndices).toEqual([0]);
    });

    it('암행어사 + 삼팔광땡 → 삼팔광땡 승', () => {
      const result = findRoundWinner([amhaengEosa(), sampalGwang()]);
      expect(result.winnerIndices).toEqual([1]);
    });

    it('암행어사 + 일팔광땡 + 삼팔광땡 → 삼팔광땡 승', () => {
      const result = findRoundWinner([amhaengEosa(), ilpalGwang(), sampalGwang()]);
      expect(result.winnerIndices).toEqual([2]);
    });

    it('암행어사 + 장땡 (광땡 없음) → 장땡 승', () => {
      const result = findRoundWinner([amhaengEosa(), jangTtaeng()]);
      expect(result.winnerIndices).toEqual([1]);
    });

    it('암행어사 + 6끗 → 6끗 승 (1 < 6)', () => {
      const result = findRoundWinner([amhaengEosa(), yukKkut()]);
      expect(result.winnerIndices).toEqual([1]);
    });

    it('암행어사 2명 + 일팔광땡 → 두 암행어사 tie', () => {
      const result = findRoundWinner([amhaengEosa(), ilpalGwang(), amhaengEosa()]);
      expect(result.winnerIndices.sort()).toEqual([0, 2]);
    });
  });

  describe('일반 비교', () => {
    it('장땡 vs 구땡 → 장땡 승', () => {
      const result = findRoundWinner([guTtaeng(), jangTtaeng()]);
      expect(result.winnerIndices).toEqual([1]);
    });

    it('장땡 + 구땡 + 알리 → 장땡 승', () => {
      const result = findRoundWinner([guTtaeng(), alaiHelper(), jangTtaeng()]);
      expect(result.winnerIndices).toEqual([2]);
    });

    it('알리 vs 6끗 vs 9끗 → 알리 승', () => {
      const result = findRoundWinner([ali(), yukKkut(), guKkut()]);
      expect(result.winnerIndices).toEqual([0]);
    });

    it('6끗 vs 6끗 → tie', () => {
      const result = findRoundWinner([yukKkut(), yukKkut()]);
      expect(result.winnerIndices.sort()).toEqual([0, 1]);
    });

    it('일땡 + 일땡 + 5끗 → 두 일땡 tie', () => {
      const result = findRoundWinner([ilTtaeng(), ilTtaeng(), oKkut()]);
      expect(result.winnerIndices.sort()).toEqual([0, 1]);
    });

    it('망통 + 망통 + 망통 → 3명 tie', () => {
      const result = findRoundWinner([mangtong(), mangtong(), mangtong()]);
      expect(result.winnerIndices.sort()).toEqual([0, 1, 2]);
    });
  });

  describe('compareHands와의 일관성 (2인 매트릭스 검증)', () => {
    const matrix: Array<[string, () => HandResult]> = [
      ['삼팔광땡', sampalGwang],
      ['일팔광땡', ilpalGwang],
      ['일삼광땡', ilsamGwang],
      ['장땡', jangTtaeng],
      ['구땡', guTtaeng],
      ['4땡', sajangTtaeng],
      ['일땡', ilTtaeng],
      ['알리', ali],
      ['6끗', yukKkut],
      ['9끗', guKkut],
      ['망통', mangtong],
      ['땡잡이', ttaengJabi],
      ['암행어사', amhaengEosa],
    ];

    for (const [aName, aFn] of matrix) {
      for (const [bName, bFn] of matrix) {
        it(`${aName} vs ${bName}: findRoundWinner ↔ compareHands 일치`, () => {
          const a = aFn();
          const b = bFn();
          const cmp = compareHands(a, b);
          const { winnerIndices } = findRoundWinner([a, b]);
          if (cmp === 'a') {
            expect(winnerIndices).toEqual([0]);
          } else if (cmp === 'b') {
            expect(winnerIndices).toEqual([1]);
          } else {
            expect(winnerIndices.slice().sort()).toEqual([0, 1]);
          }
        });
      }
    }
  });
});

// 가독성 helper (위에서 ali와 별개로 사용)
function alaiHelper(): HandResult {
  return hand({ handType: 'ali', score: 60 });
}
