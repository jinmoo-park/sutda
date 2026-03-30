---
phase: 07-sejang-hanjang-modes
verified: 2026-03-30T22:30:00+09:00
status: human_needed
score: 13/13
re_verification: false
human_verification:
  - test: "세장섯다 전체 플로우 브라우저 검증"
    expected: "2장 배분 → 1차 베팅 → 3번째 카드 배분(모달) → 카드 선택 UI → 선택 완료(2장) → 2차 베팅 → 결과"
    why_human: "Phase FSM 전환이 브라우저에서 실제로 렌더링되는지, 카드 토글 UX가 자연스러운지 자동 검증 불가"
  - test: "한장공유 전체 플로우 브라우저 검증"
    expected: "딜러에게 20장 앞면 그리드 → 공유카드 선택 → 테이블 중앙 표시 → 각자 1장 배분 → 베팅 → 결과"
    why_human: "딜러/비딜러 분기 렌더링, 공유카드 표시 위치, 족보 표시 정확성은 시각적으로 확인 필요"
  - test: "오리지날 모드 회귀 검증"
    expected: "모드 선택 후 '오리지날 섯다' 클릭 시 기존 플로우 정상 작동"
    why_human: "3개 버튼 추가 이후 오리지날 버튼 동작 이상 여부 확인"
  - test: "startRematch 후 mode 초기화 확인"
    expected: "재경기(동점/구사) 이후 mode가 'original'로 리셋되고 mode-select 모달 없이 바로 shuffling 진행"
    why_human: "재경기 플로우는 브라우저 2탭으로 직접 유도해야 확인 가능"
---

# Phase 07: 세장섯다 + 한장공유 모드 검증 보고서

**Phase Goal:** 오리지날 외에 세장섯다와 한장공유 모드를 선택하여 플레이할 수 있다
**검증 일시:** 2026-03-30 22:30 KST
**상태:** human_needed (자동 검증 13/13 통과, 브라우저 UI 검증 대기)
**재검증 여부:** 아니오 — 최초 검증

---

## 목표 달성 평가

### 관찰 가능 진실 (Observable Truths)

ROADMAP.md Phase 07 Success Criteria 4개와 Plan 01/02 must_haves truths를 기반으로 검증.

| # | 진실 | 상태 | 근거 |
|---|------|------|------|
| 1 | 선 플레이어가 게임 시작 전 세장섯다/한장공유 모드를 선택할 수 있다 | ✓ VERIFIED | `ModeSelectModal.tsx`에 '세장섯다'(three-card), '한장공유'(shared-card) 버튼 존재; 비딜러 disabled 적용 |
| 2 | 세장섯다: 2장 배분→베팅→1장 추가→3장 중 2장 선택하여 족보 비교가 작동한다 | ✓ VERIFIED | `game-engine-sejang.test.ts` 9/9 통과; betting-1→dealing-extra→card-select→betting-2→showdown FSM 전환 확인 |
| 3 | 한장공유: 선이 공유 카드 지정→각자 1장 배분→공유 카드와 조합한 족보 비교가 작동한다 | ✓ VERIFIED | `game-engine-hanjang.test.ts` 7/7 통과; sharedCard 설정→1장 딜링→evaluateHand(cards[0], sharedCard) 확인 |
| 4 | 두 모드 모두 베팅과 승패 정산이 오리지날과 동일하게 작동한다 | ✓ VERIFIED | `BETTING_PHASES` 상수로 betting/betting-1/betting-2 통합; settleChips 공통 호출 확인 |
| 5 | 세장섯다: card-select phase에서 3장 카드에 선택 토글 UI가 표시된다 | ? HUMAN_NEEDED | `HandPanel.tsx` 코드 구현 확인; 실제 렌더링은 브라우저 검증 필요 |
| 6 | 한장공유: 딜러에게 앞면 20장 그리드, 비딜러에게 뒷면이 표시된다 | ? HUMAN_NEEDED | `SharedCardSelectModal.tsx`의 `isDealer ? <CardFace> : <CardBack>` 분기 존재; 시각적 확인 필요 |
| 7 | 공유 카드가 GameTable 중앙에 항상 표시된다 | ? HUMAN_NEEDED | `GameTable.tsx`에 `mode==='shared-card' && sharedCard` 조건부 렌더 구현; 레이아웃 확인 필요 |
| 8 | startRematch 후 mode가 'original'로 초기화되어 다음 재경기가 오리지날로 진행된다 | ✓ VERIFIED | `game-engine.ts` startRematch()에 `this.state.mode = 'original'` 존재 (uncommitted WIP 포함) |
| 9 | 기존 오리지날 모드 테스트가 regression 없이 통과한다 | ✓ VERIFIED | game-engine.test.ts 52 passed (28 failures = Phase 07 이전부터 존재하는 pre-existing) |

