# 핫픽스 UAT 체크리스트

## 직접 테스트 항목 (1, 3, 4)

### 1. 세션 타임아웃 1분 통일 + 게임중 disconnect 시 자동다이
- [ ] 대기실에서 브라우저 탭 닫고 1분 후 다시 접속 → 방에서 제거됨 확인
- [x] 게임 중 모바일 앱 전환(백그라운드) → 60초 내 복귀 시 재접속 유지됨
- [ ] 게임 중 disconnect된 플레이어 차례 도달 → 자동 다이 처리됨
- [ ] 재접속 시 닉네임 기반으로 기존 세션 복원됨 (socket.id 변경 무관)

### 3. 모달 게임테이블 기준 중앙 배치
- [x] 데스크탑: 모달이 게임테이블 영역 내부에서 중앙 표시 (채팅/이력 패널 가리지 않음)
- [x] 모바일: 모달이 화면 중앙에 정상 표시
- [x] 족보참고표 모달 중앙 배치 확인
- [x] 기리(컷) 모달 중앙 배치 확인
- [x] 세장섯다 카드 선택 모달 중앙 배치 확인
- [x] 구사/동점 재경기 모달 중앙 배치 확인

### 4. 3장섯다 족보 표시 버그 + 베팅 프리즈 버그
- [x] 세장섯다 모드: 3장 중 2장 선택 후 족보가 올바르게 표시됨 (앞 2장이 아닌 선택한 2장 기준)
- [x] 세장섯다 모드: betting-2 시작 시 딜러가 올인 상태여도 프리즈 없이 진행
- [x] 세장섯다 전체 플로우 정상 동작 확인 (패 분배 → 1차베팅 → 오픈 → 선택 → 2차베팅 → 결과)

---

## 수정 반영 후 테스트 항목 (2, 5)

### 2. 폰트 → Noto Serif Korean 웹폰트 전환
- [x] 닉네임 입력창에서 한글 정상 표시 (깨짐 없음)
- [x] 게임 내 모든 텍스트 폰트 정상 렌더링
- [x] 첫 로딩 속도 체감 개선 (35MB TTF 대비)
- [x] font-display: swap으로 폰트 로딩 중 텍스트 깜빡임 최소화

### 5. 게임이력 테이블 — 잔액 색상 제거
- [x] 이력 테이블에서 잔액이 색상 없이 일반 텍스트로 표시됨
- [x] 판|승자|족보|판돈|잔액 현황 열 구조 정상 표시
- [x] 여러 판 진행 후 이력 누적 확인

---

## UAT 중 추가 수정사항 (2026-04-03 세션 1)

### 6. 좀비 소켓 정리 — 접속 끊김 버그 수정
- [x] 방 생성 후 대기실에서 연결 유지됨 (데스크탑)
- [x] 방 생성 후 대기실에서 연결 유지됨 (모바일)
- [x] 데스크탑+모바일 동시 접속 시 양쪽 모두 연결 유지
- [x] 밤일낮장 모달 정상 표시 (데스크탑+모바일 동시 게임)

### 7. nginx 설정 수정
- [x] 아이폰 사파리에서 Noto Serif KR 폰트 정상 렌더링
- [x] 동시 접속 시 nginx 연결 제한에 걸리지 않음

### 8. WebSocket 전용 전환 + 모바일 백그라운드 복귀 자동 재입장
- [x] WebSocket 전용 연결 동작 확인
- [x] 모바일 백그라운드 복귀 시 자동 재입장 확인 (카카오톡 전환 테스트 통과)

### 9. 밤일낮장 모달 데스크탑 포탈 버그 수정
- [x] 데스크탑: 밤일낮장 모달 정상 표시
- [x] 모바일: 밤일낮장 모달 정상 표시

---

## UAT 중 추가 수정사항 (2026-04-03 세션 2)

### 10. 게임방 세션 복원 버그 수정 [클라이언트]
**원인**: 직접 URL로 입장한 참여자는 `locationState = null` → `handleJoinRoom` 폼 제출 시 localStorage 미저장 → 재접속 시 `cachedSession = null` → 닉네임 폼 재등장

