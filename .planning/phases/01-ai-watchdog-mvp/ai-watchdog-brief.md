# AI Watchdog Agent — 기획 브리핑

> **목적**: 이 문서는 Claude Code 에이전트와의 협업 기획 세션을 위한 브리핑이다.
> 코드베이스를 직접 보면서 아래 설계를 실제 프로젝트에 맞게 수정·구현한다.

---

## 배경 및 목표

친구들과 플레이하는 섯다 서비스 특성상, 오류는 **내가 직접 플레이 중일 때만** 발생한다.
실시간 알림보다는, 플레이 세션 직후 VM 로그를 수집·분석하여 **로컬 MD 파일로 덤프**하는 것이 목적이다.
다음 Claude Code 디버그 세션에서 이 MD를 컨텍스트로 활용해 빠르게 원인을 파악한다.

**핵심 원칙**:
- LLM은 룰 기반 필터를 통과한 로그에만 호출 (비용 통제)
- 알림 없음 — 분석 결과는 로컬 `.debug/` 폴더에 MD 파일로 저장
- 수동 트리거 — 플레이 직후 스크립트를 실행하거나 cron으로 주기 실행
- 서비스 무중단 — watchdog 자체가 서비스에 영향을 주어선 안 됨

---

## 현재 스택

```
TypeScript 모노레포 (pnpm + turborepo)
React 19 + Vite 6
Socket.IO 4.x
Node.js + nginx
Oracle Cloud Free Tier VM
```

---

## 아키텍처 개요

```
로그 스트림 (journalctl + nginx error.log)
        ↓
[Rule-based 필터]   ← 노이즈 제거, 크리티컬 패턴만 통과
        ↓
[컨텍스트 수집]     ← 메모리/디스크/프로세스/연결 수 등
        ↓
[Claude Haiku API]  ← 분석 + 조치 제안 (JSON 응답)
        ↓
[로컬 MD 저장]      ← .debug/YYYY-MM-DD-HH.md 에 덤프
                       → 다음 Claude Code 세션에서 컨텍스트로 활용
```

---

## Claude Code에서 확인해야 할 항목

### 1. 로그 소스 확인
```bash
# 실제 서비스 유닛명 확인
systemctl list-units --type=service | grep -E "app|server|worker|api"

# nginx 로그 경로 확인
ls /var/log/nginx/

# 앱 로그 직접 확인 (winston/pino 등 어떤 포맷?)
journalctl -u [실제유닛명] -n 30
```

### 2. 모노레포 구조 파악
```bash
# 워크스페이스 앱 목록
cat pnpm-workspace.yaml

# 각 앱의 로그 설정 확인
find . -name "*.ts" | xargs grep -l "winston\|pino\|bunyan" 2>/dev/null
```

### 3. 기존 에러 패턴 수집
```bash
# 실제로 발생한 에러 패턴 확인 (필터 튜닝용)
journalctl -u [유닛명] -p err --since "7 days ago" | sort | uniq -c | sort -rn | head -20
grep -h "error\|Error\|ERROR" /var/log/nginx/*.log | sort | uniq -c | sort -rn | head -20
```

---

## 구현 범위 (Claude Code와 협의할 것)

### Phase 1 — MVP (우선 구현)
- [ ] 로그 소스 목록 확정 (실제 유닛명, 경로)
- [ ] CRITICAL_PATTERNS 튜닝 (실제 발생 에러 기반)
- [ ] Python watchdog 스크립트 작성
- [ ] `.debug/YYYY-MM-DD-HH.md` 출력 포맷 구현
- [ ] 수동 실행 or cron 트리거 설정

### Phase 2 — 고도화 (선택)
- [ ] MCP 서버로 전환 → Claude Desktop에서 직접 "서버 상태 어때?" 질의 가능
- [ ] 분석 결과 로그 저장 (SQLite 또는 파일)
- [ ] Socket.IO 연결 수 메트릭 트래킹

---

## 핵심 필터 패턴 (초안 — 실제 로그 보고 튜닝 필요)

```python
CRITICAL_PATTERNS = [
    # Node.js / Socket.IO
    r"UnhandledPromiseRejection",
    r"ECONNREFUSED",
    r"EADDRINUSE",
    r"heap out of memory",
    r"SIGTERM|SIGKILL",

    # nginx
    r"upstream timed out",
    r"connect\(\) failed",
    r"no live upstreams",

    # pnpm / turborepo
    r"ERR_PNPM",
    r"turbo.*FAILED",
]

NOISE_PATTERNS = [
    r"GET /health",
    r"GET /favicon",
    r"socket\.io.*polling",  # 정상 polling 제외
]
```

---

## 비용 통제 설계

| 항목 | 설정값 |
|------|--------|
| LLM 모델 | claude-haiku-4-5 (분석용) |
| Rate limit | 분당 최대 3회 API 호출 |
| 출력 threshold | severity ≥ 3 인 이벤트만 MD에 기록 |
| 컨텍스트 크기 | 최대 로그 50줄 + 시스템 정보 요약 |

---

## Claude Code 세션 시작 프롬프트 (복붙용)

```
이 문서를 기반으로 AI watchdog 에이전트를 구현한다.

먼저 다음을 확인해줘:
1. systemctl list-units --type=service 실행해서 실제 앱 서비스 유닛명 파악
2. pnpm-workspace.yaml 읽어서 모노레포 앱 구조 파악
3. 최근 7일간 실제 에러 로그 패턴 수집
4. /var/log/nginx/ 경로 확인

확인 후 CRITICAL_PATTERNS와 로그 소스를 실제 환경에 맞게 수정하고,
/opt/ai-watchdog/ 디렉토리에 구현 시작해줘.
결과는 .debug/YYYY-MM-DD-HH.md 형식으로 저장해줘.
```

---

## 결정 필요 사항

- [ ] watchdog 위치 — `/opt/ai-watchdog/` 독립 디렉토리 or 모노레포 내 `apps/watchdog/`
- [ ] MD 저장 위치 — VM 로컬 후 수동 pull vs 로컬 머신에 직접 저장
- [ ] MCP 서버 Phase 2 포함 여부
