---
phase: 14-room-password
plan: "01"
subsystem: auth
tags: [server-auth, socket, client-ui, env-config]
dependency_graph:
  requires: []
  provides: [ROOM-CREATE-PASSWORD-SERVER, ROOM-CREATE-PASSWORD-CLIENT]
  affects: [packages/shared/src/types/protocol.ts, packages/server/src/index.ts, packages/client/src/pages/MainPage.tsx]
tech_stack:
  added: []
  patterns: [env-var-auth, socket-error-handling, optional-field-backward-compat]
key_files:
  created: []
  modified:
    - packages/shared/src/types/protocol.ts
    - packages/server/src/index.ts
    - packages/client/src/pages/MainPage.tsx
decisions:
  - "ROOM_CREATE_PASSWORD 환경변수 설정 시에만 비밀번호 강제 — 미설정 시 하위 호환으로 누구나 방 생성 가능"
  - "password 필드를 optional로 정의 — 기존 클라이언트 및 테스트 코드 변경 없이 호환"
  - "클라이언트에서 빈 문자열은 undefined로 변환하여 emit — 빈 값과 미입력 동일 처리"
metrics:
  duration: 2
  completed_date: "2026-04-02"
  tasks: 2
  files: 3
---

# Phase 14 Plan 01: 서버 레벨 방 생성 패스워드 Summary

**한 줄 요약:** ROOM_CREATE_PASSWORD 환경변수 기반 서버 권위 방 생성 비밀번호 검증 + 클라이언트 비밀번호 입력 UI 구현

## 목표

낯선 사람이 무단으로 방을 생성하는 것을 방지하기 위해, 서버 환경변수(.env)로 관리되는 비밀번호를 검증하는 기능을 추가한다.

## 완료된 작업

### Task 1: 프로토콜 타입 확장 + 서버 비밀번호 검증
**커밋:** `5a7d330`

**변경 내용:**
- `packages/shared/src/types/protocol.ts`: `ErrorPayload.code` union에 `INVALID_PASSWORD` 추가
- `packages/shared/src/types/protocol.ts`: `create-room` 이벤트에 `password?: string` 옵셔널 필드 추가
- `packages/server/src/index.ts`: `ERROR_MESSAGES`에 `INVALID_PASSWORD: '방 생성 비밀번호가 올바르지 않습니다.'` 추가
- `packages/server/src/index.ts`: `create-room` 핸들러에 `ROOM_CREATE_PASSWORD` 환경변수 기반 비밀번호 검증 로직 추가

**비밀번호 검증 로직:**
```typescript
const requiredPassword = process.env.ROOM_CREATE_PASSWORD;
if (requiredPassword && password !== requiredPassword) {
  return emitError(socket, 'INVALID_PASSWORD');
}
```

### Task 2: 클라이언트 비밀번호 입력 UI
**커밋:** `8d462d7`

**변경 내용:**
- `packages/client/src/pages/MainPage.tsx`: `password` 상태 변수 추가
- `packages/client/src/pages/MainPage.tsx`: 닉네임 Input 다음에 `type="password"` 입력 필드 추가 (placeholder: "방 생성 비밀번호")
- `packages/client/src/pages/MainPage.tsx`: `create-room` emit 시 `password` 필드 포함 (빈 문자열 → `undefined`)
- `packages/client/src/pages/MainPage.tsx`: `s.once('error', errorHandler)`로 INVALID_PASSWORD 에러 toast 처리 + room-created 수신 시 리스너 해제

## 결정 사항

| 결정 | 근거 |
|------|------|
| 환경변수 미설정 시 하위 호환 | 기존 배포 환경에서 설정 없이 동작하도록 하위 호환성 유지 |
| `password` optional 필드 | 기존 테스트 코드 및 다른 클라이언트 코드 변경 없이 호환 |
| 빈 문자열 → undefined 변환 | 서버에서 `password !== requiredPassword` 비교 시 빈 값과 미입력 동일 처리 |
| 클라이언트 s.once('error') 리스너 | gameStore 전역 에러 처리와 별개로 방 생성 흐름에서만 에러 캐치 |

## 검증 결과

- `grep "INVALID_PASSWORD" packages/shared/src/types/protocol.ts` — PASS
- `grep "password?" packages/shared/src/types/protocol.ts` — PASS
- `grep "ROOM_CREATE_PASSWORD" packages/server/src/index.ts` — PASS
- `grep "INVALID_PASSWORD" packages/server/src/index.ts` — PASS
- `grep 'type="password"' packages/client/src/pages/MainPage.tsx` — PASS
- TypeScript 컴파일 (소스 파일): PASS (워크트리 환경 미설치 의존성 제외한 사전 존재 에러들만 존재)

## 계획 대비 편차

없음 — 계획에 명시된 대로 정확히 실행됨.

## Known Stubs

없음.

## Self-Check: PASSED

- `packages/shared/src/types/protocol.ts`: FOUND
- `packages/server/src/index.ts`: FOUND
- `packages/client/src/pages/MainPage.tsx`: FOUND
- Commit `5a7d330`: FOUND
- Commit `8d462d7`: FOUND
