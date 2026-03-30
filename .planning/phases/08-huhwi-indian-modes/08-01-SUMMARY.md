---
phase: "08"
plan: "01"
subsystem: game-engine
tags: [gollagolla, indian, strategy-pattern, card-masking, game-mode]
dependency_graph:
  requires:
    - packages/shared/src/types/game.ts (GameMode, GamePhase, GameState 타입)
  provides:
    - GollagollaModeStrategy (골라골라 모드 Strategy)
    - IndianModeStrategy (인디언섯다 모드 Strategy)
    - selectGollaCards() 공개 메서드
    - getStateFor() 공개 메서드 (인디언 모드 마스킹)
    - dealExtraCardIndian() 공개 메서드
  affects:
    - packages/server/src/index.ts (소켓 핸들러에서 selectGollaCards/dealExtraCardIndian/getStateFor 호출 예정)
tech_stack:
  added: []
  patterns:
    - GameModeStrategy 패턴 확장 (GollagollaModeStrategy, IndianModeStrategy)
    - per-player 상태 마스킹 패턴 (getStateFor)
key_files:
  created: []
  modified:
    - packages/shared/src/types/game.ts
    - packages/server/src/game-engine.ts
decisions:
  - "_gollaSelectedIndices: Map<string, [number, number]> 를 private 필드로 관리 — 선착순 충돌 감지에 인덱스 기반 추적 사용"
  - "인디언 모드 betting-1 완료 시 phase='dealing-extra'로만 전환 — dealExtraCardIndian()은 소켓 핸들러(08-02)가 자동 호출"
  - "getStateFor() 리턴 타입을 GameState로 캐스팅 — null as any로 마스킹된 카드를 클라이언트에서 CardBack으로 렌더링"
metrics:
  duration_minutes: 20
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 2
---

# Phase 8 Plan 01: 공유 타입 확장 + GameEngine 신규 모드 Strategy 구현 Summary

**한 줄 요약:** GameMode/GamePhase 타입에 gollagolla/indian 추가, GameEngine에 GollagollaModeStrategy + IndianModeStrategy + selectGollaCards + getStateFor 구현 완료.

## 완료된 작업

### Task 1: 공유 타입 확장 (커밋: 0071129)

`packages/shared/src/types/game.ts`에 3가지 변경:

1. `GamePhase`에 `'gollagolla-select'` 추가 — 골라골라 20장 오픈 그리드 선택 단계
2. `GameMode`에서 `'regret'` → `'gollagolla'`로 교체 — 골라골라 모드 (후회의섯다는 미사용)
3. `GameState`에 `gollaOpenDeck?: Card[]` 필드 추가 — 골라골라 공개 덱 저장

### Task 2: game-engine.ts 신규 모드 구현 (커밋: 542c83d)

`packages/server/src/game-engine.ts`에 추가된 항목:

**Strategy 클래스 2개:**
- `GollagollaModeStrategy`: deal → `_dealCardsGollagolla`, showdown → `_resolveShowdownOriginal`
- `IndianModeStrategy`: deal → `_dealCardsIndian`, showdown → `_resolveShowdownOriginal`

**getModeStrategy() 수정:** `case 'gollagolla'`와 `case 'indian'` case 추가

**Private 메서드 3개:**
- `_dealCardsGollagolla()`: 덱 20장 → gollaOpenDeck, phase='gollagolla-select'
- `_dealCardsIndian()`: 1장씩 배분, phase='betting-1'
- `_dealExtraCardIndian()`: 2번째 카드 배분, phase='betting-2'

**Public 메서드 3개:**
- `selectGollaCards(playerId, [i0, i1])`: 선착순 선택, CARD_ALREADY_TAKEN 충돌 감지, 모두 완료 시 phase='betting'
- `dealExtraCardIndian()`: dealing-extra phase에서 2번째 카드 배분
- `getStateFor(playerId)`: 인디언 모드 per-player 카드 마스킹

**Private 필드 1개:**
- `_gollaSelectedIndices: Map<string, [number, number]> | null` — 골라골라 선택 인덱스 추적

**기존 로직 수정:**
- `_advanceBettingTurn()`: 인디언 모드 betting-1 완료 시 phase='dealing-extra' 분기 추가

## 검증 결과

```
# shared 빌드
pnpm --filter @sutda/shared build → 성공 (에러 없음)

# server 빌드
pnpm --filter @sutda/server build → 성공 (에러 없음)

# 전체 모노레포 빌드
pnpm build → 3 successful, 3 total (shared/server/client 모두 성공)
```

## 계획 대비 이탈 없음

None — 계획대로 정확히 실행되었습니다.

## Known Stubs

없음 — 이 플랜은 서버 로직/타입 확장이며 UI 렌더링 경로 없음.

## Self-Check: PASSED

- [x] `packages/shared/src/types/game.ts` 에 `'gollagolla-select'` 포함
- [x] `packages/shared/src/types/game.ts` 에 `'gollagolla'` 포함
- [x] `packages/shared/src/types/game.ts` 에 `gollaOpenDeck?: Card[]` 포함
- [x] `packages/server/src/game-engine.ts` 에 `class GollagollaModeStrategy` 포함
- [x] `packages/server/src/game-engine.ts` 에 `class IndianModeStrategy` 포함
- [x] `packages/server/src/game-engine.ts` 에 `selectGollaCards(` 포함
- [x] `packages/server/src/game-engine.ts` 에 `getStateFor(` 포함
- [x] `packages/server/src/game-engine.ts` 에 `_dealCardsGollagolla(` 포함
- [x] `packages/server/src/game-engine.ts` 에 `_dealCardsIndian(` 포함
- [x] `packages/server/src/game-engine.ts` 에 `_dealExtraCardIndian(` 포함
- [x] 커밋 0071129 존재 확인
- [x] 커밋 542c83d 존재 확인
- [x] `pnpm build` 타입 에러 없이 성공
