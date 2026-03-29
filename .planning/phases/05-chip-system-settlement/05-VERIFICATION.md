---
phase: 05-chip-system-settlement
verified: 2026-03-30T00:49:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 05: 칩 시스템 및 정산 검증 보고서

**Phase Goal:** 칩 시스템과 정산 로직을 구현하여 게임 내 칩 관리를 완성한다
**검증 일시:** 2026-03-30T00:49:00Z
**상태:** passed
**재검증:** 아니오 — 최초 검증

---

## 목표 달성 여부

### Observable Truths

| #  | Truth                                                                             | 상태       | 근거                                                                                  |
|----|-----------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------|
| 1  | 승자 결정 시 pot 금액이 승자의 chips에 합산된다                                    | ✓ VERIFIED | `_resolveShowdown` 내 `this.settleChips()` 호출 (line 675), `settleChips`에서 `winner.chips += this.state.pot` |
| 2  | 등교(앤티) 시 각 플레이어의 chips가 500원 차감된다                                | ✓ VERIFIED | `attendSchool`에 `player.chips -= 500` (line 265) + 테스트 통과                       |
| 3  | 베팅(콜/레이즈) 시 플레이어의 chips가 정확히 차감된다                             | ✓ VERIFIED | `processBetAction` call: `player.chips -= callAmount`, raise: `player.chips -= totalDeducted` |
| 4  | chipBreakdown이 큰 단위부터 그리디 방식으로 올바르게 계산된다                      | ✓ VERIFIED | `calculateChipBreakdown` static 메서드 구현 + 4개 테스트 케이스 통과                  |
| 5  | effectiveMaxBet이 생존자 기준 유효 스택 상한으로 정확히 계산된다                  | ✓ VERIFIED | `calculateEffectiveMaxBet` 메서드 구현 + `_updateEffectiveMaxBet` 자동 갱신            |
| 6  | 동점 재경기 시 pot이 유지되고 칩 이동이 발생하지 않는다                           | ✓ VERIFIED | `_resolveShowdown`에서 동점 시 `settleChips` 호출 없이 `rematch-pending` phase로 전환 |
| 7  | applyRechargeToPlayer 호출 시 플레이어 칩이 증가하고 chipBreakdown/effectiveMaxBet이 갱신된다 | ✓ VERIFIED | `applyRechargeToPlayer`가 `_updateChipBreakdowns()` + `_updateEffectiveMaxBet()` 연쇄 호출 |
| 8  | 플레이어가 재충전 요청 시 다른 플레이어에게 투표 팝업이 전달된다                  | ✓ VERIFIED | `recharge-request` 핸들러: `socket.to(roomId).emit('recharge-requested', ...)` + 통합 테스트 통과 |
| 9  | 전원 동의 시 요청자의 칩이 충전되고 전체에게 결과가 브로드캐스트된다              | ✓ VERIFIED | `recharge-vote` 승인 분기: `applyRecharge` → `engine.applyRechargeToPlayer` → `recharge-result` + `game-state` 브로드캐스트 |
| 10 | 1명이라도 거부하면 즉시 재충전이 취소되고 전체에게 결과가 브로드캐스트된다        | ✓ VERIFIED | 거부 시 `result.requesterId` 사용하여 `recharge-result` 즉시 브로드캐스트 + 테스트 통과 |
| 11 | 베팅 시 유효 스택 상한 초과 금액은 INSUFFICIENT_CHIPS 에러가 발생한다             | ✓ VERIFIED | `bet-action` 핸들러에서 raise 검증: `calculateEffectiveMaxBet` → 초과 시 `INSUFFICIENT_CHIPS` throw |
| 12 | 칩 정산 결과가 Socket.IO game-state 브로드캐스트에 반영된다                       | ✓ VERIFIED | `handleGameAction` 내 `engine.getState()` 포함 `chipBreakdown` 필드가 브로드캐스트됨  |
| 13 | 재충전 승인 후 GameEngine의 effectiveMaxBet이 재계산된다                           | ✓ VERIFIED | 승인 분기에서 `engine.applyRechargeToPlayer` 호출 → `_updateEffectiveMaxBet()` 자동 연쇄 |

