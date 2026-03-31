import { useRef, useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useShuffleStore, type ShufflePhase } from '@/store/shuffleStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HwatuCard } from '@/components/game/HwatuCard';

interface ShuffleModalProps {
  open: boolean;
  roomId: string;
}

const CYCLE_MS = 820;

// 5 페이즈 타이밍 (per D-11):
// peek:  0~120ms  — translateY(-8px)
// hold:  120~300ms — 정지
// rise:  300~480ms — translateY(-20px)
// drop:  480~700ms — 빠르게 내리기 + 위치 교환 (easeIn)
// rest:  700~820ms — 제자리 안정화

function getPhaseFromElapsed(elapsed: number): ShufflePhase {
  const t = elapsed % CYCLE_MS;
  if (t < 120) return 'peek';
  if (t < 300) return 'hold';
  if (t < 480) return 'rise';
  if (t < 700) return 'drop';
  return 'rest';
}

function getCardTransform(cardIdx: number, phase: ShufflePhase, pickedIdx: number): string {
  const isPicked = cardIdx === pickedIdx;
  if (!isPicked) return 'translateY(0)';

  switch (phase) {
    case 'peek': return 'translateY(-8px)';
    case 'hold': return 'translateY(-8px)';
    case 'rise': return 'translateY(-20px)';
    case 'drop': return 'translateY(0)';
    case 'rest': return 'translateY(0)';
    default: return 'translateY(0)';
  }
}

export function ShuffleModal({ open, roomId }: ShuffleModalProps) {
  const { socket } = useGameStore();
  const { isShuffling, phase, pickedIdx, startShuffle, stopShuffle, setPhase, setPickedIdx } =
    useShuffleStore();
  const [hasShuffled, setHasShuffled] = useState(false);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  function animate(timestamp: number) {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;

    const currentPhase = getPhaseFromElapsed(elapsed);
    setPhase(currentPhase);

    // rest 끝에서 pickedIdx 토글 (다음 사이클은 다른 카드)
    const t = elapsed % CYCLE_MS;
    if (currentPhase === 'rest' && t > 810) {
      setPickedIdx(pickedIdx === 0 ? 1 : 0);
    }

    rafRef.current = requestAnimationFrame(animate);
  }

  const handlePointerDown = () => {
    startShuffle();
    setHasShuffled(true);
    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
  };

  const handlePointerUp = () => {
    cancelAnimationFrame(rafRef.current);
    stopShuffle();
  };

  const handleConfirmShuffle = () => {
    socket?.emit('shuffle', { roomId });
  };

  // cleanup on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>패를 섞으세요</DialogTitle>
        </DialogHeader>

        {/* 카드 더미 시각화 영역 */}
        <div className="relative h-40 flex items-center justify-center">
          <div className="relative" style={{ width: 68, height: 110 }}>
            {[0, 1].map((idx) => (
              <div
                key={idx}
                className="absolute inset-0 transition-none"
                style={{
                  transform: getCardTransform(idx, phase, pickedIdx),
                  zIndex: idx === pickedIdx ? 2 : 1,
                }}
              >
                <HwatuCard faceUp={false} size="md" />
              </div>
            ))}
          </div>
        </div>

        {/* 셔플 버튼 — pointerdown으로 시작, pointerup/leave로 종료 */}
        <div className="flex justify-center">
          <Button
            className="min-h-12 px-8"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {isShuffling ? '셔플 중...' : '셔플'}
          </Button>
        </div>

        {/* 셔플 후 확인 버튼 */}
        <DialogFooter>
          <Button onClick={handleConfirmShuffle} disabled={!hasShuffled}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
