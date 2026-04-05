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
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-[560px] max-h-[80vh] p-4" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">게임 이력</DialogTitle>
        </DialogHeader>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">아직 이력이 없습니다</p>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="py-1.5 px-1 text-center w-10">판</th>
                  <th className="py-1.5 px-1 text-center">승자</th>
                  <th className="py-1.5 px-1 text-center">족보</th>
                  <th className="py-1.5 px-1 text-center">판돈</th>
                  <th className="py-1.5 px-1 text-center">잔액 현황</th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((entry) => (
                  <tr key={entry.roundNumber} className="border-b border-border/50 align-top">
                    <td className="py-2 px-1 text-center text-muted-foreground tabular-nums">{entry.roundNumber}</td>
                    <td className="py-2 px-1 text-center font-semibold whitespace-nowrap">
                      {entry.winnerNickname}
                      {entry.hasTtaengPayment && (
                        <Badge variant="secondary" className="text-[10px] ml-1 px-1 py-0">땡값</Badge>
                      )}
                    </td>
                    <td className="py-2 px-1 text-center whitespace-nowrap">{handLabelToKorean(entry.winnerHandLabel)}</td>
                    <td className="py-2 px-1 text-center tabular-nums text-yellow-500 whitespace-nowrap">
                      +{entry.pot.toLocaleString()}
                    </td>
                    <td className="py-2 px-1 text-center">
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center">
                        {entry.playerChipChanges.map((pc) => (
                          <span key={pc.playerId} className="inline-flex items-center gap-0.5 text-xs">
                            <span className="text-muted-foreground">{pc.nickname}</span>
                            <span className="font-semibold tabular-nums">
                              {(pc.balance ?? 0).toLocaleString()}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
