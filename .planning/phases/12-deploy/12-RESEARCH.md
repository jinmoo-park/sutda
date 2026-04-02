# Phase 12: 통합 테스트 + 배포 - Research

**Researched:** 2026-04-02
**Domain:** Oracle Cloud VM 배포, nginx 리버스 프록시, DuckDNS, Let's Encrypt, PM2, Node.js 프로덕션
**Confidence:** HIGH (핵심 스택 모두 공식 문서 + 다중 소스 검증 완료)

---

<user_constraints>
## User Constraints (CONTEXT.md 기준)

### Locked Decisions
- **D-01:** Oracle Cloud Always Free VM(Ubuntu 24.04, 1 OCPU, 1GB RAM, 춘천)에서 프론트엔드+백엔드 통합 서빙. Netlify/Vercel 분리 배포하지 않음.
- **D-02:** DuckDNS 무료 서브도메인 + nginx 리버스 프록시 + Let's Encrypt SSL. nginx 443 포트 → Node.js 3001 내부 전달. WebSocket 업그레이드도 nginx에서 처리.
- **D-03:** PM2로 Node.js 프로세스 관리. 크래시 자동 재시작 + 로그 관리 + 부팅 시 자동 시작.
- **D-04:** GitHub 리포지토리 → `git clone`으로 Oracle VM에 배포.
- **D-05:** 배포 전 기존 단위테스트(`pnpm test`) 통과 확인만. E2E/Playwright 없음. 수동 테스트는 배포 후.
- **D-06:** Oracle VM Public IP: 168.107.36.61, User: ubuntu, SSH 키: ssh-key-2026-04-02.key. 오픈 포트: 22, 80, 443, 3000.

### Claude's Discretion
- nginx 설정 파일 구체적인 내용 (WebSocket proxy_pass, upstream, buffer 등)
- PM2 ecosystem.config.cjs 구성
- DuckDNS 서브도메인 이름 결정
- pnpm build 시 환경변수 설정 (PORT 등)
- 배포 스크립트/자동화 수준

### Deferred Ideas (범위 외)
- 없음 — 토론이 페이즈 범위 내에서 유지됨
</user_constraints>

---

## 요약

Oracle Cloud Always Free VM(Ubuntu 24.04, 1GB RAM)에 Node.js + Socket.IO 앱을 배포하는 표준 스택은 **NodeSource Node.js 22 + pnpm + PM2 + nginx + certbot + DuckDNS** 조합이다. 이 스택은 추가 비용 없이 HTTPS, WebSocket, 프로세스 재시작, SSL 자동 갱신을 모두 커버한다.

핵심 주의사항은 두 가지다. 첫째, Oracle Cloud VM은 OCI 콘솔의 VCN Security List와 VM 내부 iptables **두 레이어** 방화벽을 모두 열어야 한다. 둘째, 이 프로젝트의 STATIC_DIR 경로(`process.cwd()`를 기준으로 `../../packages/client/dist`)가 상대경로이므로 PM2의 `cwd` 설정이 반드시 모노레포 루트여야 한다.

1GB RAM 제약이 빌드 시 OOM 리스크를 만든다. 빌드를 VM에서 직접 실행하기 전에 1~2GB 스왑 파일을 먼저 생성해야 한다.

**Primary recommendation:** PM2 ecosystem.config.cjs에 `cwd`를 모노레포 루트로, `script`를 `packages/server/dist/index.js`로 명시하고, `max_memory_restart: "700M"`으로 메모리 상한을 설정하라.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22.x LTS | 런타임 | 프로젝트 개발 환경과 동일 버전 유지 (D-01) |
| pnpm | 9.15.4 | 패키지 매니저 | 프로젝트 `packageManager` 필드에 고정됨 |
| PM2 | 5.x (latest) | 프로세스 관리 | 크래시 재시작, startup 스크립트, 로그 관리 (D-03) |
| nginx | 1.24+ (Ubuntu 패키지) | 리버스 프록시 | HTTPS 종단처리 + WebSocket 업그레이드 (D-02) |
| certbot | 2.x + python3-certbot-nginx | SSL 인증서 | Let's Encrypt 무료 인증서 + 자동 갱신 (D-02) |
| DuckDNS | — (무료 DNS 서비스) | 도메인 | 무료 서브도메인 + 동적 IP 업데이트 (D-02) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| iptables-persistent | apt 패키지 | iptables 규칙 영구 저장 | VM 재시작 후에도 방화벽 유지 |
| netfilter-persistent | apt 패키지 | iptables-persistent 서비스 | `netfilter-persistent save` 명령 |

