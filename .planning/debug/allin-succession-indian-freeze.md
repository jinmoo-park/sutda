---
status: awaiting_human_verify
trigger: "Bug 1: 올인 후 방장 승계/기리 순서 꼬임 | Bug 2: 인디언섯다 베팅 도중 게임 멈춤"
created: 2026-04-05T00:00:00Z
updated: 2026-04-05T01:30:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: (확정) 두 버그 모두 index.ts next-round 핸들러에서 broke 플레이어 kick 후 engine.state.players의 seatIndex가 갱신되지 않아 발생
test: 수정 완료 (1줄 추가), TypeScript 빌드 clean 확인
expecting: 다음 판 딜러 선출/기리/베팅 순서가 모두 정상 동작
next_action: 사용자 실환경 검증 대기

## Symptoms

### Bug 1
expected: 올인 후 방장이 나갔을 때 올바른 순서로 방장 승계, 기리 순서도 정상
actual: 올인 처리 후 방장 승계와 기리(족보 비교/순서) 로직이 충돌하여 게임 진행 불가 또는 순서 오류
errors: (알려진 에러 메시지 없음)
reproduction: 올인 베팅 → 칩 0원 플레이어 발생 → next-round 시 kick → 이후 게임 진행 시 발생

### Bug 2
expected: 인디언섯다에서 베팅이 정상적으로 진행됨
actual: 베팅 도중 서버 또는 클라이언트가 다음 상태로 전환하지 않고 멈춤
errors: (알려진 에러 메시지 없음)
reproduction: 올인으로 플레이어 kick → 다음 판 인디언섯다 모드 → 베팅 라운드 진행 중 발생

## Eliminated

- hypothesis: 인디언섯다 고유의 독립적 베팅 버그 (seatIndex 무관)
  evidence: 인디언섯다의 betting-1/betting-2 로직 자체는 정상. seatIndex 깨짐이 없는 환경에서 베팅 flow 문제 없음
  timestamp: 2026-04-05T01:00:00Z

- hypothesis: 방장 승계 자체의 로직 오류
  evidence: room-manager.ts의 leaveRoom()은 올바르게 방장 승계. 문제는 엔진 state와의 seatIndex 불일치
  timestamp: 2026-04-05T01:00:00Z

## Evidence

- timestamp: 2026-04-05T00:30:00Z
  checked: index.ts next-round 핸들러 (lines 629-656)
  found: |
    broke 플레이어 kick 시 roomManager.leaveRoom()이 room.players의 seatIndex를 재정렬(0,1,2...)하지만,
    엔진 state.players는 filter만 수행. 남은 PlayerState 객체들은 old seatIndex 값 유지.
    예: 3인 게임(seat 0,1,2)에서 seat 0 kick → engine players: [seat1, seat2], totalPlayers=2
  implication: 이후 모든 seatIndex 기반 연산이 오동작

- timestamp: 2026-04-05T00:40:00Z
  checked: game-engine.ts _advanceBettingTurn() (lines 1368-1386)
  found: |
    nextSeatIndex = (currentSeatIndex - i + totalPlayers) % totalPlayers
    totalPlayers=2, currentSeatIndex=2 → 탐색 대상 seatIndex: 1, 0
    players에 seatIndex=0인 플레이어 없음 → 다음 플레이어 못 찾음 → 서버사이드 freeze
  implication: Bug 2 서버 원인 확인

- timestamp: 2026-04-05T00:45:00Z
  checked: RoomPage.tsx (line 490-492)
  found: |
    isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId
    배열 인덱스 lookup (NOT find by seatIndex).
    currentPlayerIndex=2이지만 players 배열 length=2 → players[2] === undefined
    → 모든 플레이어 isMyTurn=false → 클라이언트 freeze
  implication: Bug 2 클라이언트 원인 확인 (서버 freeze와 독립적으로도 발생)

- timestamp: 2026-04-05T00:50:00Z
  checked: game-engine.ts nextRound(), shuffle(), _getAlivePlayersInCounterClockwiseOrder()
  found: |
    nextRound(): currentPlayerIndex = winner.seatIndex (renumber 전이면 old 값)
    shuffle(): cutter 계산 시 (dealerSeatIndex+1) % totalPlayers → 잘못된 seatIndex 탐색
    _getAlivePlayersInCounterClockwiseOrder(): for i=1..totalPlayers → 연속되지 않은 seatIndex → 플레이어 누락
  implication: Bug 1의 기리 순서 꼬임 원인 확인

- timestamp: 2026-04-05T01:00:00Z
  checked: 수정 포인트
  found: |
    index.ts engine.state.players filter 직후 1줄 추가:
    (engineState as any).players.forEach((p: any, i: number) => { p.seatIndex = i; });
    이 코드는 filter 후 배열 순서(원래 seatIndex 오름차순 유지)대로 seatIndex를 0부터 재정렬.
    nextRound()는 이 이후에 호출되므로 winner.seatIndex도 새 값을 사용.
  implication: 단 1줄 수정으로 두 버그 모두 해결

- timestamp: 2026-04-05T01:20:00Z
  checked: TypeScript 빌드 (pnpm --filter server build)
  found: 빌드 clean (에러 없음)
  implication: 타입 오류 없음

## Resolution

root_cause: |
  index.ts next-round 핸들러에서 칩 0원 플레이어(올인 패자)를 kick할 때,
  roomManager.leaveRoom()은 room.players의 seatIndex를 0부터 재정렬하지만,
  engine의 state.players는 단순 filter만 수행하여 남은 PlayerState 객체들이
  old seatIndex 값(비연속)을 유지함.

  이로 인해:
  1. _advanceBettingTurn()의 모듈러 산술이 존재하지 않는 seatIndex를 탐색하여 다음 플레이어를 못 찾음 → 서버 freeze
  2. 클라이언트 RoomPage의 players[currentPlayerIndex] 배열 인덱스 룩업이 undefined 반환 → 클라이언트 freeze
  3. 기리(카드 배분) 순서, 다음 생존자 찾기 등 모든 seatIndex 기반 연산이 오동작

fix: |
  packages/server/src/index.ts: engine.state.players filter 직후 seatIndex 재정렬 1줄 추가
  
  (engineState as any).players.forEach((p: any, i: number) => { p.seatIndex = i; });

verification: |
  - TypeScript 빌드 clean 확인
  - 사용자 실환경 검증 대기 중

files_changed:
  - packages/server/src/index.ts
