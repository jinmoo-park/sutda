---
phase: "04-original-mode-game-engine"
plan: "01"
subsystem: "game-engine"
tags: ["game-engine", "fsm", "tdd", "protocol", "types"]
dependency_graph:
  requires: ["Phase 03 WebSocket 인프라", "@sutda/shared 타입 시스템"]
  provides: ["GameEngine 클래스", "BetAction 타입", "게임 프로토콜 이벤트"]
  affects: ["packages/server/src/game-engine.ts", "packages/shared"]
tech_stack:
  added: ["GameEngine FSM 패턴"]
  patterns: ["State Machine", "Fisher-Yates 셔플", "TDD Red-Green"]
key_files:
  created:
    - packages/server/src/game-engine.ts
    - packages/server/src/game-engine.test.ts
  modified:
    - packages/shared/src/types/game.ts
    - packages/shared/src/types/protocol.ts
    - packages/shared/src/index.ts
decisions:
  - "[Phase 04-01]: completeAttendSchool()를 public으로 노출 — 타임아웃 처리 시 외부 호출 필요"
  - "[Phase 04-01]: cut 후 자동으로 dealCards() 호출 — FSM 전환 일관성 유지"
  - "[Phase 04-01]: declareTtong 후 phase=betting (dealing 경유) — 퉁 선언 후 즉시 betting 전환"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-29"
  tasks_completed: 1
  files_changed: 5
---

# Phase 04 Plan 01: GameEngine FSM 핵심 구현 요약

## 한 줄 요약

Fisher-Yates 셔플, 복수분할 기리, 반시계 배분, 밤일낮장 선 결정을 포함한 GameEngine FSM (dealer-select → attend-school → mode-select → shuffling → cutting → dealing → betting) TDD 구현.

## 완료된 태스크

| 태스크 | 이름 | 커밋 | 핵심 파일 |
|--------|------|------|----------|
| 1 | 프로토콜 타입 확장 + GameEngine FSM 핵심 구현 | 6c5617f | game-engine.ts, game-engine.test.ts, game.ts, protocol.ts, index.ts |

## 구현 상세

### 타입 확장 (packages/shared)

**GamePhase** union에 2개 단계 추가:
- `'dealer-select'` — 첫 판 밤일낮장 카드 선택
- `'attend-school'` — 앤티(500원) 등교 단계

**BetAction** 타입 신규 정의:
```typescript
export type BetAction =
  | { type: 'call' }
  | { type: 'raise'; amount: number }
  | { type: 'die' }
  | { type: 'check' };
```

**GameState** 인터페이스에 필드 추가:
- `deck: Card[]` — 서버 내부 덱 추적
- `dealerSelectCards?` — 밤일낮장 선택 기록
- `isTtong: boolean` — 퉁 여부
- `attendedPlayerIds: string[]` — 등교 플레이어 목록

**protocol.ts** 게임 이벤트 추가 (8개 클라이언트 이벤트, 2개 서버 이벤트).

### GameEngine 클래스 (packages/server)

FSM 상태 전환 흐름:
```
dealer-select -> attend-school -> mode-select -> shuffling -> cutting -> dealing -> betting
```

핵심 메서드:
- `selectDealerCard(playerId, cardIndex)` — 밤일낮장 카드 선택, 모든 플레이어 완료 시 선 결정
- `setDealerFromPreviousWinner(winnerId)` — 2판 이후 이전 승자를 선으로 설정
- `attendSchool(playerId)` — 앤티 500원, 미등교자 isAlive=false
- `completeAttendSchool()` — 타임아웃/강제 완료
- `selectMode(playerId, mode)` — dealer만 가능
- `shuffle(playerId)` — Fisher-Yates 셔플, cutter 결정
- `cut(playerId, cutPoints, order)` — 복수 분할 재조립 후 자동 배분
- `declareTtong(playerId)` — 퉁 선언 후 자동 배분
- `_dealCards()` (private) — 반시계 방향 배분 (퉁: 2장씩, 일반: 1장씩 2라운드)
- `getCounterClockwiseOrder(dealerSeatIndex, totalPlayers)` (private) — 반시계 순서 계산

밤일낮장 선 결정:
- KST 18:00~05:59 (밤) → 가장 낮은 rank 선택자가 선
- KST 06:00~17:59 (낮) → 가장 높은 rank 선택자가 선

반시계 방향 순서:
- dealer=0, 4명 → [3, 2, 1, 0]
- dealer=2, 4명 → [1, 0, 3, 2]

## 테스트 결과

- `@sutda/server` 전체: **47/47 테스트 통과**
  - game-engine.test.ts: 23개
  - room-manager.test.ts: 19개
  - integration.test.ts: 5개
- `@sutda/shared` 전체: **96/96 테스트 통과**
- `@sutda/shared build`: 빌드 성공 (타입 오류 없음)

## 계획 대비 편차

### 자동 수정 사항

**1. [Rule 1 - Bug] 테스트 케이스 수정: cut 후 deck 길이 검증**
- **발견 위치:** 태스크 1 테스트 실행
- **문제:** cut 후 `state.deck` 길이를 20장으로 검증했으나, cut 내부에서 자동으로 dealCards()가 호출되어 덱이 소모됨
- **수정:** "배분된 카드 + 남은 덱 = 원본 20장" 방식으로 검증 변경
- **수정 파일:** packages/server/src/game-engine.test.ts
- **커밋:** 6c5617f (동일 태스크 커밋에 포함)

## 알려진 스텁 없음

모든 메서드가 실제 게임 로직으로 구현되어 있으며, 플레이스홀더 없음.

## Self-Check: PASSED

- [x] packages/server/src/game-engine.ts 존재
- [x] packages/server/src/game-engine.test.ts 존재
- [x] packages/shared/src/types/game.ts 수정됨
- [x] packages/shared/src/types/protocol.ts 수정됨
- [x] packages/shared/src/index.ts 수정됨
- [x] 커밋 6c5617f 존재
- [x] 47/47 server 테스트 통과
- [x] 96/96 shared 테스트 통과
- [x] shared 빌드 성공
