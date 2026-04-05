import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { RoundHistoryEntry } from '@sutda/shared';
import { Badge } from '../ui/badge';
import { handLabelToKorean } from '../../lib/handLabels';

interface HistoryModalProps {
  entries: RoundHistoryEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function entriesToCsv(entries: RoundHistoryEntry[]): string {
  const BOM = '\uFEFF';
  const header = ['판', '승자', '족보', '땡값여부', '판돈', '플레이어별잔액'].map(escapeCsvCell).join(',');
  const rows = entries.map((entry) => {
    const balances = entry.playerChipChanges
      .map((pc) => `${pc.nickname}:${pc.balance ?? 0}`)
      .join('/');
    return [
      escapeCsvCell(String(entry.roundNumber)),
      escapeCsvCell(entry.winnerNickname),
      escapeCsvCell(handLabelToKorean(entry.winnerHandLabel)),
      escapeCsvCell(entry.hasTtaengPayment ? 'O' : ''),
      escapeCsvCell(String(entry.pot)),
      escapeCsvCell(balances),
    ].join(',');
  });
  return BOM + [header, ...rows].join('\r\n');
}

function downloadCsv(entries: RoundHistoryEntry[]): void {
  const csvString = entriesToCsv(entries);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const a = document.createElement('a');
  a.href = url;
  a.download = `sutda-history-${timestamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function HistoryModal({ entries, open, onOpenChange }: HistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-[560px] max-h-[80vh] p-4" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">게임 이력</DialogTitle>
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={() => downloadCsv(entries)}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            CSV 저장
          </button>
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
