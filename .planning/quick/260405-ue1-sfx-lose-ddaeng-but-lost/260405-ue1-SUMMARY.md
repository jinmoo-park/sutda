---
phase: quick
plan: 260405-ue1
subsystem: client-sfx
tags: [sfx, result-screen, lose-ddaeng-but-lost, bug-fix]
dependency_graph:
  requires: []
  provides: [isOneRankApart, SCORE_RANK_ORDER]
  affects: [ResultScreen.tsx]
tech_stack:
  added: []
  patterns: [족보 rank 인덱스 비교, SFX 중복 방지]
key_files:
  created: []
  modified:
    - packages/client/src/components/layout/ResultScreen.tsx
decisions:
  - "winnerCardsVisible/winnerHandCards를 iAmWinner 분기 상위로 이동하여 승자/패자 모두 참조 가능하게 함"
  - "로직을 별도 파일 분리 없이 ResultScreen.tsx 인라인 유지 (삭제 방지 주석 추가)"
metrics:
  duration: 10
  completed_date: "2026-04-05T12:57:15Z"
  tasks_completed: 1
  files_modified: 1
---

# Quick Task 260405-ue1: lose-ddaeng-but-lost SFX 복원 (3차) 요약

## 한 줄 요약

족보 한 단계 차이 승패 시 `lose-ddaeng-but-lost` SFX를 승자/패자 모두에게 재생하는 `SCORE_RANK_ORDER` + `isOneRankApart()` 로직을 ResultScreen.tsx에 3번째로 복원함.

## 근본 원인

커밋 `5eb3299`(260405-s6a)에서 복원된 `isOneRankApart` 로직이 바로 다음 커밋 `032b0b0`(260405-sgp-01: player-disconnected/reconnected 이벤트 추가)에서 ResultScreen.tsx 전체 덮어쓰기로 인해 세 번째로 삭제됨.

삭제 이력:
1. `a6bb668` — UI 정규화에서 삭제
2. `5eb3299` — 복원 (260405-s6a)
3. `032b0b0` — 다시 삭제 (현재 문제)
4. `fbf66ad` — 이번 커밋에서 재복원 (3차)

## 완료된 작업

### Task 1: ResultScreen.tsx에 isOneRankApart 로직 복원

**커밋:** `fbf66ad`

**변경 내용:**
1. 파일 상단에 `SCORE_RANK_ORDER` 배열과 `isOneRankApart()` 헬퍼 함수 추가 (삭제 금지 주석 포함)
2. `winnerCardsVisible` / `winnerHandCards` 변수를 패자 분기 내부에서 `iAmWinner` 분기 상위로 이동 (승자 분기에서도 참조 가능하도록)
3. 승자 분기 끝에 한 단계 차이 체크 추가: 패자 중 최고 score와 1단계 차이 시 `lose-ddaeng-but-lost` 재생
4. 패자 분기 끝에 한 단계 차이 체크 추가: 승자 score와 1단계 차이 + ttaeng 패배 아닐 때 `lose-ddaeng-but-lost` 재생 (중복 방지)

## 검증 결과

- `isOneRankApart` 함수 존재: 확인 (line 20, 호출 2회)
- `SCORE_RANK_ORDER` 배열 존재: 확인 (line 13)
- `lose-ddaeng-but-lost` 출현 횟수: 7회 (기존 ttaeng 패배 + 승자 분기 + 패자 분기)
- TypeScript 컴파일: 에러 없음

## 이탈 사항 (Deviations)

없음 — 플랜대로 정확히 실행됨.

## Self-Check: PASSED

- 파일 존재: `packages/client/src/components/layout/ResultScreen.tsx` — 확인
- 커밋 존재: `fbf66ad` — 확인
