# Quick Task 260405-sgp: disconnect/reconnect 즉시 토스트 알림

## 완료 상태

**상태:** 완료  
**커밋:** 032b0b0, f931315  
**소요 시간:** ~5분

## 구현 내용

### Task 1 — 타입 추가 (032b0b0)
- `packages/shared/src/types/protocol.ts`: `ServerToClientEvents`에 두 이벤트 타입 추가
  - `player-disconnected`: `{ playerId: string; nickname: string }` — disconnect 즉시 emit
  - `player-reconnected`: `{ playerId: string; nickname: string }` — 재접속 시 emit

### Task 2 — 서버+클라이언트 구현 (f931315)
- `packages/server/src/index.ts`: disconnect 핸들러에서 유예 타이머 시작 전 즉시 `player-disconnected` emit, 재접속 시 `player-reconnected` emit
- `packages/client/src/store/gameStore.ts`: 두 이벤트 수신 시 sonner toast 표시
  - 퇴장: "{닉네임}님이 나갔습니다 (재접속 대기 중...)"
  - 재접속: "{닉네임}님이 재접속했습니다"

## 변경하지 않은 것

- 60초 유예 타이머 로직
- `player-left` 이벤트 흐름
- 게임 상태 관련 로직 일체
