import { useEffect } from 'react';
import type { PlayerState, Card, GameMode, RoomState } from '@sutda/shared';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { SharedCardDisplay } from '@/components/game/SharedCardDisplay';
import { Badge } from '@/components/ui/badge';
import { setBigPot } from '@/hooks/useBgmPlayer';

const MODE_LABELS: Record<string, string> = {
  'original': '오리지날',
  'three-card': '세장',
  'shared-card': '한장공유',
  'gollagolla': '골라골라',
  'indian': '인디언',
};

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
  showMyTurnAlert?: boolean;
}

/**
 * 상대방 수에 따라 배치할 셀 번호 배열 반환 (셀 1~9, 5=중앙 팟 예약)
 * 내 플레이어는 항상 row3 전체 (셀7~9)
 */
function getOpponentCells(opponentCount: number): number[] {
  switch (opponentCount) {
    case 5: return [1, 2, 3, 4, 6];
    case 4: return [1, 3, 4, 6];
    case 3: return [1, 2, 3];
    case 2: return [1, 3];
    case 1: return [2];
    default: return [];
  }
}

/** 셀 번호 → gridArea 문자열 (row/col) */
function cellToGridArea(cell: number): string {
  const row = Math.ceil(cell / 3);
  const col = ((cell - 1) % 3) + 1;
  return `${row} / ${col}`;
}

