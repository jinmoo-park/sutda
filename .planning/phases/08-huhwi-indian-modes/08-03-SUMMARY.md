---
phase: 08-huhwi-indian-modes
plan: "03"
subsystem: client-ui
tags: [골라골라, 인디언섯다, 모달, HandPanel, RoomPage]
dependency_graph:
  requires: [08-01, 08-02]
  provides: [GollaSelectModal, ModeSelectModal-확장, HandPanel-null-카드, RoomPage-gollagolla-통합]
  affects: [packages/client/src/components/modals, packages/client/src/components/layout, packages/client/src/pages]
tech_stack:
  added: []
  patterns: [Dialog 모달 패턴, DealerSelectModal 그리드 재활용, sonner toast, Socket.IO emit]
key_files:
  created:
    - packages/client/src/components/modals/GollaSelectModal.tsx
  modified:
    - packages/client/src/components/modals/ModeSelectModal.tsx
    - packages/client/src/components/layout/HandPanel.tsx
    - packages/client/src/pages/RoomPage.tsx
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
    - packages/server/src/game-engine.ts
    - packages/server/src/game-engine.test.ts
decisions:
  - "PlayerState.cards를 (Card | null)[]로 확장 — 인디언 모드 getStateFor() 마스킹 지원"
  - "GollaSelectModal: 2장 선택 즉시 자동 emit — 확인 버튼 없는 UX"
  - "골라골라 cutting→betting 딜링 애니메이션 스킵 — 직접 선택 모드이므로 showCardConfirm 불필요"
  - "game-error 핸들러를 RoomPage에 직접 추가 — CARD_ALREADY_TAKEN 코드별 특화 메시지 제공"
metrics:
  duration_min: 20
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 8
requirements_satisfied:
  - MODE-HR-01
  - MODE-HR-02
  - MODE-HR-03
  - MODE-HR-04
  - MODE-IN-01
  - MODE-IN-02
  - MODE-IN-03
  - MODE-IN-04
  - MODE-IN-05
---

# Phase 8 Plan 03: 골라골라/인디언섯다 클라이언트 UI 완성 Summary

**한 줄 요약:** GollaSelectModal(20장 선착순 그리드)을 신규 생성하고, ModeSelectModal에 골라골라/인디언섯다 버튼을 추가, HandPanel에 null 카드 CardBack 렌더링, RoomPage에 GollaSelectModal 마운트 및 game-error 토스트를 통합하여 5가지 게임 모드가 모두 선택 가능한 클라이언트 UI를 완성했다.

## 완료된 태스크

| 태스크 | 설명 | 커밋 | 주요 파일 |
|--------|------|------|-----------|
| Task 1 | GollaSelectModal.tsx 신규 생성 + ModeSelectModal 버튼 추가 | 81012ae | GollaSelectModal.tsx (신규), ModeSelectModal.tsx, protocol.ts |
| Task 2 | HandPanel null 카드 처리 + RoomPage GollaSelectModal 마운트 + game-error 토스트 | ba4e976 | HandPanel.tsx, RoomPage.tsx, game.ts |

## 구현 세부사항

### GollaSelectModal.tsx (신규)
- 20장 5열 그리드 (`grid grid-cols-5 gap-2`) — DealerSelectModal 패턴 재활용
- 타인이 선택한 카드: `opacity-40 cursor-not-allowed` dim 처리
- 내 선택 카드: `ring-2 ring-primary` 하이라이트
- 2장 선택 완료 시 자동 `select-gollagolla-cards` emit — 확인 버튼 불필요
- 선택 완료 후 `submitted` 상태로 중복 제출 방지

### ModeSelectModal.tsx
- '골라골라', '인디언섯다' 버튼 2개 추가 (기존 3개 버튼 뒤)
- `mode: 'gollagolla'`, `mode: 'indian'` emit

### HandPanel.tsx
- `import { CardBack }` 추가
- `card === null ? <CardBack /> : <CardFace card={card} />` 조건 분기
- `evaluateHand` 호출 전 `cards[0] !== null && cards[1] !== null` null 가드

### RoomPage.tsx
- `GollaSelectModal` import 및 `phase === 'gollagolla-select'` 조건 마운트
- `game-error` 소켓 핸들러 추가: `CARD_ALREADY_TAKEN` → 특화 메시지, 기타 → 일반 메시지
- 골라골라 모드 `cutting → betting` 딜링 애니메이션 스킵 (직접 선택 모드)

## 계획 대비 차이점 (Deviations)

### 자동 수정 항목

**1. [Rule 3 - Blocking] protocol.ts에 select-gollagolla-cards 이벤트 추가**
- **발견 시점:** Task 1 실행 중
- **문제:** `socket.emit('select-gollagolla-cards', ...)` 호출 시 `ClientToServerEvents`에 해당 이벤트가 없어 TypeScript 에러 발생
- **수정:** `protocol.ts`에 `select-gollagolla-cards`, `CARD_ALREADY_TAKEN` 에러코드 추가 (08-02가 서버쪽 핸들러 추가 예정)
- **수정 파일:** `packages/shared/src/types/protocol.ts`
- **커밋:** 81012ae

**2. [Rule 3 - Blocking] PlayerState.cards 타입을 (Card | null)[]로 확장**
- **발견 시점:** Task 2 실행 중
- **문제:** `HandPanel`에서 `card === null` 체크 시 TypeScript가 "항상 false" 에러 발생 — `cards: Card[]`는 null을 허용하지 않음
- **수정:** `game.ts`에서 `cards: (Card | null)[]`로 변경하여 인디언 모드 서버 마스킹 지원
- **수정 파일:** `packages/shared/src/types/game.ts`, `packages/server/src/game-engine.ts`, `packages/server/src/game-engine.test.ts`
- **커밋:** ba4e976

**3. [Rule 1 - Bug] 서버 showdown 함수의 null 타입 불일치 수정**
- **발견 시점:** Rule 2 수정 후 서버 빌드 에러 확인
- **문제:** `evaluateHand(p.cards[0], p.cards[1])` — `Card | null` → `Card` 타입 불일치
- **수정:** showdown 함수 3곳에 non-null assertion(`!`) 추가 (showdown 단계에서 카드가 null일 수 없음)
- **수정 파일:** `packages/server/src/game-engine.ts`
- **커밋:** ba4e976

## 성공 기준 검증

- [x] GollaSelectModal.tsx 파일이 존재하며 20장 그리드 + 선착순 선택 로직 구현
- [x] ModeSelectModal에 '골라골라', '인디언섯다' 버튼 존재
- [x] HandPanel이 null 카드를 CardBack으로 렌더링
- [x] RoomPage가 gollagolla-select phase에서 GollaSelectModal을 열고, game-error에서 토스트 표시
- [x] 전체 모노레포 `pnpm build`가 타입 에러 없이 성공 (3/3 패키지)

## Known Stubs

없음 — 모든 컴포넌트가 실제 소켓 이벤트 및 gameState와 연결되어 있음.

## Self-Check: PASSED

- [x] GollaSelectModal.tsx: `C:\Users\Jinmoo Park\Desktop\sutda\packages\client\src\components\modals\GollaSelectModal.tsx` 존재
- [x] 커밋 81012ae: git log에서 확인됨
- [x] 커밋 ba4e976: git log에서 확인됨
- [x] 전체 빌드 3/3 패키지 성공
