# Phase 4: 오리지날 모드 게임 엔진 - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

서버에서 오리지날 섯다 한 판의 전체 플로우를 구현한다.
범위: 선 결정 → 모드 선택 → 등교(앤티) → 셔플 → 기리/퉁 → 패 배분 → 베팅 → 쇼다운 → 승자 결정 → 다음 판 준비.

칩 실제 이동/정산은 **Phase 5 범위**. 이 페이즈에서는 팟 금액 추적까지만 담당.

</domain>

<decisions>
## Implementation Decisions

### FSM 설계 방식
- **D-01:** 클래스 기반 GameEngine으로 구현한다. 기존 RoomManager와 동일한 방식(방식 A)으로 상태를 직접 수정. 코드 일관성 확보.

### 앤티 — "학교 간다"
- **D-02:** 매 판 시작 시 각 플레이어가 500원 앤티를 낸다. 이를 "학교 간다"라고 부른다.
- **D-03:** 자동 차감이 아닌 "등교" 버튼을 통해 플레이어가 직접 액션을 취해야 한다.
- **D-04:** 등교하지 않은 플레이어는 패를 받지 못한다 (해당 판 자동 불참).

### 밤일낮장 — 선 결정
- **D-05:** 첫 판 선 결정 시 20장 카드가 모두 뒤집힌 채로 보드에 깔린다. 각 플레이어가 한 장씩 선택하여 숫자를 확인하고, 시간대 규칙(18:00~05:59 낮은 숫자 우선 / 06:00~17:59 높은 숫자 우선)에 따라 선이 결정된다.
- **D-06:** 20장 보드 인터랙션 컴포넌트는 후회의섯다(Phase 7)에서도 재사용할 수 있도록 범용성을 고려하여 설계한다.
- **D-07:** 이후 판은 직전 판 승자가 자동으로 선이 된다 (인터랙션 없음).

### 기리 (더미 컷)
- **D-08:** 왼쪽 플레이어가 기리 또는 퉁을 선택할 수 있다.
- **D-09:** 기리 선택 시: 더미의 어느 위치에서 자를지 직접 선택할 수 있고, 분할된 더미들을 원하는 순서로 재조립할 수 있다 (단순 이분할이 아닌 복수 분할 + 재조립 지원).
- **D-10:** 퉁 선언 시: 더미 재조립 없이 위에서부터 두 장씩 배분한다 (DECK-05).

### 패 배분
- **D-11:** 일반 배분: 선의 오른쪽부터 반시계 방향, 한 장씩, 모든 플레이어가 2장 받을 때까지 (선이 마지막) (DECK-04).
- **D-12:** 퉁 배분: 오른쪽부터 반시계 방향, 두 장씩 한 번에 배분 (DECK-05).

### 베팅 시스템
- **D-13:** 콜 계산: `currentBetAmount - player.currentBet` = 더 내야 할 금액. 학교 앤티(500원)는 `currentBetAmount`와 무관하며, 베팅 라운드 시작 시 `currentBetAmount = 0`. 첫 베팅 플레이어의 최솟값은 500원.
- **D-14:** 레이즈: 콜 금액을 먼저 맞추고, 추가 금액을 자유롭게 입력한다 (최솟값 500원).
- **D-15:** 다이: 패 포기, 이후 베팅 제외. 단 땡 보유 시 땡값 대상이 될 수 있음 (Phase 9에서 처리).
- **D-16:** 베팅 종료 조건: 모든 생존 플레이어의 `currentBet`이 `currentBetAmount`와 같아지면 자동 종료 (BET-06).
- **D-17:** 베팅 순서: 선 플레이어 기준 반시계 방향 (BET-05).
- **D-21:** 체크 옵션: 선 플레이어(및 아직 아무도 베팅하지 않은 상태의 플레이어)는 "체크"를 선택할 수 있다. 체크는 베팅 없이 다음 플레이어로 순서를 넘긴다. 이후 플레이어가 레이즈하면 선 플레이어에게 다시 차례가 돌아오며, 이때 콜/레이즈만 가능하다(체크 불가). 전원 체크 시 베팅 라운드 종료.

### 쇼다운 (패 공개)
- **D-18:** 자동 공개 없음. 각 생존 플레이어가 "공개" 버튼을 눌러야 자신의 패가 공개된다.
- **D-19:** 모든 생존자가 공개 완료한 시점에 승패 판정이 실행된다 (긴장감 확보).

### Phase 4 vs Phase 5 경계
- **D-20:** Phase 4에서는 팟(`pot`) 누적 추적까지만 담당한다. 실제 칩 차감/승자 정산은 Phase 5에서 처리한다.

