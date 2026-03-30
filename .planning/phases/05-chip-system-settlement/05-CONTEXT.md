# Phase 5: 칩 시스템 + 승패 정산 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

판 결과에 따른 칩 이동(정산), 플레이어 칩 잔액 추적, 칩 재충전 요청 플로우, 베팅 UI용 칩 단위 입력 방식을 구현한다.

범위: CHIP-01 ~ CHIP-05 (칩 잔액 표시 / 정산 / 재충전 / 단위 시각화 / 베팅 입력)
**포함하지 않는 것:** 땡값 자동 정산 (Phase 9), 칩 시각 UI 디자인 (Phase 6), 구사 재경기 (Phase 9)

</domain>

<decisions>
## Implementation Decisions

### 정산 시점 + 칩 이동
- **D-01:** 승자 결정 즉시 자동 정산. `determineWinner()` 내 `winnerId` 세팅 시점에 `pot → winner.chips` 이동. `result` phase 진입 시 이미 정산 완료 상태.
- **D-02:** 동점 재경기(`rematch-pending`) 시 pot 유지, 칩 이동 없음. 동점 재경기가 반복되어도 pot은 누적 유지 → 최종 단독 승자에게 전달.
- **D-03:** `nextRound()` 호출 시 pot = 0 리셋 유지 (Phase 4 기존 로직). 정산은 이미 result phase 진입 전에 완료된 상태.

### 재충전 요청 플로우
- **D-04:** 재충전 요청은 **언제든지** 가능 (칩이 0이 아니어도 됨). 요청 시점 제한 없음.
- **D-05:** 전원 동의 필요 — 재충전 요청 시 모든 다른 플레이어 화면에 팝업 토표 표시. "동의 / 거부" 선택.
- **D-06:** 단 1명이라도 거부하면 요청 취소. 전원 수락 시에만 충전.
- **D-07:** 재충전 금액은 만원 단위 자유 입력 (Phase 3 INFRA-06과 동일 단위).
- **D-08:** 재충전 이벤트: `recharge-request` (요청자 → 서버) / `recharge-vote` (투표 → 서버) / `recharge-result` (서버 → 전체).

### 칩 단위 베팅 입력 UX
- **D-09:** **프리셋 칩 더미 방식** — 500/1000/5000/10000원 칩 아이콘을 별도 영역에 배치. 칩을 클릭/터치하면 베팅 영역에 쌓이고 합계를 실시간 표시. 물리 포커 칩 터치 UX와 유사 (Phase 6에서 시각화, 서버는 숫자만 처리).
- **D-10:** 레이즈 추가 금액 최소 500원 (Phase 4 D-14 확정, 변경 없음).
- **D-11:** **유효 스택 상한 (effective stack)** — 콜 및 레이즈 입력 시점에 적용:
  - 내 잔액 < 상대방의 잔액: 내 잔액 전체가 최대 상한 (all-in)
  - 내 잔액 > 모든 상대방 잔액: 생존자 중 두 번째로 잔액이 많은 상대의 잔액이 최대 상한
  - 이 이상의 레이즈는 입력/선택 불가 (버튼 비활성화 또는 경고)

### 칩 잔액 표시
- **D-12:** **수치 + 칩 아이콘 조합** 표시. 서버는 `chips` 숫자값 브로드캐스트 + 칩 구성 데이터(`chipBreakdown`: 각 단위별 개수)도 함께 전달. Phase 6 UI에서 아이콘 렌더링.
- **D-13:** 칩 변동 직후 즉시 `game-state` 브로드캐스트 — 기존 Phase 3~4 패턴 동일 적용.

### Claude's Discretion
- `chipBreakdown` 데이터 구조 (단위별 개수 배열 vs 객체)
- 유효 스택 계산에서 다이한 플레이어 포함 여부 (생존자 기준 vs 전체 기준)
- 재충전 요청 중 게임 진행 여부 (투표 완료 전 베팅 진행 가능 여부)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 게임 규칙
- `rule_draft.md` — 베팅 규칙, 칩 단위 원문 정의

### 기존 타입 정의
- `packages/shared/dist/types/game.d.ts` — `PlayerState.chips`, `GameState.pot`, `GameState.winnerId` 필드
- `packages/shared/dist/types/protocol.d.ts` — `ClientToServerEvents`, `ServerToClientEvents` — 새 이벤트 추가 위치

### 기존 구현체
- `packages/server/src/game-engine.ts` — `determineWinner()`, `nextRound()`, `startRematch()` — 정산 로직 삽입 지점
- `packages/server/src/room-manager.ts` — 재충전 요청/투표 처리 위치 (방 단위 이벤트)

### Phase 요구사항
- `.planning/REQUIREMENTS.md` §CHIP-01 ~ CHIP-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GameState.pot`: 팟 누적은 Phase 4에서 완성. 정산 시 `winner.chips += pot` 추가만 필요
- `GameState.winnerId`: 이미 설정됨 — 정산 트리거로 직접 사용 가능
- `PlayerState.chips`: 필드 이미 존재, 현재 초기값만 설정되고 변동 없음
- `handleGameAction` 패턴 (Phase 4 D-03): 액션 후 `game-state` 브로드캐스트 — 칩 정산 후 동일 패턴 적용

### Established Patterns
- 클래스 기반 `GameEngine` (Phase 4 D-01) — 정산 메서드 추가 위치
- `ServerToClientEvents` / `ClientToServerEvents` 타입 확장 패턴
- vitest TDD — 정산 로직 순수 함수로 분리하면 테스트 용이

### Integration Points
- `determineWinner()` 내부 또는 직후 — `settleChips()` 호출 지점
- `RoomManager` — `recharge-request` / `recharge-vote` 이벤트 핸들러 추가
- `GameState` 브로드캐스트 시 `chipBreakdown` 필드 추가 필요

</code_context>

<specifics>
## Specific Ideas

- **프리셋 칩 더미 UX**: 피지컬 포커 칩과 유사. 칩 아이콘(500/1000/5000/10000)을 클릭하면 베팅 영역에 쌓임. 합계 실시간 표시. Phase 6에서 구체적 렌더링.
- **유효 스택 상한**: 단순 내 잔액 제한이 아닌 "상대방과의 유효 대결 금액" 기준. 내가 더 부자라면 상대방 잔액이 천장. 포커 effective stack 개념과 동일.
- **재충전 팝업 토표**: 요청자 제외 전원에게 동시 팝업. 거부 1명이라도 있으면 즉시 취소.

</specifics>

<deferred>
## Deferred Ideas

- 땡값 자동 정산 (다이한 땡 보유자 → 승자에게 500/1000원) — Phase 9 범위
- 구사/멍텅구리구사 재경기 시 비해당자 절반 내고 참여 — Phase 9 범위
- 칩 애니메이션 (칩 이동 시각 효과) — Phase 6 또는 v2 범위
- 세션 내 판별 칩 증감 히스토리 — v2 HIST-01 범위

</deferred>

---

*Phase: 05-chip-system-settlement*
*Context gathered: 2026-03-30*
