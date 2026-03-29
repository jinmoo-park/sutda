# Architecture Patterns

**도메인:** 실시간 멀티플레이어 웹 카드 게임 (온라인 섯다)
**조사일:** 2026-03-29

## 추천 아키텍처

### 전체 구조: Room-based Authoritative Server

```
[브라우저 클라이언트] <--WebSocket--> [게임 서버] <--메모리--> [Room/Game State]
       |                                   |
   React SPA                         Node.js + ws
   (UI 렌더링 전용)                   (모든 게임 로직)
```

**핵심 원칙:** 클라이언트는 "멍청한 터미널"이다. 클라이언트는 사용자 입력(액션)을 서버에 보내고, 서버가 보내주는 상태만 렌더링한다. 게임 로직은 100% 서버에서 실행된다.

**데이터 저장:** 영구 DB 불필요. 모든 상태는 서버 메모리(Room 객체)에 존재하며, 방이 닫히면 사라진다. 이 프로젝트의 요구사항(친구끼리 소규모, 계정 없음, 전적 저장 없음)에 완벽히 부합한다.

---

## 컴포넌트 경계

### 서버 사이드 컴포넌트

| 컴포넌트 | 책임 | 통신 대상 |
|-----------|------|-----------|
| **WebSocket Gateway** | 연결 관리, 메시지 라우팅, 연결/재연결 처리 | Client <-> RoomManager |
| **RoomManager** | 방 생성/삭제, 방 코드 생성, 플레이어 입퇴장 관리 | Gateway, Room |
| **Room** | 방 내 플레이어 목록, 설정(시작금액 등), 방장 권한 | RoomManager, GameEngine |
| **GameEngine** | 게임 상태 머신 (FSM), 턴/페이즈 진행, 베팅 라운드 관리 | Room, CardDeck, HandEvaluator |
| **CardDeck** | 20장 덱 관리, 셔플, 기리/퉁, 카드 분배 | GameEngine |
| **HandEvaluator** | 족보 판정 (광땡, 땡, 알리~새륙, 끗), 승자 결정 | GameEngine |
| **BettingManager** | 콜/레이즈/다이 처리, 판돈 추적, 땡값 계산 | GameEngine |
| **GameModeStrategy** | 5가지 모드별 분배/베팅/진행 규칙 (Strategy Pattern) | GameEngine |

### 클라이언트 사이드 컴포넌트

| 컴포넌트 | 책임 | 통신 대상 |
|-----------|------|-----------|
| **WebSocket Client** | 서버 연결, 메시지 송수신, 재연결 로직 | Server Gateway |
| **GameStateStore** | 서버에서 받은 상태를 로컬에 저장 (Zustand/Context) | 모든 UI 컴포넌트 |
| **LobbyView** | 방 참가, 닉네임 입력, 대기실 UI | WebSocket Client |
| **TableView** | 게임 테이블 렌더링 (원형 좌석, 카드, 칩) | GameStateStore |
| **BettingUI** | 콜/레이즈/다이 버튼, 금액 입력 | WebSocket Client |
| **CardDisplay** | 카드 렌더링 (와이어프레임 -> 이미지 교체 가능 구조) | GameStateStore |

---

## 데이터 흐름

### 1. 방 참가 흐름

```
[플레이어] -- 링크 클릭 --> [클라이언트: URL에서 방 코드 파싱]
   |
   v
[클라이언트] -- WS 연결 + {type: "JOIN", roomCode, nickname} --> [Gateway]
   |
   v
[Gateway] --> [RoomManager.findRoom(roomCode)]
   |
   v
[Room.addPlayer()] --> 방 내 모든 클라이언트에게 {type: "PLAYER_JOINED", players: [...]} 브로드캐스트
```

### 2. 게임 진행 흐름 (오리지날 모드)

