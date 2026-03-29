---
phase: 06-ui
plan: 02
subsystem: client
tags: [react, tailwind-v4, shadcn-ui, zustand, socket-io-client, game-ui, wireframe]
dependency_graph:
  requires:
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/card.ts
    - packages/shared/src/types/protocol.ts
    - packages/shared/src/types/room.ts
    - packages/client/src/store/gameStore.ts
    - packages/client/src/lib/cardUtils.ts
    - packages/client/src/components/ui/ (badge, button, card, dialog, separator, sonner)
  provides:
    - packages/client/src/components/game/CardFace.tsx
    - packages/client/src/components/game/CardBack.tsx
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/game/ChipDisplay.tsx
    - packages/client/src/components/layout/HandPanel.tsx
    - packages/client/src/components/layout/BettingPanel.tsx
    - packages/client/src/components/layout/InfoPanel.tsx
    - packages/client/src/components/layout/ChatPanel.tsx
    - packages/client/src/components/layout/HandReferenceDialog.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/components/layout/WaitingRoom.tsx
  affects:
    - packages/client/src/pages/MainPage.tsx
    - packages/client/src/pages/RoomPage.tsx
tech_stack:
  added: []
  patterns:
    - CSS custom properties(--angle)를 이용한 원형 플레이어 배치 (PlayerSeat)
    - gameState.phase 기반 화면 전환 FSM (RoomPage)
    - evaluateHand 클라이언트 직접 호출로 족보 인라인 표시 (HandPanel)
key_files:
  created:
    - packages/client/src/components/game/CardFace.tsx
    - packages/client/src/components/game/CardBack.tsx
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/game/ChipDisplay.tsx
    - packages/client/src/components/layout/HandPanel.tsx
    - packages/client/src/components/layout/BettingPanel.tsx
    - packages/client/src/components/layout/InfoPanel.tsx
    - packages/client/src/components/layout/ChatPanel.tsx
    - packages/client/src/components/layout/HandReferenceDialog.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/components/layout/WaitingRoom.tsx
  modified:
    - packages/client/src/pages/MainPage.tsx
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - "evaluateHand를 클라이언트에서 직접 호출하여 족보명 인라인 표시 — 서버 result phase 이전에도 플레이어에게 자신의 패 정보 제공"
  - "PlayerSeat 모바일/데스크톱 이중 렌더 — CSS custom properties 원형 배치는 md 이상, 모바일은 별도 flex 아이템으로 동일 내용 표시"
  - "RoomPage: waiting/게임진행/result 3단계 화면 전환 FSM, join-room emit은 06-03에서 통합"
metrics:
  duration_min: 8
  completed_date: "2026-03-30"
  tasks_completed: 3
  files_created: 11
  files_modified: 2
---

# Phase 6 Plan 02: 핵심 게임 UI 컴포넌트 구현 Summary

**한 줄 요약:** CSS custom properties 원형 배치 PlayerSeat, CardFace/CardBack 앞뒤면 분기, BettingPanel 4단계 칩 입력, HandReferenceDialog 족보 순위표 Dialog 등 13개 React 컴포넌트를 구현하여 로비~게임 테이블 전체 UI 와이어프레임 완성.

---

## 완료된 태스크

| Task | 이름 | Commit | 주요 파일 |
|------|------|--------|---------|
| 1 | 게임 도메인 컴포넌트 4개 | 140fc8a | CardFace, CardBack, PlayerSeat, ChipDisplay |
| 2 | 레이아웃 패널 5개 + HandReferenceDialog | 9cecba4 | HandPanel, BettingPanel, InfoPanel, ChatPanel, HandReferenceDialog |
| 3 | WaitingRoom + GameTable + RoomPage FSM + MainPage | 9ff4248 | GameTable, WaitingRoom, RoomPage.tsx, MainPage.tsx |

---

## 구현 상세

### Task 1: 게임 도메인 컴포넌트

- **CardFace**: `rankToKorean()` 텍스트 + gwang(노란 Badge)/yeolkkeut(파란 Badge) 속성 표시
- **CardBack**: muted 단색 블록, "?" 텍스트 — UI-08 뒷면 요구사항 충족
- **PlayerSeat**: `--angle` CSS variable + `rotate/translateY` 원형 배치 (데스크톱 md+), 모바일 별도 flex, `ring-2 ring-primary` 턴 하이라이트, isMe 조건 앞면/뒷면 분기
- **ChipDisplay**: 만(빨강)/5천(초록)/천(파랑)/5백(회색) 4색 칩 단위 Badge

