# 방장 접속 유지 오류 — 심층 디버깅

## 증상
방장이 대기실 또는 게임 중 연결이 반복적으로 끊김.
`transport close` 사유로 disconnect 발생.

---

## 수정 이력

| 커밋 | 내용 |
|------|------|
| 2865a4a | 좀비 소켓 정리 — 페이지 이동 시 이전 소켓 리스너 제거 |
| 2100dcd | WebSocket 전용 전환 — polling 제거로 nginx limit_conn 충돌 방지 |
| abe4c08 | 모바일 백그라운드 재입장 — reconnect 시 join-room 자동 재전송 |
| 8a28661 | pingTimeout 20s→60s, reconnectionDelay 500ms, 서버 크래시 추적 로깅 추가 |
| 6bf612a | 방장 재접속 시 room.hostId 미갱신 버그 수정, disconnect UX "자동 재연결 중..." |
| **f239cf7** | **sessionStorage→localStorage, hasReconnectedRef 제거 — iOS 브라우저 닫힘 후 join-room 미전송 핵심 버그 수정** |

---

## 서버 로그 분석 (2026-04-03)

### 확인된 사실 1: 서버 exit_code=0 반복 재시작

```
08:51~09:46  6회 자동 재시작 (원인 미상)
10:26:08     배포 재시작 (의도적)
```

**원인 분석:**

| 항목 | 결과 |
|------|------|
| exit_code | 0 (clean exit, crash 아님) |
| error.log 4/3 항목 | 0줄 (stderr 없음) |
| OOM killer | 없음 |
| 메모리 | 402MB / 954MB |
| nginx proxy_read_timeout | 86400s 이미 적용 |
| process.exit() | 코드에 없음 |

→ `process.exit/uncaughtException/httpServer:error` 핸들러 추가 완료 (8a28661)  
→ 배포 이후 자동 재시작 없음, 안정적으로 유지 중 (모니터링 계속)

---

### 확인된 사실 2: 테스트 타임라인 분석

**테스트 1 (room a8c2f9ee, 10:26:08 서버 재시작 후)**
```
10:28:08  test 방장 disconnect (transport close) — 카카오톡 전환 시 iOS가 TCP 즉시 종료
          waiting timer 3600s (isHost=true, isAlone=true)
10:28:33  123 disconnect (transport close)
10:29:33  123 timer 만료 → 퇴장
10:29:42  F2zfA (test 재접속 소켓) disconnect again
          isHost=false, timer 60s ← 버그 (6bf612a로 수정)
```
→ test가 재접속했으나 room.hostId 미갱신으로 방장 권한 소실 (수정됨)

**테스트 2 (room 87643847, 배포 후)**
```
10:35:41  test2 방장 disconnect (transport close, isAlone=true)
          waiting timer 3600s
10:35:50  [join-room] 1212 입장 — isHost=false, players=test2,1212
10:40:05  1212 disconnect
10:41:05  1212 timer 만료 → 퇴장
```
→ **test2의 [join-room] 로그 없음** = 재접속 후 join-room을 서버에 전혀 보내지 않음  
→ 결과: test2 화면에 1명(자신만), 방장 권한 없음, 1212는 정상 2명 표시  

---

## 확인된 버그 및 수정

### BUG 1: room.hostId 미갱신 [수정 완료 - 6bf612a]
**위치:** `packages/server/src/room-manager.ts`  
**원인:** 재접속 시 `player.id`만 새 socket.id로 갱신, `room.hostId`는 구 socket.id 유지  
**결과:** 재접속 후 방장 권한 소실, 60초 타이머 오적용  
**수정:** waiting/playing 양쪽 재접속 경로에서 `room.hostId`도 갱신

### BUG 2: disconnect 메시지 수동 새로고침 유도 [수정 완료 - 6bf612a]
**위치:** `packages/client/src/store/gameStore.ts`  
**원인:** "페이지를 새로 고침해 주세요" → 유저 수동 새로고침 → 재연결 흐름 파괴  
**수정:** "연결이 끊겼어요. 자동 재연결 중..."

### BUG 3: iOS 브라우저 닫힘 후 join-room 미전송 [수정 완료 - f239cf7] ← 핵심
**위치:** `packages/client/src/pages/RoomPage.tsx`

**증상:** 카카오톡으로 전환 시 iOS 브라우저가 "잠시 닫힘" → 돌아올 때 페이지 리로드 발생  
- 리로드 시 React Router `locationState` 소실  
- iOS tab 닫힘 시 `sessionStorage`도 소실 (tab-specific storage)  
- 결과: `handleReconnect`에서 `session = null` → `join-room` emit 안 함

**부가 원인:** `hasReconnectedRef` 로직  
- 최초 connect에서 `true` 세팅 후 리턴 (join-room 안 보냄)  
- iOS가 페이지 완전 리로드 → 새 컴포넌트 인스턴스 → ref 초기화 → 재접속도 "첫 connect" 취급  
- 결과: 재연결되어도 join-room 미전송

**수정:**
1. `sessionStorage` → `localStorage` (브라우저 닫혀도 persistance)
2. `hasReconnectedRef` 제거 → connect 이벤트마다 localStorage 세션 있으면 무조건 join-room 재전송
3. 서버 `joinRoom`은 닉네임 기반 중복 처리로 멱등성 보장 (이미 방에 있으면 socket.id만 갱신)

---

## 모바일 WebSocket 동작 이해

**iOS WebSocket 종료 방식:**  
앱 전환 시 iOS가 TCP 연결을 즉각 강제 종료 → `transport close` (OS level, pingTimeout 조정으로 해결 불가)

**재연결 흐름 (수정 후):**
```
앱 전환 → iOS TCP 종료 → transport close
→ 화면: "연결이 끊겼어요. 자동 재연결 중..."
→ Socket.IO 500ms 후 자동 재연결
→ connect 이벤트 → localStorage 세션 읽어서 join-room 재전송
→ 서버: 닉네임으로 기존 플레이어 찾아 socket.id 갱신 (room.hostId도 갱신)
→ room-state 브로드캐스트 → 모든 클라이언트 2명 표시
→ 화면: 에러 사라짐, 대기실 복원
```

---

## 현재 상태 (2026-04-03 10:50)

- [x] 서버 안정성 로깅 (exit/httpServer:error 등)
- [x] pingTimeout 60s
- [x] reconnectionDelay 500ms/3000ms
- [x] room.hostId 재접속 갱신
- [x] disconnect UX 메시지
- [x] join-room 성공 로깅 (isHost 포함)
- [x] **sessionStorage→localStorage (iOS 브라우저 닫힘 대응)**
- [x] **hasReconnectedRef 제거 (재접속 시 join-room 무조건 재전송)**
- [x] **재테스트 완료 (2026-04-03)**: 카카오톡 전환 → 복귀 시 2명 표시 + 방장 권한 유지 확인 — 잠시 끊김 메시지 후 자동 재연결, 방장 권한 정상 복원

## 잔여 위험
- 서버 재시작 시 인메모리 방 상태 소실 (서버 재시작 시 방이 없어져 재접속 불가 → 장기적으로 영속화 필요)
- 서버 clean exit 원인 미특정 (배포 이후 안정 중, [process:exit] 로그로 추적 중)
