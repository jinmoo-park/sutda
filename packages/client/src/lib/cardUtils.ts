import type { Card, CardAttribute, CardRank } from '@sutda/shared';

export const RANK_KOREAN: Record<number, string> = {
  1: '일', 2: '이', 3: '삼', 4: '사', 5: '오',
  6: '육', 7: '칠', 8: '팔', 9: '구', 10: '장',
};

export const ATTRIBUTE_LABELS: Record<CardAttribute, string> = {
  gwang: '광',
  yeolkkeut: '열끗',
  normal: '',
};

export function rankToKorean(rank: CardRank | number): string {
  return RANK_KOREAN[rank] ?? String(rank);
}

export function cardToText(card: Card): string {
  const attr = ATTRIBUTE_LABELS[card.attribute];
  return attr ? `${card.rank}${attr}` : `${card.rank}`;
}
