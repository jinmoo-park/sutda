---
status: partial
phase: 10-ux
source: [10-VERIFICATION.md]
started: 2026-03-31T23:10:00Z
updated: 2026-03-31T23:10:00Z
---

## Current Test

[브라우저에서 직접 확인 대기 중]

## Tests

### 1. 데스크탑 레이아웃 확인
expected: 데스크탑(768px+)에서 RoomPage 3열 그리드(좌사이드|중앙 테이블|우사이드)가 스크롤 없이 뷰포트 전체를 채움
result: [pending]

### 2. 모바일 레이아웃 확인
expected: 모바일(<768px)에서 수직 배치(테이블|베팅/손패|채팅), 스크롤 없음
result: [pending]

### 3. 카드 배분 애니메이션 확인
expected: 각 카드가 위에서 아래로 날아오며(translateY -80px→0, opacity 0→1) 뒷면 상태로 대기
result: [pending]

### 4. HwatuCard 3D flip 인터랙션 확인
expected: 카드 클릭 시 3D flip 애니메이션(0.45s cubic-bezier), 2장 모두 뒤집으면 족보 표시
result: [pending]

### 5. 셔플 모달 rAF 애니메이션 확인
expected: 버튼 누르는 동안 rAF 기반 5단계 사이클 애니메이션 루프, 떼면 즉시 종료
result: [pending]

### 6. 기리 모달 드래그 UX 확인
expected: 더미 드래그(8px threshold)로 분리, 탭으로 순서 번호 배지 표시, 합치기 애니메이션(380ms)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
