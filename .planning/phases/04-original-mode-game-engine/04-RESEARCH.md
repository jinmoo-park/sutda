# Phase 4: 오리지날 모드 게임 엔진 - Research

**Researched:** 2026-03-29
**Domain:** 서버사이드 유한 상태 기계(FSM) + 카드게임 플로우 엔진 (TypeScript / Node.js)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 클래스 기반 GameEngine으로 구현한다. 기존 RoomManager와 동일한 방식(방식 A)으로 상태를 직접 수정. 코드 일관성 확보.
- **D-02:** 매 판 시작 시 각 플레이어가 500원 앤티를 낸다. 이를 "학교 간다"라고 부른다.
- **D-03:** 자동 차감이 아닌 "등교" 버튼을 통해 플레이어가 직접 액션을 취해야 한다.
- **D-04:** 등교하지 않은 플레이어는 패를 받지 못한다 (해당 판 자동 불참).
- **D-05:** 첫 판 선 결정 시 20장 카드가 모두 뒤집힌 채로 보드에 깔린다. 각 플레이어가 한 장씩 선택하여 숫자를 확인하고, 시간대 규칙(18:00~05:59 낮은 숫자 우선 / 06:00~17:59 높은 숫자 우선)에 따라 선이 결정된다.
- **D-06:** 20장 보드 인터랙션 컴포넌트는 후회의섯다(Phase 7)에서도 재사용할 수 있도록 범용성을 고려하여 설계한다.
- **D-07:** 이후 판은 직전 판 승자가 자동으로 선이 된다 (인터랙션 없음).
- **D-08:** 왼쪽 플레이어가 기리 또는 퉁을 선택할 수 있다.
- **D-09:** 기리 선택 시: 더미의 어느 위치에서 자를지 직접 선택할 수 있고, 분할된 더미들을 원하는 순서로 재조립할 수 있다 (단순 이분할이 아닌 복수 분할 + 재조립 지원).
- **D-10:** 퉁 선언 시: 더미 재조립 없이 위에서부터 두 장씩 배분한다 (DECK-05).
- **D-11:** 일반 배분: 선의 오른쪽부터 반시계 방향, 한 장씩, 모든 플레이어가 2장 받을 때까지 (선이 마지막) (DECK-04).
- **D-12:** 퉁 배분: 오른쪽부터 반시계 방향, 두 장씩 한 번에 배분 (DECK-05).
- **D-13:** 콜 계산: `currentBetAmount - player.currentBet` = 더 내야 할 금액.
- **D-14:** 레이즈: 콜 금액을 먼저 맞추고, 추가 금액을 자유롭게 입력한다.
- **D-15:** 다이: 패 포기, 이후 베팅 제외. 단 땡 보유 시 땡값 대상이 될 수 있음 (Phase 9에서 처리).
- **D-16:** 베팅 종료 조건: 모든 생존 플레이어의 `currentBet`이 `currentBetAmount`와 같아지면 자동 종료 (BET-06).
- **D-17:** 베팅 순서: 선 플레이어 기준 반시계 방향 (BET-05).
- **D-18:** 자동 공개 없음. 각 생존 플레이어가 "공개" 버튼을 눌러야 자신의 패가 공개된다.
- **D-19:** 모든 생존자가 공개 완료한 시점에 승패 판정이 실행된다.
- **D-20:** Phase 4에서는 팟(`pot`) 누적 추적까지만 담당한다. 실제 칩 차감/승자 정산은 Phase 5에서 처리한다.

### Claude's Discretion
- GameEngine 내부 상태 전환 유효성 검증 방식 (예: 잘못된 phase에서 액션 시도 시 처리)
- 기리 시 더미 복수 분할의 최대 분할 수 (UX 고려하여 결정)
- 베팅 라운드 시작 시 초기 `currentBetAmount` 값 (등교 500원을 기준으로 할지 0으로 시작할지)

