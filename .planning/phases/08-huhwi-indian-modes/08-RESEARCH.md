# Phase 8: 골라골라 + 인디언섯다 모드 - Research

**작성일:** 2026-03-30
**도메인:** 게임 모드 확장 (Strategy 패턴, per-player 상태 필터링, 동시 선택 처리)
**전체 신뢰도:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 모드명 `'gollagolla'`. 20장 오픈 → 동시 2장 선착순 선택 → 오리지날과 동일한 베팅 → 족보 비교 → 승패 결정. 미선택 카드 공개("후회") 없음.
- **D-02:** 동시 선택 충돌 처리: 서버 수신 선착순. 먼저 `select-gollagolla-cards` 이벤트 도착한 플레이어가 카드를 가져감. 이미 선택된 카드는 서버에서 reject, `game-error` 반환 후 클라이언트 재선택 유도.
- **D-03:** 골라골라 Phase 흐름: `'gollagolla-select'` → 모든 플레이어 2장 선택 완료 → `'betting'` phase → `'showdown'` → `'result'`
- **D-04:** 골라골라 UI: `DealerSelectModal`의 20장 그리드 패턴 재활용. 선택 불가 카드 dim 처리. 2장 선택 완료 시 자동 확정.
- **D-06:** 인디언섯다 Phase 흐름: `'dealing'` → `'betting-1'` → `'dealing-extra'` → `'betting-2'` → `'showdown'` → `'result'`
- **D-07:** 카드 가시성 반전 구현: 서버 per-player 필터링. `engine.getStateFor(playerId)` 메서드 추가.
- **D-08:** `getStateFor(playerId)` 필터링 로직:
  - 인디언 모드 + `dealing` / `betting-1` phase: 각 플레이어의 `cards[0]`를 요청자 본인에게는 `null`로 마스킹, 타인에게는 정상 공개
  - `dealing-extra` 이후: 각 플레이어의 `cards[1]`를 본인에게만 공개, 타인에게는 마스킹
  - `result` phase: 모든 카드 공개 (마스킹 없음)
  - 다른 모드: `getStateFor`가 기존 `getState()`와 동일하게 동작
- **D-09:** 인디언 쇼다운: `evaluateHand(cards[0], cards[1])`로 족보 판정 — 오리지날과 동일
- **D-10:** `IndianModeStrategy`와 `GollagollaModeStrategy`를 `game-engine.ts` 내부에 추가. 위임 범위: `deal()` + `showdown()` 만.
- **D-11:** `GameMode` 타입에 `'indian'` 및 `'gollagolla'` 추가. `GamePhase` 타입에 `'gollagolla-select'` 추가.
- **D-13:** `handleGameAction` 헬퍼 브로드캐스트를 인디언 모드 전용 per-player emit으로 분기. 또는 `getStateFor`를 항상 사용하는 단순화.

### Claude's Discretion

- 골라골라 선택 UI의 구체적 레이아웃 (모달 오버레이 vs 풀스크린 패널)
- 이미 선택된 카드 dim 처리 스타일 (opacity, line-through 등)
- 인디언 모드에서 마스킹된 카드의 UI 표현 (? 표시, 뒷면 이미지 등)
- `getStateFor` 단순화: 항상 per-player emit 사용 vs 모드 분기

### Deferred Ideas (OUT OF SCOPE)

- 선착순 고지 UI: 내가 선택하려던 카드가 이미 가져간 경우 토스트 알림 표시
- 인디언 타임아웃: 턴 타이머 기반 자동 다이 (v2 UX-01)
- 골라골라 UI 애니메이션: 카드 선택 애니메이션 (v2 UX-03)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | 설명 | Research 지원 |
|----|------|---------------|
| MODE-HR-01 | 선 플레이어가 "골라골라" 모드를 선택할 수 있다 | ModeSelectModal에 `'gollagolla'` 버튼 추가 + `GameMode` 타입 확장 |
| MODE-HR-02 | 20장 전부 오픈 그리드 표시, 모든 플레이어가 동시에 2장 선착순 선택 | `gollagolla-select` phase + `GollaSelectModal` (DealerSelectModal 재활용) |
| MODE-HR-03 | 각 플레이어가 2장 선택 완료하면 자동으로 베팅 페이즈로 전환 | 서버 `selectGollaCards()`에서 완료 감지 → phase=`'betting'` |
| MODE-HR-04 | 베팅 후 선택한 2장으로 족보를 비교하여 승패를 결정한다 | `GollagollaModeStrategy.showdown()` → `_resolveShowdownOriginal()` 재사용 |
| MODE-IN-01 | 선 플레이어가 "인디언섯다" 모드를 선택할 수 있다 | ModeSelectModal에 `'indian'` 버튼 추가 |
| MODE-IN-02 | 받은 카드는 본인에게 안 보이고 다른 플레이어에게 보인다 | `getStateFor()` D-08 마스킹 로직 |
| MODE-IN-03 | 첫 베팅: 자신의 첫 카드 못 보고, 타인 카드 보며 베팅 | `betting-1` phase에서 per-player emit |
| MODE-IN-04 | 베팅 종료 후 각 플레이어에게 1장 추가 배분 (본인만 볼 수 있다) | `dealing-extra` phase → `_dealExtraCardForIndian()` + D-08 마스킹 |
| MODE-IN-05 | 최종 베팅 후 2장 족보 비교, 승패 결정 | `betting-2` → `_resolveShowdownOriginal()` 재사용 |
</phase_requirements>

