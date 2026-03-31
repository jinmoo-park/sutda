import { useState } from 'react';
import type { BetAction } from '@sutda/shared';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
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
  roomId,
  currentPlayerNickname,
  isEffectiveSen,
}: BettingPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(0);

  const emitAction = (action: BetAction) => {
    const socket = useGameStore.getState().socket;
    if (!socket || !isMyTurn) return;
    socket.emit('bet-action', { roomId, action });
    setRaiseAmount(0);
  };

  const callAmount = currentBetAmount - myCurrentBet;
  const totalRaisePayment = callAmount + raiseAmount;
  const canCheck = callAmount === 0 && isEffectiveSen;
  const canCall = callAmount > 0 || !isEffectiveSen;
  const canDie = currentBetAmount > 0 || !isEffectiveSen;

  return (
    <div className={cn(
      'p-3 rounded-lg space-y-2 transition-all duration-200',
      isMyTurn && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_12px_hsl(var(--primary)/0.5)] bg-primary/10"
    )}>
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

      {/* 레이즈 금액 표시 */}
      {raiseAmount > 0 && (
        <p className="text-2xl font-semibold tabular-nums text-primary">
          +{raiseAmount.toLocaleString()}원
          {callAmount > 0 && (
            <span className="text-xs text-muted-foreground font-normal ml-1">
              (총 {totalRaisePayment.toLocaleString()})
            </span>
          )}
        </p>
      )}

      {/* 칩 버튼 — 1×4 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        {CHIP_BUTTONS.map(({ amount, color, label }) => (
          <Button
            key={amount}
            variant="secondary"
            size="sm"
            disabled={!isMyTurn}
            onClick={() => setRaiseAmount((prev) => prev + amount)}
            className={cn('h-9 gap-1 text-xs px-1', !isMyTurn && 'opacity-40')}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
            +{label}
          </Button>
        ))}
      </div>

      {/* 초기화 */}
      {raiseAmount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          disabled={!isMyTurn}
          onClick={() => setRaiseAmount(0)}
          className="w-full h-7 text-xs"
        >
          초기화
        </Button>
      )}

      {/* 액션 버튼 — 1×4 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        <Button
          variant="outline"
          disabled={!isMyTurn || !canCheck}
          onClick={() => emitAction({ type: 'check' })}
          className={cn('h-10 text-sm', !isMyTurn && 'opacity-40')}
        >
          체크
        </Button>

        <Button
          disabled={!isMyTurn || !canCall}
          onClick={() => emitAction({ type: 'call' })}
          className={cn('h-10 text-sm', !isMyTurn && 'opacity-40')}
        >
          콜{callAmount > 0 ? ` ${callAmount.toLocaleString()}` : ''}
        </Button>

        <Button
          variant="secondary"
          disabled={!isMyTurn || raiseAmount === 0}
          onClick={() => emitAction({ type: 'raise', amount: raiseAmount })}
          className={cn('h-10 text-sm', (!isMyTurn || raiseAmount === 0) && 'opacity-40')}
        >
          레이즈
        </Button>

        <Button
          variant="destructive"
          disabled={!isMyTurn || !canDie}
          onClick={() => emitAction({ type: 'die' })}
          className={cn('h-10 text-sm', (!isMyTurn || !canDie) && 'opacity-40')}
        >
          다이
        </Button>
      </div>
    </div>
  );
}