### Deferred Ideas (OUT OF SCOPE)
- 땡값 처리 (다이한 땡 보유자 → 승자에게 자동 지불) — Phase 9 범위
- 구사/멍텅구리구사 재경기 트리거 — Phase 9 범위
- 칩 실제 차감 및 승자 정산 — Phase 5 범위
- 베팅 UI (콜/레이즈/다이 버튼, 금액 입력) — Phase 6 범위
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEAT-02 | 첫 판은 밤일낮장 규칙으로 선 플레이어를 결정한다 (서울 기준 18:00~05:59 낮은 숫자, 06:00~17:59 높은 숫자) | D-05: 20장 카드 보드 인터랙션으로 구현. `new Date().getHours()` 서버 시간 기준 판정 |
| SEAT-03 | 이후 판은 이전 판 승자가 선이 된다 | D-07: 승자 playerIndex를 GameState에 저장하여 다음 라운드 자동 적용 |
| DECK-02 | 선 플레이어가 셔플을 실행할 수 있다 | Fisher-Yates 셔플 알고리즘. 서버에서 실행 후 결과 브로드캐스트 |
| DECK-03 | 왼쪽 플레이어에게 기리를 요청하면 해당 플레이어가 더미 순서를 변경하거나 퉁을 선언할 수 있다 | D-08~D-10: `cut(positions[])` 액션으로 복수 분할 + 재조립 지원 |
| DECK-04 | 일반 배분: 선의 오른쪽 플레이어부터 반시계 방향으로 한 장씩, 모든 플레이어가 2장 받을 때까지 | D-11: `dealNormal()` — seatIndex 계산으로 반시계 순서 결정 |
| DECK-05 | 퉁 선언 시: 오른쪽 플레이어부터 반시계 방향으로 2장씩 한 번에 배분 | D-10: `dealTtong()` — 2장 묶음 배분 |
| MODE-OG-01 | 선 플레이어가 게임 시작 전 "오리지날" 모드를 선택할 수 있다 | `GameMode = 'original'` 타입 이미 정의됨. GameEngine 초기화 시 모드 설정 |
| MODE-OG-02 | 2장 배분 → 베팅 → 족보 비교 → 승패 결정의 기본 플로우가 작동한다 | GameEngine FSM: dealing → betting → showdown → result 전환 |
| BET-01 | 각 플레이어는 자신의 턴에 콜 / 레이즈 / 다이 중 하나를 선택할 수 있다 | D-13~D-15: `processAction()` 메서드로 단일 진입점 처리 |
| BET-02 | 콜은 현재 최고 베팅액과 동일한 금액을 낸다 | D-13: `callAmount = currentBetAmount - player.currentBet` |
| BET-03 | 레이즈는 현재 최고 베팅액을 콜한 뒤 추가 금액(자유 입력)을 올린다 | D-14: `raise(amount)` — 콜 먼저 + 추가금 |
| BET-04 | 다이는 패를 포기하며 해당 판의 베팅에서 제외된다 | `player.isAlive = false` |
| BET-05 | 베팅 순서는 선 플레이어 기준 반시계 방향이다 | D-17: `getNextBettingPlayer()` — seatIndex 기반 반시계 순서 |
| BET-06 | 모든 생존 플레이어의 베팅액이 같아지면 베팅이 종료된다 | D-16: 매 액션 후 `checkBettingComplete()` 호출 |
</phase_requirements>

---

## 요약

Phase 4는 신규 라이브러리를 도입하지 않는다. 이미 구축된 `@sutda/shared` 타입 시스템과 `RoomManager` 패턴 위에 `GameEngine` 클래스를 추가하는 작업이다. 의존 코드(`createDeck`, `evaluateHand`, `compareHands`)가 모두 준비되어 있어 플로우 조립에 집중할 수 있다.

핵심 기술 과제는 두 가지다. 첫째, `GamePhase` 열거값 전환의 단방향 보장 (FSM 유효성 검증). 둘째, 반시계 방향 순서 계산 — `seatIndex`를 기준으로 `(dealerIndex + totalPlayers - 1 - i) % totalPlayers` 패턴을 사용한다. 기리(더미 컷)는 배열 슬라이스 재조립으로 구현하며 복잡도가 낮다.

Socket.IO 이벤트 계약 확장이 필요하다. `ClientToServerEvents`에 게임 진행 액션(shuffle, cut, attend-school, reveal, bet-action 등), `ServerToClientEvents`에 게임 상태 브로드캐스트를 추가해야 한다.

