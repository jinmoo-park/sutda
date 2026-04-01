# Phase 11: 소셜/기능 완성 - Research

**조사일:** 2026-04-01
**도메인:** Socket.IO 실시간 채팅 / 게임 상태 머신 확장 / 인메모리 이력 / 올인 정산 알고리즘
**신뢰도:** HIGH (기존 코드베이스 직접 분석 + 결정사항 CONTEXT.md 확인)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 채팅 (UX-02)
- D-01: 텍스트 전용 채팅. 이모지 없음, 게임 이벤트 자동 메시지 없음.
- D-02: 메시지 이력은 입장 시점부터만 보임. 서버는 방 세션 전체 메시지를 저장하지 않아도 됨.
- D-03: ChatPanel.tsx의 placeholder를 실제 채팅 UI로 교체. 기존 레이아웃 위치(우사이드/모바일 하단) 유지.

#### 게임 이력 (HIST-01/02)
- D-04: 이력 내용 — 판별 요약: 승자, 판돈액, 승자 족보, 주요 정보(땡값 여부 등). 세부 베팅 로그 없음.
- D-05: UI 위치 — 정보 패널 안에 "[시계 아이콘] 이력" 버튼(작게) → 클릭 시 별도 모달로 전체 이력 표시.
- D-06: 모바일 — 히스토리 아이콘(시계+화살표) 탭으로 모달 오픈.
- D-07: 이력은 방 세션 동안만 메모리 유지. 영구 저장 없음.

#### 학교 대신 가주기 (SCHOOL-PROXY)
- D-08: 트리거 — 결과 화면에서 승자에게만 노출. 게임 진행 중에는 없음.
- D-09: UI — 결과 화면에 다른 플레이어 목록 + 체크박스. 승자가 원하는 플레이어 복수 선택 가능.
- D-10: 확인 버튼 누르면 선택된 플레이어들의 다음 판 앤티를 승자가 대신 납부. 1회성.
- D-11: 다음 판 앤티 처리 — 해당 플레이어 앤티 시 서버가 자동 차감 후 "[닉네임]님이 학교를 대신 가줬습니다" 토스트만 표시. 별도 UI 비활성화 없음.

#### Observer 모드 (LATE-JOIN)
- D-12: 게임 중 입장자는 Observer. 플레이어 원형 안에 포함되지 않음.
- D-13: Observer 정보 가시성 — 실제 게임과 동일. 다른 플레이어 카드는 뒷면 유지.
- D-14: UI 표시 — Observer 플레이어 시트에 "관람 중" 배지 표시 + 다음 판 자동 합류 예정 인디케이터.
- D-15: 판 교체(새 판 시작) 시 Observer → 일반 플레이어 자동 합류. 초기 칩은 입장 시 입력했던 금액.

#### 세션 종료 표시 (SESSION-END)
- D-16: 플레이어 연결 끊김(disconnect) 시 해당 시트 제거 + 원형 자리 재배치 + "[닉네임]님 연결이 끊어졌습니다" 토스트.
- D-17: 재접속(reconnect) 구분 — 짧은 시간(30초 내) 재접속 시 복귀 처리, 그 이후는 퇴장 처리.
- D-18: 2인 게임 중 1명 퇴장: 남은 플레이어를 방장 대기 화면(WaitingRoom)으로 전환.
- D-19: 게임 진행 중 퇴장한 플레이어의 베팅금은 팟에 기증 처리(다이와 동일).

#### 올인 POT (ALLIN-POT)
- D-20: 올인 트리거 — 상대 레이즈 금액 > 자신의 잔액일 때 콜 시 자동 올인 상태. 별도 올인 버튼 없음.
- D-21: 올인된 플레이어는 이후 베팅 패널 비활성화. 나머지 플레이어는 베팅 계속 가능.
- D-22: 정산 — 올인 플레이어가 이기면 자신이 기여한 금액의 배수만큼만 수령. 초과 금액은 2등에게 반환.
- D-23: POT UI — 단일 합산 POT 표시. Main/Side pot 분리 표시 없음.
- D-24: effectiveMaxBet (Phase 5에서 이미 구현) 패턴 활용하여 올인 정산 처리.

### Claude's Discretion
없음 — 모든 구현 결정사항이 D-01~D-24로 명시됨.

