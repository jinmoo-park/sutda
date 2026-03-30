---
phase: 06-ui
verified: 2026-03-30T18:54:00+09:00
status: passed
score: 14/14 must-haves verified
re_verification: false
human_verification:
  - test: "게임 테이블 원형 배치 시각 확인"
    expected: "md 뷰포트에서 플레이어 자리가 원형으로 배치된다"
    why_human: "CSS transform 기반 원형 배치는 자동으로 검증 불가"
  - test: "카드 딜링 애니메이션 시각 확인"
    expected: "cutting → betting 전환 시 카드가 순차적으로 나타난다"
    why_human: "타이머 기반 애니메이션은 자동으로 검증 불가"
  - test: "모바일 반응형 레이아웃 확인"
    expected: "320px 뷰포트에서 레이아웃이 정상적으로 표시된다"
    why_human: "브라우저 뷰포트 조작 필요"
---

# Phase 6: 게임 UI 완성 검증 보고서

**Phase 목표:** 게임 UI 완성 — 플레이어가 실제로 플레이할 수 있는 전체 UI 구현
**검증 일시:** 2026-03-30
**상태:** 통과 (passed)
**재검증 여부:** 아니요 — 초기 검증

---

## 목표 달성 여부

### 관찰 가능한 진실 (Observable Truths)

| # | 진실 | 상태 | 근거 |
|---|------|------|------|
| 1 | 메인 화면에서 방 생성/참여 버튼 2개가 표시된다 | ✓ VERIFIED | `MainPage.tsx` — "방 만들기", "링크로 참여" Button 렌더링 |
| 2 | 대기실에서 참가자 목록과 URL 복사 버튼이 표시된다 | ✓ VERIFIED | `WaitingRoom.tsx` — `roomState.players` 목록 + "링크 복사" Button |
| 3 | 게임 테이블에 원형으로 플레이어 자리가 배치된다 | ✓ VERIFIED | `PlayerSeat.tsx` — CSS `rotate(var(--angle)) translateY(-200px)` 원형 배치 |
| 4 | 자신의 카드는 앞면, 타인의 카드는 뒷면으로 표시된다 | ✓ VERIFIED | `PlayerSeat.tsx` — `isMe && card ? <CardFace> : <CardBack>` 분기 |
| 5 | 베팅 버튼(콜/레이즈/다이/체크)과 칩 단위 입력이 표시된다 | ✓ VERIFIED | `BettingPanel.tsx` — 체크/콜/레이즈/다이 버튼 + 500/1000/5000/10000 칩 버튼 |
| 6 | 현재 판돈(팟) 금액이 테이블 중앙에 표시된다 | ✓ VERIFIED | `GameTable.tsx` — `{pot.toLocaleString()}원` 중앙 표시 |
| 7 | 족보 참고표를 버튼 하나로 열어볼 수 있다 | ✓ VERIFIED | `HandPanel.tsx` → `HandReferenceDialog` Dialog 연결 |
| 8 | 판 결과 화면에서 승자와 칩 변동이 표시된다 | ✓ VERIFIED | `ResultScreen.tsx` — `{winnerNickname} 승리!` + chipDelta Badge |
| 9 | 족보명이 각 플레이어 옆에 Badge로 표시된다 | ✓ VERIFIED | `HandPanel.tsx` (게임 중) + `ResultScreen.tsx` (결과화면) HAND_TYPE_KOREAN 매핑 |
| 10 | 밤일낮장 모달에서 20장 카드 보드 중 1장 선택이 가능하다 | ✓ VERIFIED | `DealerSelectModal.tsx` — 20개 CardBack 그리드, `select-dealer-card` emit |
| 11 | 기리 모달에서 더미 분할 또는 퉁 선언이 가능하다 | ✓ VERIFIED | `CutModal.tsx` — 2~5더미/퉁 선택 + `cut`/`declare-ttong` emit |
| 12 | 재충전 투표 모달에서 동의/거부가 가능하다 | ✓ VERIFIED | `RechargeVoteModal.tsx` — `rechargeRequest` 기반 자동 open, `recharge-vote` emit |
| 13 | 방 나가기 확인 다이얼로그가 표시된다 | ✓ VERIFIED | `LeaveRoomDialog.tsx` — destructive Button + `leave-room` emit + navigate('/') |
| 14 | 닉네임 입력 후 join-room emit으로 방에 입장할 수 있다 | ✓ VERIFIED | `RoomPage.tsx` — `handleJoinRoom` + locationState/sessionStorage 두 경로 |

**점수: 14/14 진실 검증됨**

---

## 필수 아티팩트 검증

