import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardBack } from '@/components/game/CardBack';

interface DealerSelectModalProps {
  open: boolean;
  roomId: string;
}

export function DealerSelectModal({ open, roomId }: DealerSelectModalProps) {
  const { socket } = useGameStore();

  const handleSelect = (cardIndex: number) => {
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
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Array.from({ length: 20 }, (_, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="cursor-pointer hover:ring-2 hover:ring-primary rounded-md"
            >
              <CardBack />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
