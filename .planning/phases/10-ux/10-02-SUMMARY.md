---
phase: 10-ux
plan: 02
subsystem: client-layout
tags: [layout, responsive, image-assets, bet-highlight, ux]
dependency_graph:
  requires: []
  provides: [responsive-game-layout, background-image, title-image, rematch-overlay, bet-highlight]
  affects: [RoomPage, GameTable, BettingPanel, WaitingRoom, ResultScreen]
tech_stack:
  added: []
  patterns: [tailwind-dvh-grid, conditional-ring-glow, css-keyframe-fadein]
key_files:
  created:
    - packages/client/src/components/layout/__tests__/GameLayout.test.tsx
  modified:
    - packages/client/src/pages/RoomPage.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/components/layout/BettingPanel.tsx
    - packages/client/src/components/layout/WaitingRoom.tsx
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/layout/__tests__/BettingPanel.test.tsx
    - packages/client/src/index.css
decisions:
  - RoomPage 헤더 제거 — 3열 레이아웃에서 공간 낭비, 방 ID는 InfoPanel에서 확인 가능
  - isRematch 판단을 prevPhaseRef 기반으로 구현 — gameState에 round 필드 없어 phase 이력 활용
  - BettingPanel 항상 렌더하되 조건부로 null 반환 방식 대신 레이아웃 변수로 분리
metrics:
  duration_minutes: 3
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_modified: 7
---

# Phase 10 Plan 02: RoomPage 반응형 레이아웃 + 이미지 에셋 적용 Summary

## 한 줄 요약

RoomPage를 데스크탑 3열(256px|1fr|256px) 그리드/모바일 수직 flex로 재설계하고, 배경·타이틀·재경기 이미지를 적용하며, BET-HIGHLIGHT ring+glow 강조를 추가했다.

## 완료된 태스크

### Task 1: RoomPage 3열/수직 반응형 레이아웃 + GameTable 배경 이미지

**커밋:** `59d1586`

**변경 사항:**
- `RoomPage.tsx`: 게임 진행 화면을 `hidden md:grid grid-cols-[256px_1fr_256px] h-dvh overflow-hidden` 3열 그리드로 재설계
  - 좌사이드: BettingPanel + HandPanel
  - 중앙: GameTable
  - 우사이드: InfoPanel + ChatPanel
- 모바일 `md:hidden flex flex-col h-dvh overflow-hidden` 수직 레이아웃
  - GameTable + InfoPanel 오버레이 (absolute top-2 right-2)
  - HandPanel + BettingPanel
  - ChatPanel h-12 placeholder
- 기존 상단 헤더(`방 {roomId}`) 제거
- 레이아웃 노드(handPanelNode, bettingPanelNode, gameTableNode, infoPanelNode)를 변수로 분리하여 두 레이아웃에서 재사용
- `GameTable.tsx`: 데스크탑·모바일 모두 `background.jpg` 배경 이미지 적용 (`backgroundSize: cover`)
- `GameLayout.test.tsx` 신규 생성 — 6개 테스트 모두 통과

### Task 2: WaitingRoom 타이틀 이미지 + ResultScreen 재경기 오버레이 + BettingPanel 강조

**커밋:** `d15a976`

**변경 사항:**
- `WaitingRoom.tsx`: `<h2>대기실</h2>` → `<img src="/img/main_tilte.jpg" />` (height: 80px, objectFit: contain)
- `ResultScreen.tsx`: `isRematch?: boolean` prop 추가, `regame.png` absolute 오버레이 (fadeIn 0.4s, pointer-events-none, opacity-85)
- `RoomPage.tsx`: `prevPhaseRef`로 이전 phase가 gusa-pending/gusa-announce/rematch-pending이면 `isRematch=true`로 ResultScreen에 전달
- `BettingPanel.tsx`: `cn` import 추가, `isMyTurn` 조건부 `ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_12px_hsl(75_55%_42%/0.35)]` 적용
- `index.css`: `@keyframes fadeIn` 추가
- `BettingPanel.test.tsx`: BET-HIGHLIGHT 소스 확인 테스트 5개 추가 (5 pass + 3 todo)

## 검증 결과

```
✓ src/components/layout/__tests__/GameLayout.test.tsx  (6 tests)
✓ src/components/layout/__tests__/BettingPanel.test.tsx (8 tests | 3 skipped)
전체 레이아웃 테스트 suite: 2 passed, 3 skipped (todo only)
```

### 수락 기준 충족 확인

| 기준 | 결과 |
|------|------|
| RoomPage에 `grid-cols-[256px_1fr_256px]` 존재 | ✓ |
| RoomPage에 `h-dvh` 존재 | ✓ |
| RoomPage에 `overflow-hidden` 존재 | ✓ |
| RoomPage에 `md:hidden flex flex-col` 존재 | ✓ |
| GameTable에 `background.jpg` 존재 | ✓ |
| GameTable에 `backgroundSize` 존재 | ✓ |
| WaitingRoom에 `main_tilte.jpg` 존재 | ✓ |
| WaitingRoom에 `<img` 태그 존재 | ✓ |
| ResultScreen에 `regame.png` 존재 | ✓ |
| ResultScreen에 `pointer-events-none` 존재 | ✓ |
| BettingPanel에 `ring-primary` 존재 | ✓ |
| BettingPanel에 `ring-offset-background` 존재 | ✓ |
| BettingPanel에 `shadow-[0_0_12px` 존재 | ✓ |
| BettingPanel에 `cn` import 존재 | ✓ |

## 계획 대비 편차

### Auto-fixed Issues

없음 — 계획대로 정확히 실행됨.

### 주요 구현 선택

1. **레이아웃 노드 변수 분리**: 3열/수직 두 레이아웃에서 동일한 컴포넌트를 JSX 변수로 재사용하여 중복 코드 방지.
2. **isRematch 판단**: gameState에 `round` 필드가 없어 `prevPhaseRef.current`로 이전 phase를 추적하는 방식 채택 (plan의 제안 방법 그대로 구현).
3. **isRematch 변수 위치**: ResultScreen 렌더 직전에 한 번만 계산, 추가 state/ref 불필요.

## Known Stubs

- ChatPanel: "채팅 (준비 중)" 텍스트 placeholder — 다음 버전에서 구현 예정 (기존 stub 유지, 이번 plan 범위 밖)

## Self-Check: PASSED

- `packages/client/src/pages/RoomPage.tsx` — FOUND
- `packages/client/src/components/layout/GameTable.tsx` — FOUND
- `packages/client/src/components/layout/BettingPanel.tsx` — FOUND
- `packages/client/src/components/layout/WaitingRoom.tsx` — FOUND
- `packages/client/src/components/layout/ResultScreen.tsx` — FOUND
- `packages/client/src/components/layout/__tests__/GameLayout.test.tsx` — FOUND
- `packages/client/src/components/layout/__tests__/BettingPanel.test.tsx` — FOUND
- commit `59d1586` — FOUND
- commit `d15a976` — FOUND
