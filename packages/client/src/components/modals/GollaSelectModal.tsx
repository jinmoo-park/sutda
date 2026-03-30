import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardFace } from '@/components/game/CardFace';
import { cn } from '@/lib/utils';

interface GollaSelectModalProps {
  open: boolean;
  roomId: string;
}

export function GollaSelectModal({ open, roomId }: GollaSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();
  const [pendingIndices, setPendingIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const openDeck = gameState?.gollaOpenDeck ?? [];

  // 타인이 이미 선택한 카드 인덱스 — 서버가 game-state를 갱신하면 players.cards로 파악 가능하지만
  // 골라골라 선택 중에는 서버가 선택 완료된 플레이어 cards를 채워 줌.
  // 단순화: 모든 플레이어 cards의 카드를 openDeck 인덱스로 역추적하여 takenIndices 구성.
  const takenByOthers = new Set<number>();
  if (gameState) {
    for (const p of gameState.players) {
      if (p.id === myPlayerId) continue;
      for (const card of p.cards) {
        const idx = openDeck.findIndex(
          (c, i) => c.rank === card.rank && c.type === card.type && !takenByOthers.has(i)
        );
        if (idx >= 0) takenByOthers.add(idx);
      }
    }
  }

  // 내가 이미 서버에 확정 제출했는지 (myPlayer.cards.length >= 2)
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const alreadyDone = (myPlayer?.cards.length ?? 0) >= 2;

  const handleCardClick = (idx: number) => {
    if (alreadyDone || submitted) return;
    if (takenByOthers.has(idx)) return;

    setPendingIndices(prev => {
      if (prev.includes(idx)) {
        // 토글 해제
        return prev.filter(i => i !== idx);
      }
      if (prev.length >= 2) return prev;  // 이미 2장 선택 중이면 무시
      const next = [...prev, idx];
      if (next.length === 2) {
        // 2장 완료 → 자동 확정 emit
        setSubmitted(true);
        socket?.emit('select-gollagolla-cards', {
          roomId,
          cardIndices: [next[0], next[1]] as [number, number],
        });
      }
      return next;
    });
  };

  // phase가 gollagolla-select를 벗어나면(betting으로 전환) 상태 리셋
  // (open prop이 false가 되므로 별도 리셋 불필요)

  const selectedCount = alreadyDone ? 2 : pendingIndices.length;

  return (
    <Dialog open={open}>
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
            : `2장을 선택하세요 (${selectedCount}/2)`}
        </p>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {openDeck.map((card, idx) => {
            const isTakenByOther = takenByOthers.has(idx);
            const isMyPick = pendingIndices.includes(idx) || (alreadyDone && myPlayer?.cards.some(
              c => c.rank === card.rank && c.type === card.type
            ));
            const disabled = isTakenByOther || alreadyDone || submitted;

            return (
              <button
                key={idx}
                onClick={() => handleCardClick(idx)}
                disabled={disabled}
                className={cn(
                  'rounded-md transition-opacity',
                  isTakenByOther
                    ? 'opacity-40 cursor-not-allowed'
                    : disabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:ring-2 hover:ring-primary',
                  isMyPick && !isTakenByOther && 'ring-2 ring-primary opacity-100'
                )}
              >
                <CardFace card={card} />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
