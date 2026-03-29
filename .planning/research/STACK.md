# Technology Stack

**프로젝트:** 온라인 섯다 (실시간 멀티플레이어 웹 카드 게임)
**조사일:** 2026-03-29
**전체 신뢰도:** MEDIUM (WebSearch/npm 검증 불가, 2025년 5월 훈련 데이터 기반. 버전은 실제 설치 시 재확인 필요)

---

## 추천 스택

### 언어 / 타입 시스템

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|-----------|
| TypeScript | ~5.7+ | 프론트엔드 + 백엔드 공용 언어 | 서버/클라이언트 간 게임 상태 타입을 공유할 수 있어 섯다 족보, 베팅 액션 등의 메시지 계약을 컴파일 타임에 강제. 소규모 프로젝트에서도 런타임 버그를 대폭 줄여줌 |

**핵심 결정: 모노레포 + 공유 타입.** 서버와 클라이언트가 동일한 `shared/` 패키지의 타입(카드, 족보, 게임 상태, 이벤트)을 참조. 이것이 실시간 게임의 가장 큰 버그 원인(메시지 불일치)을 제거함.

### 프론트엔드 (클라이언트)

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|-----------|
| React | ~19.x | UI 프레임워크 | 컴포넌트 기반 UI가 카드 게임 테이블(플레이어 슬롯, 카드, 칩, 베팅 UI)을 모듈화하기에 적합. 생태계가 가장 넓어 문제 해결 시 레퍼런스 풍부 |
| Vite | ~6.x | 빌드 도구 / 개발 서버 | HMR 속도가 빠르고 설정이 간결. CRA 대비 빌드 시간 10배 이상 단축. 2025년 사실상 표준 |
| Zustand | ~5.x | 클라이언트 상태 관리 | Redux 대비 보일러플레이트가 극소. 게임 상태(현재 턴, 패, 칩)를 단일 스토어로 관리하기에 충분하며 React 외부(Socket 이벤트 핸들러)에서도 직접 접근 가능 |
| socket.io-client | ~4.8+ | WebSocket 클라이언트 | socket.io 서버와 페어. 자동 재연결, 이벤트 기반 API |
| CSS Modules 또는 Tailwind CSS | ~4.x (Tailwind) | 스타일링 | 와이어프레임 단계에서는 Tailwind 유틸리티 클래스로 빠르게 레이아웃. 카드/테이블 UI가 커스텀이므로 CSS Modules도 병행 가능 |

### 백엔드 (게임 서버)

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|-----------|
| Node.js | ~22.x LTS | 런타임 | TypeScript 공유를 위해 JS 런타임 필수. 이벤트 루프 기반이 WebSocket 다중 연결 처리에 적합. 2-6인 소규모라 성능 병목 없음 |
| Express | ~5.x | HTTP 서버 | 방 생성 API, 헬스체크, 정적 파일 서빙 등 최소한의 REST 엔드포인트 용도. Socket.IO의 HTTP 서버 기반으로 사용 |
| Socket.IO | ~4.8+ | 실시간 양방향 통신 | **핵심 선택.** Room 기능 내장(방 코드 기반 그룹핑), 자동 재연결, 연결 끊김 감지, fallback(long-polling). 2-6인 카드 게임에 최적의 추상화 수준 |
| nanoid | ~5.x | 방 코드 생성 | URL-safe 짧은 ID 생성. UUID보다 짧고 공유하기 좋은 6-8자 방 코드 생성에 적합 |

### 데이터베이스

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|-----------|
| **없음 (인메모리)** | — | 게임 상태 저장 | 영구 저장 불필요(프로젝트 제약 조건). 방 세션이 끝나면 데이터 소멸. 서버 메모리의 Map/Object로 충분. DB를 도입하면 복잡성만 추가됨 |

**근거:** PROJECT.md에 "영구 계정/전적 저장 — 방 세션 단위로만 운영"이 Out of Scope으로 명시. 소수 친구 그룹, 최대 6인 방 수 개 수준. 인메모리가 가장 단순하고 빠름.

### 인프라 / 배포

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|-----------|
| Railway 또는 Render | — | 서버 배포 | WebSocket 지원, 무료/저가 티어, Node.js 네이티브 지원. Vercel/Netlify는 서버리스 기반이라 WebSocket 상시 연결 불가 |
| Vite 정적 빌드 → 같은 서버 | — | 프론트엔드 배포 | Express가 빌드된 정적 파일을 서빙. 별도 CDN 불필요(소규모) |

