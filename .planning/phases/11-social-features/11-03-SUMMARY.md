---
phase: 11-social-features
plan: "03"
subsystem: server
tags: [observer-mode, session-management, disconnect-timer, game-history, school-proxy]
dependency_graph:
  requires: ["11-01"]
  provides: [observer-join, disconnect-30s-timer, force-player-leave, next-round-observer-join, game-history-broadcast, proxy-ante-handler]
  affects: [packages/server/src/index.ts, packages/server/src/game-engine.ts, packages/shared/src/index.ts]
tech_stack:
  added: []
  patterns: [setTimeout-30s-disconnect, observer-RoomPlayer, GameEngine-reconstruction, proxy-ante-socket-handler]
key_files:
  created: []
  modified:
    - packages/server/src/index.ts
    - packages/server/src/game-engine.ts
    - packages/shared/src/index.ts
decisions:
  - Observer 입장 시 roomManager.joinRoom을 우회하고 index.ts에서 직접 RoomPlayer 생성 — room-manager의 GAME_IN_PROGRESS 에러를 피하면서 Observer 타입 설정 가능
  - GameEngine 재생성(방법 A): nextRound() 이후 Observer 합류 시 새 GameEngine 인스턴스 생성 — 가장 안전한 방법
  - attendSchoolProxy()를 game-engine.ts에 추가 — 후원자 chips 차감, 수혜자 등교 처리
  - gameHistories 수집은 engine.lastRoundHistory 옵셔널 체인 사용 — Plan 02 병렬 작업 안전 처리
  - proxy-ante 핸들러에서 schoolProxySponsorId도 함께 저장 — nextRound() 이후 winnerId 리셋 대비
metrics:
  duration_min: 15
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_modified: 3
---

# Phase 11 Plan 03: Observer 모드 + 세션 종료 처리 요약

**한 줄 요약:** 게임 중 신규 입장자를 Observer로 처리하고, next-round에서 일반 플레이어로 자동 합류하며, 30초 disconnect 타이머로 강제 퇴장을 구현한 서버 소켓 핸들러 완성

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 주요 파일 |
|--------|------|------|-----------|
| Task 1 | 세션 종료 — 30초 disconnect 타이머 + forcePlayerLeave + 2인 퇴장 처리 | 1dd6922 | game-engine.ts, index.ts |
| Task 2 | Observer 모드 — join-room Observer 분기 + next-round 자동 합류 + GameEngine 재생성 | a8e94ec | index.ts, shared/index.ts |

## 구현 내용

### Task 1: 세션 종료 처리

**game-engine.ts:**
- `forcePlayerLeave(playerId)`: 베팅 phase 중이면 자동 다이(`processBetAction(type: 'die')`), 그 외 phase는 `isAlive = false`
- `attendSchoolProxy(beneficiaryId, sponsorId)`: 후원자 chips 500원 차감, 수혜자 등교 처리

**index.ts:**
- `gameDisconnectTimers` Map 추가 (`roomId:playerId → timeout`)
- 게임 중 disconnect 시 30초(`30_000`) 타이머 후:
  - `forcePlayerLeave()` 호출 → 자동 다이
  - `leaveRoom()` → `player-left` emit (nickname 포함)
  - per-player `game-state` broadcast
  - 잔여 플레이어 2인 미만이면 `gamePhase = 'waiting'` + GameEngine 삭제
- 재접속 시 `gameDisconnectTimers` 타이머 클리어
- `leave-room` 핸들러 `player-left` emit에 `nickname` 필드 추가

### Task 2: Observer 모드

**index.ts join-room 핸들러:**
- 게임 중 입장 시:
  - 기존 닉네임 → 재접속 처리 (roomManager.joinRoom 위임)
  - 신규 닉네임 → Observer RoomPlayer 생성 (`isObserver: true`, `chips: 0`, `observerChips: initialChips`)
  - Observer에게 현재 game-state 전송, 방 전체에 room-state broadcast

