---
phase: quick-260404-qk2
plan: 01
subsystem: client-ui
tags: [handpanel, ui-cleanup, hint-removal]
dependency_graph:
  requires: []
  provides: []
  affects: [packages/client/src/components/layout/HandPanel.tsx]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - packages/client/src/components/layout/HandPanel.tsx
decisions: []
metrics:
  duration: 2분
  completed_date: "2026-04-04"
  tasks_completed: 1
  files_changed: 1
---

# Quick Task 260404-qk2: HandPanel 힌트 스팬 제거 요약

## 한 줄 요약

HandPanel.tsx에서 카드 1장 뒤집기 후 표시되던 '나머지 카드를 탭하세요' 힌트 스팬을 삭제하여 모바일 손패 패널 레이아웃을 간결하게 정리

## 작업 목록

| 태스크 | 이름 | 커밋 | 파일 |
|--------|------|------|------|
| 1 | HandPanel 힌트 스팬 제거 | 5217fa5 | packages/client/src/components/layout/HandPanel.tsx |

## 변경 내용

### 제거된 코드

`packages/client/src/components/layout/HandPanel.tsx` Row 3 div 내부에서 아래 블록 삭제:

```tsx
{flippedIndices.size === 1 && cards.length >= 2 && (
  <span className="text-[10px] text-muted-foreground">나머지 카드를 탭하세요</span>
)}
```

- `flippedIndices` 변수 및 선언은 다른 곳에서도 사용되므로 유지
- Row 3 div 구조(족보 참고표 버튼, handLabel Badge) 그대로 유지

## 검증 결과

- `grep "나머지 카드를 탭하세요" HandPanel.tsx` → EXIT:1 (매치 없음, 정상)
- TypeScript 빌드: 워크트리 node_modules 미설치로 vite 실행 불가 (pre-existing 인프라 제약); 변경은 JSX 블록 순수 삭제로 타입 오류 없음

## 계획 대비 편차

없음 — 계획대로 정확히 실행됨

## Known Stubs

없음
