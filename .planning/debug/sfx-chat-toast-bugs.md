---
status: awaiting_human_verify
trigger: "SFX, 채팅 자동 스크롤, 대신학교가기 토스트 3개 버그 수정"
created: 2026-04-05T00:00:00Z
updated: 2026-04-05T02:00:00Z
---

## Current Focus

hypothesis: 3개 버그 모두 수정 완료, 빌드 성공 확인. 사람 검증 대기 중
test: 실제 게임 플레이에서 각 버그 재현 시나리오 실행
expecting: SFX/스크롤/토스트 모두 정상 동작
next_action: 사용자 검증 후 archive_session

## Symptoms
<!-- 증상 기록 - 변경 금지 -->

### Bug 1 (SFX)
expected: 땡 승리 시 승자에게는 승리 SFX, 패자에게는 패배 SFX. 패 공개 안 하기 선택 시 상대방에게 땡승리 SFX 재생 안 됨
actual: 모든 모드에서 SFX 재생이 잘못되거나 누락됨. 패 미공개 선택 시에도 상대방에게 땡승리 SFX가 나올 수 있음

### Bug 2 (채팅 스크롤)
expected: 새 메시지 수신 시 채팅창이 자동으로 맨 아래로 스크롤
actual: 채팅창이 위로 밀려서 새 메시지가 안 보임

### Bug 3 (토스트)
expected: 대신학교가기 토스트가 채팅창 위에 뜨지 않거나 적절한 위치에 표시
actual: 모바일에서 토스트가 채팅창을 가려서 입력 불가

## Eliminated

- hypothesis: SFX 훅 자체의 오디오 파일 매핑 오류
  evidence: useSfxPlayer.ts의 SFX_MAP은 정상. 파일명/볼륨 모두 올바름
  timestamp: 2026-04-05T01:00:00Z

- hypothesis: 채팅 스크롤이 overflow-hidden 부모 때문에 scrollIntoView 자체가 안 됨
  evidence: 데스크탑 ChatPanel은 flex-1 overflow-y-auto div 내부에서 동작. 자체 listRef로 스크롤 컨테이너 올바르게 참조 중. 문제는 타이밍(DOM 업데이트 전 scrollIntoView 호출) 또는 초기화 시 isAtBottomRef가 잘못된 값
  timestamp: 2026-04-05T01:00:00Z

## Evidence

- timestamp: 2026-04-05T01:00:00Z
  checked: ResultScreen.tsx lines 144-157 (패자 블록의 승자 카드 SFX 처리)
  found: winner.isRevealed 체크 없이 winner.cards를 직접 evaluateHand에 넘김. 승자가 패 미공개(muck 선택, isRevealed=false) 시에도 카드는 gameState.players[winner].cards에 존재하므로 evaluateHand가 성공 → win-ddaeng-loser 재생됨
  implication: 승자가 패를 공개하지 않은 경우에도 패자에게 land-ddaeng-loser SFX가 잘못 재생됨

- timestamp: 2026-04-05T01:00:00Z
  checked: ResultScreen.tsx lines 113-124 (승자 SFX 처리)
  found: 승자 SFX는 본인 카드로만 evaluateHand 실행 → 정상
  implication: 승자 SFX 자체는 문제 없음

- timestamp: 2026-04-05T01:00:00Z
  checked: ChatPanel.tsx lines 46-51 (자동 스크롤 useEffect)
  found: useEffect(() => { if (isAtBottomRef.current) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); } }, [chatMessages]); 
  - isAtBottomRef는 스크롤 이벤트(handleScroll)에 의해서만 업데이트됨
  - 초기값은 true이지만 컴포넌트 마운트 시 스크롤 이벤트가 발생하지 않으므로 isAtBottomRef는 항상 true 상태
  - 실제 버그: chatMessages 변경 시점에 DOM이 아직 업데이트되지 않아 bottomRef가 새로 추가된 메시지 위치를 가리키지 않거나, scrollIntoView가 올바른 시점에 실행되지 않음
  - 더 정확한 버그: 모바일에서 ChatPanel은 mobile=true 모드로 렌더링되는데, 이 모드는 bottomRef/listRef가 없고 `chatMessages.slice(-3)`만 표시함. 스크롤 로직 전체가 mobile 모드에서는 적용되지 않음
  implication: 데스크탑 ChatPanel의 자동 스크롤 useEffect가 React 상태 업데이트 후 DOM 렌더링 전에 실행될 수 있어 scrollIntoView가 이전 위치를 참조. `behavior: 'smooth'`를 `'instant'`로 바꾸거나 setTimeout/requestAnimationFrame으로 지연 처리 필요

- timestamp: 2026-04-05T01:00:00Z
  checked: RoomPage.tsx의 Toaster 배치 (line 872)
  found: 게임 진행 중 메인 Toaster는 `<div class="bg-background">` 루트 하단에 배치. sonner Toaster 기본 position은 'bottom-right'. 모바일에서 ChatPanel + MobileChatInput이 화면 하단에 고정되어 있어 토스트가 그 위에 겹침
  implication: Toaster에 offset 또는 position 조정이 필요. 모바일에서는 bottom 값을 채팅 바 높이만큼 올려야 함

## Resolution

root_cause: |
  Bug 1: ResultScreen.tsx에서 패자 블록의 win-ddaeng-loser SFX 조건이 winner.isRevealed를 체크하지 않아,
          승자가 패 미공개(muck) 선택 시에도 카드 데이터가 존재하므로 SFX가 잘못 재생됨.
  
  Bug 2: ChatPanel.tsx의 자동 스크롤 useEffect가 chatMessages 배열 참조로 의존성 설정되어 있으나,
          React의 상태 업데이트 → 렌더링 → useEffect 실행 순서에서 scrollIntoView가 실행될 때
          새 메시지의 DOM 노드가 아직 레이아웃 완료되지 않아 스크롤이 불완전함.
          또한 'smooth' 스크롤은 이전 스크롤 애니메이션과 충돌 가능성 있음.
  
  Bug 3: sonner Toaster의 기본 position(bottom-right)이 모바일에서 ChatPanel + MobileChatInput과
          겹쳐 입력 불가 상태 발생. offset 설정이 없음.

fix: |
  Bug 1: ResultScreen.tsx - winner에 대한 win-ddaeng-loser SFX 재생 조건에 winner.isRevealed 체크 추가
  Bug 2: ChatPanel.tsx - scrollIntoView를 requestAnimationFrame으로 감싸서 DOM 렌더링 후 실행되도록 수정
  Bug 3: RoomPage.tsx - 모바일용 Toaster에 offset 설정하거나, gameStore에서 toast를 띄울 때 적절한 위치 지정

verification: pnpm --filter client build 성공 (1885 modules, no TypeScript errors)
files_changed:
  - packages/client/src/components/layout/ResultScreen.tsx
  - packages/client/src/components/layout/ChatPanel.tsx
  - packages/client/src/pages/RoomPage.tsx
