import { describe, it, expect } from 'vitest';
import { checkGusaTrigger } from './gusa';
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

describe('checkGusaTrigger', () => {
  const gusaHand = hand({
    handType: 'kkut', score: 3,
    isGusa: true,
  });

  const mengtHand = hand({
    handType: 'kkut', score: 3,
    isMeongtteongguriGusa: true,
  });

  describe('일반 구사 (isGusa=true)', () => {
    it('최고패가 알리(60) → 재경기', () => {
      expect(checkGusaTrigger(gusaHand, [
        gusaHand,
        hand({ handType: 'ali', score: 60 }),
      ])).toEqual({ shouldRedeal: true });
    });

    it('최고패가 독사(50) → 재경기', () => {
      expect(checkGusaTrigger(gusaHand, [
        gusaHand,
        hand({ handType: 'dok-sa', score: 50 }),
      ])).toEqual({ shouldRedeal: true });
    });

    it('최고패가 일땡(1001) → 재경기 안 함', () => {
      expect(checkGusaTrigger(gusaHand, [
        gusaHand,
        hand({ handType: 'il-ttaeng', score: 1001 }),
      ])).toEqual({ shouldRedeal: false });
    });

    it('자기 자신만 있을 때 (score=3 <= 60) → 재경기', () => {
      expect(checkGusaTrigger(gusaHand, [gusaHand]))
        .toEqual({ shouldRedeal: true });
    });

    it('최고패가 새륙(10) → 재경기', () => {
      expect(checkGusaTrigger(gusaHand, [
        gusaHand,
        hand({ handType: 'sae-ryuk', score: 10 }),
      ])).toEqual({ shouldRedeal: true });
    });

    it('최고패가 장삥(30) → 재경기', () => {
      expect(checkGusaTrigger(gusaHand, [
        gusaHand,
        hand({ handType: 'jang-bbing', score: 30 }),
      ])).toEqual({ shouldRedeal: true });
    });
  });

  describe('멍텅구리구사 (isMeongtteongguriGusa=true)', () => {
    it('최고패가 팔땡(1008) → 재경기', () => {
      expect(checkGusaTrigger(mengtHand, [
        mengtHand,
        hand({ handType: 'pal-ttaeng', score: 1008 }),
      ])).toEqual({ shouldRedeal: true });
    });

    it('최고패가 구땡(1009) → 재경기 안 함', () => {
      expect(checkGusaTrigger(mengtHand, [
        mengtHand,
        hand({ handType: 'gu-ttaeng', score: 1009 }),
      ])).toEqual({ shouldRedeal: false });
    });

    it('최고패가 장땡(1010) → 재경기 안 함', () => {
      expect(checkGusaTrigger(mengtHand, [
        mengtHand,
        hand({ handType: 'jang-ttaeng', score: 1010 }),
      ])).toEqual({ shouldRedeal: false });
    });

    it('최고패가 칠땡(1007) → 재경기', () => {
      expect(checkGusaTrigger(mengtHand, [
        mengtHand,
        hand({ handType: 'chil-ttaeng', score: 1007 }),
      ])).toEqual({ shouldRedeal: true });
    });

    it('최고패가 알리(60) → 재경기', () => {
      expect(checkGusaTrigger(mengtHand, [
        mengtHand,
        hand({ handType: 'ali', score: 60 }),
      ])).toEqual({ shouldRedeal: true });
    });
  });

  describe('예외 처리', () => {
    it('구사가 아닌 패 → shouldRedeal: false', () => {
      expect(checkGusaTrigger(
        hand({ handType: 'ali', score: 60 }),
        [hand({ handType: 'kkut', score: 3 })],
      )).toEqual({ shouldRedeal: false });
    });

    it('빈 배열 → shouldRedeal: false', () => {
      expect(checkGusaTrigger(gusaHand, []))
        .toEqual({ shouldRedeal: false });
    });

    it('빈 배열 + 멍텅구리구사 → shouldRedeal: false', () => {
      expect(checkGusaTrigger(mengtHand, []))
        .toEqual({ shouldRedeal: false });
    });
  });
});
