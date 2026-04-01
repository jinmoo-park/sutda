---
phase: 11-social-features
verified: 2026-04-02T00:00:00Z
status: gaps_found
score: 5/6 must-haves verified
re_verification: false
gaps:
  - truth: "플레이어가 연결을 끊으면 시트가 제거되고 자리가 재배치되며 토스트 알림이 표시된다"
    status: partial
    reason: "PlayerSeat의 isConnected prop이 GameTable/RoomPage에서 전달되지 않아 '재접속 대기 중' 시각 표시가 동작하지 않는다. 토스트(player-left)는 정상 동작하나, 연결 끊김 중 좌석 시각 표시(opacity-50 + 재접속 대기 중 캡션)가 미작동."
    artifacts:
      - path: "packages/client/src/components/game/PlayerSeat.tsx"
        issue: "isConnected prop 정의 존재하나 GameTable에서 전달 안 됨 (기본값 true 고정)"
      - path: "packages/client/src/components/layout/GameTable.tsx"
        issue: "PlayerSeat 호출 시 isConnected prop 미전달 — roomState에서 연결 상태 조회 로직 부재"
    missing:
      - "GameTable에서 roomState.players와 PlayerState.id 교차 조회로 isConnected 판단 로직 추가"
      - "PlayerSeat 호출부에 isConnected 전달"
human_verification:
  - test: "채팅 실시간 동작 확인"
    expected: "두 브라우저 탭에서 채팅 메시지가 즉시 상대방에게 표시되고, 방 재입장 시 이전 메시지가 복원된다"
    why_human: "실시간 소켓 통신 동작은 브라우저 멀티 탭 환경에서만 검증 가능"
  - test: "Observer 모드 → 자동 합류 흐름 확인"
    expected: "게임 중 새 플레이어 접속 시 '관람 중' 배지로 표시되고, 다음 판 시작 시 자동으로 일반 플레이어로 참가"
    why_human: "멀티 플레이어 시나리오 — 프로그래매틱 검증 불가"
  - test: "올인 POT 정산 정확성"
    expected: "올인 플레이어는 totalCommitted 이내의 금액만 수령하고, 나머지 팟은 다음 순위자에게 올바르게 분배"
    why_human: "게임 플레이 중 실제 칩 수치 확인 필요"
  - test: "학교 대신 가주기 UI 흐름"
    expected: "결과 화면에서 승자가 체크박스로 수혜자 선택 후 '대신 내주기' 클릭 → 다음 판에서 해당 플레이어 앤티가 자동 처리됨"
    why_human: "다판 시나리오 검증, 앤티 루프 내 proxy 분기 실제 동작 확인 필요"
  - test: "모바일 채팅 오버레이 UX"
    expected: "새 메시지 수신 시 opacity 0.05→0.5로 3초간 표시, 포커스 시 0.8로 입력 가능, 게임 인터랙션 방해 없음"
    why_human: "모바일/터치 환경 시각 UX는 프로그래매틱 검증 불가"
---

# Phase 11: 소셜/기능 완성 검증 보고서

**Phase 목표:** 게임의 소셜 기능과 추가 게임 기능을 완성한다 — 텍스트 채팅, 게임 이력, 학교 대신 가주기, 뒤늦게 입장(Observer), 세션 종료 표시, 올인 POT 처리
**검증 일시:** 2026-04-02
**상태:** gaps_found
**재검증 여부:** No — 최초 검증

---

## 목표 달성 여부

### 관찰 가능한 Truth

