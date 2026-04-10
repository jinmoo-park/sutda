/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
/* 칩 렌더링: Gemini SVG 방식 — scale(1, 0.45) rotate(25) 비스듬히 보기 */
import { useEffect, useRef } from 'react';

const CHIP_COLORS: Record<number, {
  top: string; edge: string; dash: string; edgeDash: string;
}> = {
  500:   { top: '#D32F2F', edge: '#B71C1C', dash: '#ffffff', edgeDash: '#e08080' },
  1000:  { top: '#388E3C', edge: '#1B5E20', dash: '#ffffff', edgeDash: '#80c080' },
  5000:  { top: '#1976D2', edge: '#0D47A1', dash: '#ffffff', edgeDash: '#80aae0' },
  10000: { top: '#F8F9FA', edge: '#CFD8DC', dash: '#1A237E', edgeDash: '#90A4AE' },
};

const CHIP_ORDER = [10000, 5000, 1000, 500];

const R = 50;
const LAYERS_PER_CHIP = 18;
const SPLIT_AT = 4;
const MAX_CHIPS = 10;

const SVG_W = 380;
const SVG_H = 290;
const CENTER = SVG_W / 2;

// 뒷줄/앞줄 바닥: 85px 차이로 강한 원근감
const FLOOR_BACK  = 165;  // 뒤 (화면 위쪽 = 멀리)
const FLOOR_FRONT = 250;  // 앞 (화면 아래쪽 = 가까이)

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function topYFor(count: number, floor: number) {
  return floor - count * LAYERS_PER_CHIP - R * 0.45;
}

/**
 * 뒷줄: 좌우 넓게 벌려 배치 (FLOOR_BACK)
 * 앞줄: 뒷줄 사이 중앙에 배치 (FLOOR_FRONT) → 뒷줄 하단만 자연스럽게 가림
 */
function clusterPositions(n: number): { cx: number; floor: number; depth: number }[] {
  switch (n) {
    case 1: return [
      { cx: CENTER, floor: FLOOR_FRONT, depth: 0 },
    ];
    case 2: return [
      { cx: CENTER - 45, floor: FLOOR_BACK,  depth: 0 },
      { cx: CENTER + 15, floor: FLOOR_FRONT, depth: 1 },
    ];
    case 3: return [
      { cx: CENTER - 68, floor: FLOOR_BACK,  depth: 0 },
      { cx: CENTER + 62, floor: FLOOR_BACK,  depth: 1 },
      { cx: CENTER + 2,  floor: FLOOR_FRONT, depth: 2 },
    ];
    default: return [
      { cx: CENTER - 72, floor: FLOOR_BACK,  depth: 0 }, // back-left
      { cx: CENTER + 72, floor: FLOOR_BACK,  depth: 1 }, // back-right
      { cx: CENTER - 18, floor: FLOOR_FRONT, depth: 2 }, // front — 뒷줄 사이에
      { cx: CENTER + 32, floor: FLOOR_FRONT, depth: 3 }, // front — 뒷줄 사이에
    ];
  }
}

interface PhysicalTower {
  denom: number;
  count: number;
  cx: number;
  cy: number;
  floor: number;
  depth: number;
  lean: number;
}

interface ChipStackProps {
  chips: number[];
}

