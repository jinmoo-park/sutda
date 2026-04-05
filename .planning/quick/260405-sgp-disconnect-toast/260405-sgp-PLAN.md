---
phase: quick-260405-sgp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/shared/src/types/protocol.ts
  - packages/server/src/index.ts
  - packages/client/src/store/gameStore.ts
autonomous: true
must_haves:
  truths:
    - "플레이어 disconnect 즉시 남은 플레이어들에게 퇴장 토스트가 표시된다"
    - "토스트 메시지에 닉네임과 '재접속 대기 중' 문구가 포함된다"
    - "재접속 시 '돌아왔습니다' 토스트가 표시된다"
    - "재접속 유예 타이머 로직은 변경되지 않는다"
  artifacts:
    - path: "packages/shared/src/types/protocol.ts"
      provides: "player-disconnected, player-reconnected 이벤트 타입"
    - path: "packages/server/src/index.ts"
      provides: "disconnect/reconnect 시 새 이벤트 emit"
    - path: "packages/client/src/store/gameStore.ts"
      provides: "새 이벤트 수신 및 토스트 표시"
  key_links:
    - from: "packages/server/src/index.ts"
      to: "packages/client/src/store/gameStore.ts"
      via: "player-disconnected / player-reconnected 소켓 이벤트"
---

<objective>
플레이어가 disconnect되었을 때 재접속 유예 타이머(60초)와 별개로,
즉시 남은 플레이어들에게 "{닉네임}님이 나갔습니다 (재접속 대기 중...)" 토스트를 표시한다.
재접속 성공 시 "{닉네임}님이 돌아왔습니다" 토스트도 표시한다.

Purpose: 현재는 60초 타이머 만료 후에야 player-left 이벤트가 발생하므로, 다른 플레이어들이 누군가의 이탈을 한참 뒤에야 인지하는 UX 문제 해결
Output: 즉시 퇴장/복귀 알림이 표시되는 실시간 피드백
</objective>

<context>
@packages/shared/src/types/protocol.ts
@packages/server/src/index.ts (line 822-940: disconnect handler)
@packages/client/src/store/gameStore.ts (line 126-130: player-left handler)
</context>

<interfaces>
<!-- 현재 ServerToClientEvents (protocol.ts:78-99) -->
```typescript
export interface ServerToClientEvents {
  'player-left': (data: { playerId: string; newHostId?: string; nickname?: string }) => void;
  // ... 기타 이벤트
}
```

<!-- 서버 disconnect handler (index.ts:822-940) -->
- 게임 중 disconnect: roomManager.disconnectPlayer() 호출 후 60초 타이머 시작
- 대기실 disconnect: 60초 유예 후 leaveRoom
- 재접속: markReconnected() 호출 (index.ts:348)

<!-- 클라이언트 토스트 (gameStore.ts) -->
```typescript
import { toast } from 'sonner';
// player-left 핸들러에서 toast.error 사용
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: shared 타입에 player-disconnected / player-reconnected 이벤트 추가</name>
  <files>packages/shared/src/types/protocol.ts</files>
  <action>
ServerToClientEvents 인터페이스에 두 이벤트를 추가한다:

```typescript
'player-disconnected': (data: { nickname: string }) => void;
'player-reconnected': (data: { nickname: string }) => void;
```

기존 이벤트(player-left 등)는 변경하지 않는다.
  </action>
  <verify>
    <automated>cd D:/dev/sutda && npx tsc --noEmit -p packages/shared/tsconfig.json</automated>
  </verify>
  <done>ServerToClientEvents에 player-disconnected, player-reconnected 타입이 추가됨</done>
</task>

<task type="auto">
  <name>Task 2: 서버 disconnect/reconnect 시 즉시 이벤트 emit + 클라이언트 토스트 핸들러</name>
  <files>packages/server/src/index.ts, packages/client/src/store/gameStore.ts</files>
  <action>
**서버 (index.ts):**

1. **게임 중 disconnect (line ~830 부근):** `roomManager.disconnectPlayer()` 호출 직후,
   60초 타이머 설정 전에 즉시 `player-disconnected` 이벤트를 나머지 플레이어에게 emit:
   ```typescript
   io.to(roomId).emit('player-disconnected', { nickname: disconnectedNickname });
   ```
   - `socket.to(roomId)` 가 아닌 `io.to(roomId)`를 사용해도 됨 (disconnect된 소켓은 이미 방을 떠난 상태)

2. **대기실 disconnect (line ~903 부근):** 대기실에서도 동일하게 `player-disconnected` emit:
   ```typescript
   io.to(roomId).emit('player-disconnected', { nickname: disconnectedNickname2 });
   ```
   단, `isAlone`이 true면(방에 혼자) emit하지 않는다 — 아무도 받을 사람이 없으므로.

3. **재접속 (line ~332-365 부근):** `engine.markReconnected()` 호출 후 또는 대기실 재접속 처리 후,
   `player-reconnected` 이벤트를 방 전체에 emit:
   ```typescript
   io.to(roomId).emit('player-reconnected', { nickname });
   ```
   게임 중 재접속(line ~331 `if (existing)` 블록 안, `markReconnected` 후)과
   대기실 재접속(line ~52 `existingWaiting` 블록에 해당하는 joinRoom 후 room-state emit 근처) 모두 처리.
   대기실 재접속의 경우, joinRoom이 성공적으로 기존 플레이어를 복귀시킨 후 emit한다.
   위치: `socket.join(roomId)` 이후, `room-state` emit과 함께.

**클라이언트 (gameStore.ts):**

기존 `socket.on('player-left', ...)` 핸들러(line 126-130) 근처에 두 핸들러를 추가:

```typescript
socket.on('player-disconnected', ({ nickname }) => {
  toast(`${nickname}님이 나갔습니다 (재접속 대기 중...)`, { duration: 5000 });
});

socket.on('player-reconnected', ({ nickname }) => {
  toast.success(`${nickname}님이 돌아왔습니다`);
});
```

- `toast()` (일반 info 스타일) 사용 — error가 아닌 알림 성격이므로
- `player-left`의 기존 `toast.error` 로직은 그대로 유지 (60초 후 실제 퇴장 시)
- duration 5000ms로 설정하여 충분히 인지되게 함
  </action>
  <verify>
    <automated>cd D:/dev/sutda && npx tsc --noEmit -p packages/shared/tsconfig.json && npx tsc --noEmit -p packages/server/tsconfig.json && npx tsc --noEmit -p packages/client/tsconfig.json</automated>
  </verify>
  <done>
- disconnect 즉시 player-disconnected 이벤트가 방의 다른 플레이어들에게 전달됨
- 재접속 시 player-reconnected 이벤트가 방 전체에 전달됨
- 클라이언트에서 각 이벤트에 대한 토스트가 표시됨
- 기존 60초 유예 타이머 및 player-left 로직은 변경 없음
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — shared, server, client 모두 타입 에러 없음
2. 기존 테스트 통과: `cd packages/server && npx vitest run`
3. 수동 확인: 2인 방에서 한 명이 탭을 닫으면 남은 플레이어에게 즉시 토스트 표시
</verification>

<success_criteria>
- disconnect 발생 즉시 (60초 대기 없이) 남은 플레이어에게 토스트 표시
- 재접속 성공 시 복귀 토스트 표시
- 60초 유예 타이머 및 기존 player-left 로직 변경 없음
- 타입 체크 및 기존 테스트 통과
</success_criteria>

<output>
완료 후 `.planning/quick/260405-sgp-disconnect-toast/260405-sgp-SUMMARY.md` 생성
</output>
