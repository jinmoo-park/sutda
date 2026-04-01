import type { HandResult } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import type { Card } from '@sutda/shared';

export const HAND_TYPE_KOREAN: Record<string, string> = {
  'sam-pal-gwang-ttaeng': '삼팔광땡',
  'il-pal-gwang-ttaeng': '일팔광땡',
  'il-sam-gwang-ttaeng': '일삼광땡',
  'jang-ttaeng': '장땡',
  'gu-ttaeng': '구땡',
  'pal-ttaeng': '팔땡',
  'chil-ttaeng': '칠땡',
  'yuk-ttaeng': '육땡',
  'o-ttaeng': '오땡',
  'sa-ttaeng': '사땡',
  'sam-ttaeng': '삼땡',
  'i-ttaeng': '이땡',
  'il-ttaeng': '일땡',
  ali: '알리',
  'dok-sa': '독사',
  'gu-bbing': '구삥',
  'jang-bbing': '장삥',
  'jang-sa': '장사',
  'sae-ryuk': '새륙',
  kkut: '끗',
};

/**
 * HandResult에서 한국어 족보명 반환
 */
export function getHandLabel(result: HandResult): string {
  if (result.handType !== 'kkut') {
    return HAND_TYPE_KOREAN[result.handType] ?? result.handType;
  }
  if (result.isMeongtteongguriGusa) return '멍텅구리구사';
  if (result.isGusa) return '구사';
  if (result.isSpecialBeater && result.score === 1) return '암행어사';
  if (result.isSpecialBeater && result.score === 0) return '땡잡이';
  if (result.score === 0) return '망통';
  if (result.score === 9) return '갑오';
  return `${result.score}끗`;
}

/**
 * handType 문자열(서버 전송값, 이력 등)을 한국어로 변환
 * 예: "sa-ttaeng" → "사땡", "gu-bbing" → "구삥"
 * 끗/특수 문자열(예: "3끗", "망통") 처리: 숫자 + "끗" 패턴이면 그대로 반환
 */
export function handLabelToKorean(label: string): string {
  // 이미 한국어로 된 값이면 그대로 (서버가 이미 변환한 경우)
  if (/[가-힣]/.test(label)) return label;

  // HAND_TYPE_KOREAN 직접 매핑
  if (HAND_TYPE_KOREAN[label]) return HAND_TYPE_KOREAN[label];

  // "N끗" 패턴 (영어 숫자 + kkut suffix)
  const kkutMatch = label.match(/^(\d+)끗$/);
  if (kkutMatch) return label;

  // 기타: 그대로 반환 (fallback)
  return label;
}

/**
 * 카드 2장에서 한국어 족보명 계산
 */
export function getHandLabelFromCards(card1: Card, card2: Card): string | null {
  try {
    return getHandLabel(evaluateHand(card1, card2));
  } catch {
    return null;
  }
}
