import React from 'react';
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
 * GameTable.v2 — D-09 군용담요 컨셉 (Stitch 레이아웃 참조)
 *
 * 레이아웃 구조:
 * - 전체 화면: background.jpg + 올리브 다크 그레디언트 오버레이
 * - 중앙 타원형 게임판 felt 영역 (군용 녹색 원단)
 * - 타원 외곽: 올리브 그린 테두리 + subtle glow
 * - 중앙 POT 패널: 어두운 박스 + 노란 금액 + 한국어 레이블
 * - 플레이어 시트: 타원 둘레를 따라 원형 배치
 * - 모서리 장식: 군용 코너 마커 (십자 타겟 느낌)
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
      {/* ── 데스크톱: 전체 화면 게임 테이블 ── */}
      <div
        className="absolute inset-0 hidden md:block overflow-hidden"
        style={{
          backgroundImage: "url('/img/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 레이어 1: 올리브 다크 베이스 오버레이 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(8,13,4,0.88) 0%, rgba(14,20,7,0.82) 40%, rgba(10,15,5,0.90) 100%)',
          }}
        />

        {/* 레이어 2: 미세 그리드 패턴 (군용 캔버스 질감) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(107,124,46,0.04) 39px, rgba(107,124,46,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(107,124,46,0.04) 39px, rgba(107,124,46,0.04) 40px)',
            pointerEvents: 'none',
          }}
        />

        {/* 레이어 3: 코너 비네트 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        {/* 중앙 타원형 게임판 felt */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(480px, 62vw, 820px)',
            height: 'clamp(300px, 42vw, 540px)',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 45% 40%, rgba(26,38,10,0.95) 0%, rgba(16,24,7,0.98) 60%, rgba(10,15,4,1) 100%)',
            border: '2px solid rgba(107,124,46,0.35)',
            boxShadow:
              '0 0 60px rgba(107,124,46,0.12), 0 0 120px rgba(0,0,0,0.8), inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 20px rgba(107,124,46,0.05)',
          }}
        />

        {/* 타원 내부 테두리 장식선 */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(460px, 59vw, 790px)',
            height: 'clamp(280px, 39vw, 510px)',
            borderRadius: '50%',
            border: '1px solid rgba(107,124,46,0.15)',
          }}
        />

        {/* 중앙 POT 패널 */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              padding: '14px 28px',
              background: 'rgba(6,10,3,0.92)',
              border: '1px solid rgba(107,124,46,0.50)',
              borderRadius: '2px',
              boxShadow:
                '0 0 24px rgba(107,124,46,0.18), 0 4px 24px rgba(0,0,0,0.6), inset 0 0 16px rgba(0,0,0,0.5)',
              minWidth: '130px',
              textAlign: 'center',
            }}
          >
            {/* 코너 마커 장식 */}
            <div
              style={{
                position: 'absolute',
                top: '-1px',
                left: '-1px',
                width: '8px',
                height: '8px',
                borderTop: '2px solid rgba(107,124,46,0.7)',
                borderLeft: '2px solid rgba(107,124,46,0.7)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-1px',
                right: '-1px',
                width: '8px',
                height: '8px',
                borderTop: '2px solid rgba(107,124,46,0.7)',
                borderRight: '2px solid rgba(107,124,46,0.7)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-1px',
                left: '-1px',
                width: '8px',
                height: '8px',
                borderBottom: '2px solid rgba(107,124,46,0.7)',
                borderLeft: '2px solid rgba(107,124,46,0.7)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: '8px',
                height: '8px',
                borderBottom: '2px solid rgba(107,124,46,0.7)',
                borderRight: '2px solid rgba(107,124,46,0.7)',
              }}
            />

            <p
              style={{
                fontFamily: "'KimjungchulMyungjo', serif",
                fontSize: '10px',
                letterSpacing: '0.38em',
                textTransform: 'uppercase',
                color: 'hsl(70,10%,50%)',
                marginBottom: '6px',
              }}
            >
              판돈
            </p>
            <p
              style={{
                fontFamily: "'KimjungchulMyungjo', serif",
                fontSize: 'clamp(22px, 2.2vw, 32px)',
                fontWeight: 700,
                color: 'hsl(45,95%,62%)',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 0 18px rgba(250,204,21,0.35)',
                lineHeight: 1.1,
              }}
            >
              {pot.toLocaleString()}
              <span
                style={{
                  fontSize: '0.5em',
                  fontWeight: 400,
                  marginLeft: '3px',
                  color: 'hsl(45,75%,50%)',
                }}
              >
                원
              </span>
            </p>

            {mode === 'shared-card' && sharedCard && (
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
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

        {/* 화면 상단 모드 표시 */}
        {mode && mode !== 'original' && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            style={{
              padding: '4px 16px',
              background: 'rgba(6,10,3,0.88)',
              border: '1px solid rgba(107,124,46,0.35)',
              borderRadius: '1px',
            }}
          >
            <span
              style={{
                fontFamily: "'KimjungchulMyungjo', serif",
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: 'hsl(75,55%,52%)',
              }}
            >
              {mode === 'three-card' && '세장섯다'}
              {mode === 'shared-card' && '한장공유'}
              {mode === 'golla' && '골라골라'}
              {mode === 'indian' && '인디언섯다'}
            </span>
          </div>
        )}
      </div>

      {/* ── 모바일: 수직 레이아웃 ── */}
      <div
        className="md:hidden h-full relative"
        style={{
          backgroundImage: "url('/img/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 올리브 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(10,14,5,0.84)' }}
        />

        <div className="relative z-10 h-full flex flex-col p-2 gap-2">
          {/* 팟 + 모드 헤더 */}
          <div className="flex items-center justify-between px-2">
            <div
              style={{
                padding: '6px 14px',
                background: 'rgba(6,10,3,0.90)',
                border: '1px solid rgba(107,124,46,0.40)',
                borderRadius: '1px',
              }}
            >
              <span
                style={{
                  fontFamily: "'KimjungchulMyungjo', serif",
                  fontSize: '10px',
                  letterSpacing: '0.3em',
                  color: 'hsl(70,10%,50%)',
                }}
              >
                판돈{' '}
              </span>
              <span
                style={{
                  fontFamily: "'KimjungchulMyungjo', serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'hsl(45,95%,62%)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pot.toLocaleString()}원
              </span>
            </div>
            {mode && mode !== 'original' && (
              <span
                style={{
                  fontFamily: "'KimjungchulMyungjo', serif",
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: 'hsl(75,55%,50%)',
                  padding: '4px 8px',
                  border: '1px solid rgba(107,124,46,0.30)',
                  background: 'rgba(6,10,3,0.80)',
                }}
              >
                {mode === 'three-card' && '세장섯다'}
                {mode === 'shared-card' && '한장공유'}
                {mode === 'golla' && '골라골라'}
                {mode === 'indian' && '인디언섯다'}
              </span>
            )}
          </div>

          {mode === 'shared-card' && sharedCard && (
            <div className="flex justify-center py-1">
              <SharedCardDisplay card={sharedCard} />
            </div>
          )}

          {/* 플레이어 그리드 */}
          <div className="grid grid-cols-2 gap-2 flex-1">
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
