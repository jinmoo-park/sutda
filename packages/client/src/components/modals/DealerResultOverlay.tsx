import type { Card, PlayerState } from '@sutda/shared';
import { HwatuCard } from '@/components/game/HwatuCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface DealerSelectResult {
  playerId: string;
  cardIndex: number;
  card: Card;
}

interface DealerResultOverlayProps {
  open: boolean;
  results: DealerSelectResult[];
  players: PlayerState[];
  winnerId: string | null;
  onOpenChange?: (open: boolean) => void;
}

export function DealerResultOverlay({ open, results, players, winnerId, onOpenChange }: DealerResultOverlayProps) {
  const getNickname = (playerId: string) =>
    players.find((p) => p.id === playerId)?.nickname ?? playerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>밤일낮장 결과</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {results.map(({ playerId, card }) => {
            const isWinner = playerId === winnerId;
            const isNight = card.month <= 10;
            const dayNightLabel = isNight ? '밤일' : '낮장';
            const badgeColor = isNight
              ? 'text-amber-500 border-amber-500'
              : 'text-blue-400 border-blue-400';
            return (
              <div
                key={playerId}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  isWinner ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/40'
                }`}
              >
                <HwatuCard card={card} faceUp={true} size="sm" />
                <div>
                  <p className="font-semibold text-sm">{getNickname(playerId)}</p>
                  <span className={`text-xs font-semibold border rounded px-1 py-0.5 ${badgeColor}`}>
                    {dayNightLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-center text-muted-foreground">잠시 후 자동으로 넘어갑니다…</p>
      </DialogContent>
    </Dialog>
  );
}
