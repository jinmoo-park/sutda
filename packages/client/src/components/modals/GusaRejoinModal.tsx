import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';

interface GusaRejoinModalProps {
  roomId: string;
  potAmount: number;
  myChips: number;
}

export function GusaRejoinModal({ roomId, potAmount, myChips }: GusaRejoinModalProps) {
  const { socket } = useGameStore();
  const [countdown, setCountdown] = useState(15);
  const [decided, setDecided] = useState(false);

  const rejoinCost = Math.floor(potAmount / 2);
  const canAfford = myChips >= rejoinCost;

  const handleJoin = () => {
    if (decided) return;
    setDecided(true);
    socket?.emit('gusa-rejoin', { roomId, join: true });
  };

  const handleDecline = () => {
    if (decided) return;
    setDecided(true);
    socket?.emit('gusa-rejoin', { roomId, join: false });
  };

  useEffect(() => {
    if (decided) return;
    if (countdown <= 0) {
      handleDecline();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, decided]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 flex flex-col items-center gap-4 max-w-sm mx-4">
        <h3 className="text-lg font-bold">구사 재경기</h3>
        <p className="text-sm text-center text-muted-foreground">
          판돈 {potAmount.toLocaleString()}원의 절반 ={' '}
          <span className="font-bold text-foreground">{rejoinCost.toLocaleString()}원</span>을 내고
          재참여하시겠습니까?
        </p>
        {!canAfford && (
          <p className="text-sm text-red-500">잔액 부족으로 참여할 수 없습니다</p>
        )}
        <p className="text-xs text-muted-foreground">{countdown}초 후 자동 거절</p>
        {!decided ? (
          <div className="flex gap-3">
            <Button onClick={handleJoin} disabled={!canAfford}>
              참여
            </Button>
            <Button variant="ghost" onClick={handleDecline}>
              거절
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">결정 완료</p>
        )}
      </div>
    </div>
  );
}
