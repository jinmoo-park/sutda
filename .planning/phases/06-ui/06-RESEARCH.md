# Phase 6: 클라이언트 UI 와이어프레임 - Research

**Researched:** 2026-03-30
**Domain:** React SPA + Socket.IO 실시간 게임 UI (Vite 6, React 19, Tailwind v4, shadcn/ui, Zustand v5)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Tailwind CSS + shadcn/ui 조합 채택. 클라이언트 패키지에 신규 설치.
- **D-02:** 와이어프레임이지만 세련된 UI 목표. shadcn/ui 기본 컴포넌트를 그대로 쓰되 게임 도메인에 맞게 커스터마이징. 과도한 그라데이션/그림자 남용 금지.
- **D-03:** Zustand 단일 스토어가 게임 상태 + socket.io-client 인스턴스 모두 관리.
- **D-04:** socket.io-client 연결은 Zustand action(`connect`)으로 초기화 (싱글턴 패턴). 서버 URL은 환경 변수(`VITE_SERVER_URL`)로 주입.
- **D-05:** 서버에서 오는 `game-state` 이벤트를 수신하면 Zustand 스토어를 갱신 → React 컴포넌트 자동 리렌더.
- **D-06:** React Router v6/v7 설치. 라우트 구조: `/` → 메인 화면, `/room/:roomId` → 게임 테이블 (단일 라우트 안에서 상태 머신 화면 전환).
- **D-07:** 화면 흐름: 방장 → 방 만들기 → 대기실(URL 복사) → 다른 플레이어 → URL 접속 → 닉네임 → 대기실 → 방장 "게임 시작" → 게임 테이블 → 결과 → 다음 판 or 방 나가기.
- **D-08:** CSS custom properties(--angle, --total, --i) 방식으로 원형 배치. `rotate(var(--angle)) translateY(-200px) rotate(calc(var(--angle) * -1))` 패턴.
- **D-09:** 모바일(세로 화면)에서는 Tailwind `md:` 브레이크포인트 기준으로 원형 레이아웃 → 세로 스택 전환.
- **D-10:** 게임 테이블 화면 5개 패널: 게임테이블패널 / 손패패널 / 베팅패널 / 정보패널 / 채팅패널(placeholder만).
- **D-11:** 족보 참고표(UI-07)는 별도 패널 없음. 손패 영역 옆에 족보명 텍스트로 자동 표시.
- **D-12:** 5개 특수 액션 모달: 밤일낮장 / 등교 / 셔플 / 기리 / 재충전투표.
- **Phase 4 D-26:** 기리 UI에서 최대 5더미로 제한. 서버는 cutPoints[] + order[] 방식으로 무제한 수용.

### Claude's Discretion

- 모바일 세로 레이아웃에서 5개 패널의 구체적 배치 순서 (스크롤 영역 구분 등)
- shadcn/ui 어떤 컴포넌트를 채택할지 (Button, Dialog, Badge, Card 등 조합)
- 원형 컨테이너 실제 크기와 반지름 값 (화면 크기별 반응형 조정)

### Deferred Ideas (OUT OF SCOPE)

- **채팅 기능 (UX-02)** — 레이아웃 공간만 예약. 후속 Phase에서 `chat-message` 이벤트 추가 + 실제 채팅 구현.
- 화투 이미지 에셋 교체 (Phase 10)
- 땡값/구사재경기 UI (Phase 9)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | 메인 화면에서 방 생성 또는 링크로 참여를 선택할 수 있다 | React Router `/` 라우트, shadcn Button + Dialog, socket `create-room`/`join-room` 이벤트 |
| UI-02 | 게임 테이블 화면에 원형으로 플레이어 자리, 카드, 칩 잔액이 표시된다 | CSS custom properties 원형 배치 패턴, `PlayerState` 타입에서 `seatIndex`, `chips`, `cards` 사용 |
| UI-03 | 자신의 카드는 앞면으로, 타인의 카드는 뒷면(또는 모드별 규칙)으로 표시된다 | socket.id vs `PlayerState.id` 비교 로직, `Card` 타입의 rank + attribute 렌더 |
| UI-04 | 베팅 액션 버튼(콜/레이즈/다이)과 레이즈 금액 입력 필드가 표시된다 | `BetAction` 유니온 타입, `bet-action` 이벤트 emit, shadcn Button + Input 조합 |
| UI-05 | 현재 판돈(팟) 금액이 테이블 중앙에 표시된다 | `GameState.pot` 필드, 정보패널 중앙 배치 |
| UI-06 | 판 결과 화면에서 카드를 공개하고 승자 및 칩 변동 내역을 표시한다 | `GameState.phase === 'result'`, `winnerId`, `PlayerState.chips` 변동 |
| UI-07 | 족보 참고표를 버튼 하나로 볼 수 있다 | 손패패널에 족보명 텍스트 자동 표시 (D-11 결정), `HandType` 문자열 테이블 |
| UI-08 | 와이어프레임 단계에서는 카드를 숫자+속성 텍스트로 표시한다 (이미지 없음) | `Card.rank` + `Card.attribute` → 한국어 텍스트 변환 함수 |
</phase_requirements>

