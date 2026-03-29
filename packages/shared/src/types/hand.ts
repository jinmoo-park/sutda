/** 섯다 족보 종류 - 숫자가 높을수록 강한 패 */
export type HandType =
  // 광땡 (가장 강함)
  | 'sam-pal-gwang-ttaeng'    // 삼팔광땡: 3광 + 8광
  | 'il-pal-gwang-ttaeng'     // 일팔광땡: 1광 + 8광
  | 'il-sam-gwang-ttaeng'     // 일삼광땡: 1광 + 3광
  // 장땡~일땡
  | 'jang-ttaeng'             // 장땡: 10 + 10
  | 'gu-ttaeng'               // 구땡: 9 + 9
  | 'pal-ttaeng'              // 팔땡: 8 + 8
  | 'chil-ttaeng'             // 칠땡: 7 + 7
  | 'yuk-ttaeng'              // 육땡: 6 + 6
  | 'o-ttaeng'                // 오땡: 5 + 5
  | 'sa-ttaeng'               // 사땡: 4 + 4
  | 'sam-ttaeng'              // 삼땡: 3 + 3
  | 'i-ttaeng'                // 이땡: 2 + 2
  | 'il-ttaeng'               // 일땡: 1 + 1
  // 특수 조합 (알리~새륙)
  | 'ali'                     // 알리: 1 + 2
  | 'dok-sa'                  // 독사: 1 + 4
  | 'gu-bbing'                // 구삥: 1 + 9
  | 'jang-bbing'              // 장삥: 1 + 10
  | 'jang-sa'                 // 장사: 10 + 4
  | 'sae-ryuk'                // 새륙: 4 + 6
  // 끗 (0~9)
  | 'kkut';                   // 망통(0끗)~아홉끗(9끗)

/** 족보 판정 결과 */
export interface HandResult {
  /** 족보 종류 */
  handType: HandType;
  /**
   * 비교용 점수 (높을수록 강함).
   * 광땡: 1000+, 땡: 100+rank, 특수조합: 고정값, 끗: 0~9
   *
   * 점수 체계:
   * - 삼팔광땡: 1300
   * - 일팔광땡: 1200
   * - 일삼광땡: 1100
   * - 장땡: 1010, 구땡: 1009, ..., 일땡: 1001
   * - 알리: 60, 독사: 50, 구삥: 40, 장삥: 30, 장사: 20, 새륙: 10
   * - 끗: 0~9 (일의 자리 합)
   */
  score: number;
  /** 땡잡이 또는 암행어사 여부 - true면 특수 비교 로직 적용 */
  isSpecialBeater: boolean;
  /** 일반 구사 여부 (4일반 + 9일반) */
  isGusa: boolean;
  /** 멍텅구리구사 여부 (4열끗 + 9열끗) */
  isMeongtteongguriGusa: boolean;
}
