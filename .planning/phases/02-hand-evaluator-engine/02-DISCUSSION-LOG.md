# Phase 2: 족보 판정 엔진 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 02-hand-evaluator-engine
**Areas discussed:** 동점 처리, 구사/멍텅구리구사 처리 범위, HandResult 반환 타입 구조, 패키지 위치, TDD 범위

---

## 동점 처리 (HAND-07)

**Q:** 두 플레이어가 같은 끗수(예: 둘 다 오끗)일 때 기본 처리 방식은?
- 분팟 (판돈 반반)
- **재경기** ← 선택
- Claude 결정

**Q:** 재경기 시 진어주었던 플레이어도 다시 입장하는 방식인가요?
- **동점인 플레이어들만 재경기** ← 선택 (노트: 다이한 플레이어와 최고동점자보다 낮은 패의 플레이어는 제외)
- 전체 재경기

---

## 구사/멍텅구리구사 처리 범위

**Q:** Phase 2의 HandEvaluator가 구사/멍텅구리구사를 어디까지 처리할까요?
- 판정만 (is-구사 플래그 반환)
- **트리거 조건도 포함** ← 선택

**Q:** 트리거 조건 판단에 필요한 입력을 HandEvaluator에 어떻게 전달할까요?
- **다른 생존자 포함** ← 선택 → `checkGusaTrigger(gusaHand, allSurvivingHands[])` 패턴
- 게임 엔진에 위임

---

## HandResult 반환 타입 구조

**Q:** evaluateHand()의 반환 타입 구조를 어떻게 할까요?
- **구조체 (Recommended)** ← 선택
  ```typescript
  interface HandResult {
    handType: HandType;
    score: number;
    isSpecialBeater: boolean;
    isGusa: boolean;
    isMeongtteongguriGusa: boolean;
  }
  ```
- 단순 숫자 스코어

---

## 패키지 위치

**Q:** HandEvaluator를 어느 패키지에 둘까요?
- **@sutda/shared (Recommended)** ← 선택
- @sutda/server

---

## TDD 범위 확정

**Q:** 땡잡이(3+7)는 특수조합(알리~새륙)과 끗 패에 대해 어떻게 인식되나요?
- **0끗(망통)으로 인식 (Recommended)** ← 선택

**User note:** 암행어사(열끗4+열끗7)는 일팔광땡과 일삼광땡에게만 이기고, 나머지 패에는 1끗으로 인식된다.

---

*Discussion completed: 2026-03-29*
