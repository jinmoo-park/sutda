# Phase 7: 세장섯다 + 한장공유 모드 - Research

**Researched:** 2026-03-30
**Domain:** 카드 게임 Strategy 패턴 확장, 멀티-Phase FSM, WebSocket 이벤트 설계
**Confidence:** HIGH (기존 코드베이스 직접 분석 + CONTEXT.md 결정 사항 반영)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `OriginalMode`, `SejangMode`, `HanjangMode` 클래스 별도 분리. `GameEngine`은 모드 객체에게 위임.
- **D-02:** Strategy가 담당하는 메서드 범위: **deal()** + **showdown()** 만. 베팅/정산 로직은 `GameEngine`에 유지.
- **D-03:** `GameMode` 타입에 `'sejang' | 'hanjang'` 추가 (`packages/shared/src/types/game.ts`). 현재 코드에는 `'three-card' | 'shared-card'`로 이미 정의되어 있음 — 리네임 필요 여부 확인 필요.
- **D-04:** `PlayerState`에 `selectedCards?: Card[]` 필드 추가.
- **D-05:** `GameState`에 `sharedCard?: Card` 필드 추가.
- **D-06:** 세장섯다 전용 GamePhase 추가: `'betting-1'` / `'dealing-extra'` / `'card-select'` / `'betting-2'`
- **D-07:** `dealing-extra` 전환은 서버 자동 처리 — 클라이언트 별도 액션 불필요.
- **D-08:** 오리지날 모드는 기존 `'betting'` phase 유지. 세장섯다 전용 phase들은 오리지날에 영향 없음.
- **D-09:** `card-select` phase에서 손패패널이 선택 모드 전환. 2장 선택 시에만 확인 버튼 활성화.
- **D-10:** 확인 버튼 → `select-cards` 이벤트 emit (`{ roomId, cardIndices: [0|1|2, 0|1|2] }`). 서버에서 `selectedCards`에 저장.
- **D-11:** 카드 선택 타이밍: **1차 베팅 후 2차 베팅 전** (`card-select` phase). 2차 베팅 시 선택 완료 상태.
- **D-12:** 기존 `DealerSelectModal` 재활용 — 제목 "공유 카드 선택"으로 변경.
- **D-13:** 선 플레이어(딜러)에게는 20장 전부 앞면 공개. 다른 플레이어에게는 뒷면.
- **D-14:** 공유 카드 선택 후 게임 테이블 중앙에 앞면으로 항상 표시.
- **D-15:** 한장공유에서 각 플레이어 손패는 1장. 족보 판정: `evaluateHand(playerCard, sharedCard)`.

### Claude's Discretion

- `card-select` phase에서 선택된 카드의 시각적 하이라이트 스타일 (border, opacity 등)
- 공유 카드를 테이블 중앙에 표시하는 구체적 레이아웃 (크기, 위치)
- 세장섯다에서 3번째 카드가 배분될 때 애니메이션 처리 여부

### Deferred Ideas (OUT OF SCOPE)

없음 — 논의가 Phase 7 범위 내에서 진행됨.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODE-SJ-01 | 선 플레이어가 "세장섯다" 모드를 선택할 수 있다 | ModeSelectModal 확장, select-mode 이벤트에 'sejang' 값 추가 |
| MODE-SJ-02 | 2장 배분 → 베팅 → 1장 추가 → 3장 중 2장 조합 족보 비교 | SejangMode Strategy, 4개 신규 phase, select-cards 이벤트 |
| MODE-SH-01 | 선 플레이어가 "한장공유" 모드를 선택할 수 있다 | ModeSelectModal 확장, select-mode에 'hanjang' 추가 |
| MODE-SH-02 | 선 플레이어가 공유 카드 1장을 20장 중 지정한다 | DealerSelectModal 재사용, set-shared-card 이벤트 |
| MODE-SH-03 | 각 플레이어는 1장씩 받아 공유 카드와 조합 | HanjangMode Strategy, sharedCard 상태, 1장 딜링 |
| MODE-SH-04 | 베팅 후 최종 족보 승패 결정 | HanjangMode.showdown() — evaluateHand(playerCard, sharedCard) |

