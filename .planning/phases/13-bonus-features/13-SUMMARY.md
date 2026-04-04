---
phase: 13
plan: 13
subsystem: realtime-ui
tags: [socket.io, streaming, spectator, cut-modal, sfx]
dependency_graph:
  requires: [quick-260404-jn6]
  provides: [giri-phase-update-protocol, spectator-cut-view]
  affects: [CutModal, RoomPage, protocol.ts]
tech_stack:
  added: []
  patterns: [pure-ui-broadcast, socket-relay, optimistic-state]
key_files:
  created:
    - packages/client/src/components/modals/SpectatorCutView.tsx
  modified:
    - packages/shared/src/types/protocol.ts
    - packages/server/src/index.ts
    - packages/client/src/components/modals/CutModal.tsx
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - "giri-phase-update는 게임 엔진 상태를 변경하지 않는 순수 UI 이벤트 — handleGameAction 없이 직접 io.to(roomId).emit"
  - "addSplitPile 후 zustand 비동기 업데이트 전에 emit되므로, 수동 계산된 updatedPiles를 인자로 전달"
  - "spectatorGiriState는 cutting phase 벗어날 때 null 초기화로 다음 라운드 오염 방지"
metrics:
  duration_seconds: 235
  completed_date: "2026-04-04"
  tasks_completed: 3
  files_modified: 5
---

# Phase 13 Plan 13: 기리 실시간 스트리밍 + 관전자 UI Summary

**한 줄 요약:** Socket.IO giri-phase-update 이벤트로 기리 더미 상태를 브로드캐스트하고, SpectatorCutView 컴포넌트가 관전자에게 실시간 읽기 전용 더미 레이아웃을 렌더링한다.

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 주요 파일 |
|--------|------|------|-----------|
| 13-01 | 소켓 프로토콜 타입 추가 + 서버 브로드캐스트 핸들러 | 82a93ec | protocol.ts, server/index.ts |
| 13-02 | CutModal 기리 단계 전환 시 socket.emit 추가 | eac081d | CutModal.tsx |
| 13-03 | SpectatorCutView 컴포넌트 + RoomPage 통합 + 기리 SFX | 725b7a9 | SpectatorCutView.tsx, RoomPage.tsx |

## 구현 상세

### 13-01: 프로토콜 타입 + 서버 핸들러
- `protocol.ts`에 `GiriPhase`, `GiriPile` 타입 export
- `ClientToServerEvents`에 `giri-phase-update` 이벤트 추가
- `ServerToClientEvents`에 `giri-phase-update` 이벤트 추가 (`cutterNickname` 포함)
- `server/index.ts`에 `socket.on('giri-phase-update')` 핸들러 등록 — `io.to(roomId).emit`으로 순수 UI 브로드캐스트

### 13-02: CutModal emit 통합
- `emitGiriUpdate(nextPhase, currentPiles, currentTapOrder)` 헬퍼 함수 추가
- 모바일 오른쪽/왼쪽 스와이프 완료 시 (`splitAll` 후) emit 호출 2곳
- 데스크탑 드래그 드롭 완료 시 (`addSplitPile` 후) zustand 비동기 업데이트를 고려해 수동 계산된 `updatedPiles`로 emit
- 모바일+데스크탑 탭/언탭 시 emit 호출
- "합치기" 버튼 클릭 시 `merging` phase emit

### 13-03: SpectatorCutView + RoomPage 통합
- `SpectatorCutView.tsx` 신규 생성 — Dialog 기반, 읽기 전용 더미 스택, 탭 순서 배지, merging 트랜지션 애니메이션, 단계 텍스트
- `RoomPage`에 `spectatorGiriState` useState 추가
- `socket.on('giri-phase-update')` 핸들러 등록 + cleanup
- `cutting` phase 벗어나면 `spectatorGiriState` null 초기화 (useEffect)
- 기존 빈 "기리 중" Dialog → `SpectatorCutView`로 교체
- `data.phase === 'split'` 수신 시 `playSfx('giri')` SFX 트리거
- `Scissors` lucide import 제거 (사용처 없어짐)

## 계획 대비 편차

### 자동 수정 항목

**1. [Rule 3 - Blocking] rate-limiter-flexible 의존성 누락**
- **발견 시점:** 태스크 13-01 빌드 검증
- **문제:** `packages/server`에 `rate-limiter-flexible` 패키지가 `node_modules`에 없어 `tsc` 빌드 실패
- **수정:** `pnpm --filter=@sutda/server add rate-limiter-flexible` 로 의존성 추가
- **파일:** `packages/server/package.json`, `pnpm-lock.yaml`
- **커밋:** 82a93ec

## Known Stubs

없음 — 모든 기능이 실제 소켓 이벤트와 연결되어 있음.

## Self-Check: PASSED

- SpectatorCutView.tsx: 존재
- CutModal.tsx: 수정됨 (emitGiriUpdate 포함)
- protocol.ts: GiriPhase, GiriPile, giri-phase-update 이벤트 포함
- server/index.ts: giri-phase-update 핸들러 등록됨
- 커밋 82a93ec: 존재
- 커밋 eac081d: 존재
- 커밋 725b7a9: 존재
- 전체 turbo build: 3 tasks successful
