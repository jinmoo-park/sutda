# Phase 8: 골라골라 + 인디언섯다 모드 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

나머지 두 가지 게임 모드(골라골라, 인디언섯다)를 Strategy 패턴으로 추가하고, 각 모드의 고유 UI/UX를 구현한다. 이로써 5가지 모드 전체가 플레이 가능해진다.

**골라골라 = 원래 골라골라 규칙의 간소화 버전.** 원래 규칙(여러 장 가져간 뒤 안 보고 2장 선택 → 미선택 카드 후회 공개)에서 절차를 단순화하여 20장 오픈 → 바로 2장 선택 → 오리지날 베팅으로 진행. 골라골라라는 명칭과 의미가 성립하지 않으므로 **골라골라**로 명칭 변경.

범위: MODE-HR-01~04 (골라골라로 구현), MODE-IN-01, MODE-IN-02, MODE-IN-03, MODE-IN-04, MODE-IN-05
**포함하지 않는 것:** 땡값/구사재경기 (Phase 9)

</domain>

<decisions>
## Implementation Decisions

### 골라골라 모드 (구 골라골라 → 간소화)

- **D-01:** 모드명: `'gollagolla'`. 20장 전부 오픈 → 모든 플레이어가 **동시에 자유롭게 2장 선택** → 2장 선택 완료 후 오리지날과 동일한 베팅 진행 → 족보 비교 → 승패 결정. 미선택 카드 공개("후회") 없음. 골라골라의 드래프트 절차(여러 장 가져가기, 안 보고 선택) 전부 제거.

- **D-02:** 동시 선택 충돌 처리: **서버 수신 선착순** 우선. 먼저 `select-cards` 이벤트가 도착한 플레이어가 해당 카드를 가져감. 이미 선택된 카드는 다른 플레이어가 선택 불가 — 서버에서 reject하고 클라이언트에게 에러 반환, 재선택 요구.

- **D-03:** 골라골라 Phase 흐름:
  - `'gollagolla-select'` — 20장 오픈 그리드 표시, 모든 플레이어가 동시에 2장 선택 (선착순 처리)
  - 모든 플레이어 2장 선택 완료 → 오리지날과 동일하게 `'betting'` phase로 전환
  - 베팅 종료 → `'showdown'` → `'result'` (미선택 카드 공개 없음, 오리지날 result와 동일)

- **D-04:** 골라골라 UI: `DealerSelectModal`의 20장 그리드 패턴을 재활용. 선택 불가 카드(이미 타인이 가져간 카드)는 dim 처리. 2장 선택 완료 시 자동 확정.

### 인디언섯다

- **D-06:** 인디언섯다 Phase 흐름:
  - `'dealing'` — 1장 배분 (반전 가시성: 본인에게 숨김, 타인에게 공개)
  - `'betting-1'` — 1차 베팅 (자신의 첫 카드 못 보고, 타인 카드 보며 베팅)
  - `'dealing-extra'` — 2번째 카드 배분 (본인에게만 공개)
  - `'betting-2'` — 2차 베팅 (자신의 두 번째 카드 보고 베팅)
  - `'showdown'` → `'result'`
  - 세장섯다의 `BETTING_PHASES` 상수에 `'betting-1'`, `'betting-2'` 이미 포함됨 — 재사용.

- **D-07:** 카드 가시성 반전 구현: **서버 per-player 필터링**. `io.to(roomId).emit` 대신 각 소켓에 개별 `socket.emit('game-state', engine.getStateFor(socket.data.playerId))` 전송. `GameEngine`에 `getStateFor(playerId: string): GameState` 메서드 추가.

- **D-08:** `getStateFor(playerId)` 필터링 로직:
  - 인디언 모드 + `dealing` / `betting-1` phase: 각 플레이어의 `cards[0]`를 요청자 본인에게는 `null` (또는 `undefined`)로 마스킹, 타인에게는 정상 공개.
  - `dealing-extra` 이후: 각 플레이어의 `cards[1]`를 본인에게만 공개, 타인에게는 마스킹.
  - `result` phase: 모든 카드 공개 (마스킹 없음).
  - 다른 모드에서는 `getStateFor`가 기존 `getState()`와 동일하게 동작.

- **D-09:** 인디언 모드에서 쇼다운: `evaluateHand(cards[0], cards[1])`로 족보 판정. cards[0]는 반전 가시성 카드, cards[1]는 본인 카드. 판정 로직은 오리지날과 동일.

### Strategy 패턴 확장 (Phase 7 이어받음)

- **D-10:** `IndianModeStrategy`와 `GollagollaModeStrategy`를 `game-engine.ts` 내부에 추가 (Phase 7 D-01 패턴 그대로). 위임 범위: `deal()` + `showdown()` 만.

- **D-11:** `GameMode` 타입에 `'indian'` 및 `'gollagolla'` 추가. `GamePhase` 타입에 `'gollagolla-select'` 추가 (인디언은 Phase 7의 `'betting-1' | 'dealing-extra' | 'betting-2'` 재사용).

### 브로드캐스트 헬퍼 수정