### Deferred Ideas (OUT OF SCOPE)
- BET-07 (체크 베팅): Phase 11에서 처리하지 않음.
- 이모지/이모티콘 채팅: 텍스트 전용으로 결정됨, v2 이후 고려.
- 이모티콘 리액션, 게임 이벤트 자동 채팅 메시지.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | 설명 | 리서치 지원 |
|----|------|------------|
| UX-02 | 텍스트 채팅 기능 구현 | Socket.IO broadcast 패턴, ChatPanel.tsx placeholder 교체, sonner 토스트 기존 활용 |
| HIST-01 | 세션 내 판별 칩 증감 히스토리 표시 | 인메모리 배열 패턴, GameEngine nextRound() 후크 포인트, 모달 UI |
| HIST-02 | 게임 종료 후 정산 요약 화면 | 동일 이력 구조 활용, `finished` phase 활용 |
| SCHOOL-PROXY | 학교 대신 가주기 | attendedPlayerIds 패턴, 서버 side 앤티 대납 로직, 결과 화면 UI 추가 |
| LATE-JOIN | 게임 시작 후 입장자를 Observer로 처리 | RoomPlayer 타입 확장(isObserver), join-room 핸들러 분기, nextRound() 자동 합류 |
| SESSION-END | 세션 종료 처리 — 시트 제거 + 재배치 + 토스트 알림 | 30초 타이머 + disconnect 핸들러 확장, leaveRoom 게임 중 경로 구현 |
| ALLIN-POT | 올인 승리 시 POT 처리 | effectiveMaxBet 패턴(Phase 5) 활용, isAllIn 상태 플래그, 정산 로직 수정 |
</phase_requirements>

---

## 요약

Phase 11은 신규 라이브러리 도입 없이 기존 Socket.IO 4.8 + Zustand 5 스택으로 구현 가능하다. 모든 기능은 서버 권위 모델 위에서 동작하며, 클라이언트는 상태를 렌더링만 한다.

**6개 기능 영역 구현 전략 요약:**
1. **채팅**: `chat-message` 이벤트 추가 — broadcast only, 서버 저장 최소화(방별 배열 50개 캡)
2. **게임 이력**: `GameEngine.nextRound()` 직전 후크로 판 요약 객체 생성, 서버 Map으로 누적
3. **학교 대신 가주기**: `schoolProxies: Map<playerId, Set<beneficiaryId>>` 서버 상태 + `attend-school` 핸들러 분기
4. **Observer**: `RoomPlayer.isObserver` 플래그 추가, `join-room` 게임 중 분기, `nextRound()` 자동 합류
5. **세션 종료**: 게임 중 disconnect에도 30초 타이머 적용, 만료 시 GameEngine.forcePlayerDie() + leaveRoom
6. **올인 POT**: `isAllIn` 플래그, `settleChips()` 에서 올인자 수령 상한 계산 후 잉여분 2등 반환

**핵심 원칙:** 서버 GameState는 변경 최소화 — 올인 플래그와 Observer 플래그만 추가. 이력/채팅은 별도 Map으로 관리하여 GameState 오염 방지.

---

## Standard Stack

### Core (변경 없음 — 기존 스택 유지)
| 라이브러리 | 버전 | 용도 | 비고 |
|-----------|------|------|------|
| socket.io | ^4.8.3 | 서버-클라 실시간 통신 | 채팅/이벤트 신규 이벤트 추가 |
| socket.io-client | ^4.8.3 | 클라이언트 연결 | — |
| zustand | ^5.0.12 | 클라이언트 상태 관리 | gameStore 채팅 메시지 배열 추가 |
| sonner | ^2.0.7 | 토스트 알림 | 세션 종료/학교 대신 가주기 알림에 활용 |
| react | ^19 | UI 렌더링 | — |
| tailwindcss | ^4.2.2 | 스타일링 | — |

### 신규 패키지 불필요
Phase 11의 모든 요구사항은 기존 스택으로 충족 가능하다. 채팅에 별도 채팅 라이브러리(Ably, Pusher 등)를 도입할 필요 없음.

---

## Architecture Patterns

### 패턴 1: Socket.IO 채팅 — Broadcast 이벤트

채팅은 서버에서 방(room) 전체로 브로드캐스트하는 단방향 패턴이 표준이다.

**이벤트 흐름:**
```
클라이언트 → 서버: 'send-chat' { roomId, text }
서버 → io.to(roomId): 'chat-message' { playerId, nickname, text, timestamp }
```

**서버 저장 전략 (D-02 기반):**
- 방별 최근 50개 메시지만 인메모리 유지 (방 폭발 방지)
- 신규 입장자는 서버가 현재 배열을 `initial-chat-history` 이벤트로 1회 전송
- 이 방식은 "입장 시점부터 보임" (D-02) 조건과 양립 가능 — 단, 배열은 현재 방 세션 전체이므로 클라이언트에서 입장 후 수신된 메시지만 표시하거나, 서버에서 입장 timestamp 이후만 필터링

**권장 구현(서버 저장 미니멀):**
```typescript
// server/src/index.ts
const chatHistories = new Map<string, ChatMessage[]>(); // roomId → 최근 50개

interface ChatMessage {
  playerId: string;
  nickname: string;
  text: string;
  timestamp: number;
}

socket.on('send-chat', ({ roomId, text }) => {
  const msg: ChatMessage = {
    playerId: socket.data.playerId,
    nickname: socket.data.nickname,
    text: text.slice(0, 200), // 길이 제한
    timestamp: Date.now(),
  };
  if (!chatHistories.has(roomId)) chatHistories.set(roomId, []);
  const history = chatHistories.get(roomId)!;
  history.push(msg);
  if (history.length > 50) history.shift(); // 캡
  io.to(roomId).emit('chat-message', msg);
});
```

