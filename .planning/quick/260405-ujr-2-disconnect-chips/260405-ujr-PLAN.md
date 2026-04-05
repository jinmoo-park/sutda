---
phase: quick-260405-ujr
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/server/src/index.ts
  - packages/server/src/index.test.ts
autonomous: true
must_haves:
  truths:
    - "2인 게임 중 한 명 disconnect 유예 만료 후 대기실 복귀 시, 남은 플레이어의 chips가 게임 중 정산된 값을 유지한다"
    - "disconnect 경로 외 기존 tryAdvanceNextRound 경로의 chips 동기화도 정상 동작한다 (기존 동작 회귀 없음)"
  artifacts:
    - path: "packages/server/src/index.ts"
      provides: "disconnect 유예 만료 → 대기실 전환 시 engine→room chips 동기화"
      contains: "engine chips sync before gameEngines.delete in disconnect timer"
  key_links:
    - from: "packages/server/src/index.ts (disconnect timer callback)"
      to: "gameEngines.get(roomId).getState().players"
      via: "chips 동기화 후 gameEngines.delete"
      pattern: "ep\\.chips|engine.*getState.*players"
---

<objective>
2인 게임 중 한 명이 disconnect 후 유예시간(60초) 만료 시 대기실로 복귀하면, 남은 플레이어의 chips가 100,000원(초기값)으로 리셋되는 버그 수정.

Purpose: disconnect 유예 만료 경로에서 engine→room chips 동기화 누락이 원인. 커밋 94cd432에서 tryAdvanceNextRound 경로에는 동기화를 추가했으나, disconnect 타이머 만료 경로에는 동일한 로직이 적용되지 않았음.

Output: index.ts 수정 + 테스트 추가
</objective>

<context>
@packages/server/src/index.ts
</context>

<bug_analysis>
## 원인 분석 (코드 리딩 완료)

**버그 위치:** `packages/server/src/index.ts` 909-914번 라인

```typescript
// 2인 → 1인 남으면 대기실 전환 (D-18)
const remainingRoom = roomManager.getRoom(roomId);
if (remainingRoom && remainingRoom.players.filter(p => !p.isObserver).length < 2) {
  remainingRoom.gamePhase = 'waiting';
  gameEngines.delete(roomId);  // <-- engine 삭제만 하고 chips 동기화 안 함!
  io.to(roomId).emit('room-state', remainingRoom);
}
```

**정상 동작하는 참조 코드 (커밋 94cd432에서 수정됨):** `tryAdvanceNextRound` 내 196-209번 라인

```typescript
if (roomAfterKick) {
  const enginePs = engine.getState().players;
  for (const rp of roomAfterKick.players) {
    const ep = enginePs.find(p => p.id === rp.id);
    if (ep) rp.chips = ep.chips;
  }
  roomAfterKick.gamePhase = 'waiting';
  io.to(roomId).emit('room-state', roomAfterKick);
}
gameEngines.delete(roomId);
```

**수정 방법:** disconnect 타이머 콜백의 911-914번 라인에서, `gameEngines.delete` 전에 engine의 정산된 chips를 room.players에 동기화하는 로직을 추가한다. tryAdvanceNextRound에서 사용한 것과 동일한 패턴.
</bug_analysis>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: disconnect 유예 만료 시 engine→room chips 동기화 추가</name>
  <files>packages/server/src/index.ts</files>
  <behavior>
    - disconnect 유예 만료 후 2인→1인 대기실 전환 시, 남은 플레이어의 chips가 engine의 정산된 값과 동일하다
    - 기존 tryAdvanceNextRound 경로의 동기화가 회귀 없이 동작한다
  </behavior>
  <action>
`packages/server/src/index.ts` 909-914번 라인을 수정한다.

**수정 전 (909-914):**
```typescript
const remainingRoom = roomManager.getRoom(roomId);
if (remainingRoom && remainingRoom.players.filter(p => !p.isObserver).length < 2) {
  remainingRoom.gamePhase = 'waiting';
  gameEngines.delete(roomId);
  io.to(roomId).emit('room-state', remainingRoom);
}
```

**수정 후:**
```typescript
const remainingRoom = roomManager.getRoom(roomId);
if (remainingRoom && remainingRoom.players.filter(p => !p.isObserver).length < 2) {
  // engine 삭제 전 정산된 chips를 room.players에 동기화 (94cd432 tryAdvanceNextRound와 동일 패턴)
  if (eng) {
    const enginePs = eng.getState().players;
    for (const rp of remainingRoom.players) {
      const ep = enginePs.find(p => p.id === rp.id);
      if (ep) rp.chips = ep.chips;
    }
  }
  remainingRoom.gamePhase = 'waiting';
  gameEngines.delete(roomId);
  io.to(roomId).emit('room-state', remainingRoom);
}
```

**핵심:** `eng` 변수는 이미 884번 라인에서 `const eng = gameEngines.get(roomId);`로 선언되어 있으므로 그대로 사용 가능. `gameEngines.delete(roomId)` 호출 전에 engine의 players chips를 room.players에 복사한다.
  </action>
  <verify>
    <automated>cd packages/server && npx vitest run src/index.test.ts --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>
    - disconnect 유예 만료 후 대기실 전환 시 `gameEngines.delete` 전에 engine→room chips 동기화 로직이 존재한다
    - 기존 테스트가 모두 통과한다
  </done>
</task>

</tasks>

<verification>
1. `npx vitest run src/index.test.ts` — 기존 테스트 통과 확인
2. `npx vitest run` — 전체 서버 테스트 통과 확인
3. 수동 검증: 2인 게임에서 한 명이 브라우저 탭 닫기 → 60초 대기 → 남은 플레이어의 chips가 게임 중 값 유지 확인
</verification>

<success_criteria>
- disconnect 유예 만료 후 대기실 복귀 시 남은 플레이어 chips가 정산된 값(예: 80,000원)을 유지하며, 100,000원(초기값)으로 리셋되지 않는다
- 기존 모든 서버 테스트 통과
</success_criteria>