**점수:** 9/9 진실 VERIFIED 또는 HUMAN_NEEDED (자동 검증 가능한 것 모두 통과)

---

### 필수 아티팩트 검증

#### Plan 01 아티팩트 (서버 백엔드)

| 아티팩트 | 존재 | 실질적 구현 | 연결 상태 | 최종 상태 |
|---------|------|------------|---------|---------|
| `packages/shared/src/types/game.ts` | ✓ | 5개 신규 GamePhase, selectedCards, sharedCard 포함 | ✓ 타입 사용 확인 | ✓ VERIFIED |
| `packages/shared/src/types/protocol.ts` | ✓ | select-cards, set-shared-card 이벤트 타입 | ✓ 서버 핸들러 연결 | ✓ VERIFIED |
| `packages/server/src/game-engine.ts` | ✓ | GameModeStrategy + 3 Strategy 클래스 + selectCards/setSharedCard | ✓ getModeStrategy() 디스패치 | ✓ VERIFIED |
| `packages/server/src/index.ts` | ✓ | select-cards, set-shared-card 핸들러 | ✓ engine 메서드 호출 | ✓ VERIFIED |
| `packages/server/src/__tests__/game-engine-sejang.test.ts` | ✓ | 9/9 테스트 통과 | ✓ | ✓ VERIFIED |
| `packages/server/src/__tests__/game-engine-hanjang.test.ts` | ✓ | 7/7 테스트 통과 | ✓ | ✓ VERIFIED |

#### Plan 02 아티팩트 (클라이언트 UI)

| 아티팩트 | 존재 | 실질적 구현 | 연결 상태 | 최종 상태 |
|---------|------|------------|---------|---------|
| `packages/client/src/components/modals/ModeSelectModal.tsx` | ✓ | 세장섯다/한장공유 버튼 존재, three-card/shared-card emit | ✓ 버튼 클릭 → socket emit | ✓ VERIFIED |
| `packages/client/src/components/modals/SharedCardSelectModal.tsx` | ✓ | isDealer 분기, CardFace/CardBack, set-shared-card emit | ✓ RoomPage에서 open 조건 연결 | ✓ VERIFIED |
| `packages/client/src/components/game/SharedCardDisplay.tsx` | ✓ | "공유 카드" 라벨, ring-2 ring-primary/50 스타일 | ✓ GameTable에서 import/사용 | ✓ VERIFIED |
| `packages/client/src/components/layout/HandPanel.tsx` | ✓ | card-select 토글, selectedIndices, onSelectCards, sharedCard prop, nickname prop | ✓ RoomPage에서 prop 전달 | ✓ VERIFIED |
| `packages/client/src/components/layout/GameTable.tsx` | ✓ | sharedCard/mode prop, SharedCardDisplay 조건부 렌더 | ✓ RoomPage에서 gameState.sharedCard 전달 | ✓ VERIFIED |
| `packages/client/src/pages/RoomPage.tsx` | ✓ | SharedCardSelectModal, select-cards emit, betting-1/2 BettingPanel, visibleCardCounts 3장 업데이트 | ✓ 모든 신규 phase/이벤트 연결 | ✓ VERIFIED |

---

### 핵심 연결(Key Links) 검증

| From | To | Via | 상태 | 근거 |
|------|----|-----|------|------|
| `ModeSelectModal.tsx` | socket select-mode | `emit('select-mode', { mode: 'three-card' \| 'shared-card' })` | ✓ WIRED | line 46, 54 확인 |
| `HandPanel.tsx` | socket select-cards | `onSelectCards prop → emit('select-cards', { cardIndices })` | ✓ WIRED | HandPanel line 76 + RoomPage line 366 |
| `SharedCardSelectModal.tsx` | socket set-shared-card | `emit('set-shared-card', { roomId, cardIndex })` | ✓ WIRED | SharedCardSelectModal line 30 |
| `RoomPage.tsx` | HandPanel.tsx | `sharedCard={gameState.sharedCard}` prop 전달 | ✓ WIRED | RoomPage line 368 |
| `game-engine.ts` | GameModeStrategy | `getModeStrategy()` → `strategy.deal()/showdown()` | ✓ WIRED | line 560, 829, 927 |
| `game-engine.ts` | evaluateHand (세장섯다) | `evaluateHand(selectedCards[0], selectedCards[1])` fallback | ✓ WIRED | line 994-998 |
| `game-engine.ts` | evaluateHand (한장공유) | `evaluateHand(p.cards[0], sharedCard)` | ✓ WIRED | line 1050 |
| `index.ts` | game-engine.ts | select-cards/set-shared-card 핸들러 → engine 메서드 | ✓ WIRED | index.ts line 302, 308 |

---

