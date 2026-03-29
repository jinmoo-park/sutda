import { useState } from 'react';
import type { BetAction } from '@sutda/shared';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

interface BettingPanelProps {
  isMyTurn: boolean;
  currentBetAmount: number;
  myChips: number;
  roomId: string;
  effectiveMaxBet?: number;
  currentPlayerNickname?: string;
}

export function BettingPanel({
  isMyTurn,
  currentBetAmount,
  roomId,
  currentPlayerNickname,
}: BettingPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(0);

  const emitAction = (action: BetAction) => {
    const socket = useGameStore.getState().socket;
    if (!socket || !isMyTurn) return;
    socket.emit('bet-action', { roomId, action });
    setRaiseAmount(0);
  };

  return (
    <div className="p-4 space-y-3">
      {!isMyTurn && currentPlayerNickname && (
        <p className="text-sm text-muted-foreground">{currentPlayerNickname}의 차례예요</p>
      )}

      {/* 칩 단위 입력 버튼 */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          disabled={!isMyTurn}
          onClick={() => setRaiseAmount((prev) => prev + 500)}
          className="min-h-11"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1" />
          +500
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!isMyTurn}
          onClick={() => setRaiseAmount((prev) => prev + 1000)}
          className="min-h-11"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
          +1,000
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!isMyTurn}
          onClick={() => setRaiseAmount((prev) => prev + 5000)}
          className="min-h-11"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
          +5,000
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!isMyTurn}
          onClick={() => setRaiseAmount((prev) => prev + 10000)}
          className="min-h-11"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
          +10,000
        </Button>
      </div>

      {/* 현재 입력 금액 */}
      <div className="flex items-center gap-2">
        <p className="text-[28px] font-semibold tabular-nums">{raiseAmount.toLocaleString()}원</p>
        <Button
          variant="ghost"
          size="sm"
          disabled={!isMyTurn}
          onClick={() => setRaiseAmount(0)}
        >
          초기화
        </Button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 flex-wrap">
        <Button
          disabled={!isMyTurn}
          onClick={() => emitAction({ type: 'call' })}
          className="min-h-11"
        >
          콜
        </Button>
        <Button
          variant="secondary"
          disabled={!isMyTurn}
          onClick={() => emitAction({ type: 'raise', amount: raiseAmount })}
          className="min-h-11"
        >
          레이즈
        </Button>
        <Button
          variant="destructive"
          disabled={!isMyTurn}
          onClick={() => emitAction({ type: 'die' })}
          className="min-h-11"
        >
          다이
        </Button>
        {currentBetAmount === 0 && (
          <Button
            variant="ghost"
            disabled={!isMyTurn}
            onClick={() => emitAction({ type: 'check' })}
            className="min-h-11"
          >
            체크
          </Button>
        )}
      </div>
    </div>
  );
}
