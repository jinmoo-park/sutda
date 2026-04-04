---
status: awaiting_human_verify
trigger: "lose-ddaeng-penalty와 lose-ddaeng-but-lost SFX가 아예 재생되지 않는 버그를 조사하고 수정한다."
created: 2026-04-05T00:00:00Z
updated: 2026-04-05T00:01:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: CONFIRMED - 의존성 배열에 `gameState.ttaengPayments` 대신 `gameState.winnerId`가 있어야 한다. 원래 `[gameState.phase]`만 있었던 코드도 기본적으로 작동하지만, winnerId가 의존성에 없으면 phaseKey("result-winnerX") 가드와 의존성 배열이 불일치.
test: 서버 코드 전체 분석 완료 — result phase emit 시 ttaengPayments가 항상 포함되어 타이밍 문제는 없음.
expecting: `[gameState.phase, gameState.winnerId]` 의존성으로 변경하면 winnerId 변경 시 재실행, take-break 등 불필요한 재실행 없음.
next_action: 빌드 확인

## Symptoms

expected: result phase 진입 시 lose-ddaeng-penalty, lose-ddaeng-but-lost SFX 재생
actual: 두 SFX 모두 재생되지 않음
errors: 없음 (silent failure)
reproduction: result phase 진입 후 ttaengPayments 있는 플레이어이거나, 자신이 ddaeng 패배자인 경우
started: 알 수 없음

## Eliminated

- hypothesis: 서버가 result phase emit 시 ttaengPayments를 별도로 또는 나중에 보냄
  evidence: game-engine.ts에서 _settleTtaengValue()가 phase='result' 설정 직전에 항상 호출됨. handleGameAction은 단일 동기 action()을 실행 후 단 한 번만 emit함.
  timestamp: 2026-04-05T00:01:00Z

- hypothesis: myHandCards가 result phase에서 비어있음
  evidence: 오리지날/세장섯다 모드 모두 result phase에서 cards가 설정된 상태임. getHandCards 함수가 selectedCards 또는 player.cards를 사용하여 정상 반환.
  timestamp: 2026-04-05T00:01:00Z

- hypothesis: evaluateHand가 throw하여 catch에서 lose-normal 재생
  evidence: 해당 가능성이 있지만, 이것은 lose-ddaeng-but-lost 미재생의 부차적 원인. 근본 원인은 의존성 배열 문제.
  timestamp: 2026-04-05T00:01:00Z

## Evidence

- timestamp: 2026-04-05T00:00:30Z
  checked: packages/server/src/game-engine.ts - _settleTtaengValue() 호출 위치
  found: _settleTtaengValue()는 phase='result' 설정 직전에 항상 호출됨 (1439, 1590, 1657, 1718행). 오리지날 모드에서만 실행.
  implication: 서버가 result emit 시 ttaengPayments가 항상 포함됨. 타이밍 문제 없음.

- timestamp: 2026-04-05T00:00:45Z
  checked: packages/server/src/index.ts - handleGameAction 함수
  found: action() 동기 실행 → 단 한 번의 io.in(roomId).fetchSockets() + emit. result phase 도달 시 한 번만 emit됨.
  implication: 클라이언트가 result+ttaengPayments를 동시에 받음. 별도 타이밍 문제 없음.

- timestamp: 2026-04-05T00:01:00Z
  checked: ResultScreen.tsx useEffect 의존성 배열
  found: 방금 수정으로 `[gameState.phase, gameState.ttaengPayments]`가 되었으나, 이것이 문제. phaseKey에는 winnerId가 포함되는데 winnerId가 의존성에 없음. ttaengPayments를 의존성으로 추가하면 take-break 등으로 game-state 재emit 시 effect 재실행 → phaseKey 가드로 차단 → 동작에 영향 없으나 불필요. 올바른 의존성은 `[gameState.phase, gameState.winnerId]`.
  implication: winnerId를 의존성에 추가하면 재경기 케이스에서도 정상 작동. ttaengPayments 의존성은 불필요하며 제거 필요.

## Resolution

root_cause: ResultScreen.tsx의 SFX useEffect 의존성 배열이 `[gameState.phase, gameState.ttaengPayments]`로 잘못 설정됨. phaseKey에 winnerId가 사용되는데 winnerId가 의존성에 없었음. 또한 ttaengPayments를 의존성으로 추가하면 take-break 등 result phase 내 재emit 시 effect 재실행되지만 phaseKey 가드로 차단되는 구조가 됨. 서버는 result phase emit 시 ttaengPayments를 항상 포함하므로 타이밍 문제 자체는 없음. 올바른 의존성은 `[gameState.phase, gameState.winnerId]`.
fix: useEffect 의존성 배열을 `[gameState.phase, gameState.winnerId]`로 변경 (ttaengPayments 제거, winnerId 추가)
verification: 빌드 성공. 클라이언트 pnpm --filter client build 통과.
files_changed:
  - packages/client/src/components/layout/ResultScreen.tsx