---

## 요약

Phase 8은 두 가지 게임 모드를 Strategy 패턴으로 추가하는 작업이다. 기존 Phase 7에서 확립된 `GameModeStrategy` 인터페이스 패턴을 그대로 따르며, 서버 코드 변경이 핵심이다.

**골라골라**는 덱 전체 공개 그리드에서 동시 선착순 선택을 처리하는 서버 로직과 클라이언트 선택 UI가 핵심이다. `DealerSelectModal`의 20장 그리드 패턴을 직접 재활용하되, 이미 선택된 카드를 실시간으로 dim 처리해야 한다. 동시성 충돌(두 사람이 같은 카드 선택)은 서버 선착순으로 해결하고, 클라이언트는 `game-error` 수신 시 재선택을 유도한다.

**인디언섯다**는 per-player 상태 필터링이 핵심이다. 현재 `handleGameAction`이 `io.to(roomId).emit('game-state', engine.getState())`로 모든 플레이어에게 동일한 상태를 브로드캐스트하는 패턴을 깨야 한다. `getStateFor(playerId)` 메서드를 추가하여 플레이어별로 마스킹된 상태를 개별 emit한다. 단순화를 위해 항상 per-player emit을 사용하는 방식(`getStateFor`가 비인디언 모드에서는 전체 공개)이 권장된다.

**핵심 권장사항:** `handleGameAction` 헬퍼를 항상 per-player emit으로 변경하는 단순화 방식을 채택한다. 모드 분기 조건 없이 모든 모드에서 `getStateFor`를 호출하면 인디언 모드에서만 마스킹이 적용되고 다른 모드는 기존과 동일하게 동작한다.

---

## Standard Stack

### Core (변경 없음 — 기존 스택 유지)

| 라이브러리 | 버전 | 용도 | 비고 |
|-----------|------|------|------|
| Socket.IO | 4.x | WebSocket 서버/클라이언트 | 기존 그대로 |
| React | 19 | 클라이언트 UI | 기존 그대로 |
| TypeScript | 5.x | 타입 안전성 | 기존 그대로 |
| vitest | 3.x | 단위 테스트 | 기존 그대로 |

### 신규 추가 없음

Phase 8은 새 라이브러리를 설치하지 않는다. 모든 구현은 기존 스택 내에서 처리된다.

---

## Architecture Patterns

### 패턴 1: Strategy 패턴 확장 (Phase 7 패턴 동일)

**무엇을:** `GameModeStrategy` 인터페이스에 `GollagollaModeStrategy`와 `IndianModeStrategy` 클래스 추가

**언제:** `deal()` 위임 — 각 모드의 배분 로직이 다를 때. `showdown()` 위임 — 각 모드의 족보 판정 로직이 다를 때.

**중요:** 골라골라의 `deal()`은 일반 배분이 아니라 선택 phase 진입이며, 인디언의 `deal()`은 1장 배분 + `betting-1`으로 전환한다.

```typescript
// game-engine.ts 내부 — 기존 패턴 그대로 추가
class GollagollaModeStrategy implements GameModeStrategy {
  deal(engine: GameEngine, state: GameState): void {
    // 덱을 그대로 유지, gollagolla-select phase로 전환만 함
    engine['_dealCardsGollagolla']();
  }
  showdown(engine: GameEngine, _state: GameState): void {
    // 오리지날과 동일 — cards[0], cards[1]로 족보 판정
    engine['_resolveShowdownOriginal']();
  }
}

class IndianModeStrategy implements GameModeStrategy {
  deal(engine: GameEngine, _state: GameState): void {
    // 1장 배분 후 betting-1으로 전환
    engine['_dealCardsIndian']();
  }
  showdown(engine: GameEngine, _state: GameState): void {
    // 오리지날과 동일 — cards[0], cards[1]로 족보 판정
    engine['_resolveShowdownOriginal']();
  }
}
```

