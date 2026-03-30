---
phase: 9
slug: 94
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `packages/server/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @sutda/server test --run` |
| **Full suite command** | `pnpm --filter @sutda/server test --run && pnpm --filter @sutda/shared test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @sutda/server test --run`
- **After every plan wave:** Run `pnpm --filter @sutda/server test --run && pnpm --filter @sutda/shared test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | RULE-01, RULE-02, RULE-03 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 | ⬜ pending |
| 09-01-02 | 01 | 1 | MODE-OG-03 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ✅ 확장 필요 | ⬜ pending |
| 09-01-03 | 01 | 1 | RULE-01 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ✅ 확장 필요 | ⬜ pending |
| 09-01-04 | 01 | 1 | RULE-02 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ✅ 확장 필요 | ⬜ pending |
| 09-01-05 | 01 | 2 | RULE-03 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 | ⬜ pending |
| 09-01-06 | 01 | 2 | RULE-04 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ✅ 확장 필요 | ⬜ pending |
| 09-02-01 | 02 | 2 | D-07 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/server/src/game-engine.test.ts` 내 `gusa-pending` describe 블록 추가 — RULE-03, D-07 커버
- [ ] `packages/shared/src/types/game.ts` — `GamePhase`에 `'gusa-pending'` 추가
- [ ] `packages/shared/src/types/game.ts` — `GameState`에 `gusaPendingDecisions`, `ttaengPayments` 필드 추가

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 재경기 15초 타임아웃 모달 UX | RULE-03 (D-08) | 클라이언트 시각적 카운트다운 | 재경기 트리거 후 15초 카운트다운 모달 표시 확인, 타임아웃 시 자동 거절 처리 |
| 땡값 결과 화면 표시 | MODE-OG-03 (D-05) | UI 레이아웃 검증 | 오리지날 모드 라운드 후 "땡값 납부: X원" 항목이 기존 pot 정산과 구분된 섹션으로 표시 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
