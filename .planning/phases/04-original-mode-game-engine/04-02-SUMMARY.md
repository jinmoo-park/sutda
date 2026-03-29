---
phase: 04-original-mode-game-engine
plan: "02"
subsystem: game-engine
tags: [betting, showdown, rematch, game-flow, tdd]
dependency_graph:
  requires: [04-01]
  provides: [processBetAction, revealCard, startRematch, nextRound, isBettingComplete]
  affects: [packages/server/src/game-engine.ts, packages/shared/src/types/game.ts]
tech_stack:
  added: []
  patterns: [TDD-RED-GREEN, Fisher-Yates, FSM, compareHands]
key_files:
  created: []
  modified:
    - packages/server/src/game-engine.ts
    - packages/server/src/game-engine.test.ts
    - packages/shared/src/types/game.ts
decisions:
  - "베팅 액션 완료 추적에 private Set(_bettingActed)을 GameEngine 필드로 관리 — GameState 외부 누출 불필요"
  - "레이즈 발생 시 _bettingActed를 레이즈한 플레이어만 남기고 초기화 — 순환 재베팅 구현"
  - "resolveShowdown은 private _resolveShowdown()으로 구현 — revealCard에서 자동 호출"
  - "nextRound는 winnerId를 dealer로 설정한 후 attend-school phase로 전환"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_modified: 3
---

# Phase 04 Plan 02: 베팅 시스템 + 쇼다운 + 오리지날 모드 전체 플로우 Summary

**한 줄 요약:** 콜/레이즈/다이/체크 베팅 시스템과 revealCard/resolveShowdown/startRematch/nextRound로 오리지날 모드 한 판의 전체 플로우를 완성하고 59개 테스트로 검증

## 구현 내용

### Task 1: 베팅 시스템 (processBetAction + _isBettingComplete)

- `processBetAction(playerId, BetAction)`: 콜/레이즈/다이/체크 4가지 액션 처리
  - **콜**: `currentBetAmount - player.currentBet` 계산 후 pot 추가, currentBet 갱신
  - **레이즈**: 콜 금액 + 추가금, `currentBetAmount = player.currentBet` 갱신, 최솟값 500원 검증
  - **다이**: `isAlive = false`
  - **체크**: `currentBetAmount > 0`이면 에러
- `_advanceBettingTurn()`: 반시계 방향 다음 생존 플레이어 탐색, 1명 남으면 `result` 전환
- `_isBettingComplete()`: 모든 생존자 액션 완료 + 동액 조건 → `showdown` 전환
- `_bettingActed: Set<string>`: 액션 완료 추적 (레이즈 시 부분 초기화)
- INVALID_PHASE / NOT_YOUR_TURN / INVALID_ACTION 에러 처리

### Task 2: 쇼다운 + 승자 판정 + 동점 재경기 + 타입 확장

**타입 확장 (packages/shared/src/types/game.ts):**
- `GamePhase`에 `'rematch-pending'` 추가
- `GameState`에 `winnerId?: string`, `tiedPlayerIds?: string[]` 추가

**GameEngine 메서드:**
- `revealCard(playerId)`: showdown phase에서 `isRevealed=true`, 전원 공개 시 `_resolveShowdown()` 자동 호출
- `_resolveShowdown()`: `evaluateHand + compareHands`로 생존자 중 승자 결정, 동점이면 `rematch-pending` 전환
- `startRematch()`: 동점자만 `isAlive=true`, pot 유지, 앤티 없이 `shuffling` 전환
- `nextRound()`: roundNumber 증가, 전 플레이어 리셋, 이전 winnerId가 dealer, `attend-school` 전환

**FSM 유효성:**
- `rematch-pending`에서 `processBetAction`, `shuffle`, `nextRound` 호출 시 `INVALID_PHASE` (기존 assertPhase 로직에 의해 자동 차단)
- `startRematch`는 `rematch-pending` 아닌 phase에서 호출 시 `INVALID_PHASE`

## 테스트 현황

| 파일 | 테스트 수 | 상태 |
|------|-----------|------|
| packages/server/src/game-engine.test.ts | 59 | 전체 통과 |
| packages/server/src/room-manager.test.ts | 19 | 전체 통과 |
| packages/server/src/integration.test.ts | 5 | 전체 통과 |
| packages/shared (전체) | 96 | 전체 통과 |

**총합: 179개 테스트 전체 통과**

## 커밋 이력

| 커밋 | 타입 | 설명 |
|------|------|------|
| `674c6a6` | test | Task 1 failing tests (TDD RED) - 베팅 시스템 |
| `368cf93` | feat | Task 1 구현 (TDD GREEN) - 베팅 시스템 |
| `d9adc81` | test | Task 2 failing tests + 타입 확장 (TDD RED) |
| `8531718` | feat | Task 2 구현 (TDD GREEN) - 쇼다운/재경기/nextRound |

## Deviations from Plan

None - 플랜이 정확히 작성대로 실행됨.

## Known Stubs

없음. 모든 구현이 완전히 동작하며 플랜 목표를 달성함.

## Self-Check: PASSED

- [x] `packages/server/src/game-engine.ts` 존재 및 `processBetAction`, `revealCard`, `startRematch`, `nextRound` 포함
- [x] `packages/shared/src/types/game.ts`에 `winnerId`, `tiedPlayerIds`, `rematch-pending` 포함
- [x] `packages/server/src/game-engine.test.ts`에 59개 테스트 존재
- [x] `pnpm --filter @sutda/shared build` exit code 0
- [x] `pnpm --filter @sutda/server test` exit code 0 (83 tests)
- [x] `pnpm --filter @sutda/shared test` exit code 0 (96 tests)
- [x] 커밋 `8531718`, `d9adc81`, `368cf93`, `674c6a6` 존재 확인