**index.ts next-round 핸들러:**
- `engine.lastRoundHistory` 있으면 `gameHistories`에 추가 → `game-history` broadcast
- Observer 목록(`p.isObserver === true`) 확인 → `isObserver = false`, `chips = observerChips` 전환
- Observer 합류 시 새 GameEngine 인스턴스 생성 (방법 A: 재생성)
- `room-state` broadcast 추가

**index.ts attend-school 핸들러:**
- `schoolProxyBeneficiaryIds` 체크 → 수혜자면 `attendSchoolProxy()` 호출
- 수혜자 목록에서 1회 소비 후 제거

**index.ts proxy-ante 핸들러 추가:**
- `schoolProxyBeneficiaryIds` + `schoolProxySponsorId` GameState에 저장
- 수혜자별 `proxy-ante-applied` broadcast (토스트용)

**shared/index.ts:**
- `RoundHistoryEntry` 타입 export 추가

## 구현된 truths 검증

| truth | 상태 |
|-------|------|
| 게임 중 입장한 플레이어가 Observer로 추가되어 게임 화면을 볼 수 있다 | ✓ |
| Observer는 다음 판 시작 시 자동으로 일반 플레이어로 합류한다 | ✓ |
| 플레이어 연결 끊김 후 30초 내 재접속하면 복귀, 30초 초과 시 퇴장 처리 | ✓ |
| 게임 중 퇴장한 플레이어는 자동 다이 처리되고 다른 플레이어에게 토스트가 표시된다 | ✓ |
| 2인 게임 중 1명 퇴장 시 남은 플레이어가 대기실로 전환된다 | ✓ |

## Deviations from Plan

### 자동 수정 사항

**1. [Rule 2 - Missing] shared/index.ts에 RoundHistoryEntry export 추가**
- **발견 시점:** Task 2 구현 중
- **이슈:** `RoundHistoryEntry`가 `types/index.ts`에는 있지만 패키지 메인 `index.ts`에 미노출
- **수정:** `export type { ..., RoundHistoryEntry }` 추가
- **파일:** `packages/shared/src/index.ts`
- **커밋:** a8e94ec

**2. [Rule 2 - Missing] attendSchoolProxy() 메서드 game-engine.ts에 추가**
- **발견 시점:** Task 1 — proxy-ante 기능을 위해 필요
- **이슈:** Plan 03 Task 2에서 `engine.attendSchoolProxy()` 호출이 필요하나 미구현
- **수정:** `forcePlayerLeave()`와 함께 Task 1 커밋에 포함
- **파일:** `packages/server/src/game-engine.ts`
- **커밋:** 1dd6922

**3. [Rule 1 - 재접속 타이머 키 수정] 재접속 시 game disconnect 타이머 클리어 키 수정**
- **발견 시점:** 코드 작성 중
- **이슈:** 기존 타이머는 `roomId:playerId`로 저장하는데, 재접속 후 `socket.id`가 변경되므로 `existing.id`(새 socket.id) 기준으로 클리어해야 함
- **수정:** 재접속 경로에서 새 `socket.id`로 타이머 키 조회

## 테스트 결과

`pnpm --filter @sutda/server test` 실행 결과:
- **총 186개 테스트** (신규 8개 포함)
- **146개 통과, 40개 실패**
- 실패 테스트 모두 **사전 존재 (pre-existing)**:
  - 37개: 이전 커밋부터 존재하는 game-engine.ts 테스트 실패
  - 3개: Plan 02의 TDD RED phase 실패 테스트 (설계에 의한 실패)
- **내 구현으로 인한 신규 실패: 0개**

## Self-Check: PASSED

- FOUND: packages/server/src/game-engine.ts (forcePlayerLeave, attendSchoolProxy 구현)
- FOUND: packages/server/src/index.ts (gameDisconnectTimers, Observer 분기, next-round Observer 합류)
- FOUND: packages/shared/src/index.ts (RoundHistoryEntry 추가)
- FOUND: .planning/phases/11-social-features/11-03-SUMMARY.md
- COMMIT 1dd6922: feat(11-03): 30초 disconnect 타이머 + forcePlayerLeave + 2인 퇴장 처리 — 확인됨
- COMMIT a8e94ec: feat(11-03): Observer 모드 join-room + next-round 자동 합류 + GameEngine 재생성 — 확인됨