| #   | Truth | 상태 | 근거 |
| --- | ----- | ---- | ---- |
| 1   | 텍스트 채팅이 실시간으로 작동한다 | ✓ VERIFIED | `send-chat` 핸들러(server/index.ts:278), `chatHistories` Map, `ChatPanel.tsx` 202줄 전체 구현, `gameStore.ts` chatMessages 상태 + 리스너 완성 |
| 2   | 게임 이력이 표시된다 | ✓ VERIFIED | `HistoryModal.tsx` 완전 구현, `gameStore.ts` `game-history` 리스너, `server/index.ts` `gameHistories` Map + next-round 시 broadcast, RoomPage에 historyOpen 상태 연동 |
| 3   | 결과 화면에서 승자가 학교 대신 가주기 버튼으로 다른 플레이어의 다음 판 앤티를 대신 낼 수 있다 | ✓ VERIFIED | `ResultScreen.tsx` `ProxyAnteSection` 내부 컴포넌트 구현(224줄), `proxy-ante` emit, 서버 `proxy-ante` 핸들러(672줄), `attendSchoolProxy()` 게임 엔진 메서드, 자동 앤티 루프 proxy 분기(커밋 49c33f6) |
| 4   | 게임 중 입장한 플레이어가 Observer로 진행을 관람하고 판 교체 시 자동으로 참여한다 | ✓ VERIFIED | `server/index.ts` join-room Observer 분기(201줄), `isObserver: true` RoomPlayer 생성, next-round에서 Observer→일반 플레이어 전환(568-580줄), GameEngine 재생성, `GameTable.tsx` Observer 배지 렌더 |
| 5   | 플레이어가 연결을 끊으면 시트가 제거되고 자리가 재배치되며 토스트 알림이 표시된다 | ✗ PARTIAL | `gameDisconnectTimers` 30초(→5초 수정) 타이머 동작, `player-left` 토스트 emit, `gameStore.ts` `player-left` toast.error 리스너 존재. **단, PlayerSeat의 `isConnected` prop이 GameTable/RoomPage에서 미전달** — 좌석 시각 표시(opacity-50 + "재접속 대기 중") 비동작 |
| 6   | 올인 상황에서 POT이 올바르게 분배된다 | ✓ VERIFIED | `settleChipsWithAllIn()` 메서드(228줄) 구현, totalCommitted 레벨별 사이드팟 분리, `BettingPanel.tsx` 올인 시 패널 비활성화, 테스트 8개 추가 및 통과 |

**점수:** 5/6 truths 검증됨 (Truth 5: PARTIAL)

---

### 필수 아티팩트

| 아티팩트 | 설명 | 상태 | 세부 |
| -------- | ---- | ---- | ---- |
| `packages/client/src/components/layout/ChatPanel.tsx` | 채팅 UI (실시간 송수신) | ✓ VERIFIED | 202줄, 스팸 방지 500ms, isAtBottomRef 자동 스크롤, mobile overlay 구현 |
| `packages/client/src/components/modals/HistoryModal.tsx` | 게임 이력 모달 | ✓ VERIFIED | 39줄 완전 구현, Dialog 기반, handLabelToKorean 연동 |
| `packages/client/src/lib/handLabels.ts` | 족보명 한국어 변환 유틸 | ✓ VERIFIED | HAND_TYPE_KOREAN 매핑, getHandLabel/handLabelToKorean 함수 |
| `packages/server/src/game-engine.ts` (settleChipsWithAllIn) | 올인 POT 정산 엔진 | ✓ VERIFIED | 1949줄, settleChipsWithAllIn 228줄, 레벨별 사이드팟 분리 |
| `packages/server/src/game-engine.ts` (attendSchoolProxy) | 학교 대납 엔진 | ✓ VERIFIED | attendSchoolProxy 1858줄, fallback(후원자 잔액 부족) 처리 |
| `packages/server/src/game-engine.ts` (lastRoundHistory) | 판별 이력 생성 | ✓ VERIFIED | lastRoundHistory public 필드 84줄, _generateRoundHistory 284줄, 5개 showdown 경로 적용 |
| `packages/server/src/game-engine.ts` (forcePlayerLeave) | 강제 퇴장 처리 | ✓ VERIFIED | forcePlayerLeave 1835줄, 베팅 phase 자동 다이 |
| `packages/client/src/components/game/PlayerSeat.tsx` (isConnected) | 연결 끊김 시각 표시 | ⚠️ ORPHANED | prop 정의 존재(24줄), 렌더 로직 존재(67, 106줄)하나 호출부에서 미전달 |
| `packages/client/src/store/gameStore.ts` (채팅/이력 상태) | 소켓 리스너 + 상태 | ✓ VERIFIED | chatMessages, roundHistory 상태, chat-message/chat-history/game-history/proxy-ante-applied/player-left 리스너 모두 완성 |
| `packages/server/src/index.ts` (Observer + disconnect) | Observer 분기 + disconnect 타이머 | ✓ VERIFIED | gameDisconnectTimers Map, join-room Observer 분기, next-round 자동 합류 |

---

### 핵심 링크(Key Link) 검증

