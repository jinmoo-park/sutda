---
phase: 04-original-mode-game-engine
verified: 2026-03-29T14:55:00Z
status: passed
score: 15/15 must-haves verified
re_verification: false
---

# Phase 4: 오리지날 모드 게임 엔진 검증 보고서

**Phase 목표:** GameEngine 클래스 + Socket.IO 연결로 오리지날 모드 한 판의 전체 플로우(dealer-select → attend-school → mode-select → shuffling → cutting → dealing → betting → showdown → result)가 작동하는 서버 구현 완성
**검증 일시:** 2026-03-29T14:55:00Z
**상태:** PASSED
**재검증 여부:** 아니오 — 최초 검증

---

## 목표 달성 여부

### 관찰 가능한 진실 (Observable Truths)

ROADMAP.md의 Success Criteria 5개 + Plan 문서의 must_haves를 기반으로 검증

| # | 진실 | 상태 | 근거 |
|---|------|------|------|
| 1 | 첫 판에서 밤일낮장 규칙으로 선 플레이어가 자동 결정되고, 이후 판은 승자가 선이 된다 | ✓ VERIFIED | `selectDealerCard()` KST 시간 기반 night/day 분기 구현 확인, `setDealerFromPreviousWinner()` 존재, 테스트 3개 통과 |
| 2 | 선 플레이어가 셔플 후 기리를 요청하면 왼쪽 플레이어가 기리/퉁을 선택할 수 있다 | ✓ VERIFIED | `shuffle()` Fisher-Yates 구현, `cut()` 복수분할 재조립, `declareTtong()` 구현, cutterPlayerId = (dealerSeatIndex+1)%total |
| 3 | 반시계 방향으로 카드가 정확히 배분된다 (일반: 1장씩, 퉁: 2장씩) | ✓ VERIFIED | `_dealCards()` + `_getAlivePlayersInCounterClockwiseOrder()` 구현 확인, dealer=0일 때 [3,2,1,0] 순서 테스트 통과 |
| 4 | 베팅 라운드에서 콜/레이즈/다이/체크가 순서대로 진행되고 모든 생존자 금액이 같아지면 종료된다 | ✓ VERIFIED | `processBetAction()` 4가지 액션 구현, `_isBettingComplete()` 종료 조건, `_bettingActed` Set으로 액션 추적 |
| 5 | 족보 비교로 승자가 결정되고 다음 판으로 넘어갈 수 있다 | ✓ VERIFIED | `revealCard()` → `_resolveShowdown()` → `evaluateHand + compareHands` → result 전환, `nextRound()` 구현 |
| 6 | 동점 시 재경기가 트리거된다 | ✓ VERIFIED | `_resolveShowdown()` 동점 감지 → `rematch-pending`, `startRematch()` 동점자만 생존 + pot 유지 + shuffling 전환 |
| 7 | start-game 이벤트 후 GameEngine이 생성되고 game-state가 브로드캐스트된다 | ✓ VERIFIED | `index.ts`의 start-game 핸들러에서 `new GameEngine()` 생성 + `io.to(roomId).emit('game-state')` 확인 |
| 8 | 클라이언트 게임 이벤트가 GameEngine 메서드로 전달된다 | ✓ VERIFIED | 9개 이벤트 핸들러 (attend-school, select-mode, shuffle, cut, declare-ttong, bet-action, reveal-card, next-round, select-dealer-card) 모두 index.ts에 존재 |
| 9 | 잘못된 액션 시 game-error가 해당 소켓에만 전송된다 | ✓ VERIFIED | `handleGameAction()` 헬퍼 try-catch 구현, `socket.emit('game-error', ...)` 패턴 확인 |
| 10 | 미등교 플레이어는 isAlive=false로 처리된다 | ✓ VERIFIED | `completeAttendSchool()` 미등교자 isAlive=false, 테스트 통과 |
| 11 | 전체 FSM 상태 전환이 순서대로 작동한다 (dealer-select → attend-school → ... → result) | ✓ VERIFIED | full flow integration 테스트 3개 통과, 59개 game-engine 테스트 전체 통과 |
| 12 | 잘못된 phase에서 액션 시도 시 INVALID_PHASE 에러가 발생한다 | ✓ VERIFIED | `assertPhase()` private 메서드로 모든 public 메서드에서 phase 검증, 통합 테스트 1개 통과 |
| 13 | rematch-pending phase에서 기존 메서드 호출 시 INVALID_PHASE 에러가 발생한다 | ✓ VERIFIED | rematch-pending phase FSM validation describe 블록 3개 테스트 통과 |
| 14 | 레이즈 후 다른 플레이어에게 재베팅 기회가 주어진다 (순환) | ✓ VERIFIED | `_bettingActed` Set이 레이즈 시 레이즈한 플레이어만 남기고 초기화, 테스트 통과 |
| 15 | 2판 연속에서 1판 승자가 2판 선으로 설정된다 | ✓ VERIFIED | `nextRound()` prevWinnerId → isDealer=true 로직, 통합 테스트 통과 |