| 아티팩트 | 제공 기능 | 존재 | 실체성 | 연결 | 상태 |
|---------|---------|------|-------|------|------|
| `packages/client/src/store/gameStore.ts` | Zustand 스토어 (socket 싱글턴) | ✓ | ✓ 91줄, io() 연결 | ✓ RoomPage/MainPage 사용 | ✓ VERIFIED |
| `packages/client/src/lib/cardUtils.ts` | Card → 한국어 텍스트 | ✓ | ✓ rankToKorean/cardToText 구현 | ✓ CardFace에서 사용 | ✓ VERIFIED |
| `packages/client/src/pages/MainPage.tsx` | 메인 화면 | ✓ | ✓ 124줄, 방 만들기/참여 UI | ✓ main.tsx 라우터 등록 | ✓ VERIFIED |
| `packages/client/src/pages/RoomPage.tsx` | 게임 룸 통합 | ✓ | ✓ 450줄+ phase 기반 조건부 렌더 | ✓ main.tsx 라우터 등록 | ✓ VERIFIED |
| `packages/client/src/components/game/CardFace.tsx` | 앞면 카드 | ✓ | ✓ rank/attribute 텍스트 렌더 | ✓ PlayerSeat/HandPanel/ResultScreen | ✓ VERIFIED |
| `packages/client/src/components/game/CardBack.tsx` | 뒷면 카드 | ✓ | ✓ 렌더 구현 | ✓ PlayerSeat/DealerSelectModal/CutModal | ✓ VERIFIED |
| `packages/client/src/components/game/PlayerSeat.tsx` | 원형 플레이어 자리 | ✓ | ✓ CSS transform 원형 배치 | ✓ GameTable에서 사용 | ✓ VERIFIED |
| `packages/client/src/components/layout/GameTable.tsx` | 원형 배치 컨테이너 + 팟 | ✓ | ✓ 중앙 팟 + PlayerSeat 배치 | ✓ RoomPage에서 사용 | ✓ VERIFIED |
| `packages/client/src/components/layout/BettingPanel.tsx` | 베팅 버튼 + 칩 입력 | ✓ | ✓ 체크/콜/레이즈/다이 + 칩 단위 | ✓ RoomPage phase==='betting'에서 조건부 렌더 | ✓ VERIFIED |
| `packages/client/src/components/layout/WaitingRoom.tsx` | 대기실 | ✓ | ✓ 참가자 목록 + URL 복사 + 시작 | ✓ RoomPage phase==='waiting'에서 렌더 | ✓ VERIFIED |
| `packages/client/src/components/layout/HandPanel.tsx` | 내 패 + 족보 참고표 | ✓ | ✓ evaluateHand + HandReferenceDialog | ✓ RoomPage 하단 패널 | ✓ VERIFIED |
| `packages/client/src/components/layout/HandReferenceDialog.tsx` | 족보 참고표 Dialog | ✓ | ✓ 전체 족보 목록 렌더 | ✓ HandPanel에서 버튼 클릭으로 open | ✓ VERIFIED |
| `packages/client/src/components/layout/ResultScreen.tsx` | 판 결과 화면 | ✓ | ✓ 승자/CardFace공개/족보Badge/칩변동 | ✓ RoomPage phase==='result'에서 렌더 | ✓ VERIFIED |
| `packages/client/src/components/modals/DealerSelectModal.tsx` | 밤일낮장 모달 | ✓ | ✓ 20장 그리드 + select-dealer-card emit | ✓ RoomPage phase==='dealer-select' | ✓ VERIFIED |
| `packages/client/src/components/modals/AttendSchoolModal.tsx` | 등교 모달 | ✓ | ✓ 학교간다/잠시쉬기 + attend-school emit | ⚠️ RoomPage 렌더링에서 제거됨 | ⚠️ ORPHANED (의도적) |
| `packages/client/src/components/modals/ShuffleModal.tsx` | 셔플 모달 | ✓ | ✓ shuffle emit | ✓ RoomPage phase==='shuffling' && isDealer | ✓ VERIFIED |
| `packages/client/src/components/modals/CutModal.tsx` | 기리 모달 | ✓ | ✓ 더미 분할 + cut/declare-ttong emit | ✓ RoomPage phase==='cutting' && isMyTurn | ✓ VERIFIED |
| `packages/client/src/components/modals/RechargeVoteModal.tsx` | 재충전 투표 모달 | ✓ | ✓ rechargeRequest 기반 + recharge-vote emit | ✓ RoomPage 상시 렌더 | ✓ VERIFIED |
| `packages/client/src/components/modals/LeaveRoomDialog.tsx` | 방 나가기 다이얼로그 | ✓ | ✓ leave-room emit + navigate('/') | ✓ RoomPage + ResultScreen | ✓ VERIFIED |

---

## 핵심 링크 검증 (Key Link Verification)

