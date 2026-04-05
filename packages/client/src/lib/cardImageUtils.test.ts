import { describe, it, expect } from 'vitest';
import { getCardImageSrc, getCardBackSrc } from './cardImageUtils';

describe('getCardImageSrc — id 기반 룩업', () => {
  it('id=1 (rank=1, gwang) → /img/01-1.png', () => {
    expect(getCardImageSrc({ id: 1, rank: 1, attribute: 'gwang' })).toBe('/img/01-1.png');
  });

  it('id=2 (rank=1, normal) → /img/01-2.png', () => {
    expect(getCardImageSrc({ id: 2, rank: 1, attribute: 'normal' })).toBe('/img/01-2.png');
  });

  it('id=3 (rank=2, normal 첫번째) → /img/02-1.png', () => {
    expect(getCardImageSrc({ id: 3, rank: 2, attribute: 'normal' })).toBe('/img/02-1.png');
  });

  it('id=4 (rank=2, normal 두번째) → /img/02-2.png', () => {
    expect(getCardImageSrc({ id: 4, rank: 2, attribute: 'normal' })).toBe('/img/02-2.png');
  });

  it('id=5 (rank=3, gwang) → /img/03-1.png', () => {
    expect(getCardImageSrc({ id: 5, rank: 3, attribute: 'gwang' })).toBe('/img/03-1.png');
  });

  it('id=7 (rank=4, yeolkkeut) → /img/04-1.png', () => {
    expect(getCardImageSrc({ id: 7, rank: 4, attribute: 'yeolkkeut' })).toBe('/img/04-1.png');
  });

  it('id=8 (rank=4, normal) → /img/04-2.png', () => {
    expect(getCardImageSrc({ id: 8, rank: 4, attribute: 'normal' })).toBe('/img/04-2.png');
  });

  it('id=15 (rank=8, gwang) → /img/08-1.png', () => {
    expect(getCardImageSrc({ id: 15, rank: 8, attribute: 'gwang' })).toBe('/img/08-1.png');
  });

  it('id=17 (rank=9, yeolkkeut) → /img/09-1.png', () => {
    expect(getCardImageSrc({ id: 17, rank: 9, attribute: 'yeolkkeut' })).toBe('/img/09-1.png');
  });

  it('id=19 (rank=10, normal 첫번째) → /img/10-1.png', () => {
    expect(getCardImageSrc({ id: 19, rank: 10, attribute: 'normal' })).toBe('/img/10-1.png');
  });

  it('id=20 (rank=10, normal 두번째) → /img/10-2.png', () => {
    expect(getCardImageSrc({ id: 20, rank: 10, attribute: 'normal' })).toBe('/img/10-2.png');
  });

  it('rank=10인 두 카드가 각각 다른 이미지로 매핑됨 (핵심 버그 재현)', () => {
    // 배열 순서와 무관하게 id로만 이미지 결정됨
    const card19 = getCardImageSrc({ id: 19, rank: 10, attribute: 'normal' });
    const card20 = getCardImageSrc({ id: 20, rank: 10, attribute: 'normal' });
    expect(card19).toBe('/img/10-1.png');
    expect(card20).toBe('/img/10-2.png');
    expect(card19).not.toBe(card20);
  });
});

describe('getCardImageSrc — id 없는 카드 fallback', () => {
  it('id 없이 gwang → rank 기반 -1 이미지 반환', () => {
    expect(getCardImageSrc({ rank: 1, attribute: 'gwang' })).toBe('/img/01-1.png');
  });

  it('id 없이 yeolkkeut → rank 기반 -1 이미지 반환', () => {
    expect(getCardImageSrc({ rank: 4, attribute: 'yeolkkeut' })).toBe('/img/04-1.png');
  });

  it('id 없이 special rank normal → -2 이미지 반환', () => {
    expect(getCardImageSrc({ rank: 1, attribute: 'normal' })).toBe('/img/01-2.png');
  });

  it('id 없이 non-special rank normal → -1 이미지 반환', () => {
    expect(getCardImageSrc({ rank: 10, attribute: 'normal' })).toBe('/img/10-1.png');
  });
});

describe('getCardBackSrc', () => {
  it('returns /img/card_back.jpg', () => {
    expect(getCardBackSrc()).toBe('/img/card_back.jpg');
  });
});