</phase_requirements>

---

## 요약

Phase 7은 기존 오리지날 모드의 `GameEngine` FSM 위에 **두 가지 새 모드를 Strategy 패턴으로 덧붙이는 작업**이다. 핵심 도전은 세장섯다가 요구하는 **4단계 추가 phase**(`betting-1` → `dealing-extra` → `card-select` → `betting-2`)를 기존 FSM 구조에 non-breaking하게 삽입하는 것이고, 한장공유는 비교적 단순한 딜링 변형이다.

기존 코드베이스 분석 결과:
- `GameMode` 타입은 이미 `'three-card' | 'shared-card'`로 선언되어 있다. CONTEXT.md D-03은 `'sejang' | 'hanjang'`을 사용하지만, 기존 타입명과 불일치가 있다. **플래너는 통일 방향을 결정해야 한다** (기존 `'three-card'/'shared-card'`를 유지하거나 `'sejang'/'hanjang'`으로 리네임).
- `_dealCards()`, `_resolveShowdown()`은 private 메서드로, Strategy 추출을 위해 protected 또는 분리된 인터페이스로 재설계가 필요하다.
- `processBetAction()`은 `this.state.phase !== 'betting'` 체크를 하드코딩하여 `'betting-1'`/`'betting-2'` phase에서 동작하지 않는다 — **반드시 수정 필요**.
- `_updateEffectiveMaxBet()`도 `phase !== 'betting'` 조건이 있어 신규 베팅 phase에서 업데이트가 누락된다.

**핵심 권장사항:** Strategy 패턴을 전면 리팩터링으로 구현하지 말고, `GameEngine`에 mode-dispatch 분기를 추가하는 minimal 방식으로 구현하라. 기존 `_dealCards()`와 `_resolveShowdown()`을 strategy 객체에게 위임하는 형태로만 변경하여 리스크를 최소화한다.

---

## Standard Stack

### Core (변경 없음 — 기존 스택 그대로)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | 타입 안전성 | 모노레포 전체 적용 중 |
| Socket.IO | 4.x | WebSocket 통신 | Phase 3부터 사용 중 |
| React 19 + Vite 6 | 최신 | 클라이언트 UI | Phase 1 결정 사항 |
| vitest 3 | 3.x | 테스트 | Phase 1 결정 사항 |
| Radix UI / shadcn | 최신 | UI 컴포넌트 | Phase 6부터 적용 |
| Tailwind CSS v4 | 4.x | 스타일링 | Phase 6 결정 사항 |

### 신규 설치 불필요

Phase 7은 기존 스택만으로 구현 가능하다. 외부 라이브러리 추가 없음.

---

## Architecture Patterns

### 현재 GameEngine FSM 구조 (분석 결과)

```
waiting → dealer-select → attend-school → mode-select → shuffling
  → cutting → dealing → betting → showdown → result → [rematch-pending]
```

`selectMode()` 이후 `state.mode`가 저장되지만, 현재는 `'original'`만 의미 있게 사용된다. 이후 `_dealCards()`와 `_resolveShowdown()`에서 mode를 읽어 분기하도록 확장한다.

### Pattern 1: Mode-Dispatched Strategy (권장 구현 방식)

전면 클래스 분리보다 **GameEngine 내부 dispatch** 방식을 권장한다.
CONTEXT.md D-01~D-02는 "Strategy 클래스 분리"를 명시하지만, 기존 FSM과의 결합도를 고려하면 아래 방식이 안전하다.

```typescript
// packages/server/src/game-engine.ts

// Strategy 인터페이스 (최소화)
interface GameModeStrategy {
  deal(engine: GameEngine, state: GameState): void;
  showdown(engine: GameEngine, state: GameState): void;
}

// GameEngine 내부에서 dispatch
private getModeStrategy(): GameModeStrategy {
  switch (this.state.mode) {
    case 'three-card': return new SejangModeStrategy();
    case 'shared-card': return new HanjangModeStrategy();
    default: return new OriginalModeStrategy();
  }
}

// _dealCards 대신
private _executeDealing(): void {
  const strategy = this.getModeStrategy();
  strategy.deal(this, this.state);
}
```