### 동점 처리
- **D-22:** 최고 점수패가 동점인 플레이어가 2인 이상이면 동점자끼리만 재경기한다.
- **D-23:** 재경기 참여 자격: 동점자만 가능. 다이한 플레이어 및 동점 패보다 낮은 패의 플레이어는 참여 불가.
- **D-24:** 기존 판돈은 그대로 유지하며 재경기 시 앤티(학교) 없음. 셔플-기리-배분-베팅-쇼다운 전체 플로우를 재실행한다.
- **D-25:** 구사/멍텅구리구사 재경기(Phase 9 범위)도 동일하게 앤티 없음. 비해당자가 판돈의 절반을 내고 참여하는 규칙만 적용.

### 기리 분할 수
- **D-26:** 서버는 분할 수 제한 없이 `cutPoints[]` + `order[]` 방식으로 처리한다. Phase 6 UI에서 최대 5더미로 제한.

### Claude's Discretion
- GameEngine 내부 상태 전환 유효성 검증 방식 (예: 잘못된 phase에서 액션 시도 시 처리)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 게임 규칙
- `rule_draft.md` — 셔플/기리/퉁, 패 배분, 베팅, 땡값, 학교 간다(앤티), 게임 모드 원문 정의

### 기존 타입 정의
- `packages/shared/src/types/game.d.ts` (또는 src) — `GamePhase`, `GameState`, `PlayerState`, `GameMode` 정의
- `packages/shared/src/types/protocol.d.ts` — `ClientToServerEvents`, `ServerToClientEvents` 정의
- `packages/shared/src/types/room.d.ts` — `RoomState`, `RoomPlayer` 정의

### 기존 구현체
- `packages/server/src/room-manager.ts` — 클래스 기반 상태 관리 패턴 참조 (D-01과 동일 방식)
- `packages/shared/src/hand/compare.ts` — `compareHands()` — 쇼다운 승패 판정에 사용
- `packages/shared/src/deck.ts` — `createDeck()` — 덱 생성 (셔플 없는 순수 함수, 셔플은 게임 엔진에서)

### Phase 요구사항
- `.planning/REQUIREMENTS.md` §SEAT-02, SEAT-03, DECK-02~05, MODE-OG-01~02, BET-01~06

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `compareHands()`: 쇼다운 시 승패 판정에 직접 사용 가능
- `createDeck()`: 매 판 새 덱 생성에 사용, 셔플은 GameEngine이 처리
- `RoomManager.startGame()`: `gamePhase`를 `'playing'`으로 전환 — GameEngine 초기화 진입점
- `PlayerState.currentBet` 필드: 베팅 누적 추적에 이미 설계됨
- `GameState.currentBetAmount` 필드: 현재 최고 베팅액 추적에 이미 설계됨

### Established Patterns
- 클래스 기반 상태 관리 (RoomManager 패턴) — D-01 결정의 근거
- `crypto.randomUUID()` 기반 ID 생성
- vitest + TypeScript TDD 패턴 (Phase 1~3 전체 적용)
- Socket.IO `ServerToClientEvents` / `ClientToServerEvents` 타입 계약

### Integration Points
- `RoomManager.startGame()` 호출 이후 → `GameEngine` 인스턴스 생성 및 연결
- `ServerToClientEvents`에 게임 진행 이벤트 추가 필요 (shuffle-request, cut-result, card-dealt, bet-action, showdown 등)
- `GameState`를 Socket.IO를 통해 클라이언트에 브로드캐스트하는 패턴 확립 필요

</code_context>

<specifics>
## Specific Ideas

- **"학교 간다"**: 앤티 500원의 고유 명칭. "등교" 버튼 UI. 미등교 시 해당 판 불참.
- **기리 UX**: 단순 컷이 아닌 더미를 여러 조각으로 나누고 순서를 바꿔 재조립하는 인터랙션.
- **20장 보드 컴포넌트**: 밤일낮장 선 결정과 후회의섯다(Phase 7) 양쪽에서 재사용 가능하도록 설계.
- **쇼다운 긴장감**: 자동 공개 없이 각자 버튼을 눌러야 공개 — 눈치전/트래쉬토크 시간 확보.

</specifics>

<deferred>
## Deferred Ideas

- 땡값 처리 (다이한 땡 보유자 → 승자에게 자동 지불) — Phase 9 범위
- 구사/멍텅구리구사 재경기 트리거 — Phase 9 범위
- 칩 실제 차감 및 승자 정산 — Phase 5 범위
- 베팅 UI (콜/레이즈/다이 버튼, 금액 입력) — Phase 6 범위

</deferred>

---

*Phase: 04-original-mode-game-engine*
*Context gathered: 2026-03-29*
