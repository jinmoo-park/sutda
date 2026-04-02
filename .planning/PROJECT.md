# 온라인 섯다 (친구들끼리)

## What This Is

친구들끼리만 접속해서 즐기는 온라인 한국 화투 카드 게임 섯다. 방장이 링크를 공유하면 초대받은 플레이어들이 닉네임만으로 참여할 수 있는 웹 앱이다. 하우스룰(rule_draft.md)을 기반으로 오리지날·세장·공유패·골라골라·인디언섯다 5가지 게임 모드와 구사 재경기, 땡값 등 하우스 룰을 모두 구현한다.

## Core Value

**아무 설치 없이 링크 하나로 친구들과 실시간으로 섯다를 즐길 수 있어야 한다.**

## Requirements

### Validated

**카드/덱 (Phase 01에서 검증)**
- [x] 1~10 숫자 카드 각 2장(총 20장), 광/열끗 속성 포함 — Validated in Phase 01: project-foundation-shared-types

**족보 판정 (Phase 02에서 검증)**
- [x] 전체 족보 판정: 광땡 3종 > 장땡~일땡 > 알리~새륙 > 끗(망통~아홉끗) — Validated in Phase 02: hand-evaluator-engine
- [x] 구사·멍텅구리구사 재경기 트리거 로직 — Validated in Phase 02: hand-evaluator-engine
- [x] 땡잡이·암행어사 처리 (compareHands 특수 비교) — Validated in Phase 02: hand-evaluator-engine

**칩 시스템 및 정산 (Phase 05에서 검증)**
- [x] 칩/포인트 추적 (ChipBreakdown, effectiveMaxBet) — Validated in Phase 05: chip-system-settlement
- [x] 금액 소진 시 재충전 플로우 (다른 플레이어 동의 필요) — Validated in Phase 05: chip-system-settlement
- [x] 게임 결과 pot 정산 (settleChips) + chips 차감 (attendSchool, bet actions) — Validated in Phase 05: chip-system-settlement

### Validated (continued)

**인프라 (Phase 03에서 검증)**
- [x] 실시간 멀티플레이어 동기화 (WebSocket/Socket.IO) — Validated in Phase 03: websocket
- [x] 링크 공유로 방 참여 (방 코드 포함 URL) — Validated in Phase 03: websocket
- [x] 닉네임만으로 입장, 회원가입 불필요 — Validated in Phase 03: websocket

**오리지날 모드 게임 엔진 (Phase 04에서 검증)**
- [x] 셔플 + 기리/퉁 메커니즘 구현 — Validated in Phase 04: original-mode-game-engine
- [x] 패 돌리기: 반시계 방향, 퉁 시 2장씩 — Validated in Phase 04: original-mode-game-engine
- [x] **패 공개 액션**: showdown에서 각자 "공개" 버튼, 전원 공개 후 승패 판정 — Validated in Phase 04: original-mode-game-engine
- [x] 콜 / 레이즈 (자유 금액) / 다이 / 체크 — Validated in Phase 04: original-mode-game-engine
- [x] 오리지날: 2장 + 베팅 + 족보 비교 — Validated in Phase 04: original-mode-game-engine
- [x] 선 결정: 첫판 밤일낮장(18:00~05:59 낮은 숫자, 06:00~17:59 높은 숫자) — Validated in Phase 04: original-mode-game-engine
- [x] 동점 재경기(rematch-pending): 동점자만 참여, pot 유지, 앤티 없음 — Validated in Phase 04: original-mode-game-engine

### Active

**핵심 인프라**
- [ ] 2~6인 지원, 원형 자리 배치 (UI)

**족보 및 판정**
- [x] 전체 족보 판정: 광땡 3종 > 장땡~일땡 > 알리~새륙 > 끗(망통~아홉끗) — Phase 02 완료
- [x] 구사·멍텅구리구사 재경기 트리거 로직 — Phase 02 완료
- [x] 땡잡이·암행어사 처리 (땡값 없음) — Phase 02 완료

