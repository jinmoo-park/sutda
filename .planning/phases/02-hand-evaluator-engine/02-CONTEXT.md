# Phase 2: 족보 판정 엔진 - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

2장 카드 조합에 대한 순수 함수 족보 판정 + 승패 비교. HandEvaluator API 설계 및 TDD.

이 Phase는 게임 UI, WebSocket, 베팅 로직을 포함하지 않는다.
새 기능(게임 모드별 처리, 칩 시스템 등)은 이후 Phase에서 담당한다.

</domain>

<decisions>
## Implementation Decisions

### 동점 처리 (HAND-07)
- **D-01:** 동점 시 처리 방식은 **재경기**. 분팟 없음.
- **D-02:** 재경기 대상: 최고 동점자들끼리만. 다이한 플레이어와 최고 동점자보다 낮은 패의 플레이어는 **제외**.
- **D-03:** `compareHands()` 반환 타입에 `'tie'` 케이스 포함 필요. 재경기 실행은 Phase 4 게임 엔진이 담당.

### HandResult 반환 타입 구조
- **D-04:** `evaluateHand()` 반환 타입은 구조체:
  ```typescript
  interface HandResult {
    handType: HandType;  // 족보 종류 (enum)
    score: number;       // 비교용 점수 (높을수록 강함)
    isSpecialBeater: boolean;  // 땡잡이/암행어사 여부 (특수 비교 필요)
    isGusa: boolean;           // 일반 구사 (4+9, 일반 속성)
    isMeongtteongguriGusa: boolean;  // 멍텅구리구사 (열끗4+열끗9)
  }
  ```
- **D-05:** `compareHands(a: HandResult, b: HandResult): 'a' | 'b' | 'tie'` 함수로 승패 비교.

### 구사/멍텅구리구사 처리 범위
- **D-06:** Phase 2에서 재경기 트리거 조건 판단까지 담당.
- **D-07:** 시그니처: `checkGusaTrigger(gusaHand: HandResult, allSurvivingHands: HandResult[]): { shouldRedeal: boolean }`
  - 일반 구사(4+9): 생존자 중 최고패가 알리 이하이면 재경기
  - 멍텅구리구사(열끗4+열끗9): 생존자 중 최고패가 팔땡 이하이면 재경기

### 패키지 위치
- **D-08:** `@sutda/shared` 패키지에 위치. 서버+클라이언트 공유 가능한 순수 함수.
  - Phase 6 UI에서 플레이어 패 족보 라벨 표시, 클라이언트 측 유효성 검사 등에 활용 가능.

### 땡잡이/암행어사 특수 비교 규칙 (TDD 핵심)
- **D-09:** 땡잡이(3+7):
  - 구땡~일땡(9종) 모두에게 **이김**
  - 장땡, 삼팔광땡, 일팔광땡, 일삼광땡에게 **짐**
  - 특수조합(알리~새륙)과 끗 패에 대해서는 **0끗(망통)**으로 인식
- **D-10:** 암행어사(열끗4+열끗7):
  - 일팔광땡(1광+8광), 일삼광땡(1광+3광)에게 **이김**
  - 삼팔광땡에게 **짐**
  - 나머지 모든 패(장땡, 일반땡, 특수조합, 끗)에 대해서는 **1끗**으로 인식

### Claude's Discretion
- HandType enum 세부 열거 방식 (땡잡이/암행어사를 별도 타입으로 넣을지, isSpecialBeater 플래그로만 구분할지)
- 점수(score) 수치 체계 설계 (예: 광땡 1000, 장땡 100, 끗 0-9 등)
- 테스트 파일 구조 및 커버리지 전략

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 게임 규칙
- `rule_draft.md` — 족보 전체 정의, 게임 방식, 베팅, 땡값, 94재경기 상세 규칙

### Phase 1 기반 코드
- `packages/shared/src/types/card.ts` — Card, CardRank, CardAttribute 타입, GWANG_RANKS, YEOLKKEUT_RANKS
- `packages/shared/src/types/game.ts` — GameState, PlayerState, GameMode 타입
- `packages/shared/src/index.ts` — shared 패키지 exports

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card`: `{ rank: CardRank(1-10), attribute: 'gwang'|'yeolkkeut'|'normal' }` — HandEvaluator 입력 타입
- `GWANG_RANKS: [1,3,8]`, `YEOLKKEUT_RANKS: [4,7,9]` — 광/열끗 판별에 직접 활용
- `getCardAttribute(rank, isSpecialCard)` — 카드 속성 판별 헬퍼

### Established Patterns
- `@sutda/shared`는 순수 함수/타입 전용 패키지 (상태 없음, 사이드이펙트 없음)
- TDD: Vitest 사용 (`packages/shared/src/deck.test.ts` 패턴 따름)
- 빌드: pnpm + turborepo 모노레포

### Integration Points
- HandEvaluator는 `packages/shared/src/hand/` 디렉토리에 위치 (deck.ts 패턴 참고)
- `packages/shared/src/index.ts`에서 export 추가 필요
- Phase 4 게임 엔진(서버)이 이 함수를 import하여 승패 판정에 사용

</code_context>

<specifics>
## Specific Ideas

### 암행어사 규칙 명확화
- 암행어사는 일팔광땡과 일삼광땡에만 이기고, **그 외 모든 패에는 1끗으로 인식된다**
- 삼팔광땡에게 지고, 장땡/일반땡/특수조합/끗에 대해서는 1끗 낙이로 비교

### 땡잡이 규칙 명확화
- 땡잡이는 9종 일반 땡(구땡~일땡)에 이기고, **특수조합/끗에는 0끗(망통)으로 인식**
- 장땡과 광땡 3종에는 짐

### 동점 재경기 범위
- 동점 시 최고 동점자들(예: 둘 다 오끗)끼리만 재경기
- 다이한 플레이어, 낮은 패 플레이어는 재경기 불참

</specifics>

<deferred>
## Deferred Ideas

- **3장 조합 지원 (세장섯다)**: Phase 7 scope. Phase 2 API는 2장 전용으로 설계. 나중에 확장 고려는 Claude 재량.
- **HandType enum에 땡잡이/암행어사 별도 타입**: Claude 재량으로 결정 (isSpecialBeater 플래그로 충분할 수 있음).

</deferred>

---

*Phase: 02-hand-evaluator-engine*
*Context gathered: 2026-03-29*
