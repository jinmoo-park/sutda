# 섯다 셔플 / 기리 UX 구현 참고사항

## 스택 전제
- React 19 + Vite
- TypeScript
- Tailwind CSS v4
- Zustand (상태관리)
- 이벤트: `pointerdown / pointermove / pointerup` 으로 터치/마우스 통일 (별도 분기 없음)

---

## 1. 셔플 (Shuffle)

### 동작 정의
- `pointerdown` → 셔플 애니메이션 시작 (루프)
- `pointerup` / `pointerleave` → 애니메이션 즉시 종료

### 표현 방식
- 한 더미에서 중간 카드가 빠져 맨 위로 올라오는 동작을 반복
- 방향은 상하(y축) + 깊이(z축) 조합 — 좌우 이동 없음
- CSS keyframe이 아닌 **requestAnimationFrame 기반 JS 애니메이션**으로 구현
  - 페이즈별 세밀한 타이밍 제어가 필요하기 때문

### 애니메이션 페이즈 (1사이클 ≈ 820ms)

| 페이즈 | 비율 | 설명 |
|---|---|---|
| `peek` | 22% | 중간 카드가 y축으로 살짝만 빠져나옴. z축은 그대로 — 위 카드들에 여전히 덮혀있는 상태 |
| `hold` | 18% | 삐져나온 상태 정지 유지. **이 순간이 "중간에서 빠지는구나"를 인식시키는 핵심** |
| `rise` | 35% | z축 앞으로 튀어나오며 y축 위로 솟구침. 이때 비로소 위 카드들 위로 올라옴 |
| `drop` | 15% | 맨 위에 오버슈트 후 착지 |
| `rest` | 10% | 다음 사이클 전 휴지 |

### peek / hold 핵심 규칙
- `peek` 단계에서 중간 카드의 y 이동량: `GAP * 1.2` 수준 (살짝만)
- `peek` 단계에서 중간 카드의 zIndex는 **원래 레이어 그대로** 유지 — 위 카드들 아래에 있어야 함
- `hold` 동안 모든 카드 정지 — 움직임 없음
- `rise` 시작 시점에 zIndex를 최상위(10 이상)로 올려 위 카드들 앞으로 나옴

### rise 핵심 규칙
- z축: `Math.sin(t * Math.PI) * 30` 아크 커브 — 올라가는 중간에 앞으로 가장 많이 튀어나왔다가 착지 시 정착
- 맨 위 카드: 중간 카드가 올라오는 동안 z축 뒤로 물러나며(`translateZ(-38px)`) 한 단 아래로 내려옴
- 나머지 카드들: 빠진 자리를 채우며 한 칸씩 이동

### 카드 간격 및 그림자
- `GAP`: 12~13px — 너무 좁으면 한 덩어리처럼 보여 움직임 추적 불가
- 안정 상태 그림자: `0 Npx 0 rgba(0,0,0,0.2)` — 적층감 표현 (아래 카드일수록 진하게)
- 들린 카드 그림자: `0 14px 28px rgba(0,0,0,0.5)` — 고도감 표현
- 카드 각도 노이즈: `rotate(±2deg)` — 착지할 때만 조용하게 갱신 (이동 중 흔들림 없음)

### Zustand 상태
```ts
type ShufflePhase = 'idle' | 'peek' | 'hold' | 'rise' | 'drop' | 'rest'

interface ShuffleState {
  isShuffling: boolean
  phase: ShufflePhase
  pickedIdx: number   // 현재 사이클에서 뽑힌 카드 인덱스
}
```

### Tailwind v4 주의
- CSS keyframe 기반이 아니므로 해당 없음
- 참고 (animation 일반): https://tailwindcss.com/docs/animation

---

## 2. 기리 (Cut)

### 개념 정의
기리의 본질은 **셔플한 플레이어가 만든 시퀀스를 기리 플레이어가 바꾸는 행위**. 더미를 둘 이상으로 나눈 뒤 원하는 순서로 다시 합쳐 패 순서를 변경한다.

### 전체 흐름
```
1. [전체 더미] 에서 드래그로 원하는 만큼 더미를 분리 (2개 이상, 반복 가능)
2. 분리된 더미들을 탭한 순서대로 아래부터 위로 쌓아 합침
3. 합쳐진 단일 더미 → 게임 로직으로 넘어감
```

### 제스처 구분 — 탭 vs 드래그

탭과 드래그를 `pointerdown` 하나로 시작하므로 **이동 거리 threshold**로 구분한다.

