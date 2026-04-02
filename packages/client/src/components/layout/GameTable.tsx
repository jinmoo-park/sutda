import type { PlayerState, Card, GameMode, RoomState } from '@sutda/shared';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { SharedCardDisplay } from '@/components/game/SharedCardDisplay';
import { computeSlotIndices } from '@/lib/cardImageUtils';
import { Badge } from '@/components/ui/badge';

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
  roomState?: RoomState | null;
}

export function GameTable({ players, myPlayerId, currentPlayerIndex, pot, visibleCardCounts, sharedCard, mode, dealingComplete = true, myFlippedCardIndices, roomState }: GameTableProps) {
  // Observer 목록
  const observers = roomState?.players.filter(p => p.isObserver) ?? [];
  // 올인 플레이어 존재 여부
  const hasAllIn = players.some(p => p.isAllIn);

  // 전역 slot 계산: 모든 플레이어 카드를 flat하게 합산해 rank 충돌 방지
  const globalSlots = computeSlotIndices(players.flatMap(p => p.cards));
  let offset = 0;
  const playerCardSlots = players.map(p => {
    const slots = globalSlots.slice(offset, offset + p.cards.length);
    offset += p.cards.length;
    return slots;
  });

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
        {/* 반투명 블랙 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        {/* 중앙 팟 표시 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-background/60 border border-border rounded-2xl px-5 py-3 shadow-inner">
            <p className="text-xs text-muted-foreground tracking-widest uppercase">판돈</p>
            <p className="text-[26px] font-semibold tabular-nums">{pot.toLocaleString()}원</p>
            {hasAllIn && (
              <span className="text-[10px] text-muted-foreground">올인 포함</span>
            )}
            {mode === 'shared-card' && sharedCard && (
              <div className="mt-2">
                <SharedCardDisplay card={sharedCard} />
              </div>
            )}
          </div>
        </div>

        {/* Observer 목록 */}
        {observers.length > 0 && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
            {observers.map(obs => (
              <div key={obs.id} className="bg-card/80 rounded px-2 py-1 text-xs flex items-center gap-1.5">
                <span>{obs.nickname}</span>
                <Badge variant="outline" className="border-primary text-primary text-xs px-1 py-0">관람 중</Badge>
              </div>
            ))}
          </div>
        )}

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
            cardSlotIndices={playerCardSlots[i]}
            isConnected={roomState?.players.find(rp => rp.id === p.id)?.isConnected ?? true}
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
        {/* 반투명 블랙 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* 팟 한줄 요약 — padding으로 overflow 방지 */}
          <div className="text-center pt-2 pb-1 px-2 shrink-0">
            <span className="text-xs text-muted-foreground tracking-widest uppercase">판돈 </span>
            <span className="font-semibold tabular-nums">{pot.toLocaleString()}원</span>
            {hasAllIn && <span className="text-[10px] text-muted-foreground ml-1">올인 포함</span>}
          </div>
          {mode === 'shared-card' && sharedCard && (
            <div className="flex justify-center py-1 shrink-0">
              <SharedCardDisplay card={sharedCard} />
            </div>
          )}
          {/* 그리드 배치: 6명까지 2열 3행 */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 p-1">
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
                  cardSlotIndices={playerCardSlots[i]}
                  isConnected={roomState?.players.find(rp => rp.id === p.id)?.isConnected ?? true}
                  mode={mode}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
