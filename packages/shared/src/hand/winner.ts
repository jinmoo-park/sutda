import type { HandResult } from '../types/hand.js';

/**
 * 다인전(multi-player) 승자 결정 함수.
 *
 * `compareHands`는 1대1 pairwise 비교로 설계되어 있어 땡잡이가 등장하는 3인 이상
 * 라운드에서 비-전이성(non-transitivity) 사이클이 발생할 수 있다.
 *
 * 예: 땡잡이(0) > 4땡(1004) > 6끗(6) > 땡잡이(0) — 이 경우 reduce 패턴은
 * 시작 인덱스 순서에 따라 결과가 달라진다. 본 함수는 명시적 우선순위 규칙으로
 * 라운드 컨텍스트(어떤 패들이 함께 등장했는가)를 인식해 정확한 승자를 산출한다.
 *
 * 우선순위:
 *  1. 광땡 (score >= 1100). 단 일팔/일삼광땡뿐이고 암행어사가 함께 있으면 암행어사가 잡음.
 *     삼팔광땡(1300)이 함께 있으면 삼팔광땡 우선.
 *  2. 장땡 (score === 1010).
 *  3. 땡잡이 (isSpecialBeater && score === 0) + 일~구땡(1001~1009)이 라운드에 있으면 → 땡잡이 승.
 *  4. 일반 점수 비교 (score 최대값).
 *  5. 동점이면 winnerIndices 길이 ≥ 2.
 *
 * `compareHands`(2인 입력)와 결과가 항상 일치하도록 설계됐으며, 단위 테스트로
 * 전수 매트릭스를 검증한다.
 */
export function findRoundWinner(hands: HandResult[]): { winnerIndices: number[] } {
  if (hands.length === 0) return { winnerIndices: [] };
  if (hands.length === 1) return { winnerIndices: [0] };

  // 헬퍼: score 최대값을 가진 모든 인덱스
  const indicesWithMaxScore = (predicate: (h: HandResult) => boolean): number[] => {
    let max = -Infinity;
    for (let i = 0; i < hands.length; i++) {
      if (predicate(hands[i]) && hands[i].score > max) max = hands[i].score;
    }
    if (max === -Infinity) return [];
    const result: number[] = [];
    for (let i = 0; i < hands.length; i++) {
      if (predicate(hands[i]) && hands[i].score === max) result.push(i);
    }
    return result;
  };

  const isTtaengJabi = (h: HandResult) => h.isSpecialBeater && h.score === 0;
  const isAmhaengEosa = (h: HandResult) => h.isSpecialBeater && h.score === 1;
  const isGwangTtaeng = (h: HandResult) => h.score >= 1100 && !h.isSpecialBeater;
  const isJangTtaeng = (h: HandResult) => h.score === 1010;
  const isOneToNineTtaeng = (h: HandResult) => h.score >= 1001 && h.score <= 1009;

  // 1. 광땡 우선 (단, 암행어사 catch 처리)
  const gwangIndices = indicesWithMaxScore(isGwangTtaeng);
  if (gwangIndices.length > 0) {
    const topGwangScore = hands[gwangIndices[0]].score;

    // 삼팔광땡(1300)이 있으면 그대로 광땡 승
    if (topGwangScore === 1300) {
      return { winnerIndices: gwangIndices };
    }

    // 일팔(1200)/일삼(1100)광땡뿐 + 암행어사 존재 → 암행어사가 잡는다
    const amhaengIndices: number[] = [];
    for (let i = 0; i < hands.length; i++) {
      if (isAmhaengEosa(hands[i])) amhaengIndices.push(i);
    }
    if (amhaengIndices.length > 0 && (topGwangScore === 1200 || topGwangScore === 1100)) {
      return { winnerIndices: amhaengIndices };
    }

    return { winnerIndices: gwangIndices };
  }

  // 2. 장땡
  const jangIndices = indicesWithMaxScore(isJangTtaeng);
  if (jangIndices.length > 0) {
    return { winnerIndices: jangIndices };
  }

  // 3. 땡잡이 catch: 일~구땡이 함께 있으면 땡잡이가 승
  const ttaengJabiIndices: number[] = [];
  for (let i = 0; i < hands.length; i++) {
    if (isTtaengJabi(hands[i])) ttaengJabiIndices.push(i);
  }
  if (ttaengJabiIndices.length > 0) {
    const hasOneToNineTtaeng = hands.some(isOneToNineTtaeng);
    if (hasOneToNineTtaeng) {
      return { winnerIndices: ttaengJabiIndices };
    }
  }

  // 4. 일반 score 비교 (가장 높은 점수의 모든 인덱스)
  let maxScore = -Infinity;
  for (const h of hands) {
    if (h.score > maxScore) maxScore = h.score;
  }
  const topIndices: number[] = [];
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].score === maxScore) topIndices.push(i);
  }
  return { winnerIndices: topIndices };
}