**설치:**
```bash
# Node.js 22 (NodeSource 방식 — 프로덕션 서버 권장)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm (corepack 방식)
sudo corepack enable
corepack prepare pnpm@9.15.4 --activate

# PM2
sudo npm install -g pm2

# nginx + certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx

# iptables 영구화
sudo apt-get install -y iptables-persistent
```

**버전 확인:**
```bash
node --version    # v22.x.x 확인
pnpm --version    # 9.15.4 확인
pm2 --version     # 5.x.x 확인
nginx -v          # nginx/1.24.x 확인
certbot --version # certbot 2.x.x 확인
```

---

## Architecture Patterns

### 권장 배포 디렉토리 구조
```
/home/ubuntu/
└── sutda/                    ← git clone 루트 (이 위치가 cwd)
    ├── packages/
    │   ├── client/dist/      ← Vite 빌드 아웃풋 (정적 파일)
    │   └── server/dist/      ← tsc 빌드 아웃풋
    │       └── index.js      ← PM2가 실행하는 엔트리포인트
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    └── ecosystem.config.cjs  ← PM2 설정 파일 (루트에 위치)
```

> **중요:** `ecosystem.config.cjs` 파일을 모노레포 루트(`/home/ubuntu/sutda/`)에 배치해야 한다. 프로젝트 `package.json`에 `"type": "module"`은 없지만, 서버 패키지에 있으므로 혼동 방지를 위해 `.cjs` 확장자를 사용한다.

### Pattern 1: STATIC_DIR 경로 문제 해결 — `cwd` 명시

**What:** `packages/server/src/index.ts:20`에서 `STATIC_DIR = join(process.cwd(), '../../packages/client/dist')`를 사용함. `process.cwd()`는 PM2가 앱을 시작하는 디렉토리.

**When to use:** PM2로 서버를 시작할 때 항상 적용.

**Example:**
```javascript
// ecosystem.config.cjs — 모노레포 루트에 위치
module.exports = {
  apps: [{
    name: 'sutda',
    script: 'packages/server/dist/index.js',
    cwd: '/home/ubuntu/sutda',   // ← process.cwd()가 이 경로가 됨
    // 따라서 STATIC_DIR = /home/ubuntu/sutda/../../packages/client/dist
    // = /home/ubuntu/packages/client/dist  ← 잘못됨!
    //
    // 실제 올바른 경로 계산:
    // cwd = /home/ubuntu/sutda
    // join(cwd, '../../packages/client/dist')
    //   = /home/ubuntu/sutda/../../packages/client/dist
    //   = /home/packages/client/dist  ← 잘못됨!
    //
    // 따라서 index.ts의 STATIC_DIR 경로 자체를 수정해야 함:
    // 수정 전: join(process.cwd(), '../../packages/client/dist')
    // 수정 후: join(__dirname, '../../packages/client/dist')
    // 또는   : join(__dirname, '../../../packages/client/dist')
    //          (__dirname = /home/ubuntu/sutda/packages/server/dist/)
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
    },
    watch: false,
    max_memory_restart: '700M',
    restart_delay: 3000,
    error_file: '/home/ubuntu/logs/sutda-error.log',
    out_file: '/home/ubuntu/logs/sutda-out.log',
  }]
};
```

> **STATIC_DIR 경로 버그 분석:**
> `__dirname`을 사용하면 항상 `packages/server/dist/`를 기준으로 계산되므로 안전하다.
> - `join(__dirname, '../../../packages/client/dist')`
>   = `/home/ubuntu/sutda/packages/server/dist/../../../packages/client/dist`
>   = `/home/ubuntu/sutda/packages/client/dist` ← **올바름**
>
> `process.cwd()` 방식은 PM2 시작 위치에 따라 달라지므로 안정적이지 않다.
> 단, `process.cwd()`에서 두 단계 올라가도 맞는 경우가 있으려면 cwd가 `packages/server/`여야 한다.
> PM2 `cwd`를 `/home/ubuntu/sutda/packages/server`로 설정하면 현재 코드도 동작하지만, 루트 기준 실행이 일반적이므로 index.ts 수정 권장.

