---
phase: 10
slug: ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3 + @testing-library/react 16 |
| **Config file** | `packages/client/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @sutda/client test` |
| **Full suite command** | `pnpm --filter @sutda/client test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @sutda/client test`
- **After every plan wave:** Run `pnpm --filter @sutda/client test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-xx-01 | IMG | 1 | IMG-01 | unit | `vitest run src/components/game/__tests__/HwatuCard.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 10-xx-02 | IMG | 1 | IMG-01 | unit | `vitest run src/lib/cardImageUtils.test.ts` | ❌ Wave 0 | ⬜ pending |
| 10-xx-03 | UX | 2 | UX-03/05 | unit | `vitest run src/components/layout/__tests__/HandPanel.test.tsx` | ✅ 수정 필요 | ⬜ pending |
| 10-xx-04 | BET | 2 | BET-HIGHLIGHT | unit | `vitest run src/components/layout/__tests__/BettingPanel.test.tsx` | ✅ 수정 필요 | ⬜ pending |
| 10-xx-05 | LAYOUT | 2 | UX-09 | unit | `vitest run src/components/layout/__tests__/GameLayout.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 10-xx-06 | UX | 3 | UX-07/08 | manual | — | manual-only | ⬜ pending |
| 10-xx-07 | UX | 3 | UX-06 | manual | — | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/client/src/components/game/__tests__/HwatuCard.test.tsx` — IMG-01 커버 (카드 이미지 렌더링 검증)
- [ ] `packages/client/src/components/layout/__tests__/GameLayout.test.tsx` — UX-09 커버 (3열 레이아웃 클래스 존재 확인)
- [ ] `packages/client/src/lib/cardImageUtils.ts` — getCardImageSrc 유틸 + 테스트 (rank/attribute → 파일 경로 매핑)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 셔플 rAF 애니메이션 루프 | UX-07 | performance.now() 타이밍 의존 — jsdom에서 의미있는 자동화 불가 | 셔플 버튼 누르는 동안 카드 섞임 루프 확인, 떼면 즉시 정지 |
| 기리 드래그/탭 인터랙션 | UX-08 | 실제 드래그 이벤트 체인 의존 — jsdom에서 포인터 좌표 없음 | 더미 분리 드래그, 탭으로 순서 지정, 합치기 완료 확인 |
| 카드 배분 날아오기 애니메이션 | UX-06 | DOM 실제 레이아웃 위치 계산 필요 — 브라우저 환경에서만 검증 가능 | 게임 시작 시 카드가 중앙에서 날아와 각 플레이어 위치에 도착 확인 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
