---
quick_id: 260429-urr
slug: engine-3way-disconnect
mode: quick
status: completed
completed: 2026-04-29
commits:
  - 990e050  # Task 1
  - f79addf  # Task 2
  - f97dc42  # Task 3
tags: [bugfix, game-engine, hand-comparison, disconnect, sejang]
key-files:
  created:
    - packages/shared/src/hand/winner.ts
    - packages/shared/src/hand/winner.test.ts
    - packages/server/src/__tests__/game-engine-3way-ttaengjabi.test.ts
    - packages/server/src/__tests__/game-engine-sejang-disconnect.test.ts
  modified:
    - packages/shared/src/index.ts
    - packages/server/src/game-engine.ts
---

# Quick 260429-urr: 3인 이상 땡잡이 승자 오판정 + 세장섯다 disconnect 멈춤 수정 — Summary

## 한줄 요약

다인전(3+) 컨텍스트를 인식하는 `findRoundWinner`로 땡잡이 비-전이성 사이클 버그를 제거하고,
세장섯다 `sejang-open`/`card-select` phase의 disconnect를 자동 다이로 처리해 게임 멈춤을 해소했다.

## 변경 내역

### Task 1 — `findRoundWinner` 다인전 승자 결정 함수 추가 (commit `990e050`)

**문제:** `compareHands`는 1대1 pairwise 비교 함수이고 땡잡이는 라운드 컨텍스트에 의존하는
규칙(라운드에 일~구땡이 있어야 catch 발동)이라 3인 이상에서 비-전이성 사이클이 발생한다.
예: 땡잡이(0) > 4땡(1004) > 6끗(6) > 땡잡이(0) — `hands.slice(1).reduce(compareHands)`
패턴은 시작 인덱스에 따라 결과가 달라진다.

**해결:** `packages/shared/src/hand/winner.ts`에 `findRoundWinner(hands: HandResult[])` 함수
신설. 라운드 전체를 한 번에 보고 명시적 우선순위로 판정:

1. **광땡** (score ≥ 1100). 일팔/일삼광땡뿐이고 암행어사 존재 시 암행어사 catch.
2. **장땡** (score === 1010).
3. **땡잡이 catch**: 일~구땡 존재 시 땡잡이 승 (다수 시 동률).
4. **일반 score 비교**.

`compareHands`(2인 입력) 결과와 항상 일치하도록 169개 매트릭스 테스트로 검증, 총 196개 단위
테스트 모두 그린.

### Task 2 — 3개 showdown 메서드를 `findRoundWinner`로 교체 (commit `f79addf`)

**파일:** `packages/server/src/game-engine.ts`

`_resolveShowdownOriginal` (1583), `_resolveShowdownSejang` (1649), `_resolveShowdownHanjang`
(1716)의 `hands.slice(1).reduce(compareHands)` 패턴을 `findRoundWinner(allHands)` 호출 + 인덱스
매핑으로 교체. 구사 재경기 / 동점 처리 / 정산 등 후속 로직은 byte-for-byte 그대로 유지.

회귀 통합 테스트 8건 추가 (`game-engine-3way-ttaengjabi.test.ts`):
- 사용자 보고 시나리오: 땡잡이 + 4땡 + 6끗 → 땡잡이 승 (3가지 좌석 순열로 검증)
- 땡잡이 + 4땡 + 장땡 → 장땡 승
- 땡잡이 + 4땡 + 삼팔광땡 → 삼팔광땡 승
- 땡잡이 + 6끗 + 알리 (땡 없음) → 알리 승
- 암행어사 + 일팔광땡 + 6끗 → 암행어사 승
- 회귀: 장땡 + 구땡 + 6끗 → 장땡 승

### Task 3 — `sejang-open` / `card-select` disconnect 자동 다이 (commit `f97dc42`)

**파일:** `packages/server/src/game-engine.ts`

`forceDisconnectedPlayerAction`(1972)에 두 phase 분기 추가:

- **`sejang-open`**: `isAlive = false` 처리. 나머지 생존자가 모두 `openedCardIndex` 보유 시
  `betting-1` 진입 (dealer 좌석부터). 생존자 ≤ 1명이면 즉시 `_finalizeAsSingleSurvivor()`.
- **`card-select`**: `isAlive = false` 처리. 나머지가 모두 `selectedCards.length === 2` 시
  `card-reveal` 진입. 생존자 ≤ 1명이면 즉시 `_finalizeAsSingleSurvivor()`.

