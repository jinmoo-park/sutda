---
phase: 04-original-mode-game-engine
plan: "03"
subsystem: server
tags: [socket.io, game-engine, integration, websocket]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [game-socket-integration]
  affects: [client-ui-phase]
tech_stack:
  added: []
  patterns: [GameEngine-Map, handleGameAction-helper, typed-socket-events]
key_files:
  created:
    - packages/server/src/index.test.ts
  modified:
    - packages/server/src/index.ts
    - packages/shared/src/types/protocol.ts
decisions:
  - "handleGameAction 헬퍼 패턴: 액션 실행 후 game-state 브로드캐스트 + 에러 시 game-error 개별 전송"
  - "gameEngines Map을 export하여 테스트에서 직접 접근 가능"
  - "next-round 이벤트를 protocol.ts ClientToServerEvents에 추가"
metrics:
  duration_minutes: 12
  completed_date: "2026-03-29"
  tasks_completed: 1
  files_created: 1
  files_modified: 2
---

# Phase 04 Plan 03: Socket.IO 게임 이벤트 핸들러 통합 Summary

## 한 줄 요약

Socket.IO 서버에 GameEngine Map을 연결하고, 9개 게임 이벤트(attend-school, select-mode, shuffle, cut, declare-ttong, bet-action, reveal-card, next-round, select-dealer-card) 핸들러를 추가하여 클라이언트 액션을 GameEngine 메서드로 전달하고 game-state를 브로드캐스트한다.

## 완료된 태스크

| 태스크 | 설명 | 커밋 | 주요 파일 |
|--------|------|------|-----------|
| Task 1 | Socket.IO 게임 이벤트 핸들러 연결 + 통합 테스트 | a78cf30 | index.ts, index.test.ts, protocol.ts |

## 구현 내용

### index.ts 변경사항

1. `GameEngine` import 추가
2. `gameEngines: Map<string, GameEngine>` 선언 및 export
3. `start-game` 핸들러 수정 -- `new GameEngine(roomId, room.players, 'original', 1)` 생성 후 `game-state` 브로드캐스트
4. `handleGameAction` 헬퍼 함수 추가 -- 액션 실행 후 `io.to(roomId).emit('game-state')` / 에러 시 `socket.emit('game-error')`
5. 9개 게임 이벤트 핸들러 추가:
   - `select-dealer-card` → `engine.selectDealerCard()`
   - `attend-school` → `engine.attendSchool()`
   - `select-mode` → `engine.selectMode()` (모드 하드코딩 없음, D-01 부합)
   - `shuffle` → `engine.shuffle()`
   - `cut` → `engine.cut()`
   - `declare-ttong` → `engine.declareTtong()`
   - `bet-action` → `engine.processBetAction()`
   - `reveal-card` → `engine.revealCard()`
   - `next-round` → `engine.nextRound()`
6. `ERROR_MESSAGES`에 게임 에러 코드 6종 추가

### protocol.ts 변경사항

- `ClientToServerEvents`에 `'next-round': (data: { roomId: string }) => void` 추가

### index.test.ts (신규 생성)

6개 통합 테스트:
1. `start-game 후 game-state 이벤트 수신 및 dealer-select phase 확인`
2. `attend-school 이벤트로 등교 처리 및 pot 증가 확인`
3. `select-mode 이벤트로 모드 선택 및 shuffling phase 전환 확인`
4. `잘못된 phase에서 액션 시 game-error 수신 (INVALID_PHASE)`
5. `bet-action 이벤트로 베팅 처리`
6. `next-round 이벤트로 다음 판 시작 및 roundNumber 증가 확인`

## 결정 사항

- `handleGameAction` 헬퍼 패턴: try-catch로 GameEngine 메서드 호출, 성공 시 `io.to(roomId).emit('game-state')`, 실패 시 `socket.emit('game-error', { code, message })`
- `gameEngines` Map을 export하여 테스트에서 직접 engine state 접근 가능 (next-round 테스트에서 result phase 강제 설정)
- `start-game`에서 `mode='original'`은 초기값일 뿐, 실제 모드는 `select-mode` 이벤트 플로우를 통해 결정됨 (D-01, MODE-OG-01 부합)

## 플랜 대비 편차

### 자동 수정 이슈

없음 -- 플랜대로 정확히 실행됨.

단, 테스트 로직에서 dealer 판별 방식을 개선:
- 초기 구현에서 `Promise.race`가 `mode-select` 단계의 game-state를 먼저 받아 테스트 실패
- dealer가 누구인지 런타임에 동적으로 감지하도록 `game-error` + `game-state` 이벤트 리스너 패턴으로 수정 (Rule 1: 버그 자동 수정)

## 검증 결과

```
pnpm --filter @sutda/server test
  ✓ src/room-manager.test.ts (19 tests)
  ✓ src/game-engine.test.ts (59 tests)
  ✓ src/integration.test.ts (5 tests)
  ✓ src/index.test.ts (6 tests)
  Tests: 89 passed

pnpm --filter @sutda/shared test
  ✓ 4 test files, 96 tests passed

전체: 185 tests passed
```

## Known Stubs

없음.

## Self-Check: PASSED

- packages/server/src/index.ts: 존재 확인
- packages/server/src/index.test.ts: 존재 확인
- packages/shared/src/types/protocol.ts: next-round 이벤트 추가 확인
- 커밋 a78cf30: 존재 확인
