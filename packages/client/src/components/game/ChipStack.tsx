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
const FLOOR_Y = 230;
const CENTER = SVG_W / 2; // 190

function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function topYFor(count: number) {
  return FLOOR_Y - count * LAYERS_PER_CHIP - R * 0.45;
}

/**
 * 활성 단위 수에 맞게 타이트한 클러스터 배치 반환
 * 간격 ~60px (칩 겹침 허용), 중앙 정렬
 */
function clusterPositions(n: number): { cx: number; depth: number }[] {
  const G = 78; // center-to-center gap (R=50 칩 겹침 최소화)
  switch (n) {
    case 1: return [
      { cx: CENTER, depth: 0 },
    ];
    case 2: return [
      { cx: CENTER - G * 0.45, depth: 0 },
      { cx: CENTER + G * 0.45, depth: 1 },
    ];
    case 3: return [
      { cx: CENTER - G * 0.55, depth: 0 },
      { cx: CENTER + G * 0.6,  depth: 1 },
      { cx: CENTER + G * 0.05, depth: 2 },
    ];
    default: return [ // 4
      { cx: CENTER - G * 0.75, depth: 0 }, // back-left
      { cx: CENTER + G * 0.8,  depth: 1 }, // back-right
      { cx: CENTER - G * 0.15, depth: 2 }, // front-center-left
      { cx: CENTER + G * 0.4,  depth: 3 }, // front-center-right
    ];
  }
}

interface PhysicalTower {
  denom: number;
  count: number;
  cx: number;
  cy: number;
  depth: number;
  lean: number; // 위로 갈수록 기울어지는 px/chip
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
    const nudge = (sr(denom * 2) - 0.5) * 12; // ±6px
    const baseCx = slot.cx + nudge;
    // 타워마다 고유 lean 방향 (위로 갈수록 한쪽으로 기울어짐)
    const lean = (sr(denom * 11) - 0.5) * 2.5; // ±1.25 px/chip

    if (total <= SPLIT_AT) {
      physicalTowers.push({
        denom, count: total,
        cx: baseCx, cy: topYFor(total),
        depth: slot.depth, lean,
      });
    } else {
      const backCount  = Math.ceil(total / 2);
      const frontCount = total - backCount;
      physicalTowers.push({
        denom, count: backCount,
        cx: baseCx - R * 0.4,
        cy: topYFor(backCount),
        depth: slot.depth - 0.3, lean: lean - 0.3,
      });
      physicalTowers.push({
        denom, count: frontCount,
        cx: baseCx + R * 0.35,
        cy: topYFor(frontCount),
        depth: slot.depth + 0.3, lean: lean + 0.5,
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

        {physicalTowers.map(({ denom, count, cx, cy, lean }, towerIdx) => (
          <g key={`${denom}-${towerIdx}`}>
            {/* 그림자 */}
            <ellipse
              cx={cx} cy={FLOOR_Y + R * 0.1}
              rx={R * 0.38} ry={R * 0.1}
              fill="rgba(0,0,0,0.3)"
            />
            {/* 아래→위로 칩별 독립 렌더링 */}
            {Array.from({ length: count }, (_, chipIdx) => {
              // lean: 위로 갈수록 한 방향으로 기울어짐 (바닥 칩=0, 맨 위=최대 lean)
              const leanDx = chipIdx * lean;
              // 랜덤 미세 흔들림
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