### Pattern 2: 세장섯다 Phase 전환 흐름

```
dealing → betting-1 → [dealing-extra: auto] → card-select → betting-2 → showdown → result
```

`dealing-extra`는 서버가 자동으로 처리 (D-07):
```typescript
// SejangModeStrategy.deal() 내부
// 1) 2장 배분 완료 후
state.phase = 'betting-1';
state.currentPlayerIndex = dealerSeatIndex;
state.openingBettorSeatIndex = dealerSeatIndex;

// betting-1 완료 시 _advanceBettingTurn에서 자동 dealing-extra 전환 감지
// → 생존자에게 3번째 카드 배분 → card-select phase로 이동
```

### Pattern 3: processBetAction phase 확장

**현재 코드 (버그 원인):**
```typescript
processBetAction(playerId: string, action: BetAction): void {
  if (this.state.phase !== 'betting') {  // 이 조건 때문에 betting-1/2 거부됨
    throw new Error('INVALID_PHASE');
  }
  // ...
}
```

**수정 패턴:**
```typescript
private readonly BETTING_PHASES: GamePhase[] = ['betting', 'betting-1', 'betting-2'];

processBetAction(playerId: string, action: BetAction): void {
  if (!this.BETTING_PHASES.includes(this.state.phase)) {
    throw new Error('INVALID_PHASE');
  }
  // ...
}
```

동일하게 `_updateEffectiveMaxBet()`도 수정:
```typescript
private _updateEffectiveMaxBet(): void {
  if (!this.BETTING_PHASES.includes(this.state.phase)) {
    this.state.effectiveMaxBet = undefined;
    return;
  }
  // ...
}
```

### Pattern 4: _advanceBettingTurn 모드별 분기

베팅 완료 후 다음 phase 결정이 모드마다 다르다:

```typescript
private _advanceBettingTurn(): void {
  // ...
  if (this._isBettingComplete()) {
    // 모드별 분기
    if (this.state.phase === 'betting-1') {
      // 세장섯다: dealing-extra → card-select
      this._dealExtraCardForSejang();
      return;
    }
    if (this.state.phase === 'betting-2') {
      // 세장섯다: showdown (selectedCards 기반)
      this.state.players.filter(p => p.isAlive).forEach(p => { p.isRevealed = true; });
      this._resolveShowdownSejang();
      return;
    }
    // 오리지날 / 한장공유: 기존 로직
    this.state.players.filter(p => p.isAlive).forEach(p => { p.isRevealed = true; });
    this._resolveShowdown();
    return;
  }
  // ...
}
```

### Pattern 5: 한장공유 공유카드 지정 Phase

```
mode-select → [신규: shared-card-select phase] → shuffling → cutting → dealing(1장) → betting → showdown
```

`sharedCard` 지정 전에 별도 phase가 필요하다:
```typescript
// selectMode() 수정
selectMode(playerId: string, mode: GameMode): void {
  this.assertPhase('mode-select');
  const player = this.state.players.find(p => p.id === playerId);
  if (!player || !player.isDealer) throw new Error('NOT_YOUR_TURN');

  this.state.mode = mode;

  if (mode === 'shared-card') {
    // 딜 전에 공유카드 선택 단계 삽입
    this.state.phase = 'shared-card-select';
  } else {
    this.state.phase = 'shuffling';
  }
}

// 새 메서드
setSharedCard(playerId: string, cardIndex: number): void {
  this.assertPhase('shared-card-select');
  const player = this.state.players.find(p => p.id === playerId);
  if (!player || !player.isDealer) throw new Error('NOT_YOUR_TURN');
  if (cardIndex < 0 || cardIndex >= this.state.deck.length) throw new Error('INVALID_ACTION');

  this.state.sharedCard = this.state.deck[cardIndex];
  // deck에서 제거 (플레이어에게 배분되지 않도록)
  this.state.deck = this.state.deck.filter((_, i) => i !== cardIndex);
  this.state.phase = 'shuffling';
}
```

### Pattern 6: selectCards (세장섯다 card-select)

