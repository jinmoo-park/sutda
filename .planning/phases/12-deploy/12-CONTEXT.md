# Phase 12: 통합 테스트 + 배포 - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

실제 친구들이 링크 하나로 접속하여 섯다를 플레이할 수 있도록, Oracle Cloud VM에 서버를 배포하고 HTTPS를 설정한다. 기존 단위테스트 통과를 확인하고, 프로덕션 환경에서 안정적으로 서비스되도록 인프라를 구성한다.

</domain>

<decisions>
## Implementation Decisions

### 배포 아키텍처
- **D-01:** Oracle Cloud Always Free VM(Ubuntu 24.04, 1 OCPU, 1GB RAM, 춘천 리전)에서 프론트엔드+백엔드 통합 서빙. Netlify/Vercel 분리 배포하지 않음. 현재 서버(index.ts)가 client/dist 정적 파일을 이미 서빙하는 구조를 그대로 활용.
- **D-02:** DuckDNS 무료 서브도메인 + nginx 리버스 프록시 + Let's Encrypt SSL 인증서. 추가 비용 0원. nginx가 443(HTTPS)에서 받아 내부 Node.js 3001 포트로 전달. WebSocket 업그레이드도 nginx에서 처리.

### 프로세스 관리
- **D-03:** PM2로 Node.js 프로세스 관리. 크래시 자동 재시작, 로그 관리, 부팅 시 자동 시작(pm2 startup + pm2 save).

### 테스트 전략
- **D-04:** 배포 전 기존 단위테스트(pnpm test) 통과만 확인. E2E 자동화 테스트나 Playwright는 이번 페이즈에서 작성하지 않음. 수동 테스트는 배포 후 진행.

### 서버 접속 정보
- **D-05:** Oracle VM Public IP: 168.107.36.61, Username: ubuntu, SSH 키: ssh-key-2026-04-02.key. 오픈 포트: 22, 80, 443, 3000. iptables 방화벽 규칙 추가 필요.

### Claude's Discretion
- nginx 설정 파일 구체적인 내용 (WebSocket proxy_pass, upstream, buffer 등)
- PM2 ecosystem.config.js 구성
- DuckDNS 서브도메인 이름 결정
- pnpm build 시 환경변수 설정 (PORT 등)
- 배포 스크립트/자동화 수준

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 서버 구조
- `packages/server/src/index.ts` — HTTP 서버 + Socket.IO + 정적 파일 서빙. PORT 환경변수, CLIENT_ORIGIN CORS 설정 확인.
- `packages/server/package.json` — 빌드 스크립트(tsc), 의존성(socket.io)
- `packages/client/package.json` — Vite 빌드, VITE_SERVER_URL 환경변수 사용처 확인

### 프로젝트 구조
- `package.json` (루트) — pnpm workspaces + turborepo. `pnpm build`로 전체 빌드.
- `packages/shared/` — 서버/클라이언트 공유 타입 패키지

### 환경변수 사용처
- `packages/server/src/index.ts:18` — `process.env.PORT || 3001`
- `packages/server/src/index.ts:54` — `process.env.CLIENT_ORIGIN || true` (CORS)
- `packages/client/src/pages/MainPage.tsx:14` — `import.meta.env.VITE_SERVER_URL || ''`
- `packages/client/src/pages/RoomPage.tsx:80` — `import.meta.env.VITE_SERVER_URL || ''`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 서버의 정적 파일 서빙 로직 (`STATIC_DIR = join(process.cwd(), '../../packages/client/dist')`) — 통합 서빙 시 경로만 확인하면 됨
- CORS 설정 (`CLIENT_ORIGIN` 환경변수) — 통합 서빙이라 기본값(true)으로 충분
- `VITE_SERVER_URL` — 통합 서빙이면 빈 문자열(같은 origin)으로 유지

### Established Patterns
- pnpm + turborepo 빌드 파이프라인: `pnpm build` → shared → server(tsc) + client(vite build)
- 서버 빌드 출력: `packages/server/dist/` (TypeScript → JS)
- 클라이언트 빌드 출력: `packages/client/dist/` (Vite 번들)

### Integration Points
- 서버 시작: `node packages/server/dist/index.js` (빌드 후)
- STATIC_DIR 경로가 `process.cwd()` 기준 상대경로 — PM2 시작 위치 주의 필요
- pnpm workspaces 의존성 — 프로덕션에서도 `pnpm install` 필요

</code_context>

<specifics>
## Specific Ideas

### Oracle VM 배포 순서 (사용자 제공)
1. SSH 접속: `ssh -i ssh-key-2026-04-02.key ubuntu@168.107.36.61`
2. Node.js 22 + pnpm 설치
3. git clone → pnpm install → pnpm build → pnpm start
4. iptables 방화벽 규칙 추가 (80, 443, 3000)

### 추가 구성 필요
- nginx 설치 + 리버스 프록시 설정 (HTTPS + WebSocket)
- DuckDNS 서브도메인 등록 + IP 연결
- Let's Encrypt certbot 인증서 발급
- PM2 설치 + 프로세스 등록 + startup 설정

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-deploy*
*Context gathered: 2026-04-02*