```
[방장] -- {type: "START_GAME", mode: "original"} --> [Server]
   |
   v
[GameEngine] 상태 전이: WAITING -> SHUFFLING
   |
   v
[CardDeck.shuffle()] --> 기리/퉁 요청을 왼쪽 플레이어에게 전송
   |
   v
[왼쪽 플레이어] -- {type: "CUT_DECISION", action: "cut"|"tung"} --> [Server]
   |
   v
[CardDeck.deal()] --> 각 플레이어에게 자기 카드만 전송
   |                   {type: "CARDS_DEALT", myCards: [card1, card2]}
   |                   *** 다른 플레이어의 카드는 절대 전송하지 않음 ***
   v
[GameEngine] 상태 전이: DEALING -> BETTING
   |
   v
[BettingManager] --> 현재 턴 플레이어에게 {type: "YOUR_TURN", actions: ["call","raise","die"]}
   |
   v
[플레이어] -- {type: "BET", action: "raise", amount: 5000} --> [Server]
   |
   v
[BettingManager] 유효성 검증 --> 모든 클라이언트에 {type: "BET_MADE", player, action, pot}
   |
   v
(베팅 라운드 종료)
   |
   v
[HandEvaluator.evaluate()] --> 족보 비교 --> 승자 결정
   |
   v
[GameEngine] --> 모든 클라이언트에 {type: "ROUND_RESULT", winner, hands: {...}, pot}
```

### 3. 상태 동기화 원칙

```
서버 -> 클라이언트 (단방향 상태 전송):
  - 전체 게임 상태의 "이 플레이어가 볼 수 있는 뷰"를 전송
  - 각 플레이어마다 다른 뷰 (자기 카드만 보임)
  - 인디언 모드: 특수 뷰 (자기 앞면 카드는 안 보이고 남의 앞면 카드는 보임)

클라이언트 -> 서버 (액션만 전송):
  - {type: "BET", action, amount}
  - {type: "SELECT_CARDS", cardIds: [...]}
  - {type: "CUT_DECISION", action}
  - 서버가 모든 액션을 검증 후 처리
```

---

## 핵심 패턴

### 패턴 1: Finite State Machine (게임 엔진)

**설명:** 게임의 모든 페이즈를 명시적 상태 머신으로 관리한다. 이것이 이 프로젝트 아키텍처의 핵심이다.

**이유:** 섯다는 복잡한 상태 전이가 많다 (셔플 -> 기리 -> 분배 -> 베팅 -> 추가분배(세장) -> 추가베팅 -> 결과). FSM 없이 if/else로 관리하면 반드시 버그가 발생한다.

**상태 정의:**

```
WAITING          -- 방에서 게임 시작 대기
MODE_SELECT      -- 선 플레이어가 게임 모드 선택
SHUFFLING        -- 셔플 + 기리/퉁
DEALING          -- 카드 분배
BETTING_ROUND_1  -- 첫 번째 베팅 라운드
EXTRA_DEAL       -- 추가 카드 분배 (세장/인디언)
CARD_SELECT      -- 카드 선택 (세장/후회의섯다)
BETTING_ROUND_2  -- 두 번째 베팅 라운드 (세장/인디언)
SHOWDOWN         -- 족보 공개 + 승자 결정
GUSA_REMATCH     -- 구사 재경기 판단
DDAENG_VALUE     -- 땡값 정산
ROUND_END        -- 라운드 종료, 다음 라운드 준비
```

**구현 방식:** 단순 switch/case 기반 FSM으로 충분하다. XState 같은 라이브러리는 오버킬이다. 상태 수가 10여 개이고 전이 규칙이 명확하므로 직접 구현이 더 가볍고 디버깅하기 쉽다.

```typescript
// 개념적 구조
interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  deck: Card[];
  pot: number;
  currentTurn: number;
  mode: GameMode;
}

type GamePhase =
  | 'WAITING' | 'MODE_SELECT' | 'SHUFFLING'
  | 'DEALING' | 'BETTING_ROUND_1' | 'EXTRA_DEAL'
  | 'CARD_SELECT' | 'BETTING_ROUND_2' | 'SHOWDOWN'
  | 'GUSA_REMATCH' | 'DDAENG_VALUE' | 'ROUND_END';

function transition(state: GameState, action: GameAction): GameState {
  switch (state.phase) {
    case 'BETTING_ROUND_1':
      if (action.type === 'BET') {
        return handleBet(state, action);
      }
      break;
    // ...
  }
}
```

