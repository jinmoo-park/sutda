import { useGameStore } from '@/store/gameStore';
import { useSfxPlayer } from '@/hooks/useSfxPlayer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HwatuCard } from '@/components/game/HwatuCard';
import { cn } from '@/lib/utils';

interface DealerSelectModalProps {
  open: boolean;
  roomId: string;
}

export function DealerSelectModal({ open, roomId }: DealerSelectModalProps) {
  const { socket, gameState, myPlayerId } = useGameStore();
  const { play } = useSfxPlayer();

  const dealerSelectCards = gameState?.dealerSelectCards ?? [];
  const eligibleIds = gameState?.dealerSelectEligibleIds;  // undefined = 전원, 배열 = 재추첨 대상
  const isRedraw = eligibleIds !== undefined;
  const amEligible = !isRedraw || (myPlayerId !== null && eligibleIds!.includes(myPlayerId));

  const takenIndices = new Set(dealerSelectCards.map((sc) => sc.cardIndex));
  const mySelection = dealerSelectCards.find((sc) => sc.playerId === myPlayerId);
  const hasSelected = mySelection !== undefined;

  const handleSelect = (cardIndex: number) => {
    if (!amEligible || hasSelected || takenIndices.has(cardIndex)) return;
    play('flip');
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
          <p className="text-sm text-center text-amber-500 font-semibold">
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
            // 선택된 카드는 HTML disabled 없이 직접 클릭 차단 (face-up 표시 유지)
            const disabled = !isTaken && (!amEligible || hasSelected);
            const pickedBy = isTaken
              ? dealerSelectCards.find((sc) => sc.cardIndex === i)
              : undefined;
            const pickerNickname = pickedBy
              ? (gameState?.players.find((p) => p.id === pickedBy.playerId)?.nickname ?? '')
              : '';
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => handleSelect(i)}
                  disabled={disabled}
                  className={cn(
                    'rounded-md transition-opacity',
                    isTaken
                      ? 'cursor-not-allowed'
                      : !amEligible || hasSelected
                        ? 'cursor-not-allowed opacity-40'
                        : 'cursor-pointer hover:ring-2 hover:ring-primary',
                    isMyPick && 'ring-2 ring-primary'
                  )}
                >
                  {isTaken && deck[i] ? (
                    <HwatuCard card={deck[i]} faceUp={true} size="sm" />
                  ) : (
                    <HwatuCard faceUp={false} size="sm" />
                  )}
                </button>
                {pickerNickname && (
                  <span className={cn(
                    'text-[9px] truncate max-w-[52px] text-center leading-tight',
                    isMyPick ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {pickerNickname}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
