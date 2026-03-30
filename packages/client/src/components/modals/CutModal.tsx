import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

interface CutModalProps {
  open: boolean;
  roomId: string;
}

type CutChoice = 2 | 3 | 4 | 5 | 'ttong';

const CHOICES: { value: CutChoice; label: string }[] = [
  { value: 2, label: '2더미' },
  { value: 3, label: '3더미' },
  { value: 4, label: '4더미' },
  { value: 5, label: '5더미' },
  { value: 'ttong', label: '퉁' },
];

export function CutModal({ open, roomId }: CutModalProps) {
  const { socket } = useGameStore();
  const [choice, setChoice] = useState<CutChoice>(2);
  const [pileOrder, setPileOrder] = useState<number[]>([1, 0]);

  useEffect(() => {
    if (choice !== 'ttong') {
      setPileOrder(Array.from({ length: choice }, (_, i) => choice - 1 - i));
    }
  }, [choice]);

  const handleConfirm = () => {
    if (choice === 'ttong') {
      socket?.emit('declare-ttong', { roomId });
    } else {
      const deckSize = 20;
      const pileSize = Math.floor(deckSize / choice);
      const cutPoints: number[] = [];
      for (let i = 1; i < choice; i++) {
        cutPoints.push(pileSize * i);
      }
      socket?.emit('cut', { roomId, cutPoints, order: pileOrder });
    }
  };

  const handlePileClick = (idx: number) => {
    if (choice === 'ttong') return;
    setPileOrder((prev) => {
      if (prev.includes(idx)) return prev.filter((p) => p !== idx);
      return [...prev, idx];
    });
  };

  const numCuts = choice === 'ttong' ? 0 : choice;
  const deckSize = 20;
  const piles = numCuts > 0
    ? Array.from({ length: numCuts }, (_, i) => {
        const pileSize = Math.floor(deckSize / numCuts);
        const remainder = deckSize % numCuts;
        return pileSize + (i < remainder ? 1 : 0);
      })
    : [];

  const allSelected = choice === 'ttong' || pileOrder.length === numCuts;

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>기리</DialogTitle>
        </DialogHeader>

        {/* 선택지 5개 */}
        <div className="flex gap-2 justify-center flex-wrap">
          {CHOICES.map(({ value, label }) => (
            <Button
              key={String(value)}
              variant={choice === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChoice(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* 더미 시각화 (퉁이 아닐 때) */}
        {choice !== 'ttong' && (
          <>
            <p className="text-xs text-muted-foreground text-center">
              더미를 클릭해 조합 순서를 정하세요 (아래→위)
            </p>
            <div className="flex gap-4 justify-center py-2">
              {piles.map((count, idx) => {
                const orderPos = pileOrder.indexOf(idx);
                const isSelected = orderPos !== -1;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePileClick(idx)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md p-1 transition-all',
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'ring-1 ring-border opacity-50 hover:opacity-80'
                    )}
                  >
                    <div className="relative" style={{ height: `${Math.min(count * 4 + 24, 80)}px`, width: '56px' }}>
                      {Array.from({ length: Math.min(count, 5) }, (_, i) => (
                        <div key={i} className="absolute" style={{ top: `${i * 4}px`, left: 0 }}>
                          <CardBack className="w-14 h-5" />
                        </div>
                      ))}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-10">
                          {orderPos + 1}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{count}장</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 퉁 설명 */}
        {choice === 'ttong' && (
          <p className="text-sm text-muted-foreground text-center py-4">
            기리 없이 두 장씩 나눠받습니다.
          </p>
        )}

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!allSelected}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
