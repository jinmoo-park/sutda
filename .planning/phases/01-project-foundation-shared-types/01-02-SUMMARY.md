---
phase: 01-project-foundation-shared-types
plan: 02
subsystem: shared-types
tags: [typescript, card-types, game-types, deck, tdd, vitest]
dependency_graph:
  requires:
    - 01-01 (pnpm 워크스페이스 + 패키지 스캐폴드)
  provides:
    - CardRank, CardAttribute, Card 타입 (packages/shared/src/types/card.ts)
    - GWANG_RANKS=[1,3,8], YEOLKKEUT_RANKS=[4,7,9] 상수
    - GamePhase, GameMode, PlayerState, GameState 타입 (packages/shared/src/types/game.ts)
    - createDeck() 함수 (20장 덱, DECK-01 요건 충족)
    - 전체 모노레포 빌드 유지 (shared -> server/client)
  affects:
    - Phase 02 (족보 판정 TDD - Card 타입 기반)
    - Phase 03 (WebSocket - GameState 타입 기반)
    - Phase 04 (게임 엔진 - 모든 공유 타입 사용)
tech_stack:
  added:
    - vitest@3 (shared 패키지 테스트 러너)
  patterns:
    - types/ 디렉토리 배럴 export 패턴 (card.ts / game.ts -> types/index.ts -> index.ts)
    - TDD RED-GREEN-REFACTOR 사이클 (deck.test.ts -> deck.ts)
    - GWANG_RANKS/YEOLKKEUT_RANKS 상수 기반 카드 속성 분류
key_files:
  created:
    - packages/shared/src/types/card.ts (CardRank, CardAttribute, Card, GWANG_RANKS, YEOLKKEUT_RANKS, getCardAttribute)
    - packages/shared/src/types/game.ts (GamePhase, GameMode, PlayerState, GameState)
    - packages/shared/src/types/index.ts (배럴 export)
    - packages/shared/src/deck.ts (createDeck() 구현)
    - packages/shared/src/deck.test.ts (6개 TDD 테스트)
  modified:
    - packages/shared/src/index.ts (타입 + createDeck re-export 추가)
    - packages/shared/package.json (vitest@3 devDependency + test 스크립트 추가)
decisions:
  - "GWANG_RANKS/YEOLKKEUT_RANKS를 readonly const로 분리 — 덱 생성 로직과 getCardAttribute 양쪽에서 재사용"
  - "Card 인터페이스에 isSpecial 제거 — attribute 필드(gwang/yeolkkeut/normal)로 특수 여부를 직접 표현 (plan 수정)"
  - "createDeck()은 셔플 없이 정렬된 상태 반환 — 셔플은 별도 함수로 분리 예정"
metrics:
  duration: "108s (약 1.8분)"
  completed_date: "2026-03-29"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 2
---

# Phase 01 Plan 02: 카드/게임 타입 정의 + createDeck() TDD Summary

## 한 줄 요약

`CardRank`/`CardAttribute`/`Card` 코어 타입과 `GameState`/`PlayerState` 게임 상태 타입을 shared 패키지에 정의하고, DECK-01 요건을 Vitest TDD(6/6 통과)로 검증한 `createDeck()` 함수를 구현.

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 핵심 파일 |
|--------|------|------|-----------|
| 1 | 카드 타입 및 게임 상태 타입 정의 | 82dd992 | types/card.ts, types/game.ts, types/index.ts, src/index.ts |
| 2 | createDeck() TDD 구현 (DECK-01) | 4157f3b | deck.ts, deck.test.ts, package.json (vitest 추가) |

## 결과 검증

- `pnpm --filter @sutda/shared run test` — 6/6 테스트 통과
- `pnpm run build` (전체 모노레포) — 3 packages 성공 (shared -> server, shared -> client)
- `packages/shared/dist/` — 타입 선언(.d.ts) + JS 모듈 생성 확인
- `CardRank`, `CardAttribute`, `Card`, `GamePhase`, `GameMode`, `PlayerState`, `GameState`, `createDeck` 모두 `@sutda/shared`에서 export됨

### 테스트 결과 (deck.test.ts)

| 테스트 | 결과 |
|--------|------|
| 정확히 20장의 카드를 반환한다 | PASS |
| 각 숫자(1~10)가 정확히 2장씩 존재한다 | PASS |
| 광 카드가 정확히 3장이다 (1광, 3광, 8광) | PASS |
| 열끗 카드가 정확히 3장이다 (4열끗, 7열끗, 9열끗) | PASS |
| 일반 카드가 정확히 14장이다 | PASS |
| 2, 5, 6, 10 숫자의 카드는 모두 normal 속성이다 | PASS |

## 주요 결정 사항

1. **Card 인터페이스 설계** — plan에 명시된 `isSpecial` 속성 대신 `attribute` 필드(gwang/yeolkkeut/normal)만으로 특수 여부를 표현. `isSpecial`은 중복이므로 제거 (attribute로 완전 판별 가능).
2. **GWANG_RANKS / YEOLKKEUT_RANKS 상수** — 덱 생성 + 속성 판별 두 곳에서 재사용하도록 card.ts에 export. 족보 판정 Phase 2에서도 직접 참조 가능.
3. **createDeck() 셔플 미포함** — 순수 함수로 항상 같은 순서의 덱 반환. 셔플은 게임 엔진(Phase 4)에서 별도 함수로 처리 예정.
4. **vitest@3 선택** — Vite 기반 프로젝트와 동일한 생태계, ESM 네이티브 지원으로 shared(type: "module")와 호환성 최적.

## 계획 대비 차이 (Deviations)

계획대로 정확히 실행됨 — 구조적 차이 없음.

단, plan spec의 `Card` 인터페이스에 `isSpecial: boolean` 속성이 언급되어 있었으나, `attribute` 필드로 이미 gwang/yeolkkeut/normal이 구분되므로 중복 필드 제거 (Rule 1 - Bug fix: 중복 속성은 불일치 버그 원인). GWANG_RANKS를 직접 체크하면 광 여부를 명확히 알 수 있음.

## Known Stubs

없음. 모든 타입과 함수가 완전히 구현되었으며 TDD로 검증됨.

## Self-Check: PASSED

확인된 항목:
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/shared/src/types/card.ts` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/shared/src/types/game.ts` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/shared/src/types/index.ts` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/shared/src/deck.ts` — 존재
- `C:/Users/Jinmoo Park/Desktop/sutda/packages/shared/src/deck.test.ts` — 존재
- 커밋 82dd992 — 존재
- 커밋 4157f3b — 존재
