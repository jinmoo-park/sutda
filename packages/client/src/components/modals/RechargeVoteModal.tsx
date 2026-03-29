import { useEffect } from 'react';
import { toast } from 'sonner';
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

interface RechargeVoteModalProps {
  roomId: string;
}

export function RechargeVoteModal({ roomId }: RechargeVoteModalProps) {
  const { socket, rechargeRequest } = useGameStore();

  const handleVote = (approved: boolean) => {
    socket?.emit('recharge-vote', { roomId, approved });
  };

  // recharge-result 이벤트는 gameStore에서 rechargeRequest를 null로 설정
  // Toast는 결과 수신 시 표시
  useEffect(() => {
    if (!socket) return;

    const handleResult = (data: { approved: boolean }) => {
      if (data.approved) {
        toast.success('재충전이 승인되었어요!');
      } else {
        toast.info('재충전이 거부되었어요.');
      }
    };

    socket.on('recharge-result', handleResult);
    return () => {
      socket.off('recharge-result', handleResult);
    };
  }, [socket]);

  return (
    <Dialog open={!!rechargeRequest}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {rechargeRequest?.requesterNickname}님이 칩 재충전을 요청했어요.
          </DialogTitle>
          <DialogDescription>
            {rechargeRequest?.amount.toLocaleString()}원
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => handleVote(false)}
          >
            거부
          </Button>
          <Button onClick={() => handleVote(true)}>
            동의
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
