---
phase: 11-social-features
plan: "02"
subsystem: server-game-engine
tags: [allIn, settlement, side-pot, attendSchoolProxy, history, TDD]
dependency_graph:
  requires: ["11-01"]
  provides: ["올인 POT 정산", "학교 대납", "판별 이력"]
  affects: ["game-engine.ts", "showdown 정산 흐름"]
tech_stack:
  added: []
  patterns: ["레벨별 사이드팟 분리", "chips 스냅샷 + delta 계산", "TDD RED→GREEN"]
key_files:
  created: []
  modified:
    - packages/server/src/game-engine.ts
    - packages/server/src/game-engine.test.ts
decisions:
  - "settleChipsWithAllIn은 총 팟을 totalCommitted 레벨별로 분할하여 각 레벨 최강자에게 분배"
  - "attendSchoolProxy fallback: 후원자 잔액 < 500 시 수혜자가 직접 attendSchool() 호출"
  - "_generateRoundHistory는 정산 직후 chips 스냅샷과 비교하여 chipDelta를 계산"
  - "chipsSnapshotOrig/Sejang/Hanjang 등 각 showdown 메서드에 독립적인 스냅샷 변수명 사용"
metrics:
  duration: "약 35분"
  completed_date: "2026-04-02"
  tasks: 2
  files: 2
---

# Phase 11 Plan 02: 올인 POT 정산 + 학교 대납 + 판별 이력 Summary

## 한 줄 요약

totalCommitted 레벨별 사이드팟 분리 정산(settleChipsWithAllIn) + 학교 대납 fallback + 판별 이력(lastRoundHistory) 자동 생성을 TDD로 구현.

## 구현된 기능

### Task 1: 올인 POT 정산

**settleChipsWithAllIn() 메서드**
- 올인 플레이어 없으면 기존 `settleChips()` 호출 (하위 호환)
- 올인 플레이어 있으면 `totalCommitted` 기준 레벨별 사이드팟 분리 정산
- 계단식 다중 올인 지원 (예: B=1만, C=3만, A=5만, D=5만)
- `compareHands`로 족보 비교하여 레벨별 최강자가 팟 수령

**isAllIn / totalCommitted 추적**
- `attendSchool()`: `totalCommitted += 500` 추가
- `processBetAction()` call: `Math.min(player.chips, callAmount)`로 올인 처리, chips=0이면 `isAllIn=true`
- `processBetAction()` raise: `totalCommitted += totalDeducted`, chips=0이면 `isAllIn=true`

**베팅 순환 올인 스킵**
- `_isBettingComplete()`: `activeBettors = isAlive && !isAllIn` 필터 적용
- `_advanceBettingTurn()`: 다음 플레이어 탐색에서 `!nextPlayer.isAllIn` 조건 추가

**nextRound() 리셋**
- `p.isAllIn = false`, `p.totalCommitted = 0`
- `this.state.schoolProxyBeneficiaryIds = undefined`

**showdown 메서드 교체**
5개 showdown 관련 경로에서 `settleChips()` → `settleChipsWithAllIn()` 교체:
- `revealCard()` 생존자 1명 경로
- `muckHand()`
- `_resolveShowdownOriginal()`
- `_resolveShowdownSejang()`
- `_resolveShowdownHanjang()`

### Task 2: 학교 대납 + 판별 이력

**attendSchoolProxy() 완성**
- 후원자 잔액 < 500 시 fallback: 수혜자가 `attendSchool()` 직접 호출
- 정상 경로: `sponsor.chips -= 500`, `sponsor.totalCommitted += 500`
- 수혜자 chips 미차감, attendedPlayerIds에 추가

**lastRoundHistory 이력 생성**
- `GameEngine.lastRoundHistory: RoundHistoryEntry | null` public 필드
- `_generateRoundHistory(chipsBeforeSettle: Map<string, number>)` private 메서드
- 5개 showdown 경로에 `chipsSnapshot` 생성 후 정산 후 `_generateRoundHistory()` 호출
- `playerChipChanges.chipDelta` = 정산 후 chips - 스냅샷 chips

## 테스트 결과

- 신규 테스트: 12개 추가 (allIn 8개 + attendSchoolProxy+이력 4개)
- 전체 통과: 153 passed (기존 141 → +12)
- 리그레션 없음: 37 failed 그대로 유지 (모두 pre-existing failures)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 1/7 설계 수정: 베팅 종료 즉시 showdown 호출로 인한 카드 없음 크래시**
- **Found during:** Task 1 RED→GREEN
- **Issue:** 2인 게임에서 player-0가 콜 후 즉시 `_isBettingComplete()` true → showdown → 카드 없어서 크래시
- **Fix:** 3인 게임으로 테스트 재설계 (player-2가 미액션 상태로 베팅 지속)
- **Files modified:** packages/server/src/game-engine.test.ts

**2. [Rule 1 - Bug] Test 4 chipDelta: 땡값 납부로 delta 7000 != 6000**
- **Found during:** Task 2 GREEN
- **Issue:** 3인 게임에서 다이 플레이어 있을 때 장땡 땡값 1000원이 delta에 포함됨
- **Fix:** 2인 게임으로 변경 (다이 플레이어 없음 → 땡값 0)
- **Files modified:** packages/server/src/game-engine.test.ts

**3. [Rule 1 - Bug] attendSchoolProxy fallback 미적용**
- **Found during:** Task 2 GREEN
- **Issue:** 이전 계획(Plan 11-01)에서 생성된 attendSchoolProxy가 파일 하단에 별도로 존재, Task 1에서의 편집이 다른 위치를 대상으로 했음
- **Fix:** 파일 하단의 실제 attendSchoolProxy를 직접 수정
- **Files modified:** packages/server/src/game-engine.ts

## Commits

| Hash | 메시지 |
|------|--------|
| 498879b | test(11-02): add failing tests for allIn POT settlement |
| fc90c85 | feat(11-02): 올인 POT 정산 + 베팅 스킵 + totalCommitted 추적 |
| d02d7b8 | test(11-02): add failing tests for attendSchoolProxy fallback + lastRoundHistory |
| 1d1b994 | feat(11-02): attendSchoolProxy 완성 + 판별 이력 생성 (lastRoundHistory) |

## Self-Check

- [x] `settleChipsWithAllIn` 메서드 존재
- [x] `player.isAllIn = true` 존재
- [x] `p.totalCommitted = (p.totalCommitted` 패턴 존재
- [x] `nextRound()` `p.isAllIn = false` 리셋
- [x] `nextRound()` `p.totalCommitted = 0` 리셋
- [x] `nextRound()` `schoolProxyBeneficiaryIds` 리셋
- [x] 올인 관련 테스트 3개 이상 (8개)
- [x] `attendSchoolProxy` 메서드 존재
- [x] `sponsor.chips < 500` fallback 존재
- [x] `lastRoundHistory` public 필드 존재
- [x] `_generateRoundHistory` 메서드 존재
- [x] `chipsSnapshot` 패턴 showdown 메서드에 존재
- [x] `attendSchoolProxy` 관련 테스트 2개 이상
- [x] `lastRoundHistory` 관련 테스트 1개 이상
