---
quick_id: 260404-qni
slug: master-push-oracle-vm-pm2-restart
description: "master push + Oracle VM 배포 (PM2 restart)"
date: 2026-04-04
mode: quick
---

# Quick Task 260404-qni: 커밋-푸시-배포

## 목표

로컬 master 브랜치의 최신 커밋을 GitHub origin에 push하고,
Oracle VM(sutda.duckdns.org)에 SSH 접속해 pull → build → pm2 restart 수행

## 포함 커밋 (a8b616b → 834d4bc)

- 834d4bc docs(quick-260404-qk2): 260404-qk2 완료 — STATE 업데이트
- 5a7fbf7 docs(quick-260404-qk2): 260404-qk2 완료 — SUMMARY 작성
- c32396e fix(quick-260404-qk2): HandPanel 힌트 스팬 제거

## 태스크

<task type="manual">
  <name>Task 1: git push origin master</name>
  <action>git push origin master</action>
</task>

<task type="manual">
  <name>Task 2: Oracle VM SSH 배포</name>
  <action>
ssh -i ~/.ssh/ssh-key-2026-04-02.key ubuntu@sutda.duckdns.org \
  "cd /home/ubuntu/sutda && git pull origin master && pnpm install --frozen-lockfile && pnpm --filter server build && pnpm --filter client build && pm2 restart sutda"
  </action>
</task>
