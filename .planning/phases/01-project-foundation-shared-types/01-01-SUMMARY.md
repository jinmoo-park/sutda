---
phase: 01-project-foundation-shared-types
plan: 01
subsystem: infra
tags: [monorepo, pnpm, turborepo, typescript, scaffold]
dependency_graph:
  requires: []
  provides:
    - pnpm 워크스페이스 모노레포 구조
    - turborepo 빌드 파이프라인 (shared -> server/client)
    - @sutda/shared 패키지 (타입 공유 기반)
    - @sutda/server 패키지 스캐폴드
    - @sutda/client 패키지 스캐폴드 (React + Vite)
  affects: []
tech_stack:
  added:
    - pnpm@9.15.4 (워크스페이스 패키지 매니저)
    - turbo@2.8.21 (모노레포 빌드 오케스트레이터)
    - typescript@5.9.3 (공유 TypeScript 설정)
    - react@19 + vite@6 (클라이언트 프레임워크)
  patterns:
    - tsconfig.base.json 상속 패턴 (strict: true, ES2022)
    - workspace:* 프로토콜로 내부 패키지 참조
    - turbo dependsOn: ["^build"]로 shared 우선 빌드 보장
key_files:
  created:
    - package.json (루트 모노레포 진입점)
    - pnpm-workspace.yaml (워크스페이스 경로 정의)
    - turbo.json (빌드 파이프라인 태스크 정의)
    - tsconfig.base.json (공유 TypeScript 컴파일러 옵션)
    - .gitignore (node_modules/dist/.turbo 제외)
    - packages/shared/package.json (@sutda/shared 패키지 정의)
    - packages/shared/tsconfig.json (shared TypeScript 설정)
    - packages/shared/src/index.ts (공유 타입 진입점)
    - packages/server/package.json (@sutda/server 패키지 정의)
    - packages/server/tsconfig.json (server TypeScript 설정)
    - packages/server/src/index.ts (서버 진입점)
    - packages/client/package.json (@sutda/client 패키지 정의)
    - packages/client/tsconfig.json (client TypeScript 설정)
    - packages/client/src/main.tsx (React 앱 진입점)
    - packages/client/src/App.tsx (루트 컴포넌트)
    - packages/client/index.html (Vite HTML 템플릿)
    - packages/client/vite.config.ts (Vite 빌드 설정)
  modified: []
decisions:
  - "pnpm workspaces + turborepo 조합으로 모노레포 빌드 파이프라인 구성 (D-01, D-02, D-03)"
  - "tsconfig.base.json 상속 패턴 채택 - strict: true, ES2022, moduleResolution: bundler"
  - "React 19 + Vite 6 조합 채택 (SSR 불필요한 실시간 SPA)"
metrics:
  duration: "152s (약 2.5분)"
  completed_date: "2026-03-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 17
  files_modified: 0
---

# Phase 01 Plan 01: 모노레포 루트 설정 + 패키지 스캐폴드 생성 Summary

## 한 줄 요약

pnpm workspaces + turborepo 기반 모노레포에서 shared -> server/client 빌드 파이프라인을 구성하고, `@sutda/shared` workspace 의존성으로 타입 공유 기반 확립.

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 핵심 파일 |
|--------|------|------|-----------|
| 1 | 모노레포 루트 설정 (pnpm + turborepo + tsconfig) | 65854be | package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .gitignore |
| 2 | shared/server/client 패키지 스캐폴드 생성 및 빌드 검증 | 7147008 | packages/*/package.json, packages/*/tsconfig.json, 소스 파일 12개, pnpm-lock.yaml |

## 결과 검증

- `pnpm install` 성공 (exit code 0) — 4개 워크스페이스 패키지 인식
- `pnpm run build` 성공 (exit code 0) — shared -> server, shared -> client 순서로 빌드
- `packages/shared/dist/index.js` 생성 확인
- `packages/server/src/index.ts`에서 `import {} from '@sutda/shared'` — 타입 에러 없음
- `packages/client/src/App.tsx`에서 `import {} from '@sutda/shared'` — 타입 에러 없음
- Vite client 빌드: 194.68 kB (gzip: 60.91 kB), 26ms

## 주요 결정 사항

1. **pnpm@9.15.4 + turbo@2.8.21** 조합으로 모노레포 구성 — D-01, D-02 결정 구현
2. **tsconfig.base.json 상속 패턴** — strict: true, ES2022 target, moduleResolution: bundler (Vite/Node.js 양쪽 호환)
3. **workspace:* 프로토콜** — server/client가 shared를 로컬 패키지로 참조
4. **turbo dependsOn: ["^build"]** — shared가 항상 server/client 전에 빌드되도록 보장

## 계획 대비 차이 (Deviations)

계획대로 정확히 실행됨 — 차이 없음.

단, corepack을 통해 pnpm@9.15.4를 활성화하는 단계가 필요했으나 (실행 환경에서 pnpm이 PATH에 없었음), 이는 실행 환경 특성으로 코드/설계 변경 없이 처리됨.

## Known Stubs

없음. 모든 파일이 완전한 기능을 포함하거나 의도적인 빈 export (`export {}`)로 표시되어 있으며, 이는 Plan 02에서 타입 추가 예정임.

## Self-Check: PASSED

확인된 항목:
- `C:/Users/Jinmoo Park/Desktop/sutda/package.json` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/pnpm-workspace.yaml` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/turbo.json` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/tsconfig.base.json` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/.gitignore` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/shared/dist/index.js` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/server/dist/index.js` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/client/dist/index.html` — 존재
- 커밋 65854be — 존재
- 커밋 7147008 — 존재