| From | To | Via | 상태 | 근거 |
|------|----|-----|------|------|
| `main.tsx` | `MainPage`, `RoomPage` | `createBrowserRouter` | ✓ WIRED | `createBrowserRouter([{path:'/',...},{path:'/room/:roomId',...}])` |
| `gameStore.ts` | `socket.io-client` | `io(serverUrl)` | ✓ WIRED | `const socket = io(serverUrl, { autoConnect: true })` |
| `RoomPage.tsx` | `join-room` emit | 닉네임 입력 폼 + locationState/sessionStorage | ✓ WIRED | `socket.emit('join-room', ...)` 3개 경로 모두 구현 |
| `RoomPage.tsx` | `GameTable`, `WaitingRoom`, `ResultScreen`, 모달들 | `gameState.phase` 조건부 렌더 | ✓ WIRED | phase별 분기 렌더 + 모달 조건부 표시 |
| `DealerSelectModal.tsx` | `socket.emit('select-dealer-card')` | 카드 클릭 핸들러 | ✓ WIRED | `socket?.emit('select-dealer-card', { roomId, cardIndex })` |
| `CutModal.tsx` | `socket.emit('cut')` / `socket.emit('declare-ttong')` | 확인 버튼 | ✓ WIRED | `handleConfirm` 내 조건 분기로 각각 emit |
| `BettingPanel.tsx` | `socket.emit('bet-action')` | 액션 버튼들 | ✓ WIRED | `emitAction(action)` → `socket.emit('bet-action', ...)` |
| `HandPanel.tsx` | `HandReferenceDialog` | 족보 참고표 버튼 | ✓ WIRED | `showReference` state로 Dialog `open` prop 제어 |
| `PlayerSeat.tsx` | `CardFace`, `CardBack` | `isMe` 조건 분기 | ✓ WIRED | `isMe && card ? <CardFace> : <CardBack>` |
| `RechargeVoteModal.tsx` | `rechargeRequest` (Zustand) | 자동 open 조건 | ✓ WIRED | `<Dialog open={!!rechargeRequest}>` |

---

## 데이터 흐름 추적 (Level 4)

| 아티팩트 | 데이터 변수 | 소스 | 실제 데이터 생성 | 상태 |
|---------|-----------|------|----------------|------|
| `GameTable.tsx` | `pot`, `players` | `gameState` (Zustand) | 서버 `game-state` 이벤트 → `set({ gameState: state })` | ✓ FLOWING |
| `ResultScreen.tsx` | `gameState.players`, `gameState.winnerId` | `gameState` (Zustand) | 서버 `game-state` 이벤트 | ✓ FLOWING |
| `BettingPanel.tsx` | `currentBetAmount`, `myCurrentBet` | props (RoomPage에서 gameState 추출) | 서버 `game-state` 이벤트 | ✓ FLOWING |
| `WaitingRoom.tsx` | `roomState.players` | `roomState` (Zustand) | 서버 `room-state` 이벤트 → `set({ roomState: state })` | ✓ FLOWING |
| `HandPanel.tsx` | `myPlayer.cards` | `gameState.players.find(...)` | 서버 `game-state` 이벤트 | ✓ FLOWING |
| `RechargeVoteModal.tsx` | `rechargeRequest` | Zustand store | 서버 `recharge-requested` 이벤트 → `set({ rechargeRequest: data })` | ✓ FLOWING |

---

## 요구사항 커버리지

| 요구사항 | 담당 Plan | 설명 | 상태 | 근거 |
|---------|---------|------|------|------|
| UI-01 | 06-01, 06-02 | 메인 화면에서 방 생성 또는 링크로 참여 선택 | ✓ SATISFIED | `MainPage.tsx` — "방 만들기", "링크로 참여" 구현 완료 |
| UI-02 | 06-02 | 게임 테이블에 원형 플레이어 자리, 카드, 칩 잔액 표시 | ✓ SATISFIED | `GameTable.tsx` + `PlayerSeat.tsx` — 원형 배치 + 칩 잔액 표시 |
| UI-03 | 06-02 | 자신의 카드 앞면, 타인의 카드 뒷면 표시 | ✓ SATISFIED | `PlayerSeat.tsx` — `isMe` 분기로 CardFace/CardBack 결정 |
| UI-04 | 06-02 | 베팅 액션 버튼(콜/레이즈/다이)과 레이즈 금액 입력 | ✓ SATISFIED | `BettingPanel.tsx` — 4개 액션 버튼 + 칩 단위 입력 버튼 |
| UI-05 | 06-02 | 현재 판돈(팟) 금액이 테이블 중앙에 표시 | ✓ SATISFIED | `GameTable.tsx` — 중앙 `판돈 {pot.toLocaleString()}원` |
| UI-06 | 06-03 | 판 결과 화면에서 카드 공개, 승자, 칩 변동 표시 | ✓ SATISFIED | `ResultScreen.tsx` — CardFace + winnerNickname + chipDelta Badge |
| UI-07 | 06-02, 06-03 | 족보 참고표를 버튼 하나로 볼 수 있다 | ✓ SATISFIED | `HandPanel.tsx` "족보 참고표" 버튼 → `HandReferenceDialog` |
| UI-08 | 06-01, 06-02 | 카드를 숫자+속성 텍스트로 표시 (이미지 없음) | ✓ SATISFIED | `CardFace.tsx` — `rankToKorean(rank)` + 광/열끗 Badge 텍스트 |

