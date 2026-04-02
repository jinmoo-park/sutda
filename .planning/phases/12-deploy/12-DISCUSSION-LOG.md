# Phase 12: 통합 테스트 + 배포 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 12-deploy
**Areas discussed:** 배포 아키텍처, HTTPS + 도메인, 프로세스 관리, 테스트 범위

---

## 배포 아키텍처

| Option | Description | Selected |
|--------|-------------|----------|
| Oracle 통합 서빙 | 현재 구조 그대로 서버가 정적 파일 + WebSocket 모두 처리. 설정 최소화, CORS 문제 없음. | |
| Netlify + Oracle 분리 | Netlify CDN으로 정적 파일, Oracle은 Socket.IO만. CORS/환경변수/도메인 2개 필요. | |
| Netlify + Oracle + nginx | 분리 배포 + nginx 리버스 프록시. WebSocket 프록시 + SSL 종료 처리. | |

**User's choice:** Oracle 통합 서빙 (초기 선택)

**Notes:** 사용자가 HTTPS 필요성과 mixed content 이슈를 확인한 후, 단순 통합 서빙에서 "Oracle 통합 + DuckDNS + SSL"로 최종 확정. Netlify/Vercel 분리는 어차피 Oracle에 SSL이 필요하므로 복잡도만 증가한다는 결론.

---

## HTTPS + 도메인

| Option | Description | Selected |
|--------|-------------|----------|
| IP:3000 HTTP만 | 도메인/SSL 없이 바로 배포. 빠르지만 "안전하지 않음" + 클립보드 제한. | |
| DuckDNS + Let's Encrypt | 무료 서브도메인 + nginx + SSL. 추가 비용 없음. | ✓ |
| 유료 도메인 + Let's Encrypt | 깔끔한 URL. 연 1-2달러 비용. | |

**User's choice:** DuckDNS 무료 도메인 + Let's Encrypt SSL
**Notes:** nginx:443 → Node:3001 리버스 프록시 구성. 외부에 Node 포트 미노출.

---

## 프로세스 관리

| Option | Description | Selected |
|--------|-------------|----------|
| PM2 | 크래시 자동 재시작, 로그 관리, 부팅 시 자동 시작. Node.js 배포 표준. | ✓ |
| systemd 서비스 | Ubuntu 네이티브. 추가 설치 없음. 설정 파일 작성 번거로움. | |
| 단순 nohup | 가장 단순하지만 크래시 시 수동 재시작 필요. | |

**User's choice:** PM2
**Notes:** 1GB RAM 서버에서도 PM2 오버헤드는 무시할 수준.

---

## 테스트 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 수동 테스트 | 배포 후 직접 2대 기기로 테스트. | |
| E2E 자동화 + 수동 | Playwright로 핵심 플로우 E2E 테스트 작성 후 배포. | |
| 기존 단위테스트만 확인 | pnpm test 통과만 확인하고 배포. 최소한의 검증. | ✓ |

**User's choice:** 기존 단위테스트만 확인
**Notes:** 배포 후 수동 테스트 진행 예정.

---

## Claude's Discretion

- nginx 설정 파일 구체적인 내용
- PM2 ecosystem.config.js 구성
- DuckDNS 서브도메인 이름 결정
- 환경변수 설정
- 배포 스크립트/자동화 수준

## Deferred Ideas

None — discussion stayed within phase scope
