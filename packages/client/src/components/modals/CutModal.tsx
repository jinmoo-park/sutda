import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CardBack } from '@/components/game/CardBack';

interface CutModalProps {
  open: boolean;
  roomId: string;
}

export function CutModal({ open, roomId }: CutModalProps) {
  const { socket } = useGameStore();
  const [numCuts, setNumCuts] = useState(1);

  const handleDeclareTtong = () => {
    socket?.emit('declare-ttong', { roomId });
  };

  const handleConfirm = () => {
    const deckSize = 20;
    const pileSize = Math.floor(deckSize / numCuts);
    const cutPoints: number[] = [];
    for (let i = 1; i < numCuts; i++) {
      cutPoints.push(pileSize * i);
    }
    // order는 역순 (마지막 더미부터)
    const order = Array.from({ length: numCuts }, (_, i) => numCuts - i);
    socket?.emit('cut', { roomId, cutPoints, order });
  };

  // 각 더미의 카드 수 계산
  const deckSize = 20;
  const piles = Array.from({ length: numCuts }, (_, i) => {
    const pileSize = Math.floor(deckSize / numCuts);
    const remainder = deckSize % numCuts;
    return pileSize + (i < remainder ? 1 : 0);
  });

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>기리 — 카드 더미를 나누세요</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                variant={numCuts === n ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNumCuts(n)}
              >
                {n}더미
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleDeclareTtong}>
            퉁 선언
          </Button>
        </div>

        <div className="flex gap-4 justify-center py-2">
          {piles.map((count, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className="relative" style={{ height: `${Math.min(count * 4 + 24, 80)}px`, width: '64px' }}>
                {Array.from({ length: Math.min(count, 5) }, (_, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{ top: `${i * 4}px`, left: 0 }}
                  >
                    <CardBack className="w-14 h-5" />
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{count}장</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