---

## Summary

Phase 6은 완전히 새로운 React 클라이언트를 구축하는 단계다. 현재 `packages/client/src`에는 `App.tsx`(빈 placeholder)와 `main.tsx`만 존재하며, Tailwind/shadcn/Router/Zustand 모두 미설치 상태다. 서버(Socket.IO + GameEngine)는 Phase 5까지 완성되었고, `@sutda/shared`에 타입 계약(`GameState`, `PlayerState`, `ServerToClientEvents` 등)이 정의되어 있다.

기술 스택은 CONTEXT.md에서 모두 확정됐다: **Tailwind CSS v4** + **@tailwindcss/vite** 플러그인 방식, **shadcn/ui** CLI 초기화, **Zustand v5** 단일 스토어, **React Router v7**(v6 호환 API), **socket.io-client**. 이 모든 조합이 2026년 기준 공식 문서에서 지원된다.

주요 구현 복잡도는 두 곳에 집중된다: (1) CSS custom properties를 이용한 2~6인 원형 배치 레이아웃 — CONTEXT.md에서 패턴이 확정됐으나 반응형 처리가 추가 작업 필요; (2) 5개 특수 액션 모달(밤일낮장/등교/셔플/기리/재충전투표) — 각각 서로 다른 Socket.IO 이벤트와 연결된다. `nyquist_validation`이 활성화되어 있으므로 vitest + @testing-library/react 기반 컴포넌트 테스트 인프라도 Wave 0에서 구성해야 한다.

**Primary recommendation:** pnpm 모노레포 내 `packages/client`에 Tailwind v4 + shadcn/ui를 설치할 때 `--monorepo` 플래그 없이 **클라이언트 패키지 단위로** 독립 설치한다. 새 모노레포 생성이 아닌 기존 패키지에 추가하는 흐름이므로 수동 설치 방식(vite.config.ts에 플러그인 추가 + `pnpm dlx shadcn@latest init`)을 사용한다.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x (설치됨) | UI 렌더링 | 이미 설치됨 |
| Vite | 6.x (설치됨) | 빌드 도구 | 이미 설치됨 |
| tailwindcss | 4.2.2 | 유틸리티 CSS | v4는 PostCSS config 불필요, `@import "tailwindcss"` 한 줄로 완성 |
| @tailwindcss/vite | 4.2.2 | Vite Tailwind 통합 | v4 공식 Vite 플러그인, postcss.config.js 불필요 |
| shadcn/ui (CLI) | 4.1.1 (shadcn CLI) | UI 컴포넌트 | headless + tailwind 기반, 소유 가능한 컴포넌트 코드 |
| react-router-dom | 7.13.2 | 클라이언트 라우팅 | v7은 v6 API와 호환, 패키지 통합(`react-router`에서 직접 import 가능) |
| zustand | 5.0.12 | 전역 상태 관리 | React 19 공식 지원, 보일러플레이트 최소 |
| socket.io-client | 4.8.3 | WebSocket 통신 | 서버(socket.io 4.8.3)와 동일 버전, 타입 내장 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | 25.x | Vite config에서 path.resolve 사용 | vite.config.ts에 `import path from 'path'` 필요 시 |
| vitest | 3.x (서버에 설치됨) | 컴포넌트 단위 테스트 | client 패키지에도 추가 필요 |
| @testing-library/react | 16.x | 컴포넌트 렌더링 테스트 | DOM 기반 컴포넌트 동작 검증 |
| @testing-library/user-event | 14.x | 사용자 인터랙션 시뮬레이션 | 버튼 클릭, 입력 등 |
| jsdom | 25.x | Node.js에서 DOM 시뮬레이션 | vitest environment 설정 |
| @sutda/shared | workspace:* (설치됨) | 타입 공유 | `GameState`, `PlayerState`, `ServerToClientEvents` 등 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 (@tailwindcss/vite) | Tailwind v3 (postcss) | v3은 config 복잡, v4는 단순하지만 일부 v3 플러그인 미호환 |
| shadcn/ui | Radix UI 직접 사용 | shadcn는 Radix를 래핑하여 스타일 포함 제공, 생산성 높음 |
| Zustand | React Context + useReducer | 게임 상태(복잡한 중첩 객체)에는 Zustand selector 패턴이 재렌더 최적화에 유리 |
| react-router-dom v7 | TanStack Router | v7은 기존 v6 지식 재활용 가능, CONTEXT.md 확정 결정 |