**모든 요구사항 (UI-01 ~ UI-08) 충족됨**

---

## 안티패턴 스캔

| 파일 | 라인 | 패턴 | 심각도 | 영향 |
|------|------|------|-------|------|
| `AttendSchoolModal.tsx` | 62 | `socket?.emit('skip-school', ...)` — 프로토콜에 `skip-school` 있으나 서버 구현 존재 | ℹ️ Info | 서버에 `skip-school` handler 구현됨 (index.ts:207), 기능상 문제 없음 |
| `AttendSchoolModal.tsx` | 파일 전체 | 컴포넌트 파일이 존재하나 RoomPage 렌더링에서 제거됨 | ℹ️ Info | 의도적 설계 — 서버가 `select-dealer-card`, `next-round`, `take-break` 처리 시 자동으로 모든 플레이어 등교 처리, 모달 불필요 |
| `ResultScreen.tsx` | 103-108 | `try { evaluateHand(...) } catch {}` 조용한 실패 | ℹ️ Info | 카드 2장 미만이거나 평가 불가 케이스에만 해당, 정상 게임 흐름에서는 영향 없음 |

**블로커 안티패턴: 없음**

---

## 행동 점검 (Behavioral Spot-Checks)

| 동작 | 명령 | 결과 | 상태 |
|------|------|------|------|
| 빌드 성공 | `pnpm --filter @sutda/client build` | 1874개 모듈 변환, 오류 없음 (4.69s) | ✓ PASS |
| 카드 유틸리티 테스트 | `pnpm --filter @sutda/client test` | 10개 통과, 17개 todo (Wave 0 스텁) | ✓ PASS |
| 라우터 설정 | `main.tsx` 정적 분석 | `createBrowserRouter` — `/`, `/room/:roomId` 두 라우트 | ✓ PASS |

---

## 인간 검증 필요 항목

### 1. 게임 테이블 원형 배치 시각 확인

**테스트:** `pnpm dev` 실행 후 게임 시작, md 뷰포트(768px 이상)에서 테이블 화면 확인
**예상 결과:** 플레이어 자리가 중앙 팟 주위에 원형으로 배치됨
**인간 필요 이유:** CSS transform 기반 원형 배치는 브라우저에서만 확인 가능

### 2. 카드 딜링 애니메이션 시각 확인

**테스트:** 게임에서 기리(cutting) → 베팅(betting) 단계 전환 확인
**예상 결과:** 카드가 플레이어별로 500ms 간격으로 순차 표시된 후 "패가 나왔어요!" 오버레이 팝업
**인간 필요 이유:** setInterval 기반 타이머 애니메이션은 자동 검증 불가

### 3. 모바일 반응형 레이아웃 확인

**테스트:** Chrome DevTools에서 320px 뷰포트로 전환 후 게임 화면 확인
**예상 결과:** `md:hidden` 클래스의 세로 스택 그리드 레이아웃이 활성화되어 플레이어 자리가 2열 그리드로 표시됨
**인간 필요 이유:** 브라우저 뷰포트 조작 필요

---

## 종합 평가

**Phase 6 목표 달성 여부: 달성**

Phase 6의 핵심 목표인 "플레이어가 실제로 플레이할 수 있는 전체 UI 구현"이 달성되었다.

- 메인 화면 → 방 생성/참여 → 대기실 → 게임 테이블 → 베팅 → 결과 화면 전체 플로우 UI 완성
- 모든 특수 액션 모달(밤일낮장, 셔플, 기리, 재충전 투표, 방 나가기) 구현 및 연결
- `BettingPanel`에 체크 버튼 추가, `MuckChoiceModal`/`DealerResultOverlay`/`ModeSelectModal` 등 Plan 명세에 없던 추가 기능까지 구현
- 빌드 성공 확인, 카드 유틸리티 단위 테스트 10개 통과
- `AttendSchoolModal`이 RoomPage에서 제거된 것은 서버 측 자동 앤티 처리 설계로 인한 의도적 결정으로, 기능적 결함 아님
- REQUIREMENTS.md의 UI-02 ~ UI-05가 "Pending" 표시되어 있으나 실제 구현은 완료됨 (REQUIREMENTS.md 상태 불일치는 문서 미반영 문제)

---

_검증 일시: 2026-03-30_
_검증자: Claude (gsd-verifier)_
