---
phase: quick-260405-pv9
plan: 01
subsystem: client/layout
tags: [layout, mobile, three-card, overlap]
key-files:
  modified:
    - packages/client/src/components/layout/HandPanel.tsx
decisions:
  - 3장일 때만 gap 제거 + negative margin(-12px) + zIndex 적용, 2장/1장 모드는 기존 유지
metrics:
  duration: "5분"
  completed: "2026-04-05T09:40:16Z"
  tasks_completed: 1
  files_modified: 1
---

# Quick Task 260405-pv9: HandPanel 3장 카드 겹치기 배치

## 한 줄 요약

3장섯다 모드에서 HandPanel 카드 3장에 `marginLeft: -12px` + `zIndex` 적용으로 겹치기 배치, BettingPanel 확보 공간 약 24px 증가.

## 완료된 작업

| Task | 이름 | Commit | 파일 |
|------|------|--------|------|
| 1 | 3장 카드 겹치기 배치 적용 | b1fc22c | HandPanel.tsx |

## 변경 내용

**HandPanel.tsx (176행 부근)**

- 카드 컨테이너 className: `cards.length === 3`일 때 `gap-2` 제거 → `"flex items-center flex-wrap"`
- 카드 wrapper `style` 합성:
  - 기존: `style={getDealAnimStyle(renderPos)}`
  - 변경: `{ ...getDealAnimStyle(renderPos), ...(isThreeCards && renderPos > 0 ? { marginLeft: '-12px' } : {}), zIndex: isThreeCards ? renderPos + 1 : undefined }`
- `isThreeCards` 변수 추가 (`cards.length === 3`)

## 검증 결과

- TypeScript 컴파일: HandPanel.tsx 관련 에러 없음 (기존 pre-existing 에러 2건은 무관 파일)
- 2장/1장 모드 사이드이펙트 없음 (조건 `isThreeCards`로 격리)
- 공개 카드(renderPos 0, zIndex 1)가 겹침에 가려지지 않음

## 이탈 사항 (Deviations)

없음 — 플랜 그대로 실행.

## Self-Check: PASSED

- [x] `packages/client/src/components/layout/HandPanel.tsx` 수정 확인
- [x] commit `b1fc22c` 존재 확인
