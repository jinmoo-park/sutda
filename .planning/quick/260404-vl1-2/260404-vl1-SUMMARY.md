---
phase: quick-260404-vl1
plan: "01"
subsystem: client-ui
tags: [shared-card, result-screen, card-reveal, bug-fix]
dependency_graph:
  requires: []
  provides: [shared-card-result-display]
  affects: [ResultScreen.tsx]
tech_stack:
  added: []
  patterns: [gameState.mode 판별 후 displayCards 2장 조합]
key_files:
  created: []
  modified:
    - packages/client/src/components/layout/ResultScreen.tsx
decisions:
  - isSharedCardMode 변수를 allPlayers.map() 루프 바깥에서 1회 선언 (gameState 레벨 판별)
  - selectedCards 우선 순위 유지 (세장섯다 호환성 보장)
metrics:
  duration: "5분"
  completed: "2026-04-04"
  tasks_completed: 1
  files_modified: 1
---

# Phase quick-260404-vl1 Plan 01: 한장공유 모드 ResultScreen 2장 표시 + card-reveal 공유카드 자동 공개 Summary

## 한 줄 요약

shared-card 모드 ResultScreen에서 각 플레이어가 [본인 1장 + 공유카드 1장] = 2장을 표시하도록 displayCards 로직을 수정하고, card-reveal phase에서 공유카드(idx=1)를 항상 앞면으로 자동 표시하도록 처리.

## 완료된 태스크

| # | 태스크 | 커밋 | 변경 파일 |
|---|--------|------|-----------|
| 1 | shared-card 모드 displayCards 2장 조합 + card-reveal 공유카드 자동 공개 | f5d5aee | packages/client/src/components/layout/ResultScreen.tsx |

## 변경 내용

### 1. isSharedCardMode 선언 (line 182)

```typescript
const isSharedCardMode = gameState.mode === 'shared-card' && gameState.sharedCard != null;
```

`allPlayers.map()` 루프 바깥에서 1회 선언하여 효율적으로 재사용.

### 2. displayCards 로직 수정 (line 219-223)

```typescript
const displayCards = player.selectedCards?.length === 2
  ? player.selectedCards
  : isSharedCardMode && player.cards[0]
    ? [player.cards[0], gameState.sharedCard!]
    : player.cards;
```

- 세장섯다(selectedCards 2장): 기존 동작 유지
- 한장공유 모드: [본인카드, 공유카드] 2장 조합
- 그 외 모드: player.cards fallback

### 3. card-reveal phase 공유카드 자동 공개 (line 264-265)

```typescript
const isSharedCardAtIndex = isSharedCardMode && idx === 1;
const isCardRevealed = isSharedCardAtIndex || revealedIndices.includes(idx);
```

공유카드(index 1)는 `isSharedCardAtIndex = true`로 항상 앞면 표시, `canClick = false`로 클릭 차단.

## 검증

- TypeScript 컴파일: ResultScreen.tsx 관련 에러 없음 (기존 CutModal.tsx 오류는 이번 변경과 무관)
- 기존 모드(오리지날/세장섯다/인디언/후회)에 영향 없음 (selectedCards 우선 순위 및 fallback 유지)

## 플랜 대비 이탈 사항

없음 — 플랜 그대로 실행.

## Self-Check: PASSED

- 파일 존재 확인: packages/client/src/components/layout/ResultScreen.tsx - FOUND
- 커밋 존재 확인: f5d5aee - FOUND
