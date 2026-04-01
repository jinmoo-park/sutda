---
phase: 11-social-features
plan: 01
subsystem: shared-types, server, client
tags: [chat, protocol, shared-types, observer, all-in, round-history]
dependency_graph:
  requires: []
  provides: [chat-protocol, round-history-types, observer-types, all-in-types, school-proxy-types]
  affects: [packages/shared, packages/server, packages/client]
tech_stack:
  added: []
  patterns: [zustand-chat-state, socket-broadcast, chat-history-on-join]
key_files:
  created:
    - packages/client/src/components/layout/ChatPanel.tsx (전체 교체)
  modified:
    - packages/shared/src/types/protocol.ts
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/room.ts
    - packages/shared/src/types/index.ts
    - packages/server/src/index.ts
    - packages/client/src/store/gameStore.ts
decisions:
  - "chatHistories Map을 서버 메모리에 보관, 방 입장 시 chat-history emit으로 복원"
  - "ChatPanel 500ms 클라이언트 스팸 방지 + 서버 200자 trim/slice 이중 방어"
  - "isAtBottomRef 패턴으로 스크롤 위치 유지 — 맨 아래 있을 때만 자동 스크롤"
  - "RoundHistoryEntry를 game.ts에 export — protocol.ts에서 import 참조"
metrics:
  duration: ~15min
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_modified: 6
---

# Phase 11 Plan 01: 공유 타입 계약 + 채팅 기능 Summary

## 한 줄 요약

Phase 11의 7개 기능 전체 공유 타입 계약(채팅/이력/학교대납/Observer/세션종료/올인)을 shared에 선행 정의하고, send-chat/chat-message 소켓 파이프라인과 좌/우 정렬 ChatPanel UI를 풀스택 완성.

## 완료된 작업

### Task 1: 전체 기능 공유 타입/프로토콜 계약 확장
**커밋:** `43ea1dc`

- `protocol.ts`: `send-chat`, `chat-message`, `chat-history`, `proxy-ante`, `proxy-ante-applied`, `game-history` 이벤트 추가
- `protocol.ts`: `player-left`에 `nickname?: string` 추가, `ErrorPayload.code`에 `CHAT_TOO_FAST` 추가
- `game.ts`: `PlayerState`에 `isAllIn?`, `totalCommitted?` 추가
- `game.ts`: `GameState`에 `schoolProxyBeneficiaryIds?` 추가
- `game.ts`: `RoundHistoryEntry` 인터페이스 신규 export
- `room.ts`: `RoomPlayer`에 `isObserver?`, `observerChips?` 추가
- `index.ts`: `RoundHistoryEntry` re-export 추가

### Task 2: 채팅 서버 핸들러 + ChatPanel UI + gameStore 채팅 상태
**커밋:** `63c0e52`

- `server/index.ts`: `chatHistories` Map 선언, `send-chat` 핸들러, `join-room` 시 `chat-history` emit, 방 정리 시 `chatHistories.delete(roomId)`
- `gameStore.ts`: `ChatMessage` 인터페이스, `chatMessages: []` 상태, `chat-message`/`chat-history` 리스너, `sendChat` 액션, `disconnect` 시 초기화
- `ChatPanel.tsx`: placeholder 전체 교체 → 내 메시지 우측(`bg-primary/10`)/상대 우측 정렬, 200자 제한, 500ms 스팸 방지, `isAtBottomRef` 자동 스크롤

## 검증 결과

- `pnpm --filter @sutda/shared build`: 성공 (exit code 0)
- `pnpm --filter @sutda/client build`: 성공 (exit code 0, 498.63 kB)

## 결정 사항

| 결정 | 이유 |
|------|------|
| chatHistories Map 서버 인메모리 | 방 단위 이력 50개 상한으로 메모리 안전, 방 생성/삭제 시 자동 정리 |
| 500ms 클라이언트 + 200자 서버 이중 방어 | 클라이언트 UX(버튼 비활성화) + 서버 trim/slice로 스팸/과도한 메시지 차단 |
| RoundHistoryEntry를 game.ts에 정의 | 게임 상태 도메인 소속, protocol.ts에서 import로 참조 |
| isAtBottomRef 패턴 | 사용자가 스크롤 올려 이전 메시지 볼 때 자동 스크롤 방해하지 않음 |

## Deviations from Plan

None - 계획대로 정확히 실행됨.

## Known Stubs

None - ChatPanel이 실제 채팅 데이터를 gameStore에서 읽어 렌더링함.

## Self-Check: PASSED

- `packages/shared/src/types/protocol.ts`: 존재 확인
- `packages/shared/src/types/game.ts`: RoundHistoryEntry 존재 확인
- `packages/shared/src/types/room.ts`: isObserver 존재 확인
- `packages/client/src/components/layout/ChatPanel.tsx`: 실제 구현체 존재 확인
- `packages/server/src/index.ts`: chatHistories, send-chat 핸들러 존재 확인
- 커밋 `43ea1dc`: 확인됨
- 커밋 `63c0e52`: 확인됨
