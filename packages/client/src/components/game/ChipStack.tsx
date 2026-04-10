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

const R = 65;               // 칩 반지름 (SVG 좌표계)
const LAYERS_PER_CHIP = 16; // 장당 edge-layer 수 → 두께감
const MAX_CHIPS = 6;        // 최대 표시 장 수

const SVG_W = 380;
const SVG_H = 260;

// 2행 산포: cy 작을수록 뒤, 클수록 앞 (draw order는 cy 오름차순)
const SCATTER_SLOTS = [
  { cx: 85,  cy: 88  },
  { cx: 268, cy: 82  },
  { cx: 140, cy: 116 },
  { cx: 230, cy: 110 },
];

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface ChipStackProps {
  chips: number[];
}

export function ChipStack({ chips }: ChipStackProps) {
  const prevLenRef = useRef<number>(chips.length);
  const isGrowing = chips.length > prevLenRef.current;
  useEffect(() => { prevLenRef.current = chips.length; });

  const counts: Record<number, number> = {};
  for (const c of chips) counts[c] = Math.min((counts[c] ?? 0) + 1, MAX_CHIPS);

  const activeDenoms = CHIP_ORDER.filter((d) => (counts[d] ?? 0) > 0);
  if (activeDenoms.length === 0) return null;

  const towers = activeDenoms
    .map((denom, i) => {
      const slot = SCATTER_SLOTS[i % SCATTER_SLOTS.length];
      return {
        denom,
        count: counts[denom],
        cx:   slot.cx + (sr(denom * 2)     - 0.5) * 14,
        cy:   slot.cy + (sr(denom * 3 + 1) - 0.5) * 10,
        tilt: (sr(denom * 5 + 2)           - 0.5) * 14,
      };
    })
    .sort((a, b) => a.cy - b.cy);

  return (
    <div style={isGrowing ? { animation: 'chip-slide-up 0.3s ease-out' } : undefined}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', maxWidth: '140px', margin: '0 auto', overflow: 'visible' }}
      >
        <defs>
          {CHIP_ORDER.map((denom) => {
            const c = CHIP_COLORS[denom];
            const da = R * 0.4189; // dasharray (비율 고정)
            return (
              <g key={denom}>
                <g id={`cs-edge-${denom}`}>
                  <circle r={R} fill={c.edge} />
                  <circle r={R * 0.8} fill="none" stroke={c.edgeDash} strokeWidth={R * 0.4} strokeDasharray={da} />
                </g>
                <g id={`cs-top-${denom}`}>
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
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="45%"  stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {towers.map(({ denom, count, cx, cy, tilt }) => {
          const totalLayers = count * LAYERS_PER_CHIP;
          return (
            <g key={denom} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
              {/* 그림자 */}
              <ellipse
                cx={cx} cy={cy + totalLayers + R * 0.2}
                rx={R * 0.42} ry={R * 0.12}
                fill="rgba(0,0,0,0.3)"
              />
              {/* edge-layers: 아래(i=0)부터 위(i=totalLayers-1)까지 */}
              {Array.from({ length: totalLayers }, (_, i) => (
                <g key={i} transform={`translate(${cx},${cy + totalLayers - i}) scale(1,0.45) rotate(25)`}>
                  <use href={`#cs-edge-${denom}`} />
                </g>
              ))}
              {/* 상단 면 */}
              <g transform={`translate(${cx},${cy}) scale(1,0.45) rotate(25)`}>
                <use href={`#cs-top-${denom}`} />
              </g>
              {/* 하이라이트 */}
              <g transform={`translate(${cx},${cy}) scale(1,0.45) rotate(25)`}>
                <ellipse rx={R} ry={R} fill="url(#cs-light)" />
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