**점수:** 15/15 진실 검증됨

---

## 필수 아티팩트 검증

### Level 1 (존재), Level 2 (실질), Level 3 (연결), Level 4 (데이터 흐름)

| 아티팩트 | 예상 제공 기능 | 상태 | 세부 사항 |
|---------|-------------|------|---------|
| `packages/shared/src/types/game.ts` | GamePhase에 dealer-select/attend-school 추가, BetAction 타입 | ✓ VERIFIED | dealer-select, attend-school, rematch-pending 포함, BetAction union 타입 정의, deck/isTtong/attendedPlayerIds/winnerId/tiedPlayerIds 필드 확인 |
| `packages/shared/src/types/protocol.ts` | 게임 이벤트 타입 (attend-school, shuffle, cut, bet-action 등) | ✓ VERIFIED | ClientToServerEvents에 9개 게임 이벤트, ServerToClientEvents에 game-state/game-error 이벤트 확인 |
| `packages/shared/src/index.ts` | BetAction export | ✓ VERIFIED | `export type { GamePhase, GameMode, PlayerState, GameState, BetAction } from './types/game'` 확인 |
| `packages/server/src/game-engine.ts` | GameEngine 클래스 — FSM + 셔플/기리/배분/베팅/쇼다운 | ✓ VERIFIED | 655라인, export class GameEngine, 모든 required 메서드 존재 |
| `packages/server/src/game-engine.test.ts` | GameEngine 단위 테스트 | ✓ VERIFIED | 1007라인, 59개 테스트 전체 통과 |
| `packages/server/src/index.ts` | GameEngine Map + Socket.IO 게임 이벤트 핸들러 | ✓ VERIFIED | import GameEngine, gameEngines Map, 9개 이벤트 핸들러, handleGameAction 헬퍼 |
| `packages/server/src/index.test.ts` | Socket.IO 게임 이벤트 통합 테스트 | ✓ VERIFIED | 6개 통합 테스트 전체 통과 |

---

## 핵심 연결 검증 (Key Links)

| From | To | Via | 상태 | 근거 |
|------|-----|-----|------|------|
| `game-engine.ts` | `@sutda/shared` | `import { createDeck, evaluateHand, compareHands }` | ✓ WIRED | 파일 1번째 줄에 import 확인 |
| `game-engine.ts` | `packages/shared/src/types/game.ts` | GameState, PlayerState, GamePhase 타입 사용 | ✓ WIRED | `import type { Card, GameState, GameMode, PlayerState, RoomPlayer, BetAction }` 확인 |
| `game-engine.ts` | `compareHands` | `_resolveShowdown()` 내부에서 compareHands 호출 | ✓ WIRED | 라인 549 `compareHands(best.hand, h.hand)` 확인 |
| `processBetAction` | `_isBettingComplete` | 매 액션 후 종료 조건 확인 | ✓ WIRED | `_advanceBettingTurn()` 내에서 `this._isBettingComplete()` 호출 확인 |
| `index.ts` | `game-engine.ts` | `import { GameEngine } from './game-engine.js'` | ✓ WIRED | index.ts 라인 12 확인 |
| `index.ts` | `io.to(roomId).emit('game-state')` | GameEngine 상태 변경 후 브로드캐스트 | ✓ WIRED | `handleGameAction()` 헬퍼 내 `io.to(roomId).emit('game-state', engine.getState() as GameState)` 확인 |

---

## 데이터 흐름 추적 (Level 4)

게임 엔진은 서버 사이드 순수 로직 (FSM + 상태 관리)으로, 동적 데이터는 Socket.IO 이벤트를 통해 흐릅니다.

