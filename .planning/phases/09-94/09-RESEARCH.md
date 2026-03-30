# Phase 9: 특수 규칙 (땡값 + 94재경기) — Research

**Researched:** 2026-03-31
**Domain:** 게임 엔진 FSM 확장 — 땡값 정산 로직 + 구사 재경기 UX 상태 머신
**Confidence:** HIGH (전 코드베이스 직접 분석, 외부 라이브러리 의존 없음)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 적용 모드:** 땡값은 `'original'` 모드에서만 적용. 94재경기는 전 모드 공통.

**D-02 트리거 조건:** showdown 후 result phase 진입 시 자동 계산. 다이한 플레이어 중 땡 이상 보유자가 최종 승자에게 납부 (일땡~구땡: 500원, 장땡/광땡 3종: 1000원).

**D-03 땡값 면제 (RULE-04):** 최종 승자가 땡잡이(3+7) 또는 암행어사(열끗4+열끗7)로 승리한 경우 땡값 전액 면제. `compareHands` 결과의 `isSpecialBeater` 플래그로 판별.

**D-04 최후 생존 패배자 면제:** 다이하지 않고 최후까지 따라가서 패배한 플레이어는 납부 대상 아님. **다이한 플레이어만** 납부.

**D-05 UI 표시:** result phase에서 별도 "땡값 납부: X원" 항목 표기. 기존 pot 정산 표시와 구분된 섹션.

**D-06 구사 재경기 트리거 조건:**
- 일반 구사 재경기: 구사(열끗 아닌 4+9) 보유자 생존 + 생존자 최고패 **알리 이하**(score ≤ 60)
- 멍텅구리구사 재경기: 멍텅구리구사(열끗4+열끗9) 보유자 생존 + 생존자 최고패 **팔땡 이하**(score ≤ 1008)

**D-07 재경기 우선순위:**
- 일반 구사 + 동점: 구사 재경기 우선 (알리 이하에서는 동점 재경기 발생 불가)
- 멍텅구리구사 + 동점: 멍텅구리구사 재경기 우선
- 암행어사 엣지케이스: 암행어사 승리 시 구사 패 무시, 재경기 없음
- 땡잡이 엣지케이스: 땡잡이 승리 + 일반 구사 → 재경기 없음 / 땡잡이 승리 + 멍텅구리구사 → 재경기 트리거됨

**D-08 재참여 UX:** 15초 타임아웃 모달. 판돈 절반 금액 명시. 승낙 시 즉시 차감 + pot 증액. 거절/타임아웃 시 불참 처리.

**D-09 재경기 FSM:** 기존 `rematch-pending` 패턴 참고. 새 phase `'gusa-pending'` 추가. 모든 다이 플레이어 결정 완료 → 새 딜로 전환.

**D-10 재경기 중 칩 부족:** 플래너 재량.

### Claude's Discretion

- `gusa-pending` phase에서 15초 타임아웃 구현 방식 (서버 setTimeout vs 클라이언트 카운트다운)
- 재경기 선 결정 상세 (기존 선 유지 or 새 선 결정)
- 재참여 결제 시 칩 부족 플레이어 처리 (거절 처리 권장)
- 땡값 UI 컴포넌트 배치 (기존 result 화면 확장 vs 별도 섹션)

### Deferred Ideas (OUT OF SCOPE)

없음
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODE-OG-03 | 오리지날 모드에서만 땡값 규칙 적용 (다이한 땡 보유자 → 승자에게 일땡~구땡 500원, 광땡/장땡 1000원) | `settleChips()` 직후 `mode==='original'` 조건 분기 + `isAlive=false` 플레이어 순회 |
| RULE-01 | 구사(4+9) 보유자 생존 시 최고패 알리 이하이면 자동 재경기 트리거 | `checkGusaTrigger()` 이미 구현됨. `rematch-pending` 대신 `gusa-pending`으로 분기 |
| RULE-02 | 멍텅구리구사(열끗4+열끗9) 보유자 생존 시 최고패 팔땡 이하이면 자동 재경기 트리거 | 동일 함수 `isMeongtteongguriGusa` 브랜치 |
| RULE-03 | 재경기 시 다이한 플레이어가 판돈 절반 내고 재참여 가능 | `gusa-pending` phase 신규 구현 필요 |
| RULE-04 | 땡잡이/암행어사로 승리 시 땡값 없음 | `isSpecialBeater` 플래그로 판별, 이미 `HandResult`에 존재 |
</phase_requirements>

