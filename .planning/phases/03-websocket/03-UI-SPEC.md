---
phase: 3
slug: websocket
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-29
---

# Phase 3 — UI Design Contract

> WebSocket 인프라 + 방 관리 페이즈의 시각/인터랙션 계약. gsd-ui-researcher 생성, gsd-ui-checker 검증 대상.

---

## Phase UI 범위 판정

**이 페이즈는 서버 전용 인프라 페이즈이다.**

CONTEXT.md 명시 사항:
- **포함:** Socket.IO 서버 세팅, 방 생성/참여/퇴장 이벤트, 메시지 프로토콜 타입 정의, 재접속 처리, 방장 관리, 초기 칩 설정
- **미포함:** 게임 엔진 FSM, 덱 배분, 베팅 로직, **UI (이후 Phase)**

UI 요건(UI-01~UI-08)은 모두 Phase 6에 매핑되어 있다. Phase 3에는 프론트엔드 컴포넌트 구현 요건이 없다.

**그러나** Socket.IO 통합 테스트를 위한 최소한의 연결 상태 표시 UI가 필요할 수 있다. 아래 계약은 테스트/디버그 목적의 최소 UI와, Phase 6 이후에서 재사용할 메시지 프로토콜 타입의 UI 계약 기반을 정의한다.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Phase 3에서 초기화하지 않음) |
| Preset | not applicable |
| Component library | none (Phase 6에서 결정) |
| Icon library | none (Phase 6에서 결정) |
| Font | 시스템 기본 폰트 (`system-ui, -apple-system, sans-serif`) |

**근거:** Phase 3은 서버 인프라 구축이 목적이다. 디자인 시스템 초기화는 프론트엔드 구현이 시작되는 Phase 6에서 수행한다. 이 시점에서 shadcn을 초기화하면 불필요한 의존성이 추가된다.

---

## Spacing Scale

이 페이즈에서는 UI 컴포넌트를 구현하지 않으므로 spacing 토큰을 정의하지 않는다.

Phase 6 UI-SPEC에서 전체 spacing scale을 정의할 예정.

---

## Typography

이 페이즈에서는 UI 컴포넌트를 구현하지 않으므로 typography 토큰을 정의하지 않는다.

테스트용 연결 상태 표시가 필요한 경우, 브라우저 기본 폰트 16px을 사용한다.

---

## Color

이 페이즈에서는 UI 컴포넌트를 구현하지 않으므로 color 토큰을 정의하지 않는다.

테스트용 연결 상태 표시가 필요한 경우:

| 상태 | 색상 | 용도 |
|------|------|------|
| 연결됨 | `#22c55e` (green-500) | WebSocket 연결 성공 표시 |
| 연결 끊김 | `#ef4444` (red-500) | WebSocket 연결 실패/끊김 표시 |
| 연결 중 | `#eab308` (yellow-500) | 재접속 시도 중 표시 |

---

## Copywriting Contract

Phase 3 서버 이벤트에서 클라이언트로 전달되는 에러 메시지의 카피라이팅 계약을 정의한다. 이 메시지들은 Phase 6 UI에서 그대로 사용자에게 표시된다.

### 에러 메시지 (ServerToClient `error` 이벤트)

| 에러 코드 | 메시지 (한국어) | 상황 |
|-----------|----------------|------|
| `ROOM_NOT_FOUND` | "존재하지 않는 방입니다. 링크를 다시 확인해주세요." | 잘못된 roomId로 접속 시도 |
| `ROOM_FULL` | "방이 가득 찼습니다. (최대 6명)" | 7번째 플레이어 입장 시도 |
| `NICKNAME_TAKEN` | "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요." | 대기실에서 동일 닉네임 시도 |
| `NOT_HOST` | "방장만 게임을 시작할 수 있습니다." | 비방장이 start-game 시도 |
| `MIN_PLAYERS` | "최소 2명이 필요합니다." | 1명일 때 게임 시작 시도 |
| `GAME_IN_PROGRESS` | "게임이 이미 진행 중입니다." | 진행 중 방에 신규 입장 시도 |
| `INVALID_CHIPS` | "초기 칩은 10,000원 단위로 입력해주세요." | 만원 단위가 아닌 칩 입력 |

### 연결 상태 메시지

| 상태 | 메시지 |
|------|--------|
| 연결 성공 | "서버에 연결되었습니다." |
| 연결 끊김 | "연결이 끊어졌습니다. 재접속 시도 중..." |
| 재접속 성공 | "다시 연결되었습니다." |
| 재접속 실패 | "서버에 연결할 수 없습니다. 페이지를 새로고침 해주세요." |

---

## 상태 표시 계약 (Phase 6 UI 연결 기반)

Phase 3에서 정의하는 `RoomState`/`PlayerState`가 Phase 6 UI에 어떻게 매핑되는지의 계약.

### 방 상태 → UI 상태 매핑

| RoomState 필드 | UI 표현 | 담당 Phase |
|----------------|---------|-----------|
| `roomId` | URL 표시줄 + 공유 버튼의 링크 복사 대상 | Phase 6 |
| `players[]` | 원형 테이블의 플레이어 자리 배치 | Phase 6 |
| `hostId` | 방장 뱃지 표시 (왕관 아이콘 또는 텍스트) | Phase 6 |
| `gamePhase: 'waiting'` | "대기 중" 상태 표시 + 게임 시작 버튼(방장만 활성) | Phase 6 |
| `players.length` | "N/6명" 인원 표시 | Phase 6 |

### 플레이어 입장 플로우 → UI 인터랙션 매핑

| 서버 이벤트 | UI 반응 | 담당 Phase |
|-------------|---------|-----------|
| `room-created` | 방 URL 표시 + 클립보드 복사 버튼 제공 | Phase 6 |
| `player-joined` | 빈 자리에 플레이어 아바타/닉네임 표시 | Phase 6 |
| `player-left` | 해당 자리 비움 + 방장 변경 시 뱃지 이동 | Phase 6 |
| `room-state` | 전체 방 상태 동기화 (재접속 시) | Phase 6 |
| `error` | 에러 토스트 또는 모달 표시 | Phase 6 |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | 해당 없음 | not required |

Phase 3에서는 UI 컴포넌트 라이브러리를 사용하지 않는다.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (에러 메시지 7종 + 연결 상태 4종 정의됨)
- [ ] Dimension 2 Visuals: N/A (서버 전용 페이즈 — UI 컴포넌트 없음)
- [ ] Dimension 3 Color: N/A (테스트용 연결 상태 색상 3종만 정의)
- [ ] Dimension 4 Typography: N/A (서버 전용 페이즈)
- [ ] Dimension 5 Spacing: N/A (서버 전용 페이즈)
- [ ] Dimension 6 Registry Safety: PASS (서드파티 레지스트리 없음)

**Approval:** pending