- **D-13:** `handleGameAction` 헬퍼(index.ts)의 성공 브로드캐스트를 인디언 모드 전용 per-player emit으로 분기:
  ```typescript
  if (engine.getState().mode === 'indian') {
    const sockets = await io.in(roomId).fetchSockets();
    for (const s of sockets) {
      s.emit('game-state', engine.getStateFor(s.data.playerId));
    }
  } else {
    io.to(roomId).emit('game-state', engine.getState());
  }
  ```
  또는 `getStateFor`를 항상 사용하는 단순화된 방식 (planner 재량).

### Claude's Discretion

- 골라골라 선택 UI의 구체적 레이아웃 (모달 오버레이 vs 풀스크린 패널)
- 이미 선택된 카드 dim 처리 스타일 (opacity, line-through 등)
- 인디언 모드에서 마스킹된 카드의 UI 표현 (? 표시, 뒷면 이미지 등)
- `getStateFor` 단순화: 항상 per-player emit 사용 vs 모드 분기

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 게임 규칙
- `rule_draft.md` — 골라골라(골라골라룰로 변경됨), 인디언섯다 규칙 원문

### 기존 컨텍스트 (확정된 선행 결정)
- `.planning/phases/07-sejang-hanjang-modes/07-CONTEXT.md` — Strategy 패턴(D-01~D-03), BETTING_PHASES 상수, GamePhase 확장 패턴
- `.planning/phases/04-original-mode-game-engine/04-CONTEXT.md` — FSM 구조, handleGameAction 헬퍼 패턴

### 타입 정의 (변경 대상)
- `packages/shared/src/types/game.ts` — `GameMode`에 `'indian' | 'gollagolla'` 추가, `GamePhase`에 `'gollagolla-select'` 추가
- `packages/shared/src/types/protocol.ts` — `select-gollagolla-cards` 이벤트 추가 (`{ roomId, cardIndices: [number, number] }`)

### 기존 구현 (읽고 파악)
- `packages/server/src/game-engine.ts` — `GameModeStrategy` 인터페이스, 기존 Strategy 구현, `getState()`, `_dealCards()`, `_resolveShowdown()`
- `packages/server/src/index.ts` — `handleGameAction` 헬퍼, 브로드캐스트 패턴
- `packages/client/src/components/modals/DealerSelectModal.tsx` — 20장 그리드 UI (재활용)
- `packages/client/src/components/modals/ModeSelectModal.tsx` — 모드 선택 목록 (huhwi/indian 버튼 추가)
- `packages/client/src/components/layout/HandPanel.tsx` — 카드 가시성 표시 로직
- `packages/client/src/components/game/GameTable.tsx` — 전체 게임 테이블 레이아웃

### 요구사항
- `.planning/REQUIREMENTS.md` §MODE-HR-01~04, MODE-IN-01~05

</canonical_refs>

<code_context>
## Existing Code Insights

### 재사용 가능한 에셋
- `DealerSelectModal` — 20장 그리드 UI 이미 구현. 골라골라 `gollagolla-select` phase에서 재활용
- `ModeSelectModal` — 현재 오리지날/세장/한장공유 있음. `'gollagolla'`/`'indian'` 버튼 추가 필요
- `BETTING_PHASES` 상수 — 이미 `'betting'|'betting-1'|'betting-2'` 포함. 인디언 모드에 그대로 활용
- `HandPanel` — 카드 가시성 로직 존재. 인디언 모드에서 `cards[0]` null 처리 추가 필요

### 변경 필요한 구조
- `GameEngine.getState()` → `getStateFor(playerId: string)` 메서드 추가 (D-07, D-08)
- `handleGameAction` 브로드캐스트 분기 (D-13)
- `GameMode` 타입 확장 (D-11)
- `GamePhase` 타입 확장: `'gollagolla-select'` 추가 (D-11)

### Integration Points
- `select-mode` 이벤트: 기존 이벤트에 `'gollagolla'`/`'indian'` 값 추가
- `select-gollagolla-cards` 이벤트: 신규 — `{ roomId: string, cardIndices: [number, number] }` (골라골라 카드 선택, 선착순 처리)
- `game-state` 이벤트: 인디언 모드에서 per-player emit으로 전환 (D-13)

</code_context>

<specifics>
## Specific Ideas

- **골라골라룰 충돌 시나리오**: 두 명이 동시에 같은 카드를 선택하면 서버는 먼저 도착한 요청만 수락, 나중 도착 요청은 `game-error`로 반환. 클라이언트는 오류 수신 시 선택 해제 후 다른 카드 선택 유도.
- **인디언 getStateFor 마스킹**: `cards[0]` 마스킹은 `{ rank: -1, type: 'hidden' }` 같은 sentinel 값 또는 `null`로 처리. 클라이언트는 이를 뒷면 카드로 렌더링.
- **골라골라 전환 조건**: 모든 플레이어가 2장 선택 완료 시 자동으로 `'betting'` phase 전환. 타임아웃은 Phase 8 범위 밖 (v2 UX).

</specifics>

<deferred>
## Deferred Ideas

- **선착순 고지 UI**: 내가 선택하려던 카드가 이미 가져간 경우 토스트 알림 표시 (Claude's Discretion)
- **인디언 타임아웃**: 턴 타이머 기반 자동 다이 (v2 UX-01)
- **골라골라 UI 애니메이션**: 카드 선택 애니메이션 (v2 UX-03)

</deferred>

---

*Phase: 08-huhwi-indian-modes*
*Context gathered: 2026-03-30*
