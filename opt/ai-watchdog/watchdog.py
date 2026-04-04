#!/usr/bin/env python3
"""
AI Watchdog -- VM 로그 수집 + Haiku 분석 + MD 덤프
Location: /opt/ai-watchdog/watchdog.py
"""

import os
import re
import sys
import json
import subprocess
from datetime import datetime

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(**kwargs):
        pass

# ────────────────────────────────────────────
# 설정
# ────────────────────────────────────────────
WATCHDOG_LOG_LINES = int(os.getenv("WATCHDOG_LOG_LINES", "200"))
WATCHDOG_CONTEXT_LINES = int(os.getenv("WATCHDOG_CONTEXT_LINES", "50"))
WATCHDOG_SEVERITY_THRESHOLD = int(os.getenv("WATCHDOG_SEVERITY_THRESHOLD", "3"))

# PM2 sutda 로그 경로 (journalctl 대신 PM2 로그 파일 직접 읽기)
# sutda 앱이 PM2로 직접 실행되며 systemd에 등록되어 있지 않음
PM2_OUT_LOG = "/home/ubuntu/logs/sutda-out.log"
PM2_ERR_LOG = "/home/ubuntu/logs/sutda-error.log"
NGINX_ERROR_LOG = "/var/log/nginx/error.log"

# ────────────────────────────────────────────
# 필터 패턴
# ────────────────────────────────────────────
CRITICAL_PATTERNS = [
    r"UnhandledPromiseRejection",
    r"ECONNREFUSED",
    r"EADDRINUSE",
    r"heap out of memory",
    r"SIGTERM|SIGKILL",
    r"upstream timed out",
    r"connect\(\) failed",
    r"no live upstreams",
    r"ERR_PNPM",
    r"Error:|error:|ERROR",
    r"FATAL",
    r"OOM|OutOfMemory",
]

NOISE_PATTERNS = [
    r"GET /health",
    r"GET /favicon",
    r"socket\.io.*polling",
    r"::ffff:",
    r"statusCode.*200",
]


# ────────────────────────────────────────────
# 로그 수집
# ────────────────────────────────────────────
def collect_logs() -> dict:
    """PM2 로그 파일과 nginx error.log에서 최근 로그 수집."""
    result = {"pm2_out": "", "pm2_err": "", "nginx_error": ""}

    # PM2 app stdout 로그
    try:
        proc = subprocess.run(
            ["tail", "-n", str(WATCHDOG_LOG_LINES), PM2_OUT_LOG],
            capture_output=True, text=True, timeout=10
        )
        result["pm2_out"] = proc.stdout if proc.returncode == 0 else ""
    except Exception:
        result["pm2_out"] = ""

    # PM2 app stderr 로그
    try:
        proc = subprocess.run(
            ["tail", "-n", str(WATCHDOG_LOG_LINES), PM2_ERR_LOG],
            capture_output=True, text=True, timeout=10
        )
        result["pm2_err"] = proc.stdout if proc.returncode == 0 else ""
    except Exception:
        result["pm2_err"] = ""

    # nginx error 로그
    try:
        proc = subprocess.run(
            ["tail", "-n", str(WATCHDOG_LOG_LINES), NGINX_ERROR_LOG],
            capture_output=True, text=True, timeout=10
        )
        result["nginx_error"] = proc.stdout if proc.returncode == 0 else ""
    except Exception:
        result["nginx_error"] = ""

    return result


# ────────────────────────────────────────────
# 로그 필터
# ────────────────────────────────────────────
def filter_logs(raw_logs: dict) -> list:
    """NOISE 제거 후 CRITICAL 패턴 매칭 라인만 반환."""
    critical_compiled = [re.compile(p) for p in CRITICAL_PATTERNS]
    noise_compiled = [re.compile(p) for p in NOISE_PATTERNS]

    matched = []
    for source, text in raw_logs.items():
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            # 노이즈 먼저 체크
            if any(np.search(line) for np in noise_compiled):
                continue
            # 크리티컬 패턴 체크
            for cp in critical_compiled:
                if cp.search(line):
                    matched.append({
                        "source": source,
                        "line": line[:500],  # 최대 500자
                        "pattern": cp.pattern,
                    })
                    break  # 첫 번째 매칭 패턴만 기록

    return matched


# ────────────────────────────────────────────
# 시스템 컨텍스트 수집
# ────────────────────────────────────────────
def collect_system_info() -> str:
    """메모리, 디스크, uptime, PM2 프로세스 정보 수집."""
    parts = []

    # 메모리
    try:
        proc = subprocess.run(["free", "-h"], capture_output=True, text=True, timeout=5)
        if proc.returncode == 0:
            lines = proc.stdout.strip().splitlines()
            if len(lines) >= 2:
                parts.append("Memory: " + lines[1])
    except Exception:
        parts.append("Memory: N/A")

    # 디스크
    try:
        proc = subprocess.run(["df", "-h", "/"], capture_output=True, text=True, timeout=5)
        if proc.returncode == 0:
            lines = proc.stdout.strip().splitlines()
            if len(lines) >= 2:
                parts.append("Disk: " + lines[1])
    except Exception:
        parts.append("Disk: N/A")

    # uptime
    try:
        proc = subprocess.run(["uptime"], capture_output=True, text=True, timeout=5)
        if proc.returncode == 0:
            parts.append("Uptime: " + proc.stdout.strip())
    except Exception:
        parts.append("Uptime: N/A")

    # PM2 프로세스 상태
    try:
        proc = subprocess.run(
            ["pm2", "jlist"], capture_output=True, text=True, timeout=10
        )
        if proc.returncode == 0:
            pm2_data = json.loads(proc.stdout)
            pm2_summary = []
            for p in pm2_data:
                name = p.get("name", "?")
                status = p.get("pm2_env", {}).get("status", "?")
                mem = p.get("monit", {}).get("memory", 0)
                cpu = p.get("monit", {}).get("cpu", 0)
                mem_mb = round(mem / 1024 / 1024, 1)
                pm2_summary.append(f"{name}({status}, mem={mem_mb}MB, cpu={cpu}%)")
            parts.append("PM2: " + ", ".join(pm2_summary))
    except Exception:
        parts.append("PM2: N/A")

    return " | ".join(parts)


