---
phase: quick-260405-ihi
plan: 01
subsystem: client-server-socket
tags: [proxy-ante, sfx, badge, ux, socket-event]
tech-stack:
  added: []
  patterns: [단일 이벤트 배열 페이로드 패턴, zustand 파생 상태 추적]
key-files:
  created: []
  modified:
    - packages/shared/src/types/protocol.ts
    - packages/server/src/index.ts
    - packages/client/src/store/gameStore.ts
    - packages/client/src/components/layout/ResultScreen.tsx
decisions:
  - proxy-ante-applied 이벤트 페이로드를 배열로 변경하여 단일 emit 패턴 적용
  - SFX를 수혜자 닉네임 포함 여부로 조건부 재생 (서버 playerId 대신 닉네임 비교)
metrics:
  duration: ~8min
  completed: "2026-04-05"
  tasks: 2
  files: 4
---

# Quick Task 260405-ihi: 학교 대신 가주기 UX 버그 3종 수정 Summary

**한 줄 요약:** proxy-ante-applied 단일 이벤트(배열)로 통합 토스트, 대리출석 배지, SFX 수혜자 한정 구현

## 완료된 태스크

| Task | 이름 | Commit | 주요 변경 파일 |
|------|------|--------|---------------|
| 1 | 서버 단일 이벤트 + shared 타입 + gameStore 통합 토스트/상태 | 30a08ea | protocol.ts, index.ts, gameStore.ts |
| 2 | ResultScreen 대리출석 배지 + SFX 수혜자 한정 | 12f742f | ResultScreen.tsx |

## 구현 내용

### Task 1: 서버 + 타입 + 스토어

**`packages/shared/src/types/protocol.ts`**
- `ServerToClientEvents['proxy-ante-applied']` 페이로드 변경
  - 기존: `{ sponsorNickname: string; beneficiaryNickname: string }`
  - 변경: `{ sponsorNickname: string; beneficiaryNicknames: string[] }`

**`packages/server/src/index.ts`**
- `proxy-ante` 핸들러에서 수혜자별 반복 emit 제거
- 단일 `io.to(roomId).emit('proxy-ante-applied', { sponsorNickname, beneficiaryNicknames })` 로 교체

**`packages/client/src/store/gameStore.ts`**
- `GameStore` 인터페이스에 `proxyBeneficiaryNicknames: string[]` 추가
- 초기값 `[]` 설정
- `proxy-ante-applied` 핸들러: 통합 토스트("후원자님이 A, B의 학교를 대신 가줬습니다") + 상태 Set 중복 제거 누적
- `game-state` result phase 탈출 시 `proxyBeneficiaryNicknames: []` 초기화
- `disconnect` 액션에도 `proxyBeneficiaryNicknames: []` 초기화 추가

### Task 2: ResultScreen 배지 + SFX

**`packages/client/src/components/layout/ResultScreen.tsx`**
- `useGameStore()`에서 `proxyBeneficiaryNicknames` 추출
- SFX 핸들러: 수혜자 배열에 본인 닉네임 포함 여부 확인 후 `play('school-proxy')` 조건부 실행
- 플레이어 카드 닉네임 옆 대리출석 배지 추가 (`bg-blue-600/80 text-white "대리출석"`)

## 검증

TypeScript 컴파일: 수정 파일 내 타입 에러 없음 (worktree 환경상 `@sutda/shared` 모듈 해석은 pnpm 심볼릭 링크 필요하여 로컬 tsc 전체 실행은 불가 — 기존 pre-existing 환경 이슈)

코드 일관성 체크: `beneficiaryNickname` (단수) 레퍼런스 전체 제거 확인 완료

## 플랜과의 차이 (Deviations)

없음 — 플랜 그대로 실행됨.

## Self-Check: PASSED

- [x] `packages/shared/src/types/protocol.ts` 수정 확인
- [x] `packages/server/src/index.ts` 수정 확인
- [x] `packages/client/src/store/gameStore.ts` 수정 확인
- [x] `packages/client/src/components/layout/ResultScreen.tsx` 수정 확인
- [x] commit 30a08ea 존재 확인
- [x] commit 12f742f 존재 확인
