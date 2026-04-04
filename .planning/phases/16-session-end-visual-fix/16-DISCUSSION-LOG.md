# Phase 16: SESSION-END 재접속 시각 표시 수정 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 16-session-end-visual-fix
**Areas discussed:** 서버 수정 범위, 재접속 UX 세부사항, 검증 방식

---

## 서버 수정 범위

**Q:** disconnect 시 room-state를 언제/어떻게 emit할까요?

| 선택지 | 설명 |
|--------|------|
| **즉시 emit** ✓ | disconnectPlayer() 직후 room-state to(roomId) broadcast |
| game-state에 포함 | PlayerState에 isConnected 필드 추가 — 공유 타입 변경 필요 |
| 별도 이벤트 | player-disconnected 이벤트 신설 — 클라이언트 핸들러 추가 필요 |

**선택:** 즉시 emit — 기존 패턴과 동일, 최소 변경

---

## 재접속 UX 세부사항

**Q:** 게임 중 플레이어가 접속 끊겼을 때 어떻게 표시할까요?

| 선택지 | 설명 |
|--------|------|
| **opacity-50만** ✓ | Phase 11 구현 그대로 활용 |
| opacity-50 + 텍스트 | '헤어집...' 배지 수동 추가 필요 |

**선택:** opacity-50만 — 이미 Phase 11에 '재접속 대기중' span 포함되어 있음, 데이터만 연결하면 충분

---

## 검증 방식

**Q:** VERIFICATION.md를 어떻게 작성할까요?

| 선택지 | 설명 |
|--------|------|
| **코드 검토만** ✓ | Phase 15 패턴, 트레이서빌리티 문서화 |
| 코드 + 수동 테스트 절차 | 실제 접속 끊김 시나리오 UAT 포함 |

**선택:** 코드 검토만 — Phase 15 gap-closure 패턴 동일 적용
