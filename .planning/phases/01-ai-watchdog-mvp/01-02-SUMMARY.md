---
phase: 01-ai-watchdog-mvp
plan: "02"
title: "로컬 pull-debug.sh + Claude Code 세션 훅"
subsystem: ai-watchdog
tags: [watchdog, scripts, claude-code, automation]
dependency_graph:
  requires: []
  provides: ["scripts/pull-debug.sh", "CLAUDE.md watchdog 섹션"]
  affects: ["Claude Code 세션 컨텍스트", ".debug/ 로컬 동기화 워크플로우"]
tech_stack:
  added: ["rsync", "bash"]
  patterns: ["SSH 키 재사용 (배포와 동일 키)", "경고 후 계속 진행(graceful degradation) 패턴"]
key_files:
  created:
    - scripts/pull-debug.sh
    - CLAUDE.md
  modified:
    - .gitignore
decisions:
  - ".gitignore /*.md 패턴이 CLAUDE.md를 차단 → !CLAUDE.md 예외 규칙 추가"
metrics:
  duration_min: 10
  completed_date: "2026-04-04"
  tasks_completed: 2
  files_changed: 3
---

# Phase 01 Plan 02: 로컬 pull-debug.sh + Claude Code 세션 훅 Summary

**한 줄 요약:** rsync 기반 pull-debug.sh로 VM `/opt/ai-watchdog/.debug/` → 로컬 `.debug/` 동기화 자동화, CLAUDE.md에 Claude Code 세션 시작 시 자동 실행 지시 추가

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 주요 파일 |
|--------|------|------|-----------|
| 1 | pull-debug.sh 로컬 동기화 스크립트 작성 | 443d800 | scripts/pull-debug.sh, .gitignore |
| 2 | Claude Code 세션 시작 시 자동 실행 설정 | c1cd1b0 | CLAUDE.md, .gitignore |

## 구현 내용

### Task 1: scripts/pull-debug.sh

`/c/Users/Jinmoo Park/Desktop/sutda/.claude/worktrees/agent-a4d17cac/scripts/pull-debug.sh`에 생성됨.

- rsync + SSH로 VM `/opt/ai-watchdog/.debug/` → 로컬 `.debug/` 동기화
- SSH 키: `~/.ssh/ssh-key-2026-04-02.key` (배포에 사용하는 기존 키 재사용)
- `ConnectTimeout=10`, `--timeout=10`으로 네트워크 장애 시 빠른 실패
- VM 접속 실패 시 경고 출력 후 exit 0 (세션 차단 없음)
- `.debug/`를 `.gitignore`에 추가 (분석 결과 파일 커밋 방지)

### Task 2: CLAUDE.md

`CLAUDE.md`에 `## AI Watchdog 디버그 컨텍스트` 섹션 추가:

- 세션 시작 시 `bash scripts/pull-debug.sh` 자동 실행 지시
- `.debug/*.md` 파일 활용 방법 (파일명 형식, 내용, 크리티컬 이슈 알림)
- 기존 `## 배포 절차` / `### 주의사항` 섹션 완전 보존

## 계획 대비 편차

### 자동 수정 사항

**1. [Rule 2 - 누락 기능] .gitignore !CLAUDE.md 예외 규칙 추가**
- **발견 시점:** Task 2 실행 중
- **이슈:** `.gitignore`의 `/*.md` 패턴이 CLAUDE.md를 무시 파일로 처리하여 `git add CLAUDE.md` 불가
- **수정:** `!CLAUDE.md` 예외 규칙 추가 (CLAUDE.md는 프로젝트 지침으로 커밋 필요)
- **수정 파일:** `.gitignore`
- **커밋:** c1cd1b0

**2. [Rule 1 - 버그] CLAUDE.md가 git 히스토리에 미추가 상태**
- **발견 시점:** Task 2 실행 중
- **이슈:** CLAUDE.md가 메인 레포 작업 트리에만 존재하고 커밋되지 않은 untracked 파일 상태
- **수정:** 워크트리에서 CLAUDE.md를 신규 파일로 작성 및 커밋 (`git add` + commit)
- **수정 파일:** CLAUDE.md
- **커밋:** c1cd1b0

**Hook 방식 미구현 (계획 내 조건부 결정):**
- 계획에서 UserPromptSubmit hook은 "지원 여부 확인 후 구현" 으로 명시
- CLAUDE.md 지시 방식이 Claude Code 세션 시작 시 동일한 효과를 제공하므로 hook 별도 구현 생략 (계획 per D-05)

## Known Stubs

없음 — pull-debug.sh가 실제 rsync 명령을 실행하며, CLAUDE.md 지시가 구체적인 명령어를 포함함.

## Threat Flags

없음 — T-02-01(.debug/ gitignore)과 T-02-02(SSH timeout) 위협 모두 완화됨.

## Self-Check: PASSED

- [x] `scripts/pull-debug.sh` 존재 확인: FOUND
- [x] `scripts/pull-debug.sh` 실행 권한 확인: FOUND
- [x] `CLAUDE.md` 존재 및 watchdog 섹션 확인: FOUND
- [x] `.gitignore`에 `.debug/` 항목 확인: FOUND
- [x] 커밋 443d800 확인: FOUND
- [x] 커밋 c1cd1b0 확인: FOUND
