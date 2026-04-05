import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LeaveRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function LeaveRoomDialog({ open, onOpenChange, roomId }: LeaveRoomDialogProps) {
  const { socket } = useGameStore();
  const navigate = useNavigate();

  const handleLeave = () => {
    socket?.emit('leave-room', { roomId });
    navigate('/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>방에서 나가시겠어요?</DialogTitle>
          <DialogDescription>
            게임 중이라면 다이 처리됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleLeave}>
            나가기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
