import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HwatuCard } from '@/components/game/HwatuCard';
import { cn } from '@/lib/utils';

interface SejangOpenCardModalProps {
  open: boolean;
  roomId: string;
}

export function SejangOpenCardModal({ open, roomId }: SejangOpenCardModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();
  const [submitting, setSubmitting] = useState(false);

  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const cards = myPlayer?.cards ?? [];
  const alreadyOpened = myPlayer?.openedCardIndex !== undefined;

  useEffect(() => {
    if (open) setSubmitting(false);
  }, [open]);

  const handleSelect = (cardIndex: 0 | 1) => {
    if (alreadyOpened || submitting) return;
    setSubmitting(true);
    socket?.emit('open-sejang-card', { roomId, cardIndex });
  };

  return (
    <Dialog open={open} modal={false}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>세장섯다 — 공개할 카드를 선택하세요</DialogTitle>
        </DialogHeader>

        {alreadyOpened ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            선택 완료! 다른 플레이어를 기다리는 중...
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              2장 중 1장을 상대방에게 공개합니다
            </p>
            <div className="flex justify-center gap-6 mt-4">
              {cards.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx as 0 | 1)}
                  disabled={submitting}
                  className={cn(
                    'rounded-md transition-all cursor-pointer',
                    submitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:ring-2 hover:ring-primary hover:scale-105'
                  )}
                >
                  {card !== null ? (
                    <HwatuCard card={card} faceUp={true} size="md" />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded-md" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              클릭한 카드가 상대방에게 공개됩니다
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
