---
quick_id: 260429-urr
slug: engine-3way-disconnect
mode: quick
created: 2026-04-29
status: planned
---

# Quick 260429-urr: 3인 이상 땡잡이 승자 오판정 + 세장섯다 disconnect 멈춤 수정

## 문제 정의

**버그 1 — 3인 이상 땡잡이 승자 오판정**
- 재현: 3인 게임에서 A=땡잡이(3,7), B=4땡, C=여섯끗 패가 나오면 최종 승자가 "여섯끗"으로 잘못 결정됨.
- 원인: `_resolveShowdownOriginal/Sejang/Hanjang`(packages/server/src/game-engine.ts:1583, 1649, 1716)이 `hands.slice(1).reduce(compareHands)` 패턴으로 승자를 추리는데, `compareHands`는 pairwise 규칙이고 땡잡이는 비-전이적(non-transitive) 규칙이라 가위바위보 사이클이 됨.
  - 땡잡이 > 4땡 (catch) / 4땡 > 여섯끗 (1004 > 6) / 여섯끗 > 땡잡이 (6 > 0) → 순서에 따라 결과가 달라짐.
- 정답: 섯다 하우스룰상 "땡잡이는 라운드에 1~9땡이 있으면 장땡/광땡을 제외한 모두를 이긴다". 즉 **다인전(multi-player) 컨텍스트 인식이 필요**한 규칙이다.

**버그 2 — 세장섯다 sejang-open/card-select에서 disconnect 시 게임 멈춤**
- 재현: 세장섯다 모드에서 카드 배분 후 (sejang-open 또는 card-select 단계) 한 플레이어가 연결을 잃으면, 모든 생존자가 선택을 마치는 조건이 영영 충족되지 않아 다음 phase로 진행하지 못함.
- 원인: `forceDisconnectedPlayerAction`(packages/server/src/game-engine.ts:1982)이 `dealer-select`, `mode-select`, `shared-card-select`, `gusa-pending`, `gusa-announce`, `attend-school`, betting phases, `card-reveal`, `showdown`은 처리하지만 **`sejang-open`과 `card-select`는 누락**되어 있음.
- 정답(사용자 지정): 게임 시작 후 disconnect는 즉시 다이(auto-fold). 세장섯다에서 카드 공개/선택을 안 했어도 "선택한 것으로 처리"하고 다이.

## must_haves

### Truths (불변)
- 기존 `compareHands` pairwise 동작과 1대1 케이스 결과는 동일해야 한다 (compare.test.ts 기존 테스트 모두 그린 유지).
- 세장섯다 disconnect 처리가 추가되어도 정상 플레이(아무도 disconnect 안 한 케이스)에는 영향 없어야 한다.
- 게임이 시작되지 않은 상태(waiting/dealer-select 이전)의 disconnect는 기존 관전 로직을 그대로 사용한다 (이번 작업 범위 밖).

### Artifacts (산출물)
- `packages/shared/src/hand/winner.ts` 또는 동등한 위치에 다인전 인식 승자 결정 함수 (`findRoundWinner`).
- 위 함수에 대한 vitest 단위 테스트 (3-way 땡잡이 케이스 포함).
- `_resolveShowdownOriginal/Sejang/Hanjang` 3개 메서드가 신규 함수를 사용하도록 갱신.
- `forceDisconnectedPlayerAction`에 `sejang-open`/`card-select` 분기 추가.
- 통합 테스트: (a) 3인 땡잡이+4땡+여섯끗 → 땡잡이 승. (b) 세장섯다 sejang-open 중 disconnect → 자동 다이 후 phase 진행.

### Key Links
- packages/shared/src/hand/compare.ts (기존 pairwise 비교)
- packages/shared/src/hand/evaluator.ts (HandResult 생성)
- packages/server/src/game-engine.ts:1583, 1649, 1716 (showdown 결정)
- packages/server/src/game-engine.ts:1982 (forceDisconnectedPlayerAction)
- packages/server/src/game-engine.ts:1045 (openSejangCard) / :610 (selectCards)

## 작업 분해

### Task 1: 다인전 인식 승자 결정 함수 추가 (shared)

**파일:** `packages/shared/src/hand/winner.ts` (신규), `packages/shared/src/hand/winner.test.ts` (신규), `packages/shared/src/index.ts` (export 추가)

