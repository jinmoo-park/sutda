---
phase: 12-deploy
plan: 02
subsystem: server, devops, infrastructure
tags: [vm-setup, nginx, ssl, pm2, duckdns, certbot, deployment]
dependency_graph:
  requires: [12-01]
  provides: [HTTPS-deployment, PM2-autostart, nginx-reverse-proxy, SSL-cert]
  affects: [packages/shared/src]
tech_stack:
  added: [nginx/1.24.0, certbot/2.9.0, PM2/6.0.14, Node.js/22.22.2, pnpm/9.15.4]
  patterns: [nginx reverse proxy with WebSocket upgrade, PM2 startup systemd, Let's Encrypt SSL, DuckDNS dynamic DNS]
key_files:
  created:
    - /etc/nginx/sites-available/sutda (VM)
    - /home/ubuntu/duckdns/duck.sh (VM)
    - /home/ubuntu/sutda/ (VM - 클론된 앱 코드)
  modified:
    - packages/shared/src/index.ts
    - packages/shared/src/deck.ts
    - packages/shared/src/types/index.ts
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
    - packages/shared/src/hand/evaluator.ts
    - packages/shared/src/hand/compare.ts
    - packages/shared/src/hand/gusa.ts
decisions:
  - "iptables 규칙을 REJECT 규칙 이전에 삽입해야 함 — Oracle VM 기본 체인에 position 5에 REJECT ALL이 있으므로 INSERT 위치 주의"
  - "shared 패키지 상대 import에 .js 확장자 추가 — moduleResolution:bundler는 프로덕션 Node.js ESM에서 extensionless import를 해결 못함"
  - "certbot이 기존 server 블록을 수정하는 방식으로 HTTPS 설정 — WebSocket 헤더와 proxy_read_timeout이 443 블록에 유지됨"
metrics:
  duration: 35분 (2133초)
  completed: "2026-04-02"
  tasks_completed: 2
  files_changed: 8
---

# Phase 12 Plan 02: VM 배포 인프라 구성 Summary

**한 줄 요약:** Oracle VM에 Node.js 22 + pnpm + PM2 + nginx + certbot을 설치하고, ESM import 버그를 수정한 뒤 https://sutda.duckdns.org 로 HTTPS 배포를 완료했다.

## 완료된 작업

### Task 1: VM 기본 설정 (SSH 원격 작업)

- **2GB 스왑 파일** 생성 및 활성화 (`/swapfile`) — `/etc/fstab`에 영구 등록
- **Node.js 22.22.2** 설치 (NodeSource 방식)
- **pnpm 9.15.4** 설치 (corepack 방식)
- **PM2 6.0.14** 설치 (npm global)
- **nginx 1.24.0** + **certbot 2.9.0** 설치
- **iptables** 방화벽 규칙 추가: 포트 80, 443, 3000 ACCEPT (REJECT 규칙 이전에 삽입)
- `iptables-persistent` + `netfilter-persistent save`로 규칙 영구화
- **DuckDNS** `duck.sh` 스크립트 생성 + 실행 (`OK` 응답 확인)
- crontab에 5분 주기 DuckDNS 갱신 등록
- `~/logs/` 디렉토리 생성

### Task 2: 앱 배포 (SSH 원격 작업 + 로컬 버그 수정)

- `git clone https://github.com/jinmoo-park/sutda.git` 완료
- `pnpm install --frozen-lockfile` + `pnpm build` 성공
- `/etc/nginx/sites-available/sutda` nginx 설정 파일 작성
  - `proxy_read_timeout 86400s` (WebSocket 장시간 연결 유지)
  - `proxy_set_header Upgrade $http_upgrade` (WebSocket 업그레이드)
  - `proxy_buffering off`
- default 사이트 비활성화, sutda 심볼릭 링크 활성화
- PM2로 sutda 앱 시작 — online 상태 확인
- HTTP 200 응답 확인 (`localhost:3001`, `http://sutda.duckdns.org`)
- `certbot --nginx -d sutda.duckdns.org --non-interactive` SSL 인증서 발급 성공
  - 인증서 만료: 2026-07-01
  - certbot이 기존 server 블록에 443 설정 추가 (WebSocket 헤더 유지)
- HTTPS 200 응답 확인 (`https://sutda.duckdns.org`)
- PM2 startup systemd 설정 + `pm2 save` 완료
- `certbot.timer` enabled + active 확인

## 이탈 내역 (Deviations)

### 자동 수정된 이슈

**1. [Rule 1 - Bug] iptables REJECT 위치 오류 수정**
- **발견 시점:** Task 1 — iptables 규칙 삽입 후 체인 확인
- **이슈:** 플랜의 `-I INPUT 6/7/8` 명령이 Oracle VM의 기본 체인 구조에서 포트 80/443/3000 규칙을 REJECT 규칙 이후에 배치함. REJECT at position 5 → 새 규칙 at 6/7/8이었으므로 실제로는 차단됨
- **수정:** 기존 잘못된 규칙 삭제 후, position 5/6/7에 재삽입하여 REJECT(position 8로 밀림) 이전에 위치하도록 수정
- **파일:** VM `/etc/iptables/rules.v4` (netfilter-persistent로 저장)
- **커밋:** VM 작업 (로컬 커밋 없음)

**2. [Rule 1 - Bug] shared 패키지 ESM extensionless import 수정**
- **발견 시점:** Task 2 — PM2 시작 후 `localhost:3001` HTTP 000 응답, PM2 로그 확인
- **이슈:** `packages/shared/dist/index.js`에서 `./types/card` 등 `.js` 확장자 없는 상대 import → Node.js 22 ESM이 `ERR_MODULE_NOT_FOUND` 오류
- **원인:** `tsconfig.base.json`의 `moduleResolution: "bundler"` 설정이 번들러 환경에서는 extensionless import를 허용하지만, 프로덕션 Node.js ESM은 `.js` 확장자를 명시적으로 요구함
- **수정:** `packages/shared/src/` 내 모든 상대 import에 `.js` 확장자 추가 (8개 파일)
- **파일:** `packages/shared/src/index.ts`, `deck.ts`, `types/index.ts`, `types/game.ts`, `types/protocol.ts`, `hand/evaluator.ts`, `hand/compare.ts`, `hand/gusa.ts`
- **커밋:** `2a643a5`

## 알려진 스텁 (Known Stubs)

없음 — 이 플랜은 인프라 설정 및 배포이며 UI 스텁 없음.

## 성공 기준 달성 여부

| 기준 | 결과 |
|------|------|
| Oracle VM에 Node.js 22, pnpm 9.15.4, PM2, nginx, certbot 설치 | 완료 |
| 2GB swap 활성화 | 완료 |
| iptables 포트 80/443 ACCEPT (REJECT 이전) | 완료 |
| DuckDNS duck.sh 실행 + crontab 등록 | 완료 |
| packages/server/dist/index.js + packages/client/dist/index.html 존재 | 완료 |
| PM2 sutda 프로세스 online | 완료 |
| https://sutda.duckdns.org 에서 HTTP 200 응답 | 완료 |
| nginx proxy_read_timeout 86400s + Upgrade 헤더 유지 | 완료 |
| certbot SSL 인증서 발급 (2026-07-01 만료) | 완료 |
| PM2 startup systemd + pm2 save 완료 | 완료 |
| certbot.timer enabled + active | 완료 |

## 검증 URL

**HTTPS 배포 URL:** https://sutda.duckdns.org

Task 3 (`checkpoint:human-verify`)에서 사용자 브라우저 수동 테스트 대기 중.

## Self-Check: PASSED

파일 존재 확인:
- `packages/shared/src/index.ts` — `.js` 확장자 추가됨
- `packages/shared/src/deck.ts` — `.js` 확장자 추가됨
- `packages/shared/dist/index.js` — 로컬 빌드 성공, `.js` 확장자 출력 확인

커밋 존재 확인:
- `2a643a5` — fix(12-02) shared ESM .js 확장자 추가

VM 상태 확인 (SSH):
- `pm2 status`: sutda online
- `curl https://sutda.duckdns.org/`: HTTP 200
- `certbot.timer`: enabled