**클라이언트 저장 (Zustand):**
```typescript
// gameStore에 chatMessages: ChatMessage[] 배열 추가
// 'chat-message' 소켓 이벤트 수신 시 배열에 push
// 입장 후 수신분만 표시 — 서버에서 history 전송받을 경우 concat
```

**ChatPanel.tsx 교체 패턴:**
- 스크롤 영역: `overflow-y-auto` + `ref`로 최신 메시지 자동 스크롤 (`useEffect` + `scrollIntoView`)
- 입력창: `onKeyDown Enter` 전송, 빈 문자열 방지, 200자 제한
- 메시지 표시: 내 메시지(우측 정렬) / 타인 메시지(좌측 정렬) 구분

### 패턴 2: 게임 이력 — 인메모리 누적 배열

**데이터 구조:**
```typescript
interface RoundHistoryEntry {
  roundNumber: number;
  winnerId: string;
  winnerNickname: string;
  winnerHandLabel: string; // "삼팔광땡", "구땡", "7끗" 등
  pot: number;             // 최종 판돈
  hasTtaengPayment: boolean; // 땡값 발생 여부
  playerChipChanges: { playerId: string; nickname: string; chipDelta: number }[];
}
```

**서버 저장:**
```typescript
const gameHistories = new Map<string, RoundHistoryEntry[]>(); // roomId → 전체 이력
```

**후크 포인트:** `GameEngine._resolveShowdownOriginal()` 등 각 모드의 showdown 완료 시점. `state.phase = 'result'` 전환 직전에 이력 항목 생성.

**프로토콜 추가:**
- `ServerToClientEvents`에 `'game-history'` 이벤트: 결과 화면 전환 시 이력 배열 전송 (또는 GameState에 포함)
- 실용적인 접근: GameState에 `roundHistorySnapshot?: RoundHistoryEntry[]` 필드 추가 → result phase에서만 채워서 전송

**UI 패턴 (D-05):**
- InfoPanel에 시계 아이콘 버튼 → `Dialog` (shadcn/ui radix-dialog 이미 설치됨) 모달 오픈
- 모달 내부: 판별 요약 리스트 (역순 — 최신 판이 위)

### 패턴 3: 학교 대신 가주기 (SCHOOL-PROXY) — 서버 측 앤티 대납

**핵심 메커니즘:**
- 결과 화면에서 승자가 `proxy-ante` 이벤트 emit → 서버에서 `schoolProxies` Map 갱신
- 다음 판 `attend-school` 핸들러에서 해당 플레이어 앤티 비용을 승자 칩에서 차감

**서버 상태:**
```typescript
const schoolProxies = new Map<string, Map<string, string>>(); 
// roomId → Map<beneficiaryPlayerId, sponsorPlayerId>
```

**프로토콜:**
```typescript
// ClientToServerEvents 추가:
'proxy-ante': (data: { roomId: string; beneficiaryIds: string[] }) => void;

// ServerToClientEvents 추가:
'proxy-ante-confirmed': (data: { beneficiaryIds: string[] }) => void;
```

**attend-school 핸들러 수정:**
```typescript
// 기존 engine.attendSchool(playerId) 호출 전 확인
const proxies = schoolProxies.get(roomId);
if (proxies?.has(socket.data.playerId)) {
  const sponsorId = proxies.get(socket.data.playerId)!;
  // 후원자 칩에서 앤티(500원) 차감, 해당 플레이어는 무료 참여
  engine.attendSchoolProxy(socket.data.playerId, sponsorId);
  proxies.delete(socket.data.playerId); // 1회성
} else {
  engine.attendSchool(socket.data.playerId);
}
```

**GameEngine 추가 메서드:**
```typescript
attendSchoolProxy(beneficiaryId: string, sponsorId: string): void {
  // beneficiary를 attendSchool 처리 (chips 차감 없음)
  // sponsor의 chips에서 500원 차감
  // attendedPlayerIds에 beneficiary 추가
}
```

**클라이언트 토스트 (D-11):** `'chat-message'`와 별도로 `'proxy-ante-applied'` 이벤트를 broadcast → 클라이언트에서 sonner toast 표시

### 패턴 4: Observer 모드 (LATE-JOIN)

**RoomPlayer 타입 확장:**
```typescript
// packages/shared/src/types/room.ts
export interface RoomPlayer {
  // 기존 필드들...
  isObserver?: boolean;      // 게임 중 입장한 관람자
  observerChips?: number;    // 다음 판 참여 시 사용할 초기 칩
}
```

**join-room 핸들러 수정 (index.ts):**
```typescript
// 현재: game.gamePhase === 'playing' → 재접속 or GAME_IN_PROGRESS throw
// 변경: 신규 플레이어 → isObserver = true로 방에 추가 (GAME_IN_PROGRESS 던지지 않음)
if (room.gamePhase === 'playing') {
  const existing = room.players.find(p => p.nickname === nickname);
  if (existing) {
    // 재접속 처리 (기존 로직)
  } else {
    // Observer로 추가
    const observer: RoomPlayer = {
      id: playerId, nickname, chips: 0, seatIndex: room.players.length,
      isConnected: true, isObserver: true, observerChips: initialChips,
    };
    room.players.push(observer);
    // game-state도 전송 (게임 화면 렌더링 위해)
  }
}
```

