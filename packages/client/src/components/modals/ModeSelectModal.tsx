import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ModeSelectModalProps {
  open: boolean;
  roomId: string;
  isDealer: boolean;
}

export function ModeSelectModal({ open, roomId, isDealer }: ModeSelectModalProps) {
  const { socket } = useGameStore();

  const handleSelect = () => {
    socket?.emit('select-mode', { roomId, mode: 'original' });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>게임 모드 선택</DialogTitle>
          <DialogDescription>
            {isDealer
              ? '이번 판 게임 모드를 선택하세요.'
              : '선 플레이어가 모드를 선택 중입니다...'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Button
            className="w-full"
            variant="outline"
            onClick={handleSelect}
            disabled={!isDealer}
          >
            오리지날 섯다
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
