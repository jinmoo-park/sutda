---
phase: quick-260404-tgm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/game/PlayerSeat.tsx
  - packages/client/src/pages/RoomPage.tsx
  - packages/client/src/components/layout/HandPanel.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "세장섯다 모드에서 3번째 카드를 받은 후 GameTable의 PlayerSeat에 카드 3장이 모두 표시된다"
    - "세장섯다 모드에서 내 HandPanel에서 공개 결정한 카드(openedCardIndex)가 맨 앞에 위치하고 시각적으로 구분된다"
  artifacts:
    - path: "packages/client/src/components/game/PlayerSeat.tsx"
      provides: "세장섯다 3장 카드 표시 + 겹침 레이아웃 + 공개 카드 시각 구분"
    - path: "packages/client/src/pages/RoomPage.tsx"
      provides: "세장섯다 betting-2/card-select 진입 시 visibleCardCounts 3으로 업데이트"
    - path: "packages/client/src/components/layout/HandPanel.tsx"
      provides: "공개 카드(openedCardIndex) 맨 앞 정렬 + 밝기/테두리 시각 구분"
  key_links:
    - from: "RoomPage.tsx"
      to: "GameTable → PlayerSeat"
      via: "visibleCardCounts prop"
      pattern: "visibleCardCounts.*3"
---

<objective>
세장섯다 모드 카드 표시 버그 2종 수정

1. GameTable PlayerSeat: 3장째를 받았는데 2장만 보이는 문제 수정
2. HandPanel: 공개 결정한 카드(openedCardIndex)를 맨 앞에 배치하고 밝기 차이 + 테두리 색으로 공개 상태 시각 구분

Purpose: 세장섯다 모드의 핵심 게임 정보 가시성 확보
Output: 수정된 PlayerSeat, HandPanel, RoomPage
</objective>

<execution_context>
@.planning/STATE.md
</execution_context>

<context>
@packages/client/src/components/game/PlayerSeat.tsx
@packages/client/src/components/layout/HandPanel.tsx
@packages/client/src/pages/RoomPage.tsx
@packages/shared/src/types/game.ts

<interfaces>
<!-- PlayerState에서 세장섯다 관련 필드 -->
```typescript
interface PlayerState {
  cards: (Card | null)[];
  selectedCards?: Card[];         // 세장섯다: 3장 중 선택한 2장
  openedCardIndex?: 0 | 1;       // 세장섯다: 최초 2장 중 오픈한 카드 인덱스
}
```

<!-- PlayerSeat의 showCount 로직 (현재 버그) -->
```typescript
// PlayerSeat.tsx line 44
const showCount = visibleCardCount ?? 2;  // 세장섯다에서 3장째가 opacity-0으로 숨겨짐

// maxSlots는 cards.length 기반으로 정상 (3장이면 3 슬롯)
const maxSlots = mode === 'shared-card'
  ? Math.max(player.cards.length, 1)
  : Math.max(player.cards.length, 2);
```

