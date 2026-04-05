---
phase: quick
plan: 260405-sce
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/modals/HistoryModal.tsx
autonomous: true
must_haves:
  truths:
    - "HistoryModal에 'CSV 저장' 버튼이 보인다"
    - "버튼 클릭 시 게임이력이 CSV 파일로 다운로드된다"
    - "CSV에 판번호, 승자, 족보, 판돈, 플레이어별 잔액이 포함된다"
  artifacts:
    - path: "packages/client/src/components/modals/HistoryModal.tsx"
      provides: "CSV 다운로드 버튼이 추가된 HistoryModal"
  key_links:
    - from: "HistoryModal.tsx"
      to: "RoundHistoryEntry[]"
      via: "entries prop을 CSV 문자열로 변환"
---

<objective>
HistoryModal에 "CSV 저장" 버튼을 추가하여 게임이력 데이터를 클라이언트 사이드에서 CSV 파일로 다운로드할 수 있게 한다.

Purpose: 사용자가 게임이력을 로컬 파일로 보관/분석할 수 있도록 한다.
Output: CSV 다운로드 기능이 추가된 HistoryModal 컴포넌트
</objective>

<context>
@packages/client/src/components/modals/HistoryModal.tsx
@packages/shared/src/types/game.ts (RoundHistoryEntry 타입)

<interfaces>
<!-- RoundHistoryEntry 타입 구조 (packages/shared/src/types/game.ts:113) -->
```typescript
export interface RoundHistoryEntry {
  roundNumber: number;
  winnerId: string;
  winnerNickname: string;
  winnerHandLabel: string;
  pot: number;
  hasTtaengPayment: boolean;
  playerChipChanges: { playerId: string; nickname: string; chipDelta: number; balance: number }[];
}
```

<!-- handLabelToKorean: 영문 족보 라벨을 한글로 변환 (packages/client/src/lib/handLabels.ts) -->
```typescript
export function handLabelToKorean(label: string): string;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: HistoryModal에 CSV 다운로드 기능 추가</name>
  <files>packages/client/src/components/modals/HistoryModal.tsx</files>
  <action>
HistoryModal.tsx에 CSV 다운로드 기능을 추가한다.

1. CSV 변환 헬퍼 함수 작성 (컴포넌트 파일 내부, 외부 라이브러리 없이):
   - `entriesToCsv(entries: RoundHistoryEntry[]): string` 함수 생성
   - CSV 헤더: `판,승자,족보,땡값여부,판돈,플레이어별잔액`
   - 각 row: `roundNumber`, `winnerNickname`, `handLabelToKorean(winnerHandLabel)`, `hasTtaengPayment ? 'O' : ''`, `pot`, 플레이어별 잔액은 `"닉네임:잔액"` 형태로 `/`로 구분하여 하나의 컬럼에 넣기
   - 셀 값에 쉼표가 포함될 수 있으므로 모든 문자열 셀을 `"` 로 감싸기
   - UTF-8 BOM (`\uFEFF`) 를 앞에 추가하여 Excel 한글 깨짐 방지

2. 다운로드 트리거 함수:
   - `downloadCsv(entries: RoundHistoryEntry[]): void`
   - Blob 생성: `new Blob([csvString], { type: 'text/csv;charset=utf-8' })`
   - `URL.createObjectURL` 로 임시 URL 생성
   - 숨겨진 `<a>` 엘리먼트 생성 후 `download` 속성에 파일명 설정: `sutda-history-{YYYYMMDD-HHmmss}.csv`
   - 클릭 트리거 후 URL revoke

3. UI 버튼 추가:
   - DialogHeader 내부, DialogTitle 옆에 CSV 저장 버튼 배치
   - DialogHeader를 flex row로 변경하여 타이틀과 버튼을 한 줄에 배치
   - 버튼 스타일: `variant="outline" size="sm"` (기존 Button 컴포넌트 또는 간단한 button 태그 사용)
   - 텍스트: "CSV 저장" (아이콘 없이 텍스트만)
   - entries가 비어있으면 버튼 disabled
   - 클릭 시 `downloadCsv(entries)` 호출
  </action>
  <verify>
    <automated>cd D:/dev/sutda && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - HistoryModal에 "CSV 저장" 버튼이 표시됨
    - 버튼 클릭 시 게임이력이 CSV 파일로 다운로드됨
    - CSV 파일에 판번호, 승자, 족보, 땡값여부, 판돈, 플레이어별 잔액이 포함됨
    - Excel에서 열었을 때 한글이 깨지지 않음 (BOM 포함)
    - 이력이 없을 때 버튼이 비활성화됨
    - TypeScript 컴파일 에러 없음
  </done>
</task>

</tasks>

<verification>
- TypeScript 컴파일 통과
- HistoryModal 렌더링 시 CSV 저장 버튼이 보이는지 확인
- 버튼 클릭 시 .csv 파일이 다운로드되는지 확인
</verification>

<success_criteria>
HistoryModal에서 CSV 저장 버튼을 클릭하면 게임이력이 포함된 CSV 파일이 다운로드된다.
</success_criteria>

<output>
완료 후 커밋: `feat: HistoryModal CSV 다운로드 기능 추가`
</output>