---

## 요약

Phase 9는 두 가지 독립적인 기능을 추가한다: **(1) 땡값 자동 정산** (오리지날 모드 한정)과 **(2) 구사/멍텅구리구사 94재경기** (전 모드 공통). 두 기능 모두 외부 라이브러리가 필요 없으며, 기존 `GameEngine`의 `settleChips()` 및 `_resolveShowdownOriginal()` 위에 얹히는 순수 로직이다.

**핵심 발견:** `checkGusaTrigger()` 함수와 `HandResult.isSpecialBeater` 플래그는 이미 구현되어 있다. 부재한 것은: (a) 구사 트리거 시 `rematch-pending` 대신 `gusa-pending`으로 전환하는 분기, (b) `gusa-pending` 상태에서 다이 플레이어의 재참여 결정을 수집하는 서버 로직, (c) 땡값 계산 및 칩 이전 로직, (d) 해당 UI 컴포넌트들이다.

**Primary recommendation:** `gusa-pending` phase를 `GamePhase` 타입에 추가하고, `settleChips()` 후 땡값 계산을 별도 `_settleTtaengValue()` 메서드로 분리하라.

---

## Standard Stack

### Core (외부 의존 없음 — 기존 스택 그대로)

| 구성 요소 | 버전 | 목적 | 비고 |
|----------|------|------|------|
| TypeScript + pnpm workspaces | 기존 | 모노레포 | 변경 없음 |
| Socket.IO | 기존 | 실시간 상태 동기화 | 소켓 이벤트 2개 추가 필요 |
| React + Vite | 기존 | 클라이언트 UI | 모달 컴포넌트 1개 추가 |
| Vitest | 기존 | 테스트 | `packages/server/src/game-engine.test.ts` 확장 |

**신규 패키지 없음** — Phase 9는 순수 비즈니스 로직 확장이다.

---

## Architecture Patterns

### 현재 FSM 흐름 (관련 부분)

```
betting → showdown → _resolveShowdownOriginal()
  ├─ 구사 트리거? → rematch-pending (현재: 기존 로직)
  ├─ 동점?        → rematch-pending
  └─ 승자 결정    → settleChips() → result
```

### 변경 후 FSM 흐름

```
betting → showdown → _resolveShowdownOriginal()
  ├─ 구사 트리거?     → gusa-pending (새 phase)
  ├─ 동점?            → rematch-pending (기존 유지)
  └─ 승자 결정        → settleChips()
                        → _settleTtaengValue() (original 모드 + 비특수패 승리 시)
                        → result

gusa-pending:
  다이 플레이어들이 각각 재참여/거절 결정
  → 모두 결정 완료 → startGusaRematch() → shuffling
```

### Pattern 1: 땡값 정산 (`_settleTtaengValue`)

**What:** `settleChips()` 직후 호출되는 순수 함수. 오리지날 모드 + 승자 패가 `isSpecialBeater=false`일 때만 실행.

**When to use:** `_resolveShowdownOriginal()` 및 `_resolveShowdownSejang()` 등 모든 쇼다운 최종 승자 결정 시 — 단 `mode === 'original'`인 경우에만.

