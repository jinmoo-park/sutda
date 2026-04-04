# Phase 16: SESSION-END 재접속 시각 표시 수정 - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

SESSION-END gap closure — 게임 중 플레이어 접속 끊김 시 다른 플레이어에게 `opacity-50` 시각 표시가 정상 동작하도록 데이터 흐름을 완성한다.

범위: 서버 disconnect 핸들러 1곳 수정 + VERIFICATION.md 작성.
신규 UX/기능 추가 없음.

</domain>

<decisions>
## Implementation Decisions

### 서버 수정 범위
- **D-01:** `packages/server/src/index.ts` disconnect 핸들러의 game-playing 분기에서 `roomManager.disconnectPlayer()` 호출 직후 `io.to(roomId).emit('room-state', roomManager.getRoom(roomId))` 즉시 emit 추가.
- **D-02:** 기존 패턴(room-state broadcast)과 동일한 방식 — 공유 타입 변경, 신규 이벤트 추가 없음.

### 재접속 UX
- **D-03:** `opacity-50` 단독으로 충분. Phase 11에서 이미 구현된 PlayerSeat UX(반투명 + '재접속 대기중' span) 그대로 활용 — 추가 텍스트/배지 불필요.

### 검증 방식
- **D-04:** Phase 15 패턴으로 VERIFICATION.md만 작성 — 코드 트레이서빌리티 + 구현 증거 문서화, 수동 테스트 절차 생략.

### Claude's Discretion
- disconnect 이후 room-state emit 타이밍 (async IIFE 내부 vs 동기 직후): 구현 방식은 Claude 재량.
- VERIFICATION.md 세부 섹션 구조 및 포맷.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 수정 대상 파일
- `packages/server/src/index.ts` — disconnect 핸들러 (game-playing 분기, ~808번 라인)
- `packages/client/src/components/layout/GameTable.tsx` — isConnected prop 전달 코드 (cbeac35에서 이미 추가됨, 확인만)

### 타입 정의
- `packages/shared/src/types/room.ts` — `RoomPlayer.isConnected: boolean` 정의

### Phase 11 구현 참조
- `packages/server/src/room-manager.ts` — `disconnectPlayer()` 구현 (~99번 라인)
- `packages/client/src/components/game/PlayerSeat.tsx` — `isConnected` prop 처리 (opacity-50 적용, ~21/63/102번 라인)

### 감사 근거
- `.planning/v1-MILESTONE-AUDIT.md` — SESSION-END partial gap 설명

</canonical_refs>

<code_context>
## Existing Code Insights

### 현재 상태 (2026-04-04 기준)
- `cbeac35` commit (2026-04-02): GameTable 데스크탑/모바일 양쪽에 `isConnected={roomState?.players.find(rp => rp.id === p.id)?.isConnected ?? true}` 이미 추가됨
- `PlayerSeat.tsx`: `isConnected` prop 수신 후 `!isConnected && 'opacity-50'` 적용 및 '재접속 대기중' span 렌더 이미 구현됨
- `RoomPage.tsx`: `roomState={roomState}` 를 GameTable에 전달 중 (line 686)

### 남은 갭
- `index.ts` disconnect 핸들러 game-playing 분기: `disconnectPlayer()` 호출 후 `room-state` emit이 없음
- 결과: 클라이언트 `roomState.players[i].isConnected`가 stale `true`로 유지 → 시각 표시 미작동

### Reusable Patterns
- `io.to(roomId).emit('room-state', updatedRoom)` 패턴: index.ts 전역에서 동일하게 사용 중
- `roomManager.getRoom(roomId)` 로 현재 room 상태 획득 후 emit

### Integration Points
- `packages/server/src/index.ts` ~808번 라인: `roomManager.disconnectPlayer()` 직후에 1줄 추가

</code_context>

<specifics>
## Specific Ideas

- Phase 15(BET-07)와 동일한 gap-closure 구조: 코드 구현 대부분 완료, 데이터 흐름 1곳 수정 + VERIFICATION.md 작성
- 16-01-PLAN.md: 서버 1줄 수정 + 동작 확인
- 16-02-PLAN.md: VERIFICATION.md 작성

</specifics>

<deferred>
## Deferred Ideas

없음 — 논의가 Phase 16 범위 내에서만 진행됨.

</deferred>

---

*Phase: 16-session-end-visual-fix*
*Context gathered: 2026-04-04*
