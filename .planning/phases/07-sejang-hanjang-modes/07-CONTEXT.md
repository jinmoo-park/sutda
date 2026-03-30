# Phase 7: 세장섯다 + 한장공유 모드 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning
**Revised:** 2026-03-30 (D-01/D-02/D-03 checker 피드백 반영 — RESEARCH.md 권장 방향으로 정렬)

<domain>
## Phase Boundary

오리지날 모드 외에 **세장섯다**와 **한장공유** 두 가지 모드를 Strategy 패턴으로 추가하고, 모드 선택 및 각 모드의 진행을 UI에서 완전히 지원한다.

범위: MODE-SJ-01, MODE-SJ-02, MODE-SH-01, MODE-SH-02, MODE-SH-03, MODE-SH-04
**포함하지 않는 것:** 후회의섯다/인디언섯다 (Phase 8), 땡값/구사재경기 (Phase 9)

</domain>

<decisions>
## Implementation Decisions

### Strategy 패턴 구조
- **D-01:** `GameModeStrategy` 인터페이스를 정의하고, `OriginalModeStrategy`, `SejangModeStrategy`, `HanjangModeStrategy` 클래스를 `game-engine.ts` 내부에 구현. `GameEngine`은 `getModeStrategy()` 디스패치로 위임. 별도 파일 분리는 불필요 — FSM 결합도가 높아 같은 파일 내부에 배치한다. (RESEARCH.md Pattern 1 반영: 전면 클래스 분리보다 inline dispatch가 안전)
- **D-02:** Strategy가 담당하는 메서드 범위: **deal()** + **showdown()** 만. 베팅/정산 로직은 오리지날과 동일하므로 `GameEngine`에 유지. Strategy 메서드 시그니처: `deal(engine: GameEngine, state: GameState): void`, `showdown(engine: GameEngine, state: GameState): void`.
- **D-03:** `GameMode` 타입은 기존 `'three-card' | 'shared-card'` 유지 (이미 코드베이스에 정의됨). `'sejang'/'hanjang'`으로 리네임하지 않음 — 기존 코드와의 호환성 우선. (RESEARCH.md에서 기존 타입명 유지 권장)
- **D-04:** `PlayerState`에 `selectedCards?: Card[]` 필드 추가 — 세장섯다에서 3장 중 2장 선택 결과를 저장. 쇼다운 시 이 값으로 족보 판정.
- **D-05:** `GameState`에 `sharedCard?: Card` 필드 추가 — 한장공유 모드에서 공유 카드를 저장. 한장공유 모드에서만 사용.

### 세장섯다 Phase 전환 흐름
- **D-06:** 세장섯다 전용 GamePhase 추가:
  - `'betting-1'` — 2장 배분 후 1차 베팅 (이 단계에서만 다이하면 3번째 카드 없이 탈락 가능)
  - `'dealing-extra'` — 1차 베팅 완료 직후 서버가 자동으로 생존자에게 3번째 카드 배분
  - `'card-select'` — 각 생존자가 3장 중 2장을 선택 (selectedCards에 저장)
  - `'betting-2'` — 2차 베팅 (콜/레이즈/다이)
- **D-07:** `dealing-extra` 전환은 서버 자동 처리 — 클라이언트 별도 액션 불필요.
- **D-08:** 오리지날 모드는 기존 `'betting'` phase 유지. 세장섯다 전용 phase들은 Strategy 내부에서만 관리, 오리지날에 영향 없음.

### 세장섯다 카드 선택 UI
- **D-09:** `card-select` phase에서 손패패널이 선택 모드로 전환. 카드 클릭 시 토글(선택/해제). 2장 정확히 선택했을 때만 확인 버튼 활성화.
- **D-10:** 확인 버튼 누르면 `select-cards` 이벤트 emit (`{ roomId, cardIndices: [0|1|2, 0|1|2] }`). 서버에서 `selectedCards`에 저장.
- **D-11:** 선택 타이밍: 2차 베팅 이후 **쇼다운 직전**이 아닌, **1차 베팅 후 2차 베팅 전** (`card-select` phase). 즉 2차 베팅은 어떤 2장을 쓸지 이미 결정한 상태에서 진행.

### 한장공유 공유카드 지정 UI
- **D-12:** 기존 `DealerSelectModal` (밤일낮장 모달)을 재활용. 제목을 "공유 카드 선택"으로 변경.
- **D-13:** **선 플레이어(딜러)에게는 20장 전부 앞면 공개** — 자신이 원하는 카드를 공유 카드로 전략적으로 선택 가능. 다른 플레이어에게는 뒷면.
- **D-14:** 공유 카드 선택 후 **게임 테이블 중앙에 앞면으로 항상 표시** — 모든 플레이어가 공유 카드를 보며 자신의 손패(1장)와 조합을 계산.
- **D-15:** 한장공유에서 각 플레이어 손패는 1장. 족보 판정: `evaluateHand(playerCard, sharedCard)`.

