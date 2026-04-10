/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
import { useEffect, useRef } from 'react';

const CHIP_STYLE: Record<number, { fill: string; side: string; edge: string; dash: string }> = {
  500:   { fill: '#D32F2F', side: '#B71C1C', edge: '#7f0000', dash: '#ffffff' },
  1000:  { fill: '#388E3C', side: '#1B5E20', edge: '#003300', dash: '#ffffff' },
  5000:  { fill: '#1976D2', side: '#0D47A1', edge: '#001a6e', dash: '#ffffff' },
  10000: { fill: '#F8F9FA', side: '#CFD8DC', edge: '#90A4AE', dash: '#1A237E' },
};

const CHIP_ORDER = [10000, 5000, 1000, 500];

// 칩 치수 — 얇은 코인 형태
const RX = 20;
const RY = 8;
const BODY = 7;  // 얇게

/** deterministic pseudo-random 0..1 */
function sr(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 고정 산포 좌표: 앞줄/뒷줄 2행으로 불규칙 배치
// baseY가 클수록 앞(뷰어 가까이) → 그림 뒤에서부터 그려야 함
const SCATTER_SLOTS = [
  { cx: 32,  baseY: 58, tilt: -5 },
  { cx: 82,  baseY: 52, tilt: 4  },
  { cx: 55,  baseY: 84, tilt: -3 },
  { cx: 108, baseY: 78, tilt: 6  },
];

const CANVAS_W = 148;
const CANVAS_H = 108;

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

  // 활성 단위에 scatter slot 할당 후 baseY 기준 정렬 (뒤→앞)
  const towers = activeDenoms
    .map((denom, i) => {
      const slot = SCATTER_SLOTS[i % SCATTER_SLOTS.length];
      // slot마다 약간의 랜덤 nudge 추가
      return {
        denom,
        count: counts[denom],
        cx:    slot.cx    + (sr(denom * 2)     - 0.5) * 10,
        baseY: slot.baseY + (sr(denom * 3 + 1) - 0.5) * 8,
        tilt:  slot.tilt  + (sr(denom * 5 + 2) - 0.5) * 4,
      };
    })
    .sort((a, b) => a.baseY - b.baseY); // 뒤(작은 baseY) → 앞 순서로 draw

  return (
    <div style={isGrowing ? { animation: 'chip-slide-up 0.3s ease-out' } : undefined}>
      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}
      >
        {towers.map(({ denom, count, cx, baseY, tilt }) => {
          const s = CHIP_STYLE[denom] ?? CHIP_STYLE[500];

          // 칩 i: 0=맨 아래, count-1=맨 위
          const chipNodes = Array.from({ length: count }, (_, i) => {
            const dx      = (sr(denom * 11 + i * 7)  - 0.5) * 4;
            const dy      = (sr(denom * 13 + i * 5)  - 0.5) * 2;
            const chipRot = (sr(denom * 17 + i * 3)  - 0.5) * 5;

            const topY  = baseY - (i + 1) * BODY + dy;
            const chipX = cx + dx;

            return (
              <g key={i} transform={`rotate(${chipRot}, ${chipX}, ${topY})`}>
                {/* 측면 밴드 */}
                <rect
                  x={chipX - RX + 1} y={topY}
                  width={(RX - 1) * 2} height={BODY + RY}
                  fill={s.side}
                />
                {/* 측면 점 (대시 패턴) */}
                {[0.2, 0.4, 0.6, 0.8].map((frac, di) => (
                  <rect
                    key={di}
                    x={chipX - RX + 1 + (RX - 1) * 2 * frac - 1.5}
                    y={topY + (BODY - 2.5) / 2}
                    width={3} height={2.5} rx={0.5}
                    fill={s.dash} opacity={0.7}
                  />
                ))}
                {/* 하단 타원 (맨 아래 칩만) */}
                {i === 0 && (
                  <ellipse cx={chipX} cy={topY + BODY} rx={RX} ry={RY} fill={s.edge} />
                )}
                {/* 상단 면 */}
                <ellipse cx={chipX} cy={topY} rx={RX} ry={RY} fill={s.fill} />
                {/* 대시 링 — 원본 SVG 패턴 */}
                <ellipse
                  cx={chipX} cy={topY} rx={RX * 0.78} ry={RY * 0.78}
                  fill="none" stroke={s.dash}
                  strokeWidth={4.5} strokeDasharray="5 3.5" opacity={0.88}
                />
                {/* 내부 링 */}
                <ellipse
                  cx={chipX} cy={topY} rx={RX * 0.5} ry={RY * 0.5}
                  fill="none" stroke={s.dash} strokeWidth={0.8} opacity={0.6}
                />
                {/* 중앙 원 */}
                <ellipse cx={chipX} cy={topY} rx={RX * 0.44} ry={RY * 0.44} fill={s.fill} />
              </g>
            );
          });

          return (
            <g key={denom} transform={`rotate(${tilt}, ${cx}, ${baseY})`}>
              {chipNodes}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
