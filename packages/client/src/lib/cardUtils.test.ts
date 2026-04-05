import { describe, it, expect } from 'vitest';
import { cardToText, rankToKorean, ATTRIBUTE_LABELS } from './cardUtils';
import type { Card } from '@sutda/shared';

describe('cardUtils', () => {
  describe('ATTRIBUTE_LABELS', () => {
    it('gwang은 "광"이다', () => { expect(ATTRIBUTE_LABELS.gwang).toBe('광'); });
    it('yeolkkeut은 "열끗"이다', () => { expect(ATTRIBUTE_LABELS.yeolkkeut).toBe('열끗'); });
    it('normal은 빈 문자열이다', () => { expect(ATTRIBUTE_LABELS.normal).toBe(''); });
  });

  describe('rankToKorean', () => {
    it('1은 "일"이다', () => { expect(rankToKorean(1)).toBe('일'); });
    it('10은 "장"이다', () => { expect(rankToKorean(10)).toBe('장'); });
    it('5는 "오"이다', () => { expect(rankToKorean(5)).toBe('오'); });
  });

  describe('cardToText', () => {
    it('3광 카드를 "3광"으로 변환한다', () => {
      const card: Card = { rank: 3, attribute: 'gwang' };
      expect(cardToText(card)).toBe('3광');
    });
    it('4열끗 카드를 "4열끗"으로 변환한다', () => {
      const card: Card = { rank: 4, attribute: 'yeolkkeut' };
      expect(cardToText(card)).toBe('4열끗');
    });
    it('5일반 카드를 "5"로 변환한다 (속성 표시 없음)', () => {
      const card: Card = { rank: 5, attribute: 'normal' };
      expect(cardToText(card)).toBe('5');
    });
    it('10일반 카드를 "10"으로 변환한다', () => {
      const card: Card = { rank: 10, attribute: 'normal' };
      expect(cardToText(card)).toBe('10');
    });
  });
});
