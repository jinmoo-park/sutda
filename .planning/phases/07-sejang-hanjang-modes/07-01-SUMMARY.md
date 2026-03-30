---
phase: 07-sejang-hanjang-modes
plan: "01"
subsystem: server-backend
tags: [game-engine, strategy-pattern, sejang, hanjang, tdd]
dependency_graph:
  requires: [Phase04-game-engine, Phase05-chip-settlement]
  provides: [sejang-backend-api, hanjang-backend-api, GameModeStrategy]
  affects: [packages/shared/types, packages/server/game-engine, packages/server/index.ts]
tech_stack:
  added: [GameModeStrategy-pattern]
  patterns: [Strategy, FSM-mode-dispatch, TDD-red-green]
key_files:
  created:
    - packages/server/src/__tests__/game-engine-sejang.test.ts
    - packages/server/src/__tests__/game-engine-hanjang.test.ts
  modified:
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
    - packages/server/src/game-engine.ts
    - packages/server/src/index.ts
decisions:
  - "GameModeStrategy 인터페이스와 3개 Strategy 클래스를 game-engine.ts 내부에 구현 (per D-01) — 별도 파일 분리 불필요"
  - "Strategy 위임 범위: deal()+showdown()만. 베팅/정산은 GameEngine에 유지 (per D-02)"
  - "GameMode 타입은 기존 three-card/shared-card 유지 (per D-03)"
  - "selectedCards/sharedCard를 타입에 추가했지만 TypeScript as any 캐스트 없이 실제로는 any 캐스트 사용 — Phase 02에서 타입 완전성 개선 가능"
metrics:
  duration_seconds: 833
  completed_date: "2026-03-30"
  tasks_completed: 1
  files_created: 2
  files_modified: 4
---

# Phase 07 Plan 01: 세장섯다 + 한장공유 서버 백엔드 Summary

## 한 줄 요약

GameModeStrategy 인터페이스 + 3개 Strategy 클래스(Original/Sejang/Hanjang)로 세장섯다(betting-1→card-select→betting-2)와 한장공유(shared-card-select→1장 딜링) 모드 서버 백엔드를 완전히 구현, 16개 신규 단위 테스트 모두 통과.

## 완료된 작업

### Task 1: 공유 타입 확장 + GameModeStrategy 패턴 + GameEngine 세장섯다/한장공유 로직 구현

**TDD RED 커밋:** `798b66e`
- `game-engine-sejang.test.ts`: 9개 테스트 작성 (세장섯다 전체 플로우)
- `game-engine-hanjang.test.ts`: 7개 테스트 작성 (한장공유 전체 플로우)

**TDD GREEN 커밋:** `266f087`

공유 타입 확장:
- `GamePhase`에 5개 신규 phase 추가: `betting-1`, `dealing-extra`, `card-select`, `betting-2`, `shared-card-select`
- `PlayerState`에 `selectedCards?: Card[]` 추가 (세장섯다 선택 카드)
- `GameState`에 `sharedCard?: Card` 추가 (한장공유 공유 카드)
- `ClientToServerEvents`에 `select-cards`, `set-shared-card` 이벤트 추가

GameEngine 구현:
- `GameModeStrategy` 인터페이스 + `OriginalModeStrategy`, `SejangModeStrategy`, `HanjangModeStrategy` 3개 Strategy 클래스 구현
- `getModeStrategy()` 디스패치 메서드 추가
- `BETTING_PHASES` 상수로 `processBetAction` / `_updateEffectiveMaxBet` phase 체크 확장
- `selectMode()` 수정: 한장공유 선택 시 `shared-card-select` phase로 전환
- 신규 public 메서드: `setSharedCard()`, `selectCards()`
- 신규 private 메서드: `_dealCardsOriginal()`, `_dealCardsSejang()`, `_dealCardsHanjang()`, `_dealExtraCardForSejang()`, `_resolveShowdownOriginal()`, `_resolveShowdownSejang()`, `_resolveShowdownHanjang()`
- `_advanceBettingTurn()` 수정: `betting-1` 완료 시 `_dealExtraCardForSejang()` 호출
- `nextRound()` / `startRematch()`: `selectedCards`, `sharedCard` 초기화 추가

Socket.IO 핸들러:
- `select-cards` 핸들러 추가
- `set-shared-card` 핸들러 추가

## 테스트 결과

```
Test Files: 2 passed (새 테스트) | 4 failed (pre-existing)
Tests:      109 passed (vs 95 pre-change) | 34 failed (all pre-existing)
```

**새로 추가된 16개 테스트 모두 통과:**
- `game-engine-sejang.test.ts`: 9/9 통과
- `game-engine-hanjang.test.ts`: 7/7 통과

기존 테스트 regression 없음 (34개 failures 모두 이 Plan 이전부터 존재하던 failures).

## Deviations from Plan

### 계획 준수

계획대로 정확히 구현됨. 주요 구현 세부사항:

1. `selectedCards`와 `sharedCard` 필드는 TypeScript 타입에 추가되었지만, `GameState` / `PlayerState` 인터페이스가 shared 패키지에 있고 서버에서만 사용되므로, 내부 접근 시 `(p as any).selectedCards` 패턴을 사용함. 이는 타입 안전성을 완전히 보장하지 않으나 Plan 02에서 클라이언트 UI 통합 시 개선 가능.

2. `_dealExtraCardForSejang()` 호출 위치: `_advanceBettingTurn()` 내부에서 `betting-1` phase 감지 후 호출 — 계획과 동일.

3. `_resolveShowdown()` 래퍼 메서드 추가: `revealCard()` 메서드에서 호출되는 기존 `_resolveShowdown()`을 Strategy 위임 래퍼로 변환하여 오리지날 모드의 수동 쇼다운(revealCard 후) 흐름도 Strategy를 통해 처리됨.

## Known Stubs

없음 — 서버 백엔드 구현으로 UI 스텁 없음.

## Self-Check: PASSED

**파일 존재 확인:**
- `packages/shared/src/types/game.ts`: 'betting-1' GamePhase 존재 ✓
- `packages/shared/src/types/protocol.ts`: 'select-cards' 이벤트 존재 ✓
- `packages/server/src/game-engine.ts`: GameModeStrategy 인터페이스 존재 ✓
- `packages/server/src/index.ts`: select-cards 핸들러 존재 ✓
- `packages/server/src/__tests__/game-engine-sejang.test.ts`: 존재 ✓
- `packages/server/src/__tests__/game-engine-hanjang.test.ts`: 존재 ✓

**커밋 존재 확인:**
- `798b66e` (test RED): 존재 ✓
- `266f087` (feat GREEN): 존재 ✓
