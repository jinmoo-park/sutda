---
phase: 6
slug: ui
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-30
---

# Phase 6 — Validation Strategy

> 실행 중 피드백 샘플링을 위한 페이즈별 검증 계약.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `packages/client/vitest.config.ts` (Plan 01 Task 1에서 생성) |
| **Quick run command** | `pnpm --filter @sutda/client test` |
| **Full suite command** | `pnpm --filter @sutda/client test --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @sutda/client test -- [해당 컴포넌트]`
- **After every plan wave:** Run `pnpm --filter @sutda/client test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | — | infra+wave0 | `pnpm --filter @sutda/client test` | Plan 01 Task 1 생성 | ⬜ pending |
| 06-01-02 | 01 | 1 | UI-08 | unit | `pnpm --filter @sutda/client test -- cardUtils` | Plan 01 Task 2 생성 | ⬜ pending |
| 06-02-01 | 02 | 2 | UI-03 | unit+stub | `pnpm --filter @sutda/client test -- CardFace` | Wave 0 스텁 존재 | ⬜ pending |
| 06-02-02 | 02 | 2 | UI-04,UI-07 | unit+stub | `pnpm --filter @sutda/client test -- "BettingPanel\|HandPanel"` | Wave 0 스텁 존재 | ⬜ pending |
| 06-02-03 | 02 | 2 | UI-01,UI-02,UI-05 | unit+stub | `pnpm --filter @sutda/client test -- "MainPage\|GameTable"` | Wave 0 스텁 존재 | ⬜ pending |
| 06-03-01 | 03 | 3 | UI-06,UI-07 | unit+stub | `pnpm --filter @sutda/client test -- ResultScreen` | Wave 0 스텁 존재 | ⬜ pending |
| 06-03-02 | 03 | 3 | — | build | `pnpm --filter @sutda/client build` | — | ⬜ pending |
| 06-03-03 | 03 | 3 | ALL | manual | 시각 검증 (checkpoint:human-verify) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `packages/client/vitest.config.ts` — `environment: 'jsdom'`, `globals: true` 설정 (Plan 01 Task 1)
- [x] `packages/client/src/test/setup.ts` — `@testing-library/jest-dom` 확장 (Plan 01 Task 1)
- [x] 프레임워크 설치 (Plan 01 Task 1)
- [x] `packages/client/package.json`에 `"test": "vitest run"` 스크립트 추가 (Plan 01 Task 1)
- [x] Wave 0 테스트 스텁 파일 6개 생성 (Plan 01 Task 1):
  - `src/pages/__tests__/MainPage.test.tsx`
  - `src/components/game/__tests__/CardFace.test.tsx`
  - `src/components/layout/__tests__/BettingPanel.test.tsx`
  - `src/components/layout/__tests__/GameTable.test.tsx`
  - `src/components/layout/__tests__/ResultScreen.test.tsx`
  - `src/components/layout/__tests__/HandPanel.test.tsx`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 원형 배치 시각적 정렬 | UI-02 | CSS layout은 픽셀 단위 시각 검증 필요 | 브라우저에서 2~6인 게임 로드, 자리 배치 확인 |
| 모바일 반응형 레이아웃 | UI-02, UI-04 | 다양한 화면 크기 직접 확인 필요 | Chrome DevTools에서 320px~1440px 뷰포트 테스트 |
| 웹소켓 실시간 카드 업데이트 | UI-03 | 실시간 통신은 서버 연동 필요 | 두 브라우저 탭에서 게임 진행, 카드 표시 동기화 확인 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (revision pass)
