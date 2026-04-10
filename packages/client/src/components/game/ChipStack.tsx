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

const R = 65;
const LAYERS_PER_CHIP = 16;
const SPLIT_AT = 4;   // 이 수 초과 시 같은 단위를 2탑으로 분리
const MAX_CHIPS = 8;  // 단위당 최대 장 수

const SVG_W = 420;
const SVG_H = 270;

// 단위별 기본 슬롯 (최대 4단위 × 최대 2탑 = 8 물리 탑)
// 각 단위는 슬롯 하나를 가지며, 2탑으로 분리 시 ±offset으로 좌우 배치
const DENOM_SLOTS = [
  { cx: 90,  cy: 86  },  // 10000
  { cx: 290, cy: 80  },  // 5000
  { cx: 148, cy: 118 },  // 1000
  { cx: 245, cy: 112 },  // 500
];

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 단위 슬롯 인덱스 (CHIP_ORDER 기준)
const DENOM_SLOT_IDX: Record<number, number> = {
  10000: 0, 5000: 1, 1000: 2, 500: 3,
};

interface PhysicalTower {
  denom: number;
  count: number;   // 이 탑이 담당하는 장 수
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
  for (const c of chips) counts[c] = Math.min((counts[c] ?? 0) + 1, MAX_CHIPS);

  const activeDenoms = CHIP_ORDER.filter((d) => (counts[d] ?? 0) > 0);
  if (activeDenoms.length === 0) return null;

  // 물리 탑 목록 생성
  const physicalTowers: PhysicalTower[] = [];

  for (const denom of activeDenoms) {
    const total = counts[denom];
    const slotIdx = DENOM_SLOT_IDX[denom] ?? 0;
    const slot = DENOM_SLOTS[slotIdx];
    const baseCx = slot.cx + (sr(denom * 2)     - 0.5) * 12;
    const baseCy = slot.cy + (sr(denom * 3 + 1) - 0.5) * 8;
    const baseTilt = (sr(denom * 5 + 2) - 0.5) * 14;

    if (total <= SPLIT_AT) {
      // 단일 탑
      physicalTowers.push({ denom, count: total, cx: baseCx, cy: baseCy, tilt: baseTilt });
    } else {
      // 2탑으로 분리: 앞탑(많은 장) + 뒷탑(나머지)
      const backCount  = Math.ceil(total / 2);
      const frontCount = total - backCount;
      // 뒷탑: 슬롯에서 약간 왼쪽·위로
      physicalTowers.push({
        denom, count: backCount,
        cx: baseCx - R * 0.55,
        cy: baseCy - 10,
        tilt: baseTilt - 4,
      });
      // 앞탑: 슬롯에서 약간 오른쪽·아래로
      physicalTowers.push({
        denom, count: frontCount,
        cx: baseCx + R * 0.45,
        cy: baseCy + 8,
        tilt: baseTilt + 3,
      });
    }
  }

  // cy 오름차순(뒤→앞) draw order
  physicalTowers.sort((a, b) => a.cy - b.cy);

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
            const da = R * 0.4189;
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

        {physicalTowers.map(({ denom, count, cx, cy, tilt }, idx) => {
          const totalLayers = count * LAYERS_PER_CHIP;
          return (
            <g key={`${denom}-${idx}`} transform={`rotate(${tilt}, ${cx}, ${cy})`}>
              <ellipse
                cx={cx} cy={cy + totalLayers + R * 0.18}
                rx={R * 0.4} ry={R * 0.11}
                fill="rgba(0,0,0,0.28)"
              />
              {Array.from({ length: totalLayers }, (_, i) => (
                <g key={i} transform={`translate(${cx},${cy + totalLayers - i}) scale(1,0.45) rotate(25)`}>
                  <use href={`#cs-edge-${denom}`} />
                </g>
              ))}
              <g transform={`translate(${cx},${cy}) scale(1,0.45) rotate(25)`}>
                <use href={`#cs-top-${denom}`} />
              </g>
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
