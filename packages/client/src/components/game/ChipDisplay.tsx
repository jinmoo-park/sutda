import type { ChipBreakdown } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChipDisplayProps {
  breakdown: ChipBreakdown;
  className?: string;
}

export function ChipDisplay({ breakdown, className }: ChipDisplayProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {breakdown.ten_thousand > 0 && (
        <Badge className="bg-red-500 text-white border-transparent">
          만 x{breakdown.ten_thousand}
        </Badge>
      )}
      {breakdown.five_thousand > 0 && (
        <Badge className="bg-green-500 text-white border-transparent">
          5천 x{breakdown.five_thousand}
        </Badge>
      )}
      {breakdown.one_thousand > 0 && (
        <Badge className="bg-blue-500 text-white border-transparent">
          천 x{breakdown.one_thousand}
        </Badge>
      )}
      {breakdown.five_hundred > 0 && (
        <Badge className="bg-gray-400 text-gray-900 border-transparent">
          5백 x{breakdown.five_hundred}
        </Badge>
      )}
    </div>
  );
}
