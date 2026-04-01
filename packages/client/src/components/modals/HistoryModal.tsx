import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { RoundHistoryEntry } from '@sutda/shared';
import { Badge } from '../ui/badge';
import { handLabelToKorean } from '../../lib/handLabels';

interface HistoryModalProps {
  entries: RoundHistoryEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryModal({ entries, open, onOpenChange }: HistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">게임 이력</DialogTitle>
        </DialogHeader>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">아직 이력이 없습니다</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {[...entries].reverse().map((entry) => (
              <div key={entry.roundNumber} className="flex items-center gap-3 p-2 rounded bg-card">
                <span className="text-xs text-muted-foreground w-10 shrink-0">판 {entry.roundNumber}</span>
                <span className="text-sm font-semibold truncate">{entry.winnerNickname}</span>
                <span className="text-sm">{handLabelToKorean(entry.winnerHandLabel)}</span>
                <span className="text-sm tabular-nums text-yellow-500 ml-auto">{entry.pot.toLocaleString()}원</span>
                {entry.hasTtaengPayment && (
                  <Badge variant="secondary" className="text-xs shrink-0">땡값</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
