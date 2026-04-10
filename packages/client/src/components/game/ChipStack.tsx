/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
import { useEffect, useRef } from 'react';

// 칩 단위별 색상 정의
const CHIP_COLORS: Record<number, { top: string; side: string; dark: string; stripe: string }> = {
  10000: { top: '#3949AB', side: '#283593', dark: '#1A237E', stripe: '#7986CB' },
  5000:  { top: '#E53935', side: '#C62828', dark: '#8B0000', stripe: '#EF9A9A' },
  1000:  { top: '#388E3C', side: '#2E7D32', dark: '#1B5E20', stripe: '#81C784' },
  500:   { top: '#78909C', side: '#546E7A', dark: '#37474F', stripe: '#B0BEC5' },
};

const CHIP_ORDER = [10000, 5000, 1000, 500];

// SVG 치수
const CHIP_RX = 17;   // 타원 반지름 x
const CHIP_RY = 5.5;  // 타원 반지름 y
const CHIP_BODY = 9;  // 칩 한 장 높이
const SVG_W = CHIP_RX * 2 + 4;  // 38

/** 단일 칩 타워 SVG (N장 세로 스택) */
function ChipTower({ denom, count, isNew }: { denom: number; count: number; isNew: boolean }) {
  if (count === 0) return null;

  const colors = CHIP_COLORS[denom] ?? CHIP_COLORS[500];
  const svgH = CHIP_RY + count * CHIP_BODY + CHIP_RY;
  const cx = SVG_W / 2;

  // SVG 안에서 아래 → 위 순서로 draw (위 칩이 덮어씀)
  const chips = Array.from({ length: count }, (_, drawOrder) => {
    const chipIdx = count - 1 - drawOrder; // 0 = 최상단 칩
    const topY = CHIP_RY + chipIdx * CHIP_BODY;
    const isBottom = chipIdx === count - 1;

    return (
      <g key={drawOrder}>
        {/* 측면 밴드 */}
        <rect
          x={2}
          y={topY}
          width={SVG_W - 4}
          height={CHIP_BODY + CHIP_RY}
          fill={colors.side}
        />
        {/* 하단 타원 (가장 아래 칩만) */}
        {isBottom && (
          <ellipse cx={cx} cy={topY + CHIP_BODY} rx={CHIP_RX} ry={CHIP_RY} fill={colors.dark} />
        )}
        {/* 상단 타원 (칩 면) */}
        <ellipse cx={cx} cy={topY} rx={CHIP_RX} ry={CHIP_RY} fill={colors.top} stroke={colors.dark} strokeWidth={1} />
        {/* 줄무늬 장식 */}
        <ellipse cx={cx} cy={topY} rx={CHIP_RX * 0.58} ry={CHIP_RY * 0.58}
          fill="none" stroke={colors.stripe} strokeWidth={1.2} strokeDasharray="4 3" />
      </g>
    );
  });

  const label = denom >= 10000 ? '1만' : denom >= 5000 ? '5천' : denom >= 1000 ? '1천' : '500';

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      style={isNew ? { animation: 'chip-slide-up 0.35s ease-out' } : undefined}
    >
      <svg width={SVG_W} height={svgH} viewBox={`0 0 ${SVG_W} ${svgH}`} overflow="visible">
        {chips}
      </svg>
      <span className="text-[9px] tabular-nums leading-none" style={{ color: colors.stripe }}>
        ×{count}
      </span>
    </div>
  );
}

interface ChipStackProps {
  chips: number[];   // potChipLog — 실제 투입된 칩 단위 배열
}

export function ChipStack({ chips }: ChipStackProps) {
  const prevLenRef = useRef<number>(chips.length);
  const wasNewRef = useRef<Set<number>>(new Set());

  // 새로 추가된 단위 감지
  const prevLen = prevLenRef.current;
  const isGrowing = chips.length > prevLen;

  useEffect(() => {
    prevLenRef.current = chips.length;
    wasNewRef.current = new Set();
  });

  // 단위별 카운트 집계
  const counts: Record<number, number> = {};
  for (const c of chips) {
    counts[c] = (counts[c] ?? 0) + 1;
  }

  // 이전 단위별 카운트 (prevLen 기준)
  const prevCounts: Record<number, number> = {};
  for (let i = 0; i < prevLen; i++) {
    const c = chips[i];
    if (c !== undefined) prevCounts[c] = (prevCounts[c] ?? 0) + 1;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center items-end">
      {CHIP_ORDER.map((denom) => {
        const count = counts[denom] ?? 0;
        if (count === 0) return null;
        const prevCount = prevCounts[denom] ?? 0;
        const isNew = isGrowing && count > prevCount;
        return (
          <ChipTower key={denom} denom={denom} count={count} isNew={isNew} />
        );
      })}
    </div>
  );
}
