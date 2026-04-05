import { useState } from 'react';
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

interface ReturnFromBreakModalProps {
  roomId: string;
}

export function ReturnFromBreakModal({ roomId }: ReturnFromBreakModalProps) {
  const { socket } = useGameStore();
  const [submitted, setSubmitted] = useState(false);

  const handleReturn = () => {
    if (submitted) return;
    setSubmitted(true);
    socket?.emit('return-from-break', { roomId });
    // 복귀 후 isAbsent=false → 이 컴포넌트가 unmount되고 AttendSchoolModal이 표시됨
  };

  const handleSkip = () => {
    if (submitted) return;
    setSubmitted(true);
    // 잠시 쉬기 유지 — skip-school emit (서버가 schoolResponded에 추가)
    socket?.emit('skip-school', { roomId });
  };

  return (
    <Dialog open>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>이번 판에 복귀하시겠어요?</DialogTitle>
          <DialogDescription>
            복귀하면 학교 등교(앤티 500원) 후 게임에 참여합니다.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          복귀하지 않으면 이번 판은 자리비움으로 처리됩니다.
        </p>
        <DialogFooter>
          <Button variant="secondary" disabled={submitted} onClick={handleSkip}>
            이번 판 쉬기
          </Button>
          <Button disabled={submitted} onClick={handleReturn}>
            복귀하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
