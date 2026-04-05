import { useState, useEffect } from 'react';
import type { PlayerState, GamePhase, Card, HandResult, GameMode } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HwatuCard } from '@/components/game/HwatuCard';
import { HandReferenceDialog } from './HandReferenceDialog';

interface HandPanelProps {
  myPlayer: PlayerState | null;
  phase?: GamePhase;
  mode?: GameMode;
  sharedCard?: Card;
  visibleCardCount?: number;
  nickname?: string;
  onAllFlipped?: () => void;
  dealingComplete?: boolean;
  /** 외부 제어 모드: RoomPage에서 flip 상태를 관리할 때 사용 */
  flippedIndices?: Set<number>;
  onFlip?: (idx: number) => void;
  bgmMuted?: boolean;
  onToggleBgm?: () => void;
  sfxMuted?: boolean;
  onToggleSfx?: () => void;
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
  mode,
  sharedCard,
  visibleCardCount,
  nickname,
  onAllFlipped,
  dealingComplete = true,
  flippedIndices: controlledFlipped,
  onFlip,
  bgmMuted,
  onToggleBgm,
  sfxMuted,
  onToggleSfx,
}: HandPanelProps) {
  const [showReference, setShowReference] = useState(false);
  const [internalFlipped, setInternalFlipped] = useState<Set<number>>(new Set());

  const flippedIndices = controlledFlipped ?? internalFlipped;

  // phase 변경 시 내부 flip 상태 리셋 (외부 제어 모드에서는 RoomPage에서 관리)
  useEffect(() => {
    // setFlippedIndices(new Set()) — 외부 제어 모드에서는 RoomPage에서 관리
    if (!controlledFlipped) setInternalFlipped(new Set());
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!dealingComplete) return;
    if (flippedIndices.has(idx)) return;
    if (cards[idx] === null) return;

    if (onFlip) {
      // 외부 제어 모드
      onFlip(idx);
    } else {
      setInternalFlipped(prev => {
        const next = new Set(prev);
        next.add(idx);
        if (next.size >= 2 && onAllFlipped) onAllFlipped();
        return next;
      });
    }
  };

  // 족보 계산
  let handLabel: string | null = null;
  try {
    if (alreadySelected && myPlayer?.selectedCards && myPlayer.selectedCards.length >= 2) {
      // 세장섯다: 선택 완료된 카드로 족보 계산
      handLabel = getHandLabel(evaluateHand(myPlayer.selectedCards[0], myPlayer.selectedCards[1]));
    } else if (cards.length === 3 && cards.every((c): c is Card => c !== null) && flippedIndices.size >= 2) {
      // 세장섯다: 3장 중 최고 족보 조합 표시
      const combos: [Card, Card][] = [[cards[0], cards[1]], [cards[0], cards[2]], [cards[1], cards[2]]];
      let bestLabel: string | null = null;
      let bestScore = -1;
      for (const [a, b] of combos) {
        const result = evaluateHand(a, b);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestLabel = getHandLabel(result);
        }
      }
      handLabel = bestLabel;
    } else if (cards.length === 1 && sharedCard) {
      // 한장공유: 내 1장 + 공유카드로 족보 계산 (flip 완료 시에만)
      if ((flippedIndices.has(0) || isCardSelectPhase) && cards[0] != null) {
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
    <div className="space-y-1.5 p-2">
      {/* Row 1: 닉네임 */}
      <p className="text-xs font-semibold">{nickname ? `${nickname}의 패` : '내 패'}</p>

      {/* Row 2: 카드만 */}
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">카드가 아직 없어요</p>
      ) : (
        <div className={cards.length === 3 ? "flex items-center flex-wrap" : "flex gap-2 items-center flex-wrap"}>
          {(() => {
            const isThreeCards = cards.length === 3;

            // 세장섯다: openedCardIndex 카드를 맨 앞으로 정렬한 렌더 순서 계산
            const isThreeCardWithOpened = mode === 'three-card' && myPlayer?.openedCardIndex !== undefined;
            const cardRenderOrder: number[] = isThreeCardWithOpened
              ? [myPlayer!.openedCardIndex!, ...[...cards.keys()].filter(i => i !== myPlayer!.openedCardIndex!)]
              : [...cards.keys()];

            // 세장섯다 공개 구분 적용 phase — sejang-open 이후 (betting-1, card-select, betting-2)
            const isThreeCardOpenPhase = isThreeCardWithOpened &&
              (phase === 'betting-1' || phase === 'card-select' || phase === 'betting-2');

            return cardRenderOrder.map((origIdx, renderPos) => {
              const card = cards[origIdx];
              const isIndianHidden = mode === 'indian' && origIdx === 0;
              const isFlipped = isCardSelectPhase ? true : flippedIndices.has(origIdx);
              const isDisabled = !dealingComplete || isFlipped || card === null || isIndianHidden;
              const isOpenedCard = isThreeCardOpenPhase && origIdx === myPlayer!.openedCardIndex!;
              const isUnopenedCard = isThreeCardOpenPhase && origIdx !== myPlayer!.openedCardIndex!;

              return (
                <div
                  key={origIdx}
                  style={{
                    ...getDealAnimStyle(renderPos),
                    ...(isThreeCards && renderPos > 0 ? { marginLeft: '-12px' } : {}),
                    zIndex: isThreeCards ? cards.length - renderPos : undefined,
                  }}
                  className={[
                    isIndianHidden ? 'opacity-40' : undefined,
                    isOpenedCard ? 'ring-2 ring-amber-400 rounded brightness-110' : undefined,
                    isUnopenedCard ? 'brightness-75' : undefined,
                  ].filter(Boolean).join(' ') || undefined}
                >
                  <HwatuCard
                    card={card}
                    faceUp={isFlipped}
                    size="sm"
                    onClick={() => handleFlip(origIdx)}
                    disabled={isDisabled}
                  />
                  {isOpenedCard && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400 text-amber-400 mt-0.5 block text-center">
                      공개
                    </Badge>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Row 3: 족보 참고표 버튼 + 족보 배지 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-[10px] px-1.5 shrink-0" onClick={() => setShowReference(true)}>
          족보 참고표
        </Button>
        {handLabel && (
          <Badge variant="secondary" className="text-xs">
            {handLabel}
          </Badge>
        )}
      </div>

      {/* Row 4: BGM/SFX 버튼 (모바일 전용, props 제공 시만 렌더링) */}
      {(onToggleBgm || onToggleSfx) && (
        <div className="flex md:hidden items-center gap-1.5">
          {onToggleBgm && (
            <button
              onClick={onToggleBgm}
              aria-label={bgmMuted ? 'BGM 켜기' : 'BGM 끄기'}
              title={bgmMuted ? 'BGM 켜기' : 'BGM 끄기'}
              className={`h-11 w-11 flex items-center justify-center rounded text-base bg-black/40 border border-white/20 hover:bg-black/60 ${bgmMuted ? 'opacity-40' : 'opacity-70'}`}
            >
              <span aria-hidden="true">{bgmMuted ? '🔇' : '🎵'}</span>
            </button>
          )}
          {onToggleSfx && (
            <button
              onClick={onToggleSfx}
              aria-label={sfxMuted ? 'SFX 켜기' : 'SFX 끄기'}
              title={sfxMuted ? 'SFX 켜기' : 'SFX 끄기'}
              className={`h-11 w-11 flex items-center justify-center rounded text-base bg-black/40 border border-white/20 hover:bg-black/60 ${sfxMuted ? 'opacity-40' : 'opacity-70'}`}
            >
              <span aria-hidden="true">{sfxMuted ? '🔕' : '🔔'}</span>
            </button>
          )}
        </div>
      )}

      <HandReferenceDialog open={showReference} onOpenChange={setShowReference} />
    </div>
  );
}
