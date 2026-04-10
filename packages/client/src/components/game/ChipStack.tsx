/* 데스크탑 판돈 카드 전용 — 모바일에서 사용 금지 */
import { useEffect, useRef } from 'react';

/**
 * SVG 원본 색상 그대로 사용
 * 500  : #D32F2F (빨강)  흰 줄무늬
 * 1000 : #388E3C (초록)  흰 줄무늬
 * 5000 : #1976D2 (파랑)  흰 줄무늬
 * 10000: #F8F9FA (흰)    네이비(#1A237E) 줄무늬
 */
const CHIP_STYLE: Record<number, {
  fill: string;       // 상단 면 배경
  side: string;       // 측면 색
  edge: string;       // 하단 테두리
  dash: string;       // 줄무늬 색
  text: string;       // 레이블 색
  label: string;
}> = {
  500:   { fill: '#D32F2F', side: '#B71C1C', edge: '#7f0000', dash: '#ffffff', text: '#D32F2F', label: '500' },
  1000:  { fill: '#388E3C', side: '#1B5E20', edge: '#003300', dash: '#ffffff', text: '#388E3C', label: '1천' },
  5000:  { fill: '#1976D2', side: '#0D47A1', edge: '#001a6e', dash: '#ffffff', text: '#1976D2', label: '5천' },
  10000: { fill: '#F8F9FA', side: '#CFD8DC', edge: '#90A4AE', dash: '#1A237E', text: '#1A237E', label: '1만' },
};

const CHIP_ORDER = [10000, 5000, 1000, 500];

// 치수
const RX = 20;        // 타원 x 반지름
const RY = 7;         // 타원 y 반지름 (납작함)
const BODY = 14;      // 칩 한 장 두께 (높이)
const W = RX * 2 + 2; // SVG 너비 = 42

/** 칩 N장을 세로로 쌓은 타워 SVG */
function ChipTower({ denom, count, isNew }: { denom: number; count: number; isNew: boolean }) {
  const s = CHIP_STYLE[denom] ?? CHIP_STYLE[500];
  const svgH = RY + count * BODY + RY + 2;
  const cx = W / 2;

  // SVG는 뒤에 그린 게 위에 표시 → 아래 칩부터 그린다 (drawOrder 0 = 맨 아래)
  const chipElements = Array.from({ length: count }, (_, drawOrder) => {
    const chipIdx = count - 1 - drawOrder;   // 0 = 맨 위 칩
    const topY = RY + chipIdx * BODY;
    const isLowest = chipIdx === count - 1;

    return (
      <g key={drawOrder}>
        {/* 측면 밴드 */}
        <rect x={1} y={topY} width={W - 2} height={BODY + RY} fill={s.side} />

        {/* 측면 흰(or 네이비) 대시 줄무늬 — 4개 등간격 */}
        {[0, 1, 2, 3].map((d) => (
          <rect
            key={d}
            x={1 + (W - 2) * (d * 2 + 1) / 8 - 1.5}
            y={topY + (BODY - 3) / 2}
            width={3}
            height={3}
            rx={0.5}
            fill={s.dash}
            opacity={0.75}
          />
        ))}

        {/* 하단 타원 (가장 아래 칩만) */}
        {isLowest && (
          <ellipse cx={cx} cy={topY + BODY} rx={RX} ry={RY} fill={s.edge} />
        )}

        {/* 칩 경계선 (윗 칩이 가리기 전 구분선) */}
        {!isLowest && (
          <ellipse cx={cx} cy={topY} rx={RX} ry={RY}
            fill="none" stroke={s.edge} strokeWidth={1} opacity={0.5}
          />
        )}

        {/* 상단 면 (배경) */}
        <ellipse cx={cx} cy={topY} rx={RX} ry={RY} fill={s.fill} />

        {/* 대시 링 — 원본 SVG 줄무늬 재현 */}
        <ellipse
          cx={cx} cy={topY}
          rx={RX * 0.78} ry={RY * 0.78}
          fill="none"
          stroke={s.dash}
          strokeWidth={4.5}
          strokeDasharray="5.5 4"
          opacity={0.9}
        />

        {/* 안쪽 원형 링 */}
        <ellipse
          cx={cx} cy={topY}
          rx={RX * 0.52} ry={RY * 0.52}
          fill="none"
          stroke={s.dash}
          strokeWidth={0.8}
          opacity={0.7}
        />

        {/* 중앙 면 */}
        <ellipse cx={cx} cy={topY} rx={RX * 0.46} ry={RY * 0.46} fill={s.fill} />
      </g>
    );
  });

  return (
    <div
      className="flex flex-col items-center gap-1"
      style={isNew ? { animation: 'chip-slide-up 0.35s ease-out' } : undefined}
    >
      <svg
        width={W}
        height={svgH}
        viewBox={`0 0 ${W} ${svgH}`}
        style={{ overflow: 'visible' }}
      >
        {chipElements}
      </svg>
      {/* 단위 + 수량 */}
      <div className="flex flex-col items-center leading-none gap-px">
        <span className="text-[9px] font-semibold" style={{ color: s.text }}>
          {s.label}
        </span>
        <span className="text-[11px] font-black tabular-nums" style={{ color: s.text }}>
          ×{count}
        </span>
      </div>
    </div>
  );
}

interface ChipStackProps {
  chips: number[];   // potChipLog
}

export function ChipStack({ chips }: ChipStackProps) {
  const prevLenRef = useRef<number>(chips.length);

  const prevLen = prevLenRef.current;
  const isGrowing = chips.length > prevLen;

  useEffect(() => {
    prevLenRef.current = chips.length;
  });

  // 단위별 카운트
  const counts: Record<number, number> = {};
  for (const c of chips) counts[c] = (counts[c] ?? 0) + 1;

  // 이전 단위별 카운트 (애니메이션 대상 판별용)
  const prevCounts: Record<number, number> = {};
  for (let i = 0; i < prevLen; i++) {
    const c = chips[i];
    if (c !== undefined) prevCounts[c] = (prevCounts[c] ?? 0) + 1;
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center items-end">
      {CHIP_ORDER.map((denom) => {
        const count = counts[denom] ?? 0;
        if (count === 0) return null;
        const isNew = isGrowing && count > (prevCounts[denom] ?? 0);
        return <ChipTower key={denom} denom={denom} count={count} isNew={isNew} />;
      })}
    </div>
  );
}
