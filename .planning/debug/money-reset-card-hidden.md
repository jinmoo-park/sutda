---
status: awaiting_human_verify
trigger: "Bug 1: 게임 중 신규 플레이어가 들어오면 모든 플레이어의 금액이 초기화됨 / Bug 2: 특정 플레이어 카드가 안 보이고 입력이 모두 막히는 버그"
created: 2026-04-05T00:00:00Z
updated: 2026-04-05T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: 
  Bug 1 CONFIRMED: room.players[i].chips는 초기 입장 금액에서 변경되지 않음. new GameEngine 호출 시 이 값으로 모든 플레이어 칩이 리셋됨.
  Bug 2 CONFIRMED: 플레이어 재접속 시 새 socket.id로 myPlayerId 갱신되지만 visibleCardCounts에는 구 socket.id가 키로 남아있어 visibleCardCounts[newId] ?? 0 = 0이 됨 → HandPanel에 카드 0장 표시. 또한 seatIndex 재정렬 없이 engine.state.players를 filter하면 currentPlayerIndex(seatIndex)가 배열 인덱스와 불일치 → isMyTurn = gameState.players[currentPlayerIndex]?.id가 undefined → 베팅 불가.
test: 코드 수정 및 검증
expecting: fix 적용 후 금액 유지 + 카드 정상 표시
next_action: 수정 파일 작성

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

### Bug 1: 금액 초기화
expected: 게임 중 새 플레이어가 참가해도 기존 플레이어들의 금액은 유지되어야 함
actual: 신규 플레이어 입장 시 모든 플레이어 금액이 초기값으로 리셋됨
errors: (없음, 조용히 리셋됨)
reproduction: 게임 진행 중 새 사용자가 방에 입장
started: 불명확

### Bug 2: 카드 비표시 및 입력 차단
expected: 모든 플레이어가 자신의 카드를 볼 수 있고 입력 가능해야 함
actual: 특정 플레이어의 카드가 표시되지 않고, 그 플레이어는 베팅/액션 버튼 모두 비활성화
errors: (없음)
reproduction: 게임 진행 중 어느 시점에 발생 (재현 조건 불명확)
started: 불명확

## Eliminated
<!-- APPEND only - prevents re-investigating -->

(없음)

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-05T00:30:00Z
  checked: packages/server/src/index.ts — Observer 합류 시 new GameEngine 생성 코드 (line 685)
  found: new GameEngine(roomId, room.players.filter(p => !p.isObserver), ...) 호출 시 room.players[i].chips가 초기 입장값(initialChips) 그대로임. 게임 중 칩 변동은 engine.state.players[i].chips에만 반영되고, room.players에는 절대 역전사되지 않음.
  implication: Bug 1 근본 원인 확정. 수정: new GameEngine 호출 전에 room.players[i].chips를 engine.getState()에서 동기화해야 함.

- timestamp: 2026-04-05T00:30:00Z
  checked: packages/client/src/pages/RoomPage.tsx — visibleCardCounts 관리 로직 (line 668-670)
  found: HandPanel visibleCardCount = (visibleCardCounts[myPlayerId ?? ''] ?? 0). visibleCardCounts가 비어있지 않은데 myPlayerId 키가 없으면 0으로 폴백됨. 재접속 시 myPlayerId는 새 socket.id로 갱신되지만 visibleCardCounts는 이전 socket.id(딜링 애니메이션 시점의 ID)로 채워져 있음.
  implication: Bug 2 카드 불표시 부분 근본 원인. 수정: visibleCardCounts lookup 시 playerId → nickname 기반 fallback 또는 초기화 로직 필요.

- timestamp: 2026-04-05T00:30:00Z
  checked: packages/client/src/pages/RoomPage.tsx line 488-490
  found: isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId. currentPlayerIndex는 seatIndex값이지만 배열 인덱스로 사용됨. 칩0 플레이어 강퇴 후 engine.state.players가 filter되면 seatIndex에 gap이 생겨 gameState.players[2]가 undefined가 될 수 있음.
  implication: Bug 2 버튼 차단 부분 근본 원인. isMyTurn이 false가 되어 BettingPanel.emitAction이 early-return. 수정: isMyTurn 계산 시 find(p => p.seatIndex === currentPlayerIndex)로 변경 필요.

- timestamp: 2026-04-05T00:30:00Z
  checked: packages/server/src/index.ts line 651-656 — broke player 퇴장 후 engine players filter
  found: (engineState as any).players = engineState.players.filter(p => activePlayers.some(rp => rp.id === p.id)). seatIndex 재정렬 없이 filter만 함. leaveRoom은 room.players seatIndex를 재정렬하지만 engine players에는 반영 안 됨.
  implication: seatIndex gap 발생 → currentPlayerIndex 불일치 → Bug 2 간접 원인.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  [Bug 1] packages/server/src/index.ts — Observer → 일반 플레이어 승격 시 new GameEngine 호출 전에
  room.players[i].chips를 engine.state.players[i].chips와 동기화하지 않아, 모든 플레이어 칩이
  최초 입장 금액(initialChips)으로 리셋됨. (게임 중 칩 변동은 engine.state에만 반영됨)

  [Bug 2-A] packages/client/src/pages/RoomPage.tsx line 490-492 — isMyTurn 계산 시
  gameState.players[currentPlayerIndex] 로 배열 인덱스 접근했지만, currentPlayerIndex는 seatIndex 값.
  칩0 플레이어 퇴장 후 engine player array filter 시 seatIndex gap이 생겨 배열 인덱스 ≠ seatIndex.
  → isMyTurn이 잘못 계산되어 BettingPanel 버튼이 blocked.

  [Bug 2-B] packages/client/src/pages/RoomPage.tsx line 671 — HandPanel visibleCardCount 계산 시
  visibleCardCounts[myPlayerId] ?? 0 으로 폴백. 재접속 시 myPlayerId는 새 socket.id지만
  visibleCardCounts는 딜링 애니메이션 시점의 구 socket.id로 채워져 있어 카드 0장 표시.

fix: |
  [Bug 1] packages/server/src/index.ts: new GameEngine 호출 직전 room.players[i].chips를
  engine.getState().players에서 동기화하는 코드 추가.

  [Bug 2-A] packages/client/src/pages/RoomPage.tsx + GameTable.tsx: isMyTurn / isCurrentTurn 계산 시
  배열 인덱스 대신 p.seatIndex === currentPlayerIndex 로 변경.

  [Bug 2-B] packages/client/src/pages/RoomPage.tsx: visibleCardCounts lookup 시 키 존재 여부
  먼저 확인(in 연산자), 없으면 0 대신 undefined 반환.

verification: 빌드 성공 (tsc + vite build). 런타임 검증 대기.
files_changed:
  - packages/server/src/index.ts
  - packages/client/src/pages/RoomPage.tsx
  - packages/client/src/components/layout/GameTable.tsx
