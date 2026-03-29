import type { Card, CardRank } from '../types/card';
import type { HandResult, HandType } from '../types/hand';

/** 기본 플래그가 모두 false인 HandResult 생성 헬퍼 */
function makeResult(handType: HandType, score: number, overrides?: Partial<HandResult>): HandResult {
  return {
    handType,
    score,
    isSpecialBeater: false,
    isGusa: false,
    isMeongtteongguriGusa: false,
    ...overrides,
  };
}

/** rank별 땡 HandType 매핑 */
const TTAENG_MAP: Record<number, HandType> = {
  10: 'jang-ttaeng',
  9: 'gu-ttaeng',
  8: 'pal-ttaeng',
  7: 'chil-ttaeng',
  6: 'yuk-ttaeng',
  5: 'o-ttaeng',
  4: 'sa-ttaeng',
  3: 'sam-ttaeng',
  2: 'i-ttaeng',
  1: 'il-ttaeng',
};

/**
 * 두 장의 카드로 족보를 판정한다.
 *
 * 판정 우선순위: 광땡 → 땡 → 특수패(암행어사/땡잡이/구사) → 특수조합 → 끗
 */
export function evaluateHand(card1: Card, card2: Card): HandResult {
  // rank를 정렬하여 조합 비교를 단순화
  const ranks = [card1.rank, card2.rank].sort((a, b) => a - b) as [CardRank, CardRank];
  const [low, high] = ranks;

  // 1. 광땡: 두 카드 모두 gwang
  if (card1.attribute === 'gwang' && card2.attribute === 'gwang') {
    if (low === 3 && high === 8) return makeResult('sam-pal-gwang-ttaeng', 1300);
    if (low === 1 && high === 8) return makeResult('il-pal-gwang-ttaeng', 1200);
    if (low === 1 && high === 3) return makeResult('il-sam-gwang-ttaeng', 1100);
  }

  // 2. 땡: 두 카드의 rank가 동일
  if (card1.rank === card2.rank) {
    const rank = card1.rank;
    return makeResult(TTAENG_MAP[rank], 1000 + rank);
  }

  // 3. 특수패 (속성 조건이 엄격함)
  // 암행어사: [4,7] 둘 다 yeolkkeut
  if (low === 4 && high === 7 &&
      card1.attribute === 'yeolkkeut' && card2.attribute === 'yeolkkeut') {
    return makeResult('kkut', 1, { isSpecialBeater: true });
  }

  // 땡잡이: [3,7] 둘 다 normal
  if (low === 3 && high === 7 &&
      card1.attribute === 'normal' && card2.attribute === 'normal') {
    return makeResult('kkut', 0, { isSpecialBeater: true });
  }

  // 멍텅구리구사: [4,9] 둘 다 yeolkkeut
  if (low === 4 && high === 9 &&
      card1.attribute === 'yeolkkeut' && card2.attribute === 'yeolkkeut') {
    return makeResult('kkut', (low + high) % 10, { isMeongtteongguriGusa: true });
  }

  // 일반구사: [4,9] 둘 다 normal
  if (low === 4 && high === 9 &&
      card1.attribute === 'normal' && card2.attribute === 'normal') {
    return makeResult('kkut', (low + high) % 10, { isGusa: true });
  }

  // 4. 특수 조합 (rank 조합 기준, 속성 무관)
  if (low === 1 && high === 2) return makeResult('ali', 60);
  if (low === 1 && high === 4) return makeResult('dok-sa', 50);
  if (low === 1 && high === 9) return makeResult('gu-bbing', 40);
  if (low === 1 && high === 10) return makeResult('jang-bbing', 30);
  if (low === 4 && high === 10) return makeResult('jang-sa', 20);
  if (low === 4 && high === 6) return makeResult('sae-ryuk', 10);

  // 5. 끗: (rank1 + rank2) % 10
  const kkutScore = (card1.rank + card2.rank) % 10;
  return makeResult('kkut', kkutScore);
}
