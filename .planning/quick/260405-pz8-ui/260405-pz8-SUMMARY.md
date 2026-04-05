---
phase: quick-260405-pz8-ui
plan: "01"
subsystem: client-ui, server
tags: [ui-text, rename, quick]
dependency_graph:
  requires: []
  provides: ["암구호 라벨/플레이스홀더", "암구호 에러 메시지"]
  affects: ["packages/client/src/pages/MainPage.tsx", "packages/server/src/index.ts"]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - packages/client/src/pages/MainPage.tsx
    - packages/server/src/index.ts
decisions:
  - "내부 변수명(password, setPassword, INVALID_PASSWORD 등)은 변경하지 않고 UI 노출 텍스트만 변경"
metrics:
  duration: "~3분"
  completed_date: "2026-04-05"
  tasks_completed: 1
  files_modified: 2
---

# Phase quick-260405-pz8-ui Plan 01: 방 생성 UI '비밀번호' -> '암구호' 텍스트 변경 Summary

**한 줄 요약:** 방 생성 UI의 label/placeholder와 서버 에러 메시지에서 "비밀번호"를 "암구호"로 일괄 변경 (내부 변수명 유지)

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 변경 파일 |
|--------|------|------|-----------|
| 1 | 클라이언트 + 서버 UI 텍스트 일괄 변경 | 8e29144 | MainPage.tsx, index.ts |

## 변경 내역

### packages/client/src/pages/MainPage.tsx
- L65: `<label>` 텍스트 "방 생성 비밀번호" → "암구호"
- L69: `placeholder` "방 생성 비밀번호" → "암구호"
- 유지: `id="room-password"`, `type="password"`, `value={password}`, `onChange={(e) => setPassword(...)}`

### packages/server/src/index.ts
- L116: `INVALID_PASSWORD` 에러 메시지 "방 생성 비밀번호가 올바르지 않습니다." → "암구호가 올바르지 않습니다."
- 유지: 키명 `INVALID_PASSWORD`, 변수명 `requiredPassword`, `password`

## 검증 결과

- `grep -rn "비밀번호"` → 0건 (완전 제거)
- `grep -rn "암구호"` → 3건 (클라이언트 2, 서버 1)
- `pnpm --filter client build` → 빌드 성공 (4.57s)

## 플랜 대비 편차

없음 — 계획대로 정확히 실행됨.

## Self-Check: PASSED

- [x] packages/client/src/pages/MainPage.tsx 수정 완료
- [x] packages/server/src/index.ts 수정 완료
- [x] 커밋 8e29144 존재 확인
- [x] "비밀번호" 잔존 텍스트 없음
- [x] "암구호" 3건 확인