### 패턴 2: Strategy Pattern (게임 모드)

**설명:** 5가지 모드의 차이점을 Strategy 인터페이스로 추상화한다.

**이유:** 모드별로 달라지는 것: 카드 분배 방식, 베팅 라운드 수, 카드 가시성 규칙, 추가 페이즈 유무. 공통점: 족보 판정, 베팅 액션, 승자 결정. Strategy로 분리하면 새 모드 추가가 깔끔하다.

```typescript
interface GameModeStrategy {
  readonly name: string;
  readonly requiredPhases: GamePhase[];  // 이 모드가 사용하는 페이즈들

  dealCards(deck: Card[], players: Player[]): DealResult;
  getVisibility(player: Player, allPlayers: Player[]): VisibleState;
  getBettingRounds(): number;  // 1 or 2
  hasExtraDeal(): boolean;
  hasCardSelect(): boolean;
}
```

### 패턴 3: Player View Projection (정보 은닉)

**설명:** 서버는 전체 게임 상태를 보유하지만, 각 플레이어에게는 해당 플레이어가 볼 수 있는 정보만 투영(projection)해서 보낸다.

**이유:** 카드 게임에서 정보 은닉은 핵심이다. 특히 인디언 모드에서는 플레이어마다 볼 수 있는 카드가 완전히 다르다. 전체 상태를 보내면 개발자 도구로 치팅 가능하다.

```typescript
function projectStateForPlayer(
  fullState: GameState,
  playerId: string
): ClientGameState {
  return {
    phase: fullState.phase,
    pot: fullState.pot,
    myCards: fullState.players.find(p => p.id === playerId)?.cards ?? [],
    players: fullState.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      chipCount: p.chips,
      cardCount: p.cards.length,
      // 다른 플레이어의 카드 내용은 보내지 않음
      // 인디언 모드: 해당 플레이어의 앞면 카드만 조건부로 포함
      visibleCards: getVisibleCards(fullState.mode, playerId, p),
      lastAction: p.lastBetAction,
      isCurrentTurn: p.id === fullState.currentTurnPlayerId,
    })),
    availableActions: getAvailableActions(fullState, playerId),
  };
}
```

### 패턴 4: Message Protocol (클라이언트-서버 통신)

**설명:** WebSocket 메시지를 `{type: string, payload: object}` 형태의 타입드 프로토콜로 정의한다.

**이유:** 자유형 메시지는 곧바로 혼돈이 된다. 타입을 명시하면 TypeScript 타입 체크와 서버 핸들러 라우팅이 자연스럽다.

```typescript
// 클라이언트 -> 서버 메시지
type ClientMessage =
  | { type: 'JOIN'; roomCode: string; nickname: string }
  | { type: 'START_GAME'; mode: GameMode }
  | { type: 'CUT_DECISION'; action: 'cut' | 'tung'; cutConfig?: object }
  | { type: 'BET'; action: 'call' | 'raise' | 'die'; amount?: number }
  | { type: 'SELECT_CARDS'; cardIds: string[] }
  | { type: 'SELECT_SHARED_CARD'; cardId: string }
  | { type: 'PICK_CARD'; cardId: string }  // 후회의섯다
  | { type: 'APPROVE_RECHARGE'; approve: boolean }

// 서버 -> 클라이언트 메시지
type ServerMessage =
  | { type: 'ROOM_STATE'; state: RoomState }
  | { type: 'GAME_STATE'; state: ClientGameState }
  | { type: 'YOUR_TURN'; availableActions: Action[] }
  | { type: 'ERROR'; message: string; code: string }
  | { type: 'ROUND_RESULT'; result: RoundResult }
  | { type: 'PLAYER_JOINED'; player: PlayerInfo }
  | { type: 'PLAYER_LEFT'; playerId: string }
```

---

## 피해야 할 안티-패턴

### 안티-패턴 1: 클라이언트에서 게임 로직 실행

**설명:** 클라이언트가 족보 판정이나 승자 결정을 수행하는 것

