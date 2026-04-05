---
phase: quick-260405-miq
plan: 01
subsystem: client-ui
tags: [mobile, layout, game-table, player-seat, result-screen]
key-files:
  modified:
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/layout/ResultScreen.tsx
decisions:
  - 모바일 그리드: 기존 flex+flat-grid 구조 → 데스크탑과 동일한 3x3 CSS Grid 명시적 배치로 통일
  - 내 플레이어 셀8(row3/col2) 고정, 판돈/모드 셀5(row2/col2) 배치
  - compact 모드 레이즈 텍스트: "베팅금액" 라벨 제거 + text-[10px] 축소
  - 학교가기 버튼: proxyBeneficiaryNicknames 체크로 "다음판으로" 텍스트 분기
metrics:
  duration: ~10min
  completed: "2026-04-05"
  tasks: 2
  files: 3
---

# Quick Task 260405-miq: 모바일 레이아웃 4종 개선 Summary

**한 줄 요약:** 모바일 게임테이블 3x3 CSS Grid 명시적 좌석 배치 + 판돈 중앙 이동 + 레이즈 텍스트 간소화 + 대리출석 수혜자 버튼 텍스트 분기

## 완료된 작업

### Task 1: 모바일 3x3 그리드 좌석 배치 + 판돈 중앙(셀5) 이동
- **커밋:** `df630eb`
- **파일:** `packages/client/src/components/layout/GameTable.tsx`
- 기존 `flex flex-col` + `grid grid-cols-3` 플랫 배치를 제거
- `display: grid`, `gridTemplateColumns: '1fr 1fr 1fr'`, `gridTemplateRows: '1fr 1fr 1fr'` 구조로 교체
- 기존 `getOpponentCells()` 헬퍼 함수를 모바일에도 재사용 (내 플레이어 셀8 고정)
- 셀5 (`gridArea: '2 / 2'`)에 모드 배지 + 판돈 금액 + 올인 여부 + 한장공유 카드 표시
- 내 플레이어를 셀8 (`gridArea: '3 / 2'`)에 단독 배치
- Observer 목록 모바일 우측 하단에도 추가

**인원별 배치 (getOpponentCells 기준):**
| 인원 | 상대방 수 | 배치 셀 |
|------|-----------|---------|
| 2인 | 1명 | [2] |
| 3인 | 2명 | [1, 3] |
| 4인 | 3명 | [1, 3, 6] |
| 5인 | 4명 | [1, 3, 4, 6] |
| 6인 | 5명 | [1, 2, 3, 4, 6] |

### Task 2: 레이즈 텍스트 간소화 + 학교가기 버튼 조건부 텍스트
- **커밋:** `7a2bba8`
- **파일:** `packages/client/src/components/game/PlayerSeat.tsx`, `packages/client/src/components/layout/ResultScreen.tsx`

**PlayerSeat.tsx:**
- 레이즈 분기에서 "베팅금액" 라벨 텍스트 완전 제거, 금액(원)만 표시
- compact 모드에서 Badge와 span 모두 `text-[10px]` 적용

**ResultScreen.tsx:**
- `myNickname` + `isProxyBeneficiary` 변수 컴포넌트 최상단에 선언
- "학교 가기" 버튼: `isProxyBeneficiary ? '다음판으로' : '학교 가기'` 텍스트 분기

## 검증

- TypeScript 컴파일: 신규 에러 없음 (기존 2건 — `ResultScreen.tsx:154` winner undefined, `CutModal.tsx:145` GiriPhase — pre-existing)

## 편차 (Deviations)

없음 — 플랜대로 정확히 실행.

## Self-Check: PASSED

- `df630eb` 커밋 확인: GameTable.tsx 모바일 3x3 그리드
- `7a2bba8` 커밋 확인: PlayerSeat.tsx 레이즈 + ResultScreen.tsx 학교가기 분기