**nextRound() 자동 합류 (D-15):**
```typescript
// GameEngine.nextRound() 또는 index.ts의 next-round 핸들러에서:
// Observer 플레이어를 일반 플레이어로 전환 후 GameEngine에 추가
// → GameEngine은 현재 immutable한 players 배열을 갖고 있으므로,
//    index.ts에서 GameEngine을 재생성하거나 addPlayer() 메서드 추가 필요
```

**Observer 자동 합류 구현 전략:**
- **방법 A (권장):** `next-round` 핸들러에서 Observer 플레이어를 정규 플레이어로 전환 후 새 `GameEngine` 생성 시 포함
  - 장점: GameEngine 내부 불변 유지
  - 단점: Engine 재생성 시 roundNumber를 올바르게 전달해야 함
- **방법 B:** `GameEngine.addObserver(player)` 메서드 추가 — 진행 중 players 배열에 추가
  - 단점: GameEngine 내부 불변성 파괴, 복잡도 증가

방법 A를 채택한다. `next-round` 이벤트 핸들러에서 roomManager의 Observer 플래그를 해제하고, 기존 GameEngine을 새 GameEngine으로 교체한다.

**게임 상태 스냅샷 전송 (D-13):**
```typescript
// join-room 핸들러에서 Observer 추가 후:
const engine = gameEngines.get(roomId);
if (engine) {
  socket.emit('game-state', engine.getStateFor(playerId) as GameState);
}
```
이미 기존 코드(index.ts L160-165)에서 게임 중 join-room 시 game-state 전송이 구현되어 있음 — Observer 처리 후에도 동일하게 활용 가능.

### 패턴 5: 세션 종료 처리 (SESSION-END)

**현재 disconnect 로직:**
- 대기실: 15초 타이머 후 `leaveRoom()`
- 게임 중: `disconnectPlayer()`만 호출 (isConnected=false), 재접속 대기, 타이머 없음

**변경 사항 — 게임 중 disconnect에도 타이머 추가 (D-17):**
```typescript
// index.ts disconnect 핸들러
socket.on('disconnect', () => {
  const { roomId } = socket.data;
  if (!roomId) return;
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  if (room.gamePhase === 'playing') {
    roomManager.disconnectPlayer(roomId, socket.id); // isConnected=false
    const disconnectedId = socket.id;
    const disconnectedNickname = socket.data.nickname;
    const timerKey = `${roomId}:${disconnectedId}`;
    
    const timer = setTimeout(() => {
      disconnectTimers.delete(timerKey);
      const engine = gameEngines.get(roomId);
      const currentRoom = roomManager.getRoom(roomId);
      if (!currentRoom) return;
      
      // 여전히 연결 안 됨 → 강제 퇴장
      const player = currentRoom.players.find(p => p.id === disconnectedId);
      if (player && !player.isConnected) {
        // 게임 진행 중이면 베팅을 다이로 처리 (D-19)
        if (engine) {
          try { engine.forcePlayerLeave(disconnectedId); } catch { /* 이미 다이 */ }
        }
        const result = roomManager.leaveRoom(roomId, disconnectedId);
        if (result) {
          io.to(roomId).emit('player-left', {
            playerId: result.removedPlayerId,
            newHostId: result.newHostId,
            nickname: disconnectedNickname, // 토스트용
          });
          // 2인 게임 → 1명 남으면 game-over 처리 (D-18)
          if (currentRoom.players.length < 2) {
            // gamePhase를 waiting으로 전환 → 클라이언트 WaitingRoom 렌더링
            currentRoom.gamePhase = 'waiting';
            gameEngines.delete(roomId);
            io.to(roomId).emit('room-state', currentRoom);
          }
        }
      }
    }, 30_000); // D-17: 30초
    disconnectTimers.set(timerKey, timer);
  } else {
    // 대기실: 기존 15초 타이머 로직 유지
  }
});
```

**`GameEngine.forcePlayerLeave(playerId)` 추가:**
- 베팅 phase 중이면 자동 다이 처리 (기존 `betAction({type: 'die'})` 로직 재활용)
- 비 베팅 phase이면 `isAlive = false` 설정

**클라이언트 토스트 (D-16):**
```typescript
// RoomPage.tsx에서 'player-left' 이벤트 수신 시:
socket.on('player-left', ({ playerId, nickname }) => {
  if (nickname) toast(`${nickname}님 연결이 끊어졌습니다`);
});
```
현재 `player-left` 이벤트의 payload에 `nickname` 필드가 없음 → `ServerToClientEvents` 타입과 핸들러에 추가 필요.

### 패턴 6: 올인 POT 정산 (ALLIN-POT)

