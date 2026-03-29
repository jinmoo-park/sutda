---
phase: 06-ui
plan: 01
subsystem: client
tags: [tailwind-v4, shadcn-ui, zustand, react-router, socket-io-client, vitest, tdd]
dependency_graph:
  requires:
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/card.ts
    - packages/shared/src/types/protocol.ts
    - packages/shared/src/types/room.ts
  provides:
    - packages/client/src/store/gameStore.ts
    - packages/client/src/lib/cardUtils.ts
    - packages/client/src/pages/MainPage.tsx
    - packages/client/src/pages/RoomPage.tsx
  affects:
    - packages/client/src/main.tsx
    - packages/client/vite.config.ts
    - packages/client/tsconfig.json
tech_stack:
  added:
    - tailwindcss@4.2.2
    - "@tailwindcss/vite@4.2.2"
    - react-router-dom@7.13.2
    - zustand@5.0.12
    - socket.io-client@4.8.3
    - "@radix-ui/react-dialog"
    - "@radix-ui/react-separator"
    - "@radix-ui/react-slot"
    - class-variance-authority
    - clsx
    - tailwind-merge
    - lucide-react
    - sonner
    - vitest@3
    - "@testing-library/react@16"
    - "@testing-library/jest-dom@6"
    - jsdom@24
  patterns:
    - Zustand 단일 스토어 + socket.io-client 싱글턴 패턴
    - React Router createBrowserRouter
    - Tailwind v4 @theme inline CSS 변수 방식 (v3 @apply 미사용)
    - shadcn/ui 컴포넌트 수동 설치 (CLI 없이)
key_files:
  created:
    - packages/client/src/store/gameStore.ts
    - packages/client/src/lib/cardUtils.ts
    - packages/client/src/lib/cardUtils.test.ts
    - packages/client/src/pages/MainPage.tsx
    - packages/client/src/pages/RoomPage.tsx
    - packages/client/src/lib/utils.ts
    - packages/client/src/index.css
    - packages/client/src/test/setup.ts
    - packages/client/vitest.config.ts
    - packages/client/components.json
    - packages/client/src/components/ui/button.tsx
    - packages/client/src/components/ui/input.tsx
    - packages/client/src/components/ui/badge.tsx
    - packages/client/src/components/ui/card.tsx
    - packages/client/src/components/ui/separator.tsx
    - packages/client/src/components/ui/dialog.tsx
    - packages/client/src/components/ui/sonner.tsx
    - packages/client/src/pages/__tests__/MainPage.test.tsx
    - packages/client/src/components/game/__tests__/CardFace.test.tsx
    - packages/client/src/components/layout/__tests__/BettingPanel.test.tsx
    - packages/client/src/components/layout/__tests__/GameTable.test.tsx
    - packages/client/src/components/layout/__tests__/ResultScreen.test.tsx
    - packages/client/src/components/layout/__tests__/HandPanel.test.tsx
    - packages/shared/src/types/room.ts
  modified:
    - packages/client/package.json
    - packages/client/vite.config.ts
    - packages/client/tsconfig.json
    - packages/client/src/main.tsx
    - packages/client/index.html
decisions:
  - "Tailwind v4에서 @apply border-border 미지원 -> @theme inline CSS 변수 직접 정의 방식 채택"
  - "shadcn/ui CLI 대신 컴포넌트 파일 수동 생성 (pnpm dlx shadcn init 자동화 불가 환경)"
  - "jsdom@24 채택 (v29는 @exodus/bytes ESM 호환성 문제)"
  - "shared/types/room.ts 이 워크트리에 누락되어 직접 생성 (main repo에서 복사)"
metrics:
  duration: 7
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 24
  files_modified: 5
---

# Phase 6 Plan 01: 클라이언트 UI 기반 인프라 구축 Summary

**한 줄 요약:** Tailwind v4 + shadcn/ui 수동 설치, Zustand 게임 스토어(socket.io-client 싱글턴), React Router v7 라우팅, vitest 테스트 인프라, Wave 0 테스트 스텁 6개 파일 구축 완료

## 목표 달성

Phase 6 Plan 01의 모든 성공 기준을 충족했다:

1. Tailwind v4 유틸리티 클래스가 빌드에 포함됨 (`vite build` 성공, 17KB CSS)
2. shadcn/ui 7개 컴포넌트 설치 완료 (Button, Dialog, Input, Badge, Card, Separator, Sonner)
3. Zustand 스토어가 GameState/RoomState + socket.io-client 싱글턴 관리
4. cardUtils 테스트 10개 모두 통과 (rankToKorean, cardToText, ATTRIBUTE_LABELS)
5. React Router로 `/` 와 `/room/:roomId` 라우팅 작동
6. vitest 테스트 인프라 jsdom@24 환경에서 동작
7. Wave 0 테스트 스텁 6개 파일 생성 (27 todo 항목)

## 태스크별 결과

### Task 1: 패키지 설치 + Tailwind v4 + shadcn/ui 초기화 + 테스트 인프라 + Wave 0 테스트 스텁

