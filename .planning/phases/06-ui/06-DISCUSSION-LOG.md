# Phase 6: 클라이언트 UI 와이어프레임 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 06-ui
**Areas discussed:** 스타일링, 상태 관리 + Socket 연결, 라우팅, 원형 테이블 레이아웃 + 패널 구성

---

## 스타일링

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind + shadcn/ui | 유틸리티 CSS + headless 컴포넌트 조합 | ✓ |
| CSS Modules | 컴포넌트 스코프 CSS | |
| Plain CSS | 의존성 최소 | |
| MUI / Chakra | 완성형 컴포넌트 라이브러리 | |

**User's choice:** Tailwind CSS + shadcn/ui
**Notes:** 사업화 프로젝트가 아니지만 예외적으로 AI-slop 티 안 나고 세련된 UI를 원함. shadcn/ui 기본 컴포넌트를 게임 도메인에 맞게 커스터마이징.

---

## 상태 관리 + Socket 연결

| Option | Description | Selected |
|--------|-------------|----------|
| Zustand | 단일 스토어, socket 인스턴스 포함 | ✓ |
| Context + useReducer | React 내장 | |
| useState (컴포넌트별) | 단순, 소규모 적합 | |
| Redux Toolkit | 보일러플레이트 많음 | |

**User's choice:** Zustand
**Notes:** socket.io-client 연결 이슈 → Zustand action으로 초기화(싱글턴). 배포 환경은 Google Cloud Run — 서버 URL을 `VITE_SERVER_URL` 환경변수로 주입.

---

## 라우팅 / 화면 전환

| Option | Description | Selected |
|--------|-------------|----------|
| React Router v6 | 표준 라우터, 성능 최적화 | ✓ |
| URL 직접 파싱 | 의존성 없음, 단순 | |
| TanStack Router | 타입 안전, 신규 라이브러리 | |

**User's choice:** React Router v6 설치
**Notes:** 화면 흐름 — 방장 로비 생성 → URL 복사 → 다른 플레이어 접속 → 대기실 → 방장 시작 → 게임 테이블 → 결과.

---

## 원형 테이블 레이아웃 + 패널 구성

| Option | Description | Selected |
|--------|-------------|----------|
| CSS custom properties (--angle, --total, --i) | 사용자 제안 방식, 가변 인원 대응 | ✓ |
| CSS Grid 방사형 | Grid 기반 | |
| JS 좌표 계산 | sin/cos로 px 직접 계산 | |

**User's choice:** CSS custom properties 패턴
**Notes:**
- 패널 5개: 게임테이블 / 손패 / 베팅 / 정보 / 채팅(placeholder)
- 족보: 별도 패널 없이 손패 옆 인라인 표시
- 특수 액션 모달: 밤일낮장 / 등교(학교 간다 + 잠시 쉬기) / 셔플 / 기리 / 재충전 투표
- "잠시 쉬기" = Phase 4 D-03/D-04의 "등교 안 하기" 기능 (해당 판 패스)
- 모바일: Tailwind `md:` 브레이크포인트로 세로 레이아웃 전환

---

## Claude's Discretion

- 모바일 5개 패널 배치 순서 및 스크롤 구분
- shadcn/ui 컴포넌트 선택 (Button, Dialog, Badge, Card 등)
- 원형 컨테이너 실제 크기 및 반응형 반지름 값

## Deferred Ideas

- 채팅패널 실제 기능 (UX-02) — v2 요구사항, 후속 Phase로 defer