**올인 트리거 조건 (D-20):**
- 상대 레이즈 > 내 잔액 → 콜 시 자동 올인
- `effectiveMaxBet`이 이미 구현되어 있으므로: `player.chips < currentBetAmount + raiseAmount` 일 때 콜하면 올인

**isAllIn 플래그 추가:**
```typescript
// PlayerState에 추가:
isAllIn?: boolean;  // 올인 상태 (베팅 패널 비활성화 대상)
totalCommitted?: number; // 이번 판 전체 기여 총액 (앤티 포함)
```

**올인 판별 로직 (bet-action 핸들러):**
```typescript
// 콜 처리 시:
if (action.type === 'call') {
  const callAmount = Math.min(player.chips, state.currentBetAmount - player.currentBet);
  if (callAmount >= player.chips) {
    // 올인
    player.isAllIn = true;
  }
}
```

**정산 알고리즘 (settleChips 수정, D-22):**

올인 정산은 포커의 사이드팟과 동일한 수학을 사용한다.

```typescript
private settleChipsWithAllIn(): void {
  // 올인 플레이어가 없으면 기존 settleChips() 호출
  const allInPlayers = this.state.players.filter(p => p.isAllIn && p.isAlive);
  if (allInPlayers.length === 0) {
    this.settleChips();
    return;
  }

  if (!this.state.winnerId) return;
  const winner = this.state.players.find(p => p.id === this.state.winnerId);
  if (!winner) return;

  if (winner.isAllIn) {
    // 올인 승리자는 자신의 총 기여액만큼 각 플레이어에게서 비례 수령
    const winnerContribution = winner.totalCommitted ?? winner.totalBet;
    let winnerReceives = 0;

    for (const p of this.state.players) {
      const pContribution = p.totalCommitted ?? p.totalBet;
      const from = Math.min(pContribution, winnerContribution);
      winnerReceives += from;
    }

    // 나머지 pot은 2등(살아남은 플레이어 중 다음 최강패)에게 반환
    const refund = this.state.pot - winnerReceives;
    winner.chips += winnerReceives;

    if (refund > 0) {
      // 2등: 다이하지 않은 플레이어 중 winnerId 제외 1명에게 반환
      // 섯다는 단순 2인 구조가 대부분이므로 나머지 생존자에게 반환
      const runners = this.state.players.filter(
        p => p.isAlive && p.id !== this.state.winnerId
      );
      if (runners.length === 1) {
        runners[0].chips += refund;
      } else if (runners.length > 1) {
        // 여러 생존자 → 기여비례 반환 (복잡한 edge case)
        // 단순 처리: 첫 번째 생존자에게 전액 (다자 올인 시나리오는 희귀)
        runners[0].chips += refund;
      }
    }
  } else {
    // 비올인 플레이어 승리: 기존 정산 그대로
    this.settleChips();
  }
  this._updateChipBreakdowns();
}
```

**베팅 패널 비활성화 (D-21):**
```typescript
// BettingPanel.tsx 또는 RoomPage.tsx에서:
const isMyAllIn = gameState.players.find(p => p.id === myPlayerId)?.isAllIn;
// isMyAllIn이 true이면 BettingPanel을 렌더링하지 않거나 disabled 처리
```

**totalCommitted 추적:**
- `attendSchool()` 시 500원 기여 → `p.totalCommitted += 500`
- `betAction()` 시 베팅액 기여 → `p.totalCommitted += amount`
- `nextRound()`에서 `totalCommitted = 0` 리셋

---

## Don't Hand-Roll

| 문제 | 직접 구현 금지 | 사용할 것 | 이유 |
|------|--------------|----------|------|
| 토스트 알림 | 커스텀 overlay/div | `sonner` (`toast()` 함수) | 이미 프로젝트에 설치됨, RoomPage에서 사용 중 |
| 채팅 UI 스크롤 | 커스텀 scroll tracker | `useRef` + `scrollIntoView({ behavior: 'smooth' })` | 표준 DOM API면 충분 |
| 게임 이력 모달 | 커스텀 modal | `@radix-ui/react-dialog` (이미 설치됨) | shadcn Dialog 이미 사용 중 |
| Socket.IO 채팅 broadcast | 직접 WebSocket 관리 | `io.to(roomId).emit()` | 기존 패턴과 동일 |
| 올인 정산 | 복잡한 사이드팟 트리 | `totalCommitted` 단순 비례 정산 | D-23 "단일 POT 표시" — Main/Side pot 분리 불필요 |
| Observer 게임 상태 전달 | 별도 스냅샷 시스템 | 기존 `getStateFor()` + `game-state` emit | join-room 핸들러에 이미 구현됨(L160-165) |

---

## Common Pitfalls

### Pitfall 1: disconnect 타이머와 재접속 ID 충돌
**무슨 일이 일어나는가:** disconnect 후 30초 타이머가 만료되기 전에 재접속하면, 재접속 시 새 소켓 ID가 생성된다. 기존 `joinRoom`이 nickname으로 `existing.id = playerId` 갱신하므로 기존 소켓 ID가 사라진다. 타이머 만료 시 `leaveRoom(oldSocketId)`가 호출되지만 플레이어를 찾을 수 없어 no-op.
**이유:** 이미 대기실에서 같은 패턴으로 설계되어 있음 (waitingDisconnectTimers, L562-577 코드 주석 참조)
**예방:** 게임 중 disconnect 타이머도 동일 패턴 그대로 사용하면 됨. 재접속 시 자동 no-op 보장.

