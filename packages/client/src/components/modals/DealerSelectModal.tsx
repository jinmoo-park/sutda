import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardBack } from '@/components/game/CardBack';
import { CardFace } from '@/components/game/CardFace';
import { cn } from '@/lib/utils';

interface DealerSelectModalProps {
  open: boolean;
  roomId: string;
}

export function DealerSelectModal({ open, roomId }: DealerSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();

  const dealerSelectCards = gameState?.dealerSelectCards ?? [];
  const eligibleIds = gameState?.dealerSelectEligibleIds;  // undefined = 전원, 배열 = 재추첨 대상
  const isRedraw = eligibleIds !== undefined;
  const amEligible = !isRedraw || (myPlayerId !== null && eligibleIds!.includes(myPlayerId));

  const takenIndices = new Set(dealerSelectCards.map((sc) => sc.cardIndex));
  const mySelection = dealerSelectCards.find((sc) => sc.playerId === myPlayerId);
  const hasSelected = mySelection !== undefined;

  const handleSelect = (cardIndex: number) => {
    if (!amEligible || hasSelected || takenIndices.has(cardIndex)) return;
    socket?.emit('select-dealer-card', { roomId, cardIndex });
  };

  // 재추첨 대상 닉네임 목록
  const eligibleNicknames = isRedraw
    ? gameState?.players.filter(p => eligibleIds!.includes(p.id)).map(p => p.nickname).join(', ')
    : null;

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isRedraw ? '동률 — 재추첨' : '선 결정 — 카드를 선택하세요'}
          </DialogTitle>
        </DialogHeader>
        {isRedraw && (
          <p className="text-sm text-center text-amber-500 font-medium">
            동률! {eligibleNicknames}님이 다시 뽑습니다
          </p>
        )}
        {!amEligible ? (
          <p className="text-sm text-muted-foreground text-center">
            재추첨을 기다리는 중…
          </p>
        ) : hasSelected ? (
          <p className="text-sm text-muted-foreground text-center">
            선택 완료! 다른 플레이어를 기다리는 중…
          </p>
        ) : null}
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Array.from({ length: 20 }, (_, i) => {
            const isTaken = takenIndices.has(i);
            const isMyPick = mySelection?.cardIndex === i;
            const deck = gameState?.deck ?? [];
            const disabled = !amEligible || hasSelected || isTaken;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={disabled}
                className={cn(
                  'rounded-md transition-opacity',
                  disabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:ring-2 hover:ring-primary',
                  isMyPick && 'opacity-100 ring-2 ring-primary'
                )}
              >
                {isMyPick && deck[i] ? (
                  <CardFace card={deck[i]} />
                ) : (
                  <CardBack />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
