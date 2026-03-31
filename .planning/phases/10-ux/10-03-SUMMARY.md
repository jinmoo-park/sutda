---
phase: 10-ux
plan: "03"
subsystem: client-ui
tags: [hwatu-card, flip-interaction, deal-animation, card-replacement]
dependency_graph:
  requires: ["10-01", "10-02"]
  provides: ["HwatuCard 전면 교체", "flip 인터랙션", "deal-fly-in 애니메이션"]
  affects: ["HandPanel", "PlayerSeat", "ResultScreen", "모달 컴포넌트"]
tech_stack:
  added: []
  patterns: ["CSS keyframe animation", "React useState Set<number>", "onAllFlipped callback"]
key_files:
  created: []
  modified:
    - packages/client/src/components/layout/HandPanel.tsx
    - packages/client/src/pages/RoomPage.tsx
    - packages/client/src/components/layout/__tests__/HandPanel.test.tsx
    - packages/client/src/index.css
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/game/SharedCardDisplay.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/components/modals/GollaSelectModal.tsx
    - packages/client/src/components/modals/SharedCardSelectModal.tsx
    - packages/client/src/components/modals/SejangCardSelectModal.tsx
    - packages/client/src/components/modals/SejangOpenCardModal.tsx
    - packages/client/src/components/modals/MuckChoiceModal.tsx
    - packages/client/src/components/modals/DealerSelectModal.tsx
    - packages/client/src/components/modals/DealerResultOverlay.tsx
decisions:
  - "HandPanel: flippedIndices(Set<number>) 로컬 상태로 flip 추적, 2장 완료 시 onAllFlipped() 콜백"
  - "배분 애니메이션: index.css @keyframes deal-fly-in으로 전역 정의, inline style로 각 카드 적용"
  - "showCardConfirm 오버레이 완전 제거 — flip 인터랙션으로 대체, cardConfirmed는 onAllFlipped로 설정"
  - "dealingComplete 상태로 배분 완료 전 flip 클릭 잠금, GameTable 통해 PlayerSeat까지 전달"
  - "DealerSelectModal/DealerResultOverlay도 HwatuCard로 교체 (plan scope 외지만 Rule2 적용)"
metrics:
  duration_seconds: 510
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_modified: 15
---

# Phase 10 Plan 03: 텍스트 카드 교체 + flip 인터랙션 + 배분 애니메이션 Summary

## 한 줄 요약

HandPanel에 3D flip 인터랙션(flippedIndices 상태 + HwatuCard), showCardConfirm 오버레이 제거, deal-fly-in CSS keyframe 애니메이션 추가, 전체 컴포넌트의 CardFace/CardBack을 HwatuCard로 교체.

## 완료된 작업

### Task 1: HandPanel flip 인터랙션 + RoomPage 카드 확인 오버레이 제거 + 배분 날아오기 애니메이션

- **HandPanel.tsx 재작성**
  - `CardFace`, `CardBack` import 제거, `HwatuCard` import 추가
  - `flippedIndices: Set<number>` 상태 추가 — 각 카드 뒤집기 상태 독립 추적
  - `onAllFlipped?: () => void` prop 추가 — 2장 모두 뒤집으면 호출
  - `dealingComplete?: boolean` prop 추가 — false이면 flip 클릭 불가
  - `handleFlip(idx)` 함수 — dealingComplete 확인, null 카드 거부, 2장 완료 시 onAllFlipped()
  - 족보 표시 조건: `cards.length >= 2` → `flippedIndices.size >= 2` (2장 모두 뒤집을 때만)
  - 1장 뒤집은 상태 힌트: "나머지 카드를 탭해서 확인하세요"
  - phase 변경 시 `setFlippedIndices(new Set())` 리셋
  - `getDealAnimStyle(idx)`: deal-fly-in keyframe + animationDelay 적용

