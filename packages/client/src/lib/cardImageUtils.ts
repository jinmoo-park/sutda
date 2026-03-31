import type { Card } from '@sutda/shared';

/**
 * 특수 속성(gwang/yeolkkeut) 카드가 존재하는 rank 목록.
 * 이 rank의 normal 카드는 항상 fileIndex=2 (특수카드가 1번 파일)
 */
const SPECIAL_RANKS = new Set([1, 3, 4, 7, 8, 9]);

/**
 * Card 객체를 이미지 파일 경로로 매핑한다.
 *
 * 파일명 규칙: `/img/{rank 2자리}-{fileIndex}.png`
 * - 특수 속성(gwang/yeolkkeut): fileIndex=1
 * - normal 속성이고 rank에 특수 카드가 있으면: fileIndex=2
 * - 양쪽 모두 normal인 rank(2,5,6,10): slotIndex로 구분 (0→1, 1→2)
 *
 * @param card 카드 객체
 * @param slotIndex 같은 rank normal 2장 구분용 (0 또는 1, 기본값 0)
 */
export function getCardImageSrc(card: Card, slotIndex: number = 0): string {
  const paddedRank = String(card.rank).padStart(2, '0');
  let fileIndex: number;

  if (card.attribute !== 'normal') {
    // gwang, yeolkkeut → 항상 -1
    fileIndex = 1;
  } else if (SPECIAL_RANKS.has(card.rank)) {
    // 이 rank의 normal 카드는 항상 -2 (특수 카드가 -1 파일)
    fileIndex = 2;
  } else {
    // 모두 normal인 rank (2, 5, 6, 10) → slotIndex로 구분
    fileIndex = slotIndex === 1 ? 2 : 1;
  }

  return `/img/${paddedRank}-${fileIndex}.png`;
}

/**
 * 카드 뒷면 이미지 경로를 반환한다.
 */
export function getCardBackSrc(): string {
  return '/img/card_back.jpg';
}

/**
 * 카드 배열에서 각 카드의 slotIndex를 계산한다.
 * 같은 rank 카드가 여러 장 있을 때 앞에서부터 0, 1을 부여한다.
 * (rank 2/5/6/10의 normal 카드처럼 양쪽 모두 normal인 경우에만 slotIndex가 이미지 선택에 영향을 줌)
 */
export function computeSlotIndices(cards: (Card | null | undefined)[]): number[] {
  const counts: Record<number, number> = {};
  return cards.map((card) => {
    if (!card) return 0;
    const rank = card.rank;
    const idx = counts[rank] ?? 0;
    counts[rank] = idx + 1;
    return idx;
  });
}
