import { useState } from 'react';
import type { PlayerState } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFace } from '@/components/game/CardFace';
import { HandReferenceDialog } from './HandReferenceDialog';

interface HandPanelProps {
  myPlayer: PlayerState | null;
}

const HAND_TYPE_KOREAN: Record<string, string> = {
  'sam-pal-gwang-ttaeng': '삼팔광땡',
  'il-pal-gwang-ttaeng': '일팔광땡',
  'il-sam-gwang-ttaeng': '일삼광땡',
  'jang-ttaeng': '장땡',
  'gu-ttaeng': '구땡',
  'pal-ttaeng': '팔땡',
  'chil-ttaeng': '칠땡',
  'yuk-ttaeng': '육땡',
  'o-ttaeng': '오땡',
  'sa-ttaeng': '사땡',
  'sam-ttaeng': '삼땡',
  'i-ttaeng': '이땡',
  'il-ttaeng': '일땡',
  ali: '알리',
  'dok-sa': '독사',
  'gu-bbing': '구삥',
  'jang-bbing': '장삥',
  'jang-sa': '장사',
  'sae-ryuk': '새륙',
  kkut: '끗',
};

export function HandPanel({ myPlayer }: HandPanelProps) {
  const [showReference, setShowReference] = useState(false);

  const cards = myPlayer?.cards ?? [];

  let handLabel: string | null = null;
  if (cards.length >= 2) {
    try {
      const result = evaluateHand(cards[0], cards[1]);
      const baseName = HAND_TYPE_KOREAN[result.handType] ?? result.handType;
      handLabel =
        result.handType === 'kkut' ? `${result.score}끗` : baseName;
    } catch {
      // 카드가 2장 미만이거나 평가 불가한 경우 무시
    }
  }

  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-semibold">내 패</p>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">카드가 아직 없어요</p>
      ) : (
        <div className="flex gap-2 items-center">
          {cards.map((card, idx) => (
            <CardFace key={idx} card={card} />
          ))}
          {handLabel && (
            <Badge variant="secondary" className="ml-2">
              {handLabel}
            </Badge>
          )}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={() => setShowReference(true)}>
        족보 참고표
      </Button>

      <HandReferenceDialog open={showReference} onOpenChange={setShowReference} />
    </div>
  );
}