### Pattern 2: nginx 리버스 프록시 + WebSocket + HTTPS

**What:** nginx가 443(HTTPS)에서 요청을 받아 내부 3001 포트로 전달. Socket.IO WebSocket 업그레이드 처리 포함.

**Critical:** `proxy_read_timeout`은 Socket.IO의 `pingInterval + pingTimeout` 기본값 합(45초)보다 커야 한다. 그렇지 않으면 nginx가 유휴 WebSocket 연결을 강제 종료한다.

```nginx
# /etc/nginx/sites-available/sutda
# 소스: nginx 공식 문서 + socket.io 공식 reverse-proxy 가이드

upstream sutda_backend {
  server 127.0.0.1:3001;
  keepalive 64;
}

# HTTP → HTTPS 리다이렉트
server {
  listen 80;
  server_name YOUR_SUBDOMAIN.duckdns.org;

  # certbot HTTP challenge 경로 (인증서 발급 시 필요)
  location /.well-known/acme-challenge/ {
    root /var/www/html;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

# HTTPS + WebSocket 프록시
server {
  listen 443 ssl;
  server_name YOUR_SUBDOMAIN.duckdns.org;

  ssl_certificate     /etc/letsencrypt/live/YOUR_SUBDOMAIN.duckdns.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/YOUR_SUBDOMAIN.duckdns.org/privkey.pem;
  include             /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

  location / {
    proxy_pass         http://sutda_backend;
    proxy_http_version 1.1;

    # WebSocket 업그레이드 헤더 (필수)
    proxy_set_header   Upgrade    $http_upgrade;
    proxy_set_header   Connection "upgrade";

    # 표준 프록시 헤더
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;

    # WebSocket 타임아웃 — pingInterval(25s) + pingTimeout(20s) = 45s 초과해야 함
    proxy_read_timeout  86400s;
    proxy_send_timeout  86400s;
    proxy_connect_timeout 10s;

    # WebSocket은 버퍼링 비활성화 필수
    proxy_buffering off;
  }
}
```

### Pattern 3: Oracle Cloud 방화벽 — 반드시 두 레이어 모두 열기

**What:** Oracle Cloud는 VCN Security List(클라우드 레이어)와 VM 내부 iptables(OS 레이어) 두 곳에서 방화벽을 관리한다. **둘 다 열지 않으면 연결 불가.**

**Step 1 — OCI 콘솔 (VCN Security List):**
- Networking → Virtual Cloud Networks → VCN → Subnets → Default Subnet
- Security Lists → Default Security List → Add Ingress Rules
- Source CIDR: `0.0.0.0/0`, Protocol: TCP, Destination Port: `80,443`

**Step 2 — VM 내부 iptables:**
```bash
# -I INPUT (끝에 추가하면 REJECT 규칙에 걸림 — 앞에 삽입 필수)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 7 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 8 -m state --state NEW -p tcp --dport 3000 -j ACCEPT

# 재시작 후에도 유지
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

> **주의:** `iptables -A`(append)가 아니라 `-I`(insert)를 사용해야 한다. Oracle Cloud Ubuntu 이미지의 기본 iptables에는 INPUT 체인 끝에 REJECT ALL 규칙이 있어, 끝에 추가하면 무시된다.

### Pattern 4: DuckDNS 서브도메인 + IP 자동 업데이트

**What:** DuckDNS에서 서브도메인을 등록하고, VM에서 5분마다 현재 IP를 갱신하는 cron 스크립트를 설정한다.

```bash
# DuckDNS 설정 (duckdns.org에서 토큰과 서브도메인 확인 후 진행)
mkdir ~/duckdns && cd ~/duckdns
cat > duck.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=YOUR_SUBDOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF
chmod 700 duck.sh

# 즉시 테스트
./duck.sh
cat duck.log  # "OK" 확인