```ts
const DRAG_THRESHOLD = 8 // px

// pointerdown: 시작 좌표 기록
// pointermove: 누적 이동거리 계산
//   >= 8px → 드래그 확정, ghost 소환
//   pointerup before 8px → 탭으로 처리
```

- threshold 미만 이동 후 `pointerup` → **탭**
- threshold 초과 이동 → **드래그** 확정, 이후 `pointerup`은 드롭으로 처리
- 드래그 확정 전까지 ghost를 소환하지 않음 — 탭인지 드래그인지 모르는 상태이므로

### 페이즈

| 페이즈 | 트리거 | 설명 |
|---|---|---|
| `split` | 초기 상태 | 드래그로 더미 분리 반복. 더미 2개 이상이면 탭 가능 |
| `tap` | 첫 탭 발생 시 자동 전환 | 각 더미를 탭해 합칠 순서 지정. 탭한 순서 = 아래부터 위 |
| `merging` | 합치기 완료 버튼 | 모든 더미가 중앙으로 모이는 애니메이션 |
| `done` | 애니메이션 완료 | 단일 더미로 복원, 게임 로직 트리거 |

### 드래그 (더미 분리) 규칙

- `pointerdown` 시점의 Y 위치로 컷 장수 자동 결정
  ```ts
  const ratio = relY / pileHeight
  const cutCount = Math.round((1 - ratio) * pile.cards)
  // 위에서 집을수록 많이 가져감, 최소 1장 최대 cards-1장
  ```
- 드래그 확정 시 즉시 원래 더미에서 차감 후 ghost 소환
- ghost: 들린 카드 그림자 (`0 14px 28px rgba(0,0,0,0.5)`) 적용
- `pointerup` 시 드롭 위치에 새 더미 생성, ghost 제거
- 드래그 중 `transition: none` — 실시간 추적이므로

### 탭 (합치기 순서 지정) 규칙

- `split` 단계에서 더미가 2개 이상일 때 첫 탭 발생 → 자동으로 `tap` 페이즈 전환
- 탭한 더미에 순서 번호 badge 표시 (1, 2, 3...)
- 이미 탭한 더미를 다시 탭 → 선택 취소
- 모든 더미 탭 완료 → "합치기 완료" 버튼 활성화
- **탭 순서 = 아래부터 위 순서** (1번 탭 = 맨 아래, 마지막 탭 = 맨 위)

### 합치기 애니메이션 규칙

- 모든 더미가 중앙 위치로 `easeInOut` 이동 (380ms)
- 이동하며 `opacity` 감소 → 합쳐지는 느낌
- 완료 후 단일 더미로 교체, `done` 페이즈로 전환

### Zustand 상태 구조
```ts
type GiriPhase = 'split' | 'tap' | 'merging' | 'done'

interface Pile {
  cards: number
  x: number
  y: number
}

interface GiriState {
  phase: GiriPhase
  piles: Pile[]
  tapOrder: number[]   // 탭한 pile 인덱스 순서
}
```

---

## 공통 규칙

### 애니메이션 커브
| 상황 | 커브 |
|---|---|
| 셔플 peek / rise / drop | `ease-in-out` (JS: `t<0.5?2t²:-1+(4-2t)t`) |
| 셔플 drop 착지 | `ease-out` (JS: `1-(1-t)²`) |
| 셔플 hold | 이동 없음 — 커브 불필요 |
| 기리 드래그 중 | `none` (transition 제거) |
| 기리 합치기 이동 | `ease-in-out` |
- `linear`는 사용하지 않음 — 모든 물리 행위는 비선형

### 카드 각도 노이즈
- 더미 내 각 카드에 `rotate(±2deg)` 랜덤 적용
- 이동 중 흔들림 없음 — 착지 순간에만 새 값으로 조용히 갱신
- 값은 컴포넌트 마운트 시 1회 계산 후 고정, 매 렌더마다 바뀌면 안 됨

### pointer 이벤트 공통 패턴
```ts
onPointerDown={handleDown}
onPointerMove={handleMove}
onPointerUp={handleUp}
onPointerLeave={handleUp}  // 영역 이탈 시도 처리
```
- `setPointerCapture` 고려 — 빠른 드래그 시 요소 이탈 방지

### 1차 개발 범위 제외
- 사운드 없음
- 물리 엔진 없음 (framer-motion, matter.js 등 불필요)
- 완벽한 현실 재현 목표 아님 — "느낌" 전달이 목표
