# Phase 6: 클라이언트 UI 와이어프레임 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

플레이어가 웹 브라우저에서 로비 입장부터 게임 플레이까지 전체 경험을 할 수 있는 React 클라이언트를 구축한다.

범위: UI-01 ~ UI-08 (메인 화면 / 게임 테이블 / 카드 및 칩 표시 / 베팅 UI / 판 결과 / 족보 참고)
**포함하지 않는 것:** 채팅 기능 구현 (레이아웃 placeholder만 예약), 화투 이미지 에셋 교체 (Phase 10), 땡값/구사재경기 (Phase 9)

</domain>

<decisions>
## Implementation Decisions

### 스타일링
- **D-01:** Tailwind CSS + shadcn/ui 조합 채택. 클라이언트 패키지에 신규 설치.
- **D-02:** 와이어프레임이지만 AI-slop 티 나지 않는 세련된 UI를 목표로 한다. shadcn/ui 기본 컴포넌트를 그대로 쓰되, 게임 도메인에 맞게 커스터마이징. 과도한 그라데이션/그림자 남용 금지.

### 상태 관리 + Socket 연결
- **D-03:** **Zustand** 단일 스토어가 게임 상태 + socket.io-client 인스턴스 모두 관리.
- **D-04:** socket.io-client 연결은 Zustand action(`connect`)으로 초기화 (싱글턴 패턴). 서버 URL은 환경 변수(`VITE_SERVER_URL`)로 주입 — 로컬 개발과 Cloud Run 배포 모두 대응.
- **D-05:** 서버에서 오는 `game-state` 이벤트를 수신하면 Zustand 스토어를 갱신 → React 컴포넌트 자동 리렌더.

### 라우팅 / 화면 전환
- **D-06:** React Router v6 설치. 라우트 구조:
  - `/` → 메인 화면 (방 생성 / 링크 참여 선택)
  - `/room/:roomId` → 게임 테이블 (대기실 + 게임 진행 + 결과 — 단일 라우트 안에서 상태 머신으로 화면 전환)
- **D-07:** 화면 흐름:
  1. 방장 → 메인에서 "방 만들기" → 대기실 (URL 자동 생성, 복사 버튼 제공)
  2. 다른 플레이어 → URL 접속 → 닉네임 입력 → 대기실
  3. 방장 "게임 시작" 버튼 → 게임 테이블 전환
  4. 게임 종료 → 결과 화면 → "다음 판" 또는 "방 나가기"

### 원형 테이블 레이아웃
- **D-08:** CSS custom properties(--angle, --total, --i) 방식으로 원형 배치. 아래 패턴 채택:
  ```css
  .person {
    position: absolute;
    top: 50%; left: 50%;
    margin-top: -30px; margin-left: -30px;
    --angle: calc(360deg / var(--total) * var(--i));
    transform: rotate(var(--angle)) translateY(-200px) rotate(calc(var(--angle) * -1));
    transition: transform 0.5s ease;
  }
  ```
  인원수(`--total`)와 순서(`--i`)는 React에서 inline style로 주입. 2~6인 모두 동일 컴포넌트로 처리.
- **D-09:** 모바일(세로 화면)에서는 원형 레이아웃을 세로 스택 레이아웃으로 전환하는 반응형 처리 필요. Tailwind `md:` 브레이크포인트 기준으로 분기.

### 게임 화면 패널 구성
- **D-10:** 게임 테이블 화면은 5개 패널로 구성:
  1. **게임테이블패널** — 원형 플레이어 배치, 각자 현재 베팅 금액 표시
  2. **손패패널** — 내 손패 카드(숫자+속성 텍스트), 족보 자동 계산 인라인 표시
  3. **베팅패널** — 콜 / 레이즈 / 다이 / 체크 버튼 + 칩 더미 입력 (Phase 5 D-09)
  4. **정보패널** — 내 잔액, 상대 잔액, 현재 팟 금액
  5. **채팅패널** — **레이아웃 공간만 예약 (placeholder)**. 실제 기능은 후속 Phase에서 구현.
- **D-11:** 족보 참고표(UI-07)는 별도 패널 없음. 손패 영역 옆에 "무슨 패인지" 텍스트로 자동 표시.