**Score:** 13/13 truths verified

---

### 필수 Artifacts

| Artifact                                       | 목적                                               | 상태        | 세부 내용                                                        |
|------------------------------------------------|----------------------------------------------------|-------------|------------------------------------------------------------------|
| `packages/shared/src/types/game.ts`            | ChipBreakdown 인터페이스, PlayerState.chipBreakdown, GameState.effectiveMaxBet | ✓ VERIFIED | `interface ChipBreakdown` + 필드 모두 존재 (lines 4-9, 52, 71) |
| `packages/shared/src/types/protocol.ts`        | recharge 관련 이벤트 타입                           | ✓ VERIFIED | `recharge-request`, `recharge-vote` (ClientToServer lines 40-41), `recharge-requested`, `recharge-vote-update`, `recharge-result` (ServerToClient lines 53-55) |
| `packages/shared/src/types/index.ts`           | ChipBreakdown re-export                            | ✓ VERIFIED | `export type { ..., ChipBreakdown } from './game'` (line 3)      |
| `packages/shared/src/index.ts`                 | ChipBreakdown re-export                            | ✓ VERIFIED | `export type { ..., ChipBreakdown } from './types/game'` (line 4) |
| `packages/server/src/game-engine.ts`           | settleChips, calculateChipBreakdown, calculateEffectiveMaxBet, applyRechargeToPlayer | ✓ VERIFIED | 메서드 모두 존재 및 구현 완료 |
| `packages/server/src/game-engine.test.ts`      | 칩 정산, chipBreakdown, effectiveMaxBet, applyRechargeToPlayer 테스트 | ✓ VERIFIED | describe 블록 존재 (lines 1010+, 1265+, 1301+) |
| `packages/server/src/room-manager.ts`          | requestRecharge, processRechargeVote, applyRecharge 메서드 | ✓ VERIFIED | 모두 구현, `rechargeRequests: Map` private 필드 존재 |
| `packages/server/src/index.ts`                 | recharge-request, recharge-vote Socket.IO 핸들러   | ✓ VERIFIED | 두 핸들러 모두 구현, INSUFFICIENT_CHIPS 에러 메시지 포함          |
| `packages/server/src/room-manager.test.ts`     | 재충전 플로우 단위 테스트                           | ✓ VERIFIED | `describe('재충전 플로우')` 블록 존재 (line 162+)                |
| `packages/server/src/index.test.ts`            | 재충전 Socket.IO 통합 테스트                        | ✓ VERIFIED | `describe('재충전 플로우 통합')` + INSUFFICIENT_CHIPS 테스트 존재 (lines 324+) |

---

### Key Link 검증

| From                                     | To                                         | Via                                                    | 상태        | 세부 내용                                                    |
|------------------------------------------|--------------------------------------------|--------------------------------------------------------|-------------|--------------------------------------------------------------|
| `game-engine.ts`                         | `shared/src/types/game.ts`                 | `ChipBreakdown` import                                 | ✓ WIRED     | line 2: `import type { ..., ChipBreakdown } from '@sutda/shared'` |
| `GameEngine._resolveShowdown`            | `GameEngine.settleChips`                   | 승자 결정 직후 호출                                     | ✓ WIRED     | line 675: `this.settleChips()` in `_resolveShowdown`         |
| `GameEngine.applyRechargeToPlayer`       | `_updateChipBreakdowns, _updateEffectiveMaxBet` | 재충전 적용 후 파생 상태 갱신                        | ✓ WIRED     | lines 140-141: 두 메서드 모두 호출                           |
| `index.ts` recharge-request 핸들러       | `room-manager.ts requestRecharge`          | `roomManager.requestRecharge` 호출                     | ✓ WIRED     | line 226: `roomManager.requestRecharge(roomId, ...)` 호출    |
| `index.ts` recharge-vote 핸들러          | `room-manager.ts processRechargeVote`      | `roomManager.processRechargeVote` 호출                 | ✓ WIRED     | line 250: `roomManager.processRechargeVote(roomId, ...)` 호출 |
| `index.ts` bet-action 핸들러             | `game-engine.ts effectiveMaxBet 검증`      | `calculateEffectiveMaxBet` 인라인 호출                 | ✓ WIRED     | lines 199-204: raise 시 `engine.calculateEffectiveMaxBet` 검증 |
| `index.ts` recharge-vote 승인 분기       | `game-engine.ts applyRechargeToPlayer`     | 재충전 승인 후 `engine.applyRechargeToPlayer` 호출     | ✓ WIRED     | line 263: `engine.applyRechargeToPlayer(...)` 호출           |