**Installation:**

```bash
# packages/client 디렉토리에서 실행
pnpm add tailwindcss @tailwindcss/vite
pnpm add react-router-dom zustand socket.io-client
pnpm add -D @types/node vitest @testing-library/react @testing-library/user-event jsdom

# shadcn/ui 초기화 (packages/client 디렉토리에서)
pnpm dlx shadcn@latest init
```

**Version verification (2026-03-30 기준):**

| Package | 확인된 버전 | npm 공개 날짜 |
|---------|-----------|------------|
| tailwindcss | 4.2.2 | 2026-03 최근 |
| @tailwindcss/vite | 4.2.2 | 2026-03 최근 |
| zustand | 5.0.12 | 2026-01 |
| react-router-dom | 7.13.2 | 2026-03 최근 |
| socket.io-client | 4.8.3 | 이미 서버에서 사용 중 |
| shadcn (CLI) | 4.1.1 | 2026 최신 |

---

## Architecture Patterns

### 추천 프로젝트 구조

```
packages/client/src/
├── main.tsx                    # React 엔트리, RouterProvider
├── App.tsx                     # BrowserRouter 또는 createBrowserRouter 루트
├── index.css                   # @import "tailwindcss"; (단 한 줄)
├── store/
│   └── gameStore.ts            # Zustand 단일 스토어 (GameState + socket 인스턴스)
├── pages/
│   ├── MainPage.tsx            # "/" 라우트 — 방 생성/참여
│   └── RoomPage.tsx            # "/room/:roomId" — 대기실+게임+결과 (상태 머신)
├── components/
│   ├── layout/
│   │   ├── GameTable.tsx       # 원형 플레이어 배치 컨테이너
│   │   ├── HandPanel.tsx       # 내 손패 + 족보 텍스트
│   │   ├── BettingPanel.tsx    # 콜/레이즈/다이/체크 버튼
│   │   ├── InfoPanel.tsx       # 잔액 + 팟 금액
│   │   └── ChatPanel.tsx       # placeholder (빈 영역 예약)
│   ├── game/
│   │   ├── PlayerSeat.tsx      # 원형 배치 단일 플레이어 자리
│   │   ├── CardFace.tsx        # 앞면 카드 (숫자+속성 텍스트)
│   │   ├── CardBack.tsx        # 뒷면 카드
│   │   └── ChipDisplay.tsx     # 칩 단위별 표시
│   └── modals/
│       ├── DealerSelectModal.tsx  # 밤일낮장: 20장 보드
│       ├── AttendSchoolModal.tsx  # 등교: 학교간다/잠시쉬기
│       ├── ShuffleModal.tsx       # 셔플 확인
│       ├── CutModal.tsx           # 기리: 최대 5더미 + 퉁 선언
│       └── RechargeVoteModal.tsx  # 재충전 투표
├── lib/
│   ├── utils.ts                # shadcn/ui cn() 유틸
│   └── cardUtils.ts            # Card → 한국어 텍스트 변환
└── components/ui/              # shadcn/ui 자동 생성 컴포넌트들
    ├── button.tsx
    ├── dialog.tsx
    ├── badge.tsx
    └── ...
```

### Pattern 1: Tailwind v4 + @tailwindcss/vite 설치 패턴

**What:** Vite 플러그인 방식으로 PostCSS 설정 없이 Tailwind 통합
**When to use:** Vite 기반 프로젝트에서 Tailwind v4 사용 시 (모든 신규 프로젝트)