### 특수 액션 모달
- **D-12:** 아래 액션은 별도 모달 팝업으로 처리 (게임 흐름 중단 없이 포커스 집중):
  - **밤일낮장 모달** — 20장 뒤집힌 카드 보드에서 플레이어가 1장 선택 (Phase 4 D-05, D-06)
  - **등교 모달** — "학교 간다" (500원 앤티 납부) / "잠시 쉬기" (해당 판 패스, 패 없음) 두 버튼 (Phase 4 D-03/D-04)
  - **셔플 모달** — 방장(선)이 셔플 확인 (Phase 4 DECK-02)
  - **기리 모달** — 더미 컷 위치 선택 + 재조립, 또는 "퉁" 선언 버튼 (Phase 4 D-09)
  - **재충전 투표 모달** — 재충전 요청/동의/거부 (Phase 5 D-05~D-06)

### Claude's Discretion
- 모바일 세로 레이아웃에서 5개 패널의 구체적 배치 순서 (스크롤 영역 구분 등)
- shadcn/ui 어떤 컴포넌트를 채택할지 (Button, Dialog, Badge, Card 등 조합)
- 원형 컨테이너 실제 크기와 반지름 값 (화면 크기별 반응형 조정)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 게임 규칙
- `rule_draft.md` — 게임 플로우 원문 (모달/액션 타이밍 확인 시 참조)

### 기존 컨텍스트 (확정된 선행 결정)
- `.planning/phases/04-original-mode-game-engine/04-CONTEXT.md` — 등교/기리/밤일낮장/쇼다운 모달 설계 근거 (D-02~D-18)
- `.planning/phases/05-chip-system-settlement/05-CONTEXT.md` — 칩 더미 베팅 입력 UX (D-09), 칩 아이콘 표시 (D-12), 재충전 이벤트 (D-08)
- `.planning/phases/03-websocket/03-CONTEXT.md` — Socket.IO 이벤트 목록 (D-08), 방 흐름 (D-01~D-06)

### 타입 정의
- `packages/shared/src/types/game.ts` (또는 dist) — `GameState`, `PlayerState`, `RoomState` 구조
- `packages/shared/src/types/protocol.ts` — `ClientToServerEvents`, `ServerToClientEvents`

### 요구사항
- `.planning/REQUIREMENTS.md` §UI-01 ~ UI-08

</canonical_refs>

<code_context>
## Existing Code Insights

### 현재 상태
- `packages/client/src/App.tsx` — 빈 placeholder (`<div>섯다</div>`). 모든 것을 신규 구축.
- `packages/client/package.json` — React 19 + Vite 6 + TypeScript만 설치. Tailwind/shadcn/Router/Zustand 미설치.

### 설치 필요 패키지 (신규)
- `tailwindcss`, `@tailwindcss/vite` (또는 postcss 방식)
- `shadcn/ui` (CLI로 init)
- `react-router-dom` v6
- `zustand`
- `socket.io-client`

### Established Patterns
- 서버는 `game-state` 이벤트로 `GameState` 전체를 브로드캐스트 — 클라이언트는 수신 즉시 스토어 갱신
- 에러는 `game-error` 이벤트로 개별 전송
- 모노레포: `@sutda/shared` import로 타입 공유

### Integration Points
- `/room/:roomId` 진입 시 socket 연결 + `join-room` 이벤트 emit
- `game-state` 수신 → Zustand store 업데이트 → 전체 UI 리렌더
- 베팅 액션 버튼 클릭 → `game-action` 이벤트 emit

</code_context>

<specifics>
## Specific Ideas

- 원형 배치 CSS 패턴: 사용자가 직접 제안한 CSS custom properties 방식 (--angle, --total, --i) — `rotate(var(--angle)) translateY(-반지름) rotate(calc(var(--angle) * -1))` 패턴
- 등교 모달 버튼 2개: "학교 간다" (앤티 납부) / "잠시 쉬기" (해당 판 패스)
- 채팅패널: 공간만 예약, 후속 Phase에서 socket.io 채팅 이벤트 추가

</specifics>

<deferred>
## Deferred Ideas

- **채팅 기능 (UX-02)** — v2 요구사항. Phase 6에서 레이아웃 공간만 예약. 후속 Phase에서 `chat-message` 이벤트 추가 + 실제 채팅 구현.

</deferred>

---

*Phase: 06-ui*
*Context gathered: 2026-03-30*
