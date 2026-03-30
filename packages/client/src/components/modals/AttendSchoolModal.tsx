import { useState, useEffect } from 'react';
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

interface AttendSchoolModalProps {
  open: boolean;
  roomId: string;
  isDealer?: boolean;
  canSkip?: boolean;  // false이면 잠시쉬기 비활성화 (비-absent 2인 이하)
}

export function AttendSchoolModal({ open, roomId, isDealer = false, canSkip = true }: AttendSchoolModalProps) {
  const { socket } = useGameStore();
  const [submitted, setSubmitted] = useState(false);

  // 모달이 닫히면 submitted 초기화 (다음 라운드에서 재사용)
  useEffect(() => {
    if (!open) setSubmitted(false);
  }, [open]);

  const handleAttend = () => {
    if (submitted) return;
    setSubmitted(true);
    socket?.emit('attend-school', { roomId });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>이번 판에 참여하시겠어요?</DialogTitle>
          <DialogDescription>
            학교에 가면 앤티 500원을 납부합니다.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isDealer
            ? '선 플레이어는 반드시 참여해야 합니다.'
            : !canSkip
            ? '현재 참여 인원이 2명이라 쉬기가 불가합니다.'
            : '잠시 쉬기를 선택하면 이번 판을 건너뜁니다.'}
        </p>
        <DialogFooter>
          <Button
            variant="secondary"
            disabled={submitted || isDealer || !canSkip}
            onClick={() => {
              if (submitted || isDealer || !canSkip) return;
              setSubmitted(true);
              socket?.emit('skip-school', { roomId });
            }}
          >
            잠시 쉬기
          </Button>
          <Button onClick={handleAttend} disabled={submitted}>학교 간다</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