```typescript
selectCards(playerId: string, cardIndices: number[]): void {
  this.assertPhase('card-select');

  if (cardIndices.length !== 2) throw new Error('INVALID_ACTION');
  const player = this.state.players.find(p => p.id === playerId);
  if (!player || !player.isAlive) throw new Error('INVALID_ACTION');
  if (player.selectedCards && player.selectedCards.length === 2) {
    throw new Error('ALREADY_ATTENDED'); // 이미 선택함
  }

  const [i0, i1] = cardIndices;
  if (i0 === i1 || i0 < 0 || i0 >= 3 || i1 < 0 || i1 >= 3) {
    throw new Error('INVALID_ACTION');
  }

  player.selectedCards = [player.cards[i0], player.cards[i1]];

  // 모든 생존자가 선택 완료했는지 확인
  const alivePlayers = this.state.players.filter(p => p.isAlive);
  const allSelected = alivePlayers.every(p => p.selectedCards && p.selectedCards.length === 2);
  if (allSelected) {
    this.state.phase = 'betting-2';
    const dealerSeatIndex = this.getDealerSeatIndex();
    this.state.currentPlayerIndex = dealerSeatIndex;
    this.state.openingBettorSeatIndex = dealerSeatIndex;
    this._bettingActed = new Set();
    this.state.currentBetAmount = 0;
    this._updateEffectiveMaxBet();
  }
}
```

### Pattern 7: DealerSelectModal 재사용 (한장공유 공유카드 지정)

`DealerSelectModal`의 현재 패턴:
- `dealerSelectCards` 상태를 읽어 이미 선택된 카드 표시
- 딜러에게만 카드 앞면 공개 (현재는 자신이 선택한 카드만 앞면)

한장공유 모드에서는 **딜러에게 20장 전부 앞면 공개** (D-13). 기존 모달을 재사용하되 `phase === 'shared-card-select'` 조건을 추가하고, 딜러 여부를 확인하여 전부 앞면/뒷면 분기:

```tsx
// SharedCardSelectModal.tsx (DealerSelectModal 복사 후 수정)
const isDealer = gameState?.players.find(p => p.id === myPlayerId)?.isDealer ?? false;

// 카드 렌더링 시
{isDealer ? (
  <CardFace card={deck[i]} />  // 딜러: 항상 앞면
) : (
  <CardBack />  // 비딜러: 항상 뒷면
)}
```

### Pattern 8: HandPanel 카드 선택 모드

`card-select` phase에서 카드 클릭 토글 및 확인 버튼 활성화:

```tsx
// HandPanel.tsx 확장
interface HandPanelProps {
  myPlayer: PlayerState | null;
  phase?: GamePhase;  // 추가
  onSelectCards?: (indices: number[]) => void;  // 추가
}

// card-select mode
const isCardSelectMode = phase === 'card-select' && myPlayer?.isAlive;
const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

const toggleCard = (idx: number) => {
  if (selectedIndices.includes(idx)) {
    setSelectedIndices(prev => prev.filter(i => i !== idx));
  } else if (selectedIndices.length < 2) {
    setSelectedIndices(prev => [...prev, idx]);
  }
};
```

### Recommended Project Structure

```
packages/
├── shared/src/types/
│   ├── game.ts          — GamePhase(+4개), GameMode(확인), PlayerState(+selectedCards), GameState(+sharedCard)
│   └── protocol.ts      — select-cards, set-shared-card 이벤트 추가
├── server/src/
│   ├── game-engine.ts   — Strategy 분기, 신규 메서드, phase 확장
│   └── index.ts         — select-cards, set-shared-card 핸들러 추가
└── client/src/
    ├── components/modals/
    │   ├── ModeSelectModal.tsx          — 세장섯다/한장공유 버튼 추가
    │   └── SharedCardSelectModal.tsx    — DealerSelectModal 기반 신규
    └── components/layout/
        ├── HandPanel.tsx                — card-select mode 추가
        └── GameTable.tsx               — sharedCard 표시 영역 추가
```

### Anti-Patterns to Avoid

