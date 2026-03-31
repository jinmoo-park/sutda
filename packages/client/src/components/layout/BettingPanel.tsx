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

  // 콜 금액 = 현재 베팅 기준액 - 내가 이미 낸 금액
  const callAmount = currentBetAmount - myCurrentBet;
  // 레이즈 시 실제 납부액 = 콜 금액 + 추가 레이즈 금액
  const totalRaisePayment = callAmount + raiseAmount;
  // 버튼 활성화 조건
  const canCheck = callAmount === 0 && isEffectiveSen;
  const canCall = callAmount > 0 || (!isEffectiveSen);
  const canDie = currentBetAmount > 0 || !isEffectiveSen;

  return (
    <div className={cn(
      "p-4 space-y-3 rounded-lg transition-shadow",
      isMyTurn && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_12px_hsl(75_55%_42%/0.35)]"
    )}>
      {!isMyTurn && currentPlayerNickname && (
        <p className="text-sm text-muted-foreground">{currentPlayerNickname}의 차례예요</p>
      )}

      {/* 베팅 현황 표시 */}
      {isMyTurn && (
        <div className="text-sm space-y-0.5">
          {callAmount > 0 && (
            <p className="text-muted-foreground">
              콜: <span className="text-foreground font-medium">{callAmount.toLocaleString()}원</span>
            </p>
          )}
          {raiseAmount > 0 && (
            <p className="text-muted-foreground">
              레이즈 시 납부:{' '}
              <span className="text-primary font-semibold">{totalRaisePayment.toLocaleString()}원</span>
              {callAmount > 0 && (
                <span className="text-xs ml-1">
                  (콜 {callAmount.toLocaleString()} + 추가 {raiseAmount.toLocaleString()})
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* 칩 단위 입력 버튼 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { amount: 500, color: 'bg-gray-400' },
          { amount: 1000, color: 'bg-blue-500' },
          { amount: 5000, color: 'bg-green-500' },
          { amount: 10000, color: 'bg-red-500' },
        ].map(({ amount, color }) => (
          <Button
            key={amount}
            variant="secondary"
            size="sm"
            disabled={!isMyTurn}
            onClick={() => setRaiseAmount((prev) => prev + amount)}
            className="min-h-11"
          >
            <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1`} />
            +{amount.toLocaleString()}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={!isMyTurn || raiseAmount === 0}
          onClick={() => setRaiseAmount(0)}
          className="min-h-11"
        >
          초기화
        </Button>
      </div>

      {/* 현재 입력 금액 */}
      {raiseAmount > 0 && (
        <p className="text-[28px] font-semibold tabular-nums">
          +{raiseAmount.toLocaleString()}원
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 flex-wrap">
        {/* 체크: 선 권한 보유자만 가능 */}
        <Button
          variant="ghost"
          disabled={!isMyTurn || !canCheck}
          onClick={() => emitAction({ type: 'check' })}
          className="min-h-11"
        >
          체크
        </Button>

        {/* 콜: 선이 아닐 때 또는 낼 금액이 있을 때 */}
        <Button
          disabled={!isMyTurn || !canCall}
          onClick={() => emitAction({ type: 'call' })}
          className="min-h-11"
        >
          콜 {callAmount > 0 ? `${callAmount.toLocaleString()}원` : ''}
        </Button>

        {/* 레이즈: 금액 입력해야만 활성화 */}
        <Button
          variant="secondary"
          disabled={!isMyTurn || raiseAmount === 0}
          onClick={() => emitAction({ type: 'raise', amount: raiseAmount })}
          className="min-h-11"
        >
          레이즈 {raiseAmount > 0 ? `(+${raiseAmount.toLocaleString()})` : ''}
        </Button>

        {/* 다이: 선 첫 행동 전에는 비활성 */}
        <Button
          variant="destructive"
          disabled={!isMyTurn || !canDie}
          onClick={() => emitAction({ type: 'die' })}
          className="min-h-11"
        >
          다이
        </Button>
      </div>
    </div>
  );
}