### 패턴 2: Per-Player 상태 필터링

**무엇을:** `getStateFor(playerId: string): Readonly<GameState>`를 GameEngine에 추가

**언제:** 인디언 모드에서 플레이어마다 다른 카드 가시성이 필요할 때

**구현 방식 (권장: 항상 per-player emit):**

```typescript
// game-engine.ts
getStateFor(playerId: string): Readonly<GameState> {
  const state = this.state;
  // 인디언 모드가 아니면 전체 공개
  if (state.mode !== 'indian') return state;

  // deep clone 후 마스킹 적용
  const masked = JSON.parse(JSON.stringify(state)) as GameState;
  const hiddenCard = { rank: -1, attribute: 'hidden' } as any; // sentinel

  if (state.phase === 'dealing' || state.phase === 'betting-1') {
    // cards[0]은 본인에게 숨김, 타인에게 공개
    for (const p of masked.players) {
      if (p.id !== playerId && p.cards[0]) {
        // 타인 카드 공개 — 변경 없음
      } else if (p.id === playerId && p.cards.length > 0) {
        masked.players.find(mp => mp.id === playerId)!.cards[0] = hiddenCard;
      }
    }
  } else if (['dealing-extra', 'betting-2', 'showdown'].includes(state.phase)) {
    // cards[1]은 본인만 공개, 타인에게 숨김
    for (const p of masked.players) {
      if (p.id !== playerId && p.cards[1]) {
        masked.players.find(mp => mp.id === p.id)!.cards[1] = hiddenCard;
      }
    }
    // cards[0]은 여전히 타인에게 공개 (변경 없음)
  }
  // result phase: 마스킹 없음 (전체 공개)

  return masked;
}
```

**브로드캐스트 변경 (index.ts):**

```typescript
// handleGameAction 헬퍼를 per-player emit으로 교체
async function broadcastGameState(roomId: string): Promise<void> {
  const engine = getEngine(roomId);
  const sockets = await io.in(roomId).fetchSockets();
  for (const s of sockets) {
    s.emit('game-state', engine.getStateFor(s.data.playerId) as GameState);
  }
}
```

### 패턴 3: 골라골라 선택 처리

**무엇을:** `selectGollaCards(playerId, cardIndices)` 메서드 + `select-gollagolla-cards` 이벤트

**선착순 충돌 처리:**

```typescript
// game-engine.ts
selectGollaCards(playerId: string, cardIndices: [number, number]): void {
  this.assertPhase('gollagolla-select');
  const player = this.state.players.find(p => p.id === playerId);
  if (!player || !player.isAlive) throw new Error('INVALID_ACTION');
  if (player.cards.length >= 2) throw new Error('ALREADY_ATTENDED'); // 이미 선택 완료

  // 선착순 충돌 감지 — 이미 선택된 카드인지 확인
  const takenIndices = new Set(
    this.state.players
      .filter(p => p.cards.length > 0)
      .flatMap(p => (p as any).gollaSelectedIndices ?? [])
  );
  for (const idx of cardIndices) {
    if (takenIndices.has(idx)) throw new Error('CARD_ALREADY_TAKEN'); // 재선택 요구
  }

  // 카드 할당
  const [i0, i1] = cardIndices;
  player.cards = [this.state.deck[i0], this.state.deck[i1]];
  (player as any).gollaSelectedIndices = cardIndices;

  // 모든 생존자 선택 완료 시 betting으로 전환
  const alivePlayers = this.state.players.filter(p => p.isAlive);
  if (alivePlayers.every(p => p.cards.length >= 2)) {
    const dealerSeatIndex = this.getDealerSeatIndex();
    this.state.phase = 'betting';
    this.state.currentPlayerIndex = dealerSeatIndex;
    this.state.openingBettorSeatIndex = dealerSeatIndex;
    this._updateChipBreakdowns();
    this._updateEffectiveMaxBet();
  }
}
```

### 패턴 4: 인디언 2차 배분 (dealing-extra)

**무엇을:** `betting-1` 완료 후 생존 플레이어에게 1장씩 추가 배분 → `betting-2`

```typescript
// _advanceBettingTurn() 내 betting-1 완료 분기
if (this.state.phase === 'betting-1') {
  // 인디언: 2번째 카드 배분
  this._dealExtraCardForIndian();
  return;
}
```

