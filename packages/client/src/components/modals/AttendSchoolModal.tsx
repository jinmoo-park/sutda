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
}

export function AttendSchoolModal({ open, roomId }: AttendSchoolModalProps) {
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
          잠시 쉬기를 선택하면 이번 판을 건너뜁니다.
        </p>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              /* 의도적으로 이벤트 미전송 — 서버 타임아웃이 skip 처리 */
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
