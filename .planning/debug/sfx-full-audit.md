---
status: awaiting_human_verify
trigger: "ResultScreen.tsx의 SFX 재생 로직을 전체 감사하고 수정한다"
created: 2026-04-05T00:00:00Z
updated: 2026-04-05T00:05:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: 확인됨 — win-ddaeng-loser 블록이 if/else 밖에서 항상 실행되는 구조적 버그
test: 수정 완료 및 빌드 성공 확인
expecting: 패자 SFX 중복 재생 해소
next_action: 사용자 인게임 확인 대기

## Symptoms

expected: 각 게임 모드에서 상황에 맞는 SFX 하나만 재생
actual: 패자 케이스에서 lose-ddaeng-penalty 또는 lose-ddaeng-but-lost 재생 후 win-ddaeng-loser가 추가 재생됨
errors: 없음 (런타임 로직 버그)
reproduction: 패자 상태에서 ResultScreen 진입 시 두 SFX 동시 재생
started: 알 수 없음

올바른 SFX 매핑:
- 내가 땡으로 승리 → win-ddaeng
- 내가 일반패로 승리 → win-normal
- 내가 땡 벌칙금 납부 → lose-ddaeng-penalty
- 내가 땡 들고 패배 → lose-ddaeng-but-lost
- 내가 일반패로 졌는데 상대가 땡(공개) → win-ddaeng-loser (lose-normal 대신)
- 내가 일반패로 졌는데 상대가 非땡 or 미공개 → lose-normal

## Eliminated

(없음)

## Evidence

- timestamp: 2026-04-05T00:00:00Z
  checked: ResultScreen.tsx 125~158줄 SFX 로직 구조
  found: |
    패자(else) 블록 내부에서:
    1. hasDdaengPenalty → play('lose-ddaeng-penalty')
    2. myHandCards.length >= 2 → play('lose-ddaeng-but-lost') 또는 play('lose-normal')
    3. ← else 블록 안이지만 위 if/else와 독립된 별도 if문으로 win-ddaeng-loser 체크가 항상 실행됨
    즉, 146~158줄의 if (winner && winner.isRevealed) 블록이 hasDdaengPenalty or isDdaeng 케이스와 독립적으로 실행됨
  implication: |
    lose-ddaeng-penalty 재생 후 승자가 땡이고 isRevealed=true이면 win-ddaeng-loser도 추가 재생됨
    lose-ddaeng-but-lost 재생 후에도 동일하게 중복 재생 발생

- timestamp: 2026-04-05T00:00:00Z
  checked: useSfxPlayer.ts SFX_MAP
  found: |
    win-ddaeng-loser는 win-ddaeng.mp3 파일을 volume 0.3으로 재생
    (win-ddaeng은 0.6, win-ddaeng-loser는 0.3 — 패자에게 더 낮은 볼륨으로 재생 의도)
  implication: 단순 파일 중복 재생이 아니라 볼륨 조절 의도가 있는 별도 SFX

- timestamp: 2026-04-05T00:00:00Z
  checked: game.ts PlayerState.isRevealed 필드
  found: isRevealed: boolean — showdown에서 패를 공개했는지 여부
  implication: |
    result phase에서 승자의 isRevealed가 true여야 win-ddaeng-loser 재생 가능
    인디언섯다에서는 showdown 없이 결과 확인 시 isRevealed 상태 확인 필요

- timestamp: 2026-04-05T00:00:00Z
  checked: getHandCards 함수 (ResultScreen.tsx 103~109줄) 각 모드별 동작
  found: |
    - selectedCards length >= 2 → selectedCards 반환 (세장섯다, 골라골라)
    - shared-card 모드 + sharedCard 있음 + player.cards[0] 있음 → [cards[0], sharedCard] 반환 (한장공유)
    - 그 외 → player.cards 배열에서 null 제거 후 반환 (오리지날, 인디언섯다)
  implication: |
    인디언섯다에서 player.cards에 null이 포함될 수 있음 (마스킹된 카드)
    cards[0]이 null이면 myHandCards.length가 0이 되거나 cards 전체가 빈 배열이 될 수 있음

- timestamp: 2026-04-05T00:00:00Z
  checked: 인디언섯다 특수 케이스
  found: |
    PlayerState.cards: (Card | null)[] — null = 마스킹된 카드 (자기 카드를 못 봄)
    result phase에서 인디언섯다 isDied 처리: me.cards.some(c => c != null)로 확인
    showdown 이후 result에서는 cards가 공개되어 있어야 함 (isRevealed 또는 isDied)
  implication: result phase에서 cards 배열에 null이 없다면 정상 처리되지만 확인 필요

- timestamp: 2026-04-05T00:00:00Z
  checked: 골라골라 모드 getHandCards
  found: |
    gollaPlayerIndices로 각 플레이어가 선택한 openDeck 인덱스를 저장
    그러나 selectedCards가 설정되어 있다면 selectedCards가 우선 사용됨
    서버에서 골라골라 결과 시 selectedCards에 실제 선택 카드를 넣어주는지 확인 필요
  implication: 골라골라에서 selectedCards가 설정되지 않으면 player.cards fallback 사용됨

## Resolution

root_cause: |
  ResultScreen.tsx 패자(else) 블록 내부에서 win-ddaeng-loser 체크 if문이
  hasDdaengPenalty/isDdaeng 분기와 독립된 별도 if문으로 존재했음.
  결과적으로 lose-ddaeng-penalty나 lose-ddaeng-but-lost 재생 후에도
  win-ddaeng-loser 조건(winner.isRevealed && 승자가 땡)이 충족되면 추가 재생됨.

fix: |
  win-ddaeng-loser 재생 로직을 lose-normal 케이스 내부로 이동.
  내가 일반패로 졌을 때만(isDdaeng=false 분기 안에서) 승자가 땡이면 win-ddaeng-loser,
  아니면 lose-normal을 재생하는 삼항 분기로 대체.
  lose-ddaeng-penalty, lose-ddaeng-but-lost 케이스에서는 win-ddaeng-loser 재생 불가.

verification: pnpm --filter client build 성공 (4.82s, no errors)

files_changed:
  - packages/client/src/components/layout/ResultScreen.tsx