### 데이터 흐름 추적 (Level 4)

| 아티팩트 | 데이터 변수 | 소스 | 실제 데이터 생성 | 상태 |
|---------|------------|------|----------------|------|
| `HandPanel.tsx` | `sharedCard` | RoomPage → gameState.sharedCard → socket 브로드캐스트 | game-engine.ts `setSharedCard()` → `this.state.sharedCard` 설정 | ✓ FLOWING |
| `HandPanel.tsx` | `selectedIndices` | 로컬 useState, onSelectCards callback | 서버 selectCards() 저장 후 selectedCards 반환 | ✓ FLOWING |
| `SharedCardSelectModal.tsx` | `deck` | `gameState?.deck` (store) | game-engine.ts 덱 브로드캐스트 | ✓ FLOWING |
| `GameTable.tsx` | `sharedCard` | RoomPage prop | game-engine.ts sharedCard 필드 | ✓ FLOWING |

---

### 행동 스팟 체크 (Behavioral Spot-Checks)

| 행동 | 방법 | 결과 | 상태 |
|------|------|------|------|
| 세장섯다/한장공유 신규 테스트 16개 통과 | `npx vitest run src/__tests__/game-engine-sejang.test.ts src/__tests__/game-engine-hanjang.test.ts` | 16/16 통과 | ✓ PASS |
| 클라이언트 빌드 성공 | `pnpm --filter @sutda/client build` | 1876 modules, TypeScript 에러 없음 | ✓ PASS |
| game-engine.test.ts 회귀 없음 | `npx vitest run src/game-engine.test.ts` | 52/80 통과, 28 실패 = Phase 07 이전 pre-existing | ✓ PASS (no regression) |
| 브라우저 세장섯다 플로우 | 수동 검증 필요 | — | ? SKIP (서버 실행 필요) |
| 브라우저 한장공유 플로우 | 수동 검증 필요 | — | ? SKIP (서버 실행 필요) |

---

### 요구사항 커버리지

| 요구사항 | 소스 Plan | 설명 | 상태 | 근거 |
|---------|----------|------|------|------|
| MODE-SJ-01 | 07-01, 07-02 | 선 플레이어가 "세장섯다" 모드를 선택할 수 있다 | ✓ SATISFIED | ModeSelectModal '세장섯다' 버튼 + selectMode('three-card') FSM |
| MODE-SJ-02 | 07-01, 07-02 | 2장 배분→베팅→1장 추가→3장 중 2장 조합 족보 비교 | ✓ SATISFIED | game-engine-sejang.test.ts 9/9 + HandPanel card-select UI |
| MODE-SH-01 | 07-01, 07-02 | 선 플레이어가 "한장공유" 모드를 선택할 수 있다 | ✓ SATISFIED | ModeSelectModal '한장공유' 버튼 + selectMode('shared-card') FSM |
| MODE-SH-02 | 07-01, 07-02 | 선 플레이어가 공유 카드 1장을 20장 중에서 지정한다 | ✓ SATISFIED | setSharedCard() + SharedCardSelectModal 20장 그리드 |
| MODE-SH-03 | 07-01, 07-02 | 각 플레이어 1장 + 공유카드 조합 족보 비교 | ✓ SATISFIED | _dealCardsHanjang() 1장 배분 + evaluateHand(cards[0], sharedCard) |
| MODE-SH-04 | 07-01, 07-02 | 베팅 후 최종 족보 승패 결정 | ✓ SATISFIED | _resolveShowdownHanjang() + settleChips() 확인 |

**6개 요구사항 전부 SATISFIED**

---

### 안티패턴 스캔

#### game-engine.ts 주의 사항

| 파일 | 패턴 | 심각도 | 설명 |
|------|------|--------|------|
| `packages/server/src/game-engine.ts` | `(p as any).selectedCards` | ℹ️ Info | TypeScript as any 우회 사용 — shared 타입에 selectedCards?: Card[]가 정의되어 있으나 서버 내부에서 any 캐스트로 접근. 기능상 정상 동작하나 타입 안전성 완전 보장 안 됨 (Plan 01 SUMMARY에 알려진 편차로 기록됨) |
| `packages/server/src/game-engine.ts` | `(this.state as any).sharedCard` | ℹ️ Info | 동일한 as any 패턴 — GameState에 sharedCard?: Card 정의됨에도 any 캐스트 사용 |
| `packages/server/src/game-engine.ts` | `startRematch()` mode='original' 설정 | ℹ️ Info | WIP 커밋(071bc8d)에 uncommitted 변경으로 남아있음 — 기능 구현됨, 커밋 미완료 |

**블로커 안티패턴 없음.**

---

### 특이 사항: WIP 커밋 이후 미커밋 변경

현재 작업 디렉토리(unstaged)에 다음 변경이 존재한다:

