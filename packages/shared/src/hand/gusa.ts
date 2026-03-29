import type { HandResult } from '../types/hand';

/**
 * 구사 패가 재경기 조건을 충족하는지 판단한다.
 *
 * - 일반 구사: 생존자 중 최고 score가 알리(60) 이하일 때 재경기
 * - 멍텅구리구사: 생존자 중 최고 score가 팔땡(1008) 이하일 때 재경기
 *
 * @param gusaHand - 구사 패의 HandResult
 * @param allSurvivingHands - 구사 패 포함 모든 생존자 패 배열
 */
export function checkGusaTrigger(
  gusaHand: HandResult,
  allSurvivingHands: HandResult[],
): { shouldRedeal: boolean } {
  if (!gusaHand.isGusa && !gusaHand.isMeongtteongguriGusa) {
    return { shouldRedeal: false };
  }

  if (allSurvivingHands.length === 0) {
    return { shouldRedeal: false };
  }

  const maxScore = Math.max(...allSurvivingHands.map((h) => h.score));

  if (gusaHand.isGusa) {
    return { shouldRedeal: maxScore <= 60 };
  }

  if (gusaHand.isMeongtteongguriGusa) {
    return { shouldRedeal: maxScore <= 1008 };
  }

  return { shouldRedeal: false };
}