- **RoomPage.tsx 수정**
  - `showCardConfirm` 상태 및 관련 오버레이 JSX 블록 완전 제거
  - `dealingComplete` 상태 추가 (기본값 true)
  - 딜링 시작 시 `setDealingComplete(false)`, 완료 후 `setTimeout(() => setDealingComplete(true), 600)`
  - HandPanel에 `onAllFlipped={() => setCardConfirmed(true)}`, `dealingComplete={dealingComplete}` 전달
  - GameTable에 `dealingComplete={dealingComplete}` 전달
  - 세장섯다 3번째 카드 오버레이: `CardFace` → `HwatuCard` 교체
  - `CardFace` import 제거, `HwatuCard` import 추가

- **index.css**: `@keyframes deal-fly-in` 정의 (translateY -80px→0, opacity 0→1, 0.4s)

- **HandPanel.test.tsx 재작성**: source 기반 13개 테스트 — HwatuCard import, flippedIndices, onAllFlipped, dealingComplete, 힌트 텍스트, deal-fly-in 관련 코드 모두 확인

### Task 2: CardFace/CardBack 전면 교체 — PlayerSeat, ResultScreen, 모달 컴포넌트 + 배분 애니메이션

- **PlayerSeat.tsx**: CardFace/CardBack → HwatuCard(size="sm"), `dealingComplete` prop 추가, `getDealAnimStyle(cardIdx)` 각 카드에 적용
- **GameTable.tsx**: `dealingComplete` prop 추가, PlayerSeat에 전달 (데스크탑/모바일 양쪽)
- **ResultScreen.tsx**: CardFace/CardBack → HwatuCard(size="md", faceUp 상태 유지)
- **SharedCardDisplay.tsx**: CardFace → HwatuCard(size="sm", faceUp=true)
- **GollaSelectModal.tsx**: CardBack → HwatuCard(faceUp=false, size="sm")
- **SharedCardSelectModal.tsx**: CardFace/CardBack → HwatuCard(dealer=size lg, 뒷면=size sm)
- **SejangCardSelectModal.tsx**: CardFace → HwatuCard(size="lg", faceUp=true)
- **SejangOpenCardModal.tsx**: CardFace → HwatuCard(size="md", faceUp=true)
- **MuckChoiceModal.tsx**: CardFace → HwatuCard(size="md", faceUp=true)
- **DealerSelectModal.tsx**: CardFace/CardBack → HwatuCard(size="sm")
- **DealerResultOverlay.tsx**: CardFace → HwatuCard(size="sm", faceUp=true)

## 검증 결과

- 전체 클라이언트 테스트: 56 passed, 14 todo (0 failed)
- `grep CardFace packages/client/src/ --include="*.tsx"` — CardFace.tsx, CutModal.tsx 외 결과 없음
- HandPanel.test.tsx: 13 tests passed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing scope] DealerSelectModal / DealerResultOverlay CardFace 교체**
- **Found during:** Task 2 (grep 검색)
- **Issue:** Plan에서 명시하지 않았지만 CardFace 사용처가 DealerSelectModal, DealerResultOverlay에도 존재
- **Fix:** 해당 파일도 HwatuCard로 교체 — 일관성 완성
- **Files modified:** DealerSelectModal.tsx, DealerResultOverlay.tsx

**2. [Rule 2 - Missing prop chain] GameTable dealingComplete 전달**
- **Found during:** Task 2
- **Issue:** PlayerSeat에 dealingComplete prop을 추가했지만 GameTable을 통해 전달되어야 함
- **Fix:** GameTable에 dealingComplete prop 추가, 두 PlayerSeat 렌더(데스크탑/모바일) 모두에 전달
- **Files modified:** GameTable.tsx, RoomPage.tsx

## 알려진 스텁

없음 — 모든 카드 컴포넌트가 실제 HwatuCard로 교체됨. CutModal의 CardBack은 Plan 04에서 기리 UX 재설계 시 처리 예정 (의도적 제외).

## Self-Check: PASSED
