---
quick_id: 260404-pn6
title: SFX 버그 수정 2종 — card-reveal 즉시 정지 + win-ddaeng-loser
date: 2026-04-04
tasks_completed: 2
commits:
  - hash: 5a5aefa
    message: "fix(quick-pn6): Task 10 — card-reveal SFX 즉시 정지 기능 추가"
  - hash: 634a7df
    message: "fix(quick-pn6): Task 12 — win-ddaeng-loser SFX 추가"
files_modified:
  - packages/client/src/hooks/useSfxPlayer.ts
  - packages/client/src/pages/RoomPage.tsx
  - packages/client/src/components/layout/ResultScreen.tsx
---

# Quick Task 260404-pn6 요약

**한 줄 요약:** useSfxPlayer에 stop() 함수 추가로 card-reveal SFX 루프 방지, 패배자 화면에서 승자 땡패 시 win-ddaeng-loser SFX 추가 재생.

## 완료된 태스크

### Task 10: card-reveal SFX 즉시 정지 (커밋 5a5aefa)

**변경 파일:**
- `packages/client/src/hooks/useSfxPlayer.ts` — `stop(key: string)` 함수 추가 (pause + currentTime=0), return에 포함
- `packages/client/src/pages/RoomPage.tsx` — destructure에 `stop: stopSfx` 추가, card-reveal useEffect에 NEW_ROUND_PHASES 진입 시 `stopSfx('card-reveal')` 호출 추가

**정지 트리거 phase 목록:** `dealer-select`, `attend-school`, `mode-select`, `shuffling`

### Task 12: win-ddaeng-loser SFX (커밋 634a7df)

**변경 파일:**
- `packages/client/src/hooks/useSfxPlayer.ts` — SFX_MAP에 `win-ddaeng-loser: { file: 'win-ddaeng.mp3', volume: 0.3 }` 추가
- `packages/client/src/components/layout/ResultScreen.tsx` — 패배자 분기(else 블록) 끝에 winner.cards로 evaluateHand 평가 후 땡이면 `play('win-ddaeng-loser')` 추가

## 타입 검증

`pnpm --filter @sutda/client typecheck` 실행 결과: 새로 도입된 타입 에러 없음. 기존 pre-existing 에러(TS2307 @sutda/shared 미빌드, TS7006 implicit any)는 이번 작업과 무관한 기존 항목.

## 편차 사항

없음 — 계획대로 정확히 실행.

## 알려진 스텁

없음.

## Self-Check: PASSED

- `packages/client/src/hooks/useSfxPlayer.ts` — 존재함, stop() 함수 포함 확인
- `packages/client/src/pages/RoomPage.tsx` — stopSfx 구조분해, NEW_ROUND_PHASES 정지 로직 확인
- `packages/client/src/components/layout/ResultScreen.tsx` — win-ddaeng-loser play() 호출 확인
- 커밋 5a5aefa — 존재함
- 커밋 634a7df — 존재함