```typescript
private _dealExtraCardForIndian(): void {
  const alivePlayers = this.state.players.filter(p => p.isAlive);
  const dealerSeatIndex = this.getDealerSeatIndex();
  const ordered = this._getAlivePlayersInCounterClockwiseOrder(dealerSeatIndex, alivePlayers);
  for (const player of ordered) {
    const card = this.state.deck.shift();
    if (card) player.cards.push(card);
  }
  this.state.phase = 'dealing-extra'; // 클라이언트 전환 감지용 (즉시 betting-2로)
  // dealing-extra는 중간 상태 — 즉시 betting-2 전환
  const bettingState = this.state;
  bettingState.phase = 'betting-2';
  bettingState.currentPlayerIndex = dealerSeatIndex;
  bettingState.openingBettorSeatIndex = dealerSeatIndex;
  bettingState.currentBetAmount = 0;
  this._bettingActed = new Set();
  alivePlayers.forEach(p => { p.currentBet = 0; });
  this._updateEffectiveMaxBet();
}
```

**참고:** `dealing-extra` phase를 명시적 경유지로 둘지 바로 `betting-2`로 전환할지는 플래너 재량이다. CONTEXT.md D-06에는 별도 phase로 명시되어 있으므로 중간 상태를 브로드캐스트한 후 `betting-2`로 전환하는 것이 의도에 맞다. 클라이언트가 "2번째 카드 받았음" 알림을 보여줄 수 있다.

### 패턴 5: 골라골라 selectMode 분기

**무엇을:** `selectMode()`에서 `'gollagolla'` 선택 시 shuffling→cutting 단계를 건너뛰고 직접 `'gollagolla-select'` phase로 전환

```typescript
// game-engine.ts selectMode()
selectMode(playerId: string, mode: GameMode): void {
  this.assertPhase('mode-select');
  const player = this.state.players.find(p => p.id === playerId);
  if (!player || !player.isDealer) throw new Error('NOT_YOUR_TURN');

  this.state.mode = mode;
  if (mode === 'shared-card') {
    this.state.phase = 'shared-card-select';
  } else if (mode === 'gollagolla') {
    // 골라골라: 셔플/기리 건너뜀 — 20장 그리드 직접 표시
    // 덱은 이미 정렬 상태 — 필요하면 셔플 후 공개
    this._dealCardsGollagolla(); // phase = 'gollagolla-select'로 전환
  } else {
    this.state.phase = 'shuffling';
  }
}
```

**중요:** 골라골라는 20장을 공개로 깔기 때문에 셔플이 필요하다. `_dealCardsGollagolla()`에서 덱을 셔플한 후 `gollagolla-select` phase로 전환한다. (플레이어가 보는 덱 순서가 매번 달라야 공정)

---

## 기존 코드 현황 분석

### 즉시 재사용 가능

| 컴포넌트/메서드 | 위치 | 골라골라 | 인디언 |
|---------------|------|--------|--------|
| `DealerSelectModal` 20장 그리드 | `packages/client/src/components/modals/DealerSelectModal.tsx` | 레이아웃 패턴 재활용 | - |
| `BETTING_PHASES` 상수 | `game-engine.ts:53` | `'betting'` 포함 | `'betting-1'`, `'betting-2'` 포함 |
| `_resolveShowdownOriginal()` | `game-engine.ts:935` | 동일 족보 판정 | 동일 족보 판정 |
| `_getAlivePlayersInCounterClockwiseOrder()` | `game-engine.ts:698` | - | 반시계 배분 |
| `_bettingActed` Set 초기화 패턴 | `game-engine.ts:421` | - | betting-2 전환 시 |

### 수정 필요

| 파일 | 변경 내용 |
|------|---------|
| `packages/shared/src/types/game.ts` | `GameMode`에 `'indian' \| 'gollagolla'` 추가, `GamePhase`에 `'gollagolla-select'` 추가 |
| `packages/shared/src/types/protocol.ts` | `select-gollagolla-cards` 이벤트 추가 (`ClientToServerEvents`), `ErrorPayload.code`에 `'CARD_ALREADY_TAKEN'` 추가 |
| `packages/server/src/game-engine.ts` | `GollagollaModeStrategy`, `IndianModeStrategy` 추가, `getModeStrategy()` switch 확장, `getStateFor()` 추가, `selectGollaCards()` 추가, `_dealCardsGollagolla()`, `_dealCardsIndian()`, `_dealExtraCardForIndian()` 추가, `_advanceBettingTurn()`에 `betting-1` 분기 추가 (인디언) |
| `packages/server/src/index.ts` | `handleGameAction` → per-player emit 교체, `select-gollagolla-cards` 이벤트 핸들러 추가 |
| `packages/client/src/components/modals/ModeSelectModal.tsx` | 골라골라, 인디언 버튼 추가 |
| `packages/client/src/components/layout/HandPanel.tsx` | 인디언 모드 `cards[0]` null/hidden 처리 (? 표시 또는 뒷면) |
| `packages/client/src/components/game/PlayerSeat.tsx` | 인디언 모드 타인 `cards[1]` null 처리 |
| `packages/client/src/pages/RoomPage.tsx` | `gollagolla-select` phase 처리, `GollaSelectModal` 마운트, 인디언 `dealing-extra` → `betting-2` 전환 감지 |