---

### Data-Flow Trace (Level 4)

| Artifact                    | 데이터 변수         | 소스                                  | 실제 데이터 생성 | 상태          |
|-----------------------------|---------------------|---------------------------------------|------------------|---------------|
| `index.ts` → `game-state`   | `engine.getState()` | `GameEngine.state` (in-memory)        | Yes — 게임 액션마다 mutate 후 broadcast | ✓ FLOWING |
| `game-engine.ts` chips       | `player.chips`     | `attendSchool`, `processBetAction`, `settleChips`, `applyRechargeToPlayer` | Yes — 모든 경로에서 실제 차감/합산 | ✓ FLOWING |
| `game-engine.ts` chipBreakdown | `p.chipBreakdown` | `_updateChipBreakdowns()` (chips 기반 그리디 계산) | Yes — chips 변경 후 자동 갱신 | ✓ FLOWING |
| `game-engine.ts` effectiveMaxBet | `this.state.effectiveMaxBet` | `_updateEffectiveMaxBet()` (betting phase에서만) | Yes — 턴 변경 및 재충전 후 갱신 | ✓ FLOWING |

---

### Behavioral Spot-Checks

| 동작                                  | 명령                                                                    | 결과             | 상태     |
|---------------------------------------|-------------------------------------------------------------------------|------------------|----------|
| 전체 테스트 통과                       | `pnpm --filter @sutda/server test -- --run`                             | 127/127 passed   | ✓ PASS   |
| shared 빌드 성공                       | `pnpm --filter @sutda/shared build`                                     | exit code 0      | ✓ PASS   |
| calculateChipBreakdown export 확인     | `ChipBreakdown`이 `packages/shared/src/index.ts`에서 re-export          | 존재             | ✓ PASS   |
| applyRechargeToPlayer 메서드 존재      | `packages/server/src/game-engine.ts`에서 public 메서드 확인            | 존재             | ✓ PASS   |

---

### Requirements Coverage

| Requirement | 소스 Plan | 설명                                                              | 상태          | 근거                                                               |
|-------------|-----------|-------------------------------------------------------------------|---------------|--------------------------------------------------------------------|
| CHIP-01     | 05-01     | 각 플레이어의 현재 칩 잔액이 화면에 표시된다                       | ✓ SATISFIED   | `PlayerState.chips` + `chipBreakdown`이 `game-state` 브로드캐스트에 포함됨 |
| CHIP-02     | 05-01     | 판 종료 시 패배 플레이어 칩 차감, 승자에게 합산                    | ✓ SATISFIED   | `settleChips()` 구현, `_resolveShowdown` + `_advanceBettingTurn` 양쪽에서 호출 |
| CHIP-03     | 05-02     | 전원 동의 하에 만원 단위로 칩 재충전                               | ✓ SATISFIED   | `requestRecharge` + `processRechargeVote` + `applyRecharge` + Socket.IO 핸들러 구현 |
| CHIP-04     | 05-01     | 칩 단위(500/1000/5000/10000)별 시각적 구분                        | ✓ SATISFIED   | `ChipBreakdown` 인터페이스 + `calculateChipBreakdown` 그리디 구현, `PlayerState.chipBreakdown` 필드로 클라이언트 전달 |
| CHIP-05     | 05-01, 05-02 | 베팅/레이즈 시 칩 단위 버튼으로 금액 조합                       | ✓ SATISFIED   | `effectiveMaxBet` 서버 계산 + 클라이언트에 전달 + INSUFFICIENT_CHIPS 서버 검증 |

