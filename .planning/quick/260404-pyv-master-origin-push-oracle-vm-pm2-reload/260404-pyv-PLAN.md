---
quick_id: 260404-pyv
slug: master-origin-push-oracle-vm-pm2-reload
description: "현재 master 브랜치 커밋을 origin에 push하고 Oracle VM 서버에 배포한다 (PM2 reload)"
date: 2026-04-04
mode: quick
---

# Quick Task 260404-pyv: master push + Oracle VM 배포

## 목표

로컬 master 브랜치의 최신 커밋 5개를 GitHub origin에 push하고,
Oracle VM(sutda.duckdns.org)에 SSH 접속해 pull → build → pm2 restart 수행

## 푸시 대상 커밋

- d3d5d37 feat(quick-pn6): SFX 제어 2건 수정 — card-reveal 정지 + win-ddaeng 패배자 재생
- 1ba5fe1 docs(quick-pn6): 260404-pn6 완료 — SUMMARY+STATE 업데이트
- 634a7df fix(quick-pn6): Task 12 — win-ddaeng-loser SFX 추가
- 5a5aefa fix(quick-pn6): Task 10 — card-reveal SFX 즉시 정지 기능 추가
- f3bb54c test(09): complete UAT - 7 passed, 0 issues

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
