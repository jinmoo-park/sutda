---
phase: quick-260404-vct-sfx
plan: 01
subsystem: client-game-ui, server-game-engine
tags: [bug-fix, sejang, shared-card, sfx, mobile, gusa-rematch]
key-files:
  modified:
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/modals/SharedCardSelectModal.tsx
    - packages/server/src/game-engine.ts
decisions:
  - "PlayerSeat 세장섯다 공개카드 정렬: HandPanel의 renderOrder 패턴을 그대로 적용 — openedCardIndex 카드를 맨앞으로 재배치 후 나머지 인덱스를 순서대로 배치"
  - "한장공유 SFX getHandCards: shared-card 모드에서 player.cards[0] + gameState.sharedCard 조합으로 2장 반환 — evaluateHand 정상 실행"
  - "구사 재경기 mode 강제: _startGusaRematch()에서 this.state.mode = 'original' 명시 설정 — 어떤 모드에서 진입해도 오리지날로 전환"
metrics:
  completed_date: "2026-04-04"
  tasks: 4
  files: 4
---

# Quick Task 260404-vct: 버그 4건 일괄 수정 요약

**한 줄 요약:** 세장섯다 공개카드 GameTable 정렬 + 한장공유 SFX 공유카드 포함 족보 판별 + 공유카드 선택 모달 모바일 최적화 + 구사 재경기 오리지날 모드 강제 설정

## 완료된 태스크

| 태스크 | 설명 | 커밋 |
|--------|------|------|
| Task 1 | 세장섯다 PlayerSeat 공개카드 맨앞 정렬 | 28b1892 |
| Task 2 | 한장공유 ResultScreen SFX 공유카드 포함 족보 판별 | 28b1892 |
| Task 3 | SharedCardSelectModal 모바일 크기 최적화 | 28b1892 |
| Task 4 | game-engine.ts 구사 재경기 mode='original' 강제 | 28b1892 |

## 수정 내용 상세

### Task 1: 세장섯다 PlayerSeat 공개카드 맨앞 정렬

**파일:** `packages/client/src/components/game/PlayerSeat.tsx`

`Array.from({ length: maxSlots }, ...)` 방식에서 `renderOrder.map((origIdx, renderPos) => ...)` 방식으로 변경. HandPanel의 패턴과 동일:
```typescript
const isThreeCardWithOpened = mode === 'three-card' && player.openedCardIndex !== undefined;
const renderOrder: number[] = isThreeCardWithOpened
  ? [player.openedCardIndex!, ...[...Array(maxSlots).keys()].filter(i => i !== player.openedCardIndex!)]
  : [...Array(maxSlots).keys()];
```
z-index도 `renderPos` 기준으로 변경하여 맨앞 공개카드가 z-30을 받음.

### Task 2: 한장공유 ResultScreen SFX 공유카드 포함 족보 판별

**파일:** `packages/client/src/components/layout/ResultScreen.tsx`

`getHandCards` 함수에 shared-card 모드 분기 추가:
```typescript
if (gameState.mode === 'shared-card' && gameState.sharedCard && player.cards[0]) {
  return [player.cards[0], gameState.sharedCard];
}
```
이제 한장공유 모드에서 승자/패자 모두 정확한 족보 기반 SFX가 재생됨 (win-ddaeng, lose-ddaeng-but-lost, win-ddaeng-loser 등).

### Task 3: SharedCardSelectModal 모바일 크기 최적화

**파일:** `packages/client/src/components/modals/SharedCardSelectModal.tsx`

- `useSyncExternalStore` 기반 `useIsMd()` 훅 추가
- `DialogContent`에 `className="max-h-[85vh] overflow-y-auto p-3 md:p-6"` 추가
- 카드 그리드 gap: `gap-1 md:gap-2` (모바일 gap 축소)
- 딜러 카드: `size={isMd ? 'lg' : 'md'}`, 비딜러 카드: `size={isMd ? 'sm' : 'xs'}`

### Task 4: 구사 재경기 mode='original' 강제

**파일:** `packages/server/src/game-engine.ts`

`_startGusaRematch()` 메서드의 `// mode 유지` 주석 위치에 `this.state.mode = 'original'` 추가:
```typescript
// 구사 재경기는 무조건 오리지날 모드로 진행 (단, 기리 없음 = skipCutting=true)
this.state.mode = 'original';
```

## 플랜 대비 이탈 사항

없음 — 플랜 그대로 실행.

## 검증

- 서버 타입체크: 통과 (`npx tsc --noEmit -p packages/server/tsconfig.json`)
- 클라이언트 타입체크: CutModal.tsx의 기존 pre-existing 에러(GiriPhase) 1건만 존재, 이번 수정과 무관

## Self-Check: PASSED

- 수정 파일 4개 모두 존재 확인
- 커밋 28b1892 존재 확인