# crontab 등록 (5분마다 실행)
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -
```

### Pattern 5: certbot으로 Let's Encrypt 인증서 발급

**What:** HTTP-01 challenge 방식. DuckDNS 도메인이 VM IP를 가리키는 상태에서 포트 80이 열려 있으면 정상 발급된다.

```bash
# certbot nginx 플러그인으로 자동 설정 + 발급
sudo certbot --nginx -d YOUR_SUBDOMAIN.duckdns.org

# 자동 갱신 확인 (Ubuntu 24.04는 systemd timer가 자동 설치됨)
sudo systemctl status certbot.timer
sudo certbot renew --dry-run  # 갱신 시뮬레이션 테스트
```

> certbot 설치 시 Ubuntu 24.04에서 systemd timer가 자동 등록된다. 인증서는 90일 만료, certbot이 만료 30일 전부터 하루 2회 갱신을 시도한다.

### Pattern 6: PM2 startup + save

```bash
# PM2로 앱 시작
pm2 start /home/ubuntu/sutda/ecosystem.config.cjs

# 부팅 시 자동 시작 설정
pm2 startup     # 출력된 sudo 명령어를 복사해서 실행
pm2 save        # 현재 프로세스 목록 저장

# 상태 확인
pm2 status
pm2 logs sutda --lines 50
```

### Anti-Patterns to Avoid

- **`iptables -A` 사용:** Oracle Cloud Ubuntu 이미지에서 INPUT 체인 끝에 REJECT ALL이 있으므로, `-A`로 추가하면 규칙이 적용되지 않는다. 반드시 `-I`(insert)를 사용하라.
- **`process.cwd()` 기반 STATIC_DIR을 그대로 사용:** PM2 시작 위치에 따라 경로가 달라진다. `__dirname` 기반으로 수정하거나 PM2 `cwd`를 정확히 `packages/server` 기준으로 설정해야 한다.
- **pnpm build를 스왑 없이 1GB VM에서 실행:** Vite + tsc 동시 빌드 시 OOM 가능. 빌드 전 스왑 설정 필수.
- **ecosystem.config.js 사용 (ESM 프로젝트):** 서버 패키지에 `"type": "module"`이 있으면 `.js` 파일이 ESM으로 해석되어 PM2에서 오류 발생. 반드시 `ecosystem.config.cjs` 사용.
- **nginx `proxy_read_timeout` 기본값(60s) 유지:** Socket.IO WebSocket이 60초 유휴 상태이면 nginx가 강제 종료한다. 86400s로 설정 필수.
- **VCN Security List만 열고 iptables 무시:** OCI 콘솔에서 포트를 열어도 VM 내부 iptables가 막으면 연결 불가.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSL 인증서 발급/갱신 | 수동 curl + openssl 스크립트 | certbot + python3-certbot-nginx | 90일 자동 갱신, nginx 설정 자동 수정, OCSP stapling 등 복잡한 엣지 케이스 처리 |
| 프로세스 재시작 | 수동 shell script + cron | PM2 | 크래시 감지, 로그 로테이션, startup 스크립트, 메모리 상한 재시작 기능 내장 |
| IP 자동 업데이트 | 직접 DNS API 호출 로직 | DuckDNS cron + duck.sh | 5줄 curl 스크립트로 충분, 이미 확립된 패턴 |
| WebSocket SSL 터미네이션 | Node.js에서 직접 https.createServer | nginx 리버스 프록시 | 인증서 관리 분리, HTTP → HTTPS 리다이렉트, 향후 복수 서비스 대비 |
| 방화벽 규칙 | nftables 직접 작성 | iptables + netfilter-persistent | Oracle Cloud Ubuntu 이미지 기본 설정과 일관성 유지 |

**Key insight:** SSL 갱신, 프로세스 재시작, IP 동기화는 엣지 케이스가 많다. 각 영역에서 검증된 도구(certbot, PM2, DuckDNS)가 존재하므로 커스텀 구현은 불필요하다.

---

## Common Pitfalls

### Pitfall 1: Oracle Cloud 방화벽 두 레이어 — 둘 다 열지 않으면 통신 불가

**What goes wrong:** OCI 콘솔에서 포트를 열었는데도 80/443이 응답하지 않는다.
**Why it happens:** Oracle Cloud Ubuntu 이미지는 OS 레벨 iptables도 별도로 관리한다. VCN Security List만 열어도 iptables에서 차단된다.
**How to avoid:** VCN ingress rules 추가 후, VM에서 반드시 `iptables -I INPUT` + `netfilter-persistent save`까지 실행한다.
**Warning signs:** `curl http://168.107.36.61` 이 timeout되거나 connection refused가 나오는 경우.

