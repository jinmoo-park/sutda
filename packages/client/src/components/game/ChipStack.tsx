/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
import { useEffect, useRef } from 'react';

interface ChipInfo {
  src: string;
  value: number;
}

const DENOMINATIONS: Array<{ value: number; src: string }> = [
  { value: 10000, src: '/chips/10k.svg' },
  { value: 5000,  src: '/chips/5k.svg'  },
  { value: 1000,  src: '/chips/1k.svg'  },
  { value: 500,   src: '/chips/500.svg' },
];

function decompose(pot: number): ChipInfo[] {
  const chips: ChipInfo[] = [];
  let remaining = pot;
  for (const { value, src } of DENOMINATIONS) {
    const count = Math.floor(remaining / value);
    for (let i = 0; i < count; i++) {
      chips.push({ src, value });
    }
    remaining %= value;
  }
  return chips.slice(0, 8);
}

interface ChipStackProps {
  pot: number;
}

export function ChipStack({ pot }: ChipStackProps) {
  const prevPotRef = useRef<number>(pot);
  const prevCountRef = useRef<number>(decompose(pot).length);

  const chips = decompose(pot);
  const prevPot = prevPotRef.current;
  const prevCount = prevCountRef.current;

  // 판돈이 증가한 경우 새로 추가된 칩 수
  const newChipCount = pot > prevPot ? Math.max(0, chips.length - prevCount) : 0;

  useEffect(() => {
    prevPotRef.current = pot;
    prevCountRef.current = chips.length;
  });

  return (
    <div className="flex flex-wrap gap-1 justify-center items-center">
      {chips.map((chip, index) => {
        const isNew = index >= chips.length - newChipCount;
        return (
          <img
            key={`${index}-${chip.value}`}
            src={chip.src}
            alt={`${chip.value.toLocaleString()}원 칩`}
            className="w-8 h-8"
            style={
              isNew
                ? { animation: 'chip-slide-up 0.3s ease-out' }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
