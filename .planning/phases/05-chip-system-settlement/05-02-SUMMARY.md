---
phase: 05-chip-system-settlement
plan: "02"
subsystem: chip-settlement
tags: [recharge, voting, socket-io, effective-max-bet, TDD]
dependency_graph:
  requires: [05-01]
  provides: [recharge-request-handler, recharge-vote-handler, effective-max-bet-validation]
  affects: [room-manager, server-index, integration-tests]
tech_stack:
  added: []
  patterns: [TDD-red-green, socket-io-broadcast, request-vote-pattern]
key_files:
  created: []
  modified:
    - packages/server/src/room-manager.ts
    - packages/server/src/room-manager.test.ts
    - packages/server/src/index.ts
    - packages/server/src/index.test.ts
decisions:
  - "거부 시 processRechargeVote는 delete 전에 requesterId를 추출하여 반환 — 투표자 ID 오염 방지"
  - "bet-action raise 검증에서 calculateEffectiveMaxBet을 인라인 호출 — handleGameAction 패턴 유지"
  - "recharge-vote 거부 분기에서 result.requesterId 직접 사용 — socket.data.playerId(투표자) 사용 금지"
metrics:
  duration_seconds: 198
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_modified: 4
requirements: [CHIP-03, CHIP-05]
---

# Phase 05 Plan 02: 재충전 투표 플로우 + Socket.IO 핸들러 Summary

## 한 줄 요약

재충전 요청/투표/적용 플로우를 RoomManager에 구현하고 Socket.IO 핸들러로 연결, 유효 스택 상한 초과 레이즈 서버 검증 추가

## 완료된 Tasks

| Task | 이름 | Commit | 주요 파일 |
|------|------|--------|-----------|
| RED | 재충전 단위 테스트 (실패) | 3e67024 | packages/server/src/room-manager.test.ts |
| GREEN Task 1 | RoomManager 재충전 메서드 구현 | 94fa1cb | packages/server/src/room-manager.ts |
| Task 2 | Socket.IO 핸들러 + 통합 테스트 | 79b3e85 | packages/server/src/index.ts, packages/server/src/index.test.ts |

## 구현 내용

### RoomManager 재충전 메서드

**packages/server/src/room-manager.ts에 추가:**

| 메서드 | 설명 |
|--------|------|
| `requestRecharge(roomId, requesterId, amount)` | 재충전 요청 생성. ROOM_NOT_FOUND / RECHARGE_IN_PROGRESS / INVALID_CHIPS 검증 |
| `processRechargeVote(roomId, voterId, approved)` | 투표 처리. 거부 시 즉시 `{complete:true, approved:false, requesterId}` 반환. 전원 동의 시 `{complete:true, approved:true, requesterId}`. 부분 투표 시 `{complete:false, votedCount, totalNeeded}` |
| `applyRecharge(roomId)` | 요청자 chips += amount, rechargeRequests.delete. `{requesterId, newChips}` 반환 |

private 필드 `rechargeRequests: Map<string, RechargeRequest>` 추가.

### Socket.IO 핸들러

**packages/server/src/index.ts에 추가:**

- `recharge-request` 핸들러: 요청자 제외 다른 플레이어에게 `recharge-requested` 전달, 요청자에게 `recharge-vote-update` (votedCount:0) 전달
- `recharge-vote` 핸들러:
  - 거부 → `result.requesterId` 사용하여 전체에 `recharge-result` 브로드캐스트 (투표자 ID 오염 방지)
  - 승인 → `applyRecharge` 후 `engine.applyRechargeToPlayer` 호출 → `recharge-result` + `game-state` 브로드캐스트
  - 부분 투표 → `recharge-vote-update` 브로드캐스트
- `bet-action` 핸들러 수정: raise 시 `calculateEffectiveMaxBet` 검증, 초과 시 `INSUFFICIENT_CHIPS` throw
- `ERROR_MESSAGES`에 `RECHARGE_IN_PROGRESS`, `RECHARGE_NOT_FOUND`, `INSUFFICIENT_CHIPS` 추가

### 통합 테스트

**packages/server/src/index.test.ts에 추가:**

- `재충전 플로우 통합` describe:
  - 재충전 요청 시 `recharge-requested` 전달 검증
  - 전원 동의 시 `recharge-result` (approved:true, newChips 포함) 브로드캐스트 검증
  - 거부 시 `requesterId`가 요청자 ID인지 명시 검증 (투표자 ID가 아님)
- `유효 스택 상한 초과 레이즈 거부` describe:
  - effectiveMaxBet 초과 raise 시 `game-error` (code: INSUFFICIENT_CHIPS) 검증

## 테스트 결과

- 총 127개 테스트 통과 (기존 123개 + 신규 4개)
- 신규 테스트: 재충전 요청 전달(1), 전원동의 결과(1), 거부 requesterId(1), INSUFFICIENT_CHIPS(1)
- room-manager.test.ts: 32개 (기존 19개 + 신규 13개)

## Deviations from Plan

없음 — 계획대로 정확하게 실행됨.

## Known Stubs

없음 — 모든 구현이 완전히 연결됨.

## Self-Check: PASSED

- [x] packages/server/src/room-manager.ts — requestRecharge, processRechargeVote, applyRecharge, rechargeRequests Map 존재
- [x] packages/server/src/room-manager.ts — processRechargeVote complete:true 시 항상 requesterId 포함 (승인/거부 모두)
- [x] packages/server/src/index.ts — socket.on('recharge-request'), socket.on('recharge-vote') 핸들러 존재
- [x] packages/server/src/index.ts — RECHARGE_IN_PROGRESS, RECHARGE_NOT_FOUND, INSUFFICIENT_CHIPS 에러 메시지 존재
- [x] packages/server/src/index.ts — bet-action에 calculateEffectiveMaxBet 검증 로직 존재
- [x] packages/server/src/index.ts — recharge-vote 거부 분기에서 result.requesterId 사용
- [x] packages/server/src/index.ts — recharge-vote 승인 분기에서 engine.applyRechargeToPlayer 호출
- [x] packages/server/src/index.test.ts — 재충전 통합 테스트 3종 + INSUFFICIENT_CHIPS 테스트 존재
- [x] `pnpm --filter @sutda/shared build` 성공
- [x] `pnpm --filter @sutda/server test -- --run` 127/127 통과
- [x] Commit 3e67024: RED 테스트
- [x] Commit 94fa1cb: RoomManager 구현
- [x] Commit 79b3e85: Socket.IO 핸들러 + 통합 테스트