### Pitfall 2: STATIC_DIR 경로 — process.cwd() 기준 상대 경로

**What goes wrong:** PM2로 서버를 시작했는데 정적 파일(React 앱)이 404로 응답한다.
**Why it happens:** `index.ts`의 `STATIC_DIR = join(process.cwd(), '../../packages/client/dist')`에서 `process.cwd()`는 PM2가 앱을 시작한 디렉토리다. PM2 `cwd`를 정확히 설정하지 않으면 경로가 틀린다.
**How to avoid:** 두 가지 방법 중 하나 선택:
  1. `index.ts`에서 `process.cwd()` → `__dirname` (또는 `fileURLToPath(import.meta.url)`을 사용하는 ESM 방식 — 단 서버는 CommonJS 빌드이므로 `__dirname` 사용 가능) 으로 변경.
  2. PM2 ecosystem.config.cjs에서 `cwd: '/home/ubuntu/sutda/packages/server'`로 설정 (이 경우 `../../packages/client/dist`가 `/home/ubuntu/packages/client/dist`로 계산되므로 **틀림**).
  
> 안전한 해결책: `index.ts`의 `STATIC_DIR`을 `join(new URL(import.meta.url).pathname, '../../../packages/client/dist')` 방식으로 변경하거나, 빌드 결과물의 `__dirname`을 활용하는 방식으로 수정. TypeScript 빌드 후 `__dirname`은 `packages/server/dist/`이므로: `join(__dirname, '../../../packages/client/dist')` → `/home/ubuntu/sutda/packages/client/dist`.

**Warning signs:** `node packages/server/dist/index.js` 실행 후 `http://localhost:3001/`에서 404 Not found.

### Pitfall 3: 1GB RAM OOM — Vite + tsc 동시 빌드

**What goes wrong:** `pnpm build` 실행 중 VM이 멈추거나 빌드가 SIGKILL로 실패한다.
**Why it happens:** Turborepo가 shared → server(tsc) + client(vite) 빌드를 병렬 실행할 수 있으며, 1GB RAM에서 Vite 번들링은 500MB+ 메모리를 사용할 수 있다.
**How to avoid:** 빌드 전 스왑 파일 생성 필수:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
# 재시작 후에도 유지
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
**Warning signs:** `pnpm build` 중 프로세스가 갑자기 종료되거나 `Killed` 메시지가 출력됨.

### Pitfall 4: ecosystem.config.js ESM 충돌

**What goes wrong:** PM2가 `ecosystem.config.js`를 읽지 못하고 SyntaxError 발생.
**Why it happens:** `packages/server/package.json`에 `"type": "module"`이 있어, 같은 디렉토리의 `.js` 파일이 ESM으로 해석된다. PM2는 기본적으로 CJS를 기대한다.
**How to avoid:** 반드시 파일명을 `ecosystem.config.cjs`로 사용하고, 모노레포 루트(어떤 패키지에도 속하지 않는 위치)에 배치한다. 루트 `package.json`에는 `"type"` 필드가 없으므로 안전하다.
**Warning signs:** `pm2 start ecosystem.config.js` 실행 시 `SyntaxError: Cannot use import statement` 또는 유사한 오류.

### Pitfall 5: DuckDNS HTTP-01 Challenge 실패

**What goes wrong:** `certbot --nginx -d subdomain.duckdns.org` 실행 시 challenge 실패.
**Why it happens:** Let's Encrypt HTTP-01 challenge는 포트 80에 접근 가능해야 한다. DuckDNS DNS가 VM IP를 가리키지 않거나, iptables/VCN에서 포트 80이 막혀 있는 경우.
**How to avoid:**
  1. 먼저 DuckDNS duck.sh 실행 후 `cat duck.log`에서 "OK" 확인.
  2. 외부에서 `curl http://YOUR_SUBDOMAIN.duckdns.org`가 응답하는지 확인.
  3. nginx가 포트 80에서 실행 중인지 확인: `sudo systemctl status nginx`.
  4. 그 다음 certbot 실행.
