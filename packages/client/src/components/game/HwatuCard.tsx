import type { Card } from '@sutda/shared';
import { getCardImageSrc, getCardBackSrc } from '@/lib/cardImageUtils';

interface HwatuCardProps {
  card?: Card | null;         // null/undefined = 뒷면만 표시
  faceUp?: boolean;           // default false
  size?: 'sm' | 'md' | 'lg'; // default 'md'
  onClick?: () => void;
  disabled?: boolean;         // true면 pointer-events: none
  className?: string;
  slotIndex?: number;         // 같은 rank normal 카드 구분 (cardImageUtils에 전달)
}

/** 화투 실물 1:1.583 비율 크기 매핑 */
const SIZE_MAP = {
  sm: { width: 51, height: 83 },
  md: { width: 68, height: 110 },
  lg: { width: 85, height: 135 },
} as const;

/**
 * HwatuCard — 3D flip 지원 화투 카드 컴포넌트.
 *
 * CSS naming:
 *   .hwatu-face = 카드 물리적 앞면 (초기에 보이는 면) = 뒷면 이미지(card_back.jpg)
 *   .hwatu-back = 카드 물리적 뒷면 (뒤집으면 보이는 면) = 앞면 이미지(실제 카드)
 *
 * faceUp=true이면 .is-flipped 클래스가 추가되어 rotateY(180deg) → .hwatu-back(앞면 이미지)이 보임.
 */
export function HwatuCard({
  card = null,
  faceUp = false,
  size = 'md',
  onClick,
  disabled = false,
  className,
  slotIndex = 0,
}: HwatuCardProps) {
  const { width, height } = SIZE_MAP[size];
  const showFace = faceUp && card != null;

  const backSrc = getCardBackSrc();
  const faceSrc = card != null ? getCardImageSrc(card, slotIndex) : backSrc;

  return (
    <div
      className={`hwatu-scene${onClick && !disabled ? ' hwatu-hoverable' : ''}${className ? ` ${className}` : ''}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        perspective: '600px',
        cursor: onClick && !disabled ? 'pointer' : undefined,
        pointerEvents: disabled ? 'none' : undefined,
        transition: 'transform 0.15s ease, filter 0.15s ease',
      }}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className={`hwatu-card${showFace ? ' is-flipped' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
          transform: showFace ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* .hwatu-face: 물리적 앞면 = 뒷면 이미지 (초기 보이는 면) */}
        <div
          className="hwatu-face"
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
          }}
        >
          <img
            src={backSrc}
            alt="카드 뒷면"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
            }}
          />
        </div>

        {/* .hwatu-back: 물리적 뒷면 = 앞면 이미지 (뒤집으면 보이는 면) */}
        <div
          className="hwatu-back"
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <img
            src={faceSrc}
            alt={card ? `${card.rank}${card.attribute !== 'normal' ? ` ${card.attribute}` : ''}` : '카드'}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
