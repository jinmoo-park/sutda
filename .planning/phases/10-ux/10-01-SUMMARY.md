---
phase: 10-ux
plan: "01"
subsystem: client
tags: [card-component, image-utils, tdd, vite]
dependency_graph:
  requires: []
  provides: [HwatuCard, cardImageUtils, img-assets]
  affects: [HandPanel, PlayerSeat, CardFace, CardBack]
tech_stack:
  added: []
  patterns: [3D-flip-CSS, backface-visibility, TDD-red-green]
key_files:
  created:
    - packages/client/src/lib/cardImageUtils.ts
    - packages/client/src/lib/cardImageUtils.test.ts
    - packages/client/src/components/game/HwatuCard.tsx
    - packages/client/src/components/game/__tests__/HwatuCard.test.tsx
    - packages/client/public/img/ (24개 이미지 파일)
  modified: []
decisions:
  - "publicDir 변경 없이 public/img/ 직접 복사 방식 채택 — 가장 단순하고 OS 독립적"
  - "HwatuCard에서 .hwatu-face = 뒷면 이미지(초기 보이는 면), .hwatu-back = 앞면 이미지(뒤집으면 보이는 면) — CSS backface-visibility 관례 준수"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 28
---

# Phase 10 Plan 01: HwatuCard 컴포넌트 + 카드 이미지 에셋 준비 Summary

**한 줄 요약:** 3D flip CSS 구조(perspective/rotateY/backface-visibility)가 적용된 HwatuCard 컴포넌트와 rank+attribute → `/img/` 경로 매핑 유틸리티를 TDD로 구현하고, 24개 카드 이미지를 Vite public 경로에 배치했다.

---

## 완료된 작업

### Task 1: cardImageUtils 유틸리티 + HwatuCard 컴포넌트 생성 (TDD)

**커밋:** `741e276`

**RED 단계:** 테스트 파일 2개 먼저 작성
- `cardImageUtils.test.ts`: 14개 테스트 (전 rank/attribute 조합 검증)
- `HwatuCard.test.tsx`: 8개 테스트 (크기/flip/이미지 경로 검증)

**GREEN 단계:** 구현 파일 작성
- `cardImageUtils.ts`: `getCardImageSrc(card, slotIndex?)` + `getCardBackSrc()` 순수 함수
  - SPECIAL_RANKS Set(1,3,4,7,8,9)으로 fileIndex 결정 로직 구현
  - normal 2장인 rank(2,5,6,10)은 slotIndex 파라미터로 구분
- `HwatuCard.tsx`: 3가지 크기(sm/md/lg) + 3D flip CSS 인라인 스타일 구현
  - `.hwatu-scene`: perspective 600px, 크기 설정
  - `.hwatu-card`: transform-style: preserve-3d, transition 0.45s cubic-bezier
  - `.is-flipped`: faceUp=true일 때 조건부 추가 → rotateY(180deg)
  - `.hwatu-face` / `.hwatu-back`: backface-visibility: hidden + absolute inset-0

**검증:** 22개 테스트 모두 통과 (exit 0)

### Task 2: Vite publicDir 설정 + img 폴더 복사

**커밋:** `3adaa5d`

루트 `img/` 폴더의 24개 파일을 `packages/client/public/img/`에 복사:
- 카드 앞면: 01-1.png ~ 10-2.png (20개)
- 카드 뒷면: card_back.jpg (1개)
- 기타: background.jpg, main_tilte.jpg, regame.png (3개)

vite.config.ts 변경 불필요 — 기본 publicDir(public/)에서 `/img/` 경로로 서빙.

---

## 결정 사항

| 결정 | 근거 |
|------|------|
| public/img/ 직접 복사 | vite.config.ts publicDir 변경 시 루트 전체 파일 노출 위험. OS 독립적이고 가장 단순한 방법 선택 |
| .hwatu-face = 뒷면 이미지 | CSS backface-visibility 관례: 초기 보이는 면(face)이 카드 물리적 뒷면 이미지, 뒤집으면 앞면(back)이 보임 |
| SPECIAL_RANKS Set으로 fileIndex 결정 | rank별 특수 속성 유무를 상수로 관리하여 가독성과 유지보수성 확보 |

---

## 계획 대비 편차

계획대로 실행됨. 편차 없음.

---

## 알려진 스텁

없음 — HwatuCard는 실제 이미지 경로를 사용하며 빈 데이터 없음.

---

## Self-Check

### 파일 존재 확인

- FOUND: packages/client/src/lib/cardImageUtils.ts
- FOUND: packages/client/src/lib/cardImageUtils.test.ts
- FOUND: packages/client/src/components/game/HwatuCard.tsx
- FOUND: packages/client/src/components/game/__tests__/HwatuCard.test.tsx
- FOUND: packages/client/public/img/01-1.png
- FOUND: packages/client/public/img/card_back.jpg

### 커밋 확인

- FOUND: 741e276 — feat(10-ux-01): cardImageUtils 유틸리티 + HwatuCard 컴포넌트 생성
- FOUND: 3adaa5d — chore(10-ux-01): 카드 이미지 파일을 packages/client/public/img/에 복사

## Self-Check: PASSED