**구현 패턴:**
```typescript
// packages/server/src/game-engine.ts
private _settleTtaengValue(): void {
  if (this.state.mode !== 'original') return;
  if (!this.state.winnerId) return;

  const winner = this.state.players.find(p => p.id === this.state.winnerId);
  if (!winner) return;

  // 승자의 패 평가 (isSpecialBeater 확인)
  const winnerHand = evaluateHand(winner.cards[0]!, winner.cards[1]!);
  if (winnerHand.isSpecialBeater) return;  // D-03: 땡잡이/암행어사 승리 시 면제

  let totalTtaengValue = 0;
  const ttaengPayments: TtaengPayment[] = [];  // UI 표시용

  // 다이한 플레이어 중 땡 이상 보유자 계산
  for (const player of this.state.players) {
    if (player.isAlive) continue;  // D-04: 생존 패배자 면제
    if (player.cards.length < 2) continue;
    const hand = evaluateHand(player.cards[0]!, player.cards[1]!);
    const amount = getTtaengValueAmount(hand);
    if (amount > 0) {
      player.chips -= amount;
      totalTtaengValue += amount;
      ttaengPayments.push({ playerId: player.id, amount });
    }
  }

  if (totalTtaengValue > 0) {
    winner.chips += totalTtaengValue;
    this.state.ttaengPayments = ttaengPayments;  // GameState에 추가 필요
    this._updateChipBreakdowns();
  }
}

// 땡값 금액 계산 헬퍼
function getTtaengValueAmount(hand: HandResult): number {
  // 광땡 3종 (score 1100~1300) 및 장땡 (score 1010): 1000원
  if (hand.score >= 1010) return 1000;
  // 일땡~구땡 (score 1001~1009): 500원
  if (hand.score >= 1001) return 500;
  return 0;
}
```

**주의:** `player.cards`는 `(Card | null)[]` 타입. 인디언 모드 마스킹 때문. 오리지날 모드에서는 항상 실제 카드이므로 `!` assertion 가능.

### Pattern 2: `gusa-pending` 상태 관리

**What:** 구사 재경기 트리거 시 `rematch-pending` 대신 `gusa-pending`으로 전환. 다이 플레이어들의 재참여 결정을 서버가 수집.

**기존 `rematch-pending`과의 차이점:**

| 항목 | rematch-pending | gusa-pending |
|------|----------------|-------------|
| 트리거 | 동점 | 구사/멍텅구리구사 조건 충족 |
| 대상 플레이어 | 동점자 | 전체 (생존자 + 다이 플레이어) |
| 재참여 결정 | 없음 | 다이 플레이어가 각각 승낙/거절 |
| 판돈 변화 | 유지 | 재참여자 → 판돈 절반 납부 후 pot 증가 |
| 다음 phase | shuffling (오리지날 모드 강제) | shuffling (기존 모드 유지) |

**GameState 필드 추가 필요:**
```typescript
// packages/shared/src/types/game.ts에 추가
gusaPendingDecisions?: Record<string, boolean | null>;  // playerId → 재참여 결정 (null=미결정)
ttaengPayments?: { playerId: string; amount: number }[];  // 땡값 납부 내역 (result 표시용)
```

**서버 소켓 이벤트 추가:**
```typescript
// protocol.ts ClientToServerEvents에 추가
'gusa-rejoin': (data: { roomId: string; join: boolean }) => void;
```

**서버 핸들러 패턴 (index.ts):**
```typescript
socket.on('gusa-rejoin', ({ roomId, join }) => {
  handleGameAction(socket, roomId, () => {
    const engine = getEngine(roomId);
    engine.recordGusaRejoinDecision(socket.data.playerId, join);
  });
});
```

### Pattern 3: 타임아웃 구현 (Claude's Discretion)

**권장 방식: 클라이언트 카운트다운 + 서버 타임아웃 백업**

이유:
- 기존 `RechargeVoteModal.tsx`, `ResultScreen.tsx`의 자동 카운트다운 패턴이 이미 클라이언트 측 `setTimeout` + React `useEffect`로 구현되어 있음 (`countdown` state 패턴)
- 서버 `setTimeout`은 방 정리 시 메모리 누수 가능성이 있고 현재 GameEngine에는 해당 패턴 없음
- 클라이언트가 15초 후 자동으로 `gusa-rejoin: { join: false }` emit
- 서버는 타임아웃 없이 모든 플레이어 결정 수집 후 전환