**수정**:
1. `handleJoinRoom`: 폼 제출 시 localStorage에 세션 저장
2. `hasJoined` 초기값: `initIsHost || !!cachedSession?.nickname` (캐시된 세션 있으면 폼 flash 방지)

**파일**: `packages/client/src/pages/RoomPage.tsx`

- [x] 참여자(직접 URL 입장) → 게임 중 재접속 시 닉네임 폼 없이 게임 복원 확인

### 11. 엔진 플레이어 id 미갱신 버그 수정 [서버]
**원인**: `roomManager.joinRoom`은 `room.players[x].id`만 갱신, `engine.state.players[x].id`는 구 socket.id 유지 → `markReconnected` 실패 → `isDisconnected = true` 유지 → 섞기/기리 담당자 모달 미표시

**수정**: `markReconnected(nickname, newPlayerId)` — 닉네임으로 플레이어 찾아 id 갱신 + isDisconnected 해제

**파일**: `packages/server/src/game-engine.ts`, `packages/server/src/index.ts`

- [x] 섞기 담당자 재접속 후 ShuffleModal 정상 표시 확인
- [x] 기리 담당자 재접속 후 CutModal 정상 표시 확인

### 12. 칩버튼 잔액 초과 방지 [클라이언트]
**수정**: `maxRaiseAmount = Math.max(0, myChips - callAmount)` — 칩버튼 초과 시 disabled, 클릭 시 cap, 최대 시 "올인" 뱃지 표시

**파일**: `packages/client/src/components/layout/BettingPanel.tsx`

- [x] 잔액 이하로만 레이즈 금액 누적되는지 확인
- [x] 잔액 딱 맞춰지면 "올인" 표시 + 칩버튼 비활성화 확인

### 13. 0원 플레이어 강제퇴장 [서버 + 클라이언트]
**수정**:
- 서버: `next-round` 투표 완료 직후 `chips === 0` 플레이어 leaveRoom → `kicked` 이벤트 발송 → 1명 이하 남으면 대기실 복귀
- 클라이언트: `kicked` 수신 시 localStorage 세션 삭제 + 토스트 + 1.5초 후 같은 방 URL로 navigate (replace) → 닉네임 폼 표시
- 타입: `protocol.ts`에 `kicked` 이벤트 추가

**파일**: `packages/server/src/index.ts`, `packages/client/src/pages/RoomPage.tsx`, `packages/shared/src/types/protocol.ts`

- [x] 0원 플레이어가 다음판 투표 시 강제퇴장 + "칩이 부족하여 퇴장되었습니다" 토스트 확인
- [x] 퇴장 후 같은 방 닉네임 입력 폼으로 이동 확인
- [x] 재입장(동일 닉네임) 시 observer로 정상 합류 확인
- [x] 1명 남을 경우 대기실로 복귀 확인

---

## UAT 중 추가 수정사항 (2026-04-03 세션 3)

### 14. 칩 재충전 투표 시스템 완전 제거 [서버 + 클라이언트]
**배경**: 올인된 플레이어의 칩 재충전 동의 기능이 강퇴 로직으로 이미 대체됨. 잔존 코드 전량 삭제.

**삭제 범위**:
- `protocol.ts`: `recharge-request`, `recharge-vote`, `recharge-requested`, `recharge-vote-update`, `recharge-result` 이벤트 및 `RECHARGE_IN_PROGRESS`, `RECHARGE_NOT_FOUND` 에러 코드
- `room-manager.ts`: `requestRecharge`, `processRechargeVote`, `applyRecharge` 메서드 및 관련 타입
- `game-engine.ts`: `applyRechargeToPlayer` 메서드
- `server/index.ts`: `recharge-request`, `recharge-vote` 핸들러
- `gameStore.ts`: `rechargeRequest` 상태 및 리스너
- `RechargeVoteModal.tsx`: 파일 전체 삭제
- 관련 테스트 블록 전량 삭제

- [x] 재충전 관련 코드 완전 제거 확인

