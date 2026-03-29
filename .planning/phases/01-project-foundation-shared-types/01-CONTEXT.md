# Phase 1: 프로젝트 기반 + 공유 타입 - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

TypeScript 모노레포(shared/server/client) 초기 구조 설정 및 서버-클라이언트가 공유하는 타입 계약 수립.
이 페이즈는 이후 모든 개발의 기반이 되는 코어 타입과 빌드 인프라를 확립한다.

**포함:** 모노레포 세팅, 공유 패키지(shared), 카드/게임 코어 타입 정의, 20장 덱 생성 함수
**미포함:** WebSocket 서버 구현, 실제 게임 로직, UI 컴포넌트 (이후 페이즈)

</domain>

<decisions>
## Implementation Decisions

### 패키지 매니저 & 모노레포 툴
- **D-01:** 패키지 매니저는 **pnpm workspaces** 사용
- **D-02:** 모노레포 빌드 오케스트레이션은 **turborepo** 추가 (build 순서 자동화 및 캐시)
- **D-03:** turbo.json에서 shared → server, shared → client 의존성 빌드 파이프라인 구성

### 서버 런타임
- **D-04:** 서버 런타임은 **Node.js** 사용 (Socket.IO 공식 지원, 레퍼런스 풍부)

### 클라이언트 프레임워크
- **D-05:** 클라이언트는 **React + Vite** 사용
- **D-06:** SSR/SSG 불필요한 실시간 SPA — Next.js 배제

### 공유 타입 범위
- **D-07:** Phase 1에서는 **코어 타입만** 정의 (Card, CardRank, CardAttribute, GameState, PlayerState)
- **D-08:** 메시지 프로토콜 타입(ClientToServer / ServerToClient)은 **Phase 3**에서 Socket.IO 구현과 함께 정의
- **D-09:** DECK-01 요건에 맞게 20장 덱 생성 함수(`createDeck()`)를 shared에 구현

### WebSocket 라이브러리 (Phase 3 예약)
- **D-10:** Phase 3에서 **Socket.IO** 사용 예정 — Phase 1 타입 설계 시 이 결정을 고려하되, 메시지 타입 정의는 Phase 3으로 위임

### Claude's Discretion
- TypeScript strict mode 설정 여부 — strict: true 권장
- tsconfig.json 공유 방식 (tsconfig.base.json 상속 패턴)
- pnpm-workspace.yaml 패키지 경로 구성
- turbo.json 태스크 파이프라인 세부 설정

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 게임 규칙 (카드/덱 구성 정의)
- `rule_draft.md` — 섯다 하우스룰 원본. 카드 구성(1~10 각 2장, 광: 1,3,8 / 열끗 특수: 4,7,9), 족보, 게임 모드 상세 정의. Phase 1 카드 타입 설계의 기준 문서.

### 요건 추적
- `.planning/REQUIREMENTS.md` §DECK-01 — 카드 속성(광/열끗/일반) 및 덱 구성 요건 정의. shared Card 타입의 기준.

### 프로젝트 컨텍스트
- `.planning/PROJECT.md` — 모노레포 구조 결정 및 전체 아키텍처 방향

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 없음 (프로젝트 초기 상태 — rule_draft.md와 이미지 파일만 존재)

### Established Patterns
- 없음 (이 페이즈에서 패턴 수립)

### Integration Points
- shared 패키지는 server/와 client/ 양쪽에서 import 가능해야 함
- DECK-01: 카드 타입에 숫자(1~10), 광/열끗/일반 속성이 반드시 포함되어야 함

</code_context>

<specifics>
## Specific Ideas

- 폴더 구조: `packages/shared/` (또는 `shared/`) → server/client에서 `@sutda/shared`로 import
- 카드 속성 구분: 광(1,3,8) / 열끗특수(4,7,9) / 일반(2,5,6,10) — 족보 판정에 광/열끗 속성이 필수
- 덱 생성 함수는 순수 함수로 작성 (Phase 2 TDD의 기반)

</specifics>

<deferred>
## Deferred Ideas

- 메시지 프로토콜 타입 (ClientToServer/ServerToClient) → Phase 3
- Socket.IO 서버 구현 → Phase 3
- 게임 엔진 타입 (BettingState, RoundState 등 세부) → Phase 4에서 필요 시 확장

</deferred>

---

*Phase: 01-project-foundation-shared-types*
*Context gathered: 2026-03-29*