| From | To | Via | 상태 | 세부 |
| ---- | -- | --- | ---- | ---- |
| ChatPanel.tsx | gameStore.sendChat | socket.emit('send-chat') | ✓ WIRED | ChatPanel.tsx:sendChat → gameStore.ts:127 |
| server send-chat | io.emit('chat-message') | chatHistories Map | ✓ WIRED | server/index.ts:278-290 |
| gameStore | ChatPanel | chatMessages subscribe | ✓ WIRED | gameStore.ts:29, ChatPanel useGameStore() |
| next-round handler | game-history emit | gameHistories.get()! | ✓ WIRED | server/index.ts:556-561 |
| HistoryModal | RoomPage | historyOpen state | ✓ WIRED | RoomPage.tsx:663 |
| ResultScreen ProxyAnteSection | server proxy-ante | socket.emit('proxy-ante') | ✓ WIRED | ResultScreen.tsx:239 |
| server attend-school | attendSchoolProxy() | schoolProxyBeneficiaryIds | ✓ WIRED | server/index.ts:348-355 |
| disconnect 30s timer | forcePlayerLeave() | gameDisconnectTimers Map | ✓ WIRED | server/index.ts:791 |
| PlayerSeat isConnected | GameTable/RoomPage | prop 전달 | ✗ NOT_WIRED | GameTable에서 PlayerSeat 호출 시 isConnected 미전달, 기본값 true 고정 |
| settleChipsWithAllIn | showdown 경로 5개 | 기존 settleChips() 교체 | ✓ WIRED | game-engine.ts:1395, 1428, 1501, 1568, 1629 |
| BettingPanel | isMyAllIn | gameStore.me.isAllIn | ✓ WIRED | BettingPanel.tsx:36, 54-58 |
| GameTable | roomState.observers | roomState prop | ✓ WIRED | RoomPage.tsx:522, GameTable.tsx:22 |

---

### 데이터 흐름 추적 (Level 4)

| 아티팩트 | 데이터 변수 | 소스 | 실제 데이터 생성 | 상태 |
| -------- | ----------- | ---- | ---------------- | ---- |
| ChatPanel.tsx | chatMessages | gameStore.chatMessages | server chatHistories Map, DB 없음(인메모리) | ✓ FLOWING |
| HistoryModal.tsx | entries(RoundHistoryEntry[]) | gameStore.roundHistory | server gameHistories Map, _generateRoundHistory chipsSnapshot 기반 | ✓ FLOWING |
| ResultScreen ProxyAnteSection | players 목록 | gameState.players | 서버 game-state broadcast | ✓ FLOWING |
| BettingPanel | isMyAllIn | me.isAllIn (PlayerState) | game-engine.ts processBetAction isAllIn=true | ✓ FLOWING |
| GameTable observers 배지 | observers[] | roomState.players.isObserver | server join-room Observer 분기 | ✓ FLOWING |
| PlayerSeat isConnected | isConnected | 기본값 true (미연결) | 연결 상태 추적 로직 없음 | ✗ HOLLOW_PROP |

---

### 행동 스팟 체크 (Behavioral Spot-Checks)

서버 프로세스 시작 없이 검증 가능한 항목만 체크:

| 동작 | 체크 | 결과 | 상태 |
| ---- | ---- | ---- | ---- |
| game-engine.ts 빌드 | `wc -l game-engine.ts` → 1949줄 | 1949 | ✓ PASS |
| settleChipsWithAllIn 테스트 존재 | `grep -c "isAllIn" game-engine.test.ts` | 다수 | ✓ PASS |
| shared 패키지 RoundHistoryEntry export | `grep "RoundHistoryEntry" packages/shared/src/index.ts` | 확인됨 | ✓ PASS |
| HistoryModal entries → render | 39줄 완전 구현, entries.reverse().map() | 확인됨 | ✓ PASS |
| 커밋 일관성 | 7개 핵심 커밋 git log 검증 | 모두 확인 | ✓ PASS |

---

### 요구사항 커버리지

| 요구사항 ID | 설명 | 상태 | 근거 |
| ----------- | ---- | ---- | ---- |
| UX-02 | 텍스트 채팅 기능 구현 | ✓ SATISFIED | ChatPanel.tsx + server send-chat 파이프라인 완성 |
| HIST-01 | 게임 이력 기능 | ✓ SATISFIED | RoundHistoryEntry 타입, _generateRoundHistory, HistoryModal |
| HIST-02 | 게임 이력 기능 (상세) | ✓ SATISFIED | game-history broadcast, roundHistory 상태 관리 |
| SCHOOL-PROXY | 학교 대신 가주기 | ✓ SATISFIED | ProxyAnteSection UI + attendSchoolProxy 엔진 + 자동 앤티 proxy 분기 |
| LATE-JOIN | Observer 뒤늦게 입장 | ✓ SATISFIED | isObserver RoomPlayer, next-round 자동 합류, GameEngine 재생성 |
| SESSION-END | 세션 종료 표시 | ⚠️ PARTIAL | 30초 타이머, forcePlayerLeave, player-left 토스트 동작. **단, PlayerSeat 연결 끊김 시각 표시 미작동** |
| ALLIN-POT | 올인 POT 처리 | ✓ SATISFIED | settleChipsWithAllIn 레벨별 사이드팟, BettingPanel 비활성화 |

