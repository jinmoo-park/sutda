---
phase: 08-huhwi-indian-modes
plan: "02"
subsystem: api

tags: [socket.io, typescript, game-server, indian-sutda, gollagolla]

# 의존성 그래프
requires:
  - phase: 08-01
    provides: "GameEngine.selectGollaCards(), getStateFor(), dealExtraCardIndian() 메서드"
  - phase: 08-huhwi-indian-modes
    provides: "protocol.ts ClientToServerEvents — select-gollagolla-cards 이벤트 타입"

provides:
  - "select-gollagolla-cards 소켓 핸들러 (index.ts)"
  - "handleGameAction async per-player emit 개편 (getStateFor + fetchSockets)"
  - "인디언 모드 dealing-extra 자동 처리 (bet-action 핸들러 내)"
  - "CARD_ALREADY_TAKEN 에러 메시지"

affects: ["08-03", "08-ui", "client-gollagolla", "client-indian"]

# 기술 스택
tech-stack:
  added: []
  patterns:
    - "handleGameAction async per-player emit: fetchSockets() → getStateFor(playerId) 순으로 각 소켓에 개인화된 게임 상태 전송"
    - "인디언 모드 자동 phase 전환: processBetAction 완료 후 phase=dealing-extra이면 즉시 dealExtraCardIndian() 호출"

key-files:
  created: []
  modified:
    - "packages/server/src/index.ts"

key-decisions:
  - "handleGameAction을 항상 per-player emit으로 단순화 — 모드 분기 없이 getStateFor가 인디언 모드에서만 마스킹 적용"
  - "bet-action 핸들러 내부에서 dealing-extra 자동 처리 — fire-and-forget 패턴 유지 (handleGameAction await 불필요)"

patterns-established:
  - "per-player emit 패턴: io.in(roomId).fetchSockets() → for s of sockets → s.emit('game-state', engine.getStateFor(s.data?.playerId))"
  - "인디언 자동 phase 전환: action() 호출 후 engine.getState() 재확인 → dealing-extra이면 즉시 추가 처리"

requirements-completed:
  - MODE-HR-02
  - MODE-HR-03
  - MODE-IN-02
  - MODE-IN-03
  - MODE-IN-04

# 측정값
duration: 5min
completed: 2026-03-30
---

# Phase 8 Plan 02: 소켓 핸들러 + per-player Emit 개편 Summary

**골라골라 select-gollagolla-cards 소켓 핸들러 추가 및 handleGameAction을 fetchSockets+getStateFor per-player emit으로 전환, 인디언 betting-1 종료 후 dealing-extra 자동 처리 완성**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-30T14:23:47Z
- **Completed:** 2026-03-30T14:28:00Z
- **Tasks:** 2 (Task 1은 이미 HEAD에 반영됨, Task 2 구현)
- **Files modified:** 1 (packages/server/src/index.ts)

## Accomplishments

- `handleGameAction`을 async로 전환하고 fetchSockets + getStateFor per-player emit 패턴 적용 — 인디언 모드 카드 마스킹을 자동 지원
- `select-gollagolla-cards` 소켓 핸들러 추가 — engine.selectGollaCards() 호출, 선착순 충돌 시 CARD_ALREADY_TAKEN 에러 자동 처리
- `bet-action` 핸들러에 인디언 모드 dealing-extra 자동 처리 추가 — betting-1 완료 후 phase가 dealing-extra이면 즉시 dealExtraCardIndian() 호출

## Task Commits

각 태스크는 아토믹하게 커밋됨:

1. **Task 1: protocol.ts — select-gollagolla-cards 이벤트 타입 추가** - 이미 HEAD에 반영 (이전 병렬 에이전트 작업)
2. **Task 2: index.ts — handleGameAction per-player emit + 핸들러 추가** - `fa85a23` (feat)

**Plan 메타데이터:** `(docs 커밋 예정)`

## Files Created/Modified

- `packages/server/src/index.ts` — CARD_ALREADY_TAKEN 에러 메시지 추가, handleGameAction async+per-player emit 개편, select-gollagolla-cards 핸들러 추가, bet-action 내 dealing-extra 자동 처리

## Decisions Made

- **항상 per-player emit 단순화**: 모드 조건 분기 없이 `getStateFor(playerId)`를 항상 호출 — 인디언 모드에서만 마스킹이 적용되고 다른 모드에서는 `getState()`와 동일한 결과 반환
- **fire-and-forget 패턴 유지**: handleGameAction 호출부에서 await 불필요, 비동기 처리는 내부에서 완결

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Task 1이 병렬 에이전트에 의해 이미 구현됨**
- **Found during:** Task 1 확인 단계
- **Issue:** protocol.ts의 `select-gollagolla-cards`, `CARD_ALREADY_TAKEN` 이 이미 HEAD에 반영되어 있음 (08-01 또는 다른 병렬 에이전트가 적용)
- **Fix:** Task 1 재작업 불필요 — 기존 상태 검증 후 Task 2만 구현
- **Files modified:** 없음 (이미 존재)
- **Verification:** grep으로 protocol.ts 확인 + `pnpm --filter @sutda/shared build` 성공

---

**Total deviations:** 1 (관찰 only — 실제 코드 변경 불필요)
**Impact on plan:** Task 1이 이미 완료된 덕분에 Task 2 구현에만 집중. 범위 이탈 없음.

## Issues Encountered

없음 — 병렬 실행으로 인해 의존성(08-01)의 game-engine.ts 변경이 working tree에 미반영 상태였지만, `getStateFor`, `selectGollaCards`, `dealExtraCardIndian`은 working tree에 이미 존재하여 빌드가 통과됨.

## Known Stubs

없음 — 모든 핸들러가 실제 engine 메서드를 호출하도록 구현됨.

## Next Phase Readiness

- 08-03 (UI)이 `select-gollagolla-cards` 이벤트를 emit하고 per-player `game-state`를 수신하는 데 필요한 서버 계층 완성
- 인디언 모드 전체 플로우 (dealing → betting-1 → dealing-extra → betting-2) 서버 자동화 완료

---
*Phase: 08-huhwi-indian-modes*
*Completed: 2026-03-30*
