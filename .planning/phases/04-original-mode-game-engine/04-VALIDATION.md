---
phase: 4
slug: original-mode-game-engine
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
---

# Phase 4 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^3 |
| **Config file** | `packages/server/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @sutda/server test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @sutda/server test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

각 플랜이 TDD 방식(tdd="true")으로 테스트를 먼저 작성하므로 별도의 Wave 0 태스크가 불필요하다. 테스트 파일은 각 태스크 내에서 RED -> GREEN 순서로 생성된다.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 4-01-T1 | 01 | 1 | SEAT-01, SEAT-02, SEAT-03, DECK-02~05, MODE-OG-01 | unit (TDD) | `pnpm --filter @sutda/shared build && pnpm --filter @sutda/server test` | pending |
| 4-02-T1 | 02 | 2 | BET-01, BET-02, BET-03, BET-04, BET-05, BET-06 | unit (TDD) | `pnpm --filter @sutda/server test` | pending |
| 4-02-T2 | 02 | 2 | MODE-OG-02, D-22~D-24 | unit+integration (TDD) | `pnpm --filter @sutda/shared build && pnpm --filter @sutda/server test` | pending |
| 4-03-T1 | 03 | 3 | SEAT-01, MODE-OG-02 | integration | `pnpm --filter @sutda/server test` | pending |

*Status: pending / green / red / flaky*

---

## TDD Nyquist Compliance

모든 코드 생성 태스크(04-01 Task 1, 04-02 Task 1/2)가 `tdd="true"` 속성을 가지며, 테스트를 먼저 작성(RED)한 후 구현(GREEN)하는 방식으로 진행한다. 이를 통해:

- 모든 태스크가 `<automated>` verify 명령을 보유
- 연속 3개 태스크가 automated verify 없이 지나가는 경우 없음
- 별도 Wave 0 없이도 테스트 커버리지 확보

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 등교 버튼 클릭으로 앤티 차감 | SEAT-01 | Socket.IO UI 인터랙션 | 클라이언트에서 등교 버튼 클릭 후 서버 상태 확인 |
| 20장 카드 선택 UI | SEAT-02 | 프론트엔드 컴포넌트 (Phase 6 범위) | 서버 이벤트만 단위 테스트로 커버 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or TDD-based test creation
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] TDD plans cover all requirements (Wave 0 unnecessary)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
