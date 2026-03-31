import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CardFace } from '@/components/game/CardFace';
import { cn } from '@/lib/utils';

interface SejangCardSelectModalProps {
  open: boolean;
  roomId: string;
}

export function SejangCardSelectModal({ open, roomId }: SejangCardSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const cards = myPlayer?.cards ?? [];
  const alreadySelected = (myPlayer?.selectedCards?.length ?? 0) >= 2;

  useEffect(() => {
    if (open) {
      setSelectedIndices([]);
      setSubmitting(false);
    }
  }, [open]);

  const toggleCard = (idx: number) => {
    if (alreadySelected || submitting) return;
    setSelectedIndices(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : prev.length < 2
        ? [...prev, idx]
        : prev
    );
  };

  const handleSubmit = () => {
    if (selectedIndices.length !== 2 || submitting) return;
    setSubmitting(true);
    socket?.emit('select-cards', { roomId, cardIndices: selectedIndices });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>세장섯다 — 2장을 선택하세요</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">
          {alreadySelected
            ? '선택 완료! 다른 플레이어를 기다리는 중...'
            : `3장 중 2장을 선택하세요 (${selectedIndices.length}/2)`}
        </p>
        <div className="flex justify-center gap-4 mt-4">
          {cards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => toggleCard(idx)}
              disabled={alreadySelected || submitting}
              className={cn(
                'rounded-md transition-all',
                alreadySelected
                  ? 'cursor-not-allowed opacity-40'
                  : selectedIndices.includes(idx)
                  ? 'ring-2 ring-primary scale-105 cursor-pointer'
                  : 'opacity-70 hover:opacity-100 hover:ring-1 hover:ring-primary/50 cursor-pointer'
              )}
            >
              {card !== null ? (
                <CardFace card={card} />
              ) : (
                <div className="w-16 h-24 bg-muted rounded-md" />
              )}
            </button>
          ))}
        </div>
        {!alreadySelected && (
          <div className="flex justify-center mt-4">
            <Button
              disabled={selectedIndices.length !== 2 || submitting}
              onClick={handleSubmit}
            >
              {submitting ? '처리 중...' : '선택 완료'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
