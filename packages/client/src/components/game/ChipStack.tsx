/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
import { useEffect, useRef } from 'react';

/**
 * SVG 원본 색상 그대로 사용
 * 500  : #D32F2F (빨강)  흰 줄무늬
 * 1000 : #388E3C (초록)  흰 줄무늬
 * 5000 : #1976D2 (파랑)  흰 줄무늬
 * 10000: #F8F9FA (흰)    네이비(#1A237E) 줄무늬
 */
const CHIP_STYLE: Record<number, {
  fill: string; side: string; edge: string; dash: string; text: string; label: string;
}> = {
  500:   { fill: '#D32F2F', side: '#B71C1C', edge: '#7f0000', dash: '#ffffff', text: '#D32F2F', label: '500' },
  1000:  { fill: '#388E3C', side: '#1B5E20', edge: '#003300', dash: '#ffffff', text: '#388E3C', label: '1천' },
  5000:  { fill: '#1976D2', side: '#0D47A1', edge: '#001a6e', dash: '#ffffff', text: '#1976D2', label: '5천' },
  10000: { fill: '#F8F9FA', side: '#CFD8DC', edge: '#90A4AE', dash: '#1A237E', text: '#1A237E', label: '1만' },
};

const CHIP_ORDER = [10000, 5000, 1000, 500];

const RX = 20;
const RY = 7;
const BODY = 14;
const W = RX * 2 + 2; // 42

/**
 * 결정론적 pseudo-random — seed 기반으로 항상 같은 값 반환
 * 렌더 간 일관성 유지 (useState/useRef 없이도 동일한 "무작위" 배치)
 */
function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

/** 칩 N장 타워 — 각 칩에 미세 기울기·오프셋 적용 */
function ChipTower({ denom, count, isNew }: { denom: number; count: number; isNew: boolean }) {
  const s = CHIP_STYLE[denom] ?? CHIP_STYLE[500];

  // 타워 전체에 약간의 기울기 (±4도)
  const towerTilt = (sr(denom) - 0.5) * 8;

  // SVG 높이: 칩 개수 + 여유 (오프셋으로 넘칠 수 있으므로 패딩 추가)
  const svgH = RY + count * BODY + RY + 10;
  const cx = W / 2;

  const chipElements = Array.from({ length: count }, (_, drawOrder) => {
    const chipIdx = count - 1 - drawOrder; // 0 = 최상단
    const baseTopY = RY + chipIdx * BODY;

    // 칩마다 미세 랜덤 오프셋 (±2.5px x, ±1px y)
    const dx = (sr(denom * 3 + chipIdx * 7 + 1) - 0.5) * 5;
    const dy = (sr(denom * 5 + chipIdx * 11 + 2) - 0.5) * 2;
    // 칩마다 미세 기울기 (±3도)
    const rot = (sr(denom * 7 + chipIdx * 13 + 3) - 0.5) * 6;

    const topY = baseTopY + dy;
    const topX = cx + dx;
    const isLowest = chipIdx === count - 1;

    return (
      <g key={drawOrder} transform={`rotate(${rot}, ${topX}, ${topY})`}>
        {/* 측면 밴드 */}
        <rect x={topX - RX + 1} y={topY} width={RX * 2 - 2} height={BODY + RY} fill={s.side} />

        {/* 측면 대시 점 4개 */}
        {[0, 1, 2, 3].map((d) => (
          <rect
            key={d}
            x={topX - RX + 1 + (RX * 2 - 2) * (d * 2 + 1) / 8 - 1.5}
            y={topY + (BODY - 3) / 2}
            width={3} height={3} rx={0.5}
            fill={s.dash} opacity={0.7}
          />
        ))}

        {/* 하단 타원 */}
        {isLowest && (
          <ellipse cx={topX} cy={topY + BODY} rx={RX} ry={RY} fill={s.edge} />
        )}

        {/* 칩 구분선 */}
        {!isLowest && (
          <ellipse cx={topX} cy={topY} rx={RX} ry={RY}
            fill="none" stroke={s.edge} strokeWidth={1} opacity={0.45} />
        )}

        {/* 상단 면 */}
        <ellipse cx={topX} cy={topY} rx={RX} ry={RY} fill={s.fill} />

        {/* 대시 링 — 원본 SVG 패턴 */}
        <ellipse cx={topX} cy={topY} rx={RX * 0.78} ry={RY * 0.78}
          fill="none" stroke={s.dash} strokeWidth={4.5}
          strokeDasharray="5.5 4" opacity={0.9} />

        {/* 안쪽 링 */}
        <ellipse cx={topX} cy={topY} rx={RX * 0.52} ry={RY * 0.52}
          fill="none" stroke={s.dash} strokeWidth={0.8} opacity={0.65} />

        {/* 중앙 면 */}
        <ellipse cx={topX} cy={topY} rx={RX * 0.46} ry={RY * 0.46} fill={s.fill} />
      </g>
    );
  });

  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{
        transform: `rotate(${towerTilt}deg)`,
        transformOrigin: 'bottom center',
        ...(isNew ? { animation: 'chip-slide-up 0.35s ease-out' } : {}),
      }}
    >
      <svg
        width={W + 10}
        height={svgH}
        viewBox={`-5 0 ${W + 10} ${svgH}`}
        style={{ overflow: 'visible' }}
      >
        {chipElements}
      </svg>
      <div className="flex flex-col items-center leading-none gap-px">
        <span className="text-[9px] font-semibold" style={{ color: s.text }}>{s.label}</span>
        <span className="text-[11px] font-black tabular-nums" style={{ color: s.text }}>×{count}</span>
      </div>
    </div>
  );
}

interface ChipStackProps {
  chips: number[];
}

export function ChipStack({ chips }: ChipStackProps) {
  const prevLenRef = useRef<number>(chips.length);
  const prevLen = prevLenRef.current;
  const isGrowing = chips.length > prevLen;

  useEffect(() => { prevLenRef.current = chips.length; });

  const counts: Record<number, number> = {};
  for (const c of chips) counts[c] = (counts[c] ?? 0) + 1;

  const prevCounts: Record<number, number> = {};
  for (let i = 0; i < prevLen; i++) {
    const c = chips[i];
    if (c !== undefined) prevCounts[c] = (prevCounts[c] ?? 0) + 1;
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center items-end px-1">
      {CHIP_ORDER.map((denom) => {
        const count = counts[denom] ?? 0;
        if (count === 0) return null;
        const isNew = isGrowing && count > (prevCounts[denom] ?? 0);
        return <ChipTower key={denom} denom={denom} count={count} isNew={isNew} />;
      })}
    </div>
  );
}