### 15. 올인 패배자 결과화면 버그 수정 [서버 + 클라이언트]
**원인 1**: 결과화면에서 "학교 가기" 클릭 → `next-round` 투표 완료 → 0칩 플레이어 강퇴 → 방 대기실 복귀 처리 시 `room-state(gamePhase:'waiting')`만 전송하고 `game-state`는 미전송 → 클라이언트 `gameState.phase === 'result'` stale 유지 → 승자가 결과화면에서 대기실로 이동 불가

**원인 2**: 결과화면에 "학교 가기" 버튼이 그대로 표시되어 혼란 유발

**수정**:
1. `gameStore.ts`: `room-state(gamePhase:'waiting')` 수신 시 `gameState: null` 초기화 → `phase` 자동으로 `'waiting'`으로 전환
2. `server/index.ts`: `next-round` 필요 투표수에서 0칩 플레이어 제외 (`chips > 0` 조건) — 어차피 강퇴 예정이므로 승자 혼자 투표해도 즉시 처리
3. `ResultScreen.tsx`: 0칩 플레이어 존재 시 "학교 가기" 대신 "확인" 버튼 표시
   - 패배자(0칩): 확인 클릭 → localStorage 세션 삭제 → join 폼으로 이동
   - 승자: 확인 클릭 → `next-round` 투표 → 서버 강퇴 처리 → 대기실 복귀

- [x] 올인 패배자 결과화면에 "확인" 버튼 표시
- [x] 패배자 확인 클릭 후 닉네임 입력 폼으로 이동 확인
- [x] 승자 확인 클릭 후 대기실 화면으로 이동 확인

---

## 미해결 이슈 (2026-04-03 세션 4)

### 16. 게임이력 잔액현황 필드 정렬
- [ ] 잔액현황 칼럼 헤더는 중앙정렬 완료, 필드값(playerChipChanges)도 중앙정렬로 변경
  - HistoryModal.tsx: 잔액현황 `<td>` 안의 `<div>`, `<span>` flex 정렬 수정

### 17. 채팅 UX 3가지 버그
- [ ] 셔플(ShuffleModal)/기리(CutModal) 모달에서 채팅 사용 불가
  - 원인 추정: Dialog overlay(absolute inset-0 z-50)가 모바일 채팅 패널보다 위에 렌더됨
  - 수정: 두 모달에 `onInteractOutside={(e) => e.preventDefault()}` 확인 및 채팅 z-index 상향
- [ ] 게임이력(HistoryModal) 열릴 때 채팅창 클릭 → 모달 종료됨
  - 수정: HistoryModal `onInteractOutside={(e) => e.preventDefault()}` 추가
- [ ] 모바일 결과화면에서 채팅 입력창이 짤려서 안보임
  - 원인 추정: `isResultPhase`일 때 MobileChatInput 숨겼으나 ChatPanel mobile 입력창도 안보이는 상황
  - 수정: 결과화면 모바일에서 ChatPanel mobile 입력창 노출 보장

### 18. 모바일 채팅 오버레이 투명도 조정
- [ ] 현재: ChatPanel mobile이 게임테이블 하단 별도 영역에 위치 → 게임테이블 오버레이가 아닌 별도 영역 차지
  - 오버레이 방식으로 복원해야 하는지 확인 필요
  - 투명도 5%(0.05) → 10%(0.1)로 조정 (ChatPanel.tsx `mobileOpacity` 초기값)

### 19. 재접속 시 중복 접속 / 조작 불가 버그 [CRITICAL]
- [ ] 증상: 다이 처리 후 재입장 시 화면은 보이고 연결된 것처럼 보이나 베팅/조작 전혀 안됨
  - 원인 추정: `join-room` 재전송 시 서버에서 기존 소켓 세션과 새 소켓 세션이 동시 존재
  - 또는 `markReconnected`가 다이 상태 플레이어에 대해 제대로 동작 안 함
  - 서버 로그 확인 및 `joinRoom` → `markReconnected` 흐름 디버깅 필요
  - CONNECTION-DEBUG.md 참조
