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
const SVG_H = 260;

// 모든 탑의 시각적 바닥선 (SVG y 좌표)
// 칩 하단 타원 중심 = cy + stackH → 이게 FLOOR_Y에 맞춰짐
const FLOOR_Y = 230;

// 단위별 x 위치 + depth (draw order: 낮은 depth = 뒤)
const DENOM_SLOTS: Record<number, { cx: number; depth: number }> = {
  10000: { cx: 78,  depth: 1 },
  5000:  { cx: 264, depth: 0 },
  1000:  { cx: 136, depth: 3 },
  500:   { cx: 224, depth: 2 },
};

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** count 장 탑의 top-face y 좌표 (바닥 기준 역산) */
function topY(count: number): number {
  return FLOOR_Y - count * LAYERS_PER_CHIP - R * 0.45;
}

interface PhysicalTower {
  denom: number;
  count: number;
  cx: number;
  cy: number;   // top-face y
  tilt: number;
  depth: number;
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
    const slot  = DENOM_SLOTS[denom];
    const baseCx   = slot.cx + (sr(denom * 2) - 0.5) * 12;
    const baseTilt = (sr(denom * 5 + 2) - 0.5) * 14;

    if (total <= SPLIT_AT) {
      physicalTowers.push({
        denom, count: total,
        cx: baseCx, cy: topY(total),
        tilt: baseTilt, depth: slot.depth,
      });
    } else {
      const backCount  = Math.ceil(total / 2);
      const frontCount = total - backCount;
      physicalTowers.push({
        denom, count: backCount,
        cx: baseCx - R * 0.6, cy: topY(backCount),
        tilt: baseTilt - 4, depth: slot.depth - 0.5,
      });
      physicalTowers.push({
        denom, count: frontCount,
        cx: baseCx + R * 0.5, cy: topY(frontCount),
        tilt: baseTilt + 3, depth: slot.depth + 0.5,
      });
    }
  }

  // depth 오름차순 = 뒤→앞
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

        {physicalTowers.map(({ denom, count, cx, cy, tilt }, idx) => {
          const stackH = count * LAYERS_PER_CHIP;
          return (
            <g key={`${denom}-${idx}`} transform={`rotate(${tilt}, ${cx}, ${FLOOR_Y})`}>
              {/* 그림자 — 항상 FLOOR_Y에 */}
              <ellipse
                cx={cx} cy={FLOOR_Y + R * 0.12}
                rx={R * 0.38} ry={R * 0.1}
                fill="rgba(0,0,0,0.3)"
              />
              {/* 아래→위로 각 칩 독립 렌더링 */}
              {Array.from({ length: count }, (_, chipIdx) => {
                const chipTopY = cy + (count - 1 - chipIdx) * LAYERS_PER_CHIP;
                return (
                  <g key={chipIdx}>
                    {Array.from({ length: LAYERS_PER_CHIP }, (_, j) => (
                      <g key={j} transform={`translate(${cx},${chipTopY + LAYERS_PER_CHIP - j}) scale(1,0.45) rotate(25)`}>
                        <use href={`#cse-${denom}`} />
                      </g>
                    ))}
                    <g transform={`translate(${cx},${chipTopY}) scale(1,0.45) rotate(25)`}>
                      <use href={`#cst-${denom}`} />
                    </g>
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
