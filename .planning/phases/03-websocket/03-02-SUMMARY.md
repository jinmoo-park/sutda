---
phase: 03-websocket
plan: "02"
subsystem: server-testing
tags: [vitest, unit-test, integration-test, socket.io, room-manager]
dependency_graph:
  requires: ["03-01"]
  provides: ["server-unit-tests", "server-integration-tests"]
  affects: ["packages/server"]
tech_stack:
  added: ["socket.io-client@4.8.3"]
  patterns: ["vitest unit test", "Socket.IO integration test with test server", "Promise-based async test patterns"]
key_files:
  created:
    - packages/server/vitest.config.ts
    - packages/server/src/room-manager.test.ts
    - packages/server/src/integration.test.ts
  modified:
    - packages/server/package.json
    - packages/server/src/index.ts
decisions:
  - "vitest globals:true로 설정하여 describe/it/expect를 import 없이 사용 가능"
  - "통합 테스트에서 httpServer.listen(0)으로 OS가 빈 포트를 할당하여 포트 충돌 방지"
  - "beforeAll/afterAll을 Promise 기반으로 구현 (vitest의 done 콜백 미지원)"
  - "다중 클라이언트 테스트에서 Promise.all로 병렬 연결 대기하여 race condition 방지"
  - "index.ts에 NODE_ENV !== test 조건부 listen 추가하여 테스트 중 자동 서버 기동 방지"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_count: 5
---

# Phase 03 Plan 02: 서버 테스트 (단위 + 통합) Summary

## 한 줄 요약

vitest 기반 RoomManager 단위 테스트(19개)와 Socket.IO 통합 테스트(5개)를 작성하여 INFRA-01~06 전체 요건을 자동화된 24개 테스트로 검증한다.

## 완료된 작업

### Task 1: vitest 설정 + RoomManager 단위 테스트

- `packages/server/vitest.config.ts` 생성 — globals/node 환경 설정
- `packages/server/package.json`에 `"test": "vitest run"`, `"test:watch": "vitest"` 스크립트 추가
- `packages/server/src/room-manager.test.ts` 생성 — 19개 테스트 케이스:
  - `createRoom`: roomId 8자리, getRoom 조회, roomCount 증가
  - `joinRoom`: 플레이어 추가(INFRA-02), ROOM_NOT_FOUND(INFRA-02), ROOM_FULL 6명 제한(INFRA-03), NICKNAME_TAKEN(D-06), 재접속 복귀(INFRA-05/D-05), GAME_IN_PROGRESS(D-05)
  - `leaveRoom`: seatIndex 재정렬, 방장 승계(D-12), 마지막 플레이어 방 삭제
  - `disconnectPlayer`: isConnected false 설정
  - `canStartGame`: ok/NOT_HOST/MIN_PLAYERS/GAME_IN_PROGRESS
  - `validateChips`: 만원 단위 유효/무효(INFRA-06)

### Task 2: Socket.IO 통합 테스트

- `socket.io-client@4.8.3` devDependency 추가
- `packages/server/src/index.ts` 수정 — `NODE_ENV !== 'test'` 조건부 listen 추가
- `packages/server/src/integration.test.ts` 생성 — 5개 통합 테스트:
  - room-created 이벤트 수신 검증 (INFRA-01)
  - player-joined 이벤트 수신 검증 (INFRA-02)
  - INVALID_CHIPS 에러 수신 검증 (INFRA-06)
  - ROOM_NOT_FOUND 에러 수신 검증
  - 방장 전용 게임 시작 및 NOT_HOST 에러 검증 (D-11)

## 최종 테스트 결과

```
Test Files  2 passed (2)
Tests       24 passed (24)
Duration    722ms
```

## 계획 대비 이탈 사항 (Deviations)

### 자동 수정 이슈

**1. [Rule 1 - Bug] vitest done 콜백 미지원으로 인한 beforeAll 수정**
- 발견 시점: Task 2 실행 중
- 문제: 계획의 `beforeAll((done) => { ... done(); })` 패턴이 vitest에서 `done is not a function` 오류 발생
- 수정: `beforeAll(() => new Promise<void>((resolve) => { ... resolve(); }))` 패턴으로 변경
- 영향 파일: `packages/server/src/integration.test.ts`

**2. [Rule 1 - Bug] 다중 클라이언트 연결 race condition 수정**
- 발견 시점: Task 2 실행 중 (INFRA-02, D-11 테스트 timeout)
- 문제: 순차 연결 대기(`host.on('connect')` 후 `joiner.on('connect')`) 시 두 번째 클라이언트 연결 이벤트가 누락되어 5000ms timeout 발생
- 수정: `Promise.all([host.on('connect'), joiner.on('connect')])` 병렬 대기로 변경
- 영향 파일: `packages/server/src/integration.test.ts`

## Known Stubs

없음 — 모든 테스트가 실제 구현 코드를 테스트한다.

## Self-Check: PASSED

- FOUND: packages/server/vitest.config.ts
- FOUND: packages/server/src/room-manager.test.ts
- FOUND: packages/server/src/integration.test.ts
- FOUND: .planning/phases/03-websocket/03-02-SUMMARY.md
- 24개 테스트 모두 통과 확인됨