<!-- RoomPage visibleCardCounts 업데이트 로직 -->
```typescript
// 딜링 애니메이션 cardRounds = 2 (세장섯다도 2라운드만)
// → visibleCardCounts가 최대 2까지만 설정됨
// betting-2/card-select 전환 시 3으로 업데이트하는 로직 없음

// HandPanel에는 별도 처리 있음:
visibleCardCount={
  phase === 'card-select' || (phase === 'betting-2' && gameState.mode === 'three-card')
    ? (myPlayer?.cards.length ?? 0)  // 3장 정상 전달
    : ...
}
// 하지만 GameTable의 visibleCardCounts는 업데이트 안 됨
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: GameTable PlayerSeat 세장섯다 3장 표시 + RoomPage visibleCardCounts 업데이트</name>
  <files>packages/client/src/pages/RoomPage.tsx, packages/client/src/components/game/PlayerSeat.tsx</files>
  <action>
**RoomPage.tsx — 세장섯다 betting-2/card-select 진입 시 visibleCardCounts를 3으로 업데이트:**

`gameState?.phase` useEffect (line 233 근처)에서 세장섯다 betting-2 전환 감지 추가:

```typescript
// 기존 인디언 모드 betting-2 처리 블록 아래에 추가
// 세장섯다: card-select/betting-2 진입 시 3장 모두 표시되도록 visibleCardCounts 업데이트
if ((prevPhaseRef.current === 'betting-1' || prevPhaseRef.current === 'card-select') && 
    (gameState?.phase === 'card-select' || gameState?.phase === 'betting-2')) {
  if (gameState.mode === 'three-card') {
    const counts: Record<string, number> = {};
    gameState.players.forEach(p => { counts[p.id] = 3; });
    setVisibleCardCounts(counts);
  }
}
```

**PlayerSeat.tsx — 세장섯다 3장 카드 겹침 레이아웃:**

카드 컨테이너(`div className="flex gap-1 flex-wrap"`, line 111)에서 세장섯다 3장일 때 카드가 약간 겹치도록 수정:

- mode === 'three-card'이고 maxSlots >= 3일 때, gap을 줄이고 negative margin 적용:
  ```
  <div className={cn("flex flex-wrap", mode === 'three-card' && maxSlots >= 3 ? '-space-x-2' : 'gap-1')}>
  ```
- 각 카드 아이템에 `relative` + `z-index` 부여하여 뒤 카드가 앞 카드 위에 살짝 겹침

- 세장섯다에서 `openedCardIndex`에 해당하는 카드에 밝기/테두리 시각 구분 추가:
  - `isOpenedCard`가 true인 카드: `ring-2 ring-amber-400` 테두리 + 약간 밝게
  - 나머지 카드: 기본 상태 (상대방 카드는 뒷면이므로 구분 불필요)
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx tsc --noEmit -p packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>세장섯다 모드에서 GameTable PlayerSeat에 3장 카드가 모두 표시되고, 공개 카드에 amber 테두리가 적용된다</done>
</task>

<task type="auto">
  <name>Task 2: HandPanel 세장섯다 공개 카드 맨앞 정렬 + 시각 구분</name>
  <files>packages/client/src/components/layout/HandPanel.tsx</files>
  <action>
**HandPanel.tsx — 세장섯다 모드에서 공개 카드(openedCardIndex) 시각 구분:**

현재 HandPanel은 `cards` 배열을 순서대로 렌더링한다. 세장섯다에서 `myPlayer.openedCardIndex`가 설정된 경우:

1. **카드 렌더링 순서 변경**: openedCardIndex에 해당하는 카드를 배열 맨 앞으로 이동
   - `cards` 배열을 재정렬하는 로직 추가 (렌더링용 인덱스 매핑 필요)
   - `mode === 'three-card' && myPlayer?.openedCardIndex !== undefined` 조건
   - 원본 인덱스 추적을 위해 `cardIndices` 배열 생성: `[openedCardIndex, ...나머지]`
   - flip/click 핸들러에서 원본 인덱스 사용

2. **공개 카드 시각 구분**:
   - 공개 카드(openedCardIndex): `ring-2 ring-amber-400 brightness-110` + "공개" 라벨 배지
   - 비공개 카드: 약간 어둡게 `brightness-75 opacity-80`
   - 이 구분은 `sejang-open` 이후 phase (betting-1, card-select, betting-2)에서 적용

3. 구현 방법:
   - cards.map 부분(line 177) 전에 정렬된 인덱스 배열 계산:
     ```typescript
     const isThreeCardWithOpened = mode === 'three-card' && myPlayer?.openedCardIndex !== undefined;
     const cardRenderOrder = isThreeCardWithOpened
       ? [myPlayer!.openedCardIndex!, ...cards.keys()].filter((v, i, a) => a.indexOf(v) === i)  
       : [...cards.keys()];
     ```
   - map을 `cardRenderOrder.map(origIdx => ...)` 로 변경
   - origIdx === myPlayer?.openedCardIndex인 카드에 시각 구분 스타일 적용
   - 공개 카드 아래에 작은 "공개" Badge 표시 (`<Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400 text-amber-400">공개</Badge>`)
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx tsc --noEmit -p packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>세장섯다 모드에서 HandPanel의 공개 카드가 맨 앞에 위치하고, amber 테두리 + 밝기 차이 + "공개" 배지로 시각적으로 구분된다</done>
</task>

</tasks>

<verification>
1. TypeScript 컴파일 에러 없음
2. 세장섯다 모드 진행 시 GameTable에서 3장 카드 모두 표시
3. HandPanel에서 공개 카드가 맨 앞에 위치하고 시각적으로 구분됨
</verification>

<success_criteria>
- 세장섯다 모드 betting-2 phase에서 GameTable PlayerSeat의 카드가 3장 모두 보임
- 공간 부족 시 카드가 약간 겹치는 레이아웃 적용
- HandPanel에서 openedCardIndex 카드가 맨 앞 순서, amber 테두리 + 밝기 차이로 공개 상태 인지 가능
- TypeScript 빌드 통과
</success_criteria>

<output>
완료 후 `.planning/quick/260404-tgm-sejang-3card-display-fix/260404-tgm-SUMMARY.md` 작성
</output>
