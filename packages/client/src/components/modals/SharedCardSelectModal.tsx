import { useState, useEffect, useSyncExternalStore } from 'react';
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

const mdQuery = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
const subscribeMd = (cb: () => void) => { mdQuery?.addEventListener('change', cb); return () => mdQuery?.removeEventListener('change', cb); };
const getSnapshotMd = () => mdQuery?.matches ?? false;
function useIsMd() { return useSyncExternalStore(subscribeMd, getSnapshotMd, () => false); }

interface SharedCardSelectModalProps {
  open: boolean;
  roomId: string;
}

export function SharedCardSelectModal({ open, roomId }: SharedCardSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedIndex(null);
    }
  }, [open]);

  const isMd = useIsMd();
  const deck = gameState?.deck ?? [];
  const isDealer =
    gameState?.players.find((p) => p.id === myPlayerId)?.isDealer ?? false;

  const handleSelect = (cardIndex: number) => {
    if (!isDealer || selectedIndex !== null) return;
    setSelectedIndex(cardIndex);
    socket?.emit('set-shared-card', { roomId, cardIndex });
  };

  return (
    <Dialog open={open} modal={false}>
      <DialogContent
        className="max-h-[80vh] overflow-y-auto p-2 md:p-6 w-[92vw] md:w-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-1 md:mb-2">
          <DialogTitle className="text-sm md:text-base">공유 카드 선택</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {isDealer
              ? '모든 플레이어와 공유할 카드를 선택하세요.'
              : '선 플레이어가 공유 카드를 선택 중입니다...'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-0.5 md:gap-2 mt-1">
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
                  <HwatuCard card={deck[i]} faceUp={true} size={isMd ? 'lg' : 'xs'} />
                ) : (
                  <HwatuCard faceUp={false} size={isMd ? 'sm' : 'xxs'} />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
