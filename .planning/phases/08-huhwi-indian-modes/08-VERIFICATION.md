---
phase: 08-huhwi-indian-modes
verified: 2026-03-30T16:00:00Z
status: passed
score: 19/19 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 5/9
  gaps_closed:
    - "GameMode 타입에 'gollagolla'와 'indian'이 포함되어 있다"
    - "GamePhase 타입에 'gollagolla-select'가 포함되어 있다"
    - "GollagollaModeStrategy.deal()이 phase를 'gollagolla-select'로 전환한다"
    - "IndianModeStrategy.deal()이 각 플레이어에게 1장 배분 후 phase를 'betting-1'로 전환한다"
    - "클라이언트가 select-gollagolla-cards 이벤트를 emit하면 서버가 선착순으로 처리한다"
    - "pnpm build 전체 모노레포가 TypeScript 에러 없이 성공한다"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "골라골라 모드 선착순 동시 선택 — 2명이 동시에 같은 카드를 선택하려 할 때 먼저 선택한 플레이어가 우선권을 가지는지 확인"
    expected: "늦게 선택한 플레이어의 카드가 CARD_ALREADY_TAKEN 에러로 거부되고 sonner toast 메시지가 표시됨"
    why_human: "서버 선착순 처리는 실시간 동시성 테스트가 필요함"
  - test: "인디언 모드 카드 가시성 반전 — 자신의 화면과 타인의 화면을 동시에 비교"
    expected: "내 화면의 내 첫 카드는 CardBack, 타인 화면에서 내 첫 카드는 CardFace 공개"
    why_human: "per-player 가시성 반전은 두 클라이언트 화면을 동시에 확인해야 함"
  - test: "골라골라 → 베팅 자동 전환 — 모든 플레이어 2장 선택 완료 후 GollaSelectModal이 닫히고 베팅 UI로 전환"
    expected: "모든 플레이어 선택 완료 즉시 모달이 닫히고 베팅 패널이 활성화됨"
    why_human: "UI 전환 타이밍과 모달 닫힘 애니메이션은 시각적 확인 필요"
---

# Phase 8: 골라골라 + 인디언섯다 모드 Verification Report

**Phase Goal:** 골라골라(훠휘) + 인디언섯다 두 신규 모드를 서버·클라이언트 전 계층에 구현한다
**Verified:** 2026-03-30T16:00:00Z
**Status:** passed
**Re-verification:** Yes — 이전 검증(working tree revert 문제로 gaps_found)에서 gap 해소 확인

## 재검증 요약

이전 검증(2026-03-30T15:00:00Z)은 `packages/shared/src/types/game.ts`, `packages/server/src/game-engine.ts`, `packages/shared/src/types/protocol.ts` 3개 파일의 working tree가 Phase 8 변경사항을 되돌린 상태여서 gaps_found를 기록했다.

현재 검증에서는 working tree가 HEAD 커밋 상태로 복원되어 있으며, `pnpm build`가 3/3 패키지 모두 성공한다.

---

## Goal Achievement

### Observable Truths — 08-01 (공유 타입 + GameEngine)

| # | Truth | Status | 근거 |
|---|-------|--------|------|
| 1 | GameMode 타입에 'gollagolla'와 'indian'이 포함되어 있다 | ✓ VERIFIED | `game.ts` line 37: `'gollagolla'`, line 38: `'indian'` |
| 2 | GamePhase 타입에 'gollagolla-select'가 포함되어 있다 | ✓ VERIFIED | `game.ts` line 26: `'gollagolla-select'` |
| 3 | GameEngine이 selectGollaCards(playerId, cardIndices) 메서드를 가진다 | ✓ VERIFIED | `game-engine.ts` line 455: `selectGollaCards(playerId, cardIndices)` |
| 4 | GameEngine이 getStateFor(playerId) 메서드를 가지며 인디언 모드에서 카드를 마스킹한다 | ✓ VERIFIED | `game-engine.ts` line 526: `getStateFor(playerId)`, null 마스킹 로직 line 541-563 |
| 5 | GollagollaModeStrategy.deal()이 phase를 'gollagolla-select'로 전환한다 | ✓ VERIFIED | `game-engine.ts` line 41-48: `GollagollaModeStrategy`, `_dealCardsGollagolla` line 834: `this.state.phase = 'gollagolla-select'` |
| 6 | IndianModeStrategy.deal()이 각 플레이어에게 1장 배분 후 phase를 'betting-1'로 전환한다 | ✓ VERIFIED | `game-engine.ts` line 50-57: `IndianModeStrategy`, `_dealCardsIndian` line 855: `this.state.phase = 'betting-1'` |