### Pitfall 2: GameEngine과 RoomManager의 players 배열 불일치
**무슨 일이 일어나는가:** Observer 자동 합류 시 RoomManager에서 `isObserver = false`로 변경하지만, GameEngine은 독립적인 `PlayerState[]`를 갖고 있어 동기화가 안 됨.
**이유:** GameEngine 생성자가 `RoomPlayer[]`를 받아 자체 `PlayerState[]`로 변환하고 이후 독립적으로 관리함.
**예방:** Observer 합류는 반드시 `next-round` 핸들러에서 처리. 새 GameEngine을 재생성하거나, GameEngine에 `addPlayer()` 메서드를 추가할 때 `PlayerState` 전체를 초기화하는 방식으로 처리. 새 GameEngine 재생성이 더 안전하다.

### Pitfall 3: 채팅 메시지가 gameStore를 오염시킴
**무슨 일이 일어나는가:** 채팅 메시지를 GameState 안에 포함시키면 게임 상태 브로드캐스트마다 전체 채팅 이력이 전송되어 페이로드 비대화.
**이유:** game-state 이벤트는 모든 게임 액션(베팅, 카드 배분 등)마다 전송됨.
**예방:** 채팅은 별도 이벤트(`send-chat`, `chat-message`)로 분리. GameState 타입에 chatMessages 절대 추가 금지.

### Pitfall 4: isAllIn 플래그가 nextRound()에서 초기화 안 됨
**무슨 일이 일어나는가:** `nextRound()` 호출 시 `isAllIn`, `totalCommitted` 필드를 리셋하지 않으면 다음 판에도 올인 상태가 유지됨.
**이유:** `nextRound()`가 플레이어 상태를 부분 초기화하는 패턴 사용(L1744-1753)
**예방:** `nextRound()` 플레이어 리셋 루프에 `p.isAllIn = false; p.totalCommitted = 0;` 추가.

### Pitfall 5: 학교 대신 가주기 — 후원자 잔액 부족 시 앤티 처리
**무슨 일이 일어나는가:** 승자가 `proxy-ante`를 신청했지만 다음 판 시작 전에 잔액이 500원 미만이 됨(재충전 없이 베팅으로 소진).
**이유:** `schoolProxies` Map은 result phase에서 설정되고 `attend-school` phase에서 소비됨 — 사이에 잔액 변동 가능성 있음.
**예방:** `attendSchoolProxy()` 메서드에서 sponsor 잔액 체크. 부족 시 대납 취소하고 beneficiary가 직접 납부. 에러 이벤트는 발생시키지 않고 조용히 fallback.

### Pitfall 6: 2인 게임 종료 처리 — GameEngine 상태 정합성
**무슨 일이 일어나는가:** 2인 게임 중 1명이 disconnect되면 GameEngine은 여전히 살아있는 상태. `gamePhase = 'waiting'`으로 전환하면서 `gameEngines.delete(roomId)`를 해야 함. 그런데 GameEngine에 진행 중인 베팅이나 showdown이 있으면 정산 없이 삭제됨.
**이유:** D-18 스펙이 "남은 1명이 방장 대기 화면으로 전환"만 명시 — 미완료 판 정산은 명시 안 됨.
**예방:** disconnect 타이머 만료 시 게임 진행 phase(betting/showdown)이면 먼저 `forcePlayerLeave()` 호출하여 자동 승리 정산 후 result phase 진입. 이후 2인 체크하여 WaitingRoom 전환.

### Pitfall 7: Observer의 getStateFor() 마스킹
**무슨 일이 일어나는가:** Observer는 `getStateFor(observerId)`를 호출하지만, Observer의 ID가 GameEngine의 `players` 배열에 없어 마스킹 로직이 오작동할 수 있음.
**이유:** `getStateFor(pid)`가 players 배열에서 해당 pid를 찾아 처리하는데, Observer ID는 RoomPlayer에는 있지만 GameEngine.PlayerState에는 없음.
**예방:** Observer에게 `game-state` 전송 시 `engine.getState()`(마스킹 없음)를 보내거나, `getStateFor()`가 알 수 없는 playerId에 대해 인디언 모드가 아닐 경우 안전하게 처리하도록 확인.

---

## Code Examples

### 채팅 이벤트 타입 추가
```typescript
// packages/shared/src/types/protocol.ts 수정

// ClientToServerEvents에 추가:
'send-chat': (data: { roomId: string; text: string }) => void;
'proxy-ante': (data: { roomId: string; beneficiaryIds: string[] }) => void;

// ServerToClientEvents에 추가:
'chat-message': (data: { playerId: string; nickname: string; text: string; timestamp: number }) => void;
'chat-history': (data: { messages: ChatMessage[] }) => void;  // 입장 시 1회 전송
'proxy-ante-applied': (data: { sponsorNickname: string; beneficiaryNickname: string }) => void;

// player-left에 nickname 추가:
'player-left': (data: { playerId: string; newHostId?: string; nickname?: string }) => void;
```

