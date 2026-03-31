import { useState, useEffect } from 'react';
import type { PlayerState, GamePhase, Card, HandResult } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFace } from '@/components/game/CardFace';
import { CardBack } from '@/components/game/CardBack';
import { HandReferenceDialog } from './HandReferenceDialog';
import { cn } from '@/lib/utils';

interface HandPanelProps {
  myPlayer: PlayerState | null;
  phase?: GamePhase;
  onSelectCards?: (indices: number[]) => void;
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

export function HandPanel({ myPlayer, phase, onSelectCards, sharedCard, visibleCardCount, nickname }: HandPanelProps) {
  const [showReference, setShowReference] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const allCards = myPlayer?.cards ?? [];
  const cards = visibleCardCount !== undefined ? allCards.slice(0, visibleCardCount) : allCards;
  const alreadySelected = (myPlayer?.selectedCards?.length ?? 0) >= 2;

  const isCardSelectMode =
    phase === 'card-select' && (myPlayer?.isAlive ?? false) && !alreadySelected;

  // card-select phase가 아니면 선택 상태 리셋
  useEffect(() => {
    if (phase !== 'card-select') {
      setSelectedIndices([]);
      setSubmitting(false);
    }
  }, [phase]);

  const toggleCard = (idx: number) => {
    if (!isCardSelectMode) return;
    setSelectedIndices((prev) =>
      prev.includes(idx)
        ? prev.filter((i) => i !== idx)
        : prev.length < 2
        ? [...prev, idx]
        : prev
    );
  };

  const handleSelectCards = () => {
    if (selectedIndices.length !== 2 || !onSelectCards) return;
    setSubmitting(true);
    onSelectCards(selectedIndices);
  };

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
            <button
              key={idx}
              onClick={() => toggleCard(idx)}
              disabled={!isCardSelectMode}
              className={cn(
                'rounded-md transition-all',
                isCardSelectMode
                  ? selectedIndices.includes(idx)
                    ? 'ring-2 ring-primary scale-105 opacity-100 cursor-pointer'
                    : 'opacity-70 hover:opacity-100 hover:ring-1 hover:ring-primary/50 cursor-pointer'
                  : 'cursor-default'
              )}
            >
              {card === null ? (
                <CardBack />
              ) : (
                <CardFace card={card} />
              )}
            </button>
          ))}
          {handLabel && (
            <Badge variant="secondary" className="ml-2">
              {handLabel}
            </Badge>
          )}
        </div>
      )}

      {/* card-select phase UI */}
      {phase === 'card-select' && myPlayer?.isAlive && (
        <div className="space-y-1">
          {alreadySelected ? (
            <p className="text-sm text-muted-foreground">
              선택 완료! 다른 플레이어를 기다리는 중...
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                2장을 선택하세요 ({selectedIndices.length}/2)
              </p>
              <Button
                variant="default"
                size="sm"
                disabled={selectedIndices.length !== 2 || submitting}
                onClick={handleSelectCards}
              >
                {submitting ? '처리 중...' : '선택 완료'}
              </Button>
            </>
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
