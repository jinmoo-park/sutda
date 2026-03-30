import type { Card, PlayerState } from '@sutda/shared';
import { CardFace } from '@/components/game/CardFace';
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
          <DialogTitle>선 결정 결과</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {results.map(({ playerId, card }) => {
            const isWinner = playerId === winnerId;
            return (
              <div
                key={playerId}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  isWinner ? 'bg-primary/10 ring-1 ring-primary' : 'bg-muted/40'
                }`}
              >
                <CardFace card={card} />
                <div>
                  <p className="font-semibold text-sm">{getNickname(playerId)}</p>
                  {isWinner && (
                    <p className="text-xs text-primary font-medium">선 결정!</p>
                  )}
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