### 신규 생성 필요

| 파일 | 내용 |
|------|------|
| `packages/client/src/components/modals/GollaSelectModal.tsx` | 20장 그리드 선택 모달 (DealerSelectModal 패턴 기반) |

---

## Don't Hand-Roll

| 문제 | 직접 구현 금지 | 사용할 것 | 이유 |
|------|-------------|---------|------|
| 족보 판정 | 인디언/골라골라 전용 판정 로직 | `evaluateHand(cards[0], cards[1])` 재사용 | 이미 검증된 순수 함수 |
| 배분 순서 | 새 반시계 정렬 함수 | `_getAlivePlayersInCounterClockwiseOrder()` 재사용 | 중복 로직 금지 |
| 상태 deep copy | 커스텀 clone | `JSON.parse(JSON.stringify(state))` | `GameState`는 직렬화 가능한 plain object |
| 베팅 완료 감지 | 새 감지 로직 | `_isBettingComplete()` 재사용 | 인디언 `betting-1`, `betting-2` 모두 동일 조건 |
| 승자 결정/정산 | 새 정산 로직 | `_resolveShowdownOriginal()` 재사용 | 족보 비교 + 동점 처리 동일 |

---

## Common Pitfalls

### Pitfall 1: `handleGameAction`이 여전히 `io.to(roomId).emit`을 사용

**무슨 일이 생기냐:** 인디언 모드에서 모든 플레이어가 같은 마스킹 없는 상태를 받음 → 첫 번째 카드가 본인에게도 공개됨

**왜 발생하냐:** `handleGameAction`은 하나의 상태를 전체 방에 브로드캐스트하도록 설계되어 있음. 인디언 모드 핸들러에서 별도 emit을 추가하지 않으면 기존 헬퍼가 마스킹 없이 전송함.

**방지책:** `handleGameAction` 내부를 `broadcastGameState(roomId)` 호출로 교체. 또는 `handleGameAction`의 success 브로드캐스트 라인을 제거하고 각 핸들러에서 직접 `broadcastGameState`를 호출.

**경보 신호:** 인디언 테스트에서 `gameState.players[i].cards[0].rank !== -1`이 내 플레이어에게도 통과됨.

### Pitfall 2: `async/await` 누락으로 `fetchSockets` 결과가 비동기

**무슨 일이 생기냐:** `io.in(roomId).fetchSockets()`는 Promise를 반환하는 비동기 함수. await 없이 사용하면 for-of 루프가 즉시 완료되거나 런타임 오류 발생.

**방지책:** `handleGameAction` 또는 `broadcastGameState`를 `async` 함수로 변경하고 `await io.in(roomId).fetchSockets()`을 사용.

**중요:** 현재 `handleGameAction`은 동기 함수임. 비동기로 변경 시 호출 사이트도 `await`를 추가해야 하므로 모든 호출 지점을 확인할 것.

### Pitfall 3: 골라골라에서 덱 인덱스와 카드 매핑 혼동

**무슨 일이 생기냐:** 클라이언트가 `deck[cardIndex]` 방식으로 그리드를 렌더링하는데, 서버에서 카드를 덱에서 제거(`deck.shift()`)하거나 splice하면 인덱스가 불일치

**왜 발생하냐:** `_dealCardsOriginal`은 `deck.shift()`로 카드를 제거하지만, 골라골라는 index 기반 선택이므로 덱 순서를 유지해야 함

**방지책:** 골라골라에서 덱은 수정하지 않는다. `deck[cardIndex]`로 카드를 참조하여 `player.cards`에 추가하고, 인덱스를 `gollaSelectedIndices`로 별도 추적. 덱 자체는 변경하지 않음.

### Pitfall 4: `GamePhase` 타입에 `'gollagolla-select'` 누락 시 TypeScript 컴파일 오류

**무슨 일이 생기냐:** `shared/types/game.ts`의 `GamePhase` union에 추가하지 않으면 `assertPhase('gollagolla-select')`가 타입 오류, 클라이언트 phase 비교도 오류

**방지책:** 타입 파일 수정을 Task 1로 배치. 다른 모든 작업 전에 완료.

### Pitfall 5: 인디언 `dealing-extra`를 RoomPage에서 처리하지 않아 UI 전환 누락