**Warning signs:** certbot 출력에 `Connection refused` 또는 `Timeout during connect`.

### Pitfall 6: PM2 startup 명령어 미실행

**What goes wrong:** VM 재시작 후 Node.js 서버가 자동으로 뜨지 않는다.
**Why it happens:** `pm2 save`만 실행하고 `pm2 startup` → 출력된 sudo 명령어 실행을 누락한 경우.
**How to avoid:** `pm2 startup` 실행 → 출력된 `sudo env PATH=...` 명령어를 **반드시 복사하여 실행** → `pm2 save` 순서를 지킨다.
**Warning signs:** VM 재시작 후 `pm2 status`에 아무 프로세스도 없음.

### Pitfall 7: pnpm build 후 start 스크립트 누락

**What goes wrong:** `pnpm start` 실행 시 `Missing script: start` 오류.
**Why it happens:** 루트 `package.json`에 `start` 스크립트가 정의되어 있지 않다. 현재 코드베이스에 `start` 스크립트 없음 (확인됨).
**How to avoid:** PM2 ecosystem.config.cjs의 `script` 필드에 직접 `packages/server/dist/index.js`를 지정하거나, 루트 `package.json`에 `"start": "node packages/server/dist/index.js"` 추가.

---

## Code Examples

### 완성된 ecosystem.config.cjs

```javascript
// /home/ubuntu/sutda/ecosystem.config.cjs
// 소스: pm2.keymetrics.io/docs/usage/application-declaration/
module.exports = {
  apps: [{
    name: 'sutda',
    // __dirname 기반 절대경로 방식이 아닌, cwd 기반 상대경로 방식
    script: 'packages/server/dist/index.js',
    cwd: '/home/ubuntu/sutda',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
      // VITE_SERVER_URL은 클라이언트 빌드 시에만 사용, 서버 env에는 불필요
    },
    watch: false,
    max_memory_restart: '700M',
    restart_delay: 3000,
    error_file: '/home/ubuntu/logs/sutda-error.log',
    out_file: '/home/ubuntu/logs/sutda-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
```

> **주의:** 이 설정에서 `cwd: '/home/ubuntu/sutda'`이면 STATIC_DIR 계산:
> `join('/home/ubuntu/sutda', '../../packages/client/dist')` = `/home/packages/client/dist` — 잘못됨!
>
> **index.ts의 STATIC_DIR 수정이 필요하다** (Pitfall 2 참조).
> 올바른 수정:
> ```typescript
> // packages/server/src/index.ts - STATIC_DIR 수정
> // ESM이 아닌 CommonJS 빌드이므로 __dirname 사용 가능
> import { fileURLToPath } from 'url';
> import { dirname } from 'path';
> // TypeScript에서는 __dirname이 자동으로 주입됨 (CommonJS 모듈 빌드 시)
> const STATIC_DIR = join(__dirname, '../../../packages/client/dist');
> // 결과: /home/ubuntu/sutda/packages/server/dist/../../../packages/client/dist
> //     = /home/ubuntu/sutda/packages/client/dist  ← 올바름!
> ```
> 단, 서버 패키지가 `"type": "module"` 없는 CommonJS 빌드라면 tsc 결과물에서 `__dirname`이 자동 주입된다.

### 완성된 nginx 설정 (certbot 실행 전 초기 설정)

```nginx
# /etc/nginx/sites-available/sutda
# certbot 실행 전 기본 설정 (HTTP만)
server {
  listen 80;
  server_name YOUR_SUBDOMAIN.duckdns.org;

  location /.well-known/acme-challenge/ {
    root /var/www/html;
  }

  location / {
    proxy_pass         http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
    proxy_buffering    off;
  }
}
```

```bash
# nginx 심볼릭 링크 활성화 + 테스트
sudo ln -s /etc/nginx/sites-available/sutda /etc/nginx/sites-enabled/sutda
sudo nginx -t
sudo systemctl reload nginx

# certbot 실행 (HTTP-01 challenge + nginx 설정 자동 수정)
sudo certbot --nginx -d YOUR_SUBDOMAIN.duckdns.org
```