**Action:**
1. `findRoundWinner(hands: HandResult[]): { winnerIndices: number[] }` 함수를 작성한다.
2. 규칙(우선순위 순):
   - **(a) 광땡 우선**: `score >= 1100`인 패가 있으면 그 중 score 최대값을 가진 모든 인덱스가 후보. 단 암행어사가 있고 후보가 일팔광땡(1200) 또는 일삼광땡(1100)뿐이면 암행어사가 그 광땡들을 잡는다(아래 (c)와 결합 처리).
   - **(b) 땡잡이 catch**: `isSpecialBeater && score === 0`인 땡잡이가 있고, 라운드에 일땡~구땡(`score`가 1001~1009)이 있으면 → 땡잡이 인덱스들이 승자(동률이면 다수). 단 장땡(1010) 또는 광땡(1100/1200/1300)이 함께 있으면 그 패가 땡잡이를 이긴다.
   - **(c) 암행어사 catch**: `isSpecialBeater && score === 1`인 암행어사가 있고, 라운드에 일팔광땡(1200) 또는 일삼광땡(1100)이 있으면 → 암행어사 인덱스들이 승자. 삼팔광땡(1300)이 있으면 삼팔광땡이 이긴다.
   - **(d) 일반**: 위 특수규칙이 발동하지 않으면 score 최대값을 가진 모든 인덱스가 승자(동률이면 tie).
3. 단순화 전략: 모든 페어를 round-robin 비교해도 위 규칙과 결과가 일치하는지 테스트로 검증. 그러나 비-전이성 때문에 round-robin은 못 쓰고, **명시적 규칙 코드**로 작성한다.
4. `compareHands`와의 일관성 보장: 2명 입력일 때 `findRoundWinner`의 결과가 `compareHands`의 결과와 동일해야 한다 (단위 테스트로 검증).

**Verify:**
- `pnpm --filter shared test` 그린.
- 신규 테스트 케이스:
  - 땡잡이 + 4땡 + 6끗 → 땡잡이 승.
  - 땡잡이 + 4땡 + 장땡 → 장땡 승.
  - 땡잡이 + 4땡 + 광땡(1300) → 광땡 승.
  - 땡잡이 + 6끗 (땡 없음) → 6끗 승 (땡잡이 불발).
  - 암행어사 + 일팔광땡 + 일반 끗 → 암행어사 승.
  - 암행어사 + 삼팔광땡 → 삼팔광땡 승.
  - 동점 (예: 6끗 vs 6끗) → tie (winnerIndices 길이 2).
  - 2명 입력 시 모든 compareHands 케이스와 일치 (스모크 매트릭스).

**Done:** export 추가되고 단위 테스트 모두 통과.

---

### Task 2: showdown 메서드 3개를 findRoundWinner로 교체

**파일:** `packages/server/src/game-engine.ts`

**Action:**
1. `_resolveShowdownOriginal`(:1583), `_resolveShowdownSejang`(:1649), `_resolveShowdownHanjang`(:1716)에서 기존 reduce 패턴을
   ```
   const { winnerIndices } = findRoundWinner(hands.map(h => h.hand));
   const tiedPlayers = winnerIndices.map(i => hands[i]);
   const best = tiedPlayers[0];
   const winnerHand = best.hand;
   ```
   형태로 교체한다.
2. import 갱신: `import { ..., findRoundWinner } from '@sutda/shared';`
3. 동률(`tiedPlayers.length > 1`) 처리, 구사 면제 처리 등 후속 로직은 기존 그대로 유지.
4. 기존 단위 테스트(이미 있는 것)가 모두 그린이어야 한다.

**Verify:**
- `pnpm --filter shared build && pnpm --filter server test` 그린.
- 신규 통합 테스트(`packages/server/src/__tests__/` 에 적절한 위치):
  - 3인 게임에서 손패를 강제로 [땡잡이, 4땡, 6끗]으로 세팅한 뒤 showdown까지 진행하면 winnerId가 땡잡이 보유 플레이어여야 한다.
  - 기존 sejang/hanjang 테스트가 모두 그린 유지.

**Done:** 3개 showdown 메서드 모두 새 함수를 사용하고, 통합 테스트 통과.

---

### Task 3: sejang-open / card-select disconnect 자동 다이

