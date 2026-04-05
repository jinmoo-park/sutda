---
phase: quick
plan: 260405-jug
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/layout/GameTable.tsx
  - packages/client/src/components/layout/WaitingTable.tsx
  - packages/client/src/components/layout/BettingPanel.tsx
  - packages/client/src/hooks/useBgmPlayer.ts
  - packages/client/src/index.css
autonomous: true
must_haves:
  truths:
    - "그리드 외곽마진이 올바른 wrapper에 적용되어 있다"
    - "링크복사가 fallback으로 정상 동작한다"
    - "빅팟 오버레이가 pulse 애니메이션으로 깜빡인다"
    - "pot >= 20000일 때 빅팟 BGM으로 전환된다"
    - "판돈 카드가 확대되어 표시된다"
    - "게임모드가 Badge 컴포넌트로 표시된다"
    - "내 차례 시 베팅패널 글로우가 pulse한다"
  artifacts:
    - path: "packages/client/src/components/layout/GameTable.tsx"
      provides: "그리드마진수정, 빅팟pulse, 판돈확대, 모드Badge, 빅팟BGM useEffect"
    - path: "packages/client/src/index.css"
      provides: "bigpot-pulse, betting-pulse keyframes"
    - path: "packages/client/src/hooks/useBgmPlayer.ts"
      provides: "setBigPot 함수"
---

<objective>
게임테이블 UI 버그 수정 및 개선 7종 일괄 적용.

Purpose: 그리드마진 위치수정, 링크복사 fallback, 빅팟 pulse 애니메이션, 빅팟 BGM 전환, 판돈카드 확대, 모드 Badge, 베팅패널 글로우 pulse
Output: 수정된 5개 파일
</objective>

<execution_context>
@.claude/get-shit-done/workflows/execute-plan.md
@.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/client/src/components/layout/GameTable.tsx
@packages/client/src/components/layout/WaitingTable.tsx
@packages/client/src/components/layout/BettingPanel.tsx
@packages/client/src/hooks/useBgmPlayer.ts
@packages/client/src/index.css
@packages/client/src/components/ui/badge.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: CSS keyframes + useBgmPlayer setBigPot + WaitingTable 링크복사 fallback</name>
  <files>packages/client/src/index.css, packages/client/src/hooks/useBgmPlayer.ts, packages/client/src/components/layout/WaitingTable.tsx</files>
  <action>
**1) index.css에 2개 keyframes 추가 (파일 끝에):**

```css
@keyframes bigpot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes betting-pulse {
  0%, 100% { box-shadow: 0 0 28px 8px hsl(75 55% 42% / 0.7); }
  50% { box-shadow: 0 0 14px 4px hsl(75 55% 42% / 0.3); }
}
```

참고: `hsl(var(--primary)/0.7)` 대신 primary 색상값 `hsl(75 55% 42%)` 직접 사용 — @keyframes 내부에서 CSS 변수 참조가 불안정할 수 있음.

**2) useBgmPlayer.ts에 빅팟 BGM 싱글톤 + setBigPot 함수 추가:**

모듈 레벨에 `_bigpotAudio: HTMLAudioElement | null = null`과 `_isBigPotActive = false` 추가.

`setBigPot(active: boolean)` 함수를 모듈 레벨에 export:
- `active === _isBigPotActive`이면 return (중복 호출 방지)
- `_isBigPotActive = active` 업데이트
- muted 체크: `localStorage.getItem('sutda_bgm_muted') === 'true'`이면 return
- `active = true`: `_audio?.pause()`, bigpot audio가 없으면 생성 (`new Audio('/sfx/bgm_bigpot.mp3')`, loop=true, volume=0.1), `_bigpotAudio.play().catch(() => {})`
- `active = false`: `_bigpotAudio?.pause()`, `_audio?.play().catch(() => {})`

useBgmPlayer 훅의 toggleMute에서 bigpot 상태도 존중:
- mute 시: `_bigpotAudio?.pause()` 추가
- unmute 시: `_isBigPotActive`이면 `_bigpotAudio?.play()` 대신 main BGM 재생하지 않고 bigpot BGM 재생

stopBgm에서도 `_bigpotAudio?.pause()` 추가.
startBgm에서 `_isBigPotActive`면 bigpot BGM 재생, 아니면 main BGM 재생.

반환값에 `setBigPot` 추가.

**3) WaitingTable.tsx handleCopyUrl 수정:**