**클라이언트 모달 패턴 (기존 `RechargeVoteModal`과 동일 구조):**
```tsx
// packages/client/src/components/modals/GusaRejoinModal.tsx
const [countdown, setCountdown] = useState(15);

useEffect(() => {
  if (countdown <= 0) {
    socket?.emit('gusa-rejoin', { roomId, join: false });
    return;
  }
  const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
  return () => clearTimeout(timer);
}, [countdown]);
```

### Pattern 4: `_resolveShowdownOriginal()` 분기 로직 수정

**현재 코드:** 구사 트리거 시 `this.state.phase = 'rematch-pending'`으로 무조건 전환.

**변경 후 분기:**
```typescript
if (shouldRedeal) {
  // 구사 재경기: gusa-pending으로 전환 (rematch-pending 아님)
  this.state.phase = 'gusa-pending';
  this.state.tiedPlayerIds = alivePlayers.map(p => p.id);  // 생존자 목록 재활용
  this.state.rematchDealerId = player.id;  // 구사 보유자가 재경기 선
  // 다이 플레이어들의 결정을 수집할 Map 초기화
  const diedPlayers = this.state.players.filter(p => !p.isAlive);
  this.state.gusaPendingDecisions = Object.fromEntries(
    diedPlayers.map(p => [p.id, null])  // null = 미결정
  );
  return;
}
```

**이 변경은 3개 showdown 메서드 모두에 적용:**
1. `_resolveShowdownOriginal()`
2. `_resolveShowdownSejang()`
3. `_resolveShowdownHanjang()` (한장공유)

(골라골라, 인디언은 `_resolveShowdownOriginal()`에 위임하므로 자동 포함)

### Anti-Patterns to Avoid

- **`rematch-pending`에 구사 재참여 로직 혼용 금지:** 기존 동점 재경기 흐름을 건드리지 말 것. `gusa-pending`은 완전히 별도 phase.
- **`startRematch()` 수정 금지:** 기존 동점 재경기 로직은 변경 없음. 구사 재경기는 별도 `startGusaRematch()` 메서드.
- **클라이언트에서 칩 계산 금지:** 땡값 계산은 서버에서만. 클라이언트는 `GameState.ttaengPayments`를 읽어 표시만 함.
- **`isSpecialBeater` 없이 hand 타입 직접 비교 금지:** `hand.handType === 'kkut'` 식의 비교 대신 기존 `isSpecialBeater` 플래그 사용.

---

## Don't Hand-Roll

| 문제 | 직접 만들지 말 것 | 사용할 것 | 이유 |
|------|-----------------|----------|------|
| 구사 트리거 조건 판단 | 조건 로직 직접 작성 | `checkGusaTrigger()` (기존) | 이미 구현됨, score 임계값 정확히 설정됨 |
| 땡잡이/암행어사 판별 | `handType` 직접 비교 | `hand.isSpecialBeater` 플래그 | Phase 2 결정 — 구별은 `score=0/1` |
| 땡 score 계산 | 별도 점수 체계 | 기존 score 체계 (일땡=1001, 장땡=1010, 광땡≥1100) | 이미 확정된 score 체계 |
| 15초 타임아웃 | 서버 setTimeout | 클라이언트 `useEffect` countdown 패턴 | 기존 `ResultScreen`, `RechargeVoteModal` 패턴 일관성 |
| 칩 breakdown 재계산 | 수동 계산 | `_updateChipBreakdowns()` (기존) | 땡값 차감 후 반드시 호출 필요 |

---

## Common Pitfalls

### Pitfall 1: 구사 트리거 + 땡잡이 엣지케이스 (D-07)

**What goes wrong:** 땡잡이가 구땡을 이긴 상황 + 일반 구사 보유자 존재 → 잘못하면 구사 재경기를 트리거함.

**Why it happens:** `_resolveShowdownOriginal()`에서 승자 결정 전에 구사 체크를 먼저 하기 때문에, 땡잡이 승자와 무관하게 구사 트리거 조건이 충족되면 재경기로 가버릴 수 있음.

