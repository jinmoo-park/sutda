import type { PlayerState } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CardFace } from './CardFace';
import { CardBack } from './CardBack';
import { cn } from '@/lib/utils';

interface PlayerSeatProps {
  seatIndex: number;
  totalPlayers: number;
  player: PlayerState;
  isMe: boolean;
  isCurrentTurn: boolean;
}

export function PlayerSeat({
  seatIndex,
  totalPlayers,
  player,
  isMe,
  isCurrentTurn,
}: PlayerSeatProps) {
  const style = {
    '--angle': `calc(360deg / ${totalPlayers} * ${seatIndex})`,
  } as React.CSSProperties;

  const content = (
    <Card
      className={cn(
        'w-28 p-2 space-y-1',
        isCurrentTurn && 'ring-2 ring-primary',
        !player.isAlive && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-1">
        <p className="text-xs font-semibold truncate flex-1">{player.nickname}</p>
        {player.isDealer && (
          <Badge variant="outline" className="text-xs px-1 py-0 shrink-0">
            선
          </Badge>
        )}
        {!player.isAlive && (
          <Badge variant="destructive" className="text-xs px-1 py-0 shrink-0">
            다이
          </Badge>
        )}
      </div>

      {player.cards.length > 0 && (
        <div className="flex gap-1">
          {player.cards.map((card, idx) =>
            isMe ? (
              <CardFace key={idx} card={card} />
            ) : (
              <CardBack key={idx} />
            )
          )}
        </div>
      )}

      <p className="text-xs tabular-nums">{player.chips.toLocaleString()}원</p>

      {player.currentBet > 0 && (
        <Badge variant="secondary" className="text-xs">
          {player.currentBet.toLocaleString()}원
        </Badge>
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
