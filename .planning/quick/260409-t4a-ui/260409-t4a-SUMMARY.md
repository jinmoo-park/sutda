---
phase: 260409-t4a-ui
plan: 01
subsystem: client-ui, server-game-engine
tags: [ui, bug-fix, modal, grid-layout, allin, rematch]
key-files:
  modified:
    - packages/client/src/components/modals/DealerSelectModal.tsx
    - packages/client/src/components/modals/DealerResultOverlay.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/server/src/game-engine.ts
decisions:
  - "밤일낮장 배지를 닉네임 아래에 항상 표시, '선 결정!' 텍스트 제거"
  - "반시계 정렬: opponents 배열을 seatIndex 감소 방향으로 수집 후 getOpponentCells도 맞춰 재정렬"
  - "기존 테스트 36개 실패는 변경 전부터 존재하던 기존 실패 — 내 변경과 무관함을 git stash로 확인"
metrics:
  duration: "약 15분"
  completed: "2026-04-09"
  tasks: 3
  files: 4
---

# Phase 260409-t4a Plan 01: 밤일낮장 UI 개선 + 반시계 그리드 + 올인 재경기 버그 수정 Summary

**한 줄 요약:** 밤일낮장 모달 제목·배지 UI 개선, 그리드 seatIndex 반시계 정렬, 재경기 isAllIn/totalCommitted 리셋 누락 버그 수정

---

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 주요 파일 |
|--------|------|------|-----------|
| 1 | 밤일낮장 모달 UI 개선 | dcd084d | DealerSelectModal.tsx, DealerResultOverlay.tsx |
| 2 | 그리드 자리배치 반시계 정렬 | 0a29944 | GameTable.tsx |
| 3 | 재경기 isAllIn 리셋 버그 수정 | 6f7a034 | game-engine.ts |

---

## 태스크별 변경 내용

### Task 1: 밤일낮장 모달 UI 개선

**DealerSelectModal.tsx**
- 제목 `'선 결정 — 카드를 선택하세요'` → `'밤일낮장 — 카드를 선택하세요'`

**DealerResultOverlay.tsx**
- 제목 `'선 결정 결과'` → `'밤일낮장 결과'`
- 각 결과 행에 카드 `month` 기준 배지 추가:
  - `month <= 10` → 밤일 배지 (amber)
  - `month >= 11` → 낮장 배지 (blue)
- `'선 결정!'` 텍스트 제거, 배지로 대체

### Task 2: 그리드 자리배치 반시계 정렬

**GameTable.tsx**
- `opponents` 배열을 내 `seatIndex` 기준 반시계 방향(1씩 감소)으로 재수집
- `getOpponentCells` 반환값 변경:
  - 1명: `[2]` (유지)
  - 2명: `[1,3]` → `[3,1]` (내 다음 베팅자가 오른쪽 셀3)
  - 3명: `[1,2,3]` → `[3,2,1]`
  - 4명: `[1,3,4,6]` → `[6,3,1,4]`
  - 5명: `[1,2,3,4,6]` → `[6,3,2,1,4]`

### Task 3: 재경기 isAllIn 리셋 버그 수정

**game-engine.ts**
- `_startTieRematch()`: `p.isAllIn = false`, `p.totalCommitted = 0` 추가
- `_startGusaRematch()`: `p.isAllIn = false`, `p.totalCommitted = 0` 추가
- 기존 올인 상태가 재경기에 이월되어 베팅 단계가 즉시 종료되던 버그 수정

---

## 검증 결과

- 클라이언트 빌드: `✓ built in 5.35s` (TypeScript 오류 없음)
- 서버 테스트: 기존 36개 실패는 변경 전부터 존재 (git stash로 확인). 내 변경으로 인한 추가 실패 없음.

---

## 계획 대비 편차

없음 — 플랜대로 정확히 실행됨.

---

## Self-Check: PASSED

- [x] dcd084d 커밋 존재
- [x] 0a29944 커밋 존재
- [x] 6f7a034 커밋 존재
- [x] DealerSelectModal.tsx, DealerResultOverlay.tsx, GameTable.tsx, game-engine.ts 수정 완료
