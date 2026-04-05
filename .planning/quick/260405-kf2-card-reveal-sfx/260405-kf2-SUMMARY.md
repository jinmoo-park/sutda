# Quick Task 260405-kf2 요약

**완료일:** 2026-04-05
**커밋:** 72ae604

## 수정 항목

### 1. 레이아웃 중대오류 수정 (PlayerSeat.tsx)
- 원인: 워크트리 실행기가 원형 배치 코드(`absolute top-1/2 left-1/2 rotate/translateY`)를 복원
- 수정: 데스크톱/모바일 이중 렌더 제거, `<>{content}</>` 단일 반환
- `--angle` CSS 변수 및 style 객체 제거

### 2. 베팅패널 초기화 버튼 인라인 (BettingPanel.tsx)
- 기존: 레이즈 금액 아래 별도 줄에 `<Button>` (패널 크기 변동)
- 변경: 레이즈 금액 옆에 `<button>` 인라인, border 박스 스타일 적용

### 3. card-reveal SFX 타이밍 수정 (ResultScreen.tsx)
- `useSfxPlayer`에서 `stop` 추가 구조분해
- result phase 진입 시 win/lose SFX 재생 직전 `stop('card-reveal')` 호출
