import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HwatuCard } from '@/components/game/HwatuCard';
import { cn } from '@/lib/utils';

interface GollaSelectModalProps {
  open: boolean;
  roomId: string;
}

export function GollaSelectModal({ open, roomId }: GollaSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();
  // 낙관적 로컬 선택 상태 (서버 응답 전 즉각적인 UI 피드백용)
  const [myPicks, setMyPicks] = useState<number[]>([]);

  const openDeck = gameState?.gollaOpenDeck ?? [];

  const myConfirmedIndices = gameState?.gollaPlayerIndices?.[myPlayerId ?? ''];
  const alreadyDone = !!myConfirmedIndices;

  // 모달이 열릴 때 로컬 선택 초기화
  useEffect(() => {
    if (open) setMyPicks([]);
  }, [open]);

  // 에러 수신 시 로컬 선택 롤백 (서버 예약 상태로 복원)
  useEffect(() => {
    if (!socket) return;
    const handleError = ({ code }: { code: string }) => {
      if (code === 'CARD_ALREADY_TAKEN') {
        const serverReserved = gameState?.gollaReservedIndices?.[myPlayerId ?? ''] ?? [];
        setMyPicks(serverReserved);
      }
    };
    socket.on('game-error', handleError);
    return () => { socket.off('game-error', handleError); };
  }, [socket, gameState, myPlayerId]);

  // 타인이 예약/확정한 인덱스 집합 (서버 상태 기준)
  const takenByOthers = new Set<number>();
  if (gameState?.gollaPlayerIndices) {
    for (const [pid, indices] of Object.entries(gameState.gollaPlayerIndices)) {
      if (pid !== myPlayerId) indices.forEach(i => takenByOthers.add(i));
    }
  }
  if (gameState?.gollaReservedIndices) {
    for (const [pid, indices] of Object.entries(gameState.gollaReservedIndices)) {
      if (pid !== myPlayerId) indices.forEach(i => takenByOthers.add(i));
    }
  }

  const handleCardClick = (idx: number) => {
    if (alreadyDone) return;
    if (takenByOthers.has(idx)) return;

    if (myPicks.includes(idx)) {
      // 예약 취소
      setMyPicks(prev => prev.filter(i => i !== idx));
      socket?.emit('reserve-gollagolla-card', { roomId, cardIndex: idx, reserve: false });
    } else if (myPicks.length < 2) {
      // 예약 추가 (낙관적)
      setMyPicks(prev => [...prev, idx]);
      socket?.emit('reserve-gollagolla-card', { roomId, cardIndex: idx, reserve: true });
    }
  };

  // 표시용 선택 상태: 확정됐으면 서버 기준, 아니면 로컬 낙관적 상태
  const displayPicks = alreadyDone
    ? [myConfirmedIndices[0], myConfirmedIndices[1]]
    : myPicks;

  const selectedCount = displayPicks.length;

  return (
    <Dialog open={open} modal={false}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>골라골라 — 카드를 2장 선택하세요</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">
          {alreadyDone
            ? '선택 완료! 다른 플레이어를 기다리는 중…'
            : `2장을 선택하세요 (${selectedCount}/2) — 클릭하면 즉시 예약, 다시 클릭하면 취소`}
        </p>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {openDeck.map((_card, idx) => {
            const isTakenByOther = takenByOthers.has(idx);
            const isMyPick = displayPicks.includes(idx);
            const disabled = isTakenByOther || alreadyDone;

            return (
              <button
                key={idx}
                onClick={() => handleCardClick(idx)}
                disabled={disabled}
                className={cn(
                  'rounded-md transition-all',
                  isTakenByOther
                    ? 'opacity-30 cursor-not-allowed'
                    : alreadyDone
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:ring-2 hover:ring-primary',
                  isMyPick && !isTakenByOther && 'ring-2 ring-primary scale-105'
                )}
              >
                <HwatuCard faceUp={false} size="sm" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
