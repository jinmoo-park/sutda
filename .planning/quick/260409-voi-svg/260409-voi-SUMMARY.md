---
phase: quick-260409-voi
plan: 01
subsystem: client-ui
tags: [chip-visualization, animation, desktop-ui]
dependency_graph:
  requires: []
  provides: [ChipStack 컴포넌트, 칩 SVG assets]
  affects: [GameTable 데스크탑 판돈 카드]
tech_stack:
  added: []
  patterns: [decompose 패턴 (액면가 분해), useRef prevPot 추적]
key_files:
  created:
    - packages/client/public/chips/500.svg
    - packages/client/public/chips/1k.svg
    - packages/client/public/chips/5k.svg
    - packages/client/public/chips/10k.svg
    - packages/client/src/components/game/ChipStack.tsx
  modified:
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/index.css
decisions:
  - "칩 애니메이션을 CSS keyframe + 인라인 style로 적용 (Tailwind arbitrary value 대신 — 동적 조건부 적용에 더 명확)"
  - "prevPot 추적에 useRef 사용 — 렌더 트리거 없이 이전값 비교"
metrics:
  duration: "~10분"
  completed: "2026-04-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 2
---

# Quick 260409-voi Plan 01: 칩 스택 시각화 Summary

**한 줄 요약:** 데스크탑 판돈 카드에 금액 분해 기반 칩 SVG 스택을 slide-up 애니메이션과 함께 표시하는 ChipStack 컴포넌트 구현

## 완료된 태스크

| # | 태스크 | 커밋 | 주요 파일 |
|---|--------|------|-----------|
| 1 | SVG 칩 파일 복사 및 ChipStack 컴포넌트 생성 | 6a3259b | public/chips/*.svg, ChipStack.tsx, index.css |
| 2 | GameTable 데스크탑 판돈 카드에 ChipStack 적용 | 53247fc | GameTable.tsx |

## 구현 상세

### ChipStack 컴포넌트 (`packages/client/src/components/game/ChipStack.tsx`)

- `decompose(pot)` 함수: 10000→5000→1000→500 순으로 액면가 분해, 최대 8개 슬라이스
- `prevPotRef` / `prevCountRef`로 이전 칩 수 추적 → 판돈 증가 시 새 칩에만 애니메이션 적용
- 판돈 감소(새 게임 시작) 시 애니메이션 없이 즉시 표시
- 칩 크기 `w-8 h-8` (32px), `flex flex-wrap gap-1 justify-center`

### GameTable.tsx 변경 (데스크탑 전용)

- `ChipStack` import 추가
- 판돈 텍스트 위쪽에 `{pot > 0 && <ChipStack pot={pot} />}` 조건부 렌더
- 금액 폰트 `text-[36px]` → `text-[28px]` (칩 스택 공간 확보)
- 카드에 `min-w-[160px]` 추가
- 모바일 섹션(`md:hidden`) 변경 없음

### CSS (`packages/client/src/index.css`)

```css
@keyframes chip-slide-up {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```
기존 `bigpot-pulse` keyframe 근처에 추가.

## 성공 기준 검증

| 기준 | 상태 |
|------|------|
| decompose(23500) → [10k, 10k, 1k, 1k, 1k, 500] | 로직 검증 완료 |
| TypeScript 컴파일 오류 없음 (신규 코드) | 통과 |
| 데스크탑 판돈 카드에 ChipStack 렌더 | 구현 완료 |
| 모바일 판돈 섹션 변경 없음 | 확인 완료 |
| 배팅 시 slide-up 애니메이션 | 구현 완료 |

## 계획과의 차이 (Deviations)

없음 — 플랜대로 정확히 실행됨.

## Known Stubs

없음.

## Threat Flags

없음 — 순수 클라이언트 UI 변경, 외부 입력 없음.

## Self-Check

- [x] `packages/client/public/chips/500.svg` 존재
- [x] `packages/client/public/chips/1k.svg` 존재
- [x] `packages/client/public/chips/5k.svg` 존재
- [x] `packages/client/public/chips/10k.svg` 존재
- [x] `packages/client/src/components/game/ChipStack.tsx` 존재
- [x] 커밋 `6a3259b` 존재 (Task 1)
- [x] 커밋 `53247fc` 존재 (Task 2)
