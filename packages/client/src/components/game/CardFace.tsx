import type { Card } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { rankToKorean } from '@/lib/cardUtils';
import { cn } from '@/lib/utils';

interface CardFaceProps {
  card: Card;
  className?: string;
}

export function CardFace({ card, className }: CardFaceProps) {
  return (
    <div
      className={cn(
        'bg-white text-gray-900 rounded-md border border-gray-200 w-16 h-24 flex flex-col items-center justify-center gap-1 p-2',
        className
      )}
    >
      <span className="text-lg font-semibold">{rankToKorean(card.rank)}</span>
      {card.attribute === 'gwang' && (
        <Badge className="bg-yellow-400 text-yellow-900 border-transparent text-xs px-1 py-0">
          광
        </Badge>
      )}
      {card.attribute === 'yeolkkeut' && (
        <Badge className="bg-blue-400 text-blue-900 border-transparent text-xs px-1 py-0">
          열끗
        </Badge>
      )}
    </div>
  );
}
