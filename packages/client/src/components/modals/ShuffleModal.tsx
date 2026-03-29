import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ShuffleModalProps {
  open: boolean;
  roomId: string;
}

export function ShuffleModal({ open, roomId }: ShuffleModalProps) {
  const { socket } = useGameStore();

  const handleShuffle = () => {
    socket?.emit('shuffle', { roomId });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>패를 섞을까요?</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleShuffle}>섞기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