```typescript
// vite.config.ts (수정 후)
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

```css
/* src/index.css — 전체 내용을 이 한 줄로 교체 */
@import "tailwindcss";
```

### Pattern 2: Zustand 스토어 + socket.io-client 싱글턴

**What:** socket.io-client 인스턴스를 Zustand 스토어 내부에서 관리하는 싱글턴 패턴
**When to use:** 실시간 게임처럼 소켓 인스턴스를 앱 전체에서 공유해야 할 때

```typescript
// store/gameStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameState, RoomState } from '@sutda/shared';
import type { ServerToClientEvents, ClientToServerEvents } from '@sutda/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface GameStore {
  socket: AppSocket | null;
  gameState: GameState | null;
  roomState: RoomState | null;
  myPlayerId: string | null;
  error: string | null;
  // 액션
  connect: (serverUrl: string) => void;
  disconnect: () => void;
  setGameState: (state: GameState) => void;
  setRoomState: (state: RoomState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  roomState: null,
  myPlayerId: null,
  error: null,

  connect: (serverUrl: string) => {
    const existing = get().socket;
    if (existing?.connected) return; // 싱글턴 보장

    const socket: AppSocket = io(serverUrl, { autoConnect: true });

    socket.on('game-state', (state: GameState) => {
      set({ gameState: state });
    });

    socket.on('room-state', (state: RoomState) => {
      set({ roomState: state });
    });

    socket.on('game-error', ({ message }) => {
      set({ error: message });
    });

    socket.on('connect', () => {
      set({ myPlayerId: socket.id ?? null });
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, gameState: null, roomState: null, myPlayerId: null });
  },

  setGameState: (state) => set({ gameState: state }),
  setRoomState: (state) => set({ roomState: state }),
}));
```

### Pattern 3: CSS custom properties 원형 배치

**What:** CSS custom property로 N명 플레이어를 원형 배치하는 패턴 (CONTEXT.md D-08에서 확정)
**When to use:** 2~6인 동일 컴포넌트로 처리해야 할 때

```tsx
// components/game/PlayerSeat.tsx
interface PlayerSeatProps {
  seatIndex: number;   // 0-based
  totalPlayers: number;
  player: PlayerState;
  isMe: boolean;
}

export function PlayerSeat({ seatIndex, totalPlayers, player, isMe }: PlayerSeatProps) {
  const style = {
    '--i': seatIndex,
    '--total': totalPlayers,
    '--angle': `calc(360deg / ${totalPlayers} * ${seatIndex})`,
  } as React.CSSProperties;

  return (
    <div
      className="absolute top-1/2 left-1/2 -mt-12 -ml-12 transition-transform duration-500"
      style={{
        ...style,
        transform: `rotate(var(--angle)) translateY(-200px) rotate(calc(var(--angle) * -1))`,
      }}
    >
      {/* 닉네임, 카드, 칩 잔액 */}
    </div>
  );
}

// components/layout/GameTable.tsx
export function GameTable({ players }: { players: PlayerState[] }) {
  return (
    <div className="relative w-[500px] h-[500px] mx-auto md:w-[600px] md:h-[600px]">
      {/* 테이블 중앙 — 팟 표시 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <PotDisplay />
      </div>
      {players.map((p, i) => (
        <PlayerSeat
          key={p.id}
          seatIndex={i}
          totalPlayers={players.length}
          player={p}
          isMe={p.id === myPlayerId}
        />
      ))}
    </div>
  );
}
```

### Pattern 4: GamePhase 기반 상태 머신 화면 전환

**What:** `gameState.phase`에 따라 모달 표시 여부와 UI 컴포넌트를 조건부 렌더
**When to use:** 단일 라우트(`/room/:roomId`) 내에서 대기실 → 게임 → 결과 전환

```tsx
// pages/RoomPage.tsx
export function RoomPage() {
  const { gameState, roomState } = useGameStore();

  const phase = gameState?.phase;

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* 게임테이블 패널 */}
      {gameState && <GameTable players={gameState.players} />}

      {/* 대기실 오버레이 (waiting 단계) */}
      {phase === 'waiting' && <WaitingRoom roomState={roomState} />}

      {/* 결과 오버레이 (result 단계) */}
      {phase === 'result' && <ResultScreen gameState={gameState} />}

      {/* 특수 액션 모달 */}
      {phase === 'dealer-select' && <DealerSelectModal />}
      {phase === 'attend-school' && <AttendSchoolModal />}
      {phase === 'shuffling' && <ShuffleModal />}
      {phase === 'cutting' && <CutModal />}

      {/* 베팅 패널 (베팅 단계 + 내 턴) */}
      {phase === 'betting' && isMyTurn && <BettingPanel />}

      {/* 재충전 투표 모달 — 독립적으로 표시 */}
      <RechargeVoteModal />
    </div>
  );
}
```

### Pattern 5: React Router v7 설정

**What:** React Router v7 선언형 라우터 설정 (v6 API와 동일)
**When to use:** 클라이언트 SPA 라우팅

```tsx
// main.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainPage } from './pages/MainPage';
import { RoomPage } from './pages/RoomPage';

