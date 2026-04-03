/** 카드 숫자 (1~10) */
export type CardRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** 카드 속성 - 광: 1,3,8 / 열끗: 4,7,9 / 일반: 나머지 */
export type CardAttribute = 'gwang' | 'yeolkkeut' | 'normal';

/** 섯다 카드 한 장 */
export interface Card {
  /** 덱 고유 번호 (1~20). 이미지 1:1 매핑에 사용. createDeck()이 부여한다. */
  id?: number;
  /** 숫자 (1~10) */
  rank: CardRank;
  /** 속성: 광/열끗/일반 */
  attribute: CardAttribute;
}

/** 광 카드 숫자 목록 */
export const GWANG_RANKS: readonly CardRank[] = [1, 3, 8] as const;

/** 열끗 특수 카드 숫자 목록 */
export const YEOLKKEUT_RANKS: readonly CardRank[] = [4, 7, 9] as const;

/** 숫자에 대응하는 카드 속성을 반환 */
export function getCardAttribute(rank: CardRank, isSpecialCard: boolean): CardAttribute {
  if (isSpecialCard) {
    if ((GWANG_RANKS as readonly number[]).includes(rank)) return 'gwang';
    if ((YEOLKKEUT_RANKS as readonly number[]).includes(rank)) return 'yeolkkeut';
  }
  return 'normal';
}