**Primary recommendation:** `GameEngine` 클래스를 `packages/server/src/game-engine.ts`에 작성하고, `RoomManager.startGame()` 호출 후 인스턴스를 Map에 저장해 Socket.IO 핸들러와 연결한다.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.7 | 타입 안전 FSM 구현 | 프로젝트 전체 채택, strict mode |
| Socket.IO | ^4.8.3 | 서버→클라이언트 실시간 이벤트 브로드캐스트 | Phase 3에서 확립된 패턴 |
| vitest | ^3 | 게임 엔진 단위 테스트 | Phase 1~3 전체 동일 사용 |
| `@sutda/shared` | workspace:* | Card, GameState, HandResult 타입 + compareHands | 이미 구축됨 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crypto.randomUUID()` | Node.js 내장 | 판/라운드 고유 ID | 필요시 사용 |
| `Date` | JavaScript 내장 | 밤일낮장 시간대 판정 | 첫 판 선 결정 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 직접 FSM 구현 | XState | XState는 강력하지만 오버엔지니어링. 6단계 선형 플로우에는 switch/enum으로 충분 |
| 서버 시간 (`new Date()`) | 클라이언트 시간 | 클라이언트 시간은 신뢰 불가. 서버 권위 모델에 따라 서버 시간 사용 |

**설치 불필요:** 신규 패키지 없음. 기존 의존성만 사용.

---

## Architecture Patterns

### 권장 파일 구조

```
packages/server/src/
├── game-engine.ts           # GameEngine 클래스 (FSM 핵심)
├── game-engine.test.ts      # 단위 테스트
├── room-manager.ts          # 기존 (수정 없음)
└── index.ts                 # Socket.IO 핸들러 확장 (게임 이벤트 추가)

packages/shared/src/
├── types/
│   ├── game.ts              # GameState, GamePhase (확장 필요)
│   └── protocol.ts          # 게임 진행 이벤트 추가 필요
└── hand/
    └── compare.ts           # 기존 (수정 없음)
```

### Pattern 1: 클래스 기반 FSM (RoomManager 동일 패턴)

**What:** GameEngine 클래스가 GameState를 내부 필드로 보유하고 직접 변경. 메서드가 곧 액션.

**When to use:** D-01 결정에 따라 항상 사용.

```typescript
// packages/server/src/game-engine.ts
export class GameEngine {
  private state: GameState;

