/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
/* 칩 렌더링: Gemini SVG 방식 — scale(1, 0.45) rotate(25) 비스듬히 보기 */
/* 각 칩을 개별 top-face로 렌더링 → 장 수 경계 명확 */
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

const R = 50;               // 칩 반지름
const LAYERS_PER_CHIP = 18; // 칩 한 장 두께 (edge-layer 수)
const SPLIT_AT = 4;         // 초과 시 2탑으로 분리
const MAX_CHIPS = 10;       // 단위당 최대 장 (10장 넘으면 overflow)

const SVG_W = 380;
const SVG_H = 300;

const DENOM_SLOTS = [
  { cx: 80,  cy: 82  },  // 10000
  { cx: 262, cy: 76  },  // 5000
  { cx: 134, cy: 112 },  // 1000
  { cx: 222, cy: 106 },  // 500
];

const DENOM_SLOT_IDX: Record<number, number> = {
  10000: 0, 5000: 1, 1000: 2, 500: 3,
};

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface PhysicalTower {
  denom: number;
  count: number;
  cx: number;
  cy: number;
  tilt: number;
}

interface ChipStackProps {
  chips: number[];
}

export function ChipStack({ chips }: ChipStackProps) {
  const prevLenRef = useRef<number>(chips.length);
  const isGrowing = chips.length > prevLenRef.current;
  useEffect(() => { prevLenRef.current = chips.length; });

  const counts: Record<number, number> = {};
  for (const c of chips) counts[c] = (counts[c] ?? 0) + 1; // MAX_CHIPS 이상은 overflow 허용

  const activeDenoms = CHIP_ORDER.filter((d) => (counts[d] ?? 0) > 0);
  if (activeDenoms.length === 0) return null;

  const physicalTowers: PhysicalTower[] = [];

  for (const denom of activeDenoms) {
    const total = Math.min(counts[denom], MAX_CHIPS);
    const slot = DENOM_SLOTS[DENOM_SLOT_IDX[denom] ?? 0];
    const baseCx   = slot.cx + (sr(denom * 2)     - 0.5) * 12;
    const baseCy   = slot.cy + (sr(denom * 3 + 1) - 0.5) * 8;
    const baseTilt = (sr(denom * 5 + 2) - 0.5) * 14;

    if (total <= SPLIT_AT) {
      physicalTowers.push({ denom, count: total, cx: baseCx, cy: baseCy, tilt: baseTilt });
    } else {
      const backCount  = Math.ceil(total / 2);
      const frontCount = total - backCount;
      physicalTowers.push({
        denom, count: backCount,
        cx: baseCx - R * 0.6, cy: baseCy - 10, tilt: baseTilt - 4,
      });
      physicalTowers.push({
        denom, count: frontCount,
        cx: baseCx + R * 0.5, cy: baseCy + 8, tilt: baseTilt + 3,
      });
    }
  }

  physicalTowers.sort((a, b) => a.cy - b.cy);

  const da = R * 0.4189; // dasharray

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

        {physicalTowers.map(({ denom, count, cx, cy, tilt }, towerIdx) => {
          const stackH = count * LAYERS_PER_CHIP;
          return (
            <g key={`${denom}-${towerIdx}`} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
              {/* 그림자 */}
              <ellipse
                cx={cx} cy={cy + stackH + R * 0.18}
                rx={R * 0.38} ry={R * 0.1}
                fill="rgba(0,0,0,0.3)"
              />

              {/*
               * 칩을 아래(0)에서 위(count-1) 순으로 그림.
               * 각 칩마다 edge-layer + top-face 독립 렌더링
               * → top-face가 아래 칩의 edge-layer를 덮어 경계가 명확하게 보임
               */}
              {Array.from({ length: count }, (_, chipIdx) => {
                // chipIdx=0: 맨 아래 칩, chipIdx=count-1: 맨 위 칩
                // 맨 위 칩의 top-face = cy, 그 아래 칩은 LAYERS_PER_CHIP씩 내려감
                const chipTopY = cy + (count - 1 - chipIdx) * LAYERS_PER_CHIP;

                return (
                  <g key={chipIdx}>
                    {/* 이 칩의 edge-layers */}
                    {Array.from({ length: LAYERS_PER_CHIP }, (_, j) => (
                      <g key={j} transform={`translate(${cx},${chipTopY + LAYERS_PER_CHIP - j}) scale(1,0.45) rotate(25)`}>
                        <use href={`#cse-${denom}`} />
                      </g>
                    ))}
                    {/* 이 칩의 top-face */}
                    <g transform={`translate(${cx},${chipTopY}) scale(1,0.45) rotate(25)`}>
                      <use href={`#cst-${denom}`} />
                    </g>
                    {/* 하이라이트 */}
                    <g transform={`translate(${cx},${chipTopY}) scale(1,0.45) rotate(25)`}>
                      <ellipse rx={R} ry={R} fill="url(#cs-light)" />
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
