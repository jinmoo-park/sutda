---
phase: quick
plan: 260405-s6a
subsystem: client-sfx
tags: [sfx, result-screen, one-rank-apart]
tech-stack:
  added: []
  patterns: [isOneRankApart 헬퍼, SCORE_RANK_ORDER 배열]
key-files:
  modified:
    - packages/client/src/components/layout/ResultScreen.tsx
decisions:
  - winnerCardsVisible/winnerHandCards 변수를 iAmWinner 분기 상위로 이동하여 승자/패자 양쪽에서 재사용
metrics:
  duration: ~10분
  completed: 2026-04-05
  tasks_completed: 1
  files_modified: 1
---

# Quick 260405-s6a: isOneRankApart 로직 복원 요약

**한 줄 요약:** a6bb668 UI 리팩토링으로 삭제된 `SCORE_RANK_ORDER` + `isOneRankApart()` 로직을 ResultScreen.tsx에 복원하여 족보 한 단계 차이 패배 시 승자/패자 모두에게 `lose-ddaeng-but-lost` SFX 재생

## 완료된 작업

### Task 1: ResultScreen.tsx에 isOneRankApart 로직 복원
**커밋:** `5eb3299`

**변경 내용:**

1. 파일 상단(mdQuery 선언 위)에 `SCORE_RANK_ORDER` 배열과 `isOneRankApart()` 헬퍼 함수 추가
2. `winnerCardsVisible` / `winnerHandCards` 변수를 `iAmWinner` 분기 상위로 이동 (승자/패자 모두 참조 가능)
3. 승자 분기 끝에: 살아있는 패자 중 최고 score와 한 단계 차이이면 `play('lose-ddaeng-but-lost')` 추가 재생
4. 패자 분기 끝에: 승자 카드 공개 상태에서 승자 score와 한 단계 차이 + ttaeng 패배 아닐 때 `play('lose-ddaeng-but-lost')` 추가 재생 (hasDdaengPenalty 및 isDdaeng으로 중복 방지)

## 검증

- TypeScript 컴파일: ResultScreen.tsx 관련 에러 없음 (CutModal.tsx의 기존 에러는 범위 외)
- 오리지날 모드: `winnerCardsVisible = winner?.isRevealed` 로직 그대로 유지
- 인디언섯다/세장섯다/골라골라 모드: `winnerCardsVisible = !!winner` 로 result phase 자동 공개 처리

## 계획 대비 편차

없음 — 계획 그대로 실행됨.

## Self-Check: PASSED

- `packages/client/src/components/layout/ResultScreen.tsx` — 수정 확인
- 커밋 `5eb3299` — 존재 확인