### Claude's Discretion
- `card-select` phase에서 선택된 카드의 시각적 하이라이트 스타일 (border, opacity 등)
- 공유 카드를 테이블 중앙에 표시하는 구체적 레이아웃 (크기, 위치)
- 세장섯다에서 3번째 카드가 배분될 때 애니메이션 처리 여부

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 게임 규칙
- `rule_draft.md` — 게임 플로우 원문 (세장섯다/한장공유 규칙 확인)

### 기존 컨텍스트 (확정된 선행 결정)
- `.planning/phases/04-original-mode-game-engine/04-CONTEXT.md` — FSM 구조, 등교/기리/셔플/딜링 흐름 (Strategy가 기반으로 삼아야 할 패턴)
- `.planning/phases/06-ui/06-CONTEXT.md` — UI 패널 구성(D-10), 기존 모달 목록(D-12), 상태 관리 패턴(D-03~D-05)

### 타입 정의 (변경 대상)
- `packages/shared/src/types/game.ts` — `GamePhase`, `GameMode`, `PlayerState`, `GameState` (D-03~D-06 반영 필요)
- `packages/shared/src/types/protocol.ts` — `select-mode`, `select-cards` 이벤트 추가 필요

### 기존 구현 (읽고 파악)
- `packages/server/src/game-engine.ts` — `_dealCards()`, `selectMode()`, `_resolveShowdown()` 패턴
- `packages/client/src/components/modals/ModeSelectModal.tsx` — 오리지날만 있는 현재 상태 (확장 필요)
- `packages/client/src/components/modals/DealerSelectModal.tsx` — 재사용할 밤일낮장 모달 패턴
- `packages/client/src/components/layout/HandPanel.tsx` — 카드 선택 토글 UI 추가 위치

### 요구사항
- `.planning/REQUIREMENTS.md` §MODE-SJ-01, MODE-SJ-02, MODE-SH-01~04

</canonical_refs>

<code_context>
## Existing Code Insights

### 재사용 가능한 에셋
- `DealerSelectModal` — 20장 그리드 UI 이미 구현됨. 딜러/비딜러 조건 분기 패턴 재사용 가능
- `ModeSelectModal` — 현재 오리지날만 있음. 세장섯다/한장공유 버튼 추가 필요
- `HandPanel` — 카드 표시 로직 존재. `card-select` phase 감지 후 토글 모드 진입 필요
- `GameTable` — 중앙 공유카드 표시 영역 추가 필요 (한장공유 모드에서만)

### 변경 필요한 구조
- `GameMode` 타입: 기존 `'three-card' | 'shared-card'` 유지 (D-03)
- `GamePhase` 타입: `'betting-1' | 'dealing-extra' | 'card-select' | 'betting-2' | 'shared-card-select'` 추가
- `PlayerState`: `selectedCards?: Card[]` 추가
- `GameState`: `sharedCard?: Card` 추가
- `game-engine.ts`의 `_dealCards()`를 `GameModeStrategy.deal()` 위임으로 변경 (D-01)
- `_resolveShowdown()`도 `GameModeStrategy.showdown()` 위임으로 변경 (D-01)

### Integration Points
- `select-mode` 이벤트: 기존 이벤트 그대로, mode에 'three-card'/'shared-card' 값 사용
- `select-cards` 이벤트: 신규 — `{ roomId: string, cardIndices: number[] }` (세장섯다 card-select phase)
- `set-shared-card` 이벤트: 신규 — `{ roomId: string, cardIndex: number }` (한장공유 딜러 지정)

</code_context>

<specifics>
## Specific Ideas

- **한장공유 공유카드 선택**: DealerSelectModal 재사용하되 딜러에게는 앞면 전체 공개 (전략적 선택 가능), 비딜러는 뒷면. 기존 밤일낮장 모달과 동일한 UX 패턴.
- **세장섯다 카드 선택 확인 버튼**: 정확히 2장 선택 시에만 활성화 — 1장이나 3장이면 버튼 disabled.
- **중간 베팅 다이 처리**: 1차 베팅(betting-1)에서 다이한 플레이어는 3번째 카드 없이 즉시 탈락. dealing-extra는 생존자에게만 배분.

</specifics>

<deferred>
## Deferred Ideas

None — 논의가 Phase 7 범위 내에서 진행됨.

</deferred>

---

*Phase: 07-sejang-hanjang-modes*
*Context gathered: 2026-03-30*
*Revised: 2026-03-30 (D-01/D-02/D-03 정정)*
