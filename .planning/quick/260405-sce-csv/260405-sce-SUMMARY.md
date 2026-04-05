---
phase: quick
plan: 260405-sce
subsystem: client/modals
tags: [csv, download, history, modal]
key-files:
  modified:
    - packages/client/src/components/modals/HistoryModal.tsx
decisions:
  - 외부 라이브러리 없이 순수 JS로 CSV 변환 구현 (의존성 최소화)
  - BOM(\uFEFF) 포함하여 Excel 한글 깨짐 방지
  - DialogHeader를 flex-row로 변경하여 타이틀과 버튼을 한 줄 배치
metrics:
  duration: ~5분
  completed: "2026-04-05"
  tasks: 1
  files: 1
---

# Quick Task 260405-sce: HistoryModal CSV 다운로드 기능 추가 요약

**한 줄 요약:** HistoryModal에 UTF-8 BOM 포함 CSV 다운로드 기능을 순수 JS로 구현, Excel 한글 지원 및 타임스탬프 파일명 자동 생성

## 완료된 태스크

| # | 태스크 | 커밋 | 파일 |
|---|--------|------|------|
| 1 | HistoryModal CSV 다운로드 기능 추가 | b146677 | packages/client/src/components/modals/HistoryModal.tsx |

## 구현 내용

### 추가된 기능

1. **`escapeCsvCell(value: string): string`**
   - 모든 셀 값을 `"..."` 로 감싸고 내부 `"` 를 `""` 로 이스케이프

2. **`entriesToCsv(entries: RoundHistoryEntry[]): string`**
   - UTF-8 BOM(`\uFEFF`) 선두 추가 → Excel 한글 깨짐 방지
   - 헤더: `판, 승자, 족보, 땡값여부, 판돈, 플레이어별잔액`
   - 플레이어별 잔액: `닉네임:잔액` 형태를 `/` 로 구분하여 단일 컬럼

3. **`downloadCsv(entries: RoundHistoryEntry[]): void`**
   - `Blob` + `URL.createObjectURL` 방식 다운로드
   - 파일명: `sutda-history-YYYYMMDD-HHmmss.csv` (타임스탬프 자동 생성)
   - 클릭 후 URL revoke로 메모리 누수 방지

4. **UI 버튼**
   - `DialogHeader`를 `flex flex-row items-center justify-between` 레이아웃으로 변경
   - "CSV 저장" 버튼: `entries.length === 0` 일 때 `disabled`
   - 기본 Tailwind 스타일 적용 (outline 스타일, hover/disabled 상태 처리)

## 이탈 없음

계획대로 정확히 실행되었습니다.

## Self-Check

- [x] `packages/client/src/components/modals/HistoryModal.tsx` 파일 존재 확인
- [x] 커밋 `b146677` 존재 확인
- [x] 메인 레포 TypeScript 컴파일 — HistoryModal 관련 에러 없음

## Self-Check: PASSED