**08-01 Score:** 6/6

### Observable Truths — 08-02 (소켓 핸들러 + per-player emit)

| # | Truth | Status | 근거 |
|---|-------|--------|------|
| 1 | 클라이언트가 select-gollagolla-cards 이벤트를 emit하면 서버가 선착순으로 처리한다 | ✓ VERIFIED | `index.ts` line 329-335: `socket.on('select-gollagolla-cards', ...)` → `engine.selectGollaCards()` |
| 2 | 충돌(이미 선택된 카드)이면 서버가 game-error를 반환한다 | ✓ VERIFIED | `game-engine.ts` line 478-479: `takenByOthers` 검사 → `CARD_ALREADY_TAKEN` 에러. `index.ts` line 55: 에러 메시지 매핑 |
| 3 | 모든 플레이어 2장 선택 완료 시 게임 상태가 betting으로 전환된다 | ✓ VERIFIED | `game-engine.ts` line 491-502: `allDone` 조건 → `phase = 'betting'` |
| 4 | 인디언 모드에서 handleGameAction이 per-player emit으로 각 소켓에 getStateFor를 전송한다 | ✓ VERIFIED | `index.ts` line 75-97: `handleGameAction` async, `fetchSockets()` line 86, `getStateFor(pid)` line 89 |
| 5 | 인디언 모드 betting-1 완료 후 서버가 자동으로 dealing-extra를 처리하고 betting-2로 전환한다 | ✓ VERIFIED | `game-engine.ts` line 1036-1041: `_advanceBettingTurn()` 내 인디언 분기. `index.ts` line 296-300: `stateAfter.phase === 'dealing-extra'` → `dealExtraCardIndian()` |

**08-02 Score:** 5/5

### Observable Truths — 08-03 (클라이언트 UI)

| # | Truth | Status | 근거 |
|---|-------|--------|------|
| 1 | ModeSelectModal에 '골라골라'와 '인디언섯다' 버튼이 표시된다 | ✓ VERIFIED | `ModeSelectModal.tsx` line 62-73: 두 버튼 존재, `mode: 'gollagolla'`, `mode: 'indian'` emit |
| 2 | gollagolla-select phase에서 GollaSelectModal이 열리고 20장 카드 그리드가 표시된다 | ✓ VERIFIED | `GollaSelectModal.tsx` 존재 (117줄), `grid grid-cols-5 gap-2` line 86. `RoomPage.tsx` line 445: `phase === 'gollagolla-select'` 조건 |
| 3 | 이미 타인이 선택한 카드는 opacity-40 + cursor-not-allowed로 dim 처리된다 | ✓ VERIFIED | `GollaSelectModal.tsx` line 101-102: `opacity-40 cursor-not-allowed` |
| 4 | 내가 선택한 카드(1장)에는 ring-2 ring-primary 하이라이트가 적용된다 | ✓ VERIFIED | `GollaSelectModal.tsx` line 106: `ring-2 ring-primary opacity-100` |
| 5 | 2장 선택 완료 시 자동으로 select-gollagolla-cards emit이 발생한다 | ✓ VERIFIED | `GollaSelectModal.tsx` line 57-61: 2장 완료 시 즉시 `socket.emit('select-gollagolla-cards', ...)` |
| 6 | HandPanel에서 cards[0]가 null이면 CardBack으로 렌더링된다 | ✓ VERIFIED | `HandPanel.tsx` line 7: `import { CardBack }`, line 125-126: `card === null ? <CardBack />` |
| 7 | 인디언 모드 betting-1 phase에서 내 첫 카드가 CardBack으로 표시된다 | ✓ VERIFIED | `getStateFor()`의 마스킹(phase === 'betting-1' 시 본인 cards[0] = null) + HandPanel null→CardBack 렌더링 조합 |
| 8 | game-error 수신 시 sonner toast로 에러 메시지가 표시된다 | ✓ VERIFIED | `RoomPage.tsx` line 78-89: `socket.on('game-error', handleGameError)`, `CARD_ALREADY_TAKEN` → `toast.error()` |

