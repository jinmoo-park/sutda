#!/usr/bin/env bash
# VM watchdog .debug/ 폴더를 로컬로 동기화
# Usage: bash scripts/pull-debug.sh

set -euo pipefail

SSH_KEY="$HOME/.ssh/ssh-key-2026-04-02.key"
REMOTE_USER="ubuntu"
REMOTE_HOST="sutda.duckdns.org"
REMOTE_DIR="/opt/ai-watchdog/.debug/"
LOCAL_DIR=".debug/"

# 로컬 .debug/ 디렉토리 생성
mkdir -p "$LOCAL_DIR"

echo "[pull-debug] Syncing VM .debug/ -> local .debug/ ..."

# scp로 동기화 (rsync 미설치 환경 대응, SSH 타임아웃 10초)
if scp -q -r \
  -i "$SSH_KEY" \
  -o ConnectTimeout=10 \
  -o StrictHostKeyChecking=no \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}*" \
  "$LOCAL_DIR" 2>/dev/null; then
  FILE_COUNT=$(find "$LOCAL_DIR" -name "*.md" -type f 2>/dev/null | wc -l)
  echo "[pull-debug] Done. ${FILE_COUNT} report(s) in .debug/"
else
  echo "[pull-debug] WARNING: VM sync failed (network issue?). Continuing with existing local .debug/"
fi
