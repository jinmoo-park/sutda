import type { Card, CardRank } from './types/card.js';
import { GWANG_RANKS, YEOLKKEUT_RANKS } from './types/card.js';

/**
 * 20장의 섯다 덱을 생성한다.
 * 1~10 각 2장. 각 숫자마다:
 * - 1,3,8: 1장은 광, 1장은 일반
 * - 4,7,9: 1장은 열끗, 1장은 일반
 * - 2,5,6,10: 2장 모두 일반
 *
 * 반환되는 덱은 정렬된 상태 (셔플 안 됨). 셔플은 별도 함수에서 처리.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (let r = 1; r <= 10; r++) {
    const rank = r as CardRank;
    const isGwang = (GWANG_RANKS as readonly number[]).includes(rank);
    const isYeolkkeut = (YEOLKKEUT_RANKS as readonly number[]).includes(rank);

    if (isGwang) {
      deck.push({ rank, attribute: 'gwang' });
      deck.push({ rank, attribute: 'normal' });
    } else if (isYeolkkeut) {
      deck.push({ rank, attribute: 'yeolkkeut' });
      deck.push({ rank, attribute: 'normal' });
    } else {
      deck.push({ rank, attribute: 'normal' });
      deck.push({ rank, attribute: 'normal' });
    }
  }

  return deck;
}
