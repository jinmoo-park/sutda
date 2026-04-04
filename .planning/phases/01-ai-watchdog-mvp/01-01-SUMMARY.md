---
phase: 01-ai-watchdog-mvp
plan: 01
title: "VM Watchdog 핵심 스크립트 + 실행 환경"
subsystem: ai-watchdog
tags: [watchdog, python, cron, claude-haiku, vm-ops]
one_liner: "PM2 로그+nginx error.log 필터링 후 claude-haiku-4-5로 분석, .debug/YYYY-MM-DD-HH.md 덤프하는 독립 Python watchdog — venv + cron 매시간 실행"
dependency_graph:
  requires: []
  provides:
    - /opt/ai-watchdog/watchdog.py
    - /opt/ai-watchdog/run-watchdog.sh
    - /opt/ai-watchdog/.env.example
    - /opt/ai-watchdog/requirements.txt
  affects: []
tech_stack:
  added:
    - Python 3.12 (VM 기존)
    - anthropic SDK 0.89.0
    - python-dotenv 1.2.2
    - python3.12-venv (apt 신규 설치)
  patterns:
    - venv 격리 실행 (Ubuntu 24.04 PEP 668 대응)
    - subprocess CRITICAL/NOISE 필터 패턴
    - cron 0 * * * * 매시간 자동 실행
key_files:
  created:
    - opt/ai-watchdog/watchdog.py
    - opt/ai-watchdog/run-watchdog.sh
    - opt/ai-watchdog/.env.example
    - opt/ai-watchdog/requirements.txt
    - opt/ai-watchdog/.gitignore
  modified: []
decisions:
  - "PM2 sutda 앱이 systemd 미등록 → journalctl 대신 PM2 로그 파일(/home/ubuntu/logs/sutda-*.log) 직접 읽기"
  - "Ubuntu 24.04 PEP 668 제약 → --user pip 불가, python3.12-venv 설치 후 /opt/ai-watchdog/.venv 격리 실행"
  - "run-watchdog.sh에서 .venv/bin/python3 우선, 시스템 python3로 폴백"
  - ".env 파일 퍼미션 600 권고 (T-01-01 위협 대응 — .gitignore로 커밋 방지)"
metrics:
  duration_min: 8
  completed_date: "2026-04-04"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
requirements: [WD-01, WD-02, WD-03]
---

# Phase 1 Plan 1: VM Watchdog 핵심 스크립트 + 실행 환경 Summary

## 목적

VM에서 동작하는 AI Watchdog Python 스크립트와 실행 환경 구성 완료.

`run-watchdog.sh` 실행 시 PM2 sutda 로그 + nginx error.log에서 크리티컬 패턴을 수집하고,  
Claude Haiku(claude-haiku-4-5)로 분석하여 `/opt/ai-watchdog/.debug/YYYY-MM-DD-HH.md`로 덤프.  
수동 실행과 cron 매시간 자동 실행(0 * * * *) 모두 지원.

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 주요 파일 |
|--------|------|------|-----------|
| 1 | watchdog.py 핵심 스크립트 작성 | `0179eb2` | opt/ai-watchdog/watchdog.py, requirements.txt, .env.example |
| 2 | run-watchdog.sh + cron 등록 + pip 설치 | `19521d0` | opt/ai-watchdog/run-watchdog.sh, .gitignore |

## 구현 상세

### watchdog.py 아키텍처

```
collect_logs()
  ├── tail -n 200 /home/ubuntu/logs/sutda-out.log  (PM2 stdout)
  ├── tail -n 200 /home/ubuntu/logs/sutda-error.log (PM2 stderr)
  └── tail -n 200 /var/log/nginx/error.log          (nginx 에러)

filter_logs()
  ├── NOISE_PATTERNS 먼저 제거 (health/favicon/polling 등)
  └── CRITICAL_PATTERNS 매칭 (12개 패턴)

collect_system_info()
  ├── free -h (메모리)
  ├── df -h / (디스크)
  ├── uptime
  └── pm2 jlist → JSON에서 status/mem/cpu 추출

analyze_with_haiku()
  ├── model: claude-haiku-4-5
  ├── max_tokens: 1024
  └── API 실패 시 에러 문자열 반환 (예외 전파 없음)

write_report()
  ├── /opt/ai-watchdog/.debug/YYYY-MM-DD-HH.md
  ├── severity >= 3 필터 (JSON 파싱 성공 시)
  └── 파싱 실패 시 Haiku 원문 그대로 출력
```

