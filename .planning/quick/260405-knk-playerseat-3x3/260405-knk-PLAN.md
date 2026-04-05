---
phase: quick-260405-knk
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/game/PlayerSeat.tsx
  - packages/client/src/components/game/HwatuCard.tsx
  - packages/client/src/components/layout/GameTable.tsx
autonomous: true
must_haves:
  truths:
    - "데스크톱 PlayerSeat 박스가 이전 그리드 적용 전보다 더 크게 표시된다"
    - "모바일 PlayerSeat에 border/box 스타일이 적용된다"
    - "모바일에서 3x3 그리드 레이아웃으로 6명까지 배치 가능하다"
    - "PlayerSeat 내 폰트가 현재보다 커진다"
    - "PlayerSeat 내 카드 크기가 현재보다 작아진다"
  artifacts:
    - path: "packages/client/src/components/game/PlayerSeat.tsx"
      provides: "최적화된 PlayerSeat 컴포넌트"
    - path: "packages/client/src/components/game/HwatuCard.tsx"
      provides: "xxs 카드 사이즈 추가"
    - path: "packages/client/src/components/layout/GameTable.tsx"
      provides: "모바일 3x3 그리드 + 데스크톱 박스 크기 확대"
---

<objective>
PlayerSeat 박스 크기 최적화 — 데스크톱 그리드 박스 크기 확대 + 모바일 3x3 그리드 적용 + 폰트 확대 + 카드 축소

Purpose: 데스크톱에서 그리드 적용 후 줄어든 PlayerSeat 박스를 더 크게 복구하고, 모바일에서도 border/box 스타일 + 3x3 그리드로 6명 배치 최적화
Output: 수정된 PlayerSeat.tsx, HwatuCard.tsx, GameTable.tsx
</objective>

<context>
@packages/client/src/components/game/PlayerSeat.tsx
@packages/client/src/components/game/HwatuCard.tsx
@packages/client/src/components/layout/GameTable.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: HwatuCard xxs 사이즈 추가 + PlayerSeat 카드/폰트 크기 조정</name>
  <files>packages/client/src/components/game/HwatuCard.tsx, packages/client/src/components/game/PlayerSeat.tsx</files>
  <action>
1. HwatuCard.tsx — SIZE_MAP에 `xxs` 사이즈 추가:
   - `xxs: { width: 30, height: 49 }` (기존 xs: 40x65 대비 ~25% 축소)
   - size prop 타입에 `'xxs'` 추가: `size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg'`
   - default value도 타입 일치시키기

2. PlayerSeat.tsx — compact 모드(모바일) 폰트 크기 확대 + 카드 축소:
   - 닉네임 폰트: `text-[9px]` → `text-[11px]` (compact 모드)
   - [나] 태그 폰트: `text-[9px]` → `text-[11px]` (compact 모드)
   - 칩 금액 폰트: `text-[9px]` → `text-[11px]` (compact 모드)
   - compact 모드 카드 사이즈: `size={compact ? 'xs' : 'sm'}` → `size={compact ? 'xxs' : 'sm'}`
   - compact 모드 min-w 제거: `min-w-0` 유지 (3x3 그리드에서 자동 맞춤)

3. PlayerSeat.tsx — 데스크톱(non-compact) 박스 크기 확대:
   - `min-w-[7rem]` → `min-w-[9rem]` (데스크톱 박스 크기 복구/확대)
   - 데스크톱 패딩: `p-2` → `p-3` (내부 여백 확대)
  </action>
  <verify>
    <automated>cd /d/dev/sutda && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>HwatuCard에 xxs 사이즈 추가, compact 모드 폰트 11px로 확대, 카드 xxs로 축소, 데스크톱 min-w 9rem + p-3</done>
</task>

<task type="auto">
  <name>Task 2: 모바일 3x3 그리드 레이아웃 + border/box 스타일 적용</name>
  <files>packages/client/src/components/layout/GameTable.tsx</files>
  <action>
1. GameTable.tsx 모바일 섹션 — 기존 `grid grid-cols-2` → 3x3 그리드로 변경:
   - `grid grid-cols-2 gap-1 p-1` → `grid grid-cols-3 gap-1 p-1`
   - 이렇게 하면 6명이 3x2로 배치됨 (3열 2행)
   - 4명 이하일 때도 3열로 유지하되 자연스럽게 빈 셀 허용

2. 모바일 PlayerSeat에 게임모드 박스 border 스타일이 보이도록 확인:
   - PlayerSeat의 Card 컴포넌트가 이미 border를 가지고 있으므로 모바일에서도 동일하게 표시됨
   - compact 모드에서 Card className에 `border border-border/50` 명시 추가하여 게임 모드에서 박스가 확실히 보이도록 함
   - PlayerSeat.tsx Card에 compact일 때 추가 클래스: `compact && 'border border-border/50'`

3. 모바일 그리드 컨테이너 패딩 미세 조정:
   - `gap-1 p-1` → `gap-1.5 p-1.5` (약간의 여백 추가로 답답함 해소)
  </action>
  <verify>
    <automated>cd /d/dev/sutda && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>모바일이 3x3 그리드(grid-cols-3)로 변경, PlayerSeat compact 모드에 border 명시, 여백 조정 완료</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    - 데스크톱: PlayerSeat 박스 크기 확대 (min-w 9rem, p-3)
    - 모바일: 3열 그리드(grid-cols-3) + border/box 스타일 + 폰트 확대(11px) + 카드 축소(xxs)
  </what-built>
  <how-to-verify>
    1. `cd /d/dev/sutda && pnpm --filter client dev` 실행
    2. 데스크톱 브라우저에서 게임 테이블 확인 — PlayerSeat 박스가 이전보다 크게 표시되는지
    3. 모바일 뷰포트(DevTools 또는 실기기)에서 확인:
       - 6명 기준 3x2 그리드로 배치되는지
       - 각 PlayerSeat에 border/box가 보이는지
       - 폰트가 이전보다 크고, 카드가 이전보다 작은지
    4. 3명, 4명 등 소수 인원에서도 레이아웃 깨지지 않는지 확인
  </how-to-verify>
  <resume-signal>"approved" 또는 수정 필요사항 기술</resume-signal>
</task>

</tasks>

<verification>
- TypeScript 컴파일 에러 없음
- 데스크톱 PlayerSeat 박스 min-w-[9rem] + p-3 적용
- 모바일 grid-cols-3 적용, compact 모드 폰트 text-[11px], 카드 xxs 사이즈
- 모바일 PlayerSeat에 border 스타일 표시
</verification>

<success_criteria>
- 데스크톱에서 PlayerSeat 박스가 그리드 적용 전보다 더 크게 표시
- 모바일에서 3x3 그리드로 6명까지 배치 가능
- 모바일 PlayerSeat에 border/box가 명확히 보임
- 폰트 확대, 카드 축소가 적용됨
- TypeScript 빌드 성공
</success_criteria>

<output>
완료 후 `.planning/quick/260405-knk-playerseat-3x3/260405-knk-SUMMARY.md` 작성
</output>
