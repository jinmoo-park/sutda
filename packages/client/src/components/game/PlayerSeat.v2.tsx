import React from 'react';
import type { PlayerState, GameMode } from '@sutda/shared';
import { HwatuCard } from '../game/HwatuCard';
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
}

/**
 * PlayerSeat.v2 — D-09 군용담요 컨셉 (Stitch 레이아웃 참조)
 *
 * 레이아웃 구조:
 * - 군용 개인장비 케이스 느낌의 컴팩트 패널
 * - 상단 헤더: 닉네임 + 역할 배지 (선/나)
 * - 카드 영역: HwatuCard 2장 나란히 (3D flip 보존)
 * - 하단 푸터: 칩잔액 + 베팅 액션 배지
 * - 현재 차례: 올리브 그린 테두리 + 상단 액센트 바
 * - 다이: opacity 감소 + 색상 소거
 */
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
}: PlayerSeatProps) {
  const cssAngle = {
    '--angle': `calc(360deg / ${totalPlayers} * ${seatIndex})`,
  } as React.CSSProperties;

  const showCount = visibleCardCount ?? 2;

  const getDealAnimStyle = (cardIdx: number): React.CSSProperties => {
    if (dealingComplete) return {};
    return {
      animation: 'deal-fly-in 0.4s ease-out forwards',
      animationDelay: `${cardIdx * 200}ms`,
      opacity: 0,
    };
  };

  const isFolded = !player.isAlive && !player.isAbsent;

  // ── 공통 컨텐츠 렌더 ──
  const content = (
    <div
      className={cn('relative flex flex-col', isFolded && 'opacity-40')}
      style={{
        minWidth: '6.5rem',
        maxWidth: '9rem',
        background: isCurrentTurn
          ? 'rgba(12,18,5,0.96)'
          : 'rgba(9,13,4,0.90)',
        border: isCurrentTurn
          ? '1px solid hsl(75,55%,42%)'
          : isMe
          ? '1px solid rgba(107,124,46,0.40)'
          : '1px solid rgba(107,124,46,0.20)',
        borderRadius: '2px',
        boxShadow: isCurrentTurn
          ? '0 0 20px rgba(107,124,46,0.45), 0 0 6px rgba(107,124,46,0.20), inset 0 0 10px rgba(0,0,0,0.4)'
          : 'inset 0 0 10px rgba(0,0,0,0.35)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* 현재 차례 상단 액센트 바 */}
      {isCurrentTurn && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, hsl(75,55%,42%) 30%, hsl(75,55%,55%) 50%, hsl(75,55%,42%) 70%, transparent)',
          }}
        />
      )}

      {/* 헤더: 닉네임 + 배지 */}
      <div
        style={{
          padding: '6px 8px 4px',
          borderBottom: '1px solid rgba(107,124,46,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          minWidth: 0,
        }}
      >
        <p
          style={{
            fontFamily: "'KimjungchulMyungjo', serif",
            fontSize: '11px',
            fontWeight: isCurrentTurn ? 600 : 400,
            color: isCurrentTurn ? 'hsl(75,55%,58%)' : isMe ? 'hsl(60,20%,88%)' : 'hsl(60,15%,78%)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
          }}
        >
          {player.nickname}
        </p>

        <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
          {isMe && (
            <span
              style={{
                fontFamily: "'KimjungchulMyungjo', serif",
                fontSize: '9px',
                padding: '1px 4px',
                background: 'rgba(107,124,46,0.18)',
                border: '1px solid rgba(107,124,46,0.55)',
                color: 'hsl(75,55%,52%)',
                borderRadius: '1px',
                letterSpacing: '0.05em',
              }}
            >
              나
            </span>
          )}
          {player.isDealer && (
            <span
              style={{
                fontFamily: "'KimjungchulMyungjo', serif",
                fontSize: '9px',
                padding: '1px 4px',
                background: 'rgba(107,124,46,0.10)',
                border: '1px solid rgba(107,124,46,0.40)',
                color: 'hsl(75,45%,48%)',
                borderRadius: '1px',
              }}
            >
              선
            </span>
          )}
          {player.isAbsent && (
            <span
              style={{
                fontSize: '9px',
                padding: '1px 4px',
                border: '1px solid rgba(107,124,46,0.25)',
                color: 'hsl(70,10%,48%)',
                borderRadius: '1px',
              }}
            >
              자리비움
            </span>
          )}
          {isFolded && (
            <span
              style={{
                fontSize: '9px',
                padding: '1px 4px',
                background: 'rgba(180,40,40,0.10)',
                border: '1px solid rgba(180,40,40,0.50)',
                color: 'hsl(0,65%,55%)',
                borderRadius: '1px',
              }}
            >
              다이
            </span>
          )}
        </div>
      </div>

      {/* 카드 영역 */}
      {player.cards.length > 0 && (
        <div
          style={{
            padding: '6px 8px',
            display: 'flex',
            gap: '4px',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.20)',
          }}
        >
          {Array.from({ length: Math.max(player.cards.length, 2) }, (_, idx) => {
            const visible = idx < showCount;
            const card = player.cards[idx];
            const isOpenedCard = mode === 'three-card' && player.openedCardIndex === idx;
            const showFace =
              card != null &&
              ((isMe && (flippedCardIndices ? flippedCardIndices.has(idx) : false)) ||
                (!isMe && mode === 'indian') ||
                isOpenedCard);
            return (
              <div
                key={idx}
                style={{
                  transition: 'opacity 0.3s ease',
                  opacity: visible ? 1 : 0,
                  filter: isFolded ? 'grayscale(0.6)' : undefined,
                  ...getDealAnimStyle(idx),
                }}
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

      {/* 푸터: 칩잔액 + 베팅 액션 */}
      <div
        style={{
          padding: '4px 8px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        {/* 칩잔액 */}
        <span
          style={{
            fontFamily: "'KimjungchulMyungjo', serif",
            fontSize: '10px',
            color: 'hsl(70,10%,50%)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {player.chips.toLocaleString()}원
        </span>

        {/* 베팅 액션 + 베팅금액 */}
        {player.lastBetAction && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
            {player.lastBetAction.type === 'check' && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 4px',
                  border: '1px solid rgba(56,189,248,0.45)',
                  color: 'rgb(125,211,252)',
                  borderRadius: '1px',
                }}
              >
                체크
              </span>
            )}
            {player.lastBetAction.type === 'call' && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 4px',
                  border: '1px solid rgba(107,124,46,0.55)',
                  color: 'hsl(75,55%,52%)',
                  borderRadius: '1px',
                }}
              >
                콜
              </span>
            )}
            {player.lastBetAction.type === 'raise' && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 4px',
                  border: '1px solid rgba(250,204,21,0.45)',
                  color: 'rgb(253,224,71)',
                  borderRadius: '1px',
                }}
              >
                레이즈{player.lastBetAction.amount ? ` +${player.lastBetAction.amount.toLocaleString()}` : ''}
              </span>
            )}
            {player.lastBetAction.type === 'die' && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 4px',
                  border: '1px solid rgba(180,40,40,0.45)',
                  color: 'hsl(0,65%,55%)',
                  borderRadius: '1px',
                }}
              >
                다이
              </span>
            )}
            {player.currentBet > 0 && (
              <span
                style={{
                  fontFamily: "'KimjungchulMyungjo', serif",
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'rgb(253,224,71)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {player.currentBet.toLocaleString()}원
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 데스크톱: 원형 배치 (타원 테이블 둘레) */}
      <div
        className="absolute hidden md:block"
        style={{
          top: '50%',
          left: '50%',
          marginTop: '-52px',
          marginLeft: '-52px',
          ...cssAngle,
          transform: `rotate(var(--angle)) translateY(clamp(-200px, -23vw, -280px)) rotate(calc(var(--angle) * -1))`,
          transition: 'transform 0.5s ease',
          zIndex: 30,
        }}
      >
        {content}
      </div>

      {/* 모바일: 일반 flex 아이템 */}
      <div className="md:hidden">{content}</div>
    </>
  );
}
