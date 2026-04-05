import { useState } from 'react';
import type { BetAction } from '@sutda/shared';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { useSfxPlayer } from '@/hooks/useSfxPlayer';
import { cn } from '@/lib/utils';

interface BettingPanelProps {
  isMyTurn: boolean;
  currentBetAmount: number;
  myCurrentBet: number;
  myChips: number;
  roomId: string;
  effectiveMaxBet?: number;
  currentPlayerNickname?: string;
  isEffectiveSen: boolean;
}

const CHIP_BUTTONS = [
  { amount: 500,   color: 'bg-zinc-400',   label: '500' },
  { amount: 1000,  color: 'bg-blue-500',   label: '1천' },
  { amount: 5000,  color: 'bg-green-500',  label: '5천' },
  { amount: 10000, color: 'bg-red-500',    label: '1만' },
];

export function BettingPanel({
  isMyTurn,
  currentBetAmount,
  myCurrentBet,
  myChips,
  roomId,
  currentPlayerNickname,
  isEffectiveSen,
}: BettingPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const { gameState, myPlayerId } = useGameStore();
  const { play } = useSfxPlayer();
  const me = gameState?.players.find(p => p.id === myPlayerId);
  const isMyAllIn = me?.isAllIn ?? false;

  const callAmount = currentBetAmount - myCurrentBet;
  // 내 잔액에서 콜금액을 뺀 나머지가 최대 레이즈 가능 금액
  const maxRaiseAmount = Math.max(0, myChips - callAmount);

  const emitAction = (action: BetAction) => {
    const socket = useGameStore.getState().socket;
    if (!socket || !isMyTurn) return;
    socket.emit('bet-action', { roomId, action });
    setRaiseAmount(0);
  };

  const totalRaisePayment = callAmount + raiseAmount;
  const canCheck = callAmount === 0 && isEffectiveSen;
  const canCall = callAmount > 0 || !isEffectiveSen;
  const canDie = currentBetAmount > 0 || !isEffectiveSen;

  return (
    <div
      className={cn(
        'p-3 rounded-lg space-y-2 transition-all duration-200 border',
        isMyTurn && !isMyAllIn
          ? 'betting-active border-primary ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20'
          : 'border-transparent',
        isMyAllIn && 'opacity-50 pointer-events-none'
      )}
    >
      {isMyAllIn && (
        <p className="text-sm text-muted-foreground text-center">올인 — 베팅 종료</p>
      )}
      {/* 상태 표시 */}
      <div className="flex items-center justify-between">
        <p className={cn('text-xs font-semibold', isMyTurn ? 'text-primary' : 'text-muted-foreground')}>
          {isMyTurn ? '내 차례' : currentPlayerNickname ? `${currentPlayerNickname} 차례` : '대기 중'}
        </p>
        {callAmount > 0 && isMyTurn && (
          <span className="text-xs text-muted-foreground">
            콜 <span className="text-foreground font-semibold">{callAmount.toLocaleString()}원</span>
          </span>
        )}
      </div>

      {/* 레이즈 금액 + 초기화 버튼 인라인 */}
      {raiseAmount > 0 && (
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold tabular-nums text-primary flex-1">
            +{raiseAmount.toLocaleString()}원
            {callAmount > 0 && (
              <span className="text-xs text-muted-foreground font-normal ml-1">
                (총 {totalRaisePayment.toLocaleString()})
              </span>
            )}
          </p>
          <button
            disabled={!isMyTurn}
            onClick={() => setRaiseAmount(0)}
            className="text-xs border border-border rounded px-3 py-2 min-h-[44px] text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30"
          >
            초기화
          </button>
        </div>
      )}

      {/* 칩 버튼 — 1×4 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        {CHIP_BUTTONS.map(({ amount, color, label }) => {
          const chipDisabled = !isMyTurn || raiseAmount >= maxRaiseAmount;
          return (
            <Button
              key={amount}
              variant="secondary"
              size="sm"
              disabled={chipDisabled}
              onClick={() => { play('chip'); setRaiseAmount((prev) => Math.min(prev + amount, maxRaiseAmount)); }}
              className={cn('h-auto py-3 md:py-2.5 flex-col gap-1 text-xs px-1', chipDisabled && 'opacity-20 pointer-events-none')}
            >
              <span className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
              <span>+{label}</span>
            </Button>
          );
        })}
      </div>
      {/* 올인 뱃지 — raiseAmount가 최대에 달했을 때 */}
      {isMyTurn && raiseAmount > 0 && raiseAmount >= maxRaiseAmount && (
        <p className="text-xs text-center text-primary font-semibold">올인</p>
      )}


      {/* 액션 버튼 — 1×4 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        <Button
          variant="outline"
          disabled={!isMyTurn || !canCheck}
          onClick={() => { play('bet-check'); emitAction({ type: 'check' }); }}
          className={cn('h-14 md:h-12 text-sm', !isMyTurn && 'opacity-20')}
        >
          체크
        </Button>

        <Button
          variant="secondary"
          disabled={!isMyTurn || !canCall}
          onClick={() => { play('bet-call'); emitAction({ type: 'call' }); }}
          className={cn('h-14 md:h-12 text-sm', !isMyTurn && 'opacity-20')}
        >
          콜{callAmount > 0 ? ` ${callAmount.toLocaleString()}` : ''}
        </Button>

        <Button
          variant="secondary"
          disabled={!isMyTurn || raiseAmount === 0}
          onClick={() => { play('bet-raise'); emitAction({ type: 'raise', amount: raiseAmount }); }}
          className={cn('h-14 md:h-12 text-sm bg-yellow-400 hover:bg-yellow-500 text-primary-foreground', (!isMyTurn || raiseAmount === 0) && 'opacity-20')}
        >
          레이즈
        </Button>

        <Button
          variant="destructive"
          disabled={!isMyTurn || !canDie}
          onClick={() => { play('bet-die'); emitAction({ type: 'die' }); }}
          className={cn('h-14 md:h-12 text-sm', (!isMyTurn || !canDie) && 'opacity-20')}
        >
          다이
        </Button>
      </div>
    </div>
  );
}