export function GameTable({ players, myPlayerId, currentPlayerIndex, pot, visibleCardCounts, sharedCard, mode, dealingComplete = true, myFlippedCardIndices, roomState, showMyTurnAlert }: GameTableProps) {
  // 빅팟 BGM useEffect
  useEffect(() => {
    setBigPot(pot >= 20000);
    return () => {
      setBigPot(false);
    };
  }, [pot]);

  // Observer 목록
  const observers = roomState?.players.filter(p => p.isObserver) ?? [];
  // 올인 플레이어 존재 여부
  const hasAllIn = players.some(p => p.isAllIn);
  // 빅팟 조건
  const isBigPot = pot >= 20000;

  const me = players.find(p => p.id === myPlayerId);
  const opponents = players.filter(p => p.id !== myPlayerId);
  const opponentCells = getOpponentCells(opponents.length);

  return (
    <>
      {/* 데스크톱: 3x3 CSS Grid 레이아웃 */}
      <div
        className="absolute inset-0 hidden md:block overflow-hidden"
        style={{
          backgroundImage: "url('/img/background.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 반투명 블랙 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        {/* 빅팟 내부글로우 오버레이 */}
        {isBigPot && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              boxShadow: 'inset 0 0 80px 20px rgba(245, 158, 11, 0.3), inset 0 0 200px 60px rgba(234, 88, 12, 0.15)',
              transition: 'box-shadow 0.5s ease',
              animation: 'bigpot-pulse 2s ease-in-out infinite',
            }}
          />
        )}

        {/* 내 차례 알림 모달 */}
        {showMyTurnAlert && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="bg-background/80 backdrop-blur-sm border border-primary/40 text-foreground px-10 py-5 rounded-2xl text-2xl font-bold shadow-2xl animate-in fade-in zoom-in duration-300">
              내 차례!
            </div>
          </div>
        )}

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

        {/* 3x3 그리드 레이아웃 */}
        <div className="relative z-[5] h-full px-6">
          <div
            className="h-full"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
            }}
          >
            {/* 상대방 플레이어 배치 */}
            {opponents.map((p, i) => {
              const cell = opponentCells[i];
              if (cell === undefined) return null;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-center p-1"
                  style={{ gridArea: cellToGridArea(cell) }}
                >
                  <PlayerSeat
                    seatIndex={i}
                    totalPlayers={players.length}
                    player={p}
                    isMe={false}
                    isCurrentTurn={p.seatIndex === currentPlayerIndex}
                    visibleCardCount={visibleCardCounts?.[p.id]}
                    mode={mode}
                    dealingComplete={dealingComplete}
                    flippedCardIndices={undefined}
                    isConnected={roomState?.players.find(rp => rp.id === p.id)?.isConnected ?? true}
                  />
                </div>
              );
            })}

            {/* 셀5 (row2/col2): 판돈 표시 */}
            <div
              className="flex items-center justify-center pointer-events-none"
              style={{ gridArea: '2 / 2' }}
            >
              <div className="text-center bg-background/60 border border-border rounded-2xl px-8 py-5 shadow-inner">
                {mode && (
                  <Badge variant="outline" className="border-primary text-primary text-[10px] mb-1">
                    {MODE_LABELS[mode] ?? mode}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground tracking-widest uppercase">판돈</p>
                <p className="text-[36px] font-semibold tabular-nums">{pot.toLocaleString()}원</p>
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

            {/* 내 플레이어: row3 전체 (셀7~9 span) */}
            {me && (
              <div
                className="flex items-center justify-center p-2"
                style={{ gridArea: '3 / 1 / 4 / 4' }}
              >
                <PlayerSeat
                  seatIndex={players.findIndex(p => p.id === myPlayerId)}
                  totalPlayers={players.length}
                  player={me}
                  isMe={true}
                  isCurrentTurn={me.seatIndex === currentPlayerIndex}
                  visibleCardCount={visibleCardCounts?.[me.id]}
                  mode={mode}
                  dealingComplete={dealingComplete}
                  flippedCardIndices={myFlippedCardIndices}
                  isConnected={roomState?.players.find(rp => rp.id === me.id)?.isConnected ?? true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모바일: 전체 높이 채움 */}
      <div
        className="md:hidden h-full relative"
        style={{
          backgroundImage: "url('/img/background.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 반투명 블랙 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        {/* 빅팟 내부글로우 오버레이 (모바일) */}
        {isBigPot && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              boxShadow: 'inset 0 0 80px 20px rgba(245, 158, 11, 0.3), inset 0 0 200px 60px rgba(234, 88, 12, 0.15)',
              transition: 'box-shadow 0.5s ease',
              animation: 'bigpot-pulse 2s ease-in-out infinite',
            }}
          />
        )}

        {/* 내 차례 알림 모달 (모바일) */}
        {showMyTurnAlert && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="bg-background/80 backdrop-blur-sm border border-primary/40 text-foreground px-10 py-5 rounded-2xl text-2xl font-bold shadow-2xl animate-in fade-in zoom-in duration-300">
              내 차례!
            </div>
          </div>
        )}

        {/* Observer 목록 (모바일) */}
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

        {/* 모바일 3x3 CSS Grid */}
        <div
          className="relative z-10 h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: '1fr 1fr 1fr',
          }}
        >
          {/* 상대방 플레이어 배치 */}
          {opponents.map((p, i) => {
            const cell = opponentCells[i];
            if (cell === undefined) return null;
            return (
              <div
                key={p.id}
                className="flex items-center justify-center p-0.5"
                style={{ gridArea: cellToGridArea(cell) }}
              >
                <PlayerSeat
                  seatIndex={i}
                  totalPlayers={players.length}
                  player={p}
                  isMe={false}
                  isCurrentTurn={p.seatIndex === currentPlayerIndex}
                  visibleCardCount={visibleCardCounts?.[p.id]}
                  mode={mode}
                  dealingComplete={dealingComplete}
                  flippedCardIndices={undefined}
                  isConnected={roomState?.players.find(rp => rp.id === p.id)?.isConnected ?? true}
                  compact
                />
              </div>
            );
          })}

          {/* 셀5 (row2/col2): 판돈 + 모드 정보 */}
          <div
            className="flex flex-col items-center justify-center pointer-events-none"
            style={{ gridArea: '2 / 2' }}
          >
            {mode && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-primary text-primary bg-primary/10">
                {MODE_LABELS[mode] ?? mode}
              </span>
            )}
            <span className="font-semibold tabular-nums text-sm mt-0.5">{pot.toLocaleString()}원</span>
            {hasAllIn && <span className="text-[9px] text-muted-foreground">올인 포함</span>}
            {mode === 'shared-card' && sharedCard && (
              <div className="mt-1"><SharedCardDisplay card={sharedCard} /></div>
            )}
          </div>

          {/* 내 플레이어: 셀8 (row3/col2) */}
          {me && (
            <div
              className="flex items-center justify-center p-0.5"
              style={{ gridArea: '3 / 2' }}
            >
              <PlayerSeat
                seatIndex={players.findIndex(p => p.id === myPlayerId)}
                totalPlayers={players.length}
                player={me}
                isMe={true}
                isCurrentTurn={me.seatIndex === currentPlayerIndex}
                visibleCardCount={visibleCardCounts?.[me.id]}
                mode={mode}
                dealingComplete={dealingComplete}
                flippedCardIndices={myFlippedCardIndices}
                isConnected={roomState?.players.find(rp => rp.id === me.id)?.isConnected ?? true}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
