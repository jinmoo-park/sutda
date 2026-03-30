---
phase: 07-sejang-hanjang-modes
plan: "02"
subsystem: client-frontend
tags: [ui, modal, card-select, shared-card, sejang, hanjang, react]
dependency_graph:
  requires: [07-01-sejang-hanjang-backend]
  provides: [sejang-ui, hanjang-ui, mode-select-ui, shared-card-display]
  affects:
    - packages/client/src/components/modals/ModeSelectModal.tsx
    - packages/client/src/components/modals/SharedCardSelectModal.tsx
    - packages/client/src/components/game/SharedCardDisplay.tsx
    - packages/client/src/components/layout/HandPanel.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/pages/RoomPage.tsx
tech_stack:
  added: []
  patterns: [conditional-rendering, controlled-component, shadcn-dialog, tailwind-v4]
key_files:
  created:
    - packages/client/src/components/modals/SharedCardSelectModal.tsx
    - packages/client/src/components/game/SharedCardDisplay.tsx
  modified:
    - packages/client/src/components/modals/ModeSelectModal.tsx
    - packages/client/src/components/layout/HandPanel.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - "SharedCardSelectModal은 DealerSelectModal 패턴 기반으로 구현 — 딜러=CardFace(앞면), 비딜러=CardBack(뒷면)"
  - "HandPanel card-select 모드: selectedIndices state로 토글 관리, phase prop 외부 주입 방식 채택"
  - "sharedCard는 store에서 직접 읽지 않고 RoomPage에서 prop으로 전달 — 데이터 흐름 명확화"
  - "betting-1/betting-2 phase도 BettingPanel 표시 조건에 추가 — 세장섯다 베팅 UI 지원"
metrics:
  duration_seconds: 0
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 2
  files_modified: 4
---

# Phase 07 Plan 02: 세장섯다 + 한장공유 클라이언트 UI Summary

## 한 줄 요약

ModeSelectModal 3모드 확장 + SharedCardSelectModal(딜러앞면/비딜러뒷면) + SharedCardDisplay(테이블중앙) + HandPanel card-select 토글 UI + RoomPage 신규 phase 통합으로 세장섯다/한장공유 모드 클라이언트 UI 완전 구현, Vite 빌드 성공.

## 완료된 작업

### Task 1: ModeSelectModal 확장 + SharedCardSelectModal 신규 + SharedCardDisplay + HandPanel 카드 선택 모드

**커밋:** `e919f20`

#### ModeSelectModal.tsx 수정

- 기존 단일 '오리지날 섯다' 버튼 → 3개 버튼 세로 스택 (flex-col gap-2)
- '세장섯다' 버튼: `emit('select-mode', { roomId, mode: 'three-card' })`
- '한장공유' 버튼: `emit('select-mode', { roomId, mode: 'shared-card' })`
- 비딜러 모든 버튼 disabled 유지

#### SharedCardSelectModal.tsx 신규 생성

- DealerSelectModal 패턴 기반 20장 그리드
- 딜러: CardFace(앞면) 표시, 클릭 가능
- 비딜러: CardBack(뒷면) 표시, cursor-not-allowed
- 선택 시 `emit('set-shared-card', { roomId, cardIndex })`
- 선택 후 ring-2 ring-primary 피드백
- onInteractOutside/onEscapeKeyDown: preventDefault

#### SharedCardDisplay.tsx 신규 생성

- 공유 카드를 테이블 중앙에 표시
- 크기: w-20 h-[120px] (기본 w-16 h-24의 1.25배)
- 스타일: ring-2 ring-primary/50 둘레 강조
- 라벨: "공유 카드" (text-xs text-muted-foreground)

#### HandPanel.tsx 수정

Props 확장:
- `phase?: GamePhase` — card-select phase 감지
- `onSelectCards?: (indices: number[]) => void` — 선택 완료 콜백
- `sharedCard?: Card` — 한장공유 족보 계산용

