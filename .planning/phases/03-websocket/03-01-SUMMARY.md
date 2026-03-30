---
phase: 03-websocket
plan: 01
subsystem: infra
tags: [socket.io, websocket, room-manager, typescript, shared-types]

# Dependency graph
requires:
  - phase: 01-project-foundation-shared-types
    provides: "shared 패키지 타입 시스템, 모노레포 빌드 파이프라인"
provides:
  - "ClientToServerEvents / ServerToClientEvents Socket.IO 이벤트 타입 계약 (packages/shared)"
  - "RoomState / RoomPlayer 방 상태 타입 (packages/shared)"
  - "RoomManager 클래스 — 방 생성/참여/퇴장/재접속/게임시작 전체 로직 (packages/server)"
  - "타입 안전한 Socket.IO 4.x 서버 진입점 (packages/server/src/index.ts)"
affects:
  - phase-04-game-engine
  - phase-05-chip-system
  - phase-06-client-ui

# Tech tracking
tech-stack:
  added:
    - "socket.io ^4.8.3"
    - "vitest ^3 (devDependency, 테스트 준비)"
    - "@types/node ^25.5.0 (devDependency)"
  patterns:
    - "Socket.IO 제네릭 타입 파라미터 패턴 — Server<C2S, S2C, Inter, SocketData>"
    - "에러는 throw new Error('ERROR_CODE') 문자열로 throw, 핸들러에서 catch 후 emitError"
    - "인메모리 Map<roomId, RoomState> — 소규모 친구 전용 세션 단위 저장"
    - "crypto.randomUUID().slice(0, 8) — 8자리 UUID 기반 방 코드 (D-01)"

key-files:
  created:
    - "packages/shared/src/types/room.ts — RoomState, RoomPlayer 타입"
    - "packages/shared/src/types/protocol.ts — ClientToServerEvents, ServerToClientEvents, ErrorPayload 등"
    - "packages/server/src/room-manager.ts — RoomManager 클래스"
  modified:
    - "packages/shared/src/index.ts — RoomState, RoomPlayer, 프로토콜 타입 export 추가"
    - "packages/server/src/index.ts — Socket.IO 서버 부트스트랩 + 이벤트 핸들러"
    - "packages/server/package.json — socket.io, vitest, @types/node 의존성 추가"

key-decisions:
  - "방 ID: crypto.randomUUID().slice(0, 8) — 짧은 코드보다 충돌 안전성 우선 (D-01, D-03)"
  - "재접속 식별: 닉네임 + 방코드 조합 — localStorage 토큰 불필요 (D-04)"
  - "게임 중 재접속 허용, 대기실 동일 닉네임 차단 (D-05, D-06)"
  - "인메모리 Map 저장 — 소규모 친구 전용, Redis 등 불필요 (D-14)"
  - "방장 승계: 방장 퇴장 시 입장 순서 기준 다음 플레이어 (D-12)"

patterns-established:
  - "RoomManager 에러: throw new Error('ERROR_CODE') — 핸들러에서 err.message로 catch"
  - "emitError 헬퍼 함수로 에러 emit 중앙화"
  - "disconnect 이벤트: 게임 중이면 isConnected=false, 대기실이면 퇴장 처리"

requirements-completed: [INFRA-01, INFRA-03, INFRA-04, INFRA-06]

# Metrics
duration: 15min
completed: 2026-03-29
---

# Phase 3 Plan 01: Socket.IO 프로토콜 타입 + 서버 부트스트랩 + RoomManager Summary

**Socket.IO 4.x 타입 안전 서버 부트스트랩 + 인메모리 RoomManager (방 생성/참여/퇴장/재접속/게임시작) + shared 패키지 이벤트 프로토콜 타입 계약 확립**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T12:01:05Z
- **Completed:** 2026-03-29T12:16:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `packages/shared`에 `RoomState`, `RoomPlayer`, `ClientToServerEvents`, `ServerToClientEvents`, `ErrorPayload`, `InterServerEvents`, `SocketData` 타입 정의 및 export — Phase 4 게임 엔진이 import 가능한 계약 확립
- `packages/server`에 Socket.IO 4.x 서버를 제네릭 타입으로 부트스트랩 — `create-room`, `join-room`, `leave-room`, `start-game`, `disconnect` 핸들러 등록
- `RoomManager` 클래스 구현 — 방 생성(8자리 UUID), 6인 제한, 닉네임 중복/게임 중 재접속/대기실 닉네임 차단, 방장 승계, 만원 단위 칩 검증 포함
- `npx turbo run build --filter=@sutda/shared` 및 `--filter=@sutda/server` 모두 성공 (exit code 0)

## Task Commits

이 프로젝트는 git 저장소가 아니므로 커밋 해시가 없습니다. 파일은 직접 생성/수정되었습니다.

1. **Task 1: Socket.IO 프로토콜 타입 + RoomState 타입 정의** - (feat: 파일 생성/수정)
2. **Task 2: Socket.IO 서버 부트스트랩 + RoomManager 클래스 구현** - (feat: 파일 생성/수정)

## Files Created/Modified

- `packages/shared/src/types/room.ts` — RoomPlayer, RoomState 인터페이스 정의
- `packages/shared/src/types/protocol.ts` — ClientToServerEvents, ServerToClientEvents, ErrorPayload, InterServerEvents, SocketData 타입
- `packages/shared/src/index.ts` — room/protocol 타입 export 추가
- `packages/server/src/room-manager.ts` — RoomManager 클래스 (createRoom, getRoom, joinRoom, leaveRoom, disconnectPlayer, canStartGame, startGame, validateChips, deleteRoom, roomCount)
- `packages/server/src/index.ts` — Socket.IO 서버 부트스트랩 + 이벤트 핸들러 5종 + ERROR_MESSAGES 맵
- `packages/server/package.json` — socket.io, vitest, @types/node 의존성 추가

## Decisions Made

- 방 ID를 `crypto.randomUUID().slice(0, 8)`로 생성 — 코드 가독성보다 충돌 안전성 우선 (D-01, D-03)
- 재접속 식별을 닉네임 + 방코드 조합으로 처리 — localStorage 토큰 없이 마찰 최소화 (D-04)
- 대기실에서 동일 닉네임 차단, 게임 중에만 재접속 허용 — D-05, D-06 이행
- `emitError` 헬퍼 함수로 에러 응답 중앙화 — 타입 안전성과 메시지 일관성 확보

## Deviations from Plan

없음 - 플랜에 명시된 대로 정확히 실행되었습니다.

## Issues Encountered

없음.

## User Setup Required

없음 — 외부 서비스 설정 불필요.

## Known Stubs

없음. 모든 구현이 완전히 연결되어 있습니다.

## Next Phase Readiness

- Phase 3 Plan 02 (RoomManager 단위 테스트 + Socket.IO 통합 테스트)에서 이 코드를 바로 테스트 가능
- Phase 4 게임 엔진이 `@sutda/shared`의 프로토콜 타입과 `RoomManager` 인스턴스를 그대로 사용 가능
- `socket.io` 서버가 포트 3001에 바인딩되고 CORS를 허용하는 기본 설정 완료

---
*Phase: 03-websocket*
*Completed: 2026-03-29*
