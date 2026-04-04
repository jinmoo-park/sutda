---
phase: quick-260404-tgm
plan: 01
subsystem: client-ui
tags: [bug-fix, three-card, player-seat, hand-panel, room-page]
tech-stack:
  added: []
  patterns: [cardRenderOrder-reorder, visibleCardCounts-phase-trigger]
key-files:
  modified:
    - packages/client/src/pages/RoomPage.tsx
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/layout/HandPanel.tsx
decisions:
  - RoomPage phase 전환 useEffect에 three-card 전용 visibleCardCounts 3 업데이트 블록 추가 (인디언 모드 블록과 분리)
  - cardRenderOrder 배열로 렌더 순서 재정렬, origIdx를 flip/click 핸들러에 전달해 인덱스 일관성 유지
  - 공개 구분 스타일은 betting-1/card-select/betting-2 phase에서만 적용 (sejang-open 이후)
metrics:
  duration: 10min
  completed_date: "2026-04-04"
  tasks: 2
  files: 3
---

# Quick Task 260404-tgm: 세장섯다 3장 카드 표시 버그 수정 Summary

## 한 줄 요약

세장섯다 모드에서 GameTable PlayerSeat에 3장 카드가 모두 보이지 않던 버그와 HandPanel에서 공개 카드 시각 구분이 없던 문제를 수정

---

## 완료된 태스크

| Task | 이름 | Commit | 수정 파일 |
|------|------|--------|-----------|
| 1 | GameTable PlayerSeat 세장섯다 3장 표시 + RoomPage visibleCardCounts 업데이트 | b290ae6 | RoomPage.tsx, PlayerSeat.tsx |
| 2 | HandPanel 세장섯다 공개 카드 맨앞 정렬 + 시각 구분 | 6671d0a | HandPanel.tsx |

---

## 구현 상세

### Task 1: RoomPage + PlayerSeat

**버그 원인:** 딜링 애니메이션 루프는 `cardRounds = 2` (2라운드 = 2장)로 고정되어 있어 `visibleCardCounts`가 최대 2까지만 설정됨. 세장섯다에서 3번째 카드를 받은 후 `card-select` / `betting-2` 진입 시 3으로 업데이트하는 로직이 없었음.

**수정 (RoomPage.tsx):**
- `gameState.phase` useEffect 내 인디언 모드 블록 아래에 three-card 전용 블록 추가
- `prevPhaseRef.current`가 `betting-1` 또는 `card-select`이고 `gameState.phase`가 `card-select` 또는 `betting-2`일 때 `three-card` 모드인 경우 모든 플레이어의 `visibleCardCounts`를 3으로 설정

**수정 (PlayerSeat.tsx):**
- `three-card` 모드에서 `maxSlots >= 3`일 때 카드 컨테이너에 `-space-x-2` 겹침 레이아웃 적용
- 각 카드에 `z-30/z-20/z-10` 순서로 z-index 부여
- `isOpenedCard`인 카드에 `ring-2 ring-amber-400 rounded brightness-110` 시각 구분 스타일 적용

### Task 2: HandPanel

**변경 내용:**
- `cardRenderOrder` 배열 계산: `three-card` 모드에서 `openedCardIndex`가 존재하면 해당 인덱스를 맨 앞으로, 나머지는 원래 순서 유지
- `cards.map(idx => ...)` 대신 `cardRenderOrder.map((origIdx, renderPos) => ...)` 로 변경하여 렌더 위치와 원본 인덱스를 분리
- `flip/click` 핸들러는 `origIdx` 기준으로 호출하여 flip 상태 관리 일관성 유지
- `isThreeCardOpenPhase` 조건 (`betting-1`, `card-select`, `betting-2`)에서만 시각 구분 적용:
  - 공개 카드: `ring-2 ring-amber-400 rounded brightness-110` + `"공개"` Badge (amber 계열)
  - 비공개 카드: `brightness-75 opacity-80`

---

## 검증

- TypeScript 컴파일: 기존 pre-existing 에러(`GiriPhase` in CutModal.tsx) 외 새로운 에러 없음 (변경 전후 동일)
- 세장섯다 `betting-2` phase: `visibleCardCounts`가 3으로 업데이트되어 PlayerSeat에 3장 카드 모두 표시
- `openedCardIndex` 카드: amber 테두리 + "공개" 배지로 시각 구분
- 나머지 카드 렌더 로직 (Indian 숨김, flip, 족보 계산 등) 영향 없음

---

## 이탈 사항 (Deviations)

없음 — 플랜대로 정확히 실행됨.

---

## Self-Check: PASSED

- FOUND: packages/client/src/pages/RoomPage.tsx
- FOUND: packages/client/src/components/game/PlayerSeat.tsx
- FOUND: packages/client/src/components/layout/HandPanel.tsx
- FOUND: commit b290ae6 (Task 1)
- FOUND: commit 6671d0a (Task 2)
