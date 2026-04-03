import type { Card } from '@sutda/shared';

/**
 * 화투 20장 카드 ID → 이미지 파일 1:1 매핑 테이블.
 *
 * ID는 createDeck() 생성 순서와 일치:
 *   1=01-1(광), 2=01-2(일), 3=02-1(일), 4=02-2(일),
 *   5=03-1(광), 6=03-2(일), 7=04-1(열끗), 8=04-2(일),
 *   9=05-1(일), 10=05-2(일), 11=06-1(일), 12=06-2(일),
 *   13=07-1(열끗), 14=07-2(일), 15=08-1(광), 16=08-2(일),
 *   17=09-1(열끗), 18=09-2(일), 19=10-1(일), 20=10-2(일)
 */
const CARD_IMAGE_MAP: Record<number, string> = {
  1:  '/img/01-1.png',
  2:  '/img/01-2.png',
  3:  '/img/02-1.png',
  4:  '/img/02-2.png',
  5:  '/img/03-1.png',
  6:  '/img/03-2.png',
  7:  '/img/04-1.png',
  8:  '/img/04-2.png',
  9:  '/img/05-1.png',
  10: '/img/05-2.png',
  11: '/img/06-1.png',
  12: '/img/06-2.png',
  13: '/img/07-1.png',
  14: '/img/07-2.png',
  15: '/img/08-1.png',
  16: '/img/08-2.png',
  17: '/img/09-1.png',
  18: '/img/09-2.png',
  19: '/img/10-1.png',
  20: '/img/10-2.png',
};

/**
 * Card 객체를 이미지 파일 경로로 변환한다.
 *
 * card.id(1~20)가 있으면 룩업 테이블에서 직접 반환한다.
 * id가 없는 경우(테스트용 카드 등)에는 rank/attribute 기반 fallback을 사용한다.
 */
export function getCardImageSrc(card: Card): string {
  if (card.id != null) {
    return CARD_IMAGE_MAP[card.id] ?? '/img/card_back.jpg';
  }
  // fallback: id 없는 경우 (테스트 카드 등)
  const paddedRank = String(card.rank).padStart(2, '0');
  if (card.attribute !== 'normal') return `/img/${paddedRank}-1.png`;
  const SPECIAL_RANKS = new Set([1, 3, 4, 7, 8, 9]);
  return `/img/${paddedRank}-${SPECIAL_RANKS.has(card.rank) ? 2 : 1}.png`;
}

/**
 * 카드 뒷면 이미지 경로를 반환한다.
 */
export function getCardBackSrc(): string {
  return '/img/card_back.jpg';
}