**08-03 Score:** 8/8

**전체 Score:** 19/19 truths verified

---

## Required Artifacts

| Artifact | 제공 기능 | Status | 상세 |
|----------|---------|--------|------|
| `packages/shared/src/types/game.ts` | GameMode, GamePhase 타입 확장 | ✓ VERIFIED | 'gollagolla', 'indian', 'gollagolla-select', `gollaOpenDeck?: Card[]`, `cards: (Card\|null)[]` 모두 존재 |
| `packages/server/src/game-engine.ts` | 두 신규 Strategy + selectGollaCards + getStateFor | ✓ VERIFIED | `GollagollaModeStrategy` (line 41), `IndianModeStrategy` (line 50), `selectGollaCards` (line 455), `getStateFor` (line 526), `_dealCardsGollagolla` (line 827), `_dealCardsIndian` (line 843), `_dealExtraCardIndian` (line 870) |
| `packages/shared/src/types/protocol.ts` | select-gollagolla-cards 이벤트 타입 | ✓ VERIFIED | `'select-gollagolla-cards'` (line 50), `'CARD_ALREADY_TAKEN'` (line 22) |
| `packages/server/src/index.ts` | select-gollagolla-cards 핸들러 + per-player emit | ✓ VERIFIED | `fetchSockets` (line 86), `getStateFor(pid)` (line 89), `select-gollagolla-cards` 핸들러 (line 329), `dealExtraCardIndian` (line 299) |
| `packages/client/src/components/modals/GollaSelectModal.tsx` | 골라골라 카드 선택 모달 | ✓ VERIFIED | 파일 존재, 117줄, 실제 구현 (그리드, dim 처리, 하이라이트, 자동 emit) |
| `packages/client/src/components/modals/ModeSelectModal.tsx` | 골라골라/인디언섯다 버튼 추가 | ✓ VERIFIED | '골라골라', '인디언섯다' 버튼, `mode: 'gollagolla'`, `mode: 'indian'` emit |
| `packages/client/src/components/layout/HandPanel.tsx` | 인디언 모드 null 카드 CardBack 렌더링 | ✓ VERIFIED | `CardBack` import, `card === null` 분기 |
| `packages/client/src/pages/RoomPage.tsx` | GollaSelectModal 마운트 + game-error 소켓 핸들러 | ✓ VERIFIED | `GollaSelectModal` import, `phase === 'gollagolla-select'` 조건, `CARD_ALREADY_TAKEN` toast 처리 |

---

## Key Link Verification

| From | To | Via | Status | 상세 |
|------|----|-----|--------|------|
| GollagollaModeStrategy | GameEngine.state.phase | `deal()` → `_dealCardsGollagolla()` → `phase='gollagolla-select'` | ✓ WIRED | `game-engine.ts` line 41-48, 827-835 |
| IndianModeStrategy | GameEngine.state.phase | `deal()` → `_dealCardsIndian()` → `phase='betting-1'` | ✓ WIRED | `game-engine.ts` line 50-57, 843-862 |
| getStateFor | PlayerState.cards | 인디언 모드 betting-1 phase에서 본인 `cards[0] = null` | ✓ WIRED | `game-engine.ts` line 526-564 |
| `packages/server/src/index.ts` | `engine.selectGollaCards()` | `socket.on('select-gollagolla-cards')` 핸들러 | ✓ WIRED | `index.ts` line 329-335 |
| `packages/server/src/index.ts` | `engine.getStateFor()` | `handleGameAction` per-player emit (`fetchSockets`) | ✓ WIRED | `index.ts` line 86-89 |
| GollaSelectModal | `socket.emit('select-gollagolla-cards')` | 2장 선택 완료 시 자동 emit | ✓ WIRED | `GollaSelectModal.tsx` line 57-61 |
| RoomPage | GollaSelectModal | `gameState.phase === 'gollagolla-select'` 조건 | ✓ WIRED | `RoomPage.tsx` line 445 |
| HandPanel | CardBack | `card === null` 조건 분기 | ✓ WIRED | `HandPanel.tsx` line 125-126 |

