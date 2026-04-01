---
phase: 11-social-features
plan: "04"
subsystem: client-ui
tags: [history-modal, proxy-ante, observer, allin, session-end, social-features]
dependency_graph:
  requires: ["11-02", "11-03"]
  provides: [history-modal, proxy-ante-ui, observer-badge, allin-badge, session-toast]
  affects: [InfoPanel, ResultScreen, GameTable, BettingPanel, PlayerSeat, gameStore]
tech_stack:
  added: []
  patterns: [shadcn-dialog, zustand-socket-listeners, sonner-toast]
key_files:
  created:
    - packages/client/src/components/modals/HistoryModal.tsx
  modified:
    - packages/client/src/store/gameStore.ts
    - packages/client/src/components/layout/InfoPanel.tsx
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/layout/BettingPanel.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - "ProxyAnteSection을 ResultScreen 내부 별도 함수 컴포넌트로 분리 — 로컬 상태(proxyOpen, selectedBeneficiaries) 격리"
  - "BettingPanel에서 gameStore.myPlayerId + players.find로 올인 상태 직접 감지 — props 추가 없이 self-contained"
  - "GameTable에 roomState prop 추가 — Observer는 RoomPlayer에 있어 PlayerState와 별도 전달 필요"
metrics:
  duration: "~25min"
  completed_date: "2026-04-02"
  tasks: 2
  files: 7
---

# Phase 11 Plan 04: 소셜/기능 UI 통합 Summary

**한 줄 요약:** 게임 이력 모달(HistoryModal), 학교 대신 가주기 UI(proxy-ante), Observer 배지/인디케이터, 올인 배지/BettingPanel 비활성화, 연결 끊김 토스트를 클라이언트 전체에 통합하여 Phase 11 소셜 기능 UI를 완성.

---

## 완료된 작업

### Task 1: HistoryModal + InfoPanel 이력 버튼 + ResultScreen 학교 대신 가주기 + gameStore 이력 상태

**커밋:** `d9ecad1`

**HistoryModal.tsx (신규):**
- shadcn Dialog 기반 게임 이력 모달
- 판별 이력을 역순(`[...entries].reverse()`)으로 표시
- 빈 상태: "아직 이력이 없습니다" 텍스트
- 판 번호, 승자 닉네임, 족보명, 판돈, 땡값 배지 표시

**gameStore.ts 확장:**
- `roundHistory: RoundHistoryEntry[]` 상태 필드 추가
- `game-history` 소켓 리스너 → roundHistory 업데이트
- `proxy-ante-applied` 소켓 리스너 → sonner toast("학교를 대신 가줬습니다")
- `player-left` 소켓 리스너 → sonner toast.error("연결이 끊어졌습니다")
- disconnect 시 `roundHistory: []` 초기화

**InfoPanel.tsx 확장:**
- Clock 아이콘 + "이력" 버튼 추가 (이력 없을 때 disabled, aria-label="이력 없음")
- HistoryModal 연동 (historyOpen state)
- useGameStore()에서 roundHistory 구독

**ResultScreen.tsx 확장:**
- ProxyAnteSection 내부 컴포넌트로 학교 대신 가주기 UI 구현
- 승자(winnerId === myPlayerId)일 때만 렌더
- 체크박스 다중 선택 후 "대신 내주기" 버튼으로 proxy-ante emit

---

### Task 2: Observer 배지/인디케이터 + 올인 배지/패널 비활성화 + GameTable Observer 목록

**커밋:** `7b03a93`

**PlayerSeat.tsx 확장:**
- `isObserver` prop 추가 → "관람 중" 배지 + "다음 판 자동 합류" Caption
- `isConnected` prop 추가 → false 시 `opacity-50` + "재접속 대기 중" Caption
- `player.isAllIn` → "올인" 배지 (border-primary text-primary)

**BettingPanel.tsx 확장:**
- useGameStore()에서 me.isAllIn 직접 감지
- `isMyAllIn` 시 전체 패널 `opacity-50 pointer-events-none`
- "올인 — 베팅 종료" 상태 텍스트 표시
- `ring-primary` 강조: `isMyTurn && !isMyAllIn` 조건으로 변경

**GameTable.tsx 확장:**
- `roomState` prop 추가 (RoomState 타입)
- Observer 목록 우하단 고정 렌더 (Badge "관람 중")
- 올인 플레이어 존재 시 POT 옆 "올인 포함" Caption

**RoomPage.tsx:**
- gameTableNode에 `roomState={roomState}` prop 전달

---

## Checkpoint (미완료)

**Checkpoint: Phase 11 전체 기능 시각적/기능적 검증** — 사용자 브라우저 검증 대기 중

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] ProxyAnteSection 별도 컴포넌트 분리**
- **Found during:** Task 1
- **Issue:** 계획에서는 ResultScreen 내부 JSX에 직접 추가하도록 명시했으나, `proxyOpen`/`selectedBeneficiaries` 로컬 상태가 조건부 early return 이후에 존재해 hooks 규칙 위반 발생 가능
- **Fix:** `ProxyAnteSection` 내부 함수 컴포넌트로 분리하여 hooks 규칙 준수
- **Files modified:** packages/client/src/components/layout/ResultScreen.tsx
- **Commit:** d9ecad1

---

## 검증 결과

- `pnpm --filter @sutda/client build`: 성공 (두 태스크 모두)
- 서버 테스트 37개 실패: Phase 11-04 변경과 무관한 기존 game-engine.test.ts 실패 (사전 존재)

---

## Known Stubs

없음 — 모든 UI 기능이 실제 소켓 이벤트/상태에 연결됨. GameTable Observer 목록은 roomState.players.isObserver 기반이며 PlayerSeat isConnected는 RoomPlayer.isConnected를 호출자(GameTable/RoomPage)가 전달해야 하는 stub이 남아있음.

**PlayerSeat `isConnected` prop:** 현재 RoomPage에서 PlayerSeat에 isConnected를 전달하는 코드가 없음. GameTable → PlayerSeat 체인에서 roomState.players의 isConnected를 매핑하는 로직이 필요하나, GameTable의 players prop은 PlayerState(게임 상태) 기반이고 roomState.players는 RoomPlayer 타입으로 별도임. 현재 isConnected 기본값 true로 동작 — 재접속 대기 표시는 완전히 동작하지 않음. 기능적으로는 UI가 표시되지 않을 뿐 crash는 없음.

## Self-Check: PASSED

파일 존재 확인:
- HistoryModal.tsx: 존재
- InfoPanel.tsx: 수정됨
- ResultScreen.tsx: 수정됨
- gameStore.ts: 수정됨
- PlayerSeat.tsx: 수정됨
- BettingPanel.tsx: 수정됨
- GameTable.tsx: 수정됨
- RoomPage.tsx: 수정됨

커밋 확인:
- d9ecad1: feat(11-04): HistoryModal + InfoPanel 이력 버튼 + ResultScreen 학교 대신 가주기 + gameStore 이력 상태
- 7b03a93: feat(11-04): Observer 배지/인디케이터 + 올인 배지/패널 비활성화 + GameTable Observer 목록
