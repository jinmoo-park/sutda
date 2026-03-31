import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { HwatuCard } from '@/components/game/HwatuCard';
import { cn } from '@/lib/utils';

interface SharedCardSelectModalProps {
  open: boolean;
  roomId: string;
}

export function SharedCardSelectModal({ open, roomId }: SharedCardSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const deck = gameState?.deck ?? [];
  const isDealer =
    gameState?.players.find((p) => p.id === myPlayerId)?.isDealer ?? false;

  const handleSelect = (cardIndex: number) => {
    if (!isDealer || selectedIndex !== null) return;
    setSelectedIndex(cardIndex);
    socket?.emit('set-shared-card', { roomId, cardIndex });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>공유 카드 선택</DialogTitle>
          <DialogDescription>
            {isDealer
              ? '모든 플레이어와 공유할 카드를 선택하세요.'
              : '선 플레이어가 공유 카드를 선택 중입니다...'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Array.from({ length: 20 }, (_, i) => {
            const isSelected = selectedIndex === i;
            const disabled = !isDealer || selectedIndex !== null;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={disabled}
                className={cn(
                  'rounded-md transition-opacity',
                  disabled && !isSelected
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:ring-2 hover:ring-primary',
                  isSelected && 'opacity-100 ring-2 ring-primary'
                )}
              >
                {isDealer && deck[i] ? (
                  <HwatuCard card={deck[i]} faceUp={true} size="lg" />
                ) : (
                  <HwatuCard faceUp={false} size="sm" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
