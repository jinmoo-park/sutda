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

/**
 * GameTable.v2 — D-09 군용담요 컨셉
 *
 * 디자인 방향:
 * - 어두운 올리브 배경(hsl(70,15%,8%)) 위에 플레이어 원형 배치
 * - 중앙 POT 표시: 군용 메탈릭 느낌의 테두리, 명조 폰트
 * - 현재 차례 플레이어: 올리브 그린(hsl(75,55%,42%)) glow
 * - background.jpg 이미지 + 올리브 다크 오버레이
 * - 각진 엣지 최소 radius, 군용 유틸리타리안 미학
 */
export function GameTable({
  players,
  myPlayerId,
  currentPlayerIndex,
  pot,
  visibleCardCounts,
  sharedCard,
  mode,
  dealingComplete = true,
  myFlippedCardIndices,
}: GameTableProps) {
  return (
    <>
      {/* 데스크톱: 전체 화면 채움 — 배경이미지 + 올리브 오버레이 + 원형 플레이어 배치 */}
      <div
        className="absolute inset-0 hidden md:flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/img/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* D-09 군용담요 오버레이 — 올리브 다크 반투명 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(20,26,10,0.82) 0%, rgba(15,20,8,0.78) 50%, rgba(18,24,9,0.82) 100%)',
          }}
        />

        {/* 게임판 외곽선 — 군용 캔버스 질감 표현 */}
        <div
          className="absolute inset-8 pointer-events-none rounded-sm"
          style={{
            border: '1px solid rgba(107,124,46,0.25)',
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.5)',
          }}
        />

        {/* 중앙 팟 표시 — D-09 군용 스타일 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="text-center px-6 py-4"
            style={{
              background: 'rgba(14,18,7,0.75)',
              border: '1px solid rgba(107,124,46,0.4)',
              borderRadius: '2px',
              boxShadow: '0 0 20px rgba(107,124,46,0.15), inset 0 0 12px rgba(0,0,0,0.4)',
            }}
          >
            <p
              className="text-[10px] tracking-[0.35em] uppercase mb-1"
              style={{ color: 'hsl(70,10%,55%)', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              판돈
            </p>
            <p
              className="text-[28px] font-bold tabular-nums"
              style={{ color: 'hsl(45,95%,60%)', fontFamily: "'KimjungchulMyungjo', serif", textShadow: '0 0 12px rgba(250,204,21,0.4)' }}
            >
              {pot.toLocaleString()}원
            </p>
            {mode === 'shared-card' && sharedCard && (
              <div className="mt-3 flex justify-center">
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
        {/* D-09 올리브 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(14,18,7,0.80)' }}
        />

        <div className="relative z-10 space-y-2 p-3 h-full flex flex-col">
          {/* 팟 한줄 표시 */}
          <div
            className="text-center py-2 px-4 mx-auto"
            style={{
              background: 'rgba(14,18,7,0.7)',
              border: '1px solid rgba(107,124,46,0.35)',
              borderRadius: '2px',
            }}
          >
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{ color: 'hsl(70,10%,55%)', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              판돈{' '}
            </span>
            <span
              className="font-bold tabular-nums text-sm"
              style={{ color: 'hsl(45,95%,60%)', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              {pot.toLocaleString()}원
            </span>
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
