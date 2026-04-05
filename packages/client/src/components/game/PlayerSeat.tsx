import type { PlayerState, GameMode } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { HwatuCard } from './HwatuCard';
import { cn } from '@/lib/utils';

interface PlayerSeatProps {
  seatIndex: number;
  totalPlayers: number;
  player: PlayerState;
  isMe: boolean;
  isCurrentTurn: boolean;
  visibleCardCount?: number;
  mode?: GameMode;
  dealingComplete?: boolean;
  /** 내 카드 flip 동기화 (HandPanel과 연동) */
  flippedCardIndices?: Set<number>;
  /** Observer 모드 여부 */
  isObserver?: boolean;
  /** 소켓 연결 상태 (재접속 대기 중 표시) */
  isConnected?: boolean;
  /** 모바일 compact 모드 — 카드 크기 축소 */
  compact?: boolean;
}

export function PlayerSeat({
  seatIndex,
  totalPlayers,
  player,
  isMe,
  isCurrentTurn,
  visibleCardCount,
  mode,
  dealingComplete = true,
  flippedCardIndices,
  isObserver,
  isConnected = true,
  compact = false,
}: PlayerSeatProps) {
  const showCount = visibleCardCount ?? 2;

  // 배분 날아오기 애니메이션 스타일
  const getDealAnimStyle = (cardIdx: number): React.CSSProperties => {
    if (dealingComplete) return {};
    return {
      animation: `deal-fly-in 0.4s ease-out forwards`,
      animationDelay: `${cardIdx * 200}ms`,
      opacity: 0,
    };
  };

  const content = (
    <Card
      className={cn(
        'w-auto transition-shadow duration-300',
        compact ? 'min-w-0 p-1.5 space-y-1' : 'min-w-[11rem] p-4 space-y-1',
        isCurrentTurn && 'ring-2 ring-primary shadow-[0_0_14px_3px] shadow-primary/50',
        !player.isAlive && 'opacity-50',
        !isConnected && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-1">
        <p className={cn(compact ? 'text-[11px]' : 'text-xs', 'font-semibold truncate flex-1', isCurrentTurn && 'text-primary')}>
          {player.nickname}
          {isMe && <span className={cn('ml-1 font-semibold text-primary', compact ? 'text-[11px]' : 'text-xs')}>[나]</span>}
        </p>
        {player.isDealer && (
          <Badge variant="outline" className="text-xs px-1 py-0 shrink-0">
            선
          </Badge>
        )}
        {player.isAbsent && (
          <Badge variant="secondary" className="text-xs px-1 py-0 shrink-0">
            자리비움
          </Badge>
        )}
        {!player.isAlive && !player.isAbsent && (
          <Badge variant="destructive" className="text-xs px-1 py-0 shrink-0">
            다이
          </Badge>
        )}
        {player.isAllIn && (
          <Badge variant="outline" className="border-primary text-primary text-xs px-1 py-0 shrink-0">
            올인
          </Badge>
        )}
      </div>

      {isObserver && (
        <div className="flex flex-col items-center gap-0.5">
          <Badge variant="outline" className="border-primary text-primary text-xs px-1 py-0">
            관람 중
          </Badge>
          <span className="text-[10px] text-muted-foreground">다음 판 자동 합류</span>
        </div>
      )}

      {!isConnected && (
        <span className="text-[10px] text-muted-foreground">재접속 대기 중</span>
      )}

      {player.cards.length > 0 && (() => {
        const maxSlots = mode === 'shared-card'
          ? Math.max(player.cards.length, 1)
          : Math.max(player.cards.length, 2);
        const isThreeCardLayout = mode === 'three-card' && maxSlots >= 3;

        // 세장섯다: openedCardIndex 카드를 맨 앞으로 정렬한 렌더 순서 계산 (HandPanel과 동일 패턴)
        const isThreeCardWithOpened = mode === 'three-card' && player.openedCardIndex !== undefined;
        const renderOrder: number[] = isThreeCardWithOpened
          ? [player.openedCardIndex!, ...[...Array(maxSlots).keys()].filter(i => i !== player.openedCardIndex!)]
          : [...Array(maxSlots).keys()];

        return (
        <div className={cn(
          'flex flex-wrap',
          isThreeCardLayout && compact ? '-space-x-3' : isThreeCardLayout ? '-space-x-2' : 'gap-1'
        )}>
          {renderOrder.map((origIdx, renderPos) => {
            const visible = origIdx < showCount;
            const card = player.cards[origIdx];
            // 세장섯다: openedCardIndex가 있으면 해당 카드는 전원에게 공개
            const isOpenedCard = mode === 'three-card' && player.openedCardIndex === origIdx;
            // 내 카드: flip 동기화 (HandPanel에서 뒤집은 카드만 앞면)
            // 상대 카드: 인디언 모드이거나 세장섯다 공개 카드만 앞면
            const showFace = card != null && (
              (isMe && (flippedCardIndices ? flippedCardIndices.has(origIdx) : false))
              || (!isMe && mode === 'indian')
              || isOpenedCard
            );
            return (
              <div
                key={origIdx}
                className={cn(
                  'transition-opacity duration-300',
                  visible ? 'opacity-100' : 'opacity-0',
                  isThreeCardLayout && 'relative',
                  isThreeCardLayout && renderPos === 0 && 'z-30',
                  isThreeCardLayout && renderPos === 1 && 'z-20',
                  isThreeCardLayout && renderPos === 2 && 'z-10',
                  isOpenedCard && 'ring-2 ring-amber-400 rounded brightness-110'
                )}
                style={getDealAnimStyle(origIdx)}
              >
                <HwatuCard
                  card={card ?? undefined}
                  faceUp={showFace}
                  size={compact ? 'xxs' : 'sm'}
                  disabled
                />
              </div>
            );
          })}
        </div>
        );
      })()}

      <p className={`tabular-nums ${compact ? 'text-[11px]' : 'text-xs'} ${isMe ? 'text-yellow-400 font-semibold' : 'text-muted-foreground'}`}>{player.chips.toLocaleString()}원</p>

      {player.lastBetAction && (
        <div className="flex items-center gap-1 flex-wrap">
          {player.lastBetAction.type === 'check' && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-sky-400 border-sky-400">체크</Badge>
          )}
          {player.lastBetAction.type === 'call' && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-green-400 border-green-400">콜</Badge>
          )}
          {player.lastBetAction.type === 'raise' && (
            <div className="flex flex-col gap-0.5">
              <Badge variant="outline" className={cn(
                "px-1 py-0 text-yellow-400 border-yellow-400 w-fit",
                compact ? "text-[10px]" : "text-xs"
              )}>
                레이즈{player.lastBetAction.amount ? ` +${player.lastBetAction.amount.toLocaleString()}원` : ''}
              </Badge>
              {player.currentBet > 0 && (
                <span className={cn(
                  "tabular-nums text-yellow-400 font-semibold",
                  compact ? "text-[10px]" : "text-xs"
                )}>
                  {player.currentBet.toLocaleString()}원
                </span>
              )}
            </div>
          )}
          {player.lastBetAction.type === 'die' && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-red-400 border-red-400">다이</Badge>
          )}
          {player.lastBetAction.type !== 'raise' && player.currentBet > 0 && (
            <span className="text-xs tabular-nums text-yellow-400 font-semibold">
              {player.currentBet.toLocaleString()}원
            </span>
          )}
        </div>
      )}
    </Card>
  );

  return <>{content}</>;
}
