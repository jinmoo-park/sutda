---
phase: quick-260405-j4v
plan: 01
subsystem: client-ui
tags: [layout, css-grid, game-table, player-seat, big-pot-glow]
tech-stack:
  patterns: [CSS Grid 3x3, inset box-shadow glow, single-render-pass]
key-files:
  modified:
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/components/game/PlayerSeat.tsx
decisions:
  - "getOpponentCells()로 인원수별 셀 배치 분리 — switch 패턴, 셀1~9 매핑"
  - "내 플레이어 gridArea: 3/1/4/4 로 row3 전체 span 고정"
  - "PlayerSeat seatIndex/totalPlayers는 _prefix로 유지 — 인터페이스 호환성"
  - "빅팟 글로우는 absolute inset-0 div 오버레이로 구현 — pointer-events-none z-10"
metrics:
  duration: ~10min
  completed: "2026-04-05"
  tasks: 1
  files: 2
---

# Quick-260405-j4v: 게임테이블 3x3 그리드 레이아웃 + 빅팟 내부글로우

**한 줄 요약:** 원형(circular) 배치를 3x3 CSS Grid로 전환하고 인원수별 최적 배치 + pot >= 20,000원 시 amber/orange inset glow 적용

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 파일 |
|--------|------|------|------|
| 1 | GameTable 3x3 그리드 + 빅팟 글로우 | 6ac3861 | GameTable.tsx, PlayerSeat.tsx |

## 구현 내용

### GameTable.tsx

- **`getOpponentCells(opponentCount)` 추가:** 5인→[1,2,3,4,6], 4인→[1,3,4,6], 3인→[1,2,3], 2인→[1,3], 1인→[2]
- **`cellToGridArea(cell)` 추가:** 셀 번호(1~9)를 `row / col` 문자열로 변환
- **데스크톱 레이아웃:** `absolute inset-0 hidden md:block`, CSS Grid 3열×3행
  - 상대방: `opponentCells` 배열 순서대로 각 셀에 배치
  - 셀5(row2/col2): 판돈 카드
  - 내 플레이어: `gridArea: '3 / 1 / 4 / 4'` (row3 전체 span)
- **빅팟 글로우:** `pot >= 20000` 시 `absolute inset-0 pointer-events-none z-10` div에 `inset 0 0 80px 20px rgba(245, 158, 11, 0.3), inset 0 0 200px 60px rgba(234, 88, 12, 0.15)` 적용, 데스크톱·모바일 공통
- **모바일:** 기존 2열 grid 유지, 빅팟 글로우 오버레이 추가

### PlayerSeat.tsx

- **원형 배치 제거:** `--angle` CSS property, `rotate/translateY` transform, `absolute top-1/2 left-1/2 -mt-14 -ml-14` 삭제
- **이중 렌더 제거:** `hidden md:block` / `md:hidden` 래퍼 삭제, 단일 `<Card>` 직접 반환
- **크기 개선:** `w-full` 적용 (그리드 셀이 크기 결정), 닉네임·칩 `text-sm`으로 확대 (compact 아닐 때)
- **props 호환성:** `seatIndex`, `totalPlayers`는 `_prefix`로 수신 유지 (인터페이스 변경 없음)

## 계획 대비 편차

없음 — 계획대로 정확히 구현됨.

## Self-Check: PASSED

- FOUND: packages/client/src/components/layout/GameTable.tsx
- FOUND: packages/client/src/components/game/PlayerSeat.tsx
- FOUND: commit 6ac3861