export function ChipStack({ chips }: ChipStackProps) {
  const prevLenRef = useRef<number>(chips.length);
  const isGrowing = chips.length > prevLenRef.current;
  useEffect(() => { prevLenRef.current = chips.length; });

  const counts: Record<number, number> = {};
  for (const c of chips) counts[c] = (counts[c] ?? 0) + 1;

  const activeDenoms = CHIP_ORDER.filter((d) => (counts[d] ?? 0) > 0);
  if (activeDenoms.length === 0) return null;

  const slots = clusterPositions(activeDenoms.length);
  const physicalTowers: PhysicalTower[] = [];

  activeDenoms.forEach((denom, i) => {
    const total = Math.min(counts[denom], MAX_CHIPS);
    const slot  = slots[i];
    const nudge = (sr(denom * 2) - 0.5) * 10;
    const baseCx = slot.cx + nudge;
    const lean = (sr(denom * 11) - 0.5) * 2.5;

    if (total <= SPLIT_AT) {
      physicalTowers.push({
        denom, count: total,
        cx: baseCx, cy: topYFor(total, slot.floor),
        floor: slot.floor, depth: slot.depth, lean,
      });
    } else {
      const backCount  = Math.ceil(total / 2);
      const frontCount = total - backCount;
      physicalTowers.push({
        denom, count: backCount,
        cx: baseCx - R * 0.4,
        cy: topYFor(backCount, slot.floor),
        floor: slot.floor, depth: slot.depth - 0.3, lean: lean - 0.3,
      });
      physicalTowers.push({
        denom, count: frontCount,
        cx: baseCx + R * 0.35,
        cy: topYFor(frontCount, slot.floor),
        floor: slot.floor, depth: slot.depth + 0.3, lean: lean + 0.5,
      });
    }
  });

  physicalTowers.sort((a, b) => a.depth - b.depth);

  const da = R * 0.4189;

  return (
    <div style={{
      overflow: 'visible',
      ...(isGrowing ? { animation: 'chip-slide-up 0.3s ease-out' } : {}),
    }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', maxWidth: '180px', margin: '0 auto', overflow: 'visible' }}
      >
        <defs>
          {CHIP_ORDER.map((denom) => {
            const c = CHIP_COLORS[denom];
            return (
              <g key={denom}>
                <g id={`cse-${denom}`}>
                  <circle r={R} fill={c.edge} />
                  <circle r={R * 0.8} fill="none" stroke={c.edgeDash} strokeWidth={R * 0.4} strokeDasharray={da} />
                </g>
                <g id={`cst-${denom}`}>
                  <circle r={R} fill={c.top} />
                  <circle r={R * 0.8} fill="none" stroke={c.dash} strokeWidth={R * 0.4} strokeDasharray={da} />
                  <circle r={R * 0.62} fill={c.top} />
                  <circle r={R * 0.54} fill="none" stroke={c.dash} strokeWidth={3} />
                  <circle r={R * 0.49} fill={c.top} />
                </g>
              </g>
            );
          })}
          <linearGradient id="cs-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="45%"  stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {physicalTowers.map(({ denom, count, cx, cy, floor, lean }, towerIdx) => (
          <g key={`${denom}-${towerIdx}`}>
            {/* 그림자 — 각 줄의 floor에 고정 */}
            <ellipse
              cx={cx} cy={floor + R * 0.1}
              rx={R * 0.38} ry={R * 0.1}
              fill="rgba(0,0,0,0.3)"
            />
            {Array.from({ length: count }, (_, chipIdx) => {
              const leanDx   = chipIdx * lean;
              const jitterDx = (sr(denom * 7 + chipIdx * 13 + towerIdx) - 0.5) * 4;
              const chipCx   = cx + leanDx + jitterDx;
              const chipTopY = cy + (count - 1 - chipIdx) * LAYERS_PER_CHIP;

              return (
                <g key={chipIdx}>
                  {Array.from({ length: LAYERS_PER_CHIP }, (_, j) => (
                    <g key={j} transform={`translate(${chipCx},${chipTopY + LAYERS_PER_CHIP - j}) scale(1,0.45) rotate(25)`}>
                      <use href={`#cse-${denom}`} />
                    </g>
                  ))}
                  <g transform={`translate(${chipCx},${chipTopY}) scale(1,0.45) rotate(25)`}>
                    <use href={`#cst-${denom}`} />
                  </g>
                  <g transform={`translate(${chipCx},${chipTopY}) scale(1,0.45) rotate(25)`}>
                    <ellipse rx={R} ry={R} fill="url(#cs-light)" />
                  </g>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
