import type { HandResult } from '../types/hand';

/** 땡잡이 판별: isSpecialBeater=true, score=0 */
function isTtaengJabi(h: HandResult): boolean {
  return h.isSpecialBeater && h.score === 0;
}

/** 암행어사 판별: isSpecialBeater=true, score=1 */
function isAmhaengEosa(h: HandResult): boolean {
  return h.isSpecialBeater && h.score === 1;
}

/** 단순 score 비교 */
function scoreCompare(a: HandResult, b: HandResult): 'a' | 'b' | 'tie' {
  if (a.score > b.score) return 'a';
  if (a.score < b.score) return 'b';
  return 'tie';
}

/**
 * 두 HandResult를 비교해 승자를 판정한다.
 * 땡잡이/암행어사 특수 규칙을 우선 적용하고, 동점이면 'tie'를 반환한다.
 */
export function compareHands(a: HandResult, b: HandResult): 'a' | 'b' | 'tie' {
  const aIsTJ = isTtaengJabi(a);
  const bIsTJ = isTtaengJabi(b);
  const aIsAE = isAmhaengEosa(a);
  const bIsAE = isAmhaengEosa(b);

  // 땡잡이 특수 처리
  if (aIsTJ && !bIsTJ) {
    if (b.score >= 1010) return 'b';     // 장땡/광땡에게 짐
    if (b.score >= 1001) return 'a';     // 구땡~일땡에게 이김
    return scoreCompare(a, b);            // 특수조합/끗 → 망통(0)으로 비교
  }

  if (bIsTJ && !aIsTJ) {
    if (a.score >= 1010) return 'a';     // 장땡/광땡에게 짐
    if (a.score >= 1001) return 'b';     // 구땡~일땡에게 이김
    return scoreCompare(a, b);
  }

  // 암행어사 특수 처리
  if (aIsAE && !bIsAE) {
    if (b.score === 1300) return 'b';                    // 삼팔광땡에게 짐
    if (b.score === 1200 || b.score === 1100) return 'a'; // 일팔/일삼광땡에게 이김
    return scoreCompare(a, b);                            // 나머지 → 1끗으로 비교
  }

  if (bIsAE && !aIsAE) {
    if (a.score === 1300) return 'a';
    if (a.score === 1200 || a.score === 1100) return 'b';
    return scoreCompare(a, b);
  }

  // 둘 다 특수패이거나 둘 다 일반패 → score 비교
  return scoreCompare(a, b);
}
