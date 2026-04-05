---
phase: quick-260405-miq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/layout/GameTable.tsx
  - packages/client/src/components/game/PlayerSeat.tsx
  - packages/client/src/components/layout/ResultScreen.tsx
autonomous: true
---

<objective>
모바일 게임테이블 레이아웃 4종 개선: 3x3 그리드 좌석 배치 + 판돈 중앙 이동 + 레이즈 텍스트 간소화 + 학교가기 버튼 조건부 텍스트

Purpose: 모바일 플레이 경험 개선 — 6인 플레이 시 좌석 겹침 해소, 판돈 정보 중앙 집중, 베팅 정보 간소화
Output: GameTable.tsx 모바일 섹션 3x3 그리드 리팩터링 + PlayerSeat 레이즈 텍스트 축소 + ResultScreen 버튼 텍스트 분기
</objective>

<context>
@packages/client/src/components/layout/GameTable.tsx
@packages/client/src/components/game/PlayerSeat.tsx
@packages/client/src/components/layout/ResultScreen.tsx
@packages/client/src/store/gameStore.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: 모바일 3x3 그리드 좌석 배치 + 판돈 중앙(5번 셀) 이동</name>
  <files>packages/client/src/components/layout/GameTable.tsx</files>
  <action>
GameTable.tsx 모바일 섹션(md:hidden)을 리팩터링한다.

**현재 구조 제거:** 기존 모바일 섹션의 `flex flex-col` + `grid grid-cols-3 gap-1` 플랫 배치를 제거하고, 데스크탑과 동일한 3x3 CSS Grid 명시적 배치로 교체한다.

**새 모바일 3x3 그리드 구조:**
```
셀1  셀2  셀3    ← row 1: 상대방
셀4  셀5  셀6    ← row 2: 셀4/6=상대방, 셀5=판돈+모드 정보
셀7  셀8  셀9    ← row 3: 셀7/9=상대방, 셀8=내 플레이어(isMe)
```

1. 모바일 섹션 내부에서 기존 "팟 한줄 요약" div(flex items-center justify-center gap-1.5 pt-2 pb-1...)와 shared-card 표시, 그리고 기존 grid grid-cols-3 div를 모두 제거한다.

2. 새 그리드 컨테이너 생성:
```tsx
<div
  className="relative z-10 h-full"
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '1fr 1fr 1fr',
  }}
>
```

3. `getMobileCells(opponentCount)` 헬퍼 함수를 새로 작성한다. 내 플레이어(isMe)는 항상 셀8(row3/col2)에 고정되므로 상대방만 배치한다:
   - 1명(2인): [2] (상단 중앙)
   - 2명(3인): [1, 3] (상단 좌우)
   - 3명(4인): [1, 3, 6] 또는 [1, 3, 4]
   - 4명(5인): [1, 3, 4, 6]
   - 5명(6인): [1, 2, 3, 7, 9] — 7,9는 내 양옆

4. 셀5(gridArea '2 / 2')에 판돈+모드 정보를 두 줄로 표시:
```tsx
<div className="flex flex-col items-center justify-center" style={{ gridArea: '2 / 2' }}>
  {mode && (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-primary text-primary bg-primary/10">
      {MODE_LABELS[mode] ?? mode}
    </span>
  )}
  <span className="font-semibold tabular-nums text-sm mt-0.5">{pot.toLocaleString()}원</span>
  {hasAllIn && <span className="text-[9px] text-muted-foreground">올인 포함</span>}
  {mode === 'shared-card' && sharedCard && (
    <div className="mt-1"><SharedCardDisplay card={sharedCard} /></div>
  )}
</div>
```

5. 내 플레이어(me)를 셀8(gridArea '3 / 2')에 배치:
```tsx
{me && (
  <div className="flex items-center justify-center" style={{ gridArea: '3 / 2' }}>
    <PlayerSeat ... isMe={true} compact />
  </div>
)}
```

6. 상대방 플레이어를 getMobileCells() 결과에 따라 각 셀에 배치. 기존 cellToGridArea() 함수를 재사용한다.

7. Observer 목록, 빅팟 오버레이, 내 차례 알림 등 기존 오버레이는 그대로 유지한다.
  </action>
  <verify>
    <automated>cd /d/dev/sutda && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - 모바일 3x3 그리드에서 내 플레이어가 항상 셀8(하단 중앙)에 위치
    - 인원수별 상대방이 올바른 셀에 배치 (2~6인)
    - 판돈+모드 정보가 셀5(중앙)에 두 줄로 표시
    - 6인 플레이 시 좌석 겹침 없음
  </done>
