---
phase: 4
slug: original-mode-game-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 4 — Validation Strategy

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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-W0-01 | 01 | 0 | SEAT-02, SEAT-03, DECK-02~05, BET-01~06, MODE-OG-02 | unit/integration | `pnpm --filter @sutda/server test` | ❌ Wave 0 | ⬜ pending |
| 4-01-01 | 01 | 1 | SEAT-01, SEAT-02, SEAT-03 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 | ⬜ pending |
| 4-02-01 | 02 | 1 | DECK-02, DECK-03, DECK-04, DECK-05 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 | ⬜ pending |
| 4-03-01 | 03 | 2 | BET-01, BET-02, BET-03, BET-04, BET-05, BET-06 | unit | `pnpm --filter @sutda/server test` | ❌ Wave 0 | ⬜ pending |
| 4-04-01 | 04 | 2 | MODE-OG-01, MODE-OG-02 | integration | `pnpm --filter @sutda/server test` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/server/src/game-engine.test.ts` — GameEngine 단위 테스트 (모든 REQ 커버: SEAT-02, SEAT-03, DECK-02~05, BET-01~06, MODE-OG-02)
- [ ] `packages/server/src/game-engine.ts` — GameEngine 구현체 (테스트 우선 작성 후 구현)

*기존 vitest 인프라는 준비됨. 새 파일만 추가하면 됨.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 등교 버튼 클릭으로 앤티 차감 | SEAT-01 | Socket.IO UI 인터랙션 | 클라이언트에서 등교 버튼 클릭 후 서버 상태 확인 |
| 20장 카드 선택 UI | SEAT-02 | 프론트엔드 컴포넌트 (Phase 6 범위) | 서버 이벤트만 단위 테스트로 커버 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
