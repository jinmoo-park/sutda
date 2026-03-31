---
phase: 10-ux
plan: "04"
subsystem: client-ux
tags: [shuffle, giri, animation, zustand, raf, drag, tap]
dependency_graph:
  requires: [10-01]
  provides: [ShuffleModal-rAF, CutModal-drag-tap, shuffleStore, giriStore]
  affects: [ShuffleModal.tsx, CutModal.tsx]
tech_stack:
  added: [requestAnimationFrame, Pointer Events API]
  patterns: [Zustand store, rAF animation loop, pointer gesture threshold]
key_files:
  created:
    - packages/client/src/store/shuffleStore.ts
    - packages/client/src/store/giriStore.ts
  modified:
    - packages/client/src/components/modals/ShuffleModal.tsx
    - packages/client/src/components/modals/CutModal.tsx
decisions:
  - rAF 기반 JS 애니메이션 선택 — CSS keyframe으로는 페이즈별 세밀한 타이밍 제어 불가
  - 드래그/탭 구분에 pointer threshold 8px 적용 — touchstart/mousedown 분기 없이 통일
  - pickedIdx 토글은 rest 페이즈 끝(t>810ms)에서 수행 — 사이클 중간에 토글 시 시각적 끊김
  - CutModal 합치기 타이밍을 setTimeout(380ms)으로 처리 — CSS transition 완료 후 서버 emit
metrics:
  duration_min: 3
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 4
---

# Phase 10 Plan 04: 셔플/기리 UX 고도화 Summary

## 한줄 요약

rAF 기반 5단계 셔플 애니메이션(820ms 사이클) + 드래그 분리/탭 순서 기리 UX를 Zustand shuffleStore/giriStore로 구현했다.

## 완료된 태스크

### Task 1: Zustand 스토어 생성 + ShuffleModal rAF 애니메이션 구현

- `shuffleStore.ts` 신규 생성: ShufflePhase('idle'|'peek'|'hold'|'rise'|'drop'|'rest'), isShuffling, pickedIdx
- `ShuffleModal.tsx` 전면 재설계: pointerdown 이벤트로 rAF 루프 시작, pointerup/pointerleave로 즉시 종료
- 5단계 타이밍: peek(0~120ms), hold(120~300ms), rise(300~480ms), drop(480~700ms), rest(700~820ms)
- 셔플 1회 이상 수행 후 확인 버튼 활성화 (hasShuffled 상태)
- CardBack import 완전 제거, HwatuCard 사용

### Task 2: GiriStore + CutModal 드래그/탭 UX 재설계

- `giriStore.ts` 신규 생성: GiriPhase('split'|'tap'|'merging'|'done'), piles 배열, tapOrder
- `CutModal.tsx` 전면 재설계: 드래그(threshold 8px)로 더미 분리, 탭으로 순서 지정
- 합치기 버튼: 모든 더미에 순서 지정 완료 시 활성화
- 합치기 애니메이션: easeInOut 380ms CSS transition 후 서버 emit
- tapOrder → cutPoints + order 변환하여 `cut` 이벤트 emit
- 퉁 버튼 하단 유지
- CardBack import 완전 제거, HwatuCard 사용

## 플랜 대비 이탈 사항

### Auto-fixed Issues

없음.

### 계획 변경 (Deviation)

**1. [Plan 조건 미충족] CardFace.tsx / CardBack.tsx 삭제 보류**

- **발견 시점:** Task 2 실행 전 사전 검증 단계
- **상황:** 플랜은 "Plan 03에서 모든 사용처가 HwatuCard로 교체되었고" 라고 전제했으나, 10-03-PLAN.md가 아직 실행되지 않아 19개 활성 import가 잔존함
- **적용 규칙:** 플랜 내 명시된 삭제 전 확인 조건("grep에서 import가 없는지 검증")에 따라 삭제 미수행
- **영향 파일:** CardFace.tsx, CardBack.tsx (현재 유지)
- **조치:** Plan 03 실행 시 CardFace/CardBack → HwatuCard 마이그레이션 후 삭제 예정

## 검증 결과

- `npx vitest run --run`: 5 passed, 5 skipped (43 tests, 0 failures) ✓
- shuffleStore.ts `export const useShuffleStore` 존재 ✓
- shuffleStore.ts `isShuffling`, `phase: ShufflePhase` 필드 존재 ✓
- ShuffleModal.tsx `requestAnimationFrame`, `cancelAnimationFrame` 존재 ✓
- ShuffleModal.tsx `onPointerDown`, `onPointerUp`, `onPointerLeave` 존재 ✓
- ShuffleModal.tsx `셔플 중...` 문자열 존재 ✓
- ShuffleModal.tsx `import.*useShuffleStore`, `import.*HwatuCard` 존재 ✓
- giriStore.ts `export const useGiriStore` 존재 ✓
- giriStore.ts `phase: GiriPhase`, `piles`, `tapOrder` 필드 존재 ✓
- CutModal.tsx `handlePilePointerDown`, `DRAG_THRESHOLD` 존재 ✓
- CutModal.tsx `import.*useGiriStore`, `import.*HwatuCard` 존재 ✓
- CutModal.tsx `합치기`, `380` 존재 ✓
- ShuffleModal.tsx `CardBack` import 없음 ✓
- CutModal.tsx `CardBack` import 없음 ✓
- CardFace.tsx, CardBack.tsx 삭제: Plan 03 미실행으로 보류 (Deviation 참조)

## Known Stubs

없음 — 모든 기능이 실제 서버 emit과 연결됨.

## Self-Check: PASSED

- `packages/client/src/store/shuffleStore.ts` 존재 ✓
- `packages/client/src/store/giriStore.ts` 존재 ✓
- `packages/client/src/components/modals/ShuffleModal.tsx` 수정됨 ✓
- `packages/client/src/components/modals/CutModal.tsx` 수정됨 ✓
- 커밋 `2a9df97` 존재 ✓
- 커밋 `b419989` 존재 ✓