### pnpm 프로덕션 설치 + 빌드 순서

```bash
# VM에서 실행 순서
cd /home/ubuntu/sutda

# 재현 가능한 설치 (lockfile 고정)
pnpm install --frozen-lockfile

# 전체 빌드 (shared → server + client 순서 보장됨 by turbo)
pnpm build

# 빌드 결과 확인
ls packages/server/dist/index.js  # 필수 확인
ls packages/client/dist/index.html # 필수 확인
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| nginx + acme.sh (수동) | certbot + python3-certbot-nginx 플러그인 | 2019+ | nginx 설정 자동 수정, systemd timer 자동 갱신 |
| PM2 `forever` 대안 | PM2 5.x (cluster mode 지원) | 2017+ | 단일 인스턴스라면 fork mode, `pm2 startup` 표준화 |
| DuckDNS HTTP challenge (비포트80) | HTTP-01 challenge (포트 80 직접 사용) | 표준 | Oracle Cloud에서 가장 단순한 방식 |
| UFW (Uncomplicated Firewall) | 직접 iptables 조작 | Oracle Cloud 정책 | OCI 공식 문서에서 UFW 사용 비권장 |

**Deprecated/outdated:**
- **UFW**: Oracle Cloud Ubuntu 이미지에서 UFW 사용 비권장 (OCI 공식 문서). iptables 직접 조작 + netfilter-persistent 사용.
- **certbot-dns-duckdns 플러그인 DNS challenge**: HTTP-01보다 복잡하고, 단순 서브도메인 발급에는 불필요. 와일드카드 인증서가 필요한 경우에만 사용.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Oracle Cloud VM | D-01 배포 대상 | ✓ | Ubuntu 24.04 | — |
| SSH 접속 (포트 22) | 배포 실행 | ✓ | D-06 확인됨 | — |
| 포트 80/443 (VCN) | nginx + certbot | D-06: 오픈 예정 | — | VCN 콘솔에서 추가 필요 |
| 포트 3000 (VCN) | D-06에 명시됨 | D-06: 오픈 예정 | — | — |
| GitHub 리포지토리 | D-04 git clone | D-04 결정 (생성 필요) | — | — |
| Node.js 22 | 서버 런타임 | ✗ VM에 미설치 | — | Wave 0에서 설치 |
| pnpm 9.15.4 | 패키지 매니저 | ✗ VM에 미설치 | — | Wave 0에서 설치 |
| PM2 | D-03 프로세스 관리 | ✗ VM에 미설치 | — | Wave 0에서 설치 |
| nginx | D-02 리버스 프록시 | ✗ VM에 미설치 | — | Wave 0에서 설치 |
| certbot | D-02 SSL | ✗ VM에 미설치 | — | Wave 0에서 설치 |

**Missing dependencies with no fallback:**
- GitHub 리포지토리 생성 및 코드 push (D-04) — 배포 전 반드시 완료 필요
- DuckDNS 서브도메인 등록 (duckdns.org에서 수동 생성 필요)

**Missing dependencies with fallback:**
- VM 내 모든 도구(Node.js, pnpm, PM2, nginx, certbot) — Wave 0에서 설치 단계 포함

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 3 |
| Config file | 각 패키지 `vite.config.ts` (또는 package.json의 vitest 기본값) |
| Quick run command | `pnpm --filter @sutda/server test` |
| Full suite command | `pnpm -r test` (전체 워크스페이스) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-05 (테스트 전략) | 기존 단위테스트 통과 확인 | unit (기존 테스트) | `pnpm -r test` | ✅ 기존 테스트 존재 |
| DEPLOY-SMOKE | 배포 후 서버 응답 확인 | smoke (수동) | `curl https://DOMAIN/` | ❌ manual-only |
| DEPLOY-WS | WebSocket 연결 확인 | smoke (수동) | 브라우저에서 직접 확인 | ❌ manual-only |

### Sampling Rate
- **배포 전:** `pnpm -r test` (전체 테스트 통과 확인)
- **배포 후:** 수동 smoke test (브라우저에서 게임 생성 + WebSocket 연결 확인)
- **Phase gate:** 단위테스트 통과 + HTTPS 접속 가능 + Socket.IO 연결 성공

