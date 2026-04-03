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
- [x] 잔액현황 칼럼 헤더는 중앙정렬 완료, 필드값(playerChipChanges)도 중앙정렬로 변경
  - HistoryModal.tsx: 잔액현황 `<td>` 안의 flex div에 `justify-center` 추가

### 17. 채팅 UX 3가지 버그
- [x] 셔플(ShuffleModal)/기리(CutModal) 모달에서 채팅 사용 불가
  - 수정: ShuffleModal, CutModal에 `modal={false}` 추가 → Radix focus trap 해제 → 모달 열린 상태에서 채팅 입력 가능
- [x] 게임이력(HistoryModal) 열릴 때 채팅창 클릭 → 모달 종료됨
  - 수정: HistoryModal DialogContent에 `onInteractOutside={(e) => e.preventDefault()}` 추가
- [x] 모바일 결과화면에서 채팅 입력창이 짤려서 안보임
  - 수정: `MobileChatInput`을 `!isResultPhase` 조건 밖으로 이동 → 항상 표시

### 18. 모바일 채팅 오버레이 투명도 조정
- [x] 투명도 5%(0.05) → 10%(0.1)로 조정 (ChatPanel.tsx `mobileOpacity` 초기값)

### 19. 재접속 시 중복 접속 / 조작 불가 버그 [CRITICAL]
- [x] `nextRound()` 에서 `isDisconnected = false` 리셋 추가 (다음 판 시작 시 자동 다이 방지)
- [x] Observer 재접속 시 `markReconnected` 호출 제외 + 서버 로그 추가
- [x] `markReconnected` 에 플레이어 미발견 시 경고 로그 추가
- [x] **현장 테스트 통과**: 다이 처리 후 재입장 시 조작 가능 확인

---

## UAT 중 추가 수정사항 (2026-04-03 세션 4)

### 20. 모달별 채팅 입력 활성화 범위 확장

**배경**: 셔플/기리 모달은 채팅 입력 가능하나, 아래 모달에서는 채팅 입력창이 활성화되지 않음.

**영향 모달 목록**:
- 게임모드 선택 모달 (선플레이어/일반플레이어 모두)
- 상대방 기리 모달
- 게임이력 모달
- 세장섯다 — 두장 중 한장 공개선택 모달
- 세장섯다 — 3장 중 2장 선택 모달
- 한장공유 — 한장 선택 모달 (선플레이어/일반플레이어 모두)
- 골라골라모드 — 2장 선택 모달

**수정 방향**: 각 모달에 `modal={false}` 또는 `onInteractOutside preventDefault` 적용 (셔플/기리 모달과 동일한 패턴)

- [x] 위 모달 전부에서 채팅 입력창 활성화 확인

### 21. 모바일 채팅 오버레이 투명도 0.25로 조정

**현재값**: 0.1 (세션 4 이전 0.05 → 0.1로 조정됨)
**목표값**: 0.25

**파일**: `packages/client/src/components/chat/ChatPanel.tsx` — `mobileOpacity` 초기값

- [x] 모바일에서 채팅 오버레이 투명도 0.25 적용 확인

### 22. 3장섯다 — 3번째 카드 손패 뒤집기 액션 제거

**배경**: 3번째 카드도 바로 선택 모달로 처리됨 → 손패에서 탭으로 뒤집는 인터랙션 불필요

**수정 방향**: 세장섯다에서 3번째 카드 수령 시 손패 뒤집기 트리거 제거

- [x] 3장섯다에서 3번째 카드 손패 뒤집기 액션 제거 확인

### 23. 화투패 이미지 매칭 로직 전면 교체 [CRITICAL]

**버그**: 연산 기반 카드 매핑 로직으로 인해 3번째 패에서 열끗10이었다가 손에 들어오면 띠10으로 바뀌는 이미지 오류 발생

**원인**: 월/광/끗/띠 구분을 계산식으로 도출 → 경계 케이스 오류

**수정 방향**: 화투 20장을 전부 코드에 명시하고 각각 개별 이미지 파일과 1:1 매핑하는 방식으로 전환 (계산 로직 완전 제거)

- [x] 20장 전체 카드 개별 이미지 매핑 테이블 작성 (`cardImageUtils.ts` CARD_IMAGE_MAP)
- [x] 기존 계산 기반 로직 제거 (`computeSlotIndices`, `slotIndex` 전면 제거)
- [ ] 3장섯다 포함 전 게임모드에서 카드 이미지 정합성 확인 (현장 테스트)

### 24. 한장공유 모드 — 카드 수령 시 2장 노출 후 1장으로 줄어드는 버그

**버그**: 게임테이블에서 1장만 받아야 하는데 2장이 잠깐 노출되었다가 1장으로 줄어드는 불필요한 애니메이션/상태 발생

**수정 방향**: 한장공유 모드 카드 배분 시 클라이언트 상태가 최종 1장만 즉시 반영되도록 수정

- [x] 한장공유 모드에서 카드 수령 시 1장만 즉시 표시됨 확인

### 25. 인디언섯다 모드 — 볼 수 없는 카드 어둡게 표시

**요구사항**: 인디언섯다에서 본인이 볼 수 없는 1장은 손패에서 어둡게(dimmed) 표현하여 터치해도 뒤집을 수 없다는 정보 제공

**수정 방향**:
- 해당 카드에 `opacity-40` 또는 dim overlay 적용
- 터치/클릭 이벤트 무시 (`pointer-events-none` 또는 조건부 onClick 제거)

- [x] 인디언섯다 모드에서 볼 수 없는 카드 어둡게 표시 + 클릭 비활성화 확인