`navigator.clipboard.writeText(url)` catch 블록에서 fallback 구현:
```ts
.catch(() => {
  // fallback: 임시 input 생성 + execCommand
  const input = document.createElement('input');
  input.value = url;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})
```
fallback 후에도 토스트/알림이 정상 표시되도록 `.then()` 체인 유지.
  </action>
  <verify>
    <automated>cd D:/dev/sutda && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - index.css에 bigpot-pulse, betting-pulse keyframes 존재
    - useBgmPlayer.ts에서 setBigPot export, bigpot audio 싱글톤 관리
    - WaitingTable.tsx handleCopyUrl에 clipboard fallback 존재
    - TypeScript 컴파일 에러 없음
  </done>
</task>

<task type="auto">
  <name>Task 2: GameTable UI 수정 4종 + BettingPanel 글로우 pulse</name>
  <files>packages/client/src/components/layout/GameTable.tsx, packages/client/src/components/layout/BettingPanel.tsx</files>
  <action>
**1) GameTable.tsx 그리드 외곽마진 위치 수정:**
- 3x3 그리드 div에서 `px-8` 클래스 제거
- 그리드의 부모 wrapper (absolute inset-0 내부, z-[5] 그리드를 감싸는 div)에 `px-6` 추가
- 부모 wrapper가 없으면 그리드 div를 `<div className="px-6 h-full">` 로 감싸기

**2) GameTable.tsx 판돈 카드 크기 확대 (셀5, row2/col2):**
- 판돈 카드 div: `px-5 py-3` -> `px-8 py-5`
- 판돈 금액: `text-[26px]` -> `text-[36px]`
- "판돈" 레이블: `text-xs` -> `text-sm`

**3) GameTable.tsx 게임모드 Badge 컴포넌트:**
- `import { Badge } from '@/components/ui/badge'` 추가
- 기존 `<p className="text-[10px] text-primary font-medium tracking-wider">{MODE_LABELS[mode] ?? mode}</p>` 를
  `<Badge variant="outline" className="border-primary text-primary text-[10px]">{MODE_LABELS[mode] ?? mode}</Badge>` 로 교체

**4) GameTable.tsx 빅팟 오버레이 pulse 애니메이션:**
- 빅팟 오버레이 div에 `style` 속성에 `animation: 'bigpot-pulse 2s ease-in-out infinite'` 추가

**5) GameTable.tsx 빅팟 BGM useEffect:**
- useBgmPlayer에서 `setBigPot` 추가 import
- `const { setBigPot, ... } = useBgmPlayer();` (이미 사용 중이라면 setBigPot만 추가)
- pot 변화 감지 useEffect 추가:
```tsx
useEffect(() => {
  setBigPot(pot >= 20000);
}, [pot, setBigPot]);
```
- 컴포넌트 언마운트 시 cleanup: useEffect return에서 `setBigPot(false)` 호출

**6) BettingPanel.tsx 내 차례 글로우 pulse:**
- `isMyTurn && !isMyAllIn` 조건 블록의 className에서 기존 `shadow-[0_0_28px_8px_hsl(var(--primary)/0.7)]` 유지
- 동일 조건으로 outer div의 style에 `animation: 'betting-pulse 1.5s ease-in-out infinite'` 추가
- `isMyTurn && !isMyAllIn`이 false면 animation 없음 (기본값)
- 조건부 style 적용 예시: `style={isMyTurn && !isMyAllIn ? { animation: 'betting-pulse 1.5s ease-in-out infinite' } : undefined}`
  </action>
  <verify>
    <automated>cd D:/dev/sutda && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    - 그리드 div에 px-8 없고, 부모 wrapper에 px-6 적용
    - 판돈 카드 패딩/폰트 확대 적용
    - 게임모드가 Badge variant="outline" 으로 표시
    - 빅팟 오버레이에 bigpot-pulse 애니메이션 적용
    - pot >= 20000 시 setBigPot(true) 호출하는 useEffect 존재
    - BettingPanel isMyTurn 시 betting-pulse 애니메이션 적용
    - TypeScript 컴파일 에러 없음
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit --project packages/client/tsconfig.json` 에러 없음
2. `pnpm --filter client build` 성공
</verification>

<success_criteria>
- 7가지 UI 수정/개선 항목 모두 적용
- 빌드 에러 없음
</success_criteria>

<output>
완료 후 `.planning/quick/260405-jug-ui-7-pulse-bgm/260405-jug-SUMMARY.md` 생성
</output>
