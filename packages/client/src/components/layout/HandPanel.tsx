import { useState } from 'react';
import type { PlayerState, GamePhase, Card, HandResult } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFace } from '@/components/game/CardFace';
import { CardBack } from '@/components/game/CardBack';
import { HandReferenceDialog } from './HandReferenceDialog';

interface HandPanelProps {
  myPlayer: PlayerState | null;
  phase?: GamePhase;
  sharedCard?: Card;
  visibleCardCount?: number;
  nickname?: string;
}

const HAND_TYPE_KOREAN: Record<string, string> = {
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

/** 족보 판정 결과를 한국어 레이블로 변환 */
function getHandLabel(result: HandResult): string {
  if (result.handType !== 'kkut') {
    return HAND_TYPE_KOREAN[result.handType] ?? result.handType;
  }
  // 특수패 이름 우선 적용
  if (result.isMeongtteongguriGusa) return '멍텅구리구사';
  if (result.isGusa) return '구사';
  if (result.isSpecialBeater && result.score === 1) return '암행어사';
  if (result.isSpecialBeater && result.score === 0) return '땡잡이';
  // 일반 끗
  if (result.score === 0) return '망통';
  if (result.score === 9) return '갑오';
  return `${result.score}끗`;
}

export function HandPanel({ myPlayer, phase, sharedCard, visibleCardCount, nickname }: HandPanelProps) {
  const [showReference, setShowReference] = useState(false);

  const allCards = myPlayer?.cards ?? [];
  const cards = visibleCardCount !== undefined ? allCards.slice(0, visibleCardCount) : allCards;
  const alreadySelected = (myPlayer?.selectedCards?.length ?? 0) >= 2;

  // 족보 계산
  let handLabel: string | null = null;
  try {
    if (alreadySelected && myPlayer?.selectedCards && myPlayer.selectedCards.length >= 2) {
      // 세장섯다: 선택 완료된 카드로 족보 계산
      handLabel = getHandLabel(evaluateHand(myPlayer.selectedCards[0], myPlayer.selectedCards[1]));
    } else if (cards.length === 1 && sharedCard) {
      // 한장공유: 내 1장 + 공유카드로 족보 계산
      handLabel = getHandLabel(evaluateHand(cards[0], sharedCard));
    } else if (cards.length >= 2 && cards[0] !== null && cards[1] !== null && phase !== 'card-select') {
      // 오리지날: 기본 2장으로 족보 계산 (card-select phase에서는 표시 안 함, 인디언 null 카드 제외)
      handLabel = getHandLabel(evaluateHand(cards[0], cards[1]));
    }
  } catch {
    // 카드가 2장 미만이거나 평가 불가한 경우 무시
  }

  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-semibold">{nickname ? `${nickname}의 패` : '내 패'}</p>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">카드가 아직 없어요</p>
      ) : (
        <div className="flex gap-2 items-center flex-wrap">
          {cards.map((card, idx) => (
            <div key={idx} className="rounded-md">
              {card === null ? (
                <CardBack />
              ) : (
                <CardFace card={card} />
              )}
            </div>
          ))}
          {handLabel && (
            <Badge variant="secondary" className="ml-2">
              {handLabel}
            </Badge>
          )}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={() => setShowReference(true)}>
        족보 참고표
      </Button>

      <HandReferenceDialog open={showReference} onOpenChange={setShowReference} />
    </div>
  );
}