</task>

<task type="auto">
  <name>Task 2: 레이즈 베팅 텍스트 간소화 + 학교가기 버튼 조건부 텍스트</name>
  <files>packages/client/src/components/game/PlayerSeat.tsx, packages/client/src/components/layout/ResultScreen.tsx</files>
  <action>
**PlayerSeat.tsx 레이즈 텍스트 간소화:**

1. PlayerSeat.tsx의 레이즈 표시 부분(169~178행 부근)을 수정한다:
   - 기존: Badge "레이즈 +금액" + 별도 span "베팅금액 금액원"
   - 변경: Badge "레이즈 +금액" + span "금액원" (라벨 "베팅금액" 제거)
   - compact 모드에서 폰트를 한 단계 더 축소: `text-xs` -> `text-[10px]`

변경할 코드 (레이즈 분기):
```tsx
{player.lastBetAction.type === 'raise' && (
  <div className="flex flex-col gap-0.5">
    <Badge variant="outline" className={cn(
      "px-1 py-0 text-yellow-400 border-yellow-400 w-fit",
      compact ? "text-[10px]" : "text-xs"
    )}>
      레이즈{player.lastBetAction.amount ? ` +${player.lastBetAction.amount.toLocaleString()}원` : ''}
    </Badge>
    {player.currentBet > 0 && (
      <span className={cn(
        "tabular-nums text-yellow-400 font-semibold",
        compact ? "text-[10px]" : "text-xs"
      )}>
        {player.currentBet.toLocaleString()}원
      </span>
    )}
  </div>
)}
```
핵심: "베팅금액" 라벨 텍스트 완전 제거, compact일 때 text-[10px] 적용.

**ResultScreen.tsx 학교가기 버튼 조건부 텍스트:**

1. ResultScreen.tsx 384행 부근의 "학교 가기" 버튼을 찾는다.
2. `proxyBeneficiaryNicknames`는 이미 useGameStore에서 가져오고 있다(29행).
3. 현재 플레이어의 닉네임이 proxyBeneficiaryNicknames에 포함되어 있는지 확인하여 텍스트를 분기한다:

```tsx
// 내 닉네임 가져오기 (gameState.players에서 myPlayerId로 찾기)
const myNickname = gameState.players.find(p => p.id === myPlayerId)?.nickname;
const isProxyBeneficiary = myNickname ? proxyBeneficiaryNicknames.includes(myNickname) : false;
```

이 변수를 ResultScreen 컴포넌트 최상단(hasVotedNextRound 등과 함께)에 선언한다.

4. 버튼 텍스트 변경:
```tsx
<Button variant="secondary" onClick={() => { play('school-go'); handleNextRound(); }}>
  {isProxyBeneficiary ? '다음판으로' : '학교 가기'}
</Button>
```

즉, 누군가가 이미 나의 학교를 대신 가줬으면(proxyBeneficiaryNicknames에 내 닉네임 포함) "다음판으로"로 표시. 그렇지 않으면 기존 "학교 가기" 유지.
  </action>
  <verify>
    <automated>cd /d/dev/sutda && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - 레이즈 표시에서 "베팅금액" 라벨이 제거되고 금액만 표시
    - compact 모드에서 레이즈 텍스트가 text-[10px]로 축소
    - 대리출석 수혜자일 때 "학교 가기" 버튼이 "다음판으로"로 변경
    - 대리출석 미수혜자는 기존 "학교 가기" 텍스트 유지
  </done>
</task>

</tasks>

<verification>
1. TypeScript 컴파일 에러 없음
2. 모바일 뷰포트(< 768px)에서 3x3 그리드 배치 확인
3. 2~6인 인원별 좌석 배치가 올바른지 확인
4. 판돈+모드 정보가 중앙 셀에 표시되는지 확인
5. 레이즈 시 "베팅금액" 라벨 없이 금액만 표시되는지 확인
6. 대리출석 수혜자에게 "다음판으로" 텍스트 표시 확인
</verification>

<success_criteria>
- 모바일 3x3 그리드에서 내 플레이어 셀8 고정, 판돈 셀5 표시, 상대방 인원별 올바른 배치
- 레이즈 "베팅금액" 라벨 제거, compact 시 폰트 축소
- 학교가기 버튼이 proxyBeneficiaryNicknames 조건에 따라 텍스트 분기
</success_criteria>

<output>
완료 후 `.planning/quick/260405-miq-mobile-layout-fix/260405-miq-SUMMARY.md` 생성
</output>