### ChatPanel.tsx 스크롤 자동 이동
```typescript
// 최신 메시지로 스크롤
const bottomRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// JSX
<div className="overflow-y-auto flex-1">
  {messages.map(msg => <ChatBubble key={msg.timestamp} msg={msg} isMe={msg.playerId === myPlayerId} />)}
  <div ref={bottomRef} />
</div>
```

### 올인 정산 totalCommitted 추적
```typescript
// game-engine.ts — attendSchool() 수정:
p.totalCommitted = (p.totalCommitted ?? 0) + 500;

// betAction() 수정 (call/raise 처리 부분):
player.totalCommitted = (player.totalCommitted ?? 0) + actualAmount;
```

### Observer 자동 합류 (next-round 핸들러)
```typescript
// index.ts — next-round 핸들러
socket.on('next-round', ({ roomId }) => {
  try {
    const engine = getEngine(roomId);
    engine.nextRound();
    
    // Observer → 일반 플레이어 자동 합류
    const room = roomManager.getRoom(roomId)!;
    const observers = room.players.filter(p => p.isObserver);
    if (observers.length > 0) {
      observers.forEach(p => {
        p.isObserver = false;
        p.chips = p.observerChips ?? 0;
        p.observerChips = undefined;
        // GameEngine에는 nextRound() 이후 재생성 시 포함
      });
      // Observer 합류 시 GameEngine 재생성
      const currentEngine = getEngine(roomId);
      const currentState = currentEngine.getState();
      const newEngine = new GameEngine(
        roomId,
        room.players,
        currentState.mode,
        currentState.roundNumber,
      );
      gameEngines.set(roomId, newEngine);
    }
    
    const updatedEngine = getEngine(roomId);
    io.to(roomId).emit('room-state', room);
    io.to(roomId).emit('game-state', updatedEngine.getState() as GameState);
  } catch (err: any) {
    socket.emit('game-error', { code: err.message, message: err.message });
  }
});
```

---

## Runtime State Inventory

> 이 Phase는 rename/refactor가 아닌 기능 추가이므로 대부분 해당 없음.

| 카테고리 | 발견 항목 | 필요 조치 |
|---------|---------|---------|
| Stored data | 인메모리 Map만 사용, DB 없음 | 없음 |
| Live service config | 없음 | 없음 |
| OS-registered state | 없음 | 없음 |
| Secrets/env vars | 없음 | 없음 |
| Build artifacts | 없음 | 없음 |

---

## Environment Availability

> Phase 11은 기존 Node.js + Socket.IO 서버 실행 환경과 동일. 신규 외부 의존성 없음.

Step 2.6: SKIPPED (기존 스택 그대로 — 신규 외부 의존성 없음)

---

## State of the Art

| 구 방식 | 현재 방식 | 변경 시점 | 영향 |
|---------|---------|---------|------|
| 게임 중 disconnect 즉시 퇴장 | 30초 타이머 후 퇴장 | Phase 11 신규 | 재접속 창 제공 |
| Observer 미지원 (GAME_IN_PROGRESS) | isObserver 플래그로 관람 후 자동 합류 | Phase 11 신규 | 늦게 오는 친구도 다음 판부터 참여 가능 |
| ChatPanel placeholder | 실제 텍스트 채팅 | Phase 11 신규 | 게임 내 소통 가능 |

---

## Open Questions

1. **Observer GameEngine 재생성 vs addPlayer() 메서드**
   - 알고 있는 것: GameEngine 생성자가 RoomPlayer[]를 받아 PlayerState[]로 변환
   - 불확실한 것: 재생성 시 GameEngine의 내부 private 상태(`_bettingActed` Set, `cutterPlayerId` 등)가 `nextRound()` 이후 초기화된 상태이므로 재생성에 문제 없음
   - 권장: `next-round` 핸들러에서 엔진 재생성 — 가장 단순하고 안전

2. **isAllIn 플레이어가 이미 베팅 완료된 상태에서 후속 레이즈 발생 시 베팅 순환 처리**
   - 알고 있는 것: `_bettingActed` Set 기반 베팅 완료 추적이 이미 구현됨
   - 불확실한 것: 올인 플레이어는 `_bettingActed`에 포함되어 있으므로 레이즈 후 재순환 시 올인 플레이어 차례를 건너뛰어야 함
   - 권장: `betAction()` 내 `nextBettingPlayer()` 로직에서 `isAllIn` 플레이어 스킵 조건 추가

