/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
/* 칩 렌더링: Gemini SVG 방식 — scale(1, 0.45) rotate(25) 비스듬히 보기 */
import { useEffect, useRef } from 'react';

/**
 * 원본 SVG 색상 기반
 * 500  : #D32F2F 빨강 / 흰 대시
 * 1000 : #388E3C 초록 / 흰 대시
 * 5000 : #1976D2 파랑 / 흰 대시
 * 10000: #F8F9FA 흰   / #1A237E 네이비 대시
 */
const CHIP_COLORS: Record<number, {
  top: string;    // 상단 면 색
  edge: string;   // 측면(두께) 색
  dash: string;   // 줄무늬 대시 색 (상단)
  edgeDash: string; // 측면 대시 색
}> = {
  500:   { top: '#D32F2F', edge: '#B71C1C', dash: '#ffffff', edgeDash: '#e08080' },
  1000:  { top: '#388E3C', edge: '#1B5E20', dash: '#ffffff', edgeDash: '#80c080' },
  5000:  { top: '#1976D2', edge: '#0D47A1', dash: '#ffffff', edgeDash: '#80aae0' },
  10000: { top: '#F8F9FA', edge: '#CFD8DC', dash: '#1A237E', edgeDash: '#90A4AE' },
};

const CHIP_ORDER = [10000, 5000, 1000, 500];

// Gemini SVG 기준치 (r=100 기준 좌표계)
const R = 100;
// 단위 당 edge-layer 수 (두께감)
const LAYERS_PER_CHIP = 5;

/** deterministic pseudo-random 0..1 */
function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 4 슬롯 2D 산포 위치 (SVG 400×240 좌표계 기준)
// cy가 클수록 앞쪽 → 뒤→앞 순서로 그려야 함
const SCATTER_SLOTS = [
  { cx: 105, cy: 110 },
  { cx: 285, cy: 102 },
  { cx: 158, cy: 148 },
  { cx: 248, cy: 138 },
];

const SVG_W = 400;
const SVG_H = 240;

interface ChipStackProps {
  chips: number[];
}

export function ChipStack({ chips }: ChipStackProps) {
  const prevLenRef = useRef<number>(chips.length);
  const isGrowing = chips.length > prevLenRef.current;
  useEffect(() => { prevLenRef.current = chips.length; });

  // 단위별 카운트 (최대 8장)
  const counts: Record<number, number> = {};
  for (const c of chips) counts[c] = Math.min((counts[c] ?? 0) + 1, 8);

  const activeDenoms = CHIP_ORDER.filter((d) => (counts[d] ?? 0) > 0);
  if (activeDenoms.length === 0) return null;

  // 활성 단위에 scatter slot 할당 + nudge
  const towers = activeDenoms
    .map((denom, i) => {
      const slot = SCATTER_SLOTS[i % SCATTER_SLOTS.length];
      return {
        denom,
        count: counts[denom],
        cx: slot.cx + (sr(denom * 2) - 0.5) * 20,
        cy: slot.cy + (sr(denom * 3) - 0.5) * 12,
        tilt: (sr(denom * 5) - 0.5) * 14,
      };
    })
    .sort((a, b) => a.cy - b.cy); // 뒤(작은 cy) → 앞 순으로 draw

  return (
    <div style={isGrowing ? { animation: 'chip-slide-up 0.3s ease-out' } : undefined}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', maxWidth: '200px', margin: '0 auto', overflow: 'visible' }}
      >
        <defs>
          {/* 단위별 edge-layer 및 top-face 정의 */}
          {CHIP_ORDER.map((denom) => {
            const c = CHIP_COLORS[denom];
            return (
              <g key={denom}>
                <g id={`cs-edge-${denom}`}>
                  <circle r={R} fill={c.edge} />
                  <circle r={R * 0.8} fill="none" stroke={c.edgeDash} strokeWidth={R * 0.4} strokeDasharray={`${R * 0.4189}`} />
                </g>
                <g id={`cs-top-${denom}`}>
                  <circle r={R} fill={c.top} />
                  <circle r={R * 0.8} fill="none" stroke={c.dash} strokeWidth={R * 0.4} strokeDasharray={`${R * 0.4189}`} />
                  <circle r={R * 0.62} fill={c.top} />
                  <circle r={R * 0.54} fill="none" stroke={c.dash} strokeWidth={3} />
                  <circle r={R * 0.49} fill={c.top} />
                </g>
              </g>
            );
          })}
        </defs>

        {towers.map(({ denom, count, cx, cy, tilt }) => {
          const totalLayers = count * LAYERS_PER_CHIP;
          return (
            <g key={denom} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
              {/* 바닥 그림자 */}
              <ellipse
                cx={cx - 4} cy={cy + 10}
                rx={R * 0.45} ry={R * 0.18}
                fill="rgba(0,0,0,0.25)"
                style={{ filter: 'blur(4px)' }}
              />
              {/* edge-layer들 (두께 표현) */}
              {Array.from({ length: totalLayers }, (_, i) => (
                <g
                  key={i}
                  transform={`translate(${cx}, ${cy + (totalLayers - i)}) scale(1, 0.45) rotate(25)`}
                >
                  <use href={`#cs-edge-${denom}`} />
                </g>
              ))}
              {/* 상단 면 */}
              <g transform={`translate(${cx}, ${cy}) scale(1, 0.45) rotate(25)`}>
                <use href={`#cs-top-${denom}`} />
              </g>
              {/* 하이라이트 */}
              <g transform={`translate(${cx}, ${cy}) scale(1, 0.45) rotate(25)`}>
                <ellipse rx={R} ry={R} fill="url(#cs-lighting)" />
              </g>
            </g>
          );
        })}

        {/* 전역 하이라이트 그라디언트 */}
        <defs>
          <linearGradient id="cs-lighting" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
