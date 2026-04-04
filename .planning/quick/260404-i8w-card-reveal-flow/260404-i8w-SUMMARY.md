---
phase: quick
plan: 260404-i8w
subsystem: game-flow
tags: [card-reveal, game-phase, ux, socket]
dependency_graph:
  requires: []
  provides: [card-reveal-phase, revealMyCard-method, per-card-reveal-ui]
  affects: [game-engine, result-screen, room-page]
tech_stack:
  added: []
  patterns: [card-reveal FSM phase, per-card reveal with index tracking]
key_files:
  created: []
  modified:
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
    - packages/server/src/game-engine.ts
    - packages/server/src/index.ts
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - card-reveal phase를 betting/sejang card-select 완료 후 진입점으로 통일
  - revealedCardIndices를 PlayerState optional 필드로 추가 — card-reveal phase 전용 인덱스 추적
  - 전원 다이(showdown phase) 플로우는 변경 없이 유지
  - getStateFor: card-reveal을 isResultPhase로 포함 — 인디언 모드 마스킹 해제
metrics:
  duration: "~15 min"
  completed_date: "2026-04-04"
  tasks_completed: 2
  files_modified: 6
---

# Quick Task 260404-i8w: Card Reveal Flow Summary

## 한줄 요약

베팅 종료 후 플레이어가 자신의 카드를 한장씩 클릭해 공개하는 card-reveal phase를 추가하여 "패 까기" 긴장감을 구현했다.

## 완료된 작업

### Task 1: 서버 — card-reveal phase 추가 및 revealMyCard 메서드 구현

**Commit:** `ceb9528`

- `GamePhase`에 `'card-reveal'` 추가 (`shared/types/game.ts`)
- `PlayerState`에 `revealedCardIndices?: number[]` 필드 추가
- `ClientToServerEvents`에 `reveal-my-card` 이벤트 정의 추가 (`shared/types/protocol.ts`)
- `_advanceBettingTurn()`: betting/betting-2 완료 시 자동 showdown 대신 card-reveal phase로 전환
- `completeSejangCardSelect()`: 세장섯다 카드 선택 완료 시 동일하게 card-reveal phase로 전환
- `revealMyCard(playerId, cardIndex)` 메서드 신규 구현 — 개별 카드 공개, 전원 공개 시 `strategy.showdown()` 자동 호출
- `getStateFor()`: `isResultPhase`에 `'card-reveal'` 포함 (인디언 마스킹 해제)
- `nextRound()`, `_startTieRematch()`, `_startGusaRematch()`: `revealedCardIndices = undefined` 초기화 추가
- `index.ts`: `reveal-my-card` 소켓 핸들러 등록

### Task 2: 클라이언트 — ResultScreen 카드 공개 인터랙션 및 승패 지연 표시

**Commit:** `a4ef055`

- `RoomPage.tsx`: `isResultPhase`에 `'card-reveal'` 추가 → ResultScreen 렌더
- `ResultScreen.tsx`: card-reveal / result 이중 모드 구현
  - **card-reveal 모드**: "패를 공개하세요!" 안내, 카드 뒷면 초기화, 내 미공개 카드 클릭 시 `animate-pulse` + `reveal-my-card` emit
  - **card-reveal 모드**: `player.revealedCardIndices` 기반으로 개별 카드 faceUp 제어
  - **card-reveal 모드**: `player.isRevealed` 완료 시에만 족보 배지 표시
  - **card-reveal 모드**: 칩 변동/땡값/하단 버튼 영역 모두 숨김
  - **result 모드**: 기존 동작 그대로 유지

## 플로우 변경 요약

**변경 전:**
```
betting 완료 → 모든 카드 자동 isRevealed=true → showdown → result
```

**변경 후:**
```
betting 완료 → card-reveal phase (카드 뒷면, 클릭 대기)
  → 각 플레이어 카드 클릭 → revealedCardIndices 추가 → isRevealed=true (전원 완료 시)
  → strategy.showdown() → result
```

**유지된 플로우 (전원 다이):**
```
betting 완료 (생존자 1명) → showdown phase → MuckChoiceModal (공개/숨기기 선택) → result
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ClientToServerEvents에 reveal-my-card 이벤트 타입 추가**
- **Found during:** Task 1 빌드 검증
- **Issue:** `index.ts`에 `socket.on('reveal-my-card', ...)` 추가 시 TypeScript가 `ClientToServerEvents`에 해당 이벤트가 없다고 오류
- **Fix:** `packages/shared/src/types/protocol.ts`의 `ClientToServerEvents`에 `'reveal-my-card': (data: { roomId: string; cardIndex: number }) => void` 추가
- **Files modified:** `packages/shared/src/types/protocol.ts`
- **Commit:** `ceb9528` (Task 1 커밋에 포함)

**2. [Rule 3 - Blocking] node_modules 미설치 (worktree 환경)**
- **Found during:** Task 1 빌드 검증
- **Issue:** worktree에 node_modules 없어 빌드 불가
- **Fix:** `pnpm install` 실행
- **Commit:** 해당 없음 (인프라 설정)

## Known Stubs

없음 — 모든 기능이 실제 소켓/상태 데이터와 연결됨.

## Self-Check: PASSED

- `packages/shared/src/types/game.ts` — `'card-reveal'` GamePhase 존재 확인
- `packages/server/src/game-engine.ts` — `revealMyCard` 메서드 존재 확인
- `packages/client/src/components/layout/ResultScreen.tsx` — `isCardRevealPhase` 분기 존재 확인
- Commit `ceb9528` 존재 확인
- Commit `a4ef055` 존재 확인