- **전체 GameEngine 리팩터링 금지:** `_dealCards`와 `_resolveShowdown`만 Strategy로 추출. 나머지 FSM 구조는 그대로 유지한다.
- **클라이언트에서 isDealer 조건으로 이벤트 emit 결정 금지:** 서버에서 권한 검증. 클라이언트는 UI 표시만 담당.
- **새 phase 추가 시 BETTING_PHASES 배열 미업데이트 금지:** `processBetAction`, `_updateEffectiveMaxBet`, `_isBettingComplete`가 모두 이 조건에 의존.
- **dealing-extra에서 다이한 플레이어에게 3번째 카드 배분 금지:** `isAlive === true`인 플레이어만 대상.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 족보 판정 | 세장섯다/한장공유 전용 평가 함수 | 기존 `evaluateHand(card1, card2)` | 이미 Phase 2에서 완성된 순수 함수 |
| 카드 비교 | 모드별 비교 로직 | 기존 `compareHands()` | 입력 카드만 다를 뿐 로직 동일 |
| 모달 20장 그리드 | SharedCard 전용 새 그리드 UI | `DealerSelectModal` 패턴 재사용 | 20장 그리드 UI + 뒷면/앞면 분기 이미 구현됨 |
| 베팅 완료 감지 | 신규 phase용 별도 감지 로직 | `_isBettingComplete()` 재사용 | 모든 베팅 phase에서 동일 조건 |
| 칩 정산 | 모드별 정산 로직 | 기존 `settleChips()` + `_resolveShowdown` 패턴 | 베팅/정산은 모드 무관 동일 (D-02) |

**핵심 인사이트:** 세장섯다와 한장공유는 **입력 카드 결정 방식만 다를 뿐** 족보 판정/베팅/정산 로직은 오리지날과 동일하다. Strategy가 해결하는 것은 "어떤 카드로 evaluateHand를 호출하느냐"이다.

---

## Common Pitfalls

### Pitfall 1: GameMode 타입명 불일치

**What goes wrong:** 기존 코드의 `GameMode`는 `'three-card' | 'shared-card'`를 이미 선언하고 있다. CONTEXT.md D-03은 `'sejang' | 'hanjang'`을 사용한다. 혼용하면 타입 오류 또는 런타임 분기 실패.
**Why it happens:** discuss-phase에서 논의된 이름과 기존 타입 정의가 독립적으로 작성됨.
**How to avoid:** Phase 7 시작 시 첫 번째 task로 통일 결정. **권장: 기존 `'three-card' | 'shared-card'` 유지** — 이미 타입에 정의되어 있으므로 변경 비용 없음. 서버/클라이언트 코드에서 `'sejang'`/`'hanjang'` 문자열을 쓰려면 타입도 함께 변경.
**Warning signs:** `Type '"sejang"' is not assignable to type 'GameMode'` 타입 오류.

### Pitfall 2: processBetAction의 phase 하드코딩

**What goes wrong:** `processBetAction`이 `phase !== 'betting'` 조건으로 `'betting-1'`/`'betting-2'`를 거부. 세장섯다에서 모든 베팅 액션이 INVALID_PHASE 오류로 실패.
**Why it happens:** 오리지날 모드만 고려하여 구현된 조건.
**How to avoid:** `BETTING_PHASES` 배열을 상수로 추출하고 `includes()` 체크로 교체. `_updateEffectiveMaxBet()`도 동일하게 수정.
**Warning signs:** 세장섯다 betting-1에서 bet-action 이벤트 전송 시 game-error 응답.

### Pitfall 3: dealing-extra 후 _bettingActed 초기화 누락

**What goes wrong:** betting-1에서 행동한 플레이어들의 `_bettingActed`가 betting-2 진입 시 초기화되지 않으면, betting-2가 즉시 완료로 판정됨.
**Why it happens:** `card-select` → `betting-2` 전환 시 `_bettingActed = new Set()` 호출을 빠뜨림.
**How to avoid:** `selectCards()`에서 모든 플레이어 선택 완료 → betting-2 전환 시 반드시 `_bettingActed = new Set()` + `currentBetAmount = 0` + `openingBettorSeatIndex` 재설정.
**Warning signs:** betting-2 phase 진입 즉시 showdown으로 스킵.

### Pitfall 4: 한장공유 sharedCard가 deck에 잔존