const router = createBrowserRouter([
  { path: '/', element: <MainPage /> },
  { path: '/room/:roomId', element: <RoomPage /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

### Pattern 6: 카드 텍스트 렌더 (UI-08)

**What:** `Card` 타입의 rank + attribute를 한국어 텍스트로 변환
**When to use:** 와이어프레임 단계 (이미지 없음, UI-08 요구사항)

```typescript
// lib/cardUtils.ts
import type { Card, CardAttribute } from '@sutda/shared';

const ATTRIBUTE_LABELS: Record<CardAttribute, string> = {
  gwang: '광',
  yeolkkeut: '열끗',
  normal: '',
};

export function cardToText(card: Card): string {
  const attr = ATTRIBUTE_LABELS[card.attribute];
  return attr ? `${card.rank}${attr}` : `${card.rank}`;
}

// 예: { rank: 3, attribute: 'gwang' } → "3광"
// 예: { rank: 4, attribute: 'yeolkkeut' } → "4열끗"
// 예: { rank: 5, attribute: 'normal' } → "5"
```

### Anti-Patterns to Avoid

- **Socket.IO 인스턴스를 컴포넌트 내부에서 직접 생성:** 매 렌더 시 새 연결 생성. 반드시 Zustand store `connect()` action으로 싱글턴 관리.
- **useEffect로 game-state 이벤트 구독:** 언마운트 시 구독 해제를 빠뜨리기 쉬움. 스토어 초기화 시점에 한 번만 등록.
- **tailwind.config.js 생성 시도:** Tailwind v4는 설정 파일 불필요. `vite.config.ts`에 플러그인 추가 + `@import "tailwindcss"` 한 줄이 전부.
- **shadcn CLI를 루트 디렉토리에서 실행:** 반드시 `packages/client` 디렉토리에서 실행. `components.json`이 `packages/client/`에 생성되어야 함.
- **원형 레이아웃에서 seatIndex를 서버 순서(배분 순서)로 혼동:** `PlayerState.seatIndex`(0-based 입장 순서)가 원형 배치 기준. 베팅 순서와 시각적 배치 순서는 별개.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI 컴포넌트 (버튼, 다이얼로그, 뱃지) | 커스텀 CSS 컴포넌트 | shadcn/ui Button, Dialog, Badge | 접근성(a11y), 포커스 트랩, aria 속성 처리가 복잡 |
| 모달/오버레이 | `position: fixed` DIV + z-index 직접 관리 | shadcn/ui Dialog (Radix UI 기반) | 포커스 관리, Esc 키 처리, 스크롤 잠금 자동 처리 |
| 칩 단위 입력 UI | 커스텀 숫자 입력 | shadcn/ui Button (500/1000/5000/10000) 조합 + Input | Phase 5 D-09 결정된 UX 패턴 |
| 클라이언트 라우팅 | Hash 기반 수동 라우팅 | React Router v7 createBrowserRouter | History API 처리, URL 파라미터 추출 |
| 토스트/에러 알림 | alert() 또는 커스텀 팝업 | shadcn/ui Sonner (Toast) | `game-error` 이벤트 수신 시 비침습적 알림 |
| 족보 계산 (클라이언트) | 프론트엔드 족보 계산 로직 | `@sutda/shared`의 `evaluateHand()` 재사용 | 서버 권위 모델 — 클라이언트 계산은 표시 전용 힌트로만 |

**Key insight:** shadcn/ui의 Dialog 컴포넌트가 5개 모달 모두에 재사용 가능하다. Radix UI Primitive 기반이므로 포커스 관리와 접근성이 기본 제공된다.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4에서 content glob 설정 불필요

**What goes wrong:** v3 문서 참조해서 `tailwind.config.js`에 `content: ['./src/**/*.{ts,tsx}']` 추가 시도
**Why it happens:** 구버전 Tailwind 문서나 Stack Overflow가 v3 기준
**How to avoid:** v4는 소스 파일을 자동 감지. `tailwind.config.js` 파일 생성하지 않음. `@import "tailwindcss"` + vite 플러그인만으로 완성.
**Warning signs:** `unknown utility class` 오류 없이 빌드는 되지만 스타일이 적용 안 됨 → index.css에 `@import "tailwindcss"` 누락 확인.

### Pitfall 2: shadcn/ui init 시 React 19 peer dependency 충돌

**What goes wrong:** `pnpm dlx shadcn@latest init` 실행 시 일부 패키지가 React 18을 피어 디펜던시로 요구하며 경고/실패
**Why it happens:** shadcn 내부 일부 컴포넌트 의존성이 React 18 기준
**How to avoid:** pnpm의 경우 `.npmrc`에 `legacy-peer-deps=true` 추가 또는 `pnpm dlx shadcn@latest init --legacy-peer-deps`. 실제 동작은 React 19에서 정상 작동함.
**Warning signs:** `WARN Issues with peer dependencies` 메시지 — 경고이고 오류가 아닌 경우 무시 가능.

### Pitfall 3: Zustand 스토어에서 socket 이벤트 중복 등록

**What goes wrong:** `connect()` action이 여러 번 호출될 때 같은 이벤트에 리스너가 중복 등록됨
**Why it happens:** socket.on()은 호출할 때마다 리스너를 추가
**How to avoid:** `connect()` 시작 시 `if (existing?.connected) return` 가드 추가. 또는 `socket.off('game-state'); socket.on('game-state', ...)` 패턴으로 기존 리스너 제거 후 등록.
**Warning signs:** 상태 업데이트가 2배로 발생, 콘솔에 리렌더 과다.

### Pitfall 4: React Router v7에서 react-router-dom 임포트

**What goes wrong:** v7에서는 `react-router`에서 직접 import 가능하나, `react-router-dom`도 여전히 작동함
**Why it happens:** v7 문서는 `react-router`에서 import 권장, 혼동 발생
**How to avoid:** `react-router-dom`을 설치하고 해당 패키지에서 import. 또는 `react-router`로 통일 — 둘 다 동작하며 API 동일.
**Warning signs:** "Module not found" 오류 → 설치된 패키지명과 import 경로 일치 확인.

### Pitfall 5: GameState.phase 전환 타이밍 vs 모달 표시

**What goes wrong:** 서버가 phase를 전환했을 때 모달이 깜빡이거나 중복 표시됨
**Why it happens:** `game-state` 이벤트가 빠르게 연속으로 도달할 때 React 렌더 배치 타이밍
**How to avoid:** 모달 표시 조건을 `gameState?.phase === 'X'`로 단순화. 중간 상태 추적용 로컬 state 최소화. Zustand selector로 phase만 구독하여 불필요한 리렌더 방지.
**Warning signs:** 모달이 1프레임 동안 잘못된 시점에 표시됨.

### Pitfall 6: 원형 배치에서 카드 방향이 뒤집힘

**What goes wrong:** `rotate(angle) translateY(-r) rotate(-angle)` 패턴에서 음수 각도 계산 누락
**Why it happens:** CSS `calc()` 에서 음수 `var()` 처리 미스
**How to avoid:** `rotate(calc(var(--angle) * -1))` 형식으로 명시적 반전. React inline style로 `--angle` 값을 문자열이 아닌 숫자로 전달 후 CSS에서 `calc` 처리.
**Warning signs:** 플레이어 카드/닉네임이 원 반대 방향을 향하거나 거꾸로 표시됨.

---

## Code Examples

검증된 패턴들:

### shadcn/ui Dialog를 이용한 모달 패턴

```tsx
// components/modals/AttendSchoolModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

export function AttendSchoolModal() {
  const { gameState, socket, roomId } = useGameStore();
  const isOpen = gameState?.phase === 'attend-school';

  const handleAttend = () => {
    socket?.emit('attend-school', { roomId });
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>학교 간다 (500원 앤티)</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <Button onClick={handleAttend} className="flex-1">
            학교 간다
          </Button>
          {/* 잠시 쉬기 = 이 판 패스, 별도 이벤트 없음 */}
          <Button variant="outline" className="flex-1">
            잠시 쉬기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Zustand selector로 필요한 슬라이스만 구독

```tsx
// 전체 store 구독 (리렌더 과다 위험)
const store = useGameStore(); // 비추천

// selector로 필요한 것만 구독 (추천)
const phase = useGameStore((s) => s.gameState?.phase);
const myChips = useGameStore((s) => {
  const me = s.gameState?.players.find(p => p.id === s.myPlayerId);
  return me?.chips ?? 0;
});
```

### 기리(CutModal) — 최대 5더미 분할

```tsx
// Phase 4 D-26: cutPoints[] + order[] 방식
const handleCut = (cutPoints: number[], order: number[]) => {
  socket?.emit('cut', { roomId, cutPoints, order });
};

// cutPoints: 분할 위치 배열 (예: [5, 10, 15] → 4더미)
// order: 재조립 순서 (예: [2, 0, 3, 1] → 3번째, 1번째, 4번째, 2번째 순서)
// UI에서 최대 5더미(cutPoints 최대 4개)로 제한
```

### 베팅 패널 — 칩 더미 입력 (Phase 5 D-09 패턴)

```tsx
// components/layout/BettingPanel.tsx
const CHIP_UNITS = [500, 1_000, 5_000, 10_000] as const;

function BettingPanel() {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const { socket, gameState, myPlayerId } = useGameStore(/* ... */);

  const handleChipClick = (unit: number) => {
    setRaiseAmount(prev => prev + unit);
  };

  const handleRaise = () => {
    socket?.emit('bet-action', { roomId, action: { type: 'raise', amount: raiseAmount } });
    setRaiseAmount(0);
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* 칩 단위 버튼 */}
      <div className="flex gap-2">
        {CHIP_UNITS.map(unit => (
          <Button key={unit} variant="outline" size="sm" onClick={() => handleChipClick(unit)}>
            +{unit.toLocaleString()}
          </Button>
        ))}
      </div>
      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button onClick={() => socket?.emit('bet-action', { roomId, action: { type: 'call' } })}>콜</Button>
        <Button onClick={handleRaise} disabled={raiseAmount === 0}>레이즈 ({raiseAmount.toLocaleString()}원)</Button>
        <Button variant="destructive" onClick={() => socket?.emit('bet-action', { roomId, action: { type: 'die' } })}>다이</Button>
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 (postcss + tailwind.config.js) | Tailwind v4 (@tailwindcss/vite + CSS import) | v4.0 GA (2025-01) | 설정 파일 불필요, 빌드 속도 향상 |
| react-router-dom v6 | react-router v7 (react-router-dom 포함) | v7.0 (2024-11) | 패키지 통합, data API 강화, 번들 15% 감소 |
| Zustand v4 (devtools 별도 import) | Zustand v5 (middleware 통합 import) | v5.0 (2024) | React 19 공식 지원, 에러 메시지 개선 |
| shadcn-ui@latest (구버전) | shadcn@latest (CLI 리브랜딩) | 2024 | CLI 패키지명 변경 (`shadcn-ui` → `shadcn`) |

**Deprecated/outdated:**
- `npx create-react-app`: Vite로 대체 (이미 적용됨)
- `@tailwind base; @tailwind components; @tailwind utilities;` 디렉티브: v4에서 `@import "tailwindcss"` 한 줄로 대체
- Zustand `import { devtools } from 'zustand/devtools'`: v5에서 `import { devtools } from 'zustand/middleware'`

---

## Open Questions

1. **`/room/:roomId` 직접 접속 시 닉네임 미입력 처리**
   - What we know: 사용자가 링크로 직접 접속하면 닉네임이 없는 상태
   - What's unclear: RoomPage 진입 시 닉네임 입력 모달을 먼저 보여줄지, 별도 라우트(`/room/:roomId/join`)로 분기할지
   - Recommendation: RoomPage 내에서 `myPlayerId === null` 조건으로 인라인 닉네임 입력 모달 표시 (라우트 추가 없이 단순화)

2. **밤일낮장 모달 — 20장 카드 보드 인터랙션**
   - What we know: 20장 카드가 뒤집힌 채로 표시, 플레이어 1명당 1장 선택 (Phase 4 D-05, D-06)
   - What's unclear: 선택 완료 후 애니메이션 없이 즉시 카드 공개 vs. 결과 대기 상태
   - Recommendation: `dealerSelectCards` 배열이 `gameState`에 포함되어 서버가 공개 처리 — 클라이언트는 이 배열이 업데이트되면 해당 카드 위치에 숫자 표시

3. **shadcn/ui 모노레포 설치 위치**
   - What we know: 공식 monorepo 가이드는 `packages/ui` 별도 패키지 구조를 권장
   - What's unclear: 기존 구조(`packages/client`)에 shadcn을 직접 설치하는 것이 더 적합할 수 있음
   - Recommendation: 이 프로젝트는 `packages/ui` 공유 패키지 불필요 (클라이언트만 UI 사용). `packages/client`에 직접 설치 (`pnpm dlx shadcn@latest init` - --monorepo 플래그 없이).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 빌드, pnpm | ✓ | v22.11.0 | — |
| pnpm | 패키지 설치 | ✓ | 9.15.4 | — |
| npm (registry) | 패키지 다운로드 | ✓ | 10.9.0 | — |
| tailwindcss v4 | 스타일링 | 미설치 (설치 필요) | 4.2.2 | — |
| @tailwindcss/vite | Vite 통합 | 미설치 (설치 필요) | 4.2.2 | — |
| shadcn/ui | 컴포넌트 | 미설치 (설치 필요) | CLI 4.1.1 | — |
| react-router-dom | 라우팅 | 미설치 (설치 필요) | 7.13.2 | — |
| zustand | 상태 관리 | 미설치 (설치 필요) | 5.0.12 | — |
| socket.io-client | WebSocket | 미설치 (설치 필요) | 4.8.3 | — |
| @testing-library/react | 컴포넌트 테스트 | 미설치 (설치 필요) | 최신 | — |

**Missing dependencies with no fallback:** 없음 (모두 설치 가능)

**Missing dependencies with fallback:** 없음

**주의:** 서버(packages/server)는 `socket.io 4.8.3`을 사용 중. 클라이언트 `socket.io-client 4.8.3`과 메이저 버전 일치 필수.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 3.x |
| Config file | `packages/client/vitest.config.ts` (Wave 0에서 생성) |
| Quick run command | `pnpm --filter @sutda/client test` |
| Full suite command | `pnpm --filter @sutda/client test --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | 메인 화면 방 생성/참여 버튼 렌더 | unit | `pnpm --filter @sutda/client test -- MainPage` | ❌ Wave 0 |
| UI-02 | 2~6인 원형 배치 CSS custom properties | unit | `pnpm --filter @sutda/client test -- GameTable` | ❌ Wave 0 |
| UI-03 | 내 카드 앞면/타인 카드 뒷면 표시 | unit | `pnpm --filter @sutda/client test -- CardFace CardBack` | ❌ Wave 0 |
| UI-04 | 베팅 버튼(콜/레이즈/다이) 렌더 + 클릭 | unit | `pnpm --filter @sutda/client test -- BettingPanel` | ❌ Wave 0 |
| UI-05 | 팟 금액 중앙 표시 | unit | `pnpm --filter @sutda/client test -- PotDisplay` | ❌ Wave 0 |
| UI-06 | 결과 화면 카드 공개 + 승자 표시 | unit | `pnpm --filter @sutda/client test -- ResultScreen` | ❌ Wave 0 |
| UI-07 | 족보명 텍스트 자동 표시 | unit | `pnpm --filter @sutda/client test -- HandPanel` | ❌ Wave 0 |
| UI-08 | 카드 숫자+속성 텍스트 변환 | unit | `pnpm --filter @sutda/client test -- cardUtils` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter @sutda/client test -- [해당 컴포넌트]`
- **Per wave merge:** `pnpm --filter @sutda/client test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/client/vitest.config.ts` — `environment: 'jsdom'`, `globals: true` 설정
- [ ] `packages/client/src/test/setup.ts` — `@testing-library/jest-dom` 확장
- [ ] 프레임워크 설치: `pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom @testing-library/jest-dom --filter @sutda/client`
- [ ] `packages/client/package.json`에 `"test": "vitest run"` 스크립트 추가

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md가 존재하지 않으므로 프로젝트 레벨 추가 제약 없음. 대신 STATE.md에서 확인된 아키텍처 제약 사항:

- **모노레포:** pnpm workspaces + Turborepo (Phase 1에서 확정)
- **TypeScript:** strict: true, ES2022, moduleResolution: bundler (tsconfig.base.json)
- **서버 권위 모델:** 클라이언트는 렌더링만 담당 (INFRA-04). 족보 계산을 클라이언트에서 재구현 금지.
- **공유 타입:** 반드시 `@sutda/shared`에서 import. 클라이언트 내 타입 재정의 금지.
- **테스트 프레임워크:** vitest 3.x (shared, server 패키지에서 이미 사용 중)

---

## Sources

### Primary (HIGH confidence)
- Tailwind CSS 공식 문서 (https://tailwindcss.com/docs) — v4 Vite 설치 방법 직접 확인
- shadcn/ui 공식 문서 (https://ui.shadcn.com/docs/installation/vite) — Vite 설치 절차 직접 확인
- shadcn/ui Monorepo 문서 (https://ui.shadcn.com/docs/monorepo) — pnpm + Turborepo 모노레포 설정 직접 확인
- 프로젝트 소스코드 직접 분석 — `packages/shared/src/types/*.ts`, `packages/server/package.json`

### Secondary (MEDIUM confidence)
- WebSearch: tailwindcss v4 Vite 설치 (다수 가이드 교차 확인)
- WebSearch: React Router v7 vs v6 변경점 (공식 업그레이드 가이드 링크 포함)
- npm view 명령어로 직접 확인한 패키지 버전 (zustand 5.0.12, react-router-dom 7.13.2, tailwindcss 4.2.2)

### Tertiary (LOW confidence)
- WebSearch: Zustand v5 + socket.io-client 패턴 — 공식 문서 미확인, 커뮤니티 패턴 기반

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — npm view로 버전 직접 확인, 공식 문서 교차 검증
- Architecture: HIGH — 기존 프로젝트 타입/이벤트 구조를 직접 파악, CONTEXT.md 패턴 확정됨
- Pitfalls: MEDIUM — Tailwind v4/shadcn/React 19 조합의 일부 pitfall은 WebSearch 기반

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (Tailwind v4, shadcn, React Router v7 — 빠르게 변화 중이나 30일 내 주요 변경 가능성 낮음)