| 데이터 소스 | 데이터 변수 | 흐름 | 상태 |
|-----------|-----------|------|------|
| Socket.IO 이벤트 → `handleGameAction()` | `GameEngine.state` | 클라이언트 이벤트 → GameEngine 메서드 → `engine.getState()` → `io.to(roomId).emit('game-state')` | ✓ FLOWING |
| `createDeck()` (@sutda/shared) | `state.deck` | createDeck() → Fisher-Yates 셔플 → _dealCards()로 배분 | ✓ FLOWING |
| `evaluateHand + compareHands` (@sutda/shared) | 승자 판정 | `_resolveShowdown()` → evaluateHand(cards) → compareHands() → winnerId/tiedPlayerIds | ✓ FLOWING |

---

## 동작 스팟 체크 (Behavioral Spot-Checks)

| 동작 | 확인 방법 | 결과 | 상태 |
|------|---------|------|------|
| 서버 테스트 전체 통과 | `pnpm --filter @sutda/server test` | 89 passed (game-engine: 59, room-manager: 19, integration: 5, index: 6) | ✓ PASS |
| shared 패키지 빌드 성공 | `pnpm --filter @sutda/shared build` | exit code 0, 타입 에러 없음 | ✓ PASS |
| shared 테스트 전체 통과 | `pnpm --filter @sutda/shared test` | 96 passed | ✓ PASS |
| game-engine.ts 최소 라인 수 | wc -l game-engine.ts | 655라인 (최소 150라인 기준 충족) | ✓ PASS |
| game-engine.test.ts 테스트 개수 | grep -c "it(" | 59개 (최소 30개 기준 충족) | ✓ PASS |

---

## 요구사항 커버리지

| 요구사항 ID | 소스 Plan | 설명 | 상태 | 근거 |
|-----------|---------|------|------|------|
| SEAT-01 | 04-01, 04-03 | 플레이어들은 원형으로 배치되어 화면에 표시된다 | ⚠️ PARTIAL | seatIndex 서버 모델 구현됨. UI 원형 배치는 Phase 10 범위 (ROADMAP.md 이중 할당 확인됨 — Phase 4와 Phase 10 모두에 SEAT-01 명시). 서버 측 자리 모델 구현은 완료 |
| SEAT-02 | 04-01 | 첫 판 밤일낮장 규칙으로 선 결정 (18:00~05:59 낮은 숫자, 06:00~17:59 높은 숫자) | ✓ SATISFIED | `selectDealerCard()` KST 시간 기반 분기, `vi.useFakeTimers()` 테스트 통과 |
| SEAT-03 | 04-01 | 이후 판은 이전 판 승자가 선이 된다 | ✓ SATISFIED | `setDealerFromPreviousWinner()`, `nextRound()` dealer 설정 |
| DECK-02 | 04-01 | 선 플레이어가 셔플을 실행할 수 있다 | ✓ SATISFIED | `shuffle(playerId)` dealer 권한 검증 + Fisher-Yates |
| DECK-03 | 04-01 | 왼쪽 플레이어에게 기리 요청, 기리/퉁 선택 가능 | ✓ SATISFIED | `cut()` + `declareTtong()`, cutterPlayerId = dealerSeatIndex+1 |
| DECK-04 | 04-01 | 일반 배분: 선의 오른쪽부터 반시계, 1장씩, 2장까지 | ✓ SATISFIED | `_dealCards()` 일반 모드 2라운드 1장씩 |
| DECK-05 | 04-01 | 퉁 선언 시 오른쪽부터 반시계, 2장씩 한 번에 | ✓ SATISFIED | `_dealCards()` isTtong=true 분기 2장씩 배분 |
| MODE-OG-01 | 04-01 | 선 플레이어가 "오리지날" 모드 선택 가능 | ✓ SATISFIED | `selectMode(playerId, mode)` dealer만 호출 가능, select-mode Socket.IO 이벤트 연결 |
| MODE-OG-02 | 04-02, 04-03 | 2장 배분 → 베팅 → 족보 비교 → 승패 결정 플로우 | ✓ SATISFIED | full flow integration 테스트 통과, Socket.IO 통합 테스트 통과 |
| BET-01 | 04-02 | 자신의 턴에 콜/레이즈/다이 중 하나 선택 | ✓ SATISFIED | `processBetAction()` 4가지 액션 처리 (체크 포함) |
| BET-02 | 04-02 | 콜은 현재 최고 베팅액과 동일한 금액을 낸다 | ✓ SATISFIED | `currentBetAmount - player.currentBet` 계산 후 pot 추가 |
| BET-03 | 04-02 | 레이즈는 현재 최고 베팅액을 콜한 뒤 추가 금액을 올린다 | ✓ SATISFIED | callAmount + action.amount, `currentBetAmount = player.currentBet` 갱신 |
| BET-04 | 04-02 | 다이는 패를 포기하며 이후 베팅 제외 | ✓ SATISFIED | `player.isAlive = false`, advanceBettingTurn에서 생존자만 순서 진행 |
| BET-05 | 04-02 | 베팅 순서는 선 플레이어 기준 반시계 방향 | ✓ SATISFIED | `_advanceBettingTurn()` 반시계 방향 탐색, 테스트 통과 |
| BET-06 | 04-02 | 모든 생존자 베팅액이 같아지면 종료 (전원 체크도 종료) | ✓ SATISFIED | `_isBettingComplete()` allActed + currentBet === currentBetAmount |