**Vercel을 사용하지 않는 이유:** Vercel의 서버리스 함수는 WebSocket 상시 연결을 지원하지 않음. 카드 게임은 게임 중 내내 연결이 유지되어야 하므로 전통적인 서버(Railway/Render)가 필수.

### 테스트

| 기술 | 버전 | 용도 | 선정 이유 |
|------|------|------|-----------|
| Vitest | ~3.x | 유닛/통합 테스트 | Vite 기반이라 설정 공유. Jest 호환 API. 특히 족보 판정 로직, 베팅 규칙 등 순수 함수 테스트에 필수 |

### 보조 라이브러리

| 라이브러리 | 버전 | 용도 | 사용 시점 |
|------------|------|------|-----------|
| framer-motion | ~11.x | 카드 애니메이션 | 와이어프레임 이후 폴리시 단계에서 카드 딜링, 뒤집기 애니메이션 추가 시 |
| react-router-dom | ~7.x | 라우팅 | 로비 → 게임방 화면 전환. 방 코드가 URL path에 포함 (`/room/:roomCode`) |
| zod | ~3.x | 런타임 유효성 검증 | 클라이언트→서버 메시지 유효성 검증. TypeScript 타입만으로는 런타임 치팅/잘못된 메시지를 막을 수 없음 |

---

## 프로젝트 구조 (모노레포)

```
sutda/
  packages/
    shared/          # 타입, 상수, 족보 판정 순수 함수
    server/          # Express + Socket.IO 게임 서버
    client/          # React + Vite 프론트엔드
  package.json       # npm workspaces 루트
  tsconfig.base.json # 공유 TS 설정
```

**npm workspaces 사용 이유:** Turborepo나 Nx는 이 규모에 과도함. npm 내장 workspaces로 `shared` 패키지를 서버/클라이언트가 직접 참조하면 충분.

---

## 대안 비교 및 미채택 사유

| 카테고리 | 추천 | 대안 | 미채택 사유 |
|----------|------|------|-------------|
| 실시간 통신 | Socket.IO | **Colyseus** | 게임 프레임워크로서 Room/State 동기화가 내장되어 있지만, 섯다 특유의 족보/베팅/모드 로직이 복잡해서 프레임워크 제약 안에서 커스텀하기 오히려 어려움. Socket.IO가 더 유연 |
| 실시간 통신 | Socket.IO | **PartyKit/PartyServer** | Cloudflare 기반 서버리스 WebSocket. 흥미로운 기술이지만 Durable Objects 기반이라 디버깅 복잡하고 로컬 개발 경험이 Socket.IO 대비 미성숙 |
| 실시간 통신 | Socket.IO | **raw WebSocket (ws)** | 재연결, room 관리, 이벤트 구조를 직접 구현해야 함. Socket.IO가 이를 모두 제공하므로 바퀴를 재발명할 이유 없음 |
| UI 프레임워크 | React | **Svelte/SvelteKit** | 번들 크기가 작고 반응성이 좋지만, Socket.IO + 게임 상태 관리 레퍼런스가 React 대비 극히 적음. 디버깅 시 참고 자료 부족 |
| UI 프레임워크 | React | **Vue 3** | 충분히 가능하지만 React의 Zustand/Socket.IO 통합 패턴이 더 잘 문서화되어 있음 |
| 상태 관리 | Zustand | **Redux Toolkit** | 6인 카드 게임 상태 관리에 Redux의 보일러플레이트는 과도. Zustand가 1/5 코드량으로 동일한 결과 |
| 상태 관리 | Zustand | **Jotai/Recoil** | 아토믹 상태 모델은 게임 상태처럼 밀접하게 연결된 데이터에 부적합. 게임 상태는 단일 트리로 관리하는 것이 자연스러움 |
| 스타일링 | Tailwind CSS | **styled-components** | 런타임 CSS-in-JS는 성능 오버헤드. Tailwind는 빌드 타임에 CSS 생성하므로 카드 애니메이션 시 방해 없음 |
| 빌드 도구 | Vite | **Next.js** | SSR/SSG가 이 프로젝트에 불필요. 게임은 전적으로 클라이언트 사이드 렌더링. Next.js의 App Router 복잡성이 오히려 방해 |
| 배포 | Railway/Render | **Fly.io** | 가능하나 설정이 Docker 기반으로 약간 더 복잡. Railway가 Node.js 배포 시 더 간편 |
| DB | 인메모리 | **Redis** | 서버 재시작 시 게임 상태 복구가 가능하지만, 친구끼리 하는 게임에서 그 수준의 안정성은 불필요. 복잡성 대비 이득 없음 |

