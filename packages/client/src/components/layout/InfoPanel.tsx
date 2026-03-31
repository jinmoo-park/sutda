import type { PlayerState } from '@sutda/shared';
import { Separator } from '@/components/ui/separator';

interface InfoPanelProps {
  myChips: number;
  players: PlayerState[];
  myPlayerId?: string | null;
  compact?: boolean;
}

export function InfoPanel({ myChips, players, myPlayerId, compact }: InfoPanelProps) {
  const others = players.filter((p) => p.id !== myPlayerId);

  if (compact) {
    return (
      <div className="px-2 py-1.5 rounded-md bg-black/60 text-white backdrop-blur-sm space-y-1 min-w-[100px]">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[10px] text-white/50">나</span>
          <span className="text-xs font-bold tabular-nums text-yellow-300">{myChips.toLocaleString()}</span>
        </div>
        {others.length > 0 && (
          <div className="space-y-0.5 border-t border-white/20 pt-0.5">
            {others.map((p) => (
              <div key={p.id} className="flex justify-between items-baseline gap-2">
                <span className="text-[10px] text-white/50 truncate max-w-[48px]">{p.nickname}</span>
                <span className="text-[10px] tabular-nums text-white/80">{p.chips.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 min-w-[160px]">
      <div>
        <p className="text-xs text-muted-foreground">내 잔액</p>
        <p className="font-semibold tabular-nums text-yellow-500">{myChips.toLocaleString()}원</p>
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
