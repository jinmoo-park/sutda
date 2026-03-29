# Phase 3: WebSocket 인프라 + 방 관리 - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Socket.IO 서버를 구축하고, 방 생성·참여·재접속 인프라를 완성한다.
게임 로직(Phase 4)보다 먼저, 플레이어들이 방에 모이고 실시간으로 서버와 통신할 수 있는 토대를 만든다.

**포함:** Socket.IO 서버 세팅, 방 생성/참여/퇴장 이벤트, 메시지 프로토콜 타입 정의, 재접속 처리, 방장 관리, 초기 칩 설정
**미포함:** 게임 엔진 FSM, 덱 배분, 베팅 로직, UI (이후 Phase)

</domain>

<decisions>
## Implementation Decisions

### 방 식별자 (INFRA-01)
- **D-01:** 방 ID는 **UUID v4 앞 8자리** 사용 (`crypto.randomUUID().slice(0, 8)`)
- **D-02:** 방 URL 형식: `/room/{8자리코드}` (예: `/room/f47ac10b`)
- **D-03:** 링크 클릭 위주 환경 → 짧은 코드보다 UUID 기반 충돌 안전성 우선

### 재접속 플레이어 인식 (INFRA-05)
- **D-04:** 재접속 시 플레이어 식별 기준: **닉네임 + 방코드 조합** (localStorage 토큰 없음)
- **D-05:** 재접속 허용 조건: **게임 진행 중(waiting 상태 제외)에만** 같은 닉네임으로 재접속 허용 → 해당 자리로 복귀
- **D-06:** 대기실(waiting 상태)에서는 동일 닉네임 재사용 차단 → 에러 응답

### 메시지 프로토콜 구조 (INFRA-04)
- **D-07:** Socket.IO 이벤트는 **세분화 방식** — 이벤트 이름 자체가 의미를 가짐
- **D-08:** Phase 3에서 정의하는 방 관리 이벤트:
  ```
  // ClientToServer
  'create-room': { nickname: string; initialChips: number }
  'join-room':   { roomId: string; nickname: string; initialChips: number }
  'leave-room':  { roomId: string }
  'start-game':  { roomId: string }  // 방장 전용

  // ServerToClient
  'room-created':    { roomId: string; roomState: RoomState }
  'room-state':      RoomState
  'player-joined':   PlayerState
  'player-left':     { playerId: string; newHostId?: string }
  'error':           { code: string; message: string }
  ```
- **D-09:** 메시지 프로토콜 타입(ClientToServerEvents / ServerToClientEvents)은 `@sutda/shared`에 정의 (Phase 1 D-08 위임 이행)
- **D-10:** 이후 Phase(4~9)에서 게임 이벤트를 추가 등록하는 방식으로 확장

### 방장 권한 (INFRA-01, INFRA-02)
- **D-11:** 방장 전용 액션: **게임 시작(`start-game`)만** — 강제 퇴장 없음 (친구끼리라 불필요)
- **D-12:** 방장 승계: 방장이 나가면 **입장 순서 기준 다음 플레이어**가 자동 방장
- **D-13:** 방 나가기는 모든 플레이어 동일하게 가능

### 서버 상태 저장
- **D-14:** **인메모리 Map** 사용 (`Map<roomId, RoomState>`) — 소규모 친구 전용, Redis 등 외부 저장소 불필요
- **D-15:** 서버 재시작 시 모든 방 소멸 — 허용 (친구끼리 세션 단위 운영)

### Claude's Discretion
- Socket.IO 버전 선택 및 CORS 설정 세부 옵션
- RoomState 인터페이스 상세 필드 구성 (GameState 확장 vs 별도 타입)
- 재접속 타임아웃 처리 (연결 끊긴 후 방에 자리 유지 기간)
- 에러 코드 목록 설계 (`ROOM_FULL`, `ROOM_NOT_FOUND`, `NICKNAME_TAKEN` 등)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 요건 정의
- `.planning/REQUIREMENTS.md` §INFRA — INFRA-01~06 전체. 방 생성, 참여, 인원 제한, 서버 권위 모델, 재접속, 초기 칩 설정 요건.

### 게임 규칙
- `rule_draft.md` — 게임 전체 하우스룰. Phase 3에서는 방 관리 부분만 해당하나, 이후 Phase를 위해 구조 설계 시 참고.

### 기반 코드 (Phase 1 산출물)
- `packages/shared/src/types/game.ts` — `GameState`, `PlayerState`, `GameMode`, `GamePhase` 타입. Phase 3 메시지 프로토콜 타입과 연결 지점.
- `packages/shared/src/index.ts` — shared 패키지 exports. 새 타입 추가 시 여기에 export 등록 필요.
- `packages/server/src/index.ts` — 서버 스텁. Socket.IO 서버 구현 시작점.

### 프로젝트 컨텍스트
- `.planning/PROJECT.md` — 서버 권위 모델, 소규모 운영 제약, 모노레포 결정

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GameState` (`packages/shared/src/types/game.ts`): `roomId` 필드 이미 포함 — RoomState 설계 시 활용 또는 확장
- `PlayerState` (`packages/shared/src/types/game.ts`): `id`, `nickname`, `chips`, `seatIndex` 이미 정의 — 방 참여 시 초기화 대상
- `GamePhase` 타입: `'waiting'` 상태 포함 — 재접속 정책 구현 시 이 값으로 분기

### Established Patterns
- `@sutda/shared`는 순수 함수/타입 전용 (사이드이펙트 없음) — 메시지 프로토콜 타입도 여기에 위치
- pnpm + turborepo 모노레포: shared → server 빌드 의존성 이미 설정됨
- TypeScript strict mode, ES2022, `moduleResolution: bundler`

### Integration Points
- `packages/server/src/index.ts`: 완전히 빈 스텁 → Socket.IO `createServer` 시작점
- `packages/shared/src/index.ts`: 새 프로토콜 타입 export 추가 필요
- Phase 4 게임 엔진이 이 Phase의 Socket.IO 서버 인스턴스와 방 상태 Map을 그대로 사용

</code_context>

<specifics>
## Specific Ideas

- 방 URL 예시: `https://sutda.app/room/f47ac10b` — 카카오톡 공유 시 링크 클릭으로 바로 접속
- 재접속 판별 로직: `rooms.get(roomId)?.players.find(p => p.nickname === nickname)` — 게임 중이면 복귀, 없으면 신규 입장
- 방장 승계 시 `player-left` 이벤트에 `newHostId` 포함 → 클라이언트가 UI 업데이트

</specifics>

<deferred>
## Deferred Ideas

- **재접속 타임아웃 구현** (연결 끊긴 플레이어 자리 보존 기간) → Claude 재량으로 합리적 기본값 설정
- **방 목록/로비** → Out of Scope (친구 전용, 공개 방 목록 불필요)
- **턴 타이머/자동 다이** → v2 UX 요건

</deferred>

---

*Phase: 03-websocket*
*Context gathered: 2026-03-29*
