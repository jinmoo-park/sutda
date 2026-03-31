import type { PlayerState, Card, GameMode } from '@sutda/shared';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { SharedCardDisplay } from '@/components/game/SharedCardDisplay';

interface GameTableProps {
  players: PlayerState[];
  myPlayerId: string | null;
  currentPlayerIndex: number;
  pot: number;
  visibleCardCounts?: Record<string, number>;
  sharedCard?: Card;
  mode?: GameMode;
  dealingComplete?: boolean;
  myFlippedCardIndices?: Set<number>;
}

export function GameTable({ players, myPlayerId, currentPlayerIndex, pot, visibleCardCounts, sharedCard, mode, dealingComplete = true, myFlippedCardIndices }: GameTableProps) {
  return (
    <>
      {/* 데스크톱: 중앙패널 전체 채움 — 배경이미지 + 원형 플레이어 배치 */}
      <div
        className="absolute inset-0 hidden md:flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/img/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 반투명 블랙 그라데이션 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        {/* 중앙 팟 표시 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-background/60 border border-border rounded-2xl px-5 py-3 shadow-inner">
            <p className="text-xs text-muted-foreground tracking-widest uppercase">판돈</p>
            <p className="text-[26px] font-semibold tabular-nums">{pot.toLocaleString()}원</p>
            {mode === 'shared-card' && sharedCard && (
              <div className="mt-2">
                <SharedCardDisplay card={sharedCard} />
              </div>
            )}
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
            visibleCardCount={visibleCardCounts?.[p.id]}
            mode={mode}
            dealingComplete={dealingComplete}
            flippedCardIndices={p.id === myPlayerId ? myFlippedCardIndices : undefined}
          />
        ))}
      </div>

      {/* 모바일: 전체 높이 채움 */}
      <div
        className="md:hidden h-full relative"
        style={{
          backgroundImage: "url('/img/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 반투명 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        />

        <div className="relative z-10 space-y-2 p-4 h-full flex flex-col">
          {/* 팟 한줄 요약 */}
          <div className="text-center py-2">
            <span className="text-xs text-muted-foreground tracking-widest uppercase">판돈 </span>
            <span className="font-semibold tabular-nums">{pot.toLocaleString()}원</span>
          </div>
          {mode === 'shared-card' && sharedCard && (
            <div className="flex justify-center py-1">
              <SharedCardDisplay card={sharedCard} />
            </div>
          )}
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
                visibleCardCount={visibleCardCounts?.[p.id]}
                dealingComplete={dealingComplete}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
