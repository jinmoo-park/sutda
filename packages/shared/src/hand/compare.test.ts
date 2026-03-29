import { describe, it, expect } from 'vitest';
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

describe('compareHands', () => {
  describe('일반 비교 (둘 다 isSpecialBeater=false)', () => {
    it('광땡 vs 장땡 → 광땡 승', () => {
      expect(compareHands(
        hand({ handType: 'sam-pal-gwang-ttaeng', score: 1300 }),
        hand({ handType: 'jang-ttaeng', score: 1010 }),
      )).toBe('a');
    });

    it('구땡 vs 팔땡 → 구땡 승', () => {
      expect(compareHands(
        hand({ handType: 'gu-ttaeng', score: 1009 }),
        hand({ handType: 'pal-ttaeng', score: 1008 }),
      )).toBe('a');
    });

    it('알리 vs 독사 → 알리 승 (score 60 > 50)', () => {
      expect(compareHands(
        hand({ handType: 'ali', score: 60 }),
        hand({ handType: 'dok-sa', score: 50 }),
      )).toBe('a');
    });

    it('알리 vs 9끗 → 알리 승 (60 > 9)', () => {
      expect(compareHands(
        hand({ handType: 'ali', score: 60 }),
        hand({ handType: 'kkut', score: 9 }),
      )).toBe('a');
    });

    it('동점: 9끗 vs 9끗 → tie', () => {
      expect(compareHands(
        hand({ handType: 'kkut', score: 9 }),
        hand({ handType: 'kkut', score: 9 }),
      )).toBe('tie');
    });

    it('낮은 score vs 높은 score → b 승', () => {
      expect(compareHands(
        hand({ handType: 'kkut', score: 3 }),
        hand({ handType: 'kkut', score: 7 }),
      )).toBe('b');
    });

    it('망통(0끗) vs 망통(0끗) → tie', () => {
      expect(compareHands(
        hand({ handType: 'kkut', score: 0 }),
        hand({ handType: 'kkut', score: 0 }),
      )).toBe('tie');
    });
  });

  describe('땡잡이 특수 비교 (HAND-08)', () => {
    const ttaengJabi = hand({ handType: 'kkut', score: 0, isSpecialBeater: true });

    it('땡잡이 vs 구땡 → 땡잡이 승', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'gu-ttaeng', score: 1009 }),
      )).toBe('a');
    });

    it('땡잡이 vs 일땡 → 땡잡이 승', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'il-ttaeng', score: 1001 }),
      )).toBe('a');
    });

    it('땡잡이 vs 장땡 → 땡잡이 짐', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'jang-ttaeng', score: 1010 }),
      )).toBe('b');
    });

    it('땡잡이 vs 삼팔광땡 → 땡잡이 짐', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'sam-pal-gwang-ttaeng', score: 1300 }),
      )).toBe('b');
    });

    it('땡잡이 vs 일팔광땡 → 땡잡이 짐', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'il-pal-gwang-ttaeng', score: 1200 }),
      )).toBe('b');
    });

    it('땡잡이 vs 일삼광땡 → 땡잡이 짐', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'il-sam-gwang-ttaeng', score: 1100 }),
      )).toBe('b');
    });

    it('땡잡이 vs 알리(특수조합) → score 비교: 0 < 60 → 땡잡이 짐', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'ali', score: 60 }),
      )).toBe('b');
    });

    it('땡잡이 vs 9끗 → score 비교: 0 < 9 → 땡잡이 짐', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'kkut', score: 9 }),
      )).toBe('b');
    });

    it('땡잡이 vs 망통(0끗) → 동점: 0 === 0 → tie', () => {
      expect(compareHands(
        ttaengJabi,
        hand({ handType: 'kkut', score: 0, isSpecialBeater: false }),
      )).toBe('tie');
    });

    it('땡잡이 vs 땡잡이 → tie', () => {
      const ttaengJabi2 = hand({ handType: 'kkut', score: 0, isSpecialBeater: true });
      expect(compareHands(ttaengJabi, ttaengJabi2)).toBe('tie');
    });

    it('b가 땡잡이 vs a가 구땡 → b 승', () => {
      expect(compareHands(
        hand({ handType: 'gu-ttaeng', score: 1009 }),
        ttaengJabi,
      )).toBe('b');
    });

    it('b가 땡잡이 vs a가 장땡 → a 승', () => {
      expect(compareHands(
        hand({ handType: 'jang-ttaeng', score: 1010 }),
        ttaengJabi,
      )).toBe('a');
    });
  });

  describe('암행어사 특수 비교 (HAND-09)', () => {
    const amhaengEosa = hand({ handType: 'kkut', score: 1, isSpecialBeater: true });

    it('암행어사 vs 삼팔광땡 → 암행어사 짐', () => {
      expect(compareHands(
        amhaengEosa,
        hand({ handType: 'sam-pal-gwang-ttaeng', score: 1300 }),
      )).toBe('b');
    });

    it('암행어사 vs 일팔광땡 → 암행어사 승', () => {
      expect(compareHands(
        amhaengEosa,
        hand({ handType: 'il-pal-gwang-ttaeng', score: 1200 }),
      )).toBe('a');
    });

    it('암행어사 vs 일삼광땡 → 암행어사 승', () => {
      expect(compareHands(
        amhaengEosa,
        hand({ handType: 'il-sam-gwang-ttaeng', score: 1100 }),
      )).toBe('a');
    });

    it('암행어사 vs 장땡 → score 비교: 1 < 1010 → 암행어사 짐', () => {
      expect(compareHands(
        amhaengEosa,
        hand({ handType: 'jang-ttaeng', score: 1010 }),
      )).toBe('b');
    });

    it('암행어사 vs 구땡 → score 비교: 1 < 1009 → 암행어사 짐', () => {
      expect(compareHands(
        amhaengEosa,
        hand({ handType: 'gu-ttaeng', score: 1009 }),
      )).toBe('b');
    });

    it('암행어사 vs 알리 → score 비교: 1 < 60 → 암행어사 짐', () => {
      expect(compareHands(
        amhaengEosa,
        hand({ handType: 'ali', score: 60 }),
      )).toBe('b');
    });

    it('암행어사 vs 1끗 → score 비교: 1 === 1 → tie', () => {
      expect(compareHands(
        amhaengEosa,
        hand({ handType: 'kkut', score: 1, isSpecialBeater: false }),
      )).toBe('tie');
    });

    it('암행어사 vs 암행어사 → tie', () => {
      const amhaengEosa2 = hand({ handType: 'kkut', score: 1, isSpecialBeater: true });
      expect(compareHands(amhaengEosa, amhaengEosa2)).toBe('tie');
    });

    it('암행어사 vs 땡잡이 → score 비교: 1 > 0 → 암행어사 승', () => {
      const ttaengJabi = hand({ handType: 'kkut', score: 0, isSpecialBeater: true });
      expect(compareHands(amhaengEosa, ttaengJabi)).toBe('a');
    });

    it('b가 암행어사 vs a가 일팔광땡 → b 승', () => {
      expect(compareHands(
        hand({ handType: 'il-pal-gwang-ttaeng', score: 1200 }),
        amhaengEosa,
      )).toBe('b');
    });

    it('b가 암행어사 vs a가 삼팔광땡 → a 승', () => {
      expect(compareHands(
        hand({ handType: 'sam-pal-gwang-ttaeng', score: 1300 }),
        amhaengEosa,
      )).toBe('a');
    });
  });
});