**커밋:** `ddbd24d`

- tailwindcss@4.2.2, @tailwindcss/vite, react-router-dom, zustand, socket.io-client 설치
- vitest@3, @testing-library/react, @testing-library/jest-dom, jsdom@24 설치
- vite.config.ts에 tailwindcss 플러그인 + path alias `@` 추가
- tsconfig.json에 baseUrl/paths 추가
- components.json, src/lib/utils.ts(cn), src/index.css(Tailwind v4 CSS 변수) 생성
- shadcn/ui 컴포넌트 7종 수동 생성
- vitest.config.ts + src/test/setup.ts 생성
- Wave 0 테스트 스텁 6개 파일 생성
- 빌드 성공, 테스트 인프라 동작 확인 (17 todo)

### Task 2: Zustand 게임 스토어 + cardUtils + React Router 라우팅 스켈레톤 (TDD)

**커밋:** `9235902`

- cardUtils.test.ts RED -> cardUtils.ts 구현 -> GREEN (10개 테스트 통과)
- gameStore.ts: Zustand 스토어, socket.io-client 싱글턴, game-state/room-state/error 이벤트 처리
- MainPage.tsx: 방 만들기/링크 참여 UI 스켈레톤
- RoomPage.tsx: 게임 룸 페이지 스켈레톤 (phase 표시)
- main.tsx: createBrowserRouter 적용

## 플랜과의 편차 (Deviations)

### 자동 수정 이슈

**1. [Rule 1 - Bug] jsdom v29 ESM 호환성 문제**
- **발견 시점:** Task 1 테스트 실행 시
- **문제:** jsdom@29이 `@exodus/bytes` ESM 모듈을 require()로 로드하려다 `ERR_REQUIRE_ESM` 오류
- **수정:** jsdom@29 -> jsdom@24 다운그레이드
- **수정 파일:** packages/client/package.json, pnpm-lock.yaml
- **커밋:** ddbd24d에 포함

**2. [Rule 1 - Bug] Tailwind v4에서 `@apply border-border` 미지원**
- **발견 시점:** Task 2 빌드 시
- **문제:** `@apply border-border`가 Tailwind v4에서 "Cannot apply unknown utility class" 오류 발생 (v4는 @apply로 CSS 변수 기반 유틸리티 적용 불가)
- **수정:** `@layer base { * { @apply border-border } }` -> `@theme inline` + `border-color: var(--color-border)` 직접 사용 방식으로 교체
- **수정 파일:** packages/client/src/index.css
- **커밋:** 9235902에 포함

**3. [Rule 3 - Blocking] shared/types/room.ts 파일 누락**
- **발견 시점:** Task 2 gameStore.ts 구현 시
- **문제:** `@sutda/shared`의 index.ts가 `./types/room`을 import하지만 이 워크트리에 파일이 없어 빌드 차단
- **수정:** main repo의 room.ts를 이 워크트리에 복사 생성
- **수정 파일:** packages/shared/src/types/room.ts
- **커밋:** 9235902에 포함

**4. [Rule 1 - Bug] shadcn CLI 자동화 불가 환경**
- **발견 시점:** Task 1 shadcn 초기화 시
- **문제:** `pnpm dlx shadcn@latest init`은 interactive CLI로 자동화 불가
- **수정:** components.json 수동 생성 + shadcn 컴포넌트 파일 직접 작성 (공식 shadcn 소스 기반)
- **수정 파일:** components.json, src/components/ui/*.tsx 7개
- **커밋:** ddbd24d에 포함

## Known Stubs

### 의도적 스텁 (Wave 0 - 후속 Plan에서 구현 예정)

- `packages/client/src/pages/RoomPage.tsx`: 방 상태 표시 텍스트만 있음 (`방 {roomId} -- 상태: {phase}`) — Plan 02에서 대기실/게임 테이블/결과 화면 구현
- `packages/client/src/pages/MainPage.tsx`: 방 참여 시 RoomPage로 이동만 하고 join-room 소켓 이벤트를 emit하지 않음 — Plan 02에서 완성
- Wave 0 테스트 스텁 17개 (모두 `it.todo`) — Plan 02/03에서 실제 테스트로 대체

이 스텁들은 Plan 01의 목표(기반 인프라 구축)를 달성하는 데 지장이 없으며, Plan 02/03에서 각각 구현될 예정이다.

## 자체 검증 (Self-Check)

```
packages/client/components.json: FOUND
packages/client/src/components/ui/button.tsx: FOUND
packages/client/src/store/gameStore.ts: FOUND
packages/client/src/lib/cardUtils.ts: FOUND
packages/client/src/pages/MainPage.tsx: FOUND
packages/client/src/pages/RoomPage.tsx: FOUND
packages/client/vitest.config.ts: FOUND
Wave 0 스텁 (6개): FOUND
ddbd24d commit: FOUND
9235902 commit: FOUND
빌드: PASSED (vite build 성공, 361KB JS)
테스트: PASSED (10 passed, 17 todo)
```

## Self-Check: PASSED