  constructor(roomId: string, players: RoomPlayer[], mode: GameMode) {
    this.state = {
      roomId,
      phase: 'mode-select',
      mode,
      players: players.map((p, i) => ({
        id: p.id,
        nickname: p.nickname,
        chips: p.chips,
        cards: [],
        isAlive: true,
        isRevealed: false,
        currentBet: 0,
        isDealer: false,
        seatIndex: i,
      })),
      pot: 0,
      currentPlayerIndex: 0,
      currentBetAmount: 0,
      roundNumber: 1,
    };
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  // 각 GamePhase에 대응하는 액션 메서드
  attendSchool(playerId: string): void { /* ... */ }
  shuffle(playerId: string): void { /* ... */ }
  cut(playerId: string, segments: number[][]): void { /* ... */ }
  declareTtong(playerId: string): void { /* ... */ }
  processBetAction(playerId: string, action: BetAction): void { /* ... */ }
  revealCard(playerId: string): void { /* ... */ }
}
```

### Pattern 2: 반시계 방향 배분 순서 계산

**What:** `seatIndex` 기준으로 선(dealer)의 오른쪽부터 반시계 방향 순서 배열 생성.

**When to use:** `dealNormal()`, `dealTtong()`, 베팅 순서 계산에 항상 사용.

```typescript
// 선(dealer)의 오른쪽부터 반시계 방향, 선이 마지막
function getCounterClockwiseOrder(
  dealerSeatIndex: number,
  totalPlayers: number
): number[] {
  const order: number[] = [];
  for (let i = 1; i <= totalPlayers; i++) {
    // +1: 오른쪽 시작, -1씩: 반시계, 마지막이 dealer
    order.push((dealerSeatIndex - i + totalPlayers) % totalPlayers);
  }
  return order;
  // 예: dealer=0, 4명 → [3, 2, 1, 0]
  // 예: dealer=2, 4명 → [1, 0, 3, 2]
}
```

### Pattern 3: 기리 (더미 컷 재조립)

**What:** 셔플된 덱 배열을 여러 지점에서 분할하고 순서를 재조립.

**When to use:** `cutting` phase에서 `cut()` 액션 처리 시.

```typescript
// D-09: 복수 분할 + 재조립
// segments: [[0..4], [5..9], [10..19]] 형태의 카드 배열 조각들
// 왼쪽 플레이어가 원하는 순서로 재조립한 결과를 전달
function applyCut(deck: Card[], segments: Card[][]): Card[] {
  // 클라이언트가 segments 순서를 결정하여 전달
  // 서버는 단순 배열 합치기만 수행 (검증 포함)
  const reassembled = segments.flat();
  // 검증: reassembled의 카드 집합이 원본 deck과 동일해야 함
  if (reassembled.length !== deck.length) throw new Error('INVALID_CUT');
  return reassembled;
}
```

### Pattern 4: 베팅 종료 조건 검증

**What:** 모든 생존 플레이어의 `currentBet`이 `currentBetAmount`와 같으면 베팅 종료.

**When to use:** 매 `processBetAction()` 호출 후 실행.

```typescript
function isBettingComplete(state: GameState): boolean {
  const alivePlayers = state.players.filter(p => p.isAlive);
  if (alivePlayers.length <= 1) return true; // 1명 남으면 즉시 종료
  return alivePlayers.every(p => p.currentBet === state.currentBetAmount);
}
```

### Pattern 5: 밤일낮장 선 결정

**What:** 서버 시간 기준으로 시간대를 판단하고, 각 플레이어가 선택한 카드 숫자를 비교하여 선 결정.

**When to use:** `roundNumber === 1`이고 모든 플레이어가 카드를 선택 완료한 시점.

```typescript
function determineDealer(
  playerSelections: { playerId: string; card: Card }[]
): string {
  const hour = new Date().getHours(); // 서버 시간 (한국 시간 설정 전제)
  // 18:00~05:59: 낮은 숫자 우선 (밤)
  // 06:00~17:59: 높은 숫자 우선 (낮)
  const isNight = hour >= 18 || hour < 6;

  let selected = playerSelections[0];
  for (const ps of playerSelections.slice(1)) {
    if (isNight) {
      if (ps.card.rank < selected.card.rank) selected = ps;
    } else {
      if (ps.card.rank > selected.card.rank) selected = ps;
    }
  }
  return selected.playerId;
}
```

### Anti-Patterns to Avoid

- **클라이언트에서 카드 배분 결정:** 서버 권위 모델(INFRA-04) 위반. 셔플, 배분, 족보 판정은 반드시 서버에서 실행.
- **GameState 직접 외부 노출 (참조 공유):** `getState()`는 `Readonly<GameState>` 반환. 외부에서 직접 수정 불가.
- **단일 `handleAction()` god 메서드:** phase별 메서드 분리. `shuffle()`, `cut()`, `processBetAction()` 등 명확한 액션 단위.
- **베팅 시 칩 차감:** D-20에 따라 Phase 4에서는 `pot` 누적 추적만. `chips` 필드 변경은 Phase 5.
- **타임존 미처리:** `new Date().getHours()`는 서버의 로컬 시간을 반환한다. 프로덕션 서버가 UTC로 동작하면 한국 시간과 다를 수 있다. 서버 환경에서 TZ 설정 또는 명시적 UTC 오프셋 계산 필요.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 족보 비교 | 커스텀 비교 로직 | `compareHands()` (Phase 2 완성) | 땡잡이/암행어사 edge case 이미 처리됨 |
| 족보 평가 | 커스텀 평가 로직 | `evaluateHand()` (Phase 2 완성) | 20장 구성 + 특수패 판정 완비 |
| 덱 생성 | 커스텀 카드 배열 | `createDeck()` (Phase 1 완성) | 광/열끗/일반 속성 포함 20장 정확히 생성 |
| 배열 셔플 | 커스텀 셔플 | Fisher-Yates (`[...arr].sort(() => Math.random()-0.5)` 금지) | `sort` 기반 셔플은 편향됨. Fisher-Yates가 균등 분포 보장 |
| Socket.IO 방 브로드캐스트 | 직접 연결 관리 | `io.to(roomId).emit(...)` | Phase 3에서 확립된 패턴 |

**Key insight:** 카드게임의 핵심 로직(족보 평가, 비교)은 이미 완성되어 있다. Phase 4는 플로우 조립(FSM) 작업이다.

---

## Common Pitfalls

### Pitfall 1: 반시계 방향 인덱스 계산 오류
**What goes wrong:** 베팅/배분 순서가 시계 방향으로 잘못 진행된다.
**Why it happens:** `(dealerIndex + i) % totalPlayers` (시계 방향)을 실수로 사용.
**How to avoid:** `(dealerIndex - i + totalPlayers) % totalPlayers` (반시계 방향) 패턴을 일관되게 사용. 테스트에서 4명 기준 선 0일 때 순서가 `[3,2,1,0]`인지 검증.
**Warning signs:** 선 플레이어가 첫 번째로 카드를 받으면 버그.

### Pitfall 2: 베팅 종료 조건 — 레이즈 후 순환
**What goes wrong:** 플레이어 A가 레이즈하면 이미 콜했던 플레이어 B도 다시 베팅해야 하는데, 베팅이 즉시 종료된다.
**Why it happens:** `isBettingComplete()`를 레이즈 후 즉시 호출하면 A만 올린 상태에서 다른 플레이어 currentBet이 낮아 false가 되어야 하는데, 순서 추적 로직 미흡으로 오류 발생.
**How to avoid:** 레이즈 발생 시 `currentBetAmount`를 갱신하고, 순환 포인터를 레이즈한 플레이어 바로 다음으로 리셋. `currentBetAmount` 변경 시 아직 그 금액을 내지 않은 생존자가 있으면 베팅 미종료.
**Warning signs:** 레이즈 후 1명만 베팅하고 쇼다운으로 넘어가는 현상.

### Pitfall 3: 타임존 — 밤일낮장 판정 오류
**What goes wrong:** 개발 환경(한국 로컬)에서는 정상, 프로덕션 서버(UTC)에서 시간대 판정이 9시간 어긋난다.
**Why it happens:** `new Date().getHours()`는 서버 프로세스의 로컬 시간 기준. Node.js는 `TZ` 환경 변수로 제어.
**How to avoid:** 서버에서 UTC+9 기준 시간을 명시적으로 계산하거나, `TZ=Asia/Seoul` 환경 변수를 설정. 또는 `const kstHour = (new Date().getUTCHours() + 9) % 24` 방식 사용.
**Warning signs:** 밤일낮장 로직이 낮 12시를 기준으로 반전된 것처럼 동작.

### Pitfall 4: 기리 검증 미흡으로 카드 손실/복제
**What goes wrong:** 클라이언트가 전송한 segments에 카드가 중복되거나 누락되어 덱이 오염된다.
**Why it happens:** 서버에서 segments 내용을 검증하지 않고 그대로 사용.
**How to avoid:** `applyCut()` 내에서 (1) 총 카드 수 = 20장, (2) 각 카드가 원본 덱에 존재, (3) 중복 없음을 검증. 검증 실패 시 `'INVALID_CUT'` 에러 반환.
**Warning signs:** 게임 진행 중 특정 카드가 2번 등장하거나 플레이어 패가 undefined.

### Pitfall 5: 쇼다운 — 다이한 플레이어 패 공개 요청
**What goes wrong:** `isAlive=false`인 플레이어가 `revealCard()`를 호출하면 상태가 오염된다.
**Why it happens:** `revealCard()` 내에서 `isAlive` 검증 누락.
**How to avoid:** 모든 액션 메서드 진입 시 phase 유효성 + 플레이어 자격(isAlive, 현재 턴) 검증.
**Warning signs:** 쇼다운에서 다이한 플레이어의 `isRevealed`가 true로 바뀌어 승패 판정이 지연.

### Pitfall 6: Socket.IO 이벤트 타입 미확장
**What goes wrong:** TypeScript가 새 게임 이벤트 emit/on 호출을 unknown으로 처리하여 타입 오류 발생.
**Why it happens:** `protocol.ts`의 `ClientToServerEvents`, `ServerToClientEvents` 확장을 잊음.
**How to avoid:** GameEngine 구현 전에 protocol.ts에 모든 게임 이벤트 시그니처를 먼저 추가.
**Warning signs:** `socket.emit('shuffle-result', ...)` 호출 시 TypeScript 컴파일 에러.

---

## Code Examples

### Fisher-Yates 셔플 (편향 없는 표준 알고리즘)

```typescript
// Source: 알고리즘 표준 구현 — sort() 기반 셔플 절대 사용 금지
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### GameState 브로드캐스트 패턴 (Phase 3 확립 패턴)

```typescript
// Source: packages/server/src/index.ts 패턴 동일 적용
// 각 액션 후 모든 플레이어에게 업데이트된 게임 상태 전송
function broadcastGameState(roomId: string, state: GameState): void {
  io.to(roomId).emit('game-state', state);
}
```

### 쇼다운 승자 판정 (compareHands 활용)

```typescript
// Source: packages/shared/src/hand/compare.ts
import { evaluateHand } from '@sutda/shared';
import { compareHands } from '@sutda/shared';

function determineWinner(alivePlayers: PlayerState[]): PlayerState {
  return alivePlayers.reduce((winner, current) => {
    const winnerHand = evaluateHand(winner.cards[0], winner.cards[1]);
    const currentHand = evaluateHand(current.cards[0], current.cards[1]);
    const result = compareHands(winnerHand, currentHand);
    return result === 'b' ? current : winner;
  });
}
```

### Protocol 확장 예시

```typescript
// packages/shared/src/types/protocol.ts 확장 필요
export interface ClientToServerEvents {
  // ... 기존 이벤트 유지 ...
  'attend-school': (data: { roomId: string }) => void;         // 학교 간다 (앤티)
  'select-dealer-card': (data: { roomId: string; cardIndex: number }) => void; // 밤일낮장 카드 선택
  'select-mode': (data: { roomId: string; mode: GameMode }) => void;
  'shuffle': (data: { roomId: string }) => void;
  'cut': (data: { roomId: string; segments: Card[][] }) => void;
  'declare-ttong': (data: { roomId: string }) => void;
  'bet-action': (data: { roomId: string; action: 'call' | 'raise' | 'die'; raiseAmount?: number }) => void;
  'reveal-card': (data: { roomId: string }) => void;
}

export interface ServerToClientEvents {
  // ... 기존 이벤트 유지 ...
  'game-state': (data: GameState) => void;  // 게임 상태 전체 브로드캐스트
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XState / 외부 FSM 라이브러리 | 직접 클래스 기반 FSM | 프로젝트 설계 결정 (D-01) | 의존성 0 추가, RoomManager 패턴 일관성 |
| 클라이언트 측 게임 로직 | 서버 권위 모델 (INFRA-04) | 프로젝트 설계 결정 | 치트 방지, 상태 일관성 보장 |

**Deprecated/outdated:**
- `sort(() => Math.random() - 0.5)` 셔플: 균등 분포를 보장하지 않음. Fisher-Yates로 대체.

---

## Open Questions

1. **베팅 라운드 초기 `currentBetAmount` 값**
   - What we know: 등교(앤티) 500원이 pot에 들어간다. 베팅 라운드 시작 시점에는 아직 아무도 베팅하지 않은 상태.
   - What's unclear: `currentBetAmount`를 0으로 시작할지, 500(등교금)으로 시작할지. 0이면 첫 플레이어가 "체크(0원 콜)"를 할 수 있게 됨.
   - Recommendation: Claude's Discretion 영역. 전통적인 포커 룰에서는 앤티 후 0원으로 시작하여 첫 베터가 금액을 올리는 방식이 일반적. `currentBetAmount = 0`으로 시작 권장.

2. **기리 복수 분할 최대 분할 수**
   - What we know: D-09에서 "복수 분할 + 재조립 지원" 명시. 최대값 미정.
   - What's unclear: 분할 수가 많을수록 UX가 복잡해짐. 클라이언트 인터랙션 설계에 영향.
   - Recommendation: Claude's Discretion. 서버 로직은 분할 수 제한 없이(`segments.flat()`) 구현하고, UX 제한은 클라이언트에서 처리.

3. **동점(tie) 처리**
   - What we know: `compareHands()` 가 `'tie'`를 반환할 수 있음. HAND-07에 "분팟 또는 재경기" 하우스룰 기본값 언급.
   - What's unclear: Phase 4에서 tie 발생 시 어떻게 처리할지. Phase 9에서 확장될 수 있는 재경기 로직과 충돌 가능성.
   - Recommendation: Phase 4에서는 tie 발생 시 `result` phase로 전환하고 `winnerId: null` (분팟)으로 처리. Phase 5에서 정산 로직 구현 시 분팟 처리.

---

## Environment Availability

Step 2.6: 이 페이즈는 신규 외부 도구 없이 기존 Node.js + TypeScript 환경만 사용. 별도 환경 감사 불필요.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest ^3 |
| Config file | `packages/server/vitest.config.ts` (또는 package.json scripts 내 vitest run) |
| Quick run command | `pnpm --filter @sutda/server test` |
| Full suite command | `pnpm test` (루트 turborepo 전체) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEAT-02 | 밤일낮장 — 18~05시 낮은 숫자 선 결정 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| SEAT-02 | 밤일낮장 — 06~17시 높은 숫자 선 결정 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| SEAT-03 | 2판 이후 승자가 선 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| DECK-02 | shuffle 호출 후 덱 순서 변경 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| DECK-03 | cut 액션 — 복수 분할 재조립 후 20장 유지 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| DECK-03 | cut 검증 — 카드 중복 시 INVALID_CUT 에러 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| DECK-04 | 일반 배분 — 4명 기준 반시계 순서 검증 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| DECK-05 | 퉁 배분 — 2장씩 한 번에 배분 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| BET-01~03 | 콜/레이즈/다이 각 액션 후 상태 검증 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| BET-06 | 레이즈 후 다른 플레이어 재베팅 필요 (순환) | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 |
| MODE-OG-02 | 전체 플로우 — dealing→betting→showdown→result | integration | `pnpm --filter @sutda/server test` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @sutda/server test`
- **Per wave merge:** `pnpm test` (루트 전체)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/server/src/game-engine.test.ts` — GameEngine 단위 테스트 (모든 REQ 커버)
- [ ] `packages/server/src/game-engine.ts` — GameEngine 구현체 (테스트가 먼저)

*(기존 vitest 인프라는 준비됨. 새 파일만 추가하면 됨.)*

---

## Sources

### Primary (HIGH confidence)
- 프로젝트 코드베이스 직접 분석:
  - `packages/shared/src/types/game.ts` — GamePhase, GameState, PlayerState, GameMode 타입
  - `packages/shared/src/types/protocol.ts` — Socket.IO 이벤트 계약
  - `packages/shared/src/hand/compare.ts` — compareHands() 구현
  - `packages/shared/src/hand/evaluator.ts` — evaluateHand() 구현
  - `packages/shared/src/deck.ts` — createDeck() 구현
  - `packages/server/src/room-manager.ts` — 클래스 기반 FSM 패턴 레퍼런스
  - `packages/server/src/index.ts` — Socket.IO 브로드캐스트 패턴
- `rule_draft.md` — 섯다 원문 규칙 정의

### Secondary (MEDIUM confidence)
- `.planning/phases/04-original-mode-game-engine/04-CONTEXT.md` — D-01~D-20 결정
- `.planning/REQUIREMENTS.md` — SEAT-02, SEAT-03, DECK-02~05, MODE-OG-01~02, BET-01~06
- `.planning/STATE.md` — Phase 1~3 결정 누적 기록

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 기존 코드베이스에서 직접 확인됨. 신규 라이브러리 없음.
- Architecture patterns: HIGH — RoomManager 패턴 직접 분석. FSM 패턴은 소규모 카드게임의 표준 접근법.
- Pitfalls: HIGH (반시계 계산, 베팅 순환, 기리 검증) / MEDIUM (타임존) — 타임존은 서버 환경에 따라 달라질 수 있음.

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (안정 스택, 30일)