**무슨 일이 생기냐:** `prevPhaseRef`가 `betting-1`을 기억하고 `dealing-extra` 또는 `betting-2`로 전환을 감지하지 못하면 2번째 카드 수령 알림이나 visibleCardCount 업데이트가 빠짐

**방지책:** RoomPage의 `useEffect([gameState?.phase])` 내에 `betting-1 → betting-2` 전환 감지 추가. `showExtraCardConfirm`과 유사한 상태를 추가하거나 toast 알림으로 "2번째 카드를 받았습니다"를 표시.

### Pitfall 6: `_advanceBettingTurn`에서 `betting-1` 완료 분기가 모드를 확인하지 않음

**무슨 일이 생기냐:** 세장섯다는 `betting-1` 완료 시 `_dealExtraCardForSejang()`을 호출하는데, 인디언도 `betting-1`을 사용함. 분기 없이 구현하면 세장섯다 로직이 인디언 모드에서도 실행됨.

**현재 코드 (game-engine.ts:821~826):**
```typescript
if (this.state.phase === 'betting-1') {
  // 세장섯다: 3번째 카드 배분 -> card-select
  this._dealExtraCardForSejang();
  return;
}
```

**방지책:** 이 분기를 `mode`로 분기:
```typescript
if (this.state.phase === 'betting-1') {
  if (this.state.mode === 'three-card') {
    this._dealExtraCardForSejang();
  } else if (this.state.mode === 'indian') {
    this._dealExtraCardForIndian();
  }
  return;
}
```

### Pitfall 7: 골라골라 모드에서 셔플/기리 UI가 표시되는 문제

**무슨 일이 생기냐:** `selectMode('gollagolla')`가 `gollagolla-select` phase로 바로 전환하는데, RoomPage에서 `mode-select → gollagolla-select` 전환을 감지하지 못하면 셔플 모달이 뜨거나 아무 UI도 표시 안 됨

**방지책:** RoomPage의 phase별 모달 렌더링 로직에서 `gollagolla-select` phase를 명시적으로 처리. `GollaSelectModal`을 `phase === 'gollagolla-select'` 조건으로 마운트.

---

## Code Examples

### 예시 1: GollaSelectModal (DealerSelectModal 기반)

```typescript
// packages/client/src/components/modals/GollaSelectModal.tsx
// 핵심 차이점: 전체 덱 공개(CardFace), 타인 선택 카드 dim, 2장 선택 후 자동 확정

import { useGameStore } from '@/store/gameStore';
import { CardFace } from '@/components/game/CardFace';
import { cn } from '@/lib/utils';

export function GollaSelectModal({ open, roomId }: { open: boolean; roomId: string }) {
  const { socket, gameState, myPlayerId } = useGameStore();
  const [mySelections, setMySelections] = useState<number[]>([]);

  const takenIndices = new Set(
    gameState?.players
      .filter(p => p.id !== myPlayerId && p.cards.length > 0)
      .flatMap(p => (p as any).gollaSelectedIndices ?? [])
  );
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const hasCompleted = (myPlayer?.cards.length ?? 0) >= 2;

  const handleSelect = (idx: number) => {
    if (hasCompleted || takenIndices.has(idx) || mySelections.includes(idx)) return;
    const next = [...mySelections, idx];
    setMySelections(next);
    if (next.length === 2) {
      socket?.emit('select-gollagolla-cards', { roomId, cardIndices: next as [number, number] });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Array.from({ length: 20 }, (_, i) => {
            const isTaken = takenIndices.has(i);
            const isMine = mySelections.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={hasCompleted || isTaken}
                className={cn(
                  'rounded-md transition-opacity',
                  isTaken && 'opacity-30 cursor-not-allowed',
                  !isTaken && !hasCompleted && 'cursor-pointer hover:ring-2 hover:ring-primary',
                  isMine && 'ring-2 ring-primary'
                )}
              >
                <CardFace card={gameState!.deck[i]} />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**주의:** `takenIndices`를 서버에서 직접 알려주지 않으므로 클라이언트가 `gameState.players[*].cards` 또는 별도 필드로 추론해야 한다. 서버에서 `gollaSelectedIndices`를 `GameState`에 포함시키거나, `PlayerState`의 `cards`가 선택 완료 시 채워지는 것을 활용한다.

### 예시 2: 인디언 마스킹 카드 표시

```typescript
// HandPanel.tsx 수정 — null/hidden sentinel 처리
const isHiddenCard = (card: Card | null | undefined) =>
  !card || (card as any).rank === -1;