### Wave 0 Gaps
- 신규 테스트 파일 불필요 (D-05: 기존 단위테스트만 사용)

---

## Open Questions

1. **STATIC_DIR 경로 수정 방식 확정**
   - What we know: 현재 `process.cwd()` 기반 상대경로. PM2 cwd 설정에 따라 달라짐.
   - What's unclear: `index.ts`를 직접 수정할지, PM2 cwd를 `packages/server`로 설정할지.
   - Recommendation: `index.ts`에서 `__dirname` 기반으로 수정하는 것이 가장 안전. `const STATIC_DIR = join(__dirname, '../../../packages/client/dist')` — 빌드 결과물 위치(`packages/server/dist/`)에서 3단계 올라가면 모노레포 루트.

2. ~~**GitHub 리포지토리 공개/비공개 여부**~~ → **RESOLVED:** 공개 리포지토리. VM에서 인증 없이 `git clone` 가능.

3. ~~**포트 3001 vs 포트 3000**~~ → **RESOLVED:** 프로덕션은 443 → nginx → 3001 경로만 사용. 포트 3000은 무시해도 됨.

---

## Sources

### Primary (HIGH confidence)
- [Socket.IO Reverse Proxy 공식 문서](https://socket.io/docs/v4/reverse-proxy/) — nginx 설정, proxy_read_timeout, 헤더 설정
- [nginx.org WebSocket 프록시 문서](https://nginx.org/en/docs/http/websocket.html) — Upgrade/Connection 헤더 처리
- [PM2 Ecosystem File 공식 문서](https://pm2.keymetrics.io/docs/usage/application-declaration/) — cwd, script, max_memory_restart 필드
- [DuckDNS 공식 설치 가이드](https://www.duckdns.org/install.jsp) — duck.sh 스크립트, cron 설정
- Oracle Cloud 공식 개발자 블로그 [Enabling Network Traffic to Ubuntu Images](https://blogs.oracle.com/developers/enabling-network-traffic-to-ubuntu-images-in-oracle-cloud-infrastructure) — iptables 두 레이어 방화벽

### Secondary (MEDIUM confidence)
- [Oracle Base: OCI Firewall Rules](https://oracle-base.com/articles/vm/oracle-cloud-infrastructure-oci-amend-firewall-rules) — VCN Security List + iptables 절차
- [DEV Community: Opening ports 80/443 for Oracle Cloud](https://dev.to/armiedema/opening-up-port-80-and-443-for-oracle-cloud-servers-j35) — 단계별 절차 검증
- [fosstechnix: certbot + nginx + Ubuntu 24.04](https://www.fosstechnix.com/secure-nginx-with-certbot-and-lets-encrypt-on-ubuntu-24-04-lts/) — Ubuntu 24.04 certbot 설치 절차
- [computingforgeeks: Node.js 22 on Ubuntu 24.04](https://computingforgeeks.com/install-nodejs-ubuntu-debian/) — NodeSource 설치 방법
- [GitHub Gist: iptables Oracle Cloud](https://gist.github.com/mrladeia/da43fc783610758c6dbcaba22b4f7acd) — 실제 iptables 명령어 패턴

### Tertiary (LOW confidence)
- 없음 — 모든 핵심 사항은 공식 문서 또는 다중 소스로 검증됨

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — 모든 도구 공식 문서 확인, 버전 검증됨
- Architecture (nginx 설정): HIGH — Socket.IO 공식 문서 + nginx 공식 문서 교차 검증
- Architecture (Oracle Cloud 방화벽): HIGH — OCI 공식 문서 + 다중 커뮤니티 소스
- Architecture (STATIC_DIR 경로): MEDIUM — 코드 분석 기반, 실제 VM 테스트 미완료
- PM2 ESM 이슈: HIGH — GitHub 이슈 + PM2 공식 문서 교차 확인
- 1GB RAM OOM 리스크: MEDIUM — 커뮤니티 사례 기반, 프로젝트 특성에 따라 다름

**Research date:** 2026-04-02
**Valid until:** 2026-07-02 (stable stack — 90일)
