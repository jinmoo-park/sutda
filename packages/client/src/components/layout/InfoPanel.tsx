import type { PlayerState } from '@sutda/shared';
import { Separator } from '@/components/ui/separator';

interface InfoPanelProps {
  myChips: number;
  pot: number;
  players: PlayerState[];
  myPlayerId?: string | null;
}

export function InfoPanel({ myChips, pot, players, myPlayerId }: InfoPanelProps) {
  const others = players.filter((p) => p.id !== myPlayerId);

  return (
    <div className="p-4 space-y-2 min-w-[160px]">
      <div>
        <p className="text-xs text-muted-foreground">내 잔액</p>
        <p className="font-semibold tabular-nums">{myChips.toLocaleString()}원</p>
      </div>

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground">팟</p>
        <p className="font-semibold tabular-nums">{pot.toLocaleString()}원</p>
      </div>

      {others.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">상대 잔액</p>
            {others.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="truncate max-w-[80px]">{p.nickname}</span>
                <span className="tabular-nums text-xs text-muted-foreground">
                  {p.chips.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