모든 5개 requirements (CHIP-01 ~ CHIP-05) 충족. 고아 requirement 없음.

---

### Anti-Patterns

| 파일 | 라인 | 패턴 | 심각도 | 영향 |
|------|------|------|--------|------|
| — | — | 없음 | — | — |

`TODO`, `FIXME`, `placeholder`, `return null`, `return {}`, `return []` 패턴 모두 미발견.

---

### Human Verification 필요 항목

아래 항목들은 서버 로직이 완전히 검증되었으나 클라이언트 UI가 아직 구현되지 않아 프로그래매틱 검증 불가:

#### 1. 칩 단위 시각화 표시 (CHIP-01, CHIP-04)

**테스트:** 게임 진행 중 플레이어의 칩 잔액을 `chipBreakdown` 필드를 이용해 500원/1,000원/5,000원/10,000원 단위 칩으로 화면에 구분하여 표시하는지 확인
**기대값:** 각 단위 칩 개수에 맞는 시각적 칩 아이콘 또는 색상 구분이 표시됨
**왜 사람이 필요:** UI 컴포넌트가 Phase 06 이후에 구현 예정 — 서버는 데이터를 정확히 전달하지만 렌더링 확인 불가

#### 2. 재충전 투표 UI 플로우 (CHIP-03)

**테스트:** 칩이 0인 플레이어가 재충전 요청 시 다른 플레이어 화면에 투표 팝업이 표시되고, 동의/거부 버튼이 작동하는지 확인
**기대값:** 투표 팝업 → 결과 표시 → 칩 업데이트가 UI에 즉시 반영됨
**왜 사람이 필요:** 클라이언트 UI 미구현 (Phase 06 이후)

#### 3. 유효 스택 상한 버튼 UI (CHIP-05)

**테스트:** 베팅 화면에서 레이즈 금액 입력 시 `effectiveMaxBet` 기준으로 상한이 설정되는지 확인
**기대값:** 상한 초과 입력이 UI에서 차단되거나 서버에서 INSUFFICIENT_CHIPS 에러 메시지가 사용자에게 표시됨
**왜 사람이 필요:** 클라이언트 UI 미구현 (Phase 06 이후)

---

## 종합 요약

Phase 05의 목표인 "칩 시스템과 정산 로직을 구현하여 게임 내 칩 관리를 완성한다"가 서버 레이어에서 완전히 달성되었다.

**Plan 01** 달성 내용:
- `ChipBreakdown` 인터페이스와 `PlayerState.chipBreakdown`, `GameState.effectiveMaxBet` 필드가 shared 타입에 추가되고 정상 export됨
- `calculateChipBreakdown` (그리디), `calculateEffectiveMaxBet` (유효 스택 상한), `settleChips` (pot → 승자 합산), `applyRechargeToPlayer` (칩 갱신 + 파생 상태 자동 갱신) 메서드가 `GameEngine`에 구현됨
- `attendSchool` 및 `processBetAction` (call/raise) 에서 chips 차감이 올바르게 연결됨
- 동점 재경기 시 pot 유지 및 chips 이동 없음 확인

**Plan 02** 달성 내용:
- `RoomManager`에 재충전 요청/투표/적용 메서드(`requestRecharge`, `processRechargeVote`, `applyRecharge`)가 구현됨
- 거부 시 `result.requesterId` 올바르게 전달 (투표자 ID 오염 방지)
- `recharge-request`, `recharge-vote` Socket.IO 핸들러 구현 및 방 전체 브로드캐스트 연결
- `bet-action` 핸들러에서 raise 시 `calculateEffectiveMaxBet` 검증 및 INSUFFICIENT_CHIPS 에러 처리

**테스트 결과:** 127/127 통과 (room-manager: 32개, game-engine: 80개, integration: 5개, index: 10개)

---

_검증 일시: 2026-03-30T00:49:00Z_
_검증자: Claude (gsd-verifier)_
