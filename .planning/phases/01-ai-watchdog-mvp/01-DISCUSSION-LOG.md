# Phase 1: AI Watchdog MVP - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the Q&A.

**Date:** 2026-04-05
**Phase:** 01-ai-watchdog-mvp
**Mode:** discuss
**Areas discussed:** 트리거 방식, MD 저장 위치

---

## Gray Areas Presented

- watchdog 위치 (독립 /opt vs 모노레포 apps/watchdog)
- MD 저장 위치 (VM 로컬 vs 로컬 직접 vs git 트래킹)
- 언어/런타임 (Python vs TypeScript)
- 트리거 방식 (수동 / cron / 둘 다)

**User selected:** 트리거 방식, MD 저장 위치

---

## Q&A

### 트리거 방식
| Question | Options Presented | Answer |
|----------|------------------|--------|
| watchdog 실행 트리거 방식은? | 수동+cron 둘 다 / 수동만 / cron만 | 수동 + cron 둘 다 |

### MD 저장 위치
| Question | Options Presented | Answer |
|----------|------------------|--------|
| 분석 결과 MD 파일 저장 위치는? | VM 로컬 저장 후 수동 pull / SSH 실행 후 로컬 저장 / git 트래킹 | VM 로컬 저장 (자동 스케줄 pull 가능한지 질문) |
| pull 전략 수정? | 수동 pull 스크립트 / 로컬 cron | pull-debug.sh를 Claude Code 세션 시작 시 자동 실행하면 어떤가? |

---

## Corrections / Clarifications

- **VM 로컬 + 자동 pull**: 로컬 cron 자동화는 로컬 머신 항시 켜져있어야 하는 문제 있음. 대신 `pull-debug.sh`를 Claude Code hooks로 세션 시작 시 실행하는 것으로 확정. 로컬 머신 항시 켜져있을 필요 없음.

---

## Claude's Discretion (not discussed)

- watchdog 위치: `/opt/ai-watchdog/` 권장 (VM 독립 운영 의도 반영)
- 구현 언어: Python 권장 (VM 독립 스크립트, 모노레포와 무관)
- CRITICAL_PATTERNS: 브리핑 초안 기반, VM 실제 로그 보고 튜닝