### 보안 처리 (T-01-01 위협 대응)

- `.env` 파일 `.gitignore`에 추가 → API 키 커밋 방지
- `.env.example`만 버전 관리에 포함
- API 키 미설정 시 `exit(1)` + 안내 메시지 (예외 없음)

## 편차 (계획 대비 변경사항)

### 자동 수정된 이슈

**1. [Rule 3 - Auto-fix] journalctl 대신 PM2 로그 파일 직접 읽기**
- **발견 시점:** Task 1 - VM 환경 확인 단계
- **이슈:** sutda 앱이 PM2로 직접 실행되며 systemd에 등록되어 있지 않음. `systemctl list-units`에 PM2 관련 유닛 없음. `journalctl -u <유닛명>` 사용 불가.
- **수정:** `collect_logs()`에서 `journalctl` 대신 `tail -n 200 /home/ubuntu/logs/sutda-out.log` 및 `sutda-error.log` 직접 읽기
- **수정 파일:** `opt/ai-watchdog/watchdog.py`
- **커밋:** `0179eb2`

**2. [Rule 3 - Auto-fix] pip3 미설치 → python3.12-venv + venv 격리**
- **발견 시점:** Task 2 - pip3 설치 단계
- **이슈:** Ubuntu 24.04(Python 3.12)에서 pip3 미설치, PEP 668으로 `--user` pip도 차단됨
- **수정:** `sudo apt-get install python3.12-venv` 후 `/opt/ai-watchdog/.venv` 생성, `run-watchdog.sh`에서 `.venv/bin/python3` 우선 사용, 시스템 python3 폴백
- **수정 파일:** `opt/ai-watchdog/run-watchdog.sh`
- **커밋:** `19521d0`

## VM 배포 상태

```
/opt/ai-watchdog/
├── watchdog.py          # 핵심 스크립트 (12KB, python3 AST 검사 통과)
├── run-watchdog.sh      # 실행 엔트리포인트 (chmod 755)
├── requirements.txt     # anthropic>=0.40.0, python-dotenv>=1.0.0
├── .env.example         # API 키 템플릿
├── .gitignore           # .env, .venv/, .debug/, watchdog.log 제외
├── .venv/               # python3 venv (anthropic 0.89.0 설치 완료)
└── watchdog.log         # 실행 로그
```

**cron 등록:** `0 * * * * /opt/ai-watchdog/run-watchdog.sh`

## 다음 단계 (사용자 액션 필요)

ANTHROPIC_API_KEY 설정 필요:

```bash
ssh -i ~/.ssh/ssh-key-2026-04-02.key ubuntu@sutda.duckdns.org \
  "cp /opt/ai-watchdog/.env.example /opt/ai-watchdog/.env && \
   nano /opt/ai-watchdog/.env"
```

API 키 입력 후 수동 테스트:

```bash
ssh -i ~/.ssh/ssh-key-2026-04-02.key ubuntu@sutda.duckdns.org \
  "bash /opt/ai-watchdog/run-watchdog.sh && ls /opt/ai-watchdog/.debug/"
```

## 위협 플래그

| 플래그 | 파일 | 설명 |
|--------|------|------|
| threat_flag: information_disclosure | /opt/ai-watchdog/.env | .env에 API 키 평문 저장 — chmod 600 권고, .gitignore로 커밋 방지 완료 |

## 자체 검사

### 생성 파일 존재 확인

VM SSH 검증 결과 (실행 시점: 2026-04-04T17:32):
- FOUND: /opt/ai-watchdog/watchdog.py (12289 bytes)
- FOUND: /opt/ai-watchdog/run-watchdog.sh (-rwxrwxr-x, chmod 755)
- FOUND: /opt/ai-watchdog/.env.example
- FOUND: /opt/ai-watchdog/requirements.txt
- FOUND: /opt/ai-watchdog/.venv/ (anthropic 0.89.0 설치 완료)
- FOUND: cron 0 * * * * /opt/ai-watchdog/run-watchdog.sh
- SYNTAX OK: python3 AST 파싱 통과

### 커밋 존재 확인

- FOUND: 0179eb2 — feat(01-01): watchdog.py 핵심 스크립트 + 실행 환경 파일 작성
- FOUND: 19521d0 — feat(01-01): run-watchdog.sh 실행 스크립트 + cron 등록 + pip 설치

## Self-Check: PASSED
