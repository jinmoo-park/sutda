# Phase 3: WebSocket 인프라 + 방 관리 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 03-websocket
**Areas discussed:** 방 코드 형식, 재접속 플레이어 인식, 메시지 프로토콜 구조, 방장 권한 범위

---

## 방 코드 형식

| Option | Description | Selected |
|--------|-------------|----------|
| 짧은 영문+숫자 코드 (ABC12) | 6자 랜덤 코드, 공유 쉽고 직접 입력 가능 | |
| UUID (v4) | 절대 충돌 없음, 링크 클릭 위주 환경에 적합 | ✓ |
| 커스텀 방 이름 | 방장이 이름 직접 입력, 중복 처리 복잡 | |

**후속 질문: UUID 전체 vs 앞 8자**

| Option | Description | Selected |
|--------|-------------|----------|
| 완전한 UUID (32자) | 절대 충돌 없음 | |
| 앞 8자만 단축 | 카카오톡에서 더 드러나 보임, 충돌 가능성 무시 가능 | ✓ |

**User's choice:** UUID v4 앞 8자리 → `/room/f47ac10b`
**Notes:** 링크 클릭 위주 환경이라 직접 입력 불필요 → UUID 안전성 선호. 단, 너무 긴 URL은 싫어서 8자로 단축.

---

## 재접속 플레이어 인식

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage 토큰 | 입장 시 임의 playerId 저장, 재접속 시 서버로 전송 | |
| 닉네임+방코드 | 재접속 시 닉네임 재입력으로 매핑 | ✓ |

**후속 질문: 닉네임 중복 허용 정책**

| Option | Description | Selected |
|--------|-------------|----------|
| 게임 진행 중에만 재접속 허용 | 대기실에서는 동일 닉네임 차단, 게임 중이면 복귀 | ✓ |
| 대기실에서도 재접속 허용 | 실수로 다른 사람이 닉네임을 쓴 접근도 허용 | |

**User's choice:** 닉네임+방코드, 게임 진행 중에만 재접속
**Notes:** 친구끼리라 같은 방에 같은 닉네임 쓸 일 없다고 판단.

---

## 메시지 프로토콜 구조

| Option | Description | Selected |
|--------|-------------|----------|
| 세분화된 이벤트 | 이벤트 이름이 의미를 가짐 (join-room, player-joined 등) | ✓ |
| 단일 액션 이벤트 | 'action'/'event' 하나로 통일, type 필드로 구분 | |

**사용자 질문:** "세분화된 이벤트와 단일 이벤트가 어떻게 다른지?" → 설명 후 세분화 방식 선택

**User's choice:** 세분화된 Socket.IO 이벤트
**Notes:** 설명 듣고 세분화 방식이 디버깅과 타입 추론에 유리하다고 판단.

---

## 방장 권한 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 방장: 게임 시작만 | 강제 퇴장 없음, 나머지 모두 동일 | ✓ |
| 방장: 시작 + 강제 퇴장 | 문제 있는 플레이어 퇴장 가능 | |

**후속 질문: 방장 나갔을 때**

| Option | Description | Selected |
|--------|-------------|----------|
| 입장 순서 다음 사람 승계 | 예측 가능하고 단순 | ✓ |
| 방장 없이 방 유지 | 게임 시작 불가 상태 발생 | |

**User's choice:** 게임 시작만 방장 전용, 나가면 다음 입장자 승계
**Notes:** 친구끼리라 강제 퇴장 기능 불필요.

---

## Claude's Discretion

- Socket.IO 버전 및 CORS 설정 세부 옵션
- RoomState 인터페이스 상세 필드 구성
- 재접속 타임아웃 처리 기간
- 에러 코드 목록 설계

## Deferred Ideas

- 방 목록/로비 → Out of Scope
- 턴 타이머/자동 다이 → v2
