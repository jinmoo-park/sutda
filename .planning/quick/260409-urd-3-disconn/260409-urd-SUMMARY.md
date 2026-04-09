---
phase: quick-260409-urd
plan: 01
subsystem: client-ui, server-game-engine
tags: [bugfix, ui, disconnect, allin, sideport]
tech-stack:
  patterns: [KST 시간 계산, phase-based disconnect guard, totalCommitted 보존]
key-files:
  modified:
    - packages/client/src/components/modals/DealerSelectModal.tsx
    - packages/client/src/components/modals/DealerResultOverlay.tsx
    - packages/server/src/game-engine.ts
decisions:
  - totalCommitted를 재경기 시작 시 리셋하지 않고 이전 라운드 기여분 보존
  - forceDisconnectedPlayerAction에서 isAlive 체크 이전에 비베팅 phase 처리
  - gusa-pending에서 disconnect 플레이어는 join=false로 자동 처리
metrics:
  duration: ~25min
  completed: 2026-04-09
  tasks: 3
  files: 3
---

# Phase quick-260409-urd Plan 01: 3-disconn SUMMARY

**한 줄 요약:** 밤일낮장 KST 시간기반 강조 UI + 올인 재경기 사이드팟 totalCommitted 보존 + 비베팅 phase disconnect 게임 자동 속행

## 완료된 태스크

| # | 태스크 | 커밋 | 변경 파일 |
|---|--------|------|-----------|
| 1 | 밤일낮장 시간기반 강조 + 뱃지 제거 | bae44b4 | DealerSelectModal.tsx, DealerResultOverlay.tsx |
| 2 | 올인 재경기 사이드팟 버그 수정 | 738f737 | game-engine.ts |
| 3 | 비베팅 phase disconnect 자동 속행 | c38f517 | game-engine.ts |

## 태스크별 상세

### Task 1: 밤일낮장 시간기반 강조 + DealerResultOverlay 뱃지 제거

**DealerSelectModal.tsx:**
- `kstHour = (new Date().getUTCHours() + 9) % 24` 계산 추가
- `isNightTime = kstHour >= 18 || kstHour < 6` 플래그
- 타이틀을 JSX span으로 분리: 야간 → `밤일` amber-400 강조, 주간 → `낮장` blue-400 강조

**DealerResultOverlay.tsx:**
- 동일한 KST 시간 계산 및 타이틀 강조 적용
- `isNight`, `dayNightLabel`, `badgeColor` 변수 및 뱃지 `<span>` 렌더링 완전 제거
- 결과 행에 카드 + 닉네임만 표시

### Task 2: 올인 재경기 사이드팟 버그 수정

**문제:** `_startTieRematch`와 `_startGusaRematch` 모두 `p.totalCommitted = 0` 리셋으로 인해
`settleChipsWithAllIn`의 레벨 계산이 재경기 후 0부터 다시 시작되어 올인 플레이어가 전체 pot을 수령하는 버그.

**수정:** 두 함수 모두 `p.totalCommitted = 0` 줄 제거. `p.isAllIn = false`는 유지 (베팅 스킵 방지).
이전 라운드 기여분이 보존되어 사이드팟 레벨 계산 정확.

### Task 3: 비베팅 phase disconnect 게임 자동 속행

**forceDisconnectedPlayerAction에 추가된 phase 처리:**

| Phase | 처리 로직 |
|-------|-----------|
| `dealer-select` | disconnect 제외 후 나머지가 모두 선택 완료 시 `_resolveDealer()` 호출 |
| `mode-select` | 선(dealer) disconnect 시 `selectMode(playerId, 'original')` 자동 호출 |
| `shared-card-select` | 선 disconnect 시 랜덤 cardIndex로 `setSharedCard` 자동 호출 |
| `gusa-pending` | 미결정 disconnect 플레이어를 `false`로 처리, 전원 완료 시 `_startGusaRematch()` |
| `gusa-announce` | 선 disconnect 시 즉시 `_startGusaRematch()` |
| `attend-school` | 미등교 disconnect 플레이어 `attendSchool()` 자동 호출 |

**forcePlayerLeave에 추가:**
- `attend-school` phase: 미등교 플레이어 `attendSchool()` 자동 처리 후 퇴장

모든 비베팅 phase 처리는 `isAlive` 체크(기존 `return`) 이전에 실행되며, `try/catch`로 감싸 예외가 전파되지 않음.

## 검증

- `pnpm --filter client build` — 빌드 성공 (경고 없음)
- `pnpm --filter server build` — 빌드 성공 (타입 에러 없음)

## 계획 대비 이탈 사항

없음 — 플랜 그대로 실행됨.

## Self-Check: PASSED

- bae44b4 커밋 확인: DealerSelectModal.tsx, DealerResultOverlay.tsx 수정
- 738f737 커밋 확인: game-engine.ts totalCommitted 리셋 제거 (_startTieRematch, _startGusaRematch)
- c38f517 커밋 확인: game-engine.ts forceDisconnectedPlayerAction/forcePlayerLeave 비베팅 phase 처리 추가
