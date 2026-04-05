---
phase: quick
plan: 260405-jug
subsystem: client-ui
tags: [ui, animation, bgm, css, game-table, betting-panel]
key-files:
  modified:
    - packages/client/src/index.css
    - packages/client/src/hooks/useBgmPlayer.ts
    - packages/client/src/components/layout/WaitingTable.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/components/layout/BettingPanel.tsx
decisions:
  - "@keyframes 내부에서 CSS 변수 대신 hsl() 리터럴 사용 — 브라우저 keyframe 내 CSS 변수 참조 불안정 방지"
  - "setBigPot을 모듈 레벨 named export로 분리 — 훅 인스턴스 없이 GameTable에서 직접 임포트 가능"
  - "WaitingTable clipboard fallback: catch 후 then 체인 유지 — 성공/실패 무관하게 setCopied 호출"
metrics:
  duration: ~30min
  completed: "2026-04-05"
  tasks: 2
  files: 5
---

# Phase quick Plan 260405-jug: UI 7종 pulse + BGM Summary

## 한 줄 요약

`bigpot-pulse` / `betting-pulse` CSS keyframe 애니메이션, 빅팟 BGM 싱글톤 전환(`setBigPot`), 판돈 카드 확대, 게임모드 Badge, WaitingTable 링크복사 fallback 7종 일괄 적용.

## 완료된 태스크

| # | 태스크 | 커밋 | 파일 |
|---|--------|------|------|
| 1 | CSS keyframes + useBgmPlayer setBigPot + WaitingTable fallback | 15bc6b5 | index.css, useBgmPlayer.ts, WaitingTable.tsx |
| 2 | GameTable UI 4종 + BettingPanel pulse | e56dc34 | GameTable.tsx, BettingPanel.tsx |

## 변경 상세

### Task 1

**index.css**
- `@keyframes bigpot-pulse` 추가: opacity 1→0.4→1, 2s 주기
- `@keyframes betting-pulse` 추가: box-shadow hsl(75 55% 42%) 강도 변화, 1.5s 주기
- CSS 변수 대신 `hsl(75 55% 42% / 0.7)` 리터럴 사용 (keyframe 안정성)

**useBgmPlayer.ts**
- 모듈 레벨 `_bigpotAudio`, `_isBigPotActive` 싱글톤 추가
- `export function setBigPot(active: boolean)` 추가: 중복 호출 방지, mute 상태 존중
- `toggleMute` — mute 시 bigpot도 정지, unmute 시 bigpot 활성 여부로 분기
- `stopBgm` / `startBgm` — bigpot audio 상태 반영
- 반환값에 `setBigPot` 포함

**WaitingTable.tsx**
- `handleCopyUrl`: `navigator.clipboard.writeText` 실패 시 임시 `<input>` + `execCommand('copy')` fallback
- `.catch().then()` 체인으로 토스트(`setCopied`) 항상 호출

### Task 2

**GameTable.tsx**
- `import { useEffect }` 및 `import { setBigPot } from '@/hooks/useBgmPlayer'` 추가
- 컴포넌트 상단 `useEffect`: `pot >= 20000` 시 `setBigPot(true)`, cleanup에서 `setBigPot(false)`
- 3x3 그리드 div: `className="relative z-[5] h-full"` → wrapper `<div className="relative z-[5] h-full px-6">` 추가, 내부 grid div는 `h-full`만 유지
- 판돈 카드: `px-5 py-3` → `px-8 py-5`, `text-[26px]` → `text-[36px]`, `text-xs` 레이블 → `text-sm`
- 게임모드: `<p className="text-[10px]...">` → `<Badge variant="outline" className="border-primary text-primary text-[10px] mb-1">`
- 빅팟 오버레이 (데스크톱/모바일): `animation: 'bigpot-pulse 2s ease-in-out infinite'` 추가

**BettingPanel.tsx**
- outer `<div>` `style` 속성: `isMyTurn && !isMyAllIn` 조건으로 `{ animation: 'betting-pulse 1.5s ease-in-out infinite' }` 적용

## Deviations from Plan

### 실행 환경 이슈 (자동 해결)

**[Rule 3 - 블로킹 이슈] 워크트리 working tree와 HEAD 불일치**
- **발견 시점:** Task 2 실행 중
- **문제:** `git reset --soft 2736eda` 이후 worktree의 실제 파일이 `2736eda` 커밋 내용(3x3 그리드)이 아닌 이전 원형 레이아웃 상태였음. `git diff HEAD`는 0으로 표시되어 발견이 지연됨
- **해결:** `git show 6ac3861:GameTable.tsx > GameTable.tsx` 로 올바른 3x3 그리드 버전 복원 후 변경 적용
- **영향:** 최종 결과물 동일, 커밋 히스토리에 `ab1fd36` (빈/구버전 포함 커밋) 1개 추가

## Known Stubs

없음.

## Threat Flags

없음 — 네트워크 엔드포인트, 인증 경로, 파일 접근 패턴 변경 없음.

## Self-Check: PASSED

- packages/client/src/index.css: FOUND
- packages/client/src/hooks/useBgmPlayer.ts: FOUND
- packages/client/src/components/layout/GameTable.tsx: FOUND
- packages/client/src/components/layout/BettingPanel.tsx: FOUND
- packages/client/src/components/layout/WaitingTable.tsx: FOUND
- 커밋 15bc6b5: FOUND
- 커밋 e56dc34: FOUND