**베팅 시스템**
- [x] 칩/포인트 추적 (만원 단위, 기본 100,000원) — Phase 05 완료
- [x] 금액 소진 시 만원 단위로 재충전 (다른 플레이어 동의 필요) — Phase 05 완료
- [ ] 땡값: 오리지날 모드 한정, 다이한 땡 보유자 → 승자에게 일땡~구땡 500원, 광땡·장땡 1000원

**게임 모드 (5종)**
- [x] 오리지날: 2장 + 베팅 + 족보 비교 — Phase 04 완료
- [ ] 세장섯다: 2장 → 베팅 → 1장 추가 → 3장 중 2장 조합
- [ ] 한장공유: 선이 공유패 1장 지정 → 각자 1장 받아 조합
- [x] 골라골라: 전 20장 공개 → 자유롭게 2장 선착순 선택 → 베팅 — Validated in Phase 08: huhwi-indian-modes
- [x] 인디언섯다: 1장 앞면 반대(나만 못 봄) → 베팅 → 1장 추가(나만 봄) → 최종 베팅 — Validated in Phase 08: huhwi-indian-modes

**선 결정**
- [ ] 첫판 밤일낮장: 서울 기준 18:00~05:59는 낮은 숫자, 06:00~17:59는 높은 숫자가 선

**94재경기**
- [ ] 일반 구사(4+9): 생존자 중 최고패가 알리 이하일 때 재경기, 죽은 플레이어는 판돈 절반 내고 재참여 가능
- [ ] 멍텅구리구사(열끗4+열끗9): 생존자 중 최고패가 팔땡 이하일 때 재경기

**UI / UX (와이어프레임 우선)**
- [ ] 게임 테이블: 원형 플레이어 배치, 각자 카드/칩 표시
- [ ] 베팅 액션 UI
- [ ] 족보 안내/힌트
- [ ] 이미지 에셋은 최후 단계에서 교체 (와이어프레임으로 시작)

### Out of Scope

- 실제 현금 결제/송금 — 친구들끼리 오프라인 정산을 전제로 하는 칩 추적만 구현
- 모바일 네이티브 앱 (iOS/Android) — 웹 앱의 모바일 브라우저 대응으로 충분
- 관전자 모드 — v1 범위 밖
- AI/봇 플레이어 — 친구들끼리 플레이가 목적
- 영구 계정/전적 저장 — 방 세션 단위로만 운영

## Context

- 한국 화투 카드 게임 섯다를 온라인으로 구현
- 하우스룰 원본은 `rule_draft.md` 참조 (족보·베팅·게임모드 상세 정의)
- 카드 구성: 1~10 각 2장 = 20장. 광: 1, 3, 8. 열끗 특수패 있는 숫자: 4, 7, 9
- 실시간 멀티플레이어가 핵심이므로 WebSocket 기반 서버 필수
- 와이어프레임으로 시작 → 화투 이미지 에셋은 마지막 단계에서 교체
- 배포 대상: 소수 친구들 전용, 고가용성·글로벌 스케일 불필요

## Constraints

- **플랫폼**: 웹 앱 — 설치 없이 링크로 접속 가능해야 함
- **인증**: 없음 — 닉네임만으로 입장 (회원가입 불필요)
- **UI 단계**: 와이어프레임 → 이미지 교체는 별도 마지막 페이즈
- **스케일**: 소규모 (최대 6인 방, 친구 그룹 수 개)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 웹 앱 선택 | 설치 없이 링크 공유만으로 친구들이 즉시 접속 가능 | — Pending |
| 링크 공유 입장 | 회원가입 없이 닉네임만으로 참여, 마찰 최소화 | — Pending |
| 와이어프레임 우선 | UI 이미지 준비 전에 게임 로직 먼저 완성 | — Pending |
| 5가지 모드 모두 v1 포함 | rule_draft에 정의된 하우스룰 전체 구현 | — Pending |
| 칩/포인트 추적 | 가상 칩으로 게임 내 금액 추적, 실제 정산은 플레이어 간 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 — Phase 12.1 complete: OWASP Top 10 보안 감사 완료, CORS/rate limiting/send-chat 접근 제어/nginx 보안 헤더 적용
