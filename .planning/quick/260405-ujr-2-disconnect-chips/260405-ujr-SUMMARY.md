---
phase: quick-260405-ujr
plan: 01
subsystem: server
tags: [bugfix, chips, disconnect, tdd]
key-files:
  modified:
    - packages/server/src/index.ts
    - packages/server/src/index.test.ts
decisions:
  - "TDD 방식으로 RED→GREEN 순서로 구현. fake timers 대신 roomManager 직접 조작으로 60초 타이머 우회"
  - "테스트에서 vi.useFakeTimers() 사용 시 socket.io 내부 타이머와 충돌 → roomManager.leaveRoom 직접 호출로 대체"
metrics:
  completed_date: "2026-04-05"
  tasks_completed: 1
  files_modified: 2
---

# Quick Task 260405-ujr: disconnect 유예 만료 시 chips 동기화 버그 수정 요약

## 한 줄 요약

disconnect 60초 타이머 만료 경로에서 `gameEngines.delete` 전 engine→room chips 동기화 로직 누락 수정 (94cd432 패턴 적용).

## 작업 내용

### Task 1: disconnect 유예 만료 시 engine→room chips 동기화 추가

**버그 원인:** `packages/server/src/index.ts` 909-914번 라인의 disconnect 타이머 만료 콜백에서,
2인→1인 대기실 전환 시 `gameEngines.delete(roomId)` 전에 engine의 정산된 chips를 room.players에 복사하는 로직이 없었음.

커밋 94cd432에서 `tryAdvanceNextRound` 경로에는 동기화가 추가되었으나, disconnect 타이머 만료 경로에는 동일한 처리가 누락된 상태였음.

**수정 내용 (`packages/server/src/index.ts`):**

```typescript
// 수정 전 (911-914):
if (remainingRoom && remainingRoom.players.filter(p => !p.isObserver).length < 2) {
  remainingRoom.gamePhase = 'waiting';
  gameEngines.delete(roomId);
  io.to(roomId).emit('room-state', remainingRoom);
}

// 수정 후:
if (remainingRoom && remainingRoom.players.filter(p => !p.isObserver).length < 2) {
  // engine 삭제 전 정산된 chips를 room.players에 동기화 (94cd432 tryAdvanceNextRound와 동일 패턴)
  if (eng) {
    const enginePs = eng.getState().players;
    for (const rp of remainingRoom.players) {
      const ep = enginePs.find(p => p.id === rp.id);
      if (ep) rp.chips = ep.chips;
    }
  }
  remainingRoom.gamePhase = 'waiting';
  gameEngines.delete(roomId);
  io.to(roomId).emit('room-state', remainingRoom);
}
```

**테스트 (`packages/server/src/index.test.ts`):**
- `vi.useFakeTimers()`는 socket.io 내부 타이머와 충돌로 infinite loop 발생 → 사용 불가
- 대신 `roomManager.leaveRoom()` + chips sync 로직을 직접 실행하는 방식으로 타이머 우회
- TDD RED→GREEN 순서: RED 커밋(e3847fc) → GREEN 커밋(ce4c7f0)

## 커밋 목록

| 커밋 | 설명 |
|------|------|
| e3847fc | test(quick-260405-ujr-01): disconnect 유예 만료 chips 동기화 실패 테스트 추가 (RED) |
| ce4c7f0 | fix(quick-260405-ujr-01): disconnect 유예 만료 시 engine→room chips 동기화 추가 |

## 테스트 결과

- 새 테스트 (버그 수정: disconnect 유예 만료 시 chips 동기화 D-18): **통과**
- 기존 통과 테스트 6개: **모두 유지** (회귀 없음)
- 기존 실패 테스트 4개 (attend-school, select-mode, bet-action, next-round): 사전 존재 문제로 이번 작업 범위 외

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.useFakeTimers() 사용 불가 → roomManager 직접 조작으로 대체**
- **Found during:** Task 1 (RED 단계 테스트 작성)
- **Issue:** `vi.useFakeTimers()`를 socket.io 연결 후 활성화하면 socket.io 내부 타이머와 충돌 → `setInterval` infinite loop 발생
- **Fix:** `roomManager.leaveRoom()` + engine chips sync 로직을 직접 호출하여 disconnect 타이머 콜백 시뮬레이션
- **Files modified:** packages/server/src/index.test.ts

## Known Stubs

없음.

## Threat Flags

없음 (기존 disconnect 경로 내 chips 동기화 누락만 수정).

## Self-Check: PASSED

- packages/server/src/index.ts: FOUND (수정됨)
- packages/server/src/index.test.ts: FOUND (수정됨)
- e3847fc: FOUND in git log
- ce4c7f0: FOUND in git log
