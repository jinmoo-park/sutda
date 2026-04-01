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
 * PlayerSeat.v2 — D-09 군용담요 컨셉
 *
 * 디자인 방향:
 * - 군용 올리브 다크 배경의 컴팩트 시트
 * - 명조 폰트(KimjungchulMyungjo) 닉네임
 * - 현재 차례: 올리브 그린(hsl(75,55%,42%)) 테두리 + glow
 * - 다이 상태: opacity 감소 + 색상 소거
 * - 베팅 액션 배지: 군용 색조 (체크=스카이, 콜=올리브, 레이즈=옐로, 다이=레드)
 * - HwatuCard 컴포넌트 사용 (3D flip 보존)
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

  // D-09 군용담요 시트 스타일
  const seatStyle: React.CSSProperties = {
    background: isCurrentTurn
      ? 'rgba(14,20,6,0.92)'
      : 'rgba(12,16,5,0.85)',
    border: isCurrentTurn
      ? '1px solid hsl(75,55%,42%)'
      : '1px solid rgba(107,124,46,0.25)',
    borderRadius: '2px',
    boxShadow: isCurrentTurn
      ? '0 0 16px rgba(107,124,46,0.5), inset 0 0 8px rgba(0,0,0,0.4)'
      : 'inset 0 0 8px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
  };

  const content = (
    <div
      className={cn(
        'w-auto min-w-[7rem] p-2 space-y-1',
        !player.isAlive && 'opacity-40'
      )}
      style={seatStyle}
    >
      {/* 닉네임 행 */}
      <div className="flex items-center gap-1">
        <p
          className="text-xs font-semibold truncate flex-1"
          style={{
            color: isCurrentTurn ? 'hsl(75,55%,52%)' : 'hsl(60,20%,88%)',
            fontFamily: "'KimjungchulMyungjo', serif",
          }}
        >
          {player.nickname}
          {isMe && (
            <span
              className="ml-1 text-xs"
              style={{ color: 'hsl(75,55%,42%)' }}
            >
              [나]
            </span>
          )}
        </p>

        {/* 역할 배지 */}
        {player.isDealer && (
          <span
            className="text-[9px] px-1 py-0 shrink-0 leading-tight"
            style={{
              border: '1px solid rgba(107,124,46,0.6)',
              color: 'hsl(75,55%,52%)',
              borderRadius: '1px',
              fontFamily: "'KimjungchulMyungjo', serif",
            }}
          >
            선
          </span>
        )}
        {player.isAbsent && (
          <span
            className="text-[9px] px-1 py-0 shrink-0 leading-tight"
            style={{
              border: '1px solid rgba(107,124,46,0.3)',
              color: 'hsl(70,10%,55%)',
              borderRadius: '1px',
            }}
          >
            자리비움
          </span>
        )}
        {!player.isAlive && !player.isAbsent && (
          <span
            className="text-[9px] px-1 py-0 shrink-0 leading-tight"
            style={{
              border: '1px solid rgba(180,40,40,0.6)',
              color: 'hsl(0,72%,60%)',
              borderRadius: '1px',
            }}
          >
            다이
          </span>
        )}
      </div>

      {/* 카드 영역 — HwatuCard 사용 (3D flip 보존) */}
      {player.cards.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: Math.max(player.cards.length, 2) }, (_, idx) => {
            const visible = idx < showCount;
            const card = player.cards[idx];
            // 세장섯다: openedCardIndex가 있으면 해당 카드 전원 공개
            const isOpenedCard = mode === 'three-card' && player.openedCardIndex === idx;
            // 내 카드: flip 동기화 | 상대 카드: 인디언 모드 또는 공개 카드만 앞면
            const showFace =
              card != null &&
              ((isMe && (flippedCardIndices ? flippedCardIndices.has(idx) : false)) ||
                (!isMe && mode === 'indian') ||
                isOpenedCard);
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

      {/* 칩 잔액 */}
      <p
        className="text-xs tabular-nums"
        style={{ color: 'hsl(70,10%,55%)', fontFamily: "'KimjungchulMyungjo', serif" }}
      >
        {player.chips.toLocaleString()}원
      </p>

      {/* 베팅 액션 배지 */}
      {player.lastBetAction && (
        <div className="flex items-center gap-1 flex-wrap">
          {player.lastBetAction.type === 'check' && (
            <span
              className="text-[9px] px-1 py-0 leading-tight"
              style={{ border: '1px solid rgba(56,189,248,0.5)', color: 'rgb(125,211,252)', borderRadius: '1px' }}
            >
              체크
            </span>
          )}
          {player.lastBetAction.type === 'call' && (
            <span
              className="text-[9px] px-1 py-0 leading-tight"
              style={{ border: '1px solid rgba(107,124,46,0.6)', color: 'hsl(75,55%,52%)', borderRadius: '1px' }}
            >
              콜
            </span>
          )}
          {player.lastBetAction.type === 'raise' && (
            <span
              className="text-[9px] px-1 py-0 leading-tight"
              style={{ border: '1px solid rgba(250,204,21,0.5)', color: 'rgb(253,224,71)', borderRadius: '1px' }}
            >
              레이즈{player.lastBetAction.amount ? ` +${player.lastBetAction.amount.toLocaleString()}` : ''}
            </span>
          )}
          {player.lastBetAction.type === 'die' && (
            <span
              className="text-[9px] px-1 py-0 leading-tight"
              style={{ border: '1px solid rgba(180,40,40,0.5)', color: 'hsl(0,72%,60%)', borderRadius: '1px' }}
            >
              다이
            </span>
          )}
          {player.currentBet > 0 && (
            <span
              className="text-xs tabular-nums font-semibold"
              style={{ color: 'rgb(253,224,71)', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              {player.currentBet.toLocaleString()}원
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 데스크톱: 원형 배치 */}
      <div
        className="absolute top-1/2 left-1/2 -mt-14 -ml-14 hidden md:block transition-transform duration-500"
        style={{
          ...style,
          transform: `rotate(var(--angle)) translateY(-220px) rotate(calc(var(--angle) * -1))`,
        }}
      >
        {content}
      </div>

      {/* 모바일: 일반 flex 아이템 */}
      <div className="md:hidden">{content}</div>
    </>
  );
}
