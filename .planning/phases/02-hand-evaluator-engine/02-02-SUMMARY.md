---
phase: "02"
plan: "02"
subsystem: hand-evaluator
tags: [hand, compare, gusa, tdd, special-beater]
dependency_graph:
  requires: ["02-01 (HandResult, HandType, evaluateHand)"]
  provides: ["compareHands 비교 함수", "checkGusaTrigger 재경기 판단 함수"]
  affects: ["03-xx (게임 엔진에서 승패 판정 시 사용)", "04-xx (구사 재경기 처리)"]
tech_stack:
  added: []
  patterns: ["특수패 비교 전략 (땡잡이/암행어사 우선 처리 후 score 비교)"]
key_files:
  created:
    - packages/shared/src/hand/compare.ts
    - packages/shared/src/hand/compare.test.ts
    - packages/shared/src/hand/gusa.ts
    - packages/shared/src/hand/gusa.test.ts
  modified:
    - packages/shared/src/index.ts
decisions:
  - "땡잡이/암행어사 구별은 score 값(0/1)으로 판별 - HandResult 인터페이스 변경 불필요"
  - "compareHands는 순수 비교만 담당, 재경기 트리거는 별도 함수(checkGusaTrigger)로 분리"
metrics:
  duration_seconds: 159
  completed: "2026-03-29T11:14:54Z"
  tasks_completed: 2
  tasks_total: 2
  tests_added: 44
  tests_total: 96
---

# Phase 2 Plan 2: compareHands + 특수패 비교 + checkGusaTrigger 구현 요약

**한줄 요약:** 땡잡이/암행어사 특수 비교 로직 포함 compareHands와 구사 재경기 판단 checkGusaTrigger를 TDD로 구현하고 @sutda/shared에서 전체 export 완료

## 완료 작업

| Task | 이름 | 커밋 | 주요 파일 |
|------|------|------|-----------|
| 1 | compareHands TDD 구현 | ce1f557 | compare.ts, compare.test.ts |
| 2 | checkGusaTrigger TDD + exports | c9aa253 | gusa.ts, gusa.test.ts, index.ts |

## 구현 상세

### Task 1: compareHands

`compareHands(a, b)` 함수는 두 `HandResult`를 비교하여 `'a' | 'b' | 'tie'`를 반환한다.

**비교 우선순위:**
1. 땡잡이(score=0, isSpecialBeater=true): 일땡~구땡 이김, 장땡/광땡에게 짐
2. 암행어사(score=1, isSpecialBeater=true): 일팔/일삼광땡 이김, 삼팔광땡에게 짐
3. 둘 다 특수패이거나 둘 다 일반패: score 단순 비교
4. 동점 시 `'tie'` 반환

30개 테스트 케이스: 일반 비교 7건, 땡잡이 12건, 암행어사 11건

### Task 2: checkGusaTrigger + exports

`checkGusaTrigger(gusaHand, allSurvivingHands)` 함수는 구사 재경기 조건을 판단한다.

- 일반 구사: 생존자 최고 score <= 60(알리) 이면 재경기
- 멍텅구리구사: 생존자 최고 score <= 1008(팔땡) 이면 재경기
- 구사가 아닌 패 또는 빈 배열: shouldRedeal: false

14개 테스트 케이스: 일반구사 6건, 멍텅구리구사 5건, 예외 처리 3건

**@sutda/shared exports 추가:**
- `HandType`, `HandResult` (타입)
- `evaluateHand`, `compareHands`, `checkGusaTrigger` (함수)

## 검증 결과

- 전체 테스트: 96/96 통과 (deck 6 + evaluator 46 + compare 30 + gusa 14)
- TypeScript 빌드: 오류 없음 (`pnpm --filter @sutda/shared build` 통과)

## Deviations from Plan

None - 플랜대로 정확하게 실행됨.

## Known Stubs

없음 - 모든 함수가 완전히 구현되어 있으며 stub이나 placeholder가 없음.

## Self-Check: PASSED

- [x] compare.ts, compare.test.ts, gusa.ts, gusa.test.ts, index.ts 모두 존재
- [x] 커밋 ce1f557, c9aa253 확인됨
- [x] 96/96 테스트 통과
- [x] TypeScript 빌드 오류 없음