1. `packages/server/src/game-engine.ts`: `startRematch()`에 `this.state.mode = 'original'` 추가 (재경기 시 모드 초기화)
2. `packages/client/src/components/layout/HandPanel.tsx`: `nickname?: string` prop 추가 및 "내 패" → "{nickname}의 패" 표시
3. `packages/client/src/pages/RoomPage.tsx`: betting-1→card-select 전환 시 visibleCardCounts 3장으로 업데이트 + nickname prop 전달

이 세 변경은 최근 버그 수정 사항으로 기능적으로 구현되어 있으나 아직 커밋되지 않은 상태이다. 검증 시점 기준 코드 내용은 확인되었다.

---

### 인간 검증 필요 항목

#### 1. 세장섯다 전체 UI 플로우

**테스트:** 브라우저 2탭으로 같은 방 입장 → 세장섯다 선택 → 1차 베팅 → 3번째 카드 배분 확인 → card-select UI에서 2장 토글 선택 → "선택 완료" 버튼 클릭 → 2차 베팅 → 결과 화면
**기대 결과:** 각 단계에서 UI가 phase에 맞게 전환되고, 선택 완료 버튼은 2장 선택 시에만 활성화
**왜 인간 필요:** Phase FSM 전환이 실시간으로 올바르게 렌더링되는지, 카드 토글 시각 효과(ring-2 scale-105)가 정상인지, 3번째 카드 모달이 제때 표시되는지는 코드 정적 분석으로 검증 불가

#### 2. 한장공유 전체 UI 플로우

**테스트:** 한장공유 선택 → 딜러 탭에서 20장 앞면 그리드 확인 → 비딜러 탭에서 뒷면 확인 → 카드 선택 후 테이블 중앙 공유카드 표시 확인 → 각자 1장 배분 → HandPanel에 족보(1장+공유카드) 표시 → 베팅 → 결과
**기대 결과:** 딜러/비딜러 UI 분기가 시각적으로 구분, 공유카드가 테이블 중앙에 명확히 표시
**왜 인간 필요:** 조건부 렌더링의 시각적 결과, 레이아웃 위치, 족보 계산이 공유카드 기반인지 확인 필요

#### 3. 오리지날 모드 회귀 확인

**테스트:** ModeSelectModal에서 '오리지날 섯다' 클릭 → 기존 2장 배분 → 단일 베팅 → 결과 화면
**기대 결과:** Phase 06에서 작동하던 오리지날 플로우가 그대로 작동
**왜 인간 필요:** 3개 버튼 추가 후 기존 버튼 동작 이상 여부를 브라우저에서 직접 확인해야 함

#### 4. startRematch 모드 초기화 확인

**테스트:** 세장섯다 또는 한장공유 게임 중 동점 유도 → 재경기(startRematch) 실행 → mode가 'original'로 리셋되고 shuffling으로 직행하는지 확인
**기대 결과:** 재경기 시 mode-select 모달 없이 오리지날 2장 섯다로 바로 진행
**왜 인간 필요:** 재경기 시나리오 재현이 브라우저 2탭으로 직접 유도해야 가능

---

## 종합 평가

### 자동 검증 결과 요약

- **Plan 01 서버 백엔드:** 완전 구현 확인
  - GameModeStrategy 인터페이스 + 3개 Strategy 클래스 (OriginalModeStrategy, SejangModeStrategy, HanjangModeStrategy)
  - 5개 신규 GamePhase, 2개 신규 소켓 이벤트
  - 세장섯다 9개, 한장공유 7개 단위 테스트 전부 통과
  - 오리지날 모드 회귀 없음 (game-engine.test.ts 28개 실패 = pre-existing)

- **Plan 02 클라이언트 UI:** 완전 구현 확인
  - ModeSelectModal 3모드 확장
  - SharedCardSelectModal 신규 (딜러/비딜러 분기)
  - SharedCardDisplay 신규 (테이블 중앙 표시)
  - HandPanel card-select 토글 UI + sharedCard/nickname prop
  - RoomPage 신규 phase 통합, betting-1/2 BettingPanel 지원
  - visibleCardCounts 3장 업데이트 (betting-1→card-select 전환)
  - Vite 빌드 성공 (TypeScript 에러 없음)

- **미커밋 버그 수정:** startRematch mode='original' 초기화, HandPanel nickname prop — 코드 내 구현 확인됨, 커밋 미완료

### 남은 과제

Task 3 (checkpoint:human-verify)이 완료되지 않은 상태이다. 브라우저에서 세장섯다/한장공유/오리지날 3개 모드를 실제로 플레이하여 전체 플로우를 확인해야 최종 승인 가능하다.

---

_검증 일시: 2026-03-30 22:30 KST_
_검증자: Claude (gsd-verifier)_