**How to avoid:** 구사 체크 시 승자 패가 `isSpecialBeater`인지 먼저 확인:
```typescript
// 땡잡이/암행어사 승리 시 구사 재경기 면제 (D-07)
const winnerHand = evaluateHand(winner.cards[0]!, winner.cards[1]!);
if (winnerHand.isSpecialBeater) {
  // 단, 멍텅구리구사는 땡잡이 예외 없음 (D-07 명시)
  if (!gusaHand.isMeongtteongguriGusa) {
    // 구사 재경기 트리거 안 함
  }
}
```

**단, 세부 규칙 (D-07):**
- 땡잡이 + 일반 구사 → 재경기 없음 (땡잡이가 구땡 이하를 이기므로 조건 불충족)
- 땡잡이 + 멍텅구리구사 → 재경기 트리거 (땡잡이 승리는 팔땡 이하 조건 충족)
- 암행어사 + 구사/멍텅구리구사 → 재경기 없음 (암행어사 승리가 최종)

**Warning signs:** 테스트에서 땡잡이 승리 후 phase가 `gusa-pending`이 되면 버그.

### Pitfall 2: 모든 쇼다운 메서드에 구사 분기 미적용

**What goes wrong:** `_resolveShowdownOriginal()`만 수정하고 `_resolveShowdownSejang()`, `_resolveShowdownHanjang()`는 누락.

**Why it happens:** 3개의 showdown 메서드가 거의 동일한 구사 체크 코드를 복붙하고 있어서, 하나만 수정하기 쉬움.

**How to avoid:** `rematch-pending` → `gusa-pending` 분기 변경을 3개 메서드 모두에 적용. 골라골라/인디언은 `_resolveShowdownOriginal()`에 위임하므로 자동 포함.

### Pitfall 3: `ttaengPayments` GameState 필드 — result 이후 초기화 타이밍

**What goes wrong:** `nextRound()`에서 `ttaengPayments`를 초기화하지 않으면 이전 판의 땡값이 다음 판 result 화면에 표시됨.

**How to avoid:** `nextRound()` 리셋 블록에 `this.state.ttaengPayments = undefined;` 추가.

### Pitfall 4: 다이 플레이어 카드 접근 (Card | null)[]

**What goes wrong:** 다이한 플레이어의 `player.cards[0]` 접근 시 `null`일 수 있음 (인디언 모드 마스킹 흔적). 오리지날 모드라도 getStateFor()가 null로 마스킹한 경우가 있음.

**How to avoid:** `evaluateHand(player.cards[0]!, player.cards[1]!)` 전에 `cards[0] !== null && cards[1] !== null` 체크. 서버 내부 로직에서는 마스킹되지 않은 원본 state를 사용하므로 실제로는 null이 아니지만, 방어적으로 처리.

### Pitfall 5: `gusaPendingDecisions` 수집 완료 판단 조건

**What goes wrong:** 다이한 플레이어가 없는 경우(전원 생존) `gusaPendingDecisions`가 빈 객체 `{}`가 되어 즉시 완료로 처리해야 하는데, 대기 상태가 지속될 수 있음.

**How to avoid:** `recordGusaRejoinDecision()` 또는 `gusa-pending` 진입 시, 다이한 플레이어가 0명이면 즉시 `startGusaRematch()` 호출.

---

## Code Examples

### 기존 settleChips (변경 전)
```typescript
// Source: packages/server/src/game-engine.ts, line 193
private settleChips(): void {
  if (!this.state.winnerId) return;
  const winner = this.state.players.find(p => p.id === this.state.winnerId);
  if (winner) {
    winner.chips += this.state.pot;
  }
  this._updateChipBreakdowns();
}
```

### 기존 checkGusaTrigger (변경 없음)
```typescript
// Source: packages/shared/src/hand/gusa.ts
export function checkGusaTrigger(
  gusaHand: HandResult,
  allSurvivingHands: HandResult[],
): { shouldRedeal: boolean }
// 일반 구사: maxScore <= 60 (알리 score)
// 멍텅구리구사: maxScore <= 1008 (팔땡 score)
```

