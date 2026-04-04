---
status: awaiting_human_verify
trigger: "3개 신규 기능 구현: 방장 강퇴, 인디언 죽은 카드 확인, 학교가기 상태 표시"
created: 2026-04-05T00:00:00Z
updated: 2026-04-05T00:00:00Z
---

## Current Focus

hypothesis: 3개 기능 모두 기존 코드 패턴을 따라 구현 가능함을 확인
test: 코드베이스 분석 완료, 구현 시작
expecting: 각 기능의 소켓 이벤트·상태·UI를 추가하면 동작
next_action: Feature 1(강퇴) → Feature 2(인디언 카드) → Feature 3(학교가기 상태) 순 구현

## Symptoms

expected: "1) 방장이 플레이어를 강퇴 가능, 2) 인디언섯다에서 fold 후 결과 화면에서 자신의 카드 확인, 3) 학교가기 버튼 누른 사람 표시"
actual: "세 기능 모두 미구현"
errors: ""
reproduction: "앱 사용 시 해당 기능 없음"
started: "미구현 상태"

## Evidence

- timestamp: 2026-04-05T00:00:00Z
  checked: protocol.ts ClientToServerEvents / ServerToClientEvents
  found: |
    - 'kicked' 이벤트는 이미 ServerToClientEvents에 존재 (칩 0 강퇴에 사용 중)
    - 'kick-player' 이벤트는 ClientToServerEvents에 없음 → 추가 필요
    - next-round 이벤트 핸들러가 nextRoundVotes Set으로 투표를 추적함
  implication: kicked 이벤트는 재사용 가능. kick-player 이벤트 추가 필요

- timestamp: 2026-04-05T00:00:00Z
  checked: game-engine.ts getStateFor()
  found: |
    - 인디언 모드에서 result/showdown/card-reveal phase에서는 마스킹 없이 전체 상태 반환
    - 단, 죽은(!isAlive) 플레이어는 result phase에서 cards가 있지만 클라이언트 ResultScreen에서
      isDied 체크 시 HwatuCard faceUp={false}로 렌더링해버림 (line 263)
    - getStateFor는 result phase에서 모든 플레이어 카드를 공개함
  implication: 서버는 이미 cards 정보를 죽은 플레이어에게도 보내고 있음.
               클라이언트 ResultScreen의 isDied 분기에서 자신의 카드만 보여주면 됨

- timestamp: 2026-04-05T00:00:00Z
  checked: ResultScreen.tsx
  found: |
    - hasVotedNextRound state로 본인의 학교가기 클릭 여부만 추적
    - 다른 플레이어가 학교가기를 눌렀는지 알 수 없음 (서버 nextRoundVotes는 Set이지만 클라이언트에 미전송)
    - "다른 플레이어를 기다리는 중..." 텍스트만 표시
  implication: 서버에서 nextRoundVotes 정보를 game-state나 별도 이벤트로 브로드캐스트해야 함

- timestamp: 2026-04-05T00:00:00Z
  checked: WaitingTable.tsx
  found: |
    - 플레이어 목록에 방장 여부만 표시
    - 강퇴 버튼 없음
    - isHost 체크는 이미 있음
  implication: 방장에게만 강퇴 버튼 조건부 렌더링 추가 필요

## Resolution

root_cause: |
  세 기능 모두 미구현 상태.
  Feature 1: kick-player 이벤트 없음, 클라이언트 UI 없음
  Feature 2: 클라이언트에서 isDied 플레이어에게 자신의 카드를 숨김 처리함
  Feature 3: 서버의 nextRoundVotes가 클라이언트에 전달되지 않음
fix: |
  Feature 1: shared/protocol에 kick-player 이벤트 추가 → 서버 kick-player 핸들러 구현(방장 검증, 게임중 불가, 자기강퇴 불가) → WaitingTable에 강퇴 버튼 추가 → RoomPage kicked 이벤트에 BY_HOST 메시지 추가
  Feature 2: ResultScreen에서 isDied && isMe && indian mode && cards가 있으면 카드 공개 표시
  Feature 3: server next-round 핸들러에서 투표마다 next-round-votes 브로드캐스트 → gameStore에 nextRoundVotedIds 상태 추가 → ResultScreen 플레이어 이름 옆 "학교" 배지 표시
verification: "빌드 성공(shared/server/client 모두). 배포 후 확인 필요."
files_changed:
  - packages/shared/src/types/protocol.ts
  - packages/server/src/index.ts
  - packages/client/src/store/gameStore.ts
  - packages/client/src/components/layout/WaitingTable.tsx
  - packages/client/src/components/layout/ResultScreen.tsx
  - packages/client/src/pages/RoomPage.tsx
