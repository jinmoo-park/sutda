/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
import { useEffect, useRef } from 'react';

const CHIP_STYLE: Record<number, { fill: string; side: string; edge: string; dash: string }> = {
  500:   { fill: '#D32F2F', side: '#B71C1C', edge: '#7f0000', dash: '#ffffff' },
  1000:  { fill: '#388E3C', side: '#1B5E20', edge: '#003300', dash: '#ffffff' },
  5000:  { fill: '#1976D2', side: '#0D47A1', edge: '#001a6e', dash: '#ffffff' },
  10000: { fill: '#F8F9FA', side: '#CFD8DC', edge: '#90A4AE', dash: '#1A237E' },
};

const CHIP_ORDER = [10000, 5000, 1000, 500];

// 칩 치수
const RX = 18;   // 타원 x 반지름
const RY = 6;    // 타원 y 반지름
const BODY = 12; // 칩 한 장 두께

/** 결정론적 pseudo-random 0..1 */
function sr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Tower {
  denom: number;
  count: number;
  cx: number;       // SVG 내 x 중심
  tilt: number;     // 전체 기울기 (도)
}

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

  // 타워 배치: 단위별로 불규칙한 x 간격 + 기울기
  // 기준 간격 30px, ±8px 랜덤 오프셋
  const towers: Tower[] = [];
  let curX = RX + 4;
  for (const denom of activeDenoms) {
    const nudge = (sr(denom) - 0.5) * 16;   // ±8px
    const tilt = (sr(denom * 3 + 1) - 0.5) * 12; // ±6도
    towers.push({ denom, count: counts[denom], cx: curX + nudge, tilt });
    curX += 30 + (sr(denom * 7) - 0.5) * 10; // 간격 25~35px
  }

  // SVG 크기 계산
  const maxCount = Math.max(...towers.map((t) => t.count));
  const svgH = RY + maxCount * BODY + RY + 16; // 여유 패딩
  const svgW = curX + RX + 8;

  // 각 타워를 SVG 아래쪽 기준(baseY)에서 위로 그림
  const baseY = svgH - RY - 4;

  return (
    <div style={isGrowing ? { animation: 'chip-slide-up 0.3s ease-out' } : undefined}>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {towers.map(({ denom, count, cx, tilt }) => {
          const s = CHIP_STYLE[denom] ?? CHIP_STYLE[500];

          // 칩 i: 0=맨 아래, count-1=맨 위
          // SVG drawOrder: 아래 칩 먼저(뒤) → 위 칩 나중(앞)
          const chipNodes = Array.from({ length: count }, (_, i) => {
            // 각 칩 개별 오프셋
            const dx = (sr(denom * 11 + i * 7) - 0.5) * 4;   // ±2px
            const dy = (sr(denom * 13 + i * 5) - 0.5) * 2;   // ±1px
            const chipRot = (sr(denom * 17 + i * 3) - 0.5) * 5; // ±2.5도

            const chipTopY = baseY - (i + 1) * BODY + dy;
            const chipCx = cx + dx;
            const isBottom = i === 0;

            return (
              <g key={i} transform={`rotate(${chipRot}, ${chipCx}, ${chipTopY})`}>
                {/* 측면 */}
                <rect
                  x={chipCx - RX + 1}
                  y={chipTopY}
                  width={(RX - 1) * 2}
                  height={BODY + RY}
                  fill={s.side}
                />
                {/* 측면 점 */}
                {[0.2, 0.4, 0.6, 0.8].map((frac, di) => (
                  <rect
                    key={di}
                    x={chipCx - RX + 1 + (RX - 1) * 2 * frac - 1.5}
                    y={chipTopY + (BODY - 2.5) / 2}
                    width={3} height={2.5} rx={0.5}
                    fill={s.dash} opacity={0.7}
                  />
                ))}
                {/* 하단 타원 (맨 아래 칩만) */}
                {isBottom && (
                  <ellipse cx={chipCx} cy={chipTopY + BODY} rx={RX} ry={RY} fill={s.edge} />
                )}
                {/* 상단 면 */}
                <ellipse cx={chipCx} cy={chipTopY} rx={RX} ry={RY} fill={s.fill} />
                {/* 대시 링 */}
                <ellipse
                  cx={chipCx} cy={chipTopY}
                  rx={RX * 0.78} ry={RY * 0.78}
                  fill="none" stroke={s.dash}
                  strokeWidth={4} strokeDasharray="5 3.5"
                  opacity={0.88}
                />
                {/* 내부 링 */}
                <ellipse
                  cx={chipCx} cy={chipTopY}
                  rx={RX * 0.5} ry={RY * 0.5}
                  fill="none" stroke={s.dash}
                  strokeWidth={0.8} opacity={0.6}
                />
                {/* 중앙 */}
                <ellipse cx={chipCx} cy={chipTopY} rx={RX * 0.44} ry={RY * 0.44} fill={s.fill} />
              </g>
            );
          });

          // 타워 전체를 cx, baseY 기준으로 기울임
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
