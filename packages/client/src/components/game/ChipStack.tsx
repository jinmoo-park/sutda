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

const SVG_W = 400;
const SVG_H = 300;
const CENTER = SVG_W / 2;

// 3열 원근
const FLOOR_BACK  = 148;
const FLOOR_MID   = 198;
const FLOOR_FRONT = 252;

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function topYFor(count: number, floor: number) {
  return floor - count * LAYERS_PER_CHIP - R * 0.45;
}

/**
 * 단위별 고유 영역 배정 (primary + split secondary)
 * 3열 지그재그: 각 단위가 서로 다른 깊이·위치에 놓임
 * split 시 secondary는 다른 줄+다른 x로 이동
 */
const TOWER_POS: Record<number, {
  primary:   { cx: number; floor: number; depth: number };
  secondary: { cx: number; floor: number; depth: number };
}> = {
  10000: {
    primary:   { cx: CENTER - 62, floor: FLOOR_BACK,  depth: 0 },
    secondary: { cx: CENTER - 85, floor: FLOOR_MID,   depth: 2 },
  },
  5000: {
    primary:   { cx: CENTER + 65, floor: FLOOR_BACK,  depth: 1 },
    secondary: { cx: CENTER + 88, floor: FLOOR_MID,   depth: 3 },
  },
  1000: {
    primary:   { cx: CENTER - 10, floor: FLOOR_MID,   depth: 4 },
    secondary: { cx: CENTER - 40, floor: FLOOR_FRONT, depth: 6 },
  },
  500: {
    primary:   { cx: CENTER + 35, floor: FLOOR_FRONT, depth: 5 },
    secondary: { cx: CENTER + 75, floor: FLOOR_FRONT, depth: 7 },
  },
};

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

  const physicalTowers: PhysicalTower[] = [];

  for (const denom of activeDenoms) {
    const total = Math.min(counts[denom], MAX_CHIPS);
    const pos   = TOWER_POS[denom];
    const p     = pos.primary;
    const nudge = (sr(denom * 2) - 0.5) * 8;
    const lean  = (sr(denom * 11) - 0.5) * 2.5;

    if (total <= SPLIT_AT) {
      physicalTowers.push({
        denom, count: total,
        cx: p.cx + nudge, cy: topYFor(total, p.floor),
        floor: p.floor, depth: p.depth, lean,
      });
    } else {
      const cnt1 = Math.ceil(total / 2);
      const cnt2 = total - cnt1;
      const s = pos.secondary;
      // primary 탑
      physicalTowers.push({
        denom, count: cnt1,
        cx: p.cx + nudge, cy: topYFor(cnt1, p.floor),
        floor: p.floor, depth: p.depth, lean,
      });
      // secondary 탑 — 다른 줄, 다른 x
      physicalTowers.push({
        denom, count: cnt2,
        cx: s.cx + nudge * 0.6, cy: topYFor(cnt2, s.floor),
        floor: s.floor, depth: s.depth, lean: lean * 0.8,
      });
    }
  }

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
        style={{ display: 'block', maxWidth: '190px', margin: '0 auto', overflow: 'visible' }}
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