### 기존 rematch-pending 분기 (참조용 — gusa-pending에서 달라지는 부분)
```typescript
// Source: packages/server/src/game-engine.ts, line 1242-1252
for (const { player, hand } of hands) {
  if (hand.isGusa || hand.isMeongtteongguriGusa) {
    const { shouldRedeal } = checkGusaTrigger(hand, allHands);
    if (shouldRedeal) {
      this.state.phase = 'rematch-pending';  // ← Phase 9에서 'gusa-pending'으로 변경
      this.state.tiedPlayerIds = alivePlayers.map(p => p.id);
      this.state.rematchDealerId = player.id;
      return;
    }
  }
}
```

### 기존 startRematch (참조용 — gusa rematch는 별도 메서드)
```typescript
// Source: packages/server/src/game-engine.ts, line 1395
startRematch(): void {
  // 동점 재경기 전용 — 변경하지 않음
  // ...
  this.state.mode = 'original';  // ← 주의: rematch는 항상 original로 강제됨
  this.state.phase = 'shuffling';
}
```

**중요:** 구사 재경기(`startGusaRematch()`)는 기존 모드를 유지해야 함 (전 모드 공통). `startRematch()`처럼 `mode = 'original'`로 강제하지 말 것.

### 기존 클라이언트 rematch-pending 처리 (RoomPage.tsx)
```tsx
// Source: packages/client/src/pages/RoomPage.tsx, line 362-378
if (phase === 'rematch-pending') {
  return (
    <div>
      <h2>동점!</h2>
      <Button onClick={() => socket?.emit('start-rematch', { roomId })}>재경기 시작</Button>
    </div>
  );
}
// gusa-pending은 이 분기와 별개로 추가
```

### 기존 result 화면 칩 델타 계산 (ResultScreen.tsx)
```tsx
// Source: packages/client/src/components/layout/ResultScreen.tsx, line 113-118
const chipDelta = isWinner
  ? gameState.pot - player.currentBet - ante
  : -(player.currentBet + ante);
// 땡값은 이 계산과 별도 섹션으로 표시 (D-05)
// ttaengPayments에서 읽어 추가 렌더
```

---

## State of the Art

| 기존 동작 | Phase 9 이후 | 변경 지점 |
|-----------|-------------|---------|
| 구사 트리거 → `rematch-pending` (버튼 클릭으로 즉시 재경기) | 구사 트리거 → `gusa-pending` (다이 플레이어 결정 수집) | `_resolveShowdownOriginal/Sejang/Hanjang()` |
| `settleChips()` 후 바로 `result` | 오리지날 모드에서 `_settleTtaengValue()` 추가 실행 | `settleChips()` 직후 조건 분기 |
| result 화면에 pot 정산만 표시 | result 화면에 땡값 납부 내역 추가 섹션 표시 | `ResultScreen.tsx` |
| `startRematch()`가 모드를 `'original'`로 강제 | 구사 재경기(`startGusaRematch()`)는 기존 모드 유지 | 별도 메서드 |

**현재 코드에서 구사 재경기가 `rematch-pending`으로 처리되는 것은 Phase 9 이전 임시 동작이었음.** CONTEXT.md D-09에 명시된 대로 `gusa-pending` phase 분리가 필요하다.

---

## Open Questions

1. **재경기 선 결정: 기존 선 유지 vs 구사 보유자**
   - What we know: CONTEXT.md D-09에서 "구사패를 가지고 있던 플레이어가 선"으로 명시 (Phase 설명 Success Criteria 2, 3번)
   - What's unclear: `rematchDealerId`가 이미 구사 보유자로 설정되어 있어 `startGusaRematch()`에서 그대로 사용하면 됨
   - Recommendation: `rematchDealerId` 그대로 사용. 별도 처리 불필요.

