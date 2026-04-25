---
status: complete
quick_id: 260426-1xi
slug: 100-000-ui
completed: 2026-04-26
---

# Summary: Initial Chips Stepper UI

## Completed
- Added a shared `InitialChipsStepper` component for entry screens.
- Replaced direct number inputs on both host room creation and invited-player room entry.
- Kept `initialChips` as a numeric payload while displaying the value with `ko-KR` thousand separators.
- Enforced 10,000 chip increments with minus/plus icon buttons and a 10,000 minimum.
- Added entry screen styles matching the existing overlay form.
- Added a focused static regression test for the shared stepper usage, 100,000 default, 10,000 step, comma formatting, and no direct number inputs.

## Verification
- `pnpm --dir packages/client build` passed.
- `pnpm --dir packages/client test src/pages/__tests__/InitialChipsEntry.test.tsx` passed.
- `pnpm --dir packages/client test` still fails on pre-existing unrelated static expectations in `HandPanel.test.tsx`, `GameLayout.test.tsx`, and `BettingPanel.test.tsx`.