**왜 나쁜가:** 브라우저 개발자 도구로 모든 로직을 우회할 수 있다. 카드 게임에서 치팅은 게임을 파괴한다. 친구끼리라도 신뢰성이 중요하다.

**대신:** 클라이언트는 순수하게 렌더링과 액션 전송만 담당. 족보 판정 코드가 클라이언트에 있어도 되지만(결과 미리보기용), 서버 결과가 항상 권위(authoritative)를 가진다.

### 안티-패턴 2: 전체 게임 상태 브로드캐스트

**설명:** 서버가 모든 플레이어에게 동일한 전체 상태를 보내는 것

**왜 나쁜가:** 다른 플레이어의 카드가 노출된다. 특히 인디언 모드에서는 치명적이다.

**대신:** Player View Projection 패턴 사용. 각 플레이어마다 필터링된 상태를 개별 전송한다.

### 안티-패턴 3: 상태 머신 없이 플래그로 관리

**설명:** `isDealing`, `isBetting`, `isShowdown` 등 boolean 플래그로 게임 단계를 관리

**왜 나쁜가:** 플래그 조합의 불가능한 상태가 발생한다 (`isDealing && isBetting` 같은). 5가지 모드에서 플래그가 폭발적으로 늘어난다.

**대신:** 단일 `phase` enum으로 현재 상태를 표현. 불가능한 상태 조합이 원천 차단된다.

### 안티-패턴 4: REST API로 게임 액션 처리

**설명:** WebSocket 대신 HTTP 요청으로 베팅 등 게임 액션을 처리하는 것

**왜 나쁜가:** 다른 플레이어의 액션을 실시간으로 받을 수 없다. 폴링은 지연이 크고 비효율적이다.

**대신:** WebSocket으로 양방향 실시간 통신. HTTP는 초기 페이지 로딩에만 사용.

---

## 스케일 고려사항

이 프로젝트는 소규모(친구 몇 명)이므로 스케일은 큰 고려사항이 아니다. 그래도 건전한 아키텍처를 위한 포인트:

| 관심사 | 현재 (친구 1그룹) | 나중에 (그룹 여러 개) | 고려할 필요 없음 |
|---------|-------------------|---------------------|-----------------|
| 방 관리 | 단일 서버 메모리에 Map으로 관리 | 여전히 단일 서버로 충분 (수십 개 방) | 분산 서버, Redis |
| 연결 관리 | ws 라이브러리 직접 사용 | Socket.IO 고려 (재연결 처리) | 로드 밸런서 |
| 상태 저장 | 메모리 (방 닫히면 소멸) | 동일 | 데이터베이스 |
| 보안 | 방 코드 유추 불가 수준이면 충분 | 동일 | JWT, 인증 시스템 |

---

## 디렉토리 구조 추천

```
sutda/
├── client/                    # React SPA
│   ├── src/
│   │   ├── components/        # UI 컴포넌트
│   │   │   ├── Lobby/         # 방 참가/대기실
│   │   │   ├── Table/         # 게임 테이블
│   │   │   ├── Cards/         # 카드 렌더링 (와이어프레임 교체 가능)
│   │   │   └── Betting/       # 베팅 UI
│   │   ├── hooks/             # WebSocket 훅, 게임 상태 훅
│   │   ├── store/             # 클라이언트 상태 관리
│   │   └── types/             # 공유 타입 (서버와 동일)
│   └── ...
│
├── server/                    # Node.js 게임 서버
│   ├── src/
│   │   ├── ws/                # WebSocket Gateway, 메시지 라우팅
│   │   ├── room/              # RoomManager, Room
│   │   ├── game/              # GameEngine (FSM)
│   │   │   ├── engine.ts      # 상태 머신 코어
│   │   │   ├── modes/         # 5가지 모드 Strategy
│   │   │   ├── deck.ts        # CardDeck
│   │   │   ├── evaluator.ts   # HandEvaluator (족보 판정)
│   │   │   └── betting.ts     # BettingManager
│   │   └── types/             # 공유 타입
│   └── ...
│
├── shared/                    # 클라이언트-서버 공유 타입/상수
│   ├── messages.ts            # 메시지 프로토콜 타입
│   ├── cards.ts               # 카드 정의 (1~10, 광, 열끗)
│   └── hands.ts               # 족보 이름/순위 상수
│
└── package.json               # 모노레포 (npm workspaces)
```