새 헬퍼 `_finalizeAsSingleSurvivor()`: 생존자 1명을 `winnerId`로 확정 → `settleChipsWithAllIn`
→ `_settleTtaengValue` (오리지날 모드 외에는 내부에서 무시) → `_generateRoundHistory` →
`phase = 'result'`. 기존 disconnect-showdown 분기(2065 부근) 및 `revealCard`(1483 부근)의
중복 패턴을 단일 헬퍼로 통일.

회귀 통합 테스트 9건 추가 (`game-engine-sejang-disconnect.test.ts`):
- 3인 sejang-open 중 1명 disconnect → isAlive=false / phase 진행 (선택 순서 무관)
- 3인 card-select 중 1명 disconnect → isAlive=false / phase=card-reveal 진행
- 2인 sejang-open / card-select 1명 disconnect → 남은 1명 winnerId, phase=result
- 정상 플레이 (disconnect 없음) 회귀 그린

## 핵심 결정

- **명시적 규칙 함수 vs round-robin**: `findRoundWinner`는 비-전이성으로 round-robin도 신뢰할 수
  없어, 광땡→장땡→땡잡이→일반 우선순위를 코드로 선언. `compareHands`와의 결과 일관성을 매트릭스
  테스트로 강제.
- **`compareHands` 보존**: pairwise 비교용으로 다른 곳(side-pot, _huhwi 등)에서 여전히 쓰이므로
  유지. 사이드팟 분배 로직(line 293)도 동일한 reduce 패턴이지만 동률 분배 등 추가 설계가 필요해
  본 PR 범위 외로 분리.
- **disconnect=즉시 자동 다이 (사용자 지정)**: 세장섯다에서 카드 공개/선택을 안 했어도
  "선택한 것으로 처리"하지 않고 그냥 fold 처리. 60초 grace 정책은 별도(room-manager).
- **`_finalizeAsSingleSurvivor` 헬퍼 추출**: 동일한 단일 생존자 finalize 패턴이 disconnect 처리
  3곳에 흩어져 있던 것을 하나로 정리해 향후 정합성 확보.

## Deviations from Plan

플랜 기재 항목 외 자동 보강:

**1. [Rule 2 - 누락 critical 기능] `compareHands` import 유지**
- 플랜은 import에서 `compareHands`를 빼고 `findRoundWinner`로 교체할 것을 시사했으나,
  `settleChipsWithAllIn` 사이드팟 분배 로직(line 293)이 여전히 `compareHands`를 호출하고 있어
  유지하지 않으면 컴파일 실패. import 라인에 `findRoundWinner`를 추가하면서 `compareHands`도
  존속.
- 영향 파일: `packages/server/src/game-engine.ts` line 1
- Commit: `f79addf`

**2. [Rule 1 - 결정 사항] 사이드팟 reduce 패턴은 본 PR 범위 외로 분리**
- `settleChipsWithAllIn` 내부 사이드팟 분배 로직(line 287~298)이 동일한
  `candidates.reduce(compareHands)` 패턴을 보유하고 있어 잠재적으로 같은 3-way 땡잡이 버그를
  보일 수 있다. 다만 사이드팟은 여러 candidate 중 단일 winner를 선정해야 하고 동률 시 분할
  분배가 필요하므로 단순 plug-and-play로 `findRoundWinner` 교체 시 동률 처리 누락. 별도 설계가
  필요한 architectural 변경(Rule 4)이라 본 PR 범위 외로 둠. SUMMARY 결정 사항에 명시.

플랜 기재 외 다른 자동 보강 없음.

## 테스트 결과

| 패키지 | 추가 전 | 추가 후 | 변동 |
| ---- | ----- | ----- | ----- |
| shared | 97 통과 | **293 통과** | +196 (winner.test.ts) |
| server | 133 통과 / 42 실패 (사전) | **150 통과** / 42 실패 | +17 (3way 8 + disconnect 9) |

서버 측 42개의 사전 실패는 본 작업 이전부터 존재하던 카드 공개 플로우(quick-260404-i8w)
변경으로 인한 테스트 기대값 불일치이며 본 PR 변경과 무관함을 master 베이스 비교로 확인.

## 인증 게이트 / 체크포인트

없음 — 전 과정 자동 진행.

## 빌드

- `pnpm --filter shared build`: 그린
- `pnpm --filter server build`: 그린

## Self-Check: PASSED

- packages/shared/src/hand/winner.ts — 존재
- packages/shared/src/hand/winner.test.ts — 존재
- packages/server/src/__tests__/game-engine-3way-ttaengjabi.test.ts — 존재
- packages/server/src/__tests__/game-engine-sejang-disconnect.test.ts — 존재
- 커밋 990e050 — 존재 (Task 1)
- 커밋 f79addf — 존재 (Task 2)
- 커밋 f97dc42 — 존재 (Task 3)
