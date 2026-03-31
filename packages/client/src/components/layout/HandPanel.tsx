import { useState, useEffect } from 'react';
import type { PlayerState, GamePhase, Card, HandResult } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HwatuCard } from '@/components/game/HwatuCard';
import { HandReferenceDialog } from './HandReferenceDialog';

interface HandPanelProps {
  myPlayer: PlayerState | null;
  phase?: GamePhase;
  sharedCard?: Card;
  visibleCardCount?: number;
  nickname?: string;
  onAllFlipped?: () => void;
  dealingComplete?: boolean;
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

export function HandPanel({
  myPlayer,
  phase,
  sharedCard,
  visibleCardCount,
  nickname,
  onAllFlipped,
  dealingComplete = true,
}: HandPanelProps) {
  const [showReference, setShowReference] = useState(false);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());

  // phase 변경 시 flip 상태 리셋
  useEffect(() => {
    setFlippedIndices(new Set());
  }, [phase]);

  const allCards = myPlayer?.cards ?? [];
  const cards = visibleCardCount !== undefined ? allCards.slice(0, visibleCardCount) : allCards;
  const alreadySelected = (myPlayer?.selectedCards?.length ?? 0) >= 2;

  // 골라골라 모드: 직접 선택이므로 flip 불필요 → onAllFlipped 즉시 호출
  useEffect(() => {
    if (phase === 'betting' && myPlayer && alreadySelected && onAllFlipped && flippedIndices.size === 0) {
      // 골라골라/인디언 모드는 flip 없이 바로 확인 완료
    }
  }, [phase, alreadySelected]);

  // card-select phase: 전체 카드를 flip 없이 faceUp=true로 표시
  const isCardSelectPhase = phase === 'card-select';

  const handleFlip = (idx: number) => {
    if (!dealingComplete) return; // 배분 중 클릭 불가
    if (flippedIndices.has(idx)) return; // 이미 뒤집힌 카드
    if (cards[idx] === null) return; // null 카드 (인디언 숨김)

    setFlippedIndices(prev => {
      const next = new Set(prev);
      next.add(idx);
      // 2장 모두 뒤집으면 콜백 호출
      if (next.size >= 2 && onAllFlipped) {
        onAllFlipped();
      }
      return next;
    });
  };

  // 족보 계산
  let handLabel: string | null = null;
  try {
    if (alreadySelected && myPlayer?.selectedCards && myPlayer.selectedCards.length >= 2) {
      // 세장섯다: 선택 완료된 카드로 족보 계산
      handLabel = getHandLabel(evaluateHand(myPlayer.selectedCards[0], myPlayer.selectedCards[1]));
    } else if (cards.length === 1 && sharedCard) {
      // 한장공유: 내 1장 + 공유카드로 족보 계산 (flip 완료 시에만)
      if (flippedIndices.has(0) || isCardSelectPhase) {
        handLabel = getHandLabel(evaluateHand(cards[0], sharedCard));
      }
    } else if (flippedIndices.size >= 2 && cards[0] !== null && cards[1] !== null && !isCardSelectPhase) {
      // 2장 모두 뒤집었을 때만 족보 표시
      handLabel = getHandLabel(evaluateHand(cards[0], cards[1]));
    }
  } catch {
    // 카드가 2장 미만이거나 평가 불가한 경우 무시
  }

  // 배분 날아오기 애니메이션 스타일
  const getDealAnimStyle = (idx: number): React.CSSProperties => {
    if (dealingComplete) return {};
    return {
      animation: `deal-fly-in 0.4s ease-out forwards`,
      animationDelay: `${idx * 200}ms`,
      opacity: 0,
    };
  };

  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-semibold">{nickname ? `${nickname}의 패` : '내 패'}</p>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">카드가 아직 없어요</p>
      ) : (
        <div className="flex gap-2 items-center flex-wrap">
          {cards.map((card, idx) => {
            const isFlipped = isCardSelectPhase ? true : flippedIndices.has(idx);
            const isDisabled = !dealingComplete || isFlipped || card === null;
            return (
              <div key={idx} style={getDealAnimStyle(idx)}>
                <HwatuCard
                  card={card}
                  faceUp={isFlipped}
                  size="md"
                  onClick={() => handleFlip(idx)}
                  disabled={isDisabled}
                  slotIndex={idx}
                />
              </div>
            );
          })}
          {handLabel && (
            <Badge variant="secondary" className="ml-2">
              {handLabel}
            </Badge>
          )}
        </div>
      )}

      {/* 1장만 뒤집은 상태 힌트 */}
      {flippedIndices.size === 1 && cards.length >= 2 && (
        <p className="text-xs text-muted-foreground">나머지 카드를 탭해서 확인하세요</p>
      )}

      <Button variant="ghost" size="sm" onClick={() => setShowReference(true)}>
        족보 참고표
      </Button>

      <HandReferenceDialog open={showReference} onOpenChange={setShowReference} />
    </div>
  );
}
