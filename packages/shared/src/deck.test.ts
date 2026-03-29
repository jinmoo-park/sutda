import { describe, it, expect } from 'vitest';
import { createDeck } from './deck';
import type { Card } from './types/card';

describe('createDeck', () => {
  const deck = createDeck();

  it('정확히 20장의 카드를 반환한다', () => {
    expect(deck).toHaveLength(20);
  });

  it('각 숫자(1~10)가 정확히 2장씩 존재한다', () => {
    for (let rank = 1; rank <= 10; rank++) {
      const count = deck.filter(c => c.rank === rank).length;
      expect(count, `rank ${rank}는 2장이어야 함`).toBe(2);
    }
  });

  it('광 카드가 정확히 3장이다 (1광, 3광, 8광)', () => {
    const gwangCards = deck.filter(c => c.attribute === 'gwang');
    expect(gwangCards).toHaveLength(3);
    const gwangRanks = gwangCards.map(c => c.rank).sort((a, b) => a - b);
    expect(gwangRanks).toEqual([1, 3, 8]);
  });

  it('열끗 카드가 정확히 3장이다 (4열끗, 7열끗, 9열끗)', () => {
    const yeolkkeut = deck.filter(c => c.attribute === 'yeolkkeut');
    expect(yeolkkeut).toHaveLength(3);
    const ranks = yeolkkeut.map(c => c.rank).sort((a, b) => a - b);
    expect(ranks).toEqual([4, 7, 9]);
  });

  it('일반 카드가 정확히 14장이다', () => {
    const normal = deck.filter(c => c.attribute === 'normal');
    expect(normal).toHaveLength(14);
  });

  it('2, 5, 6, 10 숫자의 카드는 모두 normal 속성이다', () => {
    const pureNormalRanks = [2, 5, 6, 10];
    for (const rank of pureNormalRanks) {
      const cards = deck.filter(c => c.rank === rank);
      expect(cards.every(c => c.attribute === 'normal'),
        `rank ${rank}의 모든 카드는 normal이어야 함`
      ).toBe(true);
    }
  });
});