### 고아 요구사항 (Orphaned Requirements)

REQUIREMENTS.md Traceability 섹션에서 Phase 4에 할당된 요구사항:
- SEAT-02, SEAT-03, DECK-02~05, MODE-OG-01~02, BET-01~06 (모두 Plan 문서에 명시됨)

**SEAT-01 이중 할당 주의사항:**
- REQUIREMENTS.md Traceability: Phase 10에 할당 (`| SEAT-01 | Phase 10 | Complete |`)
- ROADMAP.md Phase 4 Requirements 항목: SEAT-01 포함
- ROADMAP.md Phase 10 Requirements 항목: SEAT-01 포함
- 실제 구현: seatIndex 서버 모델은 Phase 4에서 완료됨. UI 원형 배치는 Phase 10 범위.
- **결론**: 서버 측 자리 모델(Phase 4 범위)은 충족됨. UI 배치(Phase 10 범위)는 아직 구현 전으로 정상.

---

## 안티패턴 스캔

스캔 대상: `packages/server/src/game-engine.ts`, `packages/server/src/index.ts`, `packages/shared/src/types/game.ts`

| 파일 | 라인 | 패턴 | 심각도 | 영향 |
|------|------|------|-------|------|
| 해당 없음 | — | — | — | — |

- TODO/FIXME/PLACEHOLDER 없음
- `return null` / `return []` 스텁 없음
- 빈 핸들러(`() => {}`) 없음
- 하드코딩된 빈 데이터 스텁 없음
- 모든 public 메서드가 실제 게임 로직으로 구현됨

**유의사항 (Warning, 비차단):**
- `packages/server/src/index.ts` 라인 142: `new GameEngine(roomId, room.players, 'original', 1)` — `'original'`은 초기값 하드코딩처럼 보이나, PLAN 및 코드 주석에서 명시적으로 "초기값만, select-mode 이벤트로 실제 선택"으로 설계 의도가 문서화됨. 기능 결함 아님.

---

## 인간 검증 필요 항목

### 1. SEAT-01 원형 UI 배치

**테스트:** 실제 브라우저에서 2~6인 방에서 원형으로 플레이어 자리가 표시되는지 확인
**기대:** 플레이어들이 원형으로 배치되어 화면에 표시됨
**인간 필요 이유:** UI 렌더링은 서버 코드 grep으로 검증 불가. Phase 6 UI 개발 이후 검증 가능.

### 2. 베팅 순서 직관성

**테스트:** 4명 플레이어로 실제 게임을 진행하며 베팅 차례 UI 인디케이터가 올바른 플레이어를 가리키는지 확인
**기대:** 선 플레이어부터 반시계 방향으로 순서대로 베팅 UI 활성화
**인간 필요 이유:** 실시간 소켓 통신과 UI 동기화는 자동화 검증 어려움

---

## 격차 요약 (Gaps Summary)

격차 없음.

15개 관찰 가능한 진실이 모두 검증되었습니다. 16개 요구사항(SEAT-01 포함) 모두 범위 내 구현이 완료되었습니다. SEAT-01은 서버 자리 모델(seatIndex)이 Phase 4에서 구현되었으며, UI 원형 배치는 설계상 Phase 10 범위입니다.

**테스트 통과 현황:**
- `@sutda/server`: 89/89 (game-engine 59개 + room-manager 19개 + integration 5개 + index 6개)
- `@sutda/shared`: 96/96
- `@sutda/shared build`: 성공

---

_검증일시: 2026-03-29_
_검증자: Claude (gsd-verifier)_
