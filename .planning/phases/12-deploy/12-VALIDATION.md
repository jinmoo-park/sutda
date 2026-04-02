---
phase: 12
slug: deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (client) + vitest (server) |
| **Config file** | `packages/client/vitest.config.ts`, `packages/server/vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | SEAT-01 | manual | SSH + browser test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. 배포 phase는 인프라 설정이 주요 작업이므로 새로운 테스트 인프라 추가 불필요.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 배포 URL 접속 | SEAT-01 | 외부 서버 접속 필요 | 브라우저에서 DuckDNS URL 접속 확인 |
| WebSocket 연결 | SEAT-01 | 실제 네트워크 환경 필요 | 방 생성 → 링크 공유 → 입장 → 게임 플레이 |
| 모바일 브라우저 | SEAT-01 | 실제 기기 필요 | 모바일 브라우저에서 게임 테이블 + 베팅 UI 확인 |
| 재접속 안정성 | SEAT-01 | 실제 네트워크 환경 필요 | 게임 중 네트워크 끊기 → 재접속 → 상태 복구 확인 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
