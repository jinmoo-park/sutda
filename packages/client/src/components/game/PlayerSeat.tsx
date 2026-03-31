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
  /** 딜링 애니메이션용: 보여줄 카드 수 (undefined = 전부) */
  visibleCardCount?: number;
  mode?: GameMode;
  /** 배분 애니메이션 완료 여부 */
  dealingComplete?: boolean;
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
}: PlayerSeatProps) {
  const style = {
    '--angle': `calc(360deg / ${totalPlayers} * ${seatIndex})`,
  } as React.CSSProperties;

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
        'w-28 p-2 space-y-1 transition-shadow duration-300',
        isCurrentTurn && 'ring-2 ring-primary shadow-[0_0_14px_3px] shadow-primary/50',
        !player.isAlive && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-1">
        <p className={cn('text-xs font-semibold truncate flex-1', isCurrentTurn && 'text-primary')}>
          {player.nickname}
          {isMe && <span className="ml-1 text-xs font-bold text-blue-400">[나]</span>}
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
      </div>

      {player.cards.length > 0 && (
        <div className="flex gap-1">
          {[0, 1].map((idx) => {
            const visible = idx < showCount;
            const card = player.cards[idx];
            // 세장섯다: openedCardIndex가 있으면 해당 카드는 전원에게 공개
            const isOpenedCard = mode === 'three-card' && player.openedCardIndex === idx;
            const showFace = card != null && (isMe || mode === 'indian' || isOpenedCard);
            return (
              <div
                key={idx}
                className={cn(
                  'transition-opacity duration-300',
                  visible ? 'opacity-100' : 'opacity-0'
                )}
                style={getDealAnimStyle(idx)}
              >
                <HwatuCard
                  card={card ?? undefined}
                  faceUp={showFace}
                  size="sm"
                  disabled
                />
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs tabular-nums text-muted-foreground">{player.chips.toLocaleString()}원</p>

      {player.lastBetAction && (
        <div className="flex items-center gap-1 flex-wrap">
          {player.lastBetAction.type === 'check' && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-sky-400 border-sky-400">체크</Badge>
          )}
          {player.lastBetAction.type === 'call' && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-green-400 border-green-400">콜</Badge>
          )}
          {player.lastBetAction.type === 'raise' && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-yellow-400 border-yellow-400">
              레이즈{player.lastBetAction.amount ? ` +${player.lastBetAction.amount.toLocaleString()}` : ''}
            </Badge>
          )}
          {player.lastBetAction.type === 'die' && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-red-400 border-red-400">다이</Badge>
          )}
          {player.currentBet > 0 && (
            <span className="text-xs tabular-nums text-yellow-400 font-semibold">
              {player.currentBet.toLocaleString()}원
            </span>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <>
      {/* 데스크톱: 원형 배치 */}
      <div
        className="absolute top-1/2 left-1/2 -mt-14 -ml-14 hidden md:block transition-transform duration-500"
        style={{
          ...style,
          transform: `rotate(var(--angle)) translateY(-200px) rotate(calc(var(--angle) * -1))`,
        }}
      >
        {content}
      </div>

      {/* 모바일: 일반 flex 아이템 */}
      <div className="md:hidden">{content}</div>
    </>
  );
}