2. **칩 부족 재참여 처리 (D-10, Claude's Discretion)**
   - What we know: 판돈 절반이 잔액보다 많은 경우
   - Recommendation: **거절 처리** (all-in 허용보다 단순하고 기존 칩 체계와 일관성). 모달에 "잔액 부족으로 참여 불가" 표시.

3. **`gusaPendingDecisions`에서 생존자 처리**
   - What we know: 생존자는 재참여 결정 없음 — 자동 참여
   - Recommendation: `gusaPendingDecisions`는 다이한 플레이어만 포함. 생존자는 항상 참여로 처리.

---

## Environment Availability

Step 2.6: SKIPPED (외부 의존 없는 순수 로직/UI 확장)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | `packages/server/vitest.config.ts` |
| Quick run command | `pnpm --filter @sutda/server test --run` |
| Full suite command | `pnpm --filter @sutda/server test --run && pnpm --filter @sutda/shared test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODE-OG-03 | 오리지날 모드에서 다이한 땡 보유자가 승자에게 500/1000원 지불 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ✅ (확장 필요) |
| MODE-OG-03 | 세장/한장공유/골라골라/인디언 모드에서 땡값 없음 | unit | 동일 | ✅ (확장 필요) |
| RULE-01 | 구사 + 알리 이하 → `gusa-pending` phase로 전환 | unit | 동일 | ✅ (확장 필요) |
| RULE-02 | 멍텅구리구사 + 팔땡 이하 → `gusa-pending` | unit | 동일 | ✅ (확장 필요) |
| RULE-03 | `gusa-rejoin: true` → pot 증가 + 플레이어 isAlive 복원 | unit | 동일 | ❌ Wave 0 |
| RULE-03 | 모든 결정 수집 완료 → `shuffling` phase로 전환 | unit | 동일 | ❌ Wave 0 |
| RULE-04 | 땡잡이 승리 → 땡값 없음 | unit | 동일 | ✅ (확장 필요) |
| RULE-04 | 암행어사 승리 → 땡값 없음 | unit | 동일 | ✅ (확장 필요) |
| D-07 | 땡잡이 + 일반 구사 → `gusa-pending` 없음 | unit | 동일 | ❌ Wave 0 |
| D-07 | 땡잡이 + 멍텅구리구사 → `gusa-pending` 트리거됨 | unit | 동일 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @sutda/server test --run`
- **Per wave merge:** `pnpm --filter @sutda/server test --run && pnpm --filter @sutda/shared test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `game-engine.test.ts` 내 `gusa-pending` 관련 describe 블록 — RULE-03, D-07 커버
- [ ] `GamePhase` 타입에 `'gusa-pending'` 추가 (Wave 0 공유 타입 변경)
- [ ] `GameState`에 `gusaPendingDecisions`, `ttaengPayments` 필드 추가

---

## Sources

### Primary (HIGH confidence)

- 코드 직접 분석: `packages/server/src/game-engine.ts` — FSM 흐름, settleChips, startRematch, _resolveShowdownOriginal
- 코드 직접 분석: `packages/shared/src/hand/gusa.ts` — checkGusaTrigger 구현 및 score 임계값
- 코드 직접 분석: `packages/shared/src/hand/compare.ts` — isSpecialBeater 기반 비교 로직
- 코드 직접 분석: `packages/shared/src/types/game.ts` — GamePhase, GameState 타입
- 코드 직접 분석: `packages/shared/src/types/hand.ts` — HandResult, score 체계
- 코드 직접 분석: `packages/client/src/components/layout/ResultScreen.tsx` — 칩 델타 표시 패턴
- 코드 직접 분석: `packages/client/src/pages/RoomPage.tsx` — rematch-pending 클라이언트 처리 패턴
- 코드 직접 분석: `packages/shared/src/types/protocol.ts` — 소켓 이벤트 타입 정의

### Secondary (MEDIUM confidence)

- `rule_draft.md` — 하우스룰 원본 (CONTEXT.md의 결정과 일치 확인)
- `.planning/STATE.md` → Phase 2 결정 항목 — `isSpecialBeater` 패턴, score 체계

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 외부 의존 없음, 모두 기존 코드 분석
- Architecture: HIGH — FSM 분기 패턴을 기존 코드에서 직접 확인
- Pitfalls: HIGH — 실제 코드에서 발견한 엣지케이스 기반

**Research date:** 2026-03-31
**Valid until:** 이 codebase가 변경되지 않는 한 무기한 유효
