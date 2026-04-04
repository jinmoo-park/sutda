#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/watchdog.log"
PYTHON="$SCRIPT_DIR/.venv/bin/python3"

# venv가 없으면 시스템 python3로 폴백
if [ ! -x "$PYTHON" ]; then
    PYTHON="/usr/bin/python3"
fi

echo "[$(date -Iseconds)] Watchdog started" >> "$LOG_FILE"

cd "$SCRIPT_DIR"
"$PYTHON" "$SCRIPT_DIR/watchdog.py" >> "$LOG_FILE" 2>&1

EXIT_CODE=$?
echo "[$(date -Iseconds)] Watchdog finished (exit=$EXIT_CODE)" >> "$LOG_FILE"
exit $EXIT_CODE