**What goes wrong:** `set-shared-card` 처리 시 `state.sharedCard`에만 저장하고 `state.deck`에서 제거하지 않으면, 딜링 시 플레이어에게 공유카드가 배분될 수 있음.
**Why it happens:** deck은 배분 시 shift()로 소비되므로, 공유카드 지정 시 deck에서 splice/filter로 제거해야 함.
**How to avoid:** `setSharedCard()` 구현 시 반드시 `this.state.deck = this.state.deck.filter((_, i) => i !== cardIndex)`.
**Warning signs:** 한장공유에서 어떤 플레이어가 공유카드와 동일한 카드를 손패로 받음.

### Pitfall 5: card-select phase에서 selectedCards 클라이언트 보안

**What goes wrong:** `selectedCards`가 GameState에 포함되어 브로드캐스트되면, 상대방이 내가 어떤 카드를 선택했는지 알 수 있음.
**Why it happens:** 현재 `game-state` 이벤트는 전체 GameState를 모든 클라이언트에게 동일하게 전송.
**How to avoid:** Phase 7 범위에서는 **단순 허용** — 3장 중 어느 2장을 선택했는지 상대가 알아도 족보는 모름. 추후 Phase 9 이후 정보 은닉 강화 고려.
**Warning signs:** (허용 범위 — Phase 7에서는 무시)

### Pitfall 6: 한장공유 _resolveShowdown에서 cards[0]만 사용

**What goes wrong:** 기존 `_resolveShowdown`은 `evaluateHand(p.cards[0], p.cards[1])`를 호출. 한장공유에서 `p.cards`는 1장 뿐이므로 `cards[1]`이 undefined → 런타임 오류.
**Why it happens:** 기존 쇼다운 로직이 항상 2장 가정.
**How to avoid:** `_resolveShowdownHanjang()` 별도 구현: `evaluateHand(p.cards[0], this.state.sharedCard!)`.
**Warning signs:** showdown phase에서 `Cannot read properties of undefined (reading 'rank')` 오류.

### Pitfall 7: shared-card-select phase가 GamePhase 타입에 없음

**What goes wrong:** `'shared-card-select'`를 `GamePhase` 유니온에 추가하지 않으면 TypeScript 오류 + 클라이언트 phase 감지 실패.
**Why it happens:** CONTEXT.md D-06에 명시된 4개 phase(`betting-1`, `dealing-extra`, `card-select`, `betting-2`)에 한장공유 전용 `'shared-card-select'`가 누락됨.
**How to avoid:** `GamePhase` 타입에 5개 신규 phase 모두 추가: `'betting-1' | 'dealing-extra' | 'card-select' | 'betting-2' | 'shared-card-select'`.
**Warning signs:** `selectMode`에서 `phase = 'shared-card-select'` 할당 시 TypeScript 오류.

---

## Code Examples

### 세장섯다 _dealExtraCard (서버 자동 처리)

```typescript
// game-engine.ts
private _dealExtraCardForSejang(): void {
  // betting-1 완료 직후 호출 — 생존자에게만 3번째 카드
  const alivePlayers = this.state.players.filter(p => p.isAlive);
  for (const player of alivePlayers) {
    const card = this.state.deck.shift();
    if (card) player.cards.push(card);
  }
  this.state.phase = 'card-select';
  this._updateChipBreakdowns();
  // currentPlayerIndex는 변경 없음 (card-select는 동시 선택)
}
```

### 세장섯다 _resolveShowdownSejang

```typescript
// game-engine.ts
private _resolveShowdownSejang(): void {
  const alivePlayers = this.state.players.filter(p => p.isAlive);

  // selectedCards가 없는 플레이어는 cards[0..1]로 fallback (안전망)
  const hands = alivePlayers.map(p => ({
    player: p,
    hand: evaluateHand(
      p.selectedCards?.[0] ?? p.cards[0],
      p.selectedCards?.[1] ?? p.cards[1],
    ),
  }));

  // 이후 로직은 기존 _resolveShowdown과 동일
  // (compareHands, gusa check, winnerId 설정, settleChips)
}
```

### 한장공유 deal (1장 배분)

