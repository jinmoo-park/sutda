import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardBack } from '@/components/game/CardBack';
import { CardFace } from '@/components/game/CardFace';
import { cn } from '@/lib/utils';

interface DealerSelectModalProps {
  open: boolean;
  roomId: string;
}

export function DealerSelectModal({ open, roomId }: DealerSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();

  const dealerSelectCards = gameState?.dealerSelectCards ?? [];
  const takenIndices = new Set(dealerSelectCards.map((sc) => sc.cardIndex));
  const mySelection = dealerSelectCards.find((sc) => sc.playerId === myPlayerId);
  const hasSelected = mySelection !== undefined;

  const handleSelect = (cardIndex: number) => {
    if (hasSelected || takenIndices.has(cardIndex)) return;
    socket?.emit('select-dealer-card', { roomId, cardIndex });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>선 결정 — 카드를 선택하세요</DialogTitle>
        </DialogHeader>
        {hasSelected && (
          <p className="text-sm text-muted-foreground text-center">
            선택 완료! 다른 플레이어를 기다리는 중…
          </p>
        )}
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Array.from({ length: 20 }, (_, i) => {
            const isTaken = takenIndices.has(i);
            const isMyPick = mySelection?.cardIndex === i;
            const deck = gameState?.deck ?? [];
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={hasSelected || isTaken}
                className={cn(
                  'rounded-md transition-opacity',
                  hasSelected || isTaken
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:ring-2 hover:ring-primary',
                  isMyPick && 'opacity-100 ring-2 ring-primary'
                )}
              >
                {/* 내 선택 또는 모두 선택 완료 후: 카드 공개 */}
                {isMyPick && deck[i] ? (
                  <CardFace card={deck[i]} />
                ) : (
                  <CardBack />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