// 카드 렌더링
{isMe && !isHiddenCard(card) ? (
  <CardFace card={card} />
) : isMe && isHiddenCard(card) ? (
  // 인디언: 내 첫 카드는 ?로 표시
  <div className="w-10 h-14 flex items-center justify-center bg-muted rounded text-xl font-bold">?</div>
) : (
  <CardBack className="w-10 h-14" />
)}
```

### 예시 3: per-player emit 패턴 (broadcastGameState)

```typescript
// index.ts
async function broadcastGameState(roomId: string): Promise<void> {
  const engine = gameEngines.get(roomId);
  if (!engine) return;
  const sockets = await io.in(roomId).fetchSockets();
  for (const s of sockets) {
    s.emit('game-state', engine.getStateFor(s.data.playerId) as GameState);
  }
}

// handleGameAction을 async로 변경
async function handleGameAction(
  socket: TypedSocket,
  roomId: string,
  action: () => void
): Promise<void> {
  try {
    action();
    await broadcastGameState(roomId);
  } catch (err: any) {
    socket.emit('game-error', {
      code: err.message || 'UNKNOWN_ERROR',
      message: ERROR_MESSAGES[err.message] || err.message || '알 수 없는 오류',
    });
  }
}
```

**중요:** `handleGameAction`을 async로 바꾸면 모든 호출 지점에서 `await`를 붙여야 한다. 또는 호출부에서 `void handleGameAction(...)` 패턴으로 Promise를 fire-and-forget으로 처리할 수 있으나, 순서 보장이 중요한 이벤트에서는 위험할 수 있다. 단순화를 위해 `handleGameAction` 자체를 변경하지 않고, action 콜백 마지막에 직접 `broadcastGameState`를 await하는 패턴도 검토할 것.

---

## State of the Art

| 이전 방식 | 현재 방식 | 변경 시점 | 의미 |
|---------|---------|---------|-----|
| `io.to(roomId).emit('game-state', state)` | `getStateFor(playerId)` per-player emit | Phase 8 | 플레이어별 다른 정보 제공 가능 |
| `selectMode` → `shuffling` | `selectMode('gollagolla')` → `gollagolla-select` (셔플/기리 스킵) | Phase 8 | 골라골라는 덱 순서 공개 불필요 (셔플은 서버에서 자동) |
| `betting-1` 분기 = 세장섯다 전용 | `mode` 체크로 세장섯다/인디언 분기 | Phase 8 | `BETTING_PHASES` 재사용으로 베팅 로직 공유 |

---

## Open Questions

1. **`gollaSelectedIndices`를 GameState에 명시적으로 포함할 것인가?**
   - 알려진 것: 클라이언트가 타인 선택 카드를 dim 처리하려면 어떤 카드가 이미 선택됐는지 알아야 함
   - 불명확한 것: `PlayerState.cards`가 채워지는 시점이 서버 수락 후이므로, 클라이언트가 즉시 반영을 위해 별도 필드가 필요한지
   - 권장: `PlayerState.cards` 배열이 선택된 2장으로 채워지는 시점 = 서버 수락 직후 → game-state 브로드캐스트로 즉시 반영됨. 별도 필드 불필요.

2. **`dealing-extra` phase를 일시적 중간 상태로 두어야 하는가?**
   - 알려진 것: CONTEXT.md D-06에 `'dealing-extra'`가 별도 phase로 명시됨
   - 불명확한 것: 클라이언트가 "2번째 카드 받음" 알림을 표시해야 하는지
   - 권장: `dealing-extra` phase를 짧게 브로드캐스트한 후 서버에서 즉시 `betting-2`로 전환. 클라이언트는 `dealing-extra` phase 수신 시 toast 표시 후 자동으로 다음 state를 수신.

3. **`handleGameAction`을 async로 변경할 것인가?**
   - 알려진 것: `fetchSockets()`가 async 필요. 현재 모든 호출 지점이 동기 방식으로 호출됨.
   - 권장: 단순화를 위해 `handleGameAction`을 async로 변경하고 모든 호출 지점을 `void handleGameAction(...)` 또는 `await handleGameAction(...)` 패턴으로 통일.

---

## Environment Availability

Step 2.6: 순수 코드/타입 변경이므로 외부 의존성 없음. SKIPPED.

---

## Validation Architecture

### Test Framework

| 항목 | 값 |
|------|-----|
| Framework | vitest 3.x |
| Config file | `packages/server/vitest.config.ts` |
| 빠른 실행 | `cd packages/server && pnpm test` |
| 전체 실행 | `pnpm --filter @sutda/server test` |

### Phase Requirements → Test Map

| Req ID | 동작 | 테스트 유형 | 자동화 명령 | 파일 존재? |
|--------|------|-----------|-----------|---------|
| MODE-HR-02 | 20장 그리드에서 2장 선착순 선택, 충돌 시 reject | unit | `pnpm --filter @sutda/server test src/game-engine.test.ts` | ❌ Wave 0 |
| MODE-HR-03 | 모든 플레이어 선택 완료 시 `betting` phase 전환 | unit | 동일 | ❌ Wave 0 |
| MODE-HR-04 | 골라골라 쇼다운 족보 비교 | unit | 동일 | ❌ Wave 0 |
| MODE-IN-02 | `getStateFor(myId).players[i].cards[0]` 본인에게 hidden | unit | 동일 | ❌ Wave 0 |
| MODE-IN-03 | `betting-1` phase에서 타인 cards[0] 공개 확인 | unit | 동일 | ❌ Wave 0 |
| MODE-IN-04 | `betting-1` 완료 후 `dealing-extra` / `betting-2` 전환 | unit | 동일 | ❌ Wave 0 |
| MODE-IN-05 | 인디언 쇼다운 족보 비교 | unit | 동일 | ❌ Wave 0 |

### Sampling Rate

- **Task 커밋 당:** `pnpm --filter @sutda/server test -- --run`
- **Wave 완료 시:** `pnpm --filter @sutda/server test -- --run` + 수동 브라우저 검증
- **Phase gate:** 전체 테스트 그린 + 인디언/골라골라 수동 플레이 확인

### Wave 0 Gaps

- [ ] `packages/server/src/game-engine.test.ts`에 Phase 8 테스트 케이스 추가 — MODE-HR-02~04, MODE-IN-02~05
- [ ] 기존 테스트 파일이 이미 존재하므로 `makePlayers` 헬퍼 재사용 가능

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md 파일 없음 — 프로젝트 전반 제약은 STATE.md의 Decisions 섹션에서 추론:

- **서버 권위 원칙:** 모든 게임 상태는 서버에서 관리. 클라이언트 isDealer 조건 기반 로직 금지.
- **set-player-id 패턴:** 소켓 ID = playerId. `socket.data.playerId` 사용.
- **타입 안전성:** strict TypeScript. 타입 단언(`as any`) 최소화, 기존 코드에서도 `(player as any).selectedCards` 패턴이 사용되고 있으나 새 필드는 가능하면 타입에 명시 권장.
- **모노레포 패턴:** `@sutda/shared` 타입 변경 후 서버/클라이언트 순서로 업데이트.

---

## Sources

### Primary (HIGH confidence)

- `packages/server/src/game-engine.ts` — 기존 Strategy 패턴, `_dealCards*`, `_resolveShowdown*`, `_advanceBettingTurn`, `_bettingActed` Set 패턴 직접 확인
- `packages/server/src/index.ts` — `handleGameAction` 헬퍼, 브로드캐스트 패턴, 이벤트 핸들러 구조 직접 확인
- `packages/shared/src/types/game.ts` — `GameMode`, `GamePhase` union 타입 직접 확인
- `packages/shared/src/types/protocol.ts` — `ClientToServerEvents`, `ServerToClientEvents` 직접 확인
- `packages/client/src/components/modals/DealerSelectModal.tsx` — 20장 그리드 패턴 직접 확인
- `packages/client/src/components/modals/ModeSelectModal.tsx` — 모드 버튼 추가 위치 확인
- `packages/client/src/components/layout/HandPanel.tsx` — 카드 가시성 로직, `visibleCardCount` prop 패턴 확인
- `packages/client/src/components/game/PlayerSeat.tsx` — 타인 카드 뒷면 렌더링 로직 확인
- `packages/client/src/pages/RoomPage.tsx` — phase 전환 감지, 딜링 애니메이션, 모달 마운트 패턴 확인
- `.planning/phases/08-huhwi-indian-modes/08-CONTEXT.md` — 잠긴 결정 사항 전체

### Secondary (MEDIUM confidence)

- Socket.IO `io.in(roomId).fetchSockets()` — Socket.IO 공식 문서 패턴으로 알려진 per-socket emit 방식

---

## Metadata

**신뢰도 분석:**

- Standard Stack: HIGH — 라이브러리 추가 없음, 기존 스택 그대로
- Architecture: HIGH — 기존 코드를 직접 분석하여 패턴 확인
- Pitfalls: HIGH — 코드 내 실제 분기점(`_advanceBettingTurn` betting-1 분기, `handleGameAction` 브로드캐스트)을 직접 확인하여 도출

**Research 날짜:** 2026-03-30
**유효 기간:** 프로젝트 완료까지 (안정 스택)