```typescript
// HanjangModeStrategy or _dealCardsHanjang()
private _dealCardsHanjang(): void {
  const alivePlayers = this._getAlivePlayersInCounterClockwiseOrder(
    this.getDealerSeatIndex(),
    this.state.players.filter(p => p.isAlive),
  );

  // 1장씩만 배분 (sharedCard가 공용 두 번째 카드)
  for (const player of alivePlayers) {
    const card = this.state.deck.shift();
    if (card) player.cards.push(card);
  }

  this.state.phase = 'betting';
  const dealerSeatIndex = this.getDealerSeatIndex();
  this.state.currentPlayerIndex = dealerSeatIndex;
  this.state.openingBettorSeatIndex = dealerSeatIndex;
  this._updateChipBreakdowns();
  this._updateEffectiveMaxBet();
}
```

### SharedCardSelectModal (DealerSelectModal 기반)

```tsx
// SharedCardSelectModal.tsx
export function SharedCardSelectModal({ open, roomId }: { open: boolean; roomId: string }) {
  const { socket, gameState, myPlayerId } = useGameStore();

  const deck = gameState?.deck ?? [];
  const isDealer = gameState?.players.find(p => p.id === myPlayerId)?.isDealer ?? false;
  const hasSelected = gameState?.sharedCard !== undefined;

  const handleSelect = (cardIndex: number) => {
    if (!isDealer || hasSelected) return;
    socket?.emit('set-shared-card', { roomId, cardIndex });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>공유 카드 선택</DialogTitle>
          <DialogDescription>
            {isDealer
              ? '모든 플레이어와 공유할 카드를 선택하세요.'
              : '선 플레이어가 공유 카드를 선택 중입니다...'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Array.from({ length: 20 }, (_, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={!isDealer || hasSelected}
              className={cn(
                'rounded-md transition-opacity',
                (!isDealer || hasSelected) ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:ring-2 hover:ring-primary'
              )}
            >
              {isDealer ? (
                <CardFace card={deck[i]} />  // 딜러: 앞면 전체 공개
              ) : (
                <CardBack />  // 비딜러: 뒷면
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### GameTable 공유카드 표시 (한장공유)

```tsx
// GameTable.tsx 수정 — 중앙 팟 표시 옆에 sharedCard 추가
{gameState?.mode === 'shared-card' && gameState?.sharedCard && (
  <div className="mt-2 flex flex-col items-center gap-1">
    <p className="text-xs text-muted-foreground">공유 카드</p>
    <CardFace card={gameState.sharedCard} />
  </div>
)}
```

### HandPanel 카드 선택 모드

```tsx
// HandPanel.tsx 확장
export function HandPanel({ myPlayer, phase, onSelectCards }: HandPanelProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const isCardSelectMode = phase === 'card-select' && myPlayer?.isAlive && !myPlayer?.selectedCards?.length;

  const toggleCard = (idx: number) => {
    if (!isCardSelectMode) return;
    setSelectedIndices(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : prev.length < 2 ? [...prev, idx] : prev
    );
  };

  // 확인 버튼: selectedIndices.length === 2 일 때만 활성화
  // onSelectCards(selectedIndices) 호출 → socket emit select-cards
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 단일 'betting' phase | 'betting-1' / 'betting-2' 분리 | Phase 7 신규 | processBetAction phase 검사 로직 수정 필요 |
| _resolveShowdown(cards[0], cards[1]) | 모드별 dispatch | Phase 7 신규 | selectedCards / sharedCard 사용 |
| 딜링 단일 흐름 | mode별 분기 (2장/3장/1장) | Phase 7 신규 | _dealCards를 mode-aware로 변경 |

---

## Open Questions

1. **GameMode 타입명 통일**
   - What we know: 기존 타입에 `'three-card' | 'shared-card'` 존재. CONTEXT.md는 `'sejang' | 'hanjang'` 언급.
   - What's unclear: 어느 이름을 사용할 것인가?
   - Recommendation: **기존 `'three-card' | 'shared-card'` 유지**. 코드에서 이미 선언된 타입이므로 변경 비용 없음. 단, 클라이언트 display label은 "세장섯다" / "한장공유"로 자유롭게 사용 가능.

2. **betting-2에서 currentBetAmount 리셋 여부**
   - What we know: 세장섯다에서 betting-1과 betting-2는 독립적인 베팅 라운드.
   - What's unclear: betting-2 진입 시 currentBetAmount를 0으로 리셋할지, betting-1 누적액을 유지할지?
   - Recommendation: **0으로 리셋**. betting-2는 새 베팅 라운드이므로 모든 플레이어 currentBet도 0으로 초기화.

3. **한장공유 sharedCard 선택 후 즉시 shuffling vs 확인 절차**
   - What we know: DealerSelectModal에서는 선택 직후 확인 없이 바로 emit.
   - What's unclear: 공유카드 선택 후 "이 카드로 확정하시겠습니까?" 확인이 필요한가?
   - Recommendation: **확인 단계 없이 즉시 확정** (DealerSelectModal 패턴과 동일). 실수 방지가 필요하면 Claude's Discretion으로 처리.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 7은 기존 스택 내 코드/로직 변경만 포함. 외부 런타임/서비스 의존성 없음.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 3.x |
| Config file | `packages/server/vitest.config.ts` (확인됨), `packages/client/vite.config.ts` |
| Quick run command | `pnpm --filter @sutda/server test --run` |
| Full suite command | `pnpm -r test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODE-SJ-01 | 세장섯다 모드 선택 가능 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 |
| MODE-SJ-02 | 세장섯다 전체 플로우 (deal→bet1→extra→select→bet2→showdown) | integration | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 |
| MODE-SH-01 | 한장공유 모드 선택 가능 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 |
| MODE-SH-02 | 딜러의 공유카드 지정 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 |
| MODE-SH-03 | 1장 배분 + sharedCard 조합 족보 판정 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 |
| MODE-SH-04 | 베팅 후 승패 결정 | integration | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter @sutda/server test --run`
- **Per wave merge:** `pnpm -r test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/server/src/__tests__/game-engine-sejang.test.ts` — MODE-SJ-01, MODE-SJ-02
- [ ] `packages/server/src/__tests__/game-engine-hanjang.test.ts` — MODE-SH-01 ~ MODE-SH-04
- [ ] 기존 `packages/server/src/integration.test.ts`에 신규 phase 브로드캐스트 케이스 추가 필요

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md가 존재하지 않으므로 해당 없음. 대신 STATE.md에서 추출한 프로젝트 제약:

- **isDealer 클라이언트 조건 금지:** 클라이언트는 isDealer를 UI 표시에만 사용. 이벤트 emit 가부는 서버에서 검증.
- **set-player-id 패턴:** socket.data.playerId를 서버 권위 식별자로 사용. 클라이언트가 playerId를 직접 전달하지 않음.
- **서버 권위 원칙:** 모든 게임 상태는 서버에서 관리. 클라이언트는 렌더링만.
- **Tailwind v4:** `@apply border-border` 미지원. CSS 변수 직접 정의 방식 사용.
- **jsdom@24:** 클라이언트 테스트 환경 (v29 ESM 호환 문제로 다운그레이드됨).

---

## Sources

### Primary (HIGH confidence)

- 기존 코드베이스 직접 분석 — `packages/server/src/game-engine.ts`, `packages/shared/src/types/game.ts`, `packages/shared/src/types/protocol.ts`
- `.planning/phases/07-sejang-hanjang-modes/07-CONTEXT.md` — 결정 사항 D-01~D-15
- `.planning/REQUIREMENTS.md` — MODE-SJ-01/02, MODE-SH-01~04

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — 이전 phase 결정 사항 및 패턴
- 기존 모달 컴포넌트 분석 (DealerSelectModal, ModeSelectModal, HandPanel)

### Tertiary (LOW confidence)

- 없음

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 기존 스택 그대로 사용, 외부 라이브러리 추가 없음
- Architecture: HIGH — 기존 코드 직접 분석으로 패턴 확인됨
- Pitfalls: HIGH — 실제 코드에서 발견된 하드코딩 버그들 (processBetAction, _updateEffectiveMaxBet)

**Research date:** 2026-03-30
**Valid until:** Phase 7 완료 시 (코드베이스 변경에 따라 즉시 갱신 필요)