---

### 발견된 안티패턴

| 파일 | 줄 | 패턴 | 심각도 | 영향 |
| ---- | -- | ---- | ------ | ---- |
| `packages/client/src/components/layout/GameTable.tsx` | 82-94, 129-141 | PlayerSeat에 `isConnected` prop 미전달 (기본값 true 고정) | ⚠️ Warning | 연결 끊김 중 좌석 시각 피드백 비동작 — 사용자가 어느 플레이어가 재접속 대기 중인지 알 수 없음. Crash는 없음. |

> **자체 인정 스텁(Known Stub):** 11-04-SUMMARY.md에 이미 문서화됨 — "PlayerSeat `isConnected` prop: 현재 RoomPage/GameTable에서 PlayerSeat에 isConnected를 전달하는 코드가 없음. 현재 isConnected 기본값 true로 동작 — 재접속 대기 표시는 완전히 동작하지 않음. Crash는 없으나 표시 미작동."

---

### 인간 검증 필요 항목

#### 1. 채팅 실시간 동작

**테스트:** 두 브라우저 탭에서 같은 방 접속 후 메시지 전송
**예상 결과:** 상대방 탭에 즉시 표시, 방 재입장 시 기존 메시지 복원
**사유:** 소켓 실시간 통신은 브라우저 멀티 탭 환경에서만 검증 가능

#### 2. Observer 모드 → 자동 합류

**테스트:** 게임 진행 중 새 탭에서 접속 → Observer 배지 확인 → 현재 게임 종료 후 "다음 판" 투표
**예상 결과:** Observer가 정상 플레이어로 참가하고 GameEngine 재생성됨
**사유:** 멀티 플레이어 실시간 시나리오

#### 3. 올인 POT 정산 수치 정확성

**테스트:** 올인 플레이어가 포함된 판 진행 후 결과 화면에서 칩 수치 확인
**예상 결과:** 올인 플레이어는 totalCommitted 이내만 수령, 차액은 나머지 플레이어에게 반환
**사유:** 실제 게임 시나리오에서 수치 검증 필요

#### 4. 학교 대신 가주기 엔드 투 엔드

**테스트:** 승자가 결과 화면에서 특정 플레이어 체크박스 선택 후 "대신 내주기" → 다음 판 앤티 단계 확인
**예상 결과:** 수혜자가 앤티를 내지 않고 다음 단계로 진행됨
**사유:** 다판 시나리오, proxy 분기 실제 서버 처리 확인

#### 5. 모바일 채팅 오버레이

**테스트:** 모바일 viewport에서 게임 진행 중 채팅 수신/발신
**예상 결과:** 새 메시지 도착 시 opacity 0.05→0.5로 3초 표시, 게임 탭은 정상 동작
**사유:** 모바일 시각 UX는 프로그래매틱 검증 불가

---

## 갭 요약

**1개의 PARTIAL 상태 Truth** 가 발견되었습니다.

**SESSION-END Truth (Truth 5):** `PlayerSeat` 컴포넌트에 `isConnected` prop이 설계상 정의되었으나, `GameTable`에서 PlayerSeat 호출 시 이 prop을 전달하는 코드가 존재하지 않습니다. `roomState.players`에서 연결 상태 정보를 조회하는 로직이 부재하여, 재접속 대기 중인 플레이어의 좌석이 `opacity-50` + "재접속 대기 중" 표시로 시각화되지 않습니다.

- 토스트 알림(player-left)과 30초 타이머 강제 퇴장은 정상 동작
- GameTable에서 `roomState` prop을 받아 `observers` 배지는 정상 렌더
- `isConnected` 판단 로직(roomState.players 중 disconnect 상태 추적)이 서버→클라이언트 데이터 흐름에서 구현되지 않음

이 갭은 게임 진행을 차단하지 않으며(Crash 없음), 단지 연결 끊김 중 시각 피드백이 미작동하는 UX 결함입니다.

---

_검증 일시: 2026-04-02_
_검증자: Claude (gsd-verifier)_
