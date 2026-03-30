---
phase: 7
slug: sejang-hanjang-modes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | `packages/server/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @sutda/server test --run` |
| **Full suite command** | `pnpm -r test --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @sutda/server test --run`
- **After every plan wave:** Run `pnpm -r test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-??-01 | 01 | 0 | MODE-SJ-01, MODE-SJ-02 | unit | `pnpm --filter @sutda/server test --run -- game-engine-sejang` | ❌ W0 | ⬜ pending |
| 7-??-02 | 01 | 0 | MODE-SH-01~04 | unit | `pnpm --filter @sutda/server test --run -- game-engine-hanjang` | ❌ W0 | ⬜ pending |
| 7-??-03 | TBD | 1+ | MODE-SJ-01 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ W0 | ⬜ pending |
| 7-??-04 | TBD | 1+ | MODE-SJ-02 | integration | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ W0 | ⬜ pending |
| 7-??-05 | TBD | 1+ | MODE-SH-01 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ W0 | ⬜ pending |
| 7-??-06 | TBD | 1+ | MODE-SH-02 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ W0 | ⬜ pending |
| 7-??-07 | TBD | 1+ | MODE-SH-03 | unit | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ W0 | ⬜ pending |
| 7-??-08 | TBD | 1+ | MODE-SH-04 | integration | `pnpm --filter @sutda/server test --run -- game-engine` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/server/src/__tests__/game-engine-sejang.test.ts` — MODE-SJ-01, MODE-SJ-02 테스트 스텁
- [ ] `packages/server/src/__tests__/game-engine-hanjang.test.ts` — MODE-SH-01 ~ MODE-SH-04 테스트 스텁
- [ ] `packages/server/src/integration.test.ts` — 신규 phase 브로드캐스트 케이스 추가

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 모드 선택 UI (선 플레이어만 보임) | MODE-SJ-01, MODE-SH-01 | 브라우저 렌더링/소켓 흐름 수동 확인 필요 | 1) 두 브라우저 탭 열기 2) 선 탭에서 모드 선택 모달 표시 확인 3) 비선 탭에는 모달 없음 확인 |
| 세장섯다 3장 중 2장 선택 인터랙션 | MODE-SJ-02 | 클라이언트 카드 선택 UI | 1) 세장섯다 게임 시작 2) extra card 배분 후 2장 선택 UI 표시 확인 3) 선택 후 족보 계산 확인 |
| 한장공유 공유카드 지정 UI | MODE-SH-02 | 딜러의 카드 지정 인터랙션 | 1) 한장공유 게임 시작 2) 딜러가 공유카드 선택 UI 표시 확인 3) 나머지 플레이어에게 공유카드 공개 확인 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