card-select 모드 로직:
- `isCardSelectMode = phase === 'card-select' && isAlive && !alreadySelected`
- `selectedIndices` state: 최대 2개, 토글 방식
- 선택된 카드: `ring-2 ring-primary scale-105 opacity-100`
- 미선택 카드: `opacity-70 hover:opacity-100 hover:ring-1 hover:ring-primary/50`
- "2장을 선택하세요 (N/2)" 힌트 + "선택 완료" 버튼 (2장 선택 시 활성화)
- 제출 후: "선택 완료! 다른 플레이어를 기다리는 중..." 텍스트

족보 계산 로직 3분기:
1. `alreadySelected && selectedCards`: 선택된 2장으로 계산
2. `cards.length === 1 && sharedCard`: 내 1장 + 공유카드
3. `cards.length >= 2 && phase !== 'card-select'`: 기본 2장

### Task 2: GameTable 공유카드 표시 + RoomPage 통합

**커밋:** `8bb7f6a`

#### GameTable.tsx 수정

- `sharedCard?: Card`, `mode?: GameMode` prop 추가
- 데스크톱 팟 div 하단: `mode === 'shared-card' && sharedCard` 조건으로 SharedCardDisplay 렌더
- 모바일 팟 요약 하단: 동일 조건부 렌더
- `font-bold` → `font-semibold` 통일 (UI-SPEC Display weight 600 규칙)

#### RoomPage.tsx 수정

1. `SharedCardSelectModal` import 추가
2. `GameTable`에 `sharedCard={gameState.sharedCard}`, `mode={gameState.mode}` prop 전달
3. `HandPanel`에 `phase`, `onSelectCards`, `sharedCard` prop 전달 (명시적 prop 패턴)
4. `SharedCardSelectModal open={phase === 'shared-card-select'}` 추가
5. BettingPanel 조건: `betting` → `betting || betting-1 || betting-2`
6. cutting 전환 감지: `betting` → `betting || betting-1`
7. 딜링 상태 초기화 조건: `betting-1`, `betting-2`, `card-select` 추가

## 빌드 결과

```
vite v6.4.1 building for production...
✓ 1876 modules transformed.
✓ built in 4.58s
```

TypeScript 에러 없음.

## Deviations from Plan

### 계획 준수

계획대로 정확히 구현됨. 주요 구현 세부사항:

1. **HandPanel button wrapper 패턴**: 카드를 `<button>` 요소로 감싸서 키보드 접근성 확보 — 계획의 onClick 추가 방식보다 더 명시적인 접근법 채택.

2. **SharedCardSelectModal selectedIndex state**: 선택 후 즉시 UI 피드백을 위해 로컬 state 사용. gameState.sharedCard를 기다리는 대신 즉각 ring 피드백 제공.

3. **GameTable font-bold → font-semibold**: UI-SPEC Typography 규칙 (Display weight 600) 준수로 기존 `font-bold` 수정.

## Known Stubs

없음 — 모든 이벤트 emit이 서버 계약과 연결됨.

## Self-Check: PASSED

**파일 존재 확인:**
- `packages/client/src/components/modals/SharedCardSelectModal.tsx`: 존재 ✓
- `packages/client/src/components/game/SharedCardDisplay.tsx`: 존재 ✓
- ModeSelectModal.tsx에 "세장섯다" 문자열: ✓
- ModeSelectModal.tsx에 "한장공유" 문자열: ✓
- HandPanel.tsx에 `card-select` 로직: ✓
- HandPanel.tsx에 `sharedCard` prop: ✓
- GameTable.tsx에 SharedCardDisplay import: ✓
- RoomPage.tsx에 SharedCardSelectModal: ✓
- RoomPage.tsx에 `betting-1` 처리: ✓

**커밋 존재 확인:**
- `e919f20` (Task 1): 존재 ✓
- `8bb7f6a` (Task 2): 존재 ✓

## 체크포인트 대기

Task 3 (checkpoint:human-verify)에서 수동 검증 대기 중.
서버/클라이언트를 실행하고 브라우저 2탭으로 세장섯다/한장공유/오리지날 모드를 검증해야 함.