**파일:** `packages/server/src/game-engine.ts`, `packages/server/src/game-engine.test.ts` 또는 `packages/server/src/__tests__/game-engine-sejang.test.ts`

**Action:**
1. `forceDisconnectedPlayerAction` (:1982) 안에서 betting/card-reveal 분기 직전에 다음을 추가:
   ```ts
   // sejang-open phase: 자동 다이 처리 (선택 안 한 상태로 fold)
   if (this.state.phase === 'sejang-open' && player.isAlive) {
     player.isAlive = false;
     // openedCardIndex는 비워둬도 alive 필터링으로 제외되므로 phase 진행 가능
     const alive = this.state.players.filter(p => p.isAlive);
     if (alive.length <= 1) {
       // 생존자 1명 이하 → 즉시 결과 (라운드 winner 확정)
       this._finalizeWhenOneSurvivor();   // 아래 헬퍼 참고
     } else if (alive.every(p => p.openedCardIndex !== undefined)) {
       // 나머지가 모두 선택 완료 → betting-1 진입
       const dealerSeatIndex = this.getDealerSeatIndex();
       this.state.phase = 'betting-1';
       this.state.currentPlayerIndex = dealerSeatIndex;
       this.state.openingBettorSeatIndex = dealerSeatIndex;
       this._bettingActed = new Set();
       this._updateChipBreakdowns();
       this._updateEffectiveMaxBet();
     }
   }

   // card-select phase: 자동 다이 처리
   if (this.state.phase === 'card-select' && player.isAlive) {
     player.isAlive = false;
     const alive = this.state.players.filter(p => p.isAlive);
     if (alive.length <= 1) {
       this._finalizeWhenOneSurvivor();
     } else if (alive.every(p => (p as any).selectedCards?.length === 2)) {
       alive.forEach(p => {
         p.isRevealed = false;
         p.revealedCardIndices = [];
       });
       this.state.phase = 'card-reveal';
     }
   }
   ```
2. `_finalizeWhenOneSurvivor()` 헬퍼: 기존 betting 흐름에서 "생존자 1명" 정산 로직과 동일한 코드 경로를 재사용한다. game-engine.ts:1351~1356 근처의 패턴을 참고해 구현 (winnerId = 유일 생존자, settle, generateHistory, phase='result'). 기존 함수가 있으면 그것을 호출, 없으면 신규 헬퍼로 추출.
3. (선택사항) 더 일반화: `BETTING_PHASES` 외 모든 게임 진행 phase(`dealing|sejang-open|card-select|card-reveal|showdown`)에서 disconnect 시 isAlive=false를 보장하는 가드를 점검한다. 이번 PR 범위에서는 sejang-open/card-select 두 phase만 추가하면 사용자 보고 버그가 막힌다.

**Verify:**
- `pnpm --filter server test` 그린.
- 신규 단위 테스트:
  - 3인 세장섯다, sejang-open 단계에서 1명 disconnect → 해당 플레이어 isAlive=false, 나머지 2명이 모두 openedCardIndex 가지면 phase가 'betting-1'로 진행.
  - 2인 세장섯다, sejang-open 단계에서 1명 disconnect → 남은 1명이 winner로 확정 (phase='result').
  - 3인 세장섯다, card-select 단계에서 1명 disconnect → phase가 'card-reveal'로 진행 (2명이 모두 selectedCards 가질 때).
  - 정상 플레이 (disconnect 없음) 회귀: 기존 sejang 테스트 모두 그린 유지.

**Done:** 두 phase에서 disconnect → 자동 다이 + phase 진행/결과 처리 동작.

---

## 커밋 단위

각 Task = 원자 커밋. 메시지 컨벤션은 기존 프로젝트 따라:
- `fix(shared): 다인전 인식 승자 결정 함수 추가 (3인 땡잡이 버그)`
- `fix(server): showdown에서 findRoundWinner 사용 — 3인 땡잡이 4땡 6끗 승자 정정`
- `fix(server): sejang-open/card-select disconnect 시 자동 다이 처리`

## 비-목표 (Out of scope)

- 광땡/암행어사 신규 패 정의 변경.
- 룸 단위 disconnect/reconnect/timeout 정책 (그건 room-manager.ts와 60초 grace 로직으로 별도).
- 다른 모드(한장공유/골라골라/허위/인디언)의 disconnect 누락 점검 — 이번 PR은 사용자 보고 두 phase에 한정.
