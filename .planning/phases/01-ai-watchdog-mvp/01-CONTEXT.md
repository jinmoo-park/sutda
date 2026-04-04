# Phase 1: AI Watchdog MVP - Context

**Gathered:** 2026-04-05 (discuss mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

VM 로그(journalctl + nginx error.log)를 수집 → 룰 기반 필터로 노이즈 제거 → Claude Haiku API로 분석 → 로컬 `.debug/YYYY-MM-DD-HH.md` 파일로 덤프.

수동 트리거 + cron 자동 실행 모두 지원. 서비스 무중단 원칙. 알림 없음.
실시간 감시가 아니라 "플레이 직후 → 스크립트 실행 → 다음 Claude Code 세션에서 MD 컨텍스트 활용"이 핵심 워크플로우.

</domain>

<decisions>
## Implementation Decisions

### 트리거 방식
- **D-01:** 수동 + cron 둘 다 지원 — `run-watchdog.sh` 하나로 수동 실행 가능하면서, cron에 등록하면 주기 자동 실행도 됨
- **D-02:** VM cron 주기: 브리핑 기본값 유지, 플래닝 시 적절한 주기(예: 매시간) 결정

### MD 저장 위치
- **D-03:** VM 로컬 저장 — `/opt/ai-watchdog/.debug/YYYY-MM-DD-HH.md` (또는 watchdog 최종 위치 하위)
- **D-04:** 로컬 pull 스크립트(`pull-debug.sh`) 제공 — scp/rsync로 VM `.debug/`를 로컬 머신으로 동기화
- **D-05:** pull-debug.sh는 Claude Code 세션 시작 시 자동 실행되도록 설정 — hooks(UserPromptSubmit) 또는 CLAUDE.md 지시로 구현. 로컬 cron 불필요, 로컬 머신 항시 켜져있지 않아도 됨

### Claude의 재량
- watchdog 위치: `/opt/ai-watchdog/` 독립 디렉토리 vs 모노레포 `apps/watchdog/` — Claude 판단으로 결정 (브리핑에서 VM 독립 운영 의도가 보이므로 `/opt/ai-watchdog/` 추천)
- 구현 언어: Python(브리핑 기본) vs TypeScript — Claude 판단. 모노레포와 무관한 VM 독립 스크립트라면 Python이 더 적합
- CRITICAL_PATTERNS 튜닝: 실제 VM 로그 확인 후 결정 (브리핑 초안 참고)
- cron 주기 설정 값

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### AI Watchdog 기획
- `docs/ai-watchdog-brief.md` — 아키텍처 개요, CRITICAL_PATTERNS 초안, 비용 통제 설계, Phase 1 구현 범위 목록, "결정 필요 사항" 체크리스트

No external specs beyond the brief — requirements fully captured in decisions and brief above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 기존 모노레포 코드는 이 watchdog과 직접적 연동 없음 — 독립 스크립트로 구현
- SSH 키: `~/.ssh/ssh-key-2026-04-02.key` — 이미 VM 배포에 사용 중, pull-debug.sh에 재사용 가능
- VM 접속: `ubuntu@sutda.duckdns.org` — 기존 배포 절차(CLAUDE.md)와 동일

### Established Patterns
- Claude API 비용 통제: 브리핑의 Rate limit(분당 3회), 컨텍스트 50줄 제한, severity ≥ 3 필터 패턴 준수
- 모델: `claude-haiku-4-5` (브리핑 결정)

### Integration Points
- Claude Code 세션 시작 hook → `pull-debug.sh` 실행 → 로컬 `.debug/*.md` 동기화
- `.debug/*.md` → Claude Code 세션에서 컨텍스트 파일로 활용

</code_context>

<specifics>
## Specific Ideas

- "플레이 직후 스크립트 실행, 다음 Claude Code 디버그 세션에서 MD를 컨텍스트로 활용" — 브리핑의 핵심 사용 시나리오
- pull-debug.sh를 Claude Code 세션 시작 시 자동 실행 → 세션 열면 항상 최신 VM 로그 분석 결과가 로컬에 있음
- 브리핑에 VM 실제 로그 확인 절차가 상세히 정의되어 있음 — 구현 전 VM SSH 접속 후 유닛명/로그 경로 확인 필수

</specifics>

<deferred>
## Deferred Ideas

- Phase 2 고도화 (브리핑 명시): MCP 서버 전환 → Claude Desktop에서 "서버 상태 어때?" 질의
- Phase 2: 분석 결과 SQLite 저장, Socket.IO 연결 수 메트릭 트래킹

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 01-ai-watchdog-mvp*
*Context gathered: 2026-04-05*
