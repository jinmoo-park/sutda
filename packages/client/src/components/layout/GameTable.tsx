import type { PlayerState } from '@sutda/shared';
import { PlayerSeat } from '@/components/game/PlayerSeat';

interface GameTableProps {
  players: PlayerState[];
  myPlayerId: string | null;
  currentPlayerIndex: number;
  pot: number;
}

export function GameTable({ players, myPlayerId, currentPlayerIndex, pot }: GameTableProps) {
  return (
    <>
      {/* 데스크톱: 원형 배치 */}
      <div
        className="relative mx-auto hidden md:block"
        style={{ width: '480px', height: '480px' }}
      >
        {/* 중앙 팟 표시 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">판돈</p>
            <p className="text-[28px] font-semibold tabular-nums">{pot.toLocaleString()}원</p>
          </div>
        </div>

        {/* 플레이어 원형 배치 */}
        {players.map((p, i) => (
          <PlayerSeat
            key={p.id}
            seatIndex={i}
            totalPlayers={players.length}
            player={p}
            isMe={p.id === myPlayerId}
            isCurrentTurn={i === currentPlayerIndex}
          />
        ))}
      </div>

      {/* 모바일: 세로 스택 */}
      <div className="md:hidden space-y-2 p-4">
        {/* 팟 한줄 요약 */}
        <div className="text-center py-2">
          <span className="text-sm text-muted-foreground">판돈 </span>
          <span className="font-semibold tabular-nums">{pot.toLocaleString()}원</span>
        </div>
        {/* 그리드 배치 */}
        <div className="grid grid-cols-2 gap-2">
          {players.map((p, i) => (
            <PlayerSeat
              key={p.id}
              seatIndex={i}
              totalPlayers={players.length}
              player={p}
              isMe={p.id === myPlayerId}
              isCurrentTurn={i === currentPlayerIndex}
            />
          ))}
        </div>
      </div>
    </>
  );
}
