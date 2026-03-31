---
phase: "09-94"
plan: "02"
subsystem: "socket-ui"
tags: [socket-handler, modal, result-screen, gusa-rejoin, ttaeng-value]
dependency_graph:
  requires: [09-01]
  provides: [gusa-rejoin-socket, GusaRejoinModal, ttaeng-value-result-ui, gusa-pending-roompage]
  affects: [packages/server/src/index.ts, packages/client/src/components/modals/GusaRejoinModal.tsx, packages/client/src/components/layout/ResultScreen.tsx, packages/client/src/pages/RoomPage.tsx]
tech_stack:
  added: []
  patterns: [handleGameAction 패턴, 카운트다운 모달 패턴]
key_files:
  created:
    - packages/client/src/components/modals/GusaRejoinModal.tsx
  modified:
    - packages/server/src/index.ts
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - "GusaRejoinModal은 결정 완료 후 '결정 완료' 텍스트 표시 — 중복 emit 방지"
  - "gusa-pending RoomPage 분기: needsDecision 조건으로 모달 vs 대기 메시지 분기"
metrics:
  duration_seconds: 420
  completed_date: "2026-03-31"
  tasks_completed: 1
  files_modified: 4
---

# Phase 09 Plan 02 요약: 소켓 핸들러 + 클라이언트 UI 구현

## 한 줄 요약

gusa-rejoin 소켓 핸들러, 15초 카운트다운 재참여 모달(GusaRejoinModal), ResultScreen 땡값 섹션, RoomPage gusa-pending 분기를 구현하여 땡값/구사재경기 UI를 완성함.

## 완료된 태스크

### Task 1: 소켓 핸들러 + GusaRejoinModal + ResultScreen 땡값 + RoomPage 통합 (커밋: e7e2028)

**A. 서버 소켓 핸들러 (`packages/server/src/index.ts`)**
- `gusa-rejoin` 소켓 핸들러 추가 (handleGameAction 패턴 사용)
- `engine.recordGusaRejoinDecision(socket.data.playerId, join)` 호출

**B. GusaRejoinModal (`packages/client/src/components/modals/GusaRejoinModal.tsx`)**
- 새 파일 생성 (69줄)
- Props: `roomId`, `potAmount`, `myChips`
- 15초 카운트다운 (`useState(15)`)
- 재참여 비용: `Math.floor(potAmount / 2)`
- `canAfford` 검사: 잔액 부족 시 참여 버튼 비활성화 + 안내 메시지
- `decided` 상태로 중복 emit 방지
- 타임아웃 시 자동 거절 처리

**C. ResultScreen 땡값 섹션 (`packages/client/src/components/layout/ResultScreen.tsx`)**
- `gameState.ttaengPayments` 존재 시 별도 섹션 렌더링
- 납부자별 차감 금액(빨간색), 승자 합산 수령(초록색) 표시

**D. RoomPage gusa-pending 분기 (`packages/client/src/pages/RoomPage.tsx`)**
- `GusaRejoinModal` import 추가
- `phase === 'gusa-pending'` 분기: 다이 플레이어 → 모달/대기, 생존 플레이어 → 대기 메시지

## 검증 결과

- `pnpm --filter @sutda/server test (vitest run)`: 34 기존 실패 유지, 140 통과 (회귀 없음)
- `pnpm --filter @sutda/client build`: 빌드 성공 (480.01 kB)
- 모든 수용 기준 확인:
  - `gusa-rejoin` 소켓 핸들러: line 345 확인
  - `recordGusaRejoinDecision` 호출: line 349 확인
  - GusaRejoinModal.tsx 존재 (69줄): 확인
  - `useState(15)` 카운트다운: line 13 확인
  - `gusa-rejoin` emit: lines 22, 28 확인
  - `ttaengPayments` 참조: ResultScreen.tsx 확인
  - `땡값` 텍스트: ResultScreen.tsx 확인
  - `gusa-pending` 분기: RoomPage.tsx line 363 확인
  - `GusaRejoinModal` import: RoomPage.tsx line 19 확인

## 계획으로부터의 이탈

없음 — 계획 그대로 실행됨.

## 알려진 스텁

없음.

## 검증 대기 중 (Task 2: checkpoint:human-verify)

Task 2는 수동 검증 체크포인트입니다. 아래 절차로 전체 플로우를 확인해야 합니다:

1. `pnpm dev`로 서버+클라이언트 실행
2. 브라우저 2~3개 탭에서 방 생성 + 참여
3. 땡값 테스트 (오리지날 모드): 땡 보유 플레이어 다이 후 result 화면 땡값 섹션 확인
4. 구사 재경기 테스트: 4+9 조합 + 알리 이하 최고패 상황에서 15초 모달 확인
5. 비오리지날 모드에서 땡값 미적용 확인

## Self-Check: PASSED

- GusaRejoinModal.tsx 존재: FOUND
- ResultScreen.tsx ttaengPayments: FOUND
- RoomPage.tsx gusa-pending: FOUND
- 커밋 e7e2028: FOUND
- 서버 테스트: 140 통과 / 34 기존 실패 (회귀 없음)
- 클라이언트 빌드: 성공

## Post-UAT 버그 수정 (6차 UAT, 2026-03-31)

### 커밋 339f90c
1. **ResultScreen 세장섯다 카드/족보 표시**: `selectedCards` 기준으로 변경
   - 기존: 항상 `cards[0], cards[1]`로 족보 계산 → "선택이 반영 안 됨"처럼 보이는 표시 버그
   - 수정: `player.selectedCards?.length === 2`이면 선택한 2장 사용 (카드 표시 + 족보 라벨)
   - 서버 승패 결정 로직(`_resolveShowdownSejang`)은 이미 정확했음 — 화면만 수정
2. **골라골라 베팅패널 미표시**: `gollagolla-select→betting` 전환 시 `cardConfirmed=true` 추가
3. **인디언 베팅패널 미표시**: `cutting→betting-1` Indian 블록에 `cardConfirmed=true` 추가
   - 근본 원인: 특수 모드 조기 `return`으로 `cardConfirmed` 미설정. 오리지날/한장공유는 딜링 확인 오버레이 클릭으로 설정되지만 세 모드는 해당 흐름 없었음

**6차 UAT 전 검증 통과 항목 (최종 완료)**
