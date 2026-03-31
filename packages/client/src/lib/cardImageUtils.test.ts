import { describe, it, expect } from 'vitest';
import { getCardImageSrc, getCardBackSrc } from './cardImageUtils';

describe('getCardImageSrc', () => {
  it('rank=1, gwang → /img/01-1.png', () => {
    expect(getCardImageSrc({ rank: 1, attribute: 'gwang' })).toBe('/img/01-1.png');
  });

  it('rank=1, normal → /img/01-2.png', () => {
    expect(getCardImageSrc({ rank: 1, attribute: 'normal' })).toBe('/img/01-2.png');
  });

  it('rank=10, normal (first) → /img/10-1.png', () => {
    expect(getCardImageSrc({ rank: 10, attribute: 'normal' })).toBe('/img/10-1.png');
  });

  it('rank=10, yeolkkeut → /img/10-2.png', () => {
    // rank 10은 normal만 있으나, slotIndex=1이면 10-2
    expect(getCardImageSrc({ rank: 10, attribute: 'normal' }, 1)).toBe('/img/10-2.png');
  });

  it('rank=3, gwang → /img/03-1.png', () => {
    expect(getCardImageSrc({ rank: 3, attribute: 'gwang' })).toBe('/img/03-1.png');
  });

  it('rank=4, yeolkkeut → /img/04-1.png', () => {
    expect(getCardImageSrc({ rank: 4, attribute: 'yeolkkeut' })).toBe('/img/04-1.png');
  });

  it('rank=4, normal → /img/04-2.png', () => {
    expect(getCardImageSrc({ rank: 4, attribute: 'normal' })).toBe('/img/04-2.png');
  });

  it('rank=8, gwang → /img/08-1.png', () => {
    expect(getCardImageSrc({ rank: 8, attribute: 'gwang' })).toBe('/img/08-1.png');
  });

  it('rank=8, normal → /img/08-2.png', () => {
    expect(getCardImageSrc({ rank: 8, attribute: 'normal' })).toBe('/img/08-2.png');
  });

  it('rank=2, normal (first slot) → /img/02-1.png', () => {
    expect(getCardImageSrc({ rank: 2, attribute: 'normal' }, 0)).toBe('/img/02-1.png');
  });

  it('rank=2, normal (second slot) → /img/02-2.png', () => {
    expect(getCardImageSrc({ rank: 2, attribute: 'normal' }, 1)).toBe('/img/02-2.png');
  });

  it('rank=5, normal default → /img/05-1.png', () => {
    expect(getCardImageSrc({ rank: 5, attribute: 'normal' })).toBe('/img/05-1.png');
  });

  it('rank=6, normal default → /img/06-1.png', () => {
    expect(getCardImageSrc({ rank: 6, attribute: 'normal' })).toBe('/img/06-1.png');
  });
});

describe('getCardBackSrc', () => {
  it('returns /img/card_back.jpg', () => {
    expect(getCardBackSrc()).toBe('/img/card_back.jpg');
  });
});
