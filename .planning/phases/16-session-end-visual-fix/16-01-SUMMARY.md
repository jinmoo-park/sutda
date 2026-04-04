---
phase: 16-session-end-visual-fix
plan: "01"
subsystem: api
tags: [socket.io, disconnect, room-state, reconnect]

requires:
  - phase: 11-social-features
    provides: PlayerSeat isConnected prop + opacity-50 시각 표시 구현

provides:
  - disconnect 핸들러 game-playing 분기에서 room-state emit — 클라이언트 roomState.players[i].isConnected 갱신 데이터 흐름 완성

affects:
  - 16-session-end-visual-fix (16-02 VERIFICATION.md 작성)

tech-stack:
  added: []
  patterns:
    - "disconnectPlayer() 직후 getRoom()으로 업데이트된 room 획득 후 null check emit (io.to(roomId).emit('room-state', updatedRoom))"

key-files:
  created: []
  modified:
    - packages/server/src/index.ts

key-decisions:
  - "getRoom() 반환 undefined 방어를 위해 updatedRoomAfterDisconnect 변수 + null check guard 사용 (Rule 1 auto-fix)"

patterns-established:
  - "game-playing disconnect 분기: disconnectPlayer() -> getRoom() null check -> room-state emit 순서"

requirements-completed:
  - SESSION-END

duration: 5min
completed: 2026-04-04
---

# Phase 16 Plan 01: SESSION-END disconnect room-state emit 추가 Summary

**게임 중 플레이어 disconnect 시 서버가 즉시 room-state를 broadcast하여 다른 클라이언트의 PlayerSeat opacity-50 재접속 대기 시각 표시가 정상 동작하도록 데이터 흐름 완성**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-04T07:15:00Z
- **Completed:** 2026-04-04T07:20:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- `packages/server/src/index.ts` disconnect 핸들러 game-playing 분기에 `room-state` emit 1줄 추가
- `roomManager.disconnectPlayer()` 직후 `io.to(roomId).emit('room-state', updatedRoom)` 호출로 클라이언트 roomState 즉시 갱신
- TypeScript 빌드 (`pnpm --filter server build`) 성공 확인

## Task Commits

각 태스크는 원자적으로 커밋되었습니다:

1. **Task 1: disconnect 핸들러 game-playing 분기에 room-state emit 추가** - `4706b35` (feat)

**Plan metadata:** (이후 docs 커밋에서 기록)

## Files Created/Modified

- `packages/server/src/index.ts` - disconnect 핸들러 game-playing 분기 808번 라인 직후 2줄 추가 (getRoom null check + emit)

## Decisions Made

- `roomManager.getRoom(roomId)` 반환 타입이 `RoomState | undefined`이므로, inline emit 대신 변수 `updatedRoomAfterDisconnect`에 저장 후 null check guard 패턴 적용 (기존 index.ts 전역 패턴과 일치)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript `undefined` 타입 에러 수정**

- **Found during:** Task 1 (서버 빌드 검증)
- **Issue:** `io.to(roomId).emit('room-state', roomManager.getRoom(roomId))` — `getRoom()` 반환 타입 `RoomState | undefined`가 `RoomState` 파라미터에 비호환
- **Fix:** `updatedRoomAfterDisconnect` 변수에 저장 후 `if (updatedRoomAfterDisconnect)` null check guard로 emit
- **Files modified:** `packages/server/src/index.ts`
- **Verification:** `pnpm --filter server build` 성공
- **Committed in:** `4706b35` (Task 1 커밋에 포함)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TypeScript 타입 오류)
**Impact on plan:** 필수 수정사항, 동작 의미 변경 없음. null check는 disconnectPlayer() 직후 room이 사라지는 edge case 방어로 오히려 안전성 향상.

## Issues Encountered

없음 — null check 포함한 패턴으로 1회 수정으로 빌드 성공.

## User Setup Required

없음 — 외부 서비스 설정 불필요.

## Next Phase Readiness

- 16-01 서버 수정 완료 — 데이터 흐름: disconnectPlayer() -> room-state emit -> 클라이언트 roomState 갱신 -> GameTable isConnected prop -> PlayerSeat opacity-50
- 16-02: VERIFICATION.md 작성 (Phase 15 패턴 — 코드 트레이서빌리티 + 구현 증거 문서화)

---
*Phase: 16-session-end-visual-fix*
*Completed: 2026-04-04*