---

## Data-Flow Trace (Level 4)

| Artifact | 데이터 변수 | 소스 | 실제 데이터 여부 | Status |
|----------|-----------|------|--------------|--------|
| GollaSelectModal.tsx | `gameState.gollaOpenDeck` | `_dealCardsGollagolla()` → `this.state.gollaOpenDeck = [...this.state.deck]` → `getStateFor()` → `socket 'game-state'` | 실제 셔플된 덱 20장 | ✓ FLOWING |
| HandPanel.tsx | `cards: (Card\|null)[]` | `getStateFor(playerId)` → 인디언 모드 마스킹으로 `cards[0] = null` 주입 | 실제 서버 per-player 마스킹 | ✓ FLOWING |
| ModeSelectModal.tsx | 버튼 렌더링 | 정적 UI (소켓 emit 유발) | 해당 없음 (정적 버튼) | ✓ FLOWING |

---

## Behavioral Spot-Checks

| 동작 | 명령 | 결과 | Status |
|------|------|------|--------|
| 전체 모노레포 빌드 | `pnpm build` | 3 successful, 3 total (shared/server/client) | ✓ PASS |
| shared 패키지 빌드 | `pnpm --filter @sutda/shared build` | 성공 | ✓ PASS |
| server 패키지 빌드 (TypeScript) | `pnpm --filter @sutda/server build` | 성공 (tsc 에러 없음) | ✓ PASS |
| client 패키지 빌드 (Vite) | `pnpm --filter @sutda/client build` | 1877 modules transformed, built in 4.78s | ✓ PASS |
| GollaSelectModal 파일 존재 | `ls packages/client/src/components/modals/` | GollaSelectModal.tsx 확인 | ✓ PASS |

---

## Requirements Coverage

| Requirement | 소스 Plan | 설명 | Status | 근거 |
|-------------|---------|------|--------|------|
| MODE-HR-01 | 08-01, 08-03 | 선 플레이어가 "골라골라" 모드 선택 가능 | ✓ SATISFIED | `ModeSelectModal.tsx`: '골라골라' 버튼, `mode: 'gollagolla'` emit. `game-engine.ts` line 78: `case 'gollagolla': return new GollagollaModeStrategy()` |
| MODE-HR-02 | 08-01, 08-02, 08-03 | 20장 오픈, 동시 선착순 2장 선택 | ✓ SATISFIED | `_dealCardsGollagolla()`: 덱 20장 → `gollaOpenDeck`. `GollaSelectModal.tsx`: 5열 그리드 UI. `selectGollaCards()`: 선착순 충돌 감지 (`_gollaSelectedIndices` Map) |
| MODE-HR-03 | 08-01, 08-02, 08-03 | 2장 선택 완료 시 베팅 페이즈 자동 전환 | ✓ SATISFIED | `selectGollaCards()` line 491-502: `allDone` → `phase = 'betting'`. `GollaSelectModal.tsx` line 55-61: 2장 선택 즉시 emit |
| MODE-HR-04 | 08-01, 08-03 | 베팅 후 선택한 2장으로 족보 비교 승패 결정 | ✓ SATISFIED | `GollagollaModeStrategy.showdown()` → `_resolveShowdownOriginal()`: 오리지날 족보 비교 위임. `player.cards` 에 선택된 2장이 저장됨 |
| MODE-IN-01 | 08-01, 08-03 | 선 플레이어가 "인디언섯다" 모드 선택 가능 | ✓ SATISFIED | `ModeSelectModal.tsx`: '인디언섯다' 버튼, `mode: 'indian'` emit. `game-engine.ts` line 79: `case 'indian': return new IndianModeStrategy()` |
| MODE-IN-02 | 08-01, 08-02, 08-03 | 1장 배분 — 본인에게 안 보이고 타인에게 보임 | ✓ SATISFIED | `_dealCardsIndian()`: 1장씩 배분. `getStateFor()` line 544-548: `betting-1` phase에서 본인 `cards[0] = null`. `handleGameAction` per-player emit으로 각 플레이어에게 개인화 상태 전송 |
| MODE-IN-03 | 08-02, 08-03 | 첫 베팅 (자신 카드 못 보고 타인 카드 보며 베팅) | ✓ SATISFIED | `getStateFor()` 마스킹: 본인 `cards[0] = null` (CardBack 렌더링), 타인 `cards[0]`는 정상 공개. `HandPanel.tsx`: null → `<CardBack />` |
| MODE-IN-04 | 08-01, 08-02, 08-03 | 베팅 종료 후 1장 추가 배분 (본인만 볼 수 있음) | ✓ SATISFIED | `_advanceBettingTurn()` line 1037-1041: `betting-1` 완료 → `phase='dealing-extra'`. `index.ts` line 296-300: `dealing-extra` 감지 → `dealExtraCardIndian()`. `getStateFor()` line 549-558: `betting-2` phase에서 타인의 `cards[1] = null` |
| MODE-IN-05 | 08-01, 08-03 | 최종 베팅 후 2장 족보 비교 승패 결정 | ✓ SATISFIED | `_advanceBettingTurn()` line 1047-1051: `betting-2` 완료 → `strategy.showdown()`. `IndianModeStrategy.showdown()` → `_resolveShowdownOriginal()` |

