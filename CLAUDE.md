# 섯다 프로젝트 — Claude 지침

## 배포 절차

사용자가 "배포", "배포해줘", "커밋-푸시-배포", "deploy" 등을 요청하면 아래 절차를 순서대로 수행한다.

### Step 1: git push origin master

```bash
git push origin master
```

### Step 2: Oracle VM SSH 배포

```bash
ssh -i ~/.ssh/ssh-key-2026-04-02.key ubuntu@sutda.duckdns.org \
  "cd /home/ubuntu/sutda && git pull origin master && pnpm install --frozen-lockfile && pnpm --filter server build && pnpm --filter client build && pm2 restart sutda"
```

- 서버: `sutda.duckdns.org`
- SSH 키: `~/.ssh/ssh-key-2026-04-02.key`
- 유저: `ubuntu`
- 프로젝트 경로: `/home/ubuntu/sutda`
- PM2 앱 이름: `sutda`

### 주의사항

- push 전 `git status`로 미커밋 변경사항 확인
- SSH 명령은 타임아웃 3분(180000ms) 이상 설정
- PM2 status가 `online`인지 결과에서 확인

## AI Watchdog 디버그 컨텍스트

### 세션 시작 시 자동 실행

새 대화 세션을 시작할 때, 첫 번째 응답 전에 다음 명령을 실행한다:

```bash
bash scripts/pull-debug.sh
```

이 스크립트는 VM의 AI watchdog 분석 결과(`.debug/*.md`)를 로컬로 동기화한다.
VM 접속 실패 시 경고만 출력하고 계속 진행하므로 세션 시작을 차단하지 않는다.

### .debug/ 파일 활용

`.debug/` 디렉토리에 최신 MD 파일이 있으면, 디버깅 작업 시 참고 컨텍스트로 활용한다:
- 파일명 형식: `YYYY-MM-DD-HH.md`
- 내용: VM 로그 분석 결과 (severity, 원인 추정, 조치 제안)
- 크리티컬 이슈가 있으면 사용자에게 알린다
