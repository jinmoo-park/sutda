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
        <div className="flex flex-col gap-2 py-2">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => socket?.emit('select-mode', { roomId, mode: 'original' })}
            disabled={!isDealer}
          >
            오리지날 섯다
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => socket?.emit('select-mode', { roomId, mode: 'three-card' })}
            disabled={!isDealer}
          >
            세장섯다
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => socket?.emit('select-mode', { roomId, mode: 'shared-card' })}
            disabled={!isDealer}
          >
            한장공유
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => socket?.emit('select-mode', { roomId, mode: 'gollagolla' })}
            disabled={!isDealer}
          >
            골라골라
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => socket?.emit('select-mode', { roomId, mode: 'indian' })}
            disabled={!isDealer}
          >
            인디언섯다
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