**Coverage:** 9/9 요구사항 모두 SATISFIED

---

## Anti-Patterns Found

| 파일 | 항목 | 심각도 | 판정 |
|------|------|--------|------|
| `game-engine.ts` `_dealCardsGollagolla()` | `this.state.players.forEach(p => { p.cards = []; })` — 플레이어 cards 초기화 | ℹ️ Info | 정상 패턴 — 골라골라 선택 전 cards가 비어있어야 함. stub 아님 |
| `getStateFor()` | `cards[0] = null as any` — TypeScript `as any` 캐스팅 | ⚠️ Warning | `(Card \| null)[]` 타입으로 수정되어 실제로는 `as any` 불필요하나 동작에 영향 없음 |

스터브 없음 — 모든 핵심 메서드가 실제 로직으로 구현됨.

---

## Human Verification Required

### 1. 골라골라 모드 선착순 동시 선택

**Test:** 2명이 동시에 같은 카드를 선택하려 할 때 먼저 선택한 플레이어가 우선권을 가지는지 확인
**Expected:** 늦게 선택한 플레이어의 카드가 CARD_ALREADY_TAKEN 에러로 거부되고, sonner toast 메시지가 표시됨
**Why human:** 서버 선착순 처리는 실시간 동시성 테스트가 필요함

### 2. 인디언 모드 카드 가시성 반전

**Test:** 인디언 모드에서 게임 참가 후 자신의 화면과 타인의 화면을 비교
**Expected:** 내 화면의 내 첫 카드: CardBack 표시. 타인 화면에서 내 첫 카드: CardFace 공개
**Why human:** per-player 가시성 반전은 두 개의 서로 다른 클라이언트 화면을 동시에 확인해야 함

### 3. 골라골라 → 베팅 자동 전환

**Test:** 모든 플레이어가 2장 선택 완료 후 GollaSelectModal이 닫히고 베팅 UI로 전환되는지 확인
**Expected:** 모든 플레이어 선택 완료 즉시 모달이 닫히고 베팅 패널이 활성화됨
**Why human:** UI 전환 타이밍과 모달 닫힘 애니메이션은 시각적 확인 필요

---

## Gaps Summary

없음 — 이전 gaps_found의 근본 원인이었던 working tree revert가 해소되었으며, 전체 모노레포 빌드가 성공한다.

이전 검증에서 실패한 6개 gaps는 모두 동일한 원인(working tree 3개 파일이 Phase 8 이전 상태)에서 비롯되었으며, 해당 파일들이 복원된 현재 모든 truth가 VERIFIED 상태이다.

---

*Verified: 2026-03-30T16:00:00Z*
*Re-verification: Yes (previous: 2026-03-30T15:00:00Z, gaps_found → passed)*
*Verifier: Claude (gsd-verifier)*
