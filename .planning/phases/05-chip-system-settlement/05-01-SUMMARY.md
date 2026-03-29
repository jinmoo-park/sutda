---
phase: 05-chip-system-settlement
plan: "01"
subsystem: chip-settlement
tags: [chips, settlement, TDD, shared-types, game-engine]
dependency_graph:
  requires: [04-03]
  provides: [ChipBreakdown, effectiveMaxBet, settleChips, applyRechargeToPlayer]
  affects: [game-engine, shared-types, protocol]
tech_stack:
  added: []
  patterns: [greedy-chip-breakdown, effective-stack-ceiling, TDD-red-green]
key_files:
  created: []
  modified:
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
    - packages/shared/src/types/index.ts
    - packages/shared/src/index.ts
    - packages/server/src/game-engine.ts
    - packages/server/src/game-engine.test.ts
decisions:
  - "pot은 result phase에서 표시용으로 유지, nextRound()에서 0 리셋 (D-01 부합)"
  - "settleChips는 _resolveShowdown과 _advanceBettingTurn 두 경로에서 모두 호출 — 마지막 생존자도 pot 수령 보장"
  - "applyRechargeToPlayer는 _updateChipBreakdowns + _updateEffectiveMaxBet 자동 연쇄 — 재충전 후 파생 상태 일관성 보장"
metrics:
  duration_seconds: 303
  completed_date: "2026-03-30"
  tasks_completed: 1
  files_modified: 6
requirements: [CHIP-01, CHIP-02, CHIP-04, CHIP-05]
---

# Phase 05 Plan 01: 칩 정산 시스템 구현 Summary

## 한 줄 요약

그리디 chipBreakdown, 유효 스택 상한(effectiveMaxBet), pot->승자 정산(settleChips), 재충전 적용(applyRechargeToPlayer)을 TDD로 GameEngine에 통합

## 완료된 Tasks

| Task | 이름 | Commit | 주요 파일 |
|------|------|--------|-----------|
| RED | 실패 테스트 작성 | 56776ea | packages/server/src/game-engine.test.ts |
| GREEN | 구현 완료 | 5d68b32 | packages/shared/src/types/game.ts, packages/server/src/game-engine.ts |

## 구현 내용

### shared 타입 변경

**packages/shared/src/types/game.ts:**
- `ChipBreakdown` 인터페이스 추가 (ten_thousand, five_thousand, one_thousand, five_hundred)
- `PlayerState.chipBreakdown: ChipBreakdown` 필드 추가
- `GameState.effectiveMaxBet?: number` 필드 추가

**packages/shared/src/types/protocol.ts:**
- `ErrorPayload.code`에 `RECHARGE_IN_PROGRESS`, `RECHARGE_NOT_FOUND`, `INSUFFICIENT_CHIPS` 추가
- `ClientToServerEvents`에 `recharge-request`, `recharge-vote` 이벤트 추가
- `ServerToClientEvents`에 `recharge-requested`, `recharge-vote-update`, `recharge-result` 이벤트 추가

**packages/shared/src/types/index.ts, packages/shared/src/index.ts:**
- `ChipBreakdown` re-export 추가

### GameEngine 메서드 추가

| 메서드 | 접근 | 설명 |
|--------|------|------|
| `calculateChipBreakdown(chips)` | static | 그리디 방식으로 단위별 칩 개수 계산 |
| `calculateEffectiveMaxBet(playerId)` | public | 유효 스택 상한 계산 (per D-11) |
| `applyRechargeToPlayer(playerId, newChips)` | public | 재충전 적용 후 파생 상태 갱신 |
| `settleChips()` | private | 승자에게 pot 합산 |
| `_updateChipBreakdowns()` | private | 모든 플레이어 chipBreakdown 갱신 |
| `_updateEffectiveMaxBet()` | private | 현재 턴 플레이어의 effectiveMaxBet 갱신 |

### 기존 메서드 수정

- `attendSchool`: `player.chips -= 500` 추가 (chips 차감 후 pot 증가)
- `processBetAction` call case: `player.chips -= callAmount` 추가
- `processBetAction` raise case: `player.chips -= totalDeducted` 추가
- `_resolveShowdown`: winnerId 세팅 직후 `this.settleChips()` 호출
- `_advanceBettingTurn`: 생존자 1명 남을 때 winnerId 설정 + `settleChips()` 호출
- `_dealCards`: 끝에 `_updateChipBreakdowns()` 및 `_updateEffectiveMaxBet()` 호출

## 테스트 결과

- 총 110개 테스트 통과 (기존 91개 + 신규 19개)
- 신규 테스트: calculateChipBreakdown(4), 칩 차감(3), pot 정산(4), effectiveMaxBet(4), chipBreakdown 상태(2), applyRechargeToPlayer(4)

## Deviations from Plan

없음 — 계획대로 정확하게 실행됨.

## Known Stubs

없음 — 모든 구현이 완전히 연결됨.

## Self-Check: PASSED

- [x] packages/shared/src/types/game.ts — ChipBreakdown 인터페이스, PlayerState.chipBreakdown, GameState.effectiveMaxBet 존재
- [x] packages/shared/src/types/protocol.ts — recharge-request, recharge-vote, recharge-requested, recharge-vote-update, recharge-result 이벤트 존재
- [x] packages/server/src/game-engine.ts — calculateChipBreakdown, calculateEffectiveMaxBet, settleChips, applyRechargeToPlayer 존재
- [x] `pnpm --filter @sutda/shared build` 성공 (exit code 0)
- [x] `pnpm --filter @sutda/server test -- --run` 110/110 통과 (exit code 0)
- [x] Commit 56776ea: test(05-01) RED 테스트 추가
- [x] Commit 5d68b32: feat(05-01) 구현 완료