---

## 빌드 순서 (의존성 기반)

아키텍처 컴포넌트 간 의존 관계로부터 도출한 빌드 순서:

### Layer 0: 공유 기반 (의존성 없음)
1. **shared/messages.ts** - 메시지 프로토콜 타입 정의
2. **shared/cards.ts** - 카드 데이터 모델 (20장, 광, 열끗 속성)
3. **shared/hands.ts** - 족보 순위 정의

### Layer 1: 서버 핵심 로직 (shared에만 의존)
4. **CardDeck** - 셔플, 분배 로직 (순수 함수, 테스트 용이)
5. **HandEvaluator** - 족보 판정 (순수 함수, 가장 먼저 완성하고 테스트해야 함)
6. **BettingManager** - 베팅 규칙 처리

### Layer 2: 게임 엔진 (Layer 1에 의존)
7. **GameEngine (FSM)** - 오리지날 모드부터 시작
8. **GameModeStrategy** - 오리지날 먼저, 이후 모드 하나씩 추가

### Layer 3: 네트워크 (Layer 2에 의존)
9. **WebSocket Gateway** - 연결 관리, 메시지 라우팅
10. **RoomManager** - 방 생성/관리, Player View Projection

### Layer 4: 클라이언트 (서버 완성 후)
11. **WebSocket Client Hook** - 서버 연결
12. **LobbyView** - 방 참가 UI
13. **TableView + CardDisplay** - 게임 테이블 (와이어프레임)
14. **BettingUI** - 베팅 인터랙션

### Layer 5: 추가 모드 (기본 흐름 완성 후)
15. 세장섯다 Strategy 추가
16. 한장공유 Strategy 추가
17. 후회의섯다 Strategy 추가
18. 인디언섯다 Strategy 추가

**핵심 빌드 원칙:** HandEvaluator와 CardDeck을 먼저 만들고 단위 테스트로 완벽히 검증한다. 족보 판정은 게임의 핵심이며, 여기에 버그가 있으면 전체가 무너진다. 이 두 컴포넌트는 순수 함수이므로 네트워크 없이 독립 테스트가 가능하다.

---

## 신뢰도 평가

| 영역 | 신뢰도 | 근거 |
|------|--------|------|
| Room-based 서버 구조 | HIGH | 실시간 멀티플레이어 게임의 표준 패턴. 수많은 게임에서 검증됨 |
| FSM 기반 게임 엔진 | HIGH | 턴 기반 게임의 사실상 표준. 대안이 없을 정도로 확립된 패턴 |
| Player View Projection | HIGH | 카드 게임 서버의 필수 패턴. 정보 은닉이 게임 무결성의 핵심 |
| Strategy 패턴으로 모드 분리 | HIGH | GoF 디자인 패턴의 교과서적 적용 사례 |
| 메모리 기반 상태 관리 (DB 없음) | HIGH | 요구사항에 영구 저장이 없으므로 적합. 서버 재시작 시 방 소멸은 허용 가능 |
| 디렉토리 구조 | MEDIUM | 프로젝트 규모와 선택 스택에 따라 조정 필요 |

## 출처

- 실시간 멀티플레이어 게임 서버 아키텍처는 확립된 도메인이며, Authoritative Server + Room 기반 구조는 표준 패턴으로 학습 데이터에서 광범위하게 확인됨
- Finite State Machine을 게임 로직에 적용하는 패턴은 게임 개발의 기본 원칙
- Player View Projection은 온라인 카드 게임(포커 서버 등)에서 표준적으로 사용되는 정보 은닉 패턴
- WebSocket 기반 실시간 통신은 브라우저 멀티플레이어 게임의 사실상 유일한 선택지

> **참고:** WebSearch 도구 사용 불가로 2026년 최신 자료 검증은 수행하지 못했으나, 이 아키텍처 패턴들은 수년간 변하지 않는 확립된 패턴이므로 신뢰도에 영향은 미미하다.
