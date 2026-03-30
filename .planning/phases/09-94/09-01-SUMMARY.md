---
phase: "09-94"
plan: "01"
subsystem: "game-engine"
tags: [tdd, game-logic, ttaeng-value, gusa-rematch, fsm]
dependency_graph:
  requires: []
  provides: [gusa-pending-phase, ttaeng-value-settlement, recordGusaRejoinDecision]
  affects: [game-engine.ts, shared-types, protocol-types]
tech_stack:
  added: []
  patterns: [TDD Red-Green, Strategy pattern (showdown dispatch), FSM phase transitions]
key_files:
  created: []
  modified:
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
    - packages/server/src/game-engine.ts
    - packages/server/src/game-engine.test.ts
decisions:
  - "gusa-pending과 rematch-pending을 별도 phase로 분리 — 구사 재경기는 다이 플레이어 재참여 결정이 필요하므로 동점 재경기와 다른 FSM"
  - "_startGusaRematch()는 mode를 변경하지 않음 (startRematch와의 핵심 차이) — 현재 모드 유지"
  - "다이 플레이어 0명이면 즉시 shuffling (gusa-pending 건너뜀) — 결정 수집 불필요"
  - "D-07 구현: compareHands 전에 최강패를 미리 계산해서 구사 체크 시 winnerHand 사용"
metrics:
  duration_seconds: 1420
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_modified: 4
---

# Phase 09 Plan 01 요약: 땡값 정산 + 구사 재경기 FSM TDD 구현

## 한 줄 요약

오리지날 모드 땡값 자동 정산(`_settleTtaengValue`)과 구사 재경기 FSM(`gusa-pending` phase + `recordGusaRejoinDecision`)을 TDD로 구현하고, D-07 특수패 우선순위 처리를 포함함.

## 완료된 태스크

### Task 1: 공유 타입 확장 + 땡값 정산 로직 TDD (커밋: 27ab857)

**타입 변경:**
- `GamePhase`에 `'gusa-pending'` 추가 (rematch-pending 다음)
- `GameState`에 `gusaPendingDecisions?: Record<string, boolean | null>` 추가
- `GameState`에 `ttaengPayments?: { playerId: string; amount: number }[]` 추가
- `ClientToServerEvents`에 `'gusa-rejoin'` 이벤트 추가

**구현:**
- `getTtaengValueAmount(hand)`: score 기반 금액 계산 (≥1010→1000, ≥1001→500, 기타→0)
- `_settleTtaengValue()`: 오리지날 모드 전용 땡값 정산 (isSpecialBeater 면제, 다이 플레이어만 납부)
- `_resolveShowdownOriginal`에 `settleChips()` 직후 `_settleTtaengValue()` 호출
- `nextRound()`에서 `ttaengPayments = undefined` 초기화

**테스트:** 12개 추가 (모두 통과)

### Task 2: 구사 재경기 FSM (gusa-pending → startGusaRematch) TDD (커밋: 555bc87)

**구현:**
- 3개 showdown 메서드(`_resolveShowdownOriginal/Sejang/Hanjang`)에서:
  - 구사 체크 전 최강패 미리 계산 (D-07 면제 판단)
  - `rematch-pending` → `gusa-pending` 변경
  - D-07 면제 로직: 암행어사(score=1)→모든 구사 무시, 땡잡이(score=0)+일반구사→무시, 땡잡이+멍텅→트리거
  - 다이 플레이어 0명 시 `_startGusaRematchImmediate()`, 있으면 `gusa-pending` + `gusaPendingDecisions` 초기화
- `recordGusaRejoinDecision(playerId, join)`: 재참여 결정 처리 (잔액 부족 시 자동 거절, 완료 시 자동 startGusaRematch)
- `_startGusaRematch()`: mode 유지, 카드/베팅 초기화, shuffling 전환
- `_startGusaRematchImmediate()`: 즉시 재경기 (래퍼)

**테스트:** 15개(구사 재경기) + 4개(D-07) = 19개 추가 (모두 통과)

## 검증 결과

- `pnpm --filter @sutda/server test --run`: 34 기존 실패 유지 (회귀 없음), 140 통과 (신규 31개 추가)
- `pnpm --filter @sutda/shared test --run`: 96개 모두 통과
- TypeScript 타입 검사: 오류 없음 (shared build 후)

## 계획으로부터의 이탈

### 자동 수정 사항

**1. [Rule 1 - Bug] 테스트 헬퍼 betting 순서 문제 수정**
- **발견 시:** Task 2 구사 재경기 테스트 작성 중
- **문제:** `advanceToBetting` 헬퍼가 4인용으로 설계되어 있어 3인 게임에서 비딜러 플레이어의 `check` 액션이 `INVALID_ACTION: only the opening bettor can check` 에러 발생
- **수정:** 테스트 내 betting 진행을 직접 `state.phase = 'showdown'`으로 강제 설정하는 방식으로 변경
- **파일:** `packages/server/src/game-engine.test.ts`

**2. [Rule 1 - Bug] D-07 테스트 시나리오 수정**
- **발견 시:** D-07 우선순위 테스트 실행 중
- **문제:** 땡잡이+일반구사 테스트에서 구삥(score=40)이 땡잡이(score=0)보다 높아서 구삥이 최강패가 됨 → 시나리오 불성립
- **수정:** "조건 불충족" 케이스를 더 명확히 구현 (일땡 상대로 땡잡이가 이기면서 gusa 트리거 조건인 maxScore≤60 자체가 불충족)
- **파일:** `packages/server/src/game-engine.test.ts`

**3. [Rule 1 - Bug] 암행어사 카드 조합 수정**
- **발견 시:** Task 1 암행어사 테스트 작성 중
- **문제:** 암행어사 카드 조합을 잘못 파악 (evaluator.ts 확인 전). 3(normal)+7(normal)=땡잡이, 4(yeolkkeut)+7(yeolkkeut)=암행어사
- **수정:** evaluator.ts 확인 후 올바른 카드 조합으로 테스트 수정

## 알려진 스텁

없음 - 모든 구현이 실제 게임 로직으로 연결됨.

## Self-Check: PASSED

- SUMMARY.md 파일: 존재 확인
- 커밋 27ab857 (Task 1): 존재 확인
- 커밋 555bc87 (Task 2): 존재 확인
- 서버 테스트: 140 통과 / 34 기존 실패 (회귀 없음)
- 공유 테스트: 96 통과
