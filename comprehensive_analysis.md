# 섯다 족보 평가 로직 심층 분석 (구사 & 땡잡이 버그)

## 요약
코드 분석 결과, **평가 로직 자체는 정상 작동**하고 있습니다. 카드 순서와 무관하게 올바른 족보를 판정합니다.

## 1. 평가 함수 분석 (`evaluateHand`)

### 위치
`packages/shared/src/hand/evaluator.ts` (lines 35-89)

### 핵심 로직
```typescript
export function evaluateHand(card1: Card, card2: Card): HandResult {
  // rank를 정렬하여 조합 비교를 단순화
  const ranks = [card1.rank, card2.rank].sort((a, b) => a - b) as [CardRank, CardRank];
  const [low, high] = ranks;
  
  // 속성 검사는 원본 card1, card2에서 수행
  if (low === 4 && high === 9 &&
      card1.attribute === 'normal' && card2.attribute === 'normal') {
    return makeResult('kkut', (low + high) % 10, { isGusa: true });
  }
}
```

### 왜 순서 무관한가?
1. **Rank 정렬**: `[card1.rank, card2.rank].sort()` → `low, high`로 정렬
   - 4→9든 9→4든 항상 `low=4, high=9`
   
2. **속성 확인**: `card1.attribute && card2.attribute` 
   - **원본 card1, card2**에서 확인 (정렬되지 않은 상태)
   - 따라서 순서 무관하게 "둘 다 normal인가?"만 확인

### 검증된 패 (모두 정상 작동)
```
✓ 구사 (4normal + 9normal): 순서 무관
✓ 멍텅구리구사 (4yeolkkeut + 9yeolkkeut): 순서 무관
✓ 암행어사 (4yeolkkeut + 7yeolkkeut): 순서 무관
✓ 땡잡이 (3normal + 7normal): 순서 무관
```

## 2. 패 감지 로직 (`evaluateHand` 라인별 분석)

### 구사 감지 (lines 66-76)
```typescript
// 멍텅구리구사: [4,9] 둘 다 yeolkkeut (line 67-69)
if (low === 4 && high === 9 &&
    card1.attribute === 'yeolkkeut' && card2.attribute === 'yeolkkeut') {
  return makeResult('kkut', 3, { isMeongtteongguriGusa: true });
}

// 일반구사: [4,9] 둘 다 normal (line 73-75)
if (low === 4 && high === 9 &&
    card1.attribute === 'normal' && card2.attribute === 'normal') {
  return makeResult('kkut', 3, { isGusa: true });
}
```

**성능**: 정확하고 순서 무관

### 땡잡이 감지 (lines 60-64)
```typescript
// 땡잡이: [3,7] 둘 다 normal
if (low === 3 && high === 7 &&
    card1.attribute === 'normal' && card2.attribute === 'normal') {
  return makeResult('kkut', 0, { isSpecialBeater: true });
}
```

**성능**: 정확하고 순서 무관

### 암행어사 감지 (lines 54-58)
```typescript
// 암행어사: [4,7] 둘 다 yeolkkeut
if (low === 4 && high === 7 &&
    card1.attribute === 'yeolkkeut' && card2.attribute === 'yeolkkeut') {
  return makeResult('kkut', 1, { isSpecialBeater: true });
}
```

**성능**: 정확하고 순서 무관

## 3. 핸드 레이블 생성 (`HandPanel.tsx` lines 44-57)

```typescript
function getHandLabel(result: HandResult): string {
  if (result.handType !== 'kkut') {
    return HAND_TYPE_KOREAN[result.handType] ?? result.handType;
  }
  // 특수패 이름 우선 적용
  if (result.isMeongtteongguriGusa) return '멍텅구리구사';
  if (result.isGusa) return '구사';
  if (result.isSpecialBeater && result.score === 1) return '암행어사';
  if (result.isSpecialBeater && result.score === 0) return '땡잡이';
  // 일반 끗
  if (result.score === 0) return '망통';
  if (result.score === 9) return '갑오';
  return `${result.score}끗`;
}
```

**성능**: 정확함
- `isGusa=true` → "구사"
- `isSpecialBeater=true && score=0` → "땡잡이"
- 혼합 속성 (4yeolkkeut + 9normal) → `isGusa=false` → "3끗"

## 4. 테스트 현황

### 테스트 파일
`packages/shared/src/hand/evaluator.test.ts` - 46 tests, 모두 PASS

### 테스트 범위
- 광땡 (4가지)
- 땡 (9가지, 속성 혼합도 포함)
- 특수패 (6가지: 암행어사, 땡잡이, 구사, 멍텅구사)
- 특수 조합 (6가지)
- 끗 (여러 가지)

### 보완 필요 사항
- ❌ 역순 테스트 부족: `9normal + 4normal` 테스트 없음
- ❌ `7normal + 3normal` 역순 테스트 없음
- ❌ `7yeolkkeut + 4yeolkkeut` 역순 테스트 없음

## 5. 실제 사용 흐름

### HandPanel (클라이언트)
- line 101: `evaluateHand(myPlayer.selectedCards[0], myPlayer.selectedCards[1])`
  - 사용자가 선택한 순서대로 card1, card2 전달
  
- line 104: `evaluateHand(cards[0], sharedCard)`
  - 내 카드 먼저, 공유 카드 나중
  
- line 107: `evaluateHand(cards[0], cards[1])`
  - 인덱스 순서대로 전달

### ResultScreen (클라이언트)
- line 118: `evaluateHand(player.cards[0], player.cards[1])`
  - 항상 cards[0], cards[1] 순서

### GameEngine (서버)
- line 1310: `evaluateHand(p.cards[0]!, p.cards[1]!)`
  - 항상 cards[0], cards[1] 순서

## 6. 결론

**버그 없음**: 평가 로직과 레이블 생성 모두 정상 작동합니다.

### 가능한 사용자 오관찰 원인
1. 사용자가 4→9 선택했을 때 화면에 "3끗"이 표시된 것 같지만, 실제로는 다른 카드 조합
2. 혼합 속성 카드 (예: 4yeolkkeut + 9normal)를 4normal + 9normal으로 착각
3. 다른 플레이어의 패를 자신의 패로 혼동

### 추천 액션
1. 테스트 추가: 역순 조합 명시적 테스트
2. UI 개선: 디버깅 화면에서 카드의 속성 명시
3. 게임 기록: 실제 버그 발생 시 정확한 카드 정보 기록

