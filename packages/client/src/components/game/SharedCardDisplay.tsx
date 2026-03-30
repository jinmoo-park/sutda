import type { Card } from '@sutda/shared';
import { CardFace } from './CardFace';

interface SharedCardDisplayProps {
  card: Card;
}

export function SharedCardDisplay({ card }: SharedCardDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-muted-foreground">공유 카드</p>
      <div className="ring-2 ring-primary/50 rounded-md">
        <CardFace card={card} className="w-20 h-[120px]" />
      </div>
    </div>
  );
}
