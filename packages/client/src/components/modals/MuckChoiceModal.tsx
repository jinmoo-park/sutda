import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { HwatuCard } from '@/components/game/HwatuCard';
import { computeSlotIndices } from '@/lib/cardImageUtils';

interface MuckChoiceModalProps {
  open: boolean;
  roomId: string;
  myCards: { rank: number; attribute: string }[];
}

export function MuckChoiceModal({ open, roomId, myCards }: MuckChoiceModalProps) {
  const socket = useGameStore((s) => s.socket);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="bg-card rounded-xl p-6 space-y-5 text-center shadow-xl min-w-[300px]">
        <h3 className="text-lg font-semibold">상대가 모두 다이했어요</h3>

        <div className="flex justify-center gap-3">
          {myCards.map((card, i) => (
            <HwatuCard key={i} card={card as any} faceUp={true} size="md" slotIndex={computeSlotIndices(myCards as any)[i]} />
          ))}
        </div>

        <p className="text-sm text-muted-foreground">패를 공개하시겠어요?</p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => socket?.emit('muck-hand', { roomId })}
          >
            숨기기
          </Button>
          <Button
            className="flex-1"
            onClick={() => socket?.emit('reveal-card', { roomId })}
          >
            공개
          </Button>
        </div>
      </div>
    </div>
  );
}
