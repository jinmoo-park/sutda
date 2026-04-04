---
phase: quick-260404-tat
plan: 01
subsystem: client/modals
tags: [bug-fix, shared-card-mode, modal-state, useEffect]
tech-stack:
  added: []
  patterns: [useEffect open-dependency reset pattern]
key-files:
  modified:
    - packages/client/src/components/modals/SharedCardSelectModal.tsx
decisions:
  - "open prop useEffect 리셋 패턴 — SejangCardSelectModal과 동일한 방식으로 일관성 유지"
metrics:
  duration: "~3분"
  completed: "2026-04-04T12:08:38Z"
  tasks: 1
  files: 1
---

# Quick Task 260404-tat: SharedCardSelectModal 카드 선택 막힘 버그 수정 요약

## 한 줄 요약

`open` prop 변경 시 `selectedIndex`를 null로 초기화하는 `useEffect`를 추가하여, 한장공유모드의 두 번째 이후 라운드에서 선 플레이어가 공유 카드를 정상적으로 선택할 수 있도록 수정.

## 근본 원인

`SharedCardSelectModal` 컴포넌트는 언마운트/마운트되지 않고 `open` prop만 토글되므로, `selectedIndex` 상태가 라운드 간 초기화되지 않고 이전 선택값을 유지하고 있었다.

`handleSelect` 내부의 `selectedIndex !== null` 가드가 이 잔류 상태로 인해 모든 클릭을 차단하여, 두 번째 이후 라운드에서 선 플레이어가 어떤 카드도 선택할 수 없게 되었다.

## 수정 내용

**파일:** `packages/client/src/components/modals/SharedCardSelectModal.tsx`

1. `useEffect` import 추가 (기존 `useState`와 함께)
2. `open` prop이 true로 변경될 때 `selectedIndex`를 null로 리셋하는 `useEffect` 추가

```tsx
useEffect(() => {
  if (open) {
    setSelectedIndex(null);
  }
}, [open]);
```

`SejangCardSelectModal`의 동일 패턴(27-32행)을 참조하여 코드베이스 전체 일관성 유지.

## 완료된 태스크

| # | 태스크 | 커밋 | 파일 |
|---|--------|------|------|
| 1 | SharedCardSelectModal selectedIndex 리셋 useEffect 추가 | 4b0e281 | SharedCardSelectModal.tsx |

## 검증

- TypeScript 컴파일: 수정 파일 관련 에러 없음 (기존 CutModal.tsx의 pre-existing 오류는 이 태스크와 무관)
- `useEffect`가 `open` dependency로 `selectedIndex`를 리셋하는 로직 존재 확인
- `SejangCardSelectModal`과 동일한 리셋 패턴 적용 확인

## 이탈 사항 (Deviations)

없음 — 계획대로 정확히 실행.

## Self-Check: PASSED

- [FOUND] packages/client/src/components/modals/SharedCardSelectModal.tsx
- [FOUND] commit 4b0e281
