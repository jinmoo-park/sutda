---
phase: quick-260405-l5b
plan: "01"
subsystem: server
tags: [bugfix, disconnect, card-reveal, result-phase, game-engine]
dependency_graph:
  requires: []
  provides: [card-reveal-disconnect-auto-reveal, result-phase-disconnect-vote-skip]
  affects: [packages/server/src/game-engine.ts, packages/server/src/index.ts]
tech_stack:
  added: []
  patterns: [tryAdvanceNextRound 함수 추출 패턴, disconnect 이벤트 자동 처리 패턴]
key_files:
  modified:
    - packages/server/src/game-engine.ts
    - packages/server/src/index.ts
decisions:
  - forceDisconnectedPlayerAction에 card-reveal / showdown phase 분기 추가 — 기존 베팅 처리 패턴 동일하게 확장
  - tryAdvanceNextRound 함수 추출 — next-round / take-break / disconnect 세 핸들러의 중복 로직 단일화
  - disconnect + absent 제외 투표 계산 — result phase에서 disconnected 플레이어는 투표 불필요 인원에서 제외
metrics:
  duration: "~8분"
  completed_date: "2026-04-05"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260405-l5b: card-reveal / result phase disconnect 게임 멈춤 버그 수정 요약

**한 줄 요약:** card-reveal phase disconnect 시 해당 플레이어 카드 자동 전체 공개 + showdown 자동 트리거, result phase disconnect 시 투표 필요 인원에서 제외하여 나머지 플레이어만으로 즉시 다음 판 진행 가능

## 완료된 태스크

| 태스크 | 설명 | 커밋 |
|--------|------|------|
| Task 1 | card-reveal/showdown phase disconnect 자동 공개 처리 | a4a44e9 |
| Task 2 | result phase disconnect 투표 통과 + tryAdvanceNextRound 추출 | 1464b49 |

## 변경 내용

### Task 1: game-engine.ts — `forceDisconnectedPlayerAction` 확장

기존에는 베팅 phase만 처리하던 메서드에 두 가지 분기를 추가했다.

**card-reveal phase 분기:**
- disconnect된 플레이어의 `revealedCardIndices`를 모든 카드 인덱스로 설정
- `isRevealed = true` 마킹
- 전체 생존 플레이어 공개 완료 시 `strategy.showdown()` 자동 트리거

**showdown phase 분기 (전원 다이 후 공개/숨기기 선택 상황):**
- `isRevealed = true` 마킹
- 생존자 1명이면 즉시 정산 후 `result` phase 전환
- 생존자 다수면 `_resolveShowdown()` 호출

### Task 2: index.ts — `tryAdvanceNextRound` 추출 및 disconnect 연동

**`tryAdvanceNextRound(roomId)` 함수 신설:**
- `result` phase + 투표 존재 여부 확인
- `isDisconnected + isAbsent` 모두 제외한 실제 투표 필요 인원 계산
- 기존 `next-round` 핸들러의 "전원 투표 완료 → 다음 판 시작" 블록 전체를 이 함수로 이동

**세 핸들러에서 공통 호출:**
1. `next-round` 핸들러: async로 변경, 투표 추가 후 `tryAdvanceNextRound` 위임
2. `take-break` 핸들러: async로 변경, 기존 중복 로직을 `tryAdvanceNextRound`로 교체
3. `disconnect` 핸들러: `forceDisconnectedPlayerAction` + 게임 상태 broadcast 후 `tryAdvanceNextRound` 호출

## 버그 수정 플로우

```
[card-reveal] 플레이어 disconnect
  → forceDisconnectedPlayerAction()
    → revealedCardIndices 전체 설정 + isRevealed=true
    → 모든 생존자 공개 완료? → strategy.showdown() → result phase
  → 게임 상태 broadcast
  → tryAdvanceNextRound() (result phase면 투표 재계산)

[result] 플레이어 disconnect
  → forceDisconnectedPlayerAction() (isDisconnected=true 마킹)
  → 게임 상태 broadcast
  → tryAdvanceNextRound()
    → requiredCount = 연결된 + 미자리비움 + 칩있는 플레이어 수
    → 이미 투표한 인원 >= requiredCount → 다음 판 자동 시작
```

## 편차 (계획 대비 변경)

**[Rule 2 - 누락된 기능] `take-break` 핸들러 중복 로직 제거**
- 발견 시점: Task 2 구현 중
- 내용: `take-break` 핸들러에도 `next-round` 핸들러와 동일한 "투표 완료 후 다음 판" 블록이 중복 존재했으나 `isDisconnected` 필터 없이 구현되어 있었음
- 처리: `tryAdvanceNextRound` 추출 시 해당 핸들러도 함께 단순화 (일관성 및 버그 예방)

## 검증

- `game-engine.test.ts`: 변경 전후 동일 (33 failed / 90 passed) — 기존 pre-existing 실패, 내 변경으로 신규 실패 없음
- `index.test.ts`: 변경 전후 동일 (4 failed / 5 passed) — `next-round` 테스트 기존 pre-existing 타임아웃, 내 변경으로 신규 실패 없음

## 알려진 스텁

없음.

## Self-Check: PASSED

- [x] `packages/server/src/game-engine.ts` 수정 확인
- [x] `packages/server/src/index.ts` 수정 확인
- [x] Task 1 커밋 `a4a44e9` 존재 확인
- [x] Task 2 커밋 `1464b49` 존재 확인