# ────────────────────────────────────────────
# Haiku API 분석
# ────────────────────────────────────────────
def analyze_with_haiku(filtered_logs: list, system_info: str) -> str:
    """Claude Haiku(claude-haiku-4-5)로 필터링된 로그 분석. 실패 시 에러 문자열 반환."""
    try:
        from anthropic import Anthropic
        client = Anthropic()

        # 컨텍스트 크기 제한: 최대 WATCHDOG_CONTEXT_LINES줄
        log_lines = []
        for entry in filtered_logs[:WATCHDOG_CONTEXT_LINES]:
            log_lines.append(f"[{entry['source']}] {entry['line']}")
        log_text = "\n".join(log_lines)

        user_message = (
            "서버 로그 분석을 요청합니다.\n\n"
            f"## 시스템 정보\n{system_info}\n\n"
            f"## 필터링된 크리티컬 로그 ({len(filtered_logs)}건)\n{log_text}\n\n"
            "각 로그 항목에 대해 JSON 배열로 응답해주세요:\n"
            '[{"severity": 1-5, "summary": "한 줄 요약", "cause": "원인 추정", "action": "권장 조치"}]'
        )

        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            system=(
                "너는 서버 로그 분석 전문가다. 아래 로그를 분석하고 "
                "severity(1-5), 원인 추정, 조치 제안을 JSON 배열로 응답해. "
                "각 항목: {severity: int, summary: str, cause: str, action: str}. "
                "반드시 유효한 JSON 배열만 출력할 것."
            ),
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text
    except Exception as e:
        return f"[Haiku API 호출 실패] {type(e).__name__}: {e}"


# ────────────────────────────────────────────
# MD 보고서 출력
# ────────────────────────────────────────────
def write_report(analysis: str, filtered_logs: list, system_info: str) -> str:
    """분석 결과를 .debug/YYYY-MM-DD-HH.md 로 저장하고 경로 반환."""
    now = datetime.now()
    debug_dir = "/opt/ai-watchdog/.debug"
    os.makedirs(debug_dir, exist_ok=True)

    filename = now.strftime("%Y-%m-%d-%H") + ".md"
    filepath = os.path.join(debug_dir, filename)

    # Haiku 응답 JSON 파싱 후 severity 필터
    filtered_analysis = analysis
    try:
        parsed = json.loads(analysis)
        if isinstance(parsed, list):
            high_severity = [
                item for item in parsed
                if isinstance(item, dict) and item.get("severity", 0) >= WATCHDOG_SEVERITY_THRESHOLD
            ]
            if high_severity:
                filtered_analysis = json.dumps(high_severity, ensure_ascii=False, indent=2)
            else:
                filtered_analysis = (
                    f"(severity >= {WATCHDOG_SEVERITY_THRESHOLD} 항목 없음)\n\n"
                    f"원본:\n{analysis}"
                )
    except (json.JSONDecodeError, TypeError):
        # JSON 파싱 실패 시 원문 그대로
        filtered_analysis = analysis

    # 로그 항목 마크다운
    log_md_lines = []
    for entry in filtered_logs:
        log_md_lines.append(
            f"- **[{entry['source']}]** `{entry['pattern']}` -- {entry['line']}"
        )
    log_md = "\n".join(log_md_lines) if log_md_lines else "(없음)"

    report = (
        f"# Watchdog Report {now.strftime('%Y-%m-%d %H:00')}\n\n"
        f"## System Info\n{system_info}\n\n"
        f"## Filtered Logs ({len(filtered_logs)} entries)\n{log_md}\n\n"
        f"## AI Analysis\n{filtered_analysis}\n\n"
        f"---\nGenerated by ai-watchdog at {now.isoformat()}\n"
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(report)

    return filepath


# ────────────────────────────────────────────
# main
# ────────────────────────────────────────────
def main():
    # dotenv 로드
    load_dotenv(dotenv_path="/opt/ai-watchdog/.env")

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or api_key.startswith("sk-ant-..."):
        print("[ERROR] ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.", file=sys.stderr)
        print("  /opt/ai-watchdog/.env 파일에 실제 API 키를 입력하세요.", file=sys.stderr)
        sys.exit(1)

    print("[watchdog] 로그 수집 중...")
    raw_logs = collect_logs()

    print("[watchdog] 크리티컬 패턴 필터링 중...")
    filtered = filter_logs(raw_logs)

    if not filtered:
        print("[watchdog] 크리티컬 로그 없음 -- 정상 종료")
        sys.exit(0)

    print(f"[watchdog] {len(filtered)}건 크리티컬 로그 발견. 시스템 정보 수집 중...")
    system_info = collect_system_info()

    print("[watchdog] Claude Haiku API 분석 중...")
    analysis = analyze_with_haiku(filtered, system_info)

    print("[watchdog] MD 보고서 작성 중...")
    report_path = write_report(analysis, filtered, system_info)

    print(f"[watchdog] 완료 -> {report_path}")


if __name__ == "__main__":
    main()
