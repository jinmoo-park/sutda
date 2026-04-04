---
phase: quick-260404-tat
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/components/modals/SharedCardSelectModal.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "한장공유모드 두 번째 이후 플레이에서 선 플레이어가 공유 카드를 정상적으로 선택할 수 있다"
    - "모달이 열릴 때마다 이전 선택 상태가 초기화되어 깨끗한 상태에서 시작한다"
  artifacts:
    - path: "packages/client/src/components/modals/SharedCardSelectModal.tsx"
      provides: "useEffect를 통한 selectedIndex 리셋 로직"
      contains: "useEffect"
  key_links:
    - from: "SharedCardSelectModal"
      to: "open prop"
      via: "useEffect dependency"
      pattern: "useEffect.*open"
---

<objective>
한장공유모드 SharedCardSelectModal에서 두 번째 플레이 이후 카드 선택이 안 되는 버그 수정

Purpose: 모달의 `selectedIndex` 상태가 라운드 간 초기화되지 않아 이전 선택값이 남아있고, `handleSelect`에서 `selectedIndex !== null` 조건으로 모든 입력이 차단됨.
Output: 정상 동작하는 SharedCardSelectModal (매 라운드 깨끗한 상태로 시작)
</objective>

<execution_context>
@.claude/get-shit-done/workflows/execute-plan.md
@.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/client/src/components/modals/SharedCardSelectModal.tsx
@packages/client/src/components/modals/SejangCardSelectModal.tsx (참고: 동일 패턴의 올바른 구현)
</context>

<tasks>

<task type="auto">
  <name>Task 1: SharedCardSelectModal selectedIndex 리셋 useEffect 추가</name>
  <files>packages/client/src/components/modals/SharedCardSelectModal.tsx</files>
  <action>
    근본 원인: `selectedIndex`가 `useState(null)`로 초기화되지만, 컴포넌트가 언마운트되지 않고 `open` prop만 변경되므로 이전 라운드의 선택값이 유지됨. `handleSelect`의 `selectedIndex !== null` 가드가 모든 클릭을 차단.

    수정 사항:
    1. `useEffect` import 추가 (기존 `useState`와 함께)
    2. `open` prop이 변경될 때 `selectedIndex`를 null로 리셋하는 useEffect 추가:
       ```
       useEffect(() => {
         if (open) {
           setSelectedIndex(null);
         }
       }, [open]);
       ```
    3. SejangCardSelectModal의 동일 패턴(27-32행)을 참조하여 일관성 유지

    이 패턴은 SejangCardSelectModal에서 이미 검증된 방식이며, `open`이 true로 변경될 때만 리셋하여 불필요한 상태 변경을 방지.
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>SharedCardSelectModal이 매 라운드 모달 오픈 시 selectedIndex를 null로 리셋하여, 두 번째 이후 플레이에서도 선 플레이어가 카드를 정상 선택할 수 있음</done>
</task>

</tasks>

<verification>
- TypeScript 컴파일 에러 없음
- useEffect가 open dependency로 selectedIndex를 리셋하는 로직 존재 확인
- SejangCardSelectModal과 동일한 리셋 패턴 적용 확인
</verification>

<success_criteria>
한장공유모드에서 연속 플레이 시 SharedCardSelectModal이 매번 깨끗한 상태(selectedIndex=null)로 열려 선 플레이어가 카드를 선택할 수 있음
</success_criteria>

<output>
완료 후 `.planning/quick/260404-tat-shared-card-selection-stuck-bug/260404-tat-SUMMARY.md` 생성
</output>
