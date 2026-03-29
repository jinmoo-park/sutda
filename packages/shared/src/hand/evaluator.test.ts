import { describe, it, expect } from 'vitest';
import { evaluateHand } from './evaluator';
import type { Card } from '../types/card';
import type { HandResult } from '../types/hand';

/** 기본 플래그가 모두 false인 결과 헬퍼 */
function result(handType: HandResult['handType'], score: number, overrides?: Partial<HandResult>): HandResult {
  return {
    handType,
    score,
    isSpecialBeater: false,
    isGusa: false,
    isMeongtteongguriGusa: false,
    ...overrides,
  };
}

/** 카드 생성 헬퍼 */
function card(rank: Card['rank'], attribute: Card['attribute']): Card {
  return { rank, attribute };
}

describe('evaluateHand', () => {
  // ===== 광땡 =====
  describe('광땡', () => {
    it('삼팔광땡: 3광 + 8광', () => {
      expect(evaluateHand(card(3, 'gwang'), card(8, 'gwang')))
        .toEqual(result('sam-pal-gwang-ttaeng', 1300));
    });

    it('삼팔광땡: 순서 반대 (8광 + 3광)', () => {
      expect(evaluateHand(card(8, 'gwang'), card(3, 'gwang')))
        .toEqual(result('sam-pal-gwang-ttaeng', 1300));
    });

    it('일팔광땡: 1광 + 8광', () => {
      expect(evaluateHand(card(1, 'gwang'), card(8, 'gwang')))
        .toEqual(result('il-pal-gwang-ttaeng', 1200));
    });

    it('일팔광땡: 순서 반대 (8광 + 1광)', () => {
      expect(evaluateHand(card(8, 'gwang'), card(1, 'gwang')))
        .toEqual(result('il-pal-gwang-ttaeng', 1200));
    });

    it('일삼광땡: 1광 + 3광', () => {
      expect(evaluateHand(card(1, 'gwang'), card(3, 'gwang')))
        .toEqual(result('il-sam-gwang-ttaeng', 1100));
    });
  });

  // ===== 땡 =====
  describe('땡', () => {
    it('장땡: 10 + 10', () => {
      expect(evaluateHand(card(10, 'normal'), card(10, 'normal')))
        .toEqual(result('jang-ttaeng', 1010));
    });

    it('구땡: 9열끗 + 9normal (속성 무관)', () => {
      expect(evaluateHand(card(9, 'yeolkkeut'), card(9, 'normal')))
        .toEqual(result('gu-ttaeng', 1009));
    });

    it('팔땡: 8광 + 8normal', () => {
      expect(evaluateHand(card(8, 'gwang'), card(8, 'normal')))
        .toEqual(result('pal-ttaeng', 1008));
    });

    it('칠땡: 7 + 7', () => {
      expect(evaluateHand(card(7, 'yeolkkeut'), card(7, 'normal')))
        .toEqual(result('chil-ttaeng', 1007));
    });

    it('육땡: 6 + 6', () => {
      expect(evaluateHand(card(6, 'normal'), card(6, 'normal')))
        .toEqual(result('yuk-ttaeng', 1006));
    });

    it('오땡: 5 + 5', () => {
      expect(evaluateHand(card(5, 'normal'), card(5, 'normal')))
        .toEqual(result('o-ttaeng', 1005));
    });

    it('사땡: 4 + 4', () => {
      expect(evaluateHand(card(4, 'yeolkkeut'), card(4, 'normal')))
        .toEqual(result('sa-ttaeng', 1004));
    });

    it('삼땡: 3 + 3', () => {
      expect(evaluateHand(card(3, 'gwang'), card(3, 'normal')))
        .toEqual(result('sam-ttaeng', 1003));
    });

    it('이땡: 2 + 2', () => {
      expect(evaluateHand(card(2, 'normal'), card(2, 'normal')))
        .toEqual(result('i-ttaeng', 1002));
    });

    it('일땡: 1광 + 1normal', () => {
      expect(evaluateHand(card(1, 'gwang'), card(1, 'normal')))
        .toEqual(result('il-ttaeng', 1001));
    });
  });

  // ===== 특수패 (땡잡이, 암행어사, 구사) =====
  describe('특수패', () => {
    it('땡잡이: 3normal + 7normal', () => {
      expect(evaluateHand(card(3, 'normal'), card(7, 'normal')))
        .toEqual(result('kkut', 0, { isSpecialBeater: true }));
    });

    it('땡잡이 아님: 3광 + 7normal -> 끗 (0끗)', () => {
      expect(evaluateHand(card(3, 'gwang'), card(7, 'normal')))
        .toEqual(result('kkut', 0));
    });

    it('땡잡이 아님: 3normal + 7열끗 -> 끗 (0끗)', () => {
      expect(evaluateHand(card(3, 'normal'), card(7, 'yeolkkeut')))
        .toEqual(result('kkut', 0));
    });

    it('암행어사: 4열끗 + 7열끗', () => {
      expect(evaluateHand(card(4, 'yeolkkeut'), card(7, 'yeolkkeut')))
        .toEqual(result('kkut', 1, { isSpecialBeater: true }));
    });

    it('암행어사 아님: 4열끗 + 7normal -> 끗 (1끗)', () => {
      expect(evaluateHand(card(4, 'yeolkkeut'), card(7, 'normal')))
        .toEqual(result('kkut', 1));
    });

    it('암행어사 아님: 4normal + 7열끗 -> 끗 (1끗)', () => {
      expect(evaluateHand(card(4, 'normal'), card(7, 'yeolkkeut')))
        .toEqual(result('kkut', 1));
    });

    it('일반 구사: 4normal + 9normal', () => {
      expect(evaluateHand(card(4, 'normal'), card(9, 'normal')))
        .toEqual(result('kkut', 3, { isGusa: true }));
    });

    it('멍텅구리 구사: 4열끗 + 9열끗', () => {
      expect(evaluateHand(card(4, 'yeolkkeut'), card(9, 'yeolkkeut')))
        .toEqual(result('kkut', 3, { isMeongtteongguriGusa: true }));
    });

    it('구사 아님: 4열끗 + 9normal (속성 혼합) -> 끗 3끗', () => {
      expect(evaluateHand(card(4, 'yeolkkeut'), card(9, 'normal')))
        .toEqual(result('kkut', 3));
    });

    it('구사 아님: 4normal + 9열끗 (속성 혼합) -> 끗 3끗', () => {
      expect(evaluateHand(card(4, 'normal'), card(9, 'yeolkkeut')))
        .toEqual(result('kkut', 3));
    });
  });

  // ===== 특수 조합 (알리~새륙) =====
  describe('특수 조합', () => {
    it('알리: 1광 + 2normal', () => {
      expect(evaluateHand(card(1, 'gwang'), card(2, 'normal')))
        .toEqual(result('ali', 60));
    });

    it('알리: 1normal + 2normal (속성 무관)', () => {
      expect(evaluateHand(card(1, 'normal'), card(2, 'normal')))
        .toEqual(result('ali', 60));
    });

    it('독사: 1normal + 4normal', () => {
      expect(evaluateHand(card(1, 'normal'), card(4, 'normal')))
        .toEqual(result('dok-sa', 50));
    });

    it('독사: 1광 + 4열끗 (속성 무관)', () => {
      expect(evaluateHand(card(1, 'gwang'), card(4, 'yeolkkeut')))
        .toEqual(result('dok-sa', 50));
    });

    it('구삥: 9normal + 1광', () => {
      expect(evaluateHand(card(9, 'normal'), card(1, 'gwang')))
        .toEqual(result('gu-bbing', 40));
    });

    it('구삥: 1normal + 9열끗', () => {
      expect(evaluateHand(card(1, 'normal'), card(9, 'yeolkkeut')))
        .toEqual(result('gu-bbing', 40));
    });

    it('장삥: 10normal + 1광', () => {
      expect(evaluateHand(card(10, 'normal'), card(1, 'gwang')))
        .toEqual(result('jang-bbing', 30));
    });

    it('장삥: 1normal + 10normal', () => {
      expect(evaluateHand(card(1, 'normal'), card(10, 'normal')))
        .toEqual(result('jang-bbing', 30));
    });

    it('장사: 10normal + 4normal', () => {
      expect(evaluateHand(card(10, 'normal'), card(4, 'normal')))
        .toEqual(result('jang-sa', 20));
    });

    it('장사: 4열끗 + 10normal (속성 무관)', () => {
      expect(evaluateHand(card(4, 'yeolkkeut'), card(10, 'normal')))
        .toEqual(result('jang-sa', 20));
    });

    it('새륙: 4normal + 6normal', () => {
      expect(evaluateHand(card(4, 'normal'), card(6, 'normal')))
        .toEqual(result('sae-ryuk', 10));
    });

    it('새륙: 6normal + 4열끗 (속성 무관)', () => {
      expect(evaluateHand(card(6, 'normal'), card(4, 'yeolkkeut')))
        .toEqual(result('sae-ryuk', 10));
    });
  });

  // ===== 끗 =====
  describe('끗', () => {
    it('망통 (0끗): 2normal + 8광', () => {
      expect(evaluateHand(card(2, 'normal'), card(8, 'gwang')))
        .toEqual(result('kkut', 0));
    });

    it('1끗: 3normal + 8normal', () => {
      expect(evaluateHand(card(3, 'normal'), card(8, 'normal')))
        .toEqual(result('kkut', 1));
    });

    it('2끗: 6normal + 6normal은 육땡이므로 별도', () => {
      // 6+6 = 12 -> 2끗이지만 rank 같으므로 땡
      expect(evaluateHand(card(6, 'normal'), card(6, 'normal')))
        .toEqual(result('yuk-ttaeng', 1006));
    });

    it('3끗: 5normal + 8normal', () => {
      expect(evaluateHand(card(5, 'normal'), card(8, 'normal')))
        .toEqual(result('kkut', 3));
    });

    it('9끗: 5normal + 4normal -> 새륙 아님 (5+4≠[4,6])', () => {
      expect(evaluateHand(card(5, 'normal'), card(4, 'normal')))
        .toEqual(result('kkut', 9));
    });

    it('9끗: 6normal + 3normal', () => {
      expect(evaluateHand(card(6, 'normal'), card(3, 'normal')))
        .toEqual(result('kkut', 9));
    });

    it('카드 순서 무관: (3,6) == (6,3)', () => {
      const r1 = evaluateHand(card(3, 'normal'), card(6, 'normal'));
      const r2 = evaluateHand(card(6, 'normal'), card(3, 'normal'));
      expect(r1).toEqual(r2);
    });

    it('7끗: 8normal + 9normal', () => {
      expect(evaluateHand(card(8, 'normal'), card(9, 'normal')))
        .toEqual(result('kkut', 7));
    });

    it('망통: 5normal + 5normal은 오땡', () => {
      expect(evaluateHand(card(5, 'normal'), card(5, 'normal')))
        .toEqual(result('o-ttaeng', 1005));
    });
  });
});
