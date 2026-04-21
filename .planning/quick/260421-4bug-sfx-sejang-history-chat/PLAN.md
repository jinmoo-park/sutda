---
slug: 4bug-sfx-sejang-history-chat
date: 2026-04-21
status: in-progress
---

# 버그 4건 수정

## 버그 1: 쇼다운 SFX — 패공개 미공개 시 lose-ddaeng-but-lost 오재생

**원인**: `ResultScreen.tsx` 패자 SFX 로직(177-190행)에서 `winnerCardsVisible` 여부와 무관하게
패자 자신의 패가 땡이면 `lose-ddaeng-but-lost`를 재생함.

**수정**: 패자 첫 번째 SFX 분기를 `winnerCardsVisible`로 게이팅.
승자가 패를 공개하지 않은 경우 → 무조건 `lose-normal`.

## 버그 2: 세장섯다 족보 표시 — 순서 기준 표시

**원인**: 모두 다이해서 패선택(card-select) 단계를 거치지 않은 경우, 승자의 `selectedCards`가
없어 `displayCards = player.cards`(3장)가 되고, `evaluateHand(displayCards[0], displayCards[1])`이
첫 2장(인덱스 순서)만 사용함.

**수정**:
- `ResultScreen.tsx`: 3장 패가 있고 `selectedCards`가 없으면 3가지 조합 중 최강 조합으로 `handLabel` 계산
- `game-engine.ts` `_generateRoundHistory`: 동일 로직으로 승자 족보 기록

## 버그 3: 이력 잔액 기록 — 올인 퇴장 시 이력 미수집

**원인**: `index.ts` `tryAdvanceNextRound`에서 `activePlayers.length < 2`(게임 종료)이면
이력 수집(`game-history` emit) 전에 early return함.

**수정**: 이력 수집 코드를 early return 전으로 이동(또는 조건부 실행).

## 버그 4: 퇴장 표시 — 채팅창 시스템 메시지 없음

**원인**:
- `player-left` 이벤트 수신 시 toast만 띄우고 채팅창에 시스템 메시지 없음
- 올인 퇴장(`broke`) 시 방 전체에 `player-left` 브로드캐스트 없음

**수정**:
- `gameStore.ts`: `ChatMessage`에 `type?: 'system'` 추가, `player-left` 수신 시 시스템 메시지 추가
- `index.ts`: broke 플레이어 강퇴 시 `player-left` 브로드캐스트(room 전체)에 `reason: 'broke'` 포함
- `ChatPanel.tsx`: `type === 'system'` 메시지는 중앙 정렬 + 별도 스타일로 렌더링

## 수정 파일

1. `packages/client/src/components/layout/ResultScreen.tsx`
2. `packages/client/src/store/gameStore.ts`
3. `packages/client/src/components/layout/ChatPanel.tsx`
4. `packages/server/src/game-engine.ts`
5. `packages/server/src/index.ts`
