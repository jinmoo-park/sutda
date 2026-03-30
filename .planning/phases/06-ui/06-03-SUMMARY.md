---
phase: 06-ui
plan: 03
subsystem: client
tags: [react, shadcn-ui, socket-io-client, modals, result-screen, game-flow]
dependency_graph:
  requires:
    - packages/client/src/components/game/CardFace.tsx
    - packages/client/src/components/game/CardBack.tsx
    - packages/client/src/store/gameStore.ts
    - packages/client/src/components/ui/ (button, dialog, badge, separator)
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
  provides:
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/modals/DealerSelectModal.tsx
    - packages/client/src/components/modals/AttendSchoolModal.tsx
    - packages/client/src/components/modals/ShuffleModal.tsx
    - packages/client/src/components/modals/CutModal.tsx
    - packages/client/src/components/modals/RechargeVoteModal.tsx
    - packages/client/src/components/modals/LeaveRoomDialog.tsx
    - packages/client/src/components/modals/DealerResultOverlay.tsx
    - packages/client/src/components/modals/MuckChoiceModal.tsx
    - packages/client/src/components/modals/ModeSelectModal.tsx
  affects:
    - packages/client/src/pages/RoomPage.tsx
tech_stack:
  added: []
  patterns:
    - phase 기반 조건부 모달 렌더링 (gameState.phase 직접 비교)
    - 자동 앤티 처리 — AttendSchoolModal 서버측 자동화로 대체
    - sessionStorage 캐시 + locationState 우선순위 복원 패턴
    - hasJoined 게이트로 join-room emit 시점 통제
key_files:
  created:
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/modals/DealerSelectModal.tsx
    - packages/client/src/components/modals/AttendSchoolModal.tsx
    - packages/client/src/components/modals/ShuffleModal.tsx
    - packages/client/src/components/modals/CutModal.tsx
    - packages/client/src/components/modals/RechargeVoteModal.tsx
    - packages/client/src/components/modals/LeaveRoomDialog.tsx
    - packages/client/src/components/modals/DealerResultOverlay.tsx
    - packages/client/src/components/modals/MuckChoiceModal.tsx
  modified:
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - "AttendSchoolModal을 RoomPage에서 제거 — 서버가 next-round/select-dealer-card 완료 시 자동으로 attendSchool 처리하므로 모달 불필요"
  - "join-room emit을 locationState + sessionStorage 두 경로로 처리 — 첫 방문/새로고침 재접속 모두 대응"
  - "MuckChoiceModal: showdown phase + winnerId === myPlayerId 조건 — 상대 전원 다이 시에만 패 공개 선택 제공"
  - "DealerResultOverlay: dealer-select→attend-school 전환 3초 오버레이 — 밤일낮장 결과 시각화"
metrics:
  duration_min: 35
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 9
  files_modified: 1
---

# Phase 6 Plan 03: 특수 모달 + 결과 화면 + RoomPage 최종 통합 Summary

**한 줄 요약:** 밤일낮장/셔플/기리/재충전투표 모달 + 결과 화면 + DealerResultOverlay + MuckChoiceModal 구현 후 RoomPage에 최종 통합하여 전체 게임 플로우 UI 루프 완성, AttendSchoolModal은 서버 자동 앤티 처리로 대체되어 렌더링에서 제거됨.

---

## 완료된 태스크

| Task | 이름 | Commit | 주요 파일 |
|------|------|--------|---------|
| 1 | 5개 특수 모달 + LeaveRoomDialog + ResultScreen | b1988f1 | AttendSchoolModal, DealerSelectModal, ShuffleModal, CutModal, RechargeVoteModal, LeaveRoomDialog, ResultScreen |
| 2 | RoomPage 최종 통합 — 모달 연결 + 닉네임 입력 + join-room emit | 1f5a696 | RoomPage.tsx |
| 추가 | 누락 모달 파일 추가 (빌드 복구) | cd42df5 | DealerResultOverlay, MuckChoiceModal, ReturnFromBreakModal |
| 버그수정 | 베팅 UX + auto-showdown + player-id fix + CutModal 재설계 | 2883174 | RoomPage, BettingPanel, GameTable, PlayerSeat |
| 버그수정 | 다이 결과 표시 + 자동 앤티 + 94재경기/밤일낮장룰 + 모달 제거 | 1d2ef6b | 전체 게임 플로우 버그 수정 |

---

## 구현 상세

### Task 1: 특수 모달 및 결과 화면

- **DealerSelectModal**: 20장 뒤집힌 카드 그리드 → 클릭 시 `select-dealer-card` emit, 외부 클릭/ESC 방지
- **AttendSchoolModal**: 학교간다/잠시쉬기 — 컴포넌트 파일은 존재하나 RoomPage에서 렌더링 제거 (서버 자동 처리)
- **ShuffleModal**: 셔플 확인 단순 Dialog (`shuffle` emit)
- **CutModal**: 1~5 더미 분할 + 퉁 선언, `cutPoints`/`order` 계산 후 `cut` emit
- **RechargeVoteModal**: Zustand `rechargeRequest` 상태 기반 자동 open, 동의/거부 후 토스트
- **LeaveRoomDialog**: 방 나가기 확인 (destructive), `leave-room` emit + navigate('/')
- **ResultScreen**: 승자 선언 + 모든 생존 플레이어 CardFace 공개 + 족보 Badge + 칩 변동 + "다음 판" 버튼