3. **다중 올인 플레이어 정산 (3명 이상 올인, 각기 다른 금액)**
   - 알고 있는 것: D-23 "단일 POT 표시" — Main/Side pot 분리 불필요
   - 불확실한 것: 3명 모두 다른 금액으로 올인된 경우 정확한 수령액 계산은 포커 사이드팟 알고리즘 필요
   - 권장: 섯다는 2~6인 게임이지만 다중 올인 시나리오는 드물다. `totalCommitted` 비례 단순 계산으로 구현하되, 나머지 잉여분은 기여액이 가장 큰 생존자에게 반환하는 방식으로 단순화.

---

## Validation Architecture

> `.planning/config.json` nyquist_validation 설정에 따름. 기존 vitest 인프라 사용.

### 테스트 프레임워크
| 속성 | 값 |
|------|---|
| Framework | vitest ^3 |
| Config | packages/server/package.json `"test": "vitest run"` |
| Quick run | `pnpm --filter @sutda/server test` |
| Full suite | `pnpm test` (root turbo test) |

### Phase Requirements → 테스트 매핑
| 요구사항 ID | 동작 | 테스트 타입 | 자동화 명령 | 파일 존재 여부 |
|------------|------|-----------|-----------|--------------|
| UX-02 | 채팅 메시지 broadcast | 통합 | `pnpm --filter @sutda/server test -- --grep "chat"` | ❌ Wave 0 |
| HIST-01 | nextRound 후 이력 항목 생성 | 단위 | `pnpm --filter @sutda/server test -- --grep "history"` | ❌ Wave 0 |
| SCHOOL-PROXY | proxy-ante 후 앤티 대납 | 단위 | `pnpm --filter @sutda/server test -- --grep "proxy"` | ❌ Wave 0 |
| LATE-JOIN | Observer 플래그 및 자동 합류 | 통합 | `pnpm --filter @sutda/server test -- --grep "observer"` | ❌ Wave 0 |
| SESSION-END | 30초 타이머 후 강제 퇴장 | 통합 | `pnpm --filter @sutda/server test -- --grep "session"` | ❌ Wave 0 |
| ALLIN-POT | 올인 정산 비례 계산 | 단위 | `pnpm --filter @sutda/server test -- --grep "allin"` | ❌ Wave 0 |

### Sampling Rate
- **태스크 커밋마다:** `pnpm --filter @sutda/server test`
- **웨이브 머지마다:** `pnpm test`
- **Phase gate:** Full suite green 후 `/gsd:verify-work`

### Wave 0 필요 테스트
- [ ] `packages/server/src/__tests__/chat.test.ts` — UX-02 커버
- [ ] `packages/server/src/__tests__/game-history.test.ts` — HIST-01/02 커버
- [ ] `packages/server/src/__tests__/school-proxy.test.ts` — SCHOOL-PROXY 커버
- [ ] `packages/server/src/__tests__/observer.test.ts` — LATE-JOIN 커버
- [ ] `packages/server/src/__tests__/session-end.test.ts` — SESSION-END 커버
- [ ] `packages/server/src/game-engine.test.ts`에 올인 정산 케이스 추가 — ALLIN-POT 커버 (파일 기존 존재, ❌→추가)

---

## Sources

### Primary (HIGH confidence)
- 코드베이스 직접 분석:
  - `packages/server/src/index.ts` — disconnect 핸들러, handleGameAction 패턴, join-room 재접속 로직
  - `packages/server/src/game-engine.ts` — settleChips(), effectiveMaxBet, nextRound() 리셋 패턴
  - `packages/server/src/room-manager.ts` — leaveRoom(), disconnectPlayer(), joinRoom() 재접속
  - `packages/shared/src/types/protocol.ts` — 현재 이벤트 목록
  - `packages/shared/src/types/game.ts` — PlayerState, GameState 타입
  - `.planning/phases/11-social-features/11-CONTEXT.md` — D-01~D-24 결정사항
- Socket.IO 4.x 공식 패턴: `io.to(roomId).emit()`, `io.in(roomId).fetchSockets()` — 기존 코드에서 사용 중으로 검증됨

### Secondary (MEDIUM confidence)
- Phase 5 칩 정산 패턴: `effectiveMaxBet` 구현이 올인 상한 계산의 기반. 코드 직접 확인.
- Sonner toast 패턴: `packages/client/src/pages/RoomPage.tsx`에서 `toast.error()` 사용 중 확인.
- `@radix-ui/react-dialog`: `packages/client/package.json`에서 설치 확인.

### Tertiary (LOW confidence)
- 다중 올인 플레이어 정산 알고리즘: 포커 사이드팟 이론 기반으로 도출. 섯다 특수 케이스는 별도 검증 필요.

---

## Metadata

**신뢰도 분석:**
- Standard Stack: HIGH — 기존 스택 그대로, 신규 패키지 없음
- Architecture: HIGH — 코드베이스 직접 분석 + CONTEXT.md 결정사항 기반
- Pitfalls: HIGH — 기존 disconnect 타이머 패턴, GameEngine/RoomManager 분리 구조에서 직접 도출
- 다중 올인 정산: MEDIUM — 단순 비례 계산으로 단순화, edge case는 Open Questions에 표시

**조사일:** 2026-04-01
**유효 기간:** 30일 (라이브러리 업그레이드 없는 경우)