---

## 설치 명령어

```bash
# 루트 (모노레포 초기화)
npm init -y
# package.json에 "workspaces": ["packages/*"] 추가

# 공유 패키지
mkdir -p packages/shared
cd packages/shared && npm init -y

# 서버
mkdir -p packages/server
cd packages/server && npm init -y
npm install express socket.io nanoid zod
npm install -D typescript @types/express @types/node vitest tsx

# 클라이언트
cd packages/client
npm create vite@latest . -- --template react-ts
npm install socket.io-client zustand react-router-dom zod
npm install -D tailwindcss @tailwindcss/vite
```

**주의:** 위 버전은 2025년 5월 훈련 데이터 기준. 실제 설치 시 `npm install` 하면 최신 버전이 설치되므로 크게 문제 없음. 단, 메이저 버전 변경이 있었을 수 있으니 설치 후 `npm ls` 로 확인 권장.

---

## 핵심 아키텍처 결정: 서버 권위(Server-Authoritative) 모델

카드 게임은 **반드시 서버가 게임 상태의 진실 소스(single source of truth)**여야 함.

- **패 셔플/배분**: 서버에서만 실행. 클라이언트는 자기 패만 수신
- **족보 판정**: 서버에서만 계산. 클라이언트는 결과만 수신
- **베팅 유효성**: 서버에서 검증 (칩 부족, 턴 아님 등)
- **타이머/턴 관리**: 서버에서 관리

클라이언트는 "내 패 보기 + 액션(콜/레이즈/다이) 전송 + 결과 수신"만 담당. 이것이 치팅 방지의 기본이며, Socket.IO의 이벤트 모델이 이 패턴에 자연스럽게 맞음.

---

## Socket.IO Room 활용 전략

```
방 생성 → nanoid로 6자 코드 생성 (예: "aB3xYz")
방 참여 → URL: /room/aB3xYz → socket.join("aB3xYz")
방 내 브로드캐스트 → io.to("aB3xYz").emit("gameState", ...)
개인 메시지 → socket.emit("yourCards", [...]) (본인 패만 전송)
```

Socket.IO의 Room은 이 프로젝트의 "링크 공유로 방 참여" 요구사항에 정확히 부합.

---

## 신뢰도 평가

| 영역 | 신뢰도 | 근거 |
|------|--------|------|
| Socket.IO 선택 | HIGH | 실시간 멀티플레이어 웹 게임의 사실상 표준. 안정적이고 성숙한 라이브러리. 훈련 데이터와 무관하게 확립된 기술 |
| React + Vite | HIGH | 2024-2025년 프론트엔드 표준 조합. 큰 변화 가능성 낮음 |
| Zustand | HIGH | React 상태 관리에서 경량 솔루션으로 확고히 자리잡음 |
| 인메모리 (DB 없음) | HIGH | 프로젝트 요구사항에 완벽히 부합. 기술적 판단이 아닌 요구사항 기반 결정 |
| 버전 번호 | LOW | npm 레지스트리 직접 확인 불가. 2025년 5월 기준 추정치이며, 2026년 3월 현재 메이저 업데이트가 있었을 수 있음 |
| Railway/Render 배포 | MEDIUM | WebSocket 지원 확인됨(훈련 데이터). 요금/기능 변경 가능성 있음 |
| Tailwind v4 | MEDIUM | v4가 2025년 초 출시됨. 설정 방식 변경이 있었으나 핵심 개념은 동일 |

---

## 출처

- Socket.IO 공식 문서 (훈련 데이터, socket.io/docs) — Room, Namespace, 자동 재연결 기능 확인
- React 19 (훈련 데이터) — 2024년 말 정식 출시
- Vite 공식 문서 (훈련 데이터, vite.dev) — React 템플릿, HMR
- Zustand GitHub (훈련 데이터) — React 외부 접근 패턴
- npm workspaces 문서 (훈련 데이터) — 모노레포 설정

**주의:** 모든 출처가 훈련 데이터(2025년 5월 이전)에 기반. 실제 구현 시 각 라이브러리의 최신 공식 문서를 재확인하는 것을 강력히 권장.