### Task 2: 레이아웃 패널

- **HandPanel**: 손패 + `evaluateHand()` 호출로 족보명 Badge 자동 표시 + "족보 참고표" 버튼
- **HandReferenceDialog**: 전체 족보 20종 순위표 (광땡/땡/특수/끗 Separator 구분) + 땡잡이/암행어사 설명, `max-h-[80vh] overflow-y-auto`
- **BettingPanel**: +500/+1,000/+5,000/+10,000 칩 입력 + 콜/레이즈/다이/체크 버튼 + `isMyTurn` 제어, 체크는 `currentBetAmount === 0`일 때만
- **InfoPanel**: 내 잔액 + 팟 + 상대 잔액 목록 (Separator 구분)
- **ChatPanel**: 레이아웃 예약 placeholder ("채팅 준비 중")

### Task 3: 조립

- **GameTable**: 데스크톱 480×480px 원형 컨테이너 + 팟 중앙 표시, 모바일 그리드 레이아웃
- **WaitingRoom**: 방 URL 표시 + "링크 복사" 버튼(1.5s "복사됨!" 전환), 참가자 목록, 방장 전용 "게임 시작" 버튼(2명 미만 disabled), 빈 상태 메시지
- **RoomPage**: `gameState.phase` 기반 3단계 화면 전환(waiting→게임진행→result), Sonner toast 에러 처리, BettingPanel은 `phase === 'betting'`일 때만 표시
- **MainPage**: 초기 칩 금액 입력(만원 단위, 기본 100,000원) + 에러 toast 추가

---

## 검증 결과

- `pnpm --filter @sutda/client build` 성공 (450KB JS, 22.6KB CSS)
- `pnpm --filter @sutda/client test` 통과 (10 passed, 17 todo skipped)
- GameTable 원형 배치 CSS (`translateY(-200px)`) 적용 확인
- BettingPanel 4개 액션 버튼 + isMyTurn disabled 제어
- WaitingRoom URL 복사 + 게임 시작 버튼 구현
- RoomPage phase 기반 조건부 렌더링 작동
- HandPanel 족보 참고표 버튼 → HandReferenceDialog 트리거

---

## 플랜 대비 편차

없음 - 플랜 명세대로 실행.

---

## Known Stubs

- **ChatPanel** (`packages/client/src/components/layout/ChatPanel.tsx`): 레이아웃 예약 placeholder, 실제 채팅 기능 없음 (v1 범위 밖)
- **RoomPage result/finished phase** (`packages/client/src/pages/RoomPage.tsx`, L70-75): "결과 화면 (준비 중)" placeholder — 06-03 Plan에서 ResultScreen 컴포넌트로 교체 예정
- **join-room emit** (RoomPage): 06-03 Task 2에서 닉네임 입력 + join-room 최종 통합 예정

---

## Self-Check: PASSED

파일 존재 확인:
- packages/client/src/components/game/CardFace.tsx: FOUND
- packages/client/src/components/game/CardBack.tsx: FOUND
- packages/client/src/components/game/PlayerSeat.tsx: FOUND
- packages/client/src/components/game/ChipDisplay.tsx: FOUND
- packages/client/src/components/layout/HandPanel.tsx: FOUND
- packages/client/src/components/layout/BettingPanel.tsx: FOUND
- packages/client/src/components/layout/InfoPanel.tsx: FOUND
- packages/client/src/components/layout/ChatPanel.tsx: FOUND
- packages/client/src/components/layout/HandReferenceDialog.tsx: FOUND
- packages/client/src/components/layout/GameTable.tsx: FOUND
- packages/client/src/components/layout/WaitingRoom.tsx: FOUND

커밋 확인:
- 140fc8a: feat(06-02): 게임 도메인 컴포넌트 4개 구현
- 9cecba4: feat(06-02): 레이아웃 패널 5개 + 족보 참고표 Dialog 구현
- 9ff4248: feat(06-02): GameTable + WaitingRoom + RoomPage phase FSM + MainPage 완성