### Task 2: RoomPage 최종 통합

- **닉네임 입력 폼**: `hasJoined` 게이트 — 미입장 시 닉네임+칩 입력 폼 표시
- **join-room emit 경로**: (1) MainPage 링크 참여시 locationState, (2) 새로고침 시 sessionStorage 캐시
- **AttendSchoolModal 제거**: 서버가 select-dealer-card 완료 후 자동 attendSchool 처리하므로 모달 미표시
- **추가된 기능** (버그 수정 단계):
  - DealerResultOverlay: 밤일낮장 결과 3초 오버레이
  - MuckChoiceModal: 상대 전원 다이 시 패 공개 선택
  - ModeSelectModal: 94재경기/밤일낮장 모드 선택
  - 카드 딜링 애니메이션 (cutting→betting 전환 시 순차 공개)
  - 자리비움 중 배너 + 복귀하기 버튼

---

## 검증 결과

- `pnpm --filter @sutda/shared build` + `pnpm --filter @sutda/client build` 성공 (467KB JS, 25.87KB CSS)
- AttendSchoolModal: RoomPage 라인 370에서 주석 처리 확인 — `{/* AttendSchoolModal 제거: 결과화면 "학교 가기" 클릭 시 자동 앤티 처리 */}`
- 모든 모달 파일 존재 확인 (9개)
- RoomPage phase 기반 조건부 렌더링: waiting → 게임진행 → result 전환 정상

---

## 플랜 대비 편차

### 자동 수정 이슈

**1. [Rule 2 - 누락 기능] DealerResultOverlay, MuckChoiceModal, ReturnFromBreakModal 추가**
- **발견 시점**: 빌드 실행 시
- **내용**: RoomPage.tsx에서 import하지만 worktree에 파일이 없었음
- **수정**: 메인 레포에서 세 파일 복사
- **수정 파일**: packages/client/src/components/modals/DealerResultOverlay.tsx, MuckChoiceModal.tsx, ReturnFromBreakModal.tsx
- **커밋**: cd42df5

**2. [Rule 2 - 누락 기능] AttendSchoolModal 렌더링 제거 (사용자 지시 반영)**
- **발견 시점**: 이전 세션 버그 수정 과정
- **내용**: 서버가 next-round/select-dealer-card 완료 시 자동 attendSchool 처리 — 클라이언트 모달 불필요
- **수정**: RoomPage에서 AttendSchoolModal import 제거, 렌더링 라인 주석 처리
- **수정 파일**: packages/client/src/pages/RoomPage.tsx

**3. [Rule 1 - 버그] 베팅 UX + auto-showdown + player-id fix**
- **발견 시점**: ngrok 원격 테스트
- **내용**: 포트 불일치, 소켓 타이밍, join-room 브로드캐스트 등 6개 버그
- **수정**: 여러 커밋에 걸쳐 순차 수정 (68b9f6f ~ 1d2ef6b)
- **수정 파일**: RoomPage, BettingPanel, GameTable, PlayerSeat, protocol.ts

---

## Known Stubs

- **AttendSchoolModal.tsx** (`packages/client/src/components/modals/AttendSchoolModal.tsx`): 컴포넌트 파일은 존재하지만 RoomPage에서 렌더링되지 않음. "잠시 쉬기" 버튼 서버 이벤트 없음 (서버 타임아웃 의존). 현재 서버 자동 처리로 전체 기능 동작.
- **ChatPanel** (`packages/client/src/components/layout/ChatPanel.tsx`): 레이아웃 예약 placeholder — v1 범위 밖

---

## Self-Check: PASSED

파일 존재 확인:
- packages/client/src/components/layout/ResultScreen.tsx: FOUND
- packages/client/src/components/modals/DealerSelectModal.tsx: FOUND
- packages/client/src/components/modals/AttendSchoolModal.tsx: FOUND
- packages/client/src/components/modals/ShuffleModal.tsx: FOUND
- packages/client/src/components/modals/CutModal.tsx: FOUND
- packages/client/src/components/modals/RechargeVoteModal.tsx: FOUND
- packages/client/src/components/modals/LeaveRoomDialog.tsx: FOUND
- packages/client/src/components/modals/DealerResultOverlay.tsx: FOUND
- packages/client/src/components/modals/MuckChoiceModal.tsx: FOUND

커밋 확인:
- b1988f1: feat(06-03): implement 5 special modals + LeaveRoomDialog + ResultScreen
- 1f5a696: feat(06-03): integrate all modals into RoomPage + nickname input + join-room emit
- cd42df5: feat(06-03): add missing modal files (DealerResultOverlay, MuckChoiceModal, ReturnFromBreakModal)
