# Phase 10: 시각/UX 완성 - Research

**연구일:** 2026-03-31
**도메인:** React CSS 애니메이션, 3D flip, rAF 기반 애니메이션, 드래그 인터랙션, 반응형 레이아웃
**신뢰도:** HIGH (프로젝트 내 canonical 문서와 기존 코드 직접 확인)

---

## 요약

Phase 10은 기존 작동하는 게임 로직 위에 시각/인터랙션 경험을 완성하는 단계다. 핵심 작업은 6가지 도메인으로 구분된다: (1) 카드 이미지 교체, (2) 카드 뒤집기 3D flip 인터랙션, (3) 카드 배분 이동 애니메이션, (4) 셔플 rAF 기반 애니메이션, (5) 기리 드래그 인터랙션, (6) 패널 레이아웃 재설계.

프로젝트에 이미 `card-flip.md`와 `sutda-shuffle-giri-ux.md`라는 상세 스펙 문서가 존재한다. 이 문서들이 구현의 canonical source다. 현재 `CardFace.tsx`와 `CardBack.tsx`는 텍스트 기반으로, 이미지 기반 `HwatuCard` 컴포넌트로 교체가 필요하다. `img/` 폴더의 이미지 파일들이 루트에 있으므로 Vite의 `public` 폴더로 이동이 필요하다. 현재 RoomPage의 레이아웃은 단순한 flex-col 구조로, 3열 데스크탑/수직 모바일 레이아웃으로 재설계해야 한다.

**핵심 권고사항:** `card-flip.md`의 HwatuCard 컴포넌트 패턴을 그대로 채택하고, `sutda-shuffle-giri-ux.md`의 Zustand 상태 구조를 그대로 구현한다. 외부 애니메이션 라이브러리(framer-motion 등) 추가 없이 CSS transform + rAF로 구현한다.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### 잠금 결정사항 (Locked Decisions)

**카드 이미지 적용**
- D-01: 실제 카드 이미지 파일 사용 — `img/01-1.png` ~ `img/10-2.png` (총 20장), `img/card_back.jpg`
- D-02: 테이블 배경 `img/background.jpg`, 메인 타이틀 `img/main_tilte.jpg` 적용
- D-03: 재경기 시 `img/regame.png` 투명도 오버레이 (기존 ResultScreen 위)

**카드 배분 인터랙션**
- D-04: 손패에 미리 카드가 뜨는 버그 → 클라이언트 숨김 방식으로 해결. dealing phase 동안 카드 데이터를 받아도 뒷면으로만 표시. 서버 로직 무변경.
- D-05: 카드 배분 애니메이션 — 중앙 덱 위치에서 각 플레이어 손패 위치로 카드가 날아오는 방식. 반시계 방향 배분 순서대로 순차 실행.
- D-06: 배분 애니메이션 완료 후 모든 카드가 뒷면 상태로 도착 → 이후 사용자가 직접 뒤집기.

**카드 뒤집기 인터랙션**
- D-07: 내 카드 뒤집기 — 카드별 개별 클릭(탭)으로 3D flip 애니메이션 후 앞면 공개. 2장 모두 뒤집으면 "확인 완료" 처리 (기존 확인 버튼 대체, UX-05).
- D-08: 3D flip은 CSS `transform: rotateY(180deg)` + `backface-visibility: hidden` 방식. sutda-shuffle-giri-ux.md의 포인터 이벤트 패턴 참고.
- D-09: 2장 중 1장씩 개별 뒤집기 가능. 1장 뒤집어도 족보 미표시, 2장 모두 뒤집으면 족보 자동 계산 표시.

**셔플 인터랙션**
- D-10: sutda-shuffle-giri-ux.md Section 1 전체 구현. `pointerdown` → 셔플 애니메이션 루프, `pointerup/pointerleave` → 즉시 종료.
- D-11: 애니메이션 방식: requestAnimationFrame 기반 JS 애니메이션 (CSS keyframe 아님). peek→hold→rise→drop→rest 5 페이즈 (1사이클 ≈ 820ms).
- D-12: Zustand `ShuffleState` — `isShuffling`, `phase: ShufflePhase`, `pickedIdx` 관리.

**기리(Cut) 인터랙션**
- D-13: sutda-shuffle-giri-ux.md Section 2 전체 구현. 드래그(threshold 8px)로 더미 분리, 탭으로 합치기 순서 지정, 합치기 완료 버튼.
- D-14: 페이즈: `split → tap → merging → done`. Zustand `GiriState` — `phase: GiriPhase`, `piles: Pile[]`, `tapOrder: number[]`.
- D-15: 탭 순서 = 아래부터 위 순서 (1번 탭 = 맨 아래). 합치기 애니메이션 easeInOut 380ms.

**패널 레이아웃 재설계**
- D-16: 데스크탑 (md 이상) — 3열 레이아웃: 좌사이드(베팅패널+손패패널), 중앙(게임테이블패널), 우사이드(정보패널+채팅패널 placeholder)
- D-17: 모바일 세로 — 수직 레이아웃: 상단(게임테이블패널+정보패널 레이어), 중단(베팅패널+손패패널), 하단(채팅패널 placeholder)
- D-18: 스크롤 없는 단일 화면 필수. 각 패널 내부 요소도 공간 효율적으로 설계. 고정 높이 or `vh` 단위 활용.
- D-19: Phase 6 D-08(원형 배치 CSS custom properties) 유지. 원형 레이아웃은 중앙 패널 안에서 동작.
- D-20: 채팅 패널은 Phase 11 구현 예정 — Phase 10에서는 공간만 예약 (placeholder, 빈 영역).

**베팅 강조**
- D-21: 내 베팅 차례일 때 베팅패널에 시각적 강조 표시 (BET-HIGHLIGHT). 구체적 스타일은 Claude's Discretion — 기존 shadcn/ui 테마와 어울리는 방식.

### Claude's Discretion (자유 영역)

- BET-HIGHLIGHT 구체적 스타일 (테마 내 ring/glow/border 방식 선택)
- 카드 이미지 CSS 이펙트 구체적 구현 방법 (박스 쉐도우, 약간의 회전 등)
- 배분 애니메이션의 구체적 이동 경로 및 타이밍 (날아오는 포물선 vs 직선)
- 패널 레이아웃의 구체적 비율/크기 (3열 비율, vh 값 등)

### 다음 페이즈로 미룬 항목 (OUT OF SCOPE)

- 텍스트 채팅 (UX-02) — Phase 11
- 게임 이력 (HIST-01/02) — Phase 11
- 학교 대신 가주기 — Phase 11
- 뒤늦게 입장 (Observer) — Phase 11
- 세션 종료 표시 — Phase 11
- 올인 POT (ALLIN-POT) — Phase 11
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | 설명 | 리서치 지원 |
|----|------|------------|
| UX-03 | 카드별 개별 클릭/탭으로 3D flip 애니메이션 후 앞면 공개 | card-flip.md의 HwatuCard 패턴 직접 사용 가능 |
| UX-05 | 카드 배분 시 즉시 노출하지 않고 사용자가 직접 뒤집어야 패 확인 처리 (2장 모두 뒤집으면 완료) | D-07/D-09 결정 + flip 상태 추적 패턴 확인 |
| UX-06 | 카드 배분 이동 애니메이션 — 중앙 덱에서 각 플레이어 위치로 날아오는 방식 | CSS translate + transition 또는 rAF, DOM ref 위치 계산 패턴 |
| UX-07 | 셔플 인터랙션 고도화 (rAF 기반, 버튼 누르는 동안 루프) | sutda-shuffle-giri-ux.md Section 1 스펙 완전 확인 |
| UX-08 | 기리(Cut) 인터랙션 고도화 (드래그 분리, 탭 순서 지정, 합치기) | sutda-shuffle-giri-ux.md Section 2 스펙 완전 확인 |
| UX-09 | 패널 레이아웃 재설계 — 스크롤 없이 한 화면, 데스크탑 3열/모바일 수직 | 현재 RoomPage 레이아웃 코드 확인 완료 |
| IMG-01 | 실제 카드 이미지 적용 (img/01-1 ~ 10-2) — CSS 이펙트로 실물 카드 느낌 | img/ 폴더 파일 확인 완료 (21장), card-flip.md 구현 패턴 확인 |
| IMG-02 | 카드 뒷면 이미지 적용 (img/card_back) — CSS 이펙트 적용 | card_back.jpg 파일 존재 확인 |
| IMG-03 | 테이블 배경, 메인 타이틀, 재경기 오버레이 이미지 적용 | background.jpg, main_tilte.jpg, regame.png 파일 존재 확인 |
| BET-HIGHLIGHT | 베팅 차례일 때 베팅 패널 강조 표시 | BettingPanel.tsx의 isMyTurn prop 이미 존재 |
</phase_requirements>

---

## Standard Stack

### Core (기존 설치된 스택)

| 라이브러리 | 버전 | 용도 | 비고 |
|-----------|------|------|------|
| React | 19 | UI 프레임워크 | 기설치 |
| TypeScript | 5.7 | 타입 안전성 | 기설치 |
| Tailwind CSS | 4.2.2 | 유틸리티 CSS | 기설치 |
| Zustand | 5.0.12 | 상태 관리 | 기설치 |
| Vite | 6 | 빌드 도구 | 기설치 |

### Phase 10 신규 설치 없음

Phase 10은 외부 애니메이션 라이브러리를 추가하지 않는다. 이미 설치된 스택(CSS transform, requestAnimationFrame, Pointer Events API)으로 모든 구현 가능.

- framer-motion → **사용하지 않음** (sutda-shuffle-giri-ux.md 명시: "물리 엔진 없음, framer-motion 불필요")
- matter.js → **사용하지 않음**
- GSAP → **사용하지 않음**

### 파일 시스템 변경 필요

`img/` 폴더는 루트에 그대로 유지. Vite 설정에서 `publicDir`을 루트 `img/`를 포함하는 경로로 참조하거나, 개발/빌드 시 Vite가 루트 기준으로 정적 파일을 서빙하도록 설정한다.

코드에서 참조: `/img/01-1.png` (절대 경로) 또는 `import` 문 없이 public URL 사용.

---

## Architecture Patterns

### 1. HwatuCard 컴포넌트 구조 (card-flip.md 기반)

기존 `CardFace.tsx`와 `CardBack.tsx`를 대체하는 단일 `HwatuCard` 컴포넌트:

```tsx
// 출처: card-flip.md — 섯다 프로젝트 canonical 스펙
interface HwatuCardProps {
  frontSrc: string;       // '/img/01-1.png'
  backSrc?: string;       // '/img/card_back.jpg'
  size?: 'sm' | 'md' | 'lg';
  faceUp?: boolean;       // false = 뒷면(초기), true = 앞면
  onClick?: () => void;   // 클릭 시 flip
  className?: string;
}

// 카드 사이즈 (화투 실물 1:1.583 비율)
const SIZE_MAP = {
  sm: { width: 51, height: 83 },
  md: { width: 68, height: 110 },
  lg: { width: 85, height: 135 },
};
```

**핵심 CSS 패턴:**
```css
/* perspective는 씬(wrapper)에, transform-style은 카드 본체에 */
.hwatu-scene { perspective: 600px; }
.hwatu-card { transform-style: preserve-3d; transition: transform 0.45s cubic-bezier(0.4,0,0.2,1); }
.hwatu-card.is-flipped { transform: rotateY(180deg); }
.hwatu-face { backface-visibility: hidden; }
.hwatu-back { transform: rotateY(180deg); }  /* 뒷면 미리 180도 회전 */
```

**카드 이미지 매핑 유틸리티:**
```ts
// packages/client/src/lib/cardImageUtils.ts
export function getCardImageSrc(rank: number, cardIndex: 1 | 2): string {
  return `/img/${String(rank).padStart(2, '0')}-${cardIndex}.png`;
}
// Card 타입에서 cardIndex를 알려면 카드 속성(attribute)과 rank 조합 필요
// 또는 Card 타입에 직접 fileIndex(1|2) 추가 고려
```

**Card 타입과 이미지 파일 매핑 전략:**

현재 `Card` 타입은 `{ rank, attribute }` 구조다. 이미지 파일명은 `{rank}-{1|2}.png`다. `attribute`와 파일 인덱스 매핑:
- 각 rank에서 어떤 `attribute`가 파일 1번인지 2번인지를 결정해야 한다.
- 광(gwang) 또는 열끗(yeolkkeut)인 카드가 어느 파일인지 규칙을 정의하는 매핑 테이블 필요.
- 예: rank=1의 경우 01-1.png(솔광, gwang), 01-2.png(솔띠, normal)

매핑 테이블 (rank → attribute → fileIndex):
```ts
// 섯다 덱 규칙 (card-flip.md의 파일 구조 주석 기반)
// 1(gwang)→01-1, 1(normal)→01-2
// 3(gwang)→03-1, 3(normal)→03-2
// 4(yeolkkeut)→04-1, 4(normal)→04-2
// 7(yeolkkeut)→07-1, 7(normal)→07-2
// 8(gwang)→08-1, 8(normal)→08-2
// 9(yeolkkeut)→09-1, 9(normal)→09-2
// 10(gwang)→10-1, 10(normal)→10-2
// 나머지 rank는 normal 2장: (normal#1)→XX-1, (normal#2)→XX-2
// → 구별이 필요한 케이스: 같은 rank, 같은 attribute인 경우(2장 모두 normal)
```

같은 rank에서 두 장 모두 normal 속성인 경우(rank 2, 5, 6), 파일 1번과 2번을 구별할 방법이 필요하다. `Card` 타입에 `cardNumber: 1 | 2` 필드 추가가 가장 명확하나, 서버 변경이 수반된다.

**대안 (서버 무변경):** `@sutda/shared`의 `Card` 타입에 `cardNumber` 추가 대신, 클라이언트에서 같은 rank+attribute 조합을 보면 첫 번째를 1번으로 간주하는 렌더링 컨텍스트 활용. HandPanel에서 `myPlayer.cards` 배열의 인덱스로 구별 가능.

### 2. 카드 뒤집기 상태 관리 패턴 (UX-03, UX-05)

HandPanel 내에서 카드별 flip 상태를 로컬 state로 관리:

```tsx
// HandPanel.tsx 내부
const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

const handleCardClick = (cardIndex: number) => {
  if (!isDealing) return; // 배분 완료 전에는 클릭 비활성
  setFlippedCards(prev => {
    const next = new Set(prev);
    next.add(cardIndex);
    return next;
  });
};

// 2장 모두 뒤집히면 패 확인 완료 처리
useEffect(() => {
  if (flippedCards.size === totalCards && totalCards > 0) {
    onAllFlipped?.(); // 기존 setCardConfirmed(true) 역할 대체
  }
}, [flippedCards, totalCards]);
```

기존 `showCardConfirm` 모달은 제거되고, 카드 클릭으로 대체된다.

### 3. 카드 배분 이동 애니메이션 (UX-06)

현재 `setInterval` 기반 `visibleCardCounts` 로직(RoomPage.tsx)을 DOM 위치 기반 CSS transition 애니메이션으로 강화한다.

**권장 구현 방식 — CSS translate + transition:**

```tsx
// DealingCard: 중앙 덱 → 플레이어 위치로 날아오는 카드
// 1. 중앙 덱 위치를 기준점으로 잡음 (GameTable 컴포넌트 중앙)
// 2. 각 플레이어 seat의 getBoundingClientRect()로 도착 위치 계산
// 3. translate transform으로 이동 + opacity 애니메이션

interface FlyingCard {
  id: string;           // 고유 키
  targetPlayerId: string;
  startX: number;       // 덱 중앙 x
  startY: number;       // 덱 중앙 y
  endX: number;         // 플레이어 hand 영역 x
  endY: number;         // 플레이어 hand 영역 y
  isAnimating: boolean;
}
```

**구현 시 주의:** DOM ref로 위치를 측정해야 하므로 `useRef` + `getBoundingClientRect()` 패턴 필요. 레이아웃 변경 후에도 정확한 위치 계산을 위해 `ResizeObserver` 고려.

**단순화 대안:** 절대 위치 기반 계산 없이 CSS keyframe 애니메이션으로 "카드가 위에서 내려오는" 간단한 효과. 위치 추적 없이 `translateY(-100px) → translateY(0)` + `opacity 0→1`. 덜 화려하지만 구현 안전성 높음.

### 4. 셔플 rAF 애니메이션 패턴 (sutda-shuffle-giri-ux.md 기반)

```tsx
// ShufflePanel 또는 ShuffleModal 대체 컴포넌트
// Zustand ShuffleState를 별도 슬라이스로 관리
type ShufflePhase = 'idle' | 'peek' | 'hold' | 'rise' | 'drop' | 'rest'

interface ShuffleState {
  isShuffling: boolean
  phase: ShufflePhase
  pickedIdx: number   // 뽑힌 카드 인덱스 (0~N-1, 덱 내 중간 위치)
}
```

rAF 루프 구조:
```tsx
const rafRef = useRef<number | null>(null);
const cycleStartRef = useRef<number>(0);
const CYCLE_DURATION = 820; // ms

const runCycle = (timestamp: number) => {
  const elapsed = timestamp - cycleStartRef.current;
  const t = Math.min(elapsed / CYCLE_DURATION, 1);

  // t 기반으로 ShufflePhase 결정 및 카드 위치 계산
  // peek: 0~0.22, hold: 0.22~0.40, rise: 0.40~0.75, drop: 0.75~0.90, rest: 0.90~1.0
  updateCardPositions(t);

  if (t >= 1) {
    cycleStartRef.current = timestamp;
    pickNewCard(); // 다음 사이클용 카드 선택
  }

  if (isShuffling) {
    rafRef.current = requestAnimationFrame(runCycle);
  }
};

const startShuffle = () => {
  setIsShuffling(true);
  cycleStartRef.current = performance.now();
  rafRef.current = requestAnimationFrame(runCycle);
};

const stopShuffle = () => {
  setIsShuffling(false);
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  // socket emit shuffle
};
```

### 5. 기리 드래그 인터랙션 패턴 (sutda-shuffle-giri-ux.md 기반)

```tsx
// GiriPanel 컴포넌트 (CutModal 대체)
const DRAG_THRESHOLD = 8; // px

// pointerdown: 시작 좌표 기록
// pointermove: 이동 거리 계산 → 8px 초과 시 드래그 확정 + ghost 소환
// pointerup before 8px: 탭 처리
// pointerup after drag: 드롭 처리

// setPointerCapture 사용 — 빠른 드래그 시 요소 이탈 방지
const handlePointerDown = (e: React.PointerEvent, pileIdx: number) => {
  e.currentTarget.setPointerCapture(e.pointerId);
  // 시작 좌표 기록...
};
```

### 6. 패널 레이아웃 재설계 (UX-09)

현재 RoomPage 레이아웃(단순 flex-col)을 3열 CSS Grid로 교체:

```tsx
// 데스크탑: 3열 grid
// 모바일: 수직 flex

// GameLayout.tsx (신규 컴포넌트)
// 데스크탑 (md 이상):
//   grid-template-columns: 280px 1fr 280px
//   height: 100vh (스크롤 없음)
// 모바일:
//   flex-direction: column
//   height: 100dvh (dynamic viewport height, 모바일 브라우저 주소바 대응)

// vh vs dvh 선택: 모바일에서 vh는 주소바 포함 높이 사용 → 스크롤 발생 가능
// dvh(dynamic viewport height)로 실제 표시 가능 영역에 맞춤
```

**스크롤 없는 한 화면 구현 키포인트:**
- `height: 100dvh` on root layout
- `overflow: hidden` on layout containers
- 각 패널에 `overflow-y: auto` (내부 스크롤은 허용)
- 중앙 게임테이블 패널: `min-height: 0` (flex/grid 내부에서 축소 허용)

### 권장 프로젝트 구조 (신규/변경 파일)

```
packages/client/
├── public/
│   └── img/                    # (이동) 루트 img/ → 여기로
│       ├── 01-1.png ~ 10-2.png
│       ├── card_back.jpg
│       ├── background.jpg
│       ├── main_tilte.jpg
│       └── regame.png
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── HwatuCard.tsx   # (신규) CardFace+CardBack 통합 대체
│   │   │   ├── CardFace.tsx    # (유지 또는 내부 변경) HwatuCard로 위임
│   │   │   └── CardBack.tsx    # (유지 또는 내부 변경)
│   │   ├── layout/
│   │   │   ├── GameLayout.tsx  # (신규) 3열/수직 레이아웃 컨테이너
│   │   │   ├── HandPanel.tsx   # (수정) 3D flip 인터랙션 추가
│   │   │   ├── BettingPanel.tsx # (수정) BET-HIGHLIGHT 추가
│   │   │   └── GameTable.tsx   # (수정) 배분 애니메이션 + 덱 표시
│   │   └── modals/
│   │       ├── ShuffleModal.tsx # (대체) rAF 셔플 UI로 교체
│   │       └── CutModal.tsx    # (대체) 드래그 기리 UI로 교체
│   └── lib/
│       └── cardImageUtils.ts   # (신규) 카드 이미지 경로 유틸
```

### Anti-Patterns (피해야 할 패턴)

- **framer-motion 추가:** sutda-shuffle-giri-ux.md가 명시적으로 금지. "물리 엔진 없음, framer-motion 불필요"
- **CSS keyframe으로 셔플 구현:** rAF 기반이 아니면 "pointerup 즉시 종료" 구현 불가 (D-11)
- **서버에 dealing 단계 추가:** D-04 결정으로 서버 로직 무변경. 클라이언트 숨김 방식
- **기존 showCardConfirm 모달 유지:** D-07 결정으로 "카드 클릭 뒤집기"가 모달을 대체
- **vh 단위만 사용:** 모바일에서 주소바 높이로 스크롤 발생. `dvh` 사용 필요
- **CardFace/CardBack를 HwatuCard 없이 수정:** img 태그 추가만으로는 3D flip이 불가능한 구조

---

## Don't Hand-Roll

| 문제 | 직접 구현하지 말 것 | 사용할 것 | 이유 |
|------|-------------------|-----------|----|
| 3D flip 애니메이션 | 커스텀 canvas 기반 flip | CSS `transform: rotateY` + `backface-visibility: hidden` | card-flip.md에 완성된 패턴 존재 |
| 이징 커브 계산 | 직접 수식 작성 | `t<0.5?2t²:-1+(4-2t)t` (easeInOut), sutda-shuffle-giri-ux.md 공통 규칙 | 스펙 문서에 명시된 커브 |
| 탭 vs 드래그 구분 | 별도 터치/마우스 이벤트 분기 | `pointerdown/pointermove/pointerup` + threshold 8px | sutda-shuffle-giri-ux.md 공통 포인터 패턴 |
| 셔플 카드 그림자 | 커스텀 구현 | `0 Npx 0 rgba(0,0,0,0.2)` (안정), `0 14px 28px rgba(0,0,0,0.5)` (들림) | 스펙 명시값 |
| 카드 각도 노이즈 | 매 렌더 랜덤 계산 | 마운트 시 1회 계산 후 고정, `rotate(±2deg)` | 이동 중 흔들림 방지 스펙 |
| 이미지 경로 매핑 | 하드코딩 | `cardImageUtils.ts` 유틸 함수 | rank+attribute → 파일명 일관된 변환 |

---

## Common Pitfalls

### Pitfall 1: img/ 폴더 경로 문제
**발생 상황:** 이미지 참조 시 404 오류
**원인:** Vite 정적 파일 서빙이 `packages/client/public/`만 바라보도록 기본 설정되어 있는 경우, 루트의 `img/` 폴더를 못 찾을 수 있음
**예방:** `img/` 폴더는 루트에 유지. Vite의 `publicDir` 또는 `vite.config.ts`에서 정적 경로를 확인하고 필요 시 조정.
**경고 신호:** 개발 서버에서 이미지 로드 실패

### Pitfall 2: backface-visibility 미적용 시 뒷면 비침
**발생 상황:** 카드 flip 시 앞면/뒷면이 동시에 보임
**원인:** `.hwatu-face`에 `backface-visibility: hidden` 누락
**예방:** card-flip.md의 CSS를 그대로 사용
**경고 신호:** flip 애니메이션 중 양면이 겹쳐 보임

### Pitfall 3: rAF 중단 처리 누락
**발생 상황:** 컴포넌트 언마운트 후 rAF 계속 실행
**원인:** `useEffect` cleanup에서 `cancelAnimationFrame` 미호출
**예방:** `useEffect(() => { return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }; }, [])`
**경고 신호:** 컴포넌트 전환 후 애니메이션 관련 state 오류

### Pitfall 4: pointerup 시 드래그/탭 판단 오류
**발생 상황:** 더미 탭이 드래그로 처리되거나 반대의 경우
**원인:** threshold 미적용, 또는 ghost 너무 일찍 소환
**예방:** `pointermove`에서 누적 이동거리 계산 후 8px 초과 시만 드래그 확정. threshold 미만에서는 ghost 미소환.
**경고 신호:** 탭 시 더미가 의도치 않게 분리됨

### Pitfall 5: 모바일 100vh 스크롤 문제
**발생 상황:** 모바일에서 하단이 잘리거나 스크롤 발생
**원인:** `height: 100vh`는 모바일 브라우저 주소바 포함 높이
**예방:** `height: 100dvh` 또는 JS로 `window.innerHeight` 사용. Tailwind에서는 `h-dvh` 클래스.
**경고 신호:** iPhone Safari에서 게임 화면 하단 버튼이 주소바에 가려짐

### Pitfall 6: Card 타입과 이미지 파일 인덱스 불일치
**발생 상황:** 잘못된 카드 이미지 표시 (예: 광 카드에 일반 이미지)
**원인:** `Card.rank` + `Card.attribute` 조합에서 파일 인덱스(1 또는 2) 결정 로직 오류
**예방:** `cardImageUtils.ts`에 rank별 attribute→파일인덱스 매핑 테이블을 명확히 정의하고 단위 테스트 작성
**경고 신호:** 족보표에서 광이라고 표시되는데 이미지는 일반 카드

### Pitfall 7: 셔플 더미 카드 zIndex 순서
**발생 상황:** 셔플 peek 단계에서 중간 카드가 위 카드들 앞으로 보임
**원인:** peek 단계에서 zIndex를 올려버림
**예방:** sutda-shuffle-giri-ux.md의 peek/hold 핵심 규칙 준수 — "peek 단계에서 zIndex는 원래 레이어 그대로 유지". rise 시작 시점에만 zIndex 최상위로 올림
**경고 신호:** 셔플 시 카드가 뒤에서 빠져나오는 대신 앞으로 바로 튀어오름

### Pitfall 8: setPointerCapture 미사용 시 드래그 끊김
**발생 상황:** 빠른 드래그 시 포인터가 요소 밖으로 나가 드래그 중단
**원인:** pointer가 요소 boundary를 벗어나면 pointermove 이벤트 수신 중단
**예방:** `pointerdown` 핸들러에서 `e.currentTarget.setPointerCapture(e.pointerId)` 호출
**경고 신호:** 빠른 드래그 시 기리 더미가 중간에 떨어짐

---

## Code Examples

### 3D 화투 카드 컴포넌트 (card-flip.md 기반)

```tsx
// 출처: card-flip.md — 섯다 프로젝트 canonical 스펙
// packages/client/src/components/game/HwatuCard.tsx

interface HwatuCardProps {
  frontSrc: string;
  backSrc?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  faceUp?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { width: 51, height: 83 },
  md: { width: 68, height: 110 },
  lg: { width: 85, height: 135 },
};

const faceStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  borderRadius: 5,
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.15)',
};

const imgStyle: React.CSSProperties = {
  width: '100%', height: '100%',
  objectFit: 'fill',
  display: 'block',
  pointerEvents: 'none',
  userSelect: 'none',
};

export function HwatuCard({ frontSrc, backSrc = '/img/card_back.jpg', alt = '화투 카드', size = 'md', faceUp = false, onClick }: HwatuCardProps) {
  const { width, height } = SIZE_MAP[size];
  return (
    <div style={{ width, height, perspective: 600, cursor: onClick ? 'pointer' : 'default', display: 'inline-block', flexShrink: 0 }} onClick={onClick}>
      <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)', transform: faceUp ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
        <div style={faceStyle}>
          <img src={frontSrc} alt={alt} style={imgStyle} />
        </div>
        <div style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
          <img src={backSrc} alt="뒷면" style={imgStyle} />
        </div>
      </div>
    </div>
  );
}
```

### 카드 이미지 경로 유틸리티

```ts
// packages/client/src/lib/cardImageUtils.ts
import type { Card } from '@sutda/shared';

// rank별 attribute → 파일 인덱스 매핑
// 광(gwang): 01-1, 03-1, 08-1, 10-1
// 열끗(yeolkkeut): 04-1, 07-1, 09-1
// 나머지는 두 장 모두 normal: XX-1, XX-2 순서는 배열 인덱스로 구별
const FILE_INDEX_MAP: Record<number, Record<string, number>> = {
  1: { gwang: 1, normal: 2 },
  2: { normal_1: 1, normal_2: 2 },  // 두 장 모두 normal
  3: { gwang: 1, normal: 2 },
  4: { yeolkkeut: 1, normal: 2 },
  5: { normal_1: 1, normal_2: 2 },
  6: { normal_1: 1, normal_2: 2 },
  7: { yeolkkeut: 1, normal: 2 },
  8: { gwang: 1, normal: 2 },
  9: { yeolkkeut: 1, normal: 2 },
  10: { gwang: 1, normal: 2 },
};

export function getCardImageSrc(card: Card, cardPositionInHand?: number): string {
  const rank = card.rank;
  const padded = String(rank).padStart(2, '0');

  if (card.attribute === 'gwang') return `/img/${padded}-1.png`;
  if (card.attribute === 'yeolkkeut') return `/img/${padded}-1.png`;
  // normal: 두 장 모두 normal인 경우 손패 인덱스로 구별
  // cardPositionInHand가 없으면 기본 1번
  const fileIdx = cardPositionInHand === 1 ? 2 : 1;
  return `/img/${padded}-${fileIdx}.png`;
}
```

### 베팅 패널 강조 (BET-HIGHLIGHT)

```tsx
// BettingPanel.tsx 수정 — isMyTurn prop 이미 존재
// ring + glow 효과로 강조
<div className={cn(
  'rounded-lg border transition-all duration-300',
  isMyTurn
    ? 'border-primary ring-2 ring-primary/50 shadow-[0_0_12px_rgba(var(--color-primary),0.3)]'
    : 'border-border'
)}>
  {/* 기존 내용 */}
</div>
```

### 패널 레이아웃 (UX-09)

```tsx
// GameLayout.tsx — 데스크탑 3열, 모바일 수직
<div className="h-dvh overflow-hidden flex flex-col md:grid md:grid-cols-[280px_1fr_280px]">
  {/* 모바일: 순서 = 테이블 → 베팅+손패 → 채팅 */}
  {/* 데스크탑: 좌=베팅+손패, 중=테이블, 우=정보+채팅 */}

  {/* 좌사이드 (데스크탑만) */}
  <div className="hidden md:flex flex-col gap-2 p-3 overflow-y-auto border-r border-border">
    <BettingPanel ... />
    <HandPanel ... />
  </div>

  {/* 중앙 — 게임테이블 */}
  <div className="flex-1 min-h-0 flex items-center justify-center p-2">
    <GameTable ... />
  </div>

  {/* 우사이드 (데스크탑만) */}
  <div className="hidden md:flex flex-col gap-2 p-3 overflow-y-auto border-l border-border">
    <InfoPanel ... />
    <div className="flex-1 border border-dashed border-border rounded-lg p-3 text-muted-foreground text-xs">
      채팅 (Phase 11)
    </div>
  </div>

  {/* 모바일: 베팅+손패 */}
  <div className="md:hidden border-t border-border p-3 space-y-2">
    <HandPanel ... />
    <BettingPanel ... />
  </div>

  {/* 모바일: 채팅 placeholder */}
  <div className="md:hidden h-12 border-t border-border flex items-center justify-center text-xs text-muted-foreground">
    채팅 (Phase 11)
  </div>
</div>
```

### rAF 기반 셔플 이징 커브

```ts
// sutda-shuffle-giri-ux.md 공통 규칙 기반
// easeInOut: t<0.5 ? 2t² : -1+(4-2t)t
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// easeOut: 1-(1-t)²
function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
```

---

## State of the Art

| 구 접근법 | 현재 접근법 | 변경 시점 | 영향 |
|----------|-----------|---------|------|
| 터치/마우스 이벤트 분리 | Pointer Events API 단일 처리 | 브라우저 지원 안정화 | 코드 중복 제거 |
| height: 100vh (모바일) | height: 100dvh | CSS Level 4 | 모바일 주소바 대응 |
| CSS keyframe 애니메이션 | rAF + JS 상태 | 세밀한 제어 필요 시 | 인터랙티브 애니메이션에 적합 |
| framer-motion | 순수 CSS transform | 번들 크기 최적화 트렌드 | 불필요한 의존성 제거 |

**dvh 브라우저 지원:** Chrome 108+, Safari 15.4+, Firefox 101+. 2024년 기준 모든 주요 모바일 브라우저 지원. [신뢰도: HIGH — MDN 공식 스펙]

---

## Environment Availability

| 의존성 | 필요 항목 | 사용 가능 | 비고 |
|--------|----------|-----------|------|
| Node.js | 빌드/개발 서버 | ✓ | 기존 프로젝트 실행 중 |
| pnpm | 패키지 관리 | ✓ | pnpm-workspace.yaml 존재 |
| 이미지 파일 | img/ 폴더 21개 파일 | ✓ | 루트의 `img/` 폴더에 존재, 그대로 사용 |
| public/ 폴더 | Vite 정적 파일 | ✓ | `img/` 폴더 루트에 유지 — 이동 불필요 |
| 기존 Tailwind `h-dvh` | 모바일 레이아웃 | ✓ | Tailwind v4에서 지원 |

**누락 의존성 (fallback 없음):**
- 없음

**누락 의존성 (fallback 있음):**
- 없음

---

## Validation Architecture

### Test Framework

| 항목 | 값 |
|------|-----|
| Framework | Vitest 3 + @testing-library/react 16 |
| Config file | `packages/client/vitest.config.ts` |
| Quick run command | `pnpm --filter @sutda/client test` |
| Full suite command | `pnpm --filter @sutda/client test -- --run` |

### Phase Requirements → Test Map

| Req ID | 테스트 대상 동작 | 테스트 타입 | 자동화 명령 | 파일 존재? |
|--------|----------------|------------|------------|-----------|
| IMG-01 | HwatuCard가 올바른 이미지 src를 렌더링하는지 확인 | unit | `vitest run src/components/game/__tests__/HwatuCard.test.tsx` | ❌ Wave 0 |
| IMG-01 | getCardImageSrc 유틸리티 각 rank/attribute 조합 검증 | unit | `vitest run src/lib/cardUtils.test.ts` | ✓ (파일 수정) |
| UX-03/05 | HandPanel에서 카드 클릭 시 flip 상태 토글, 2장 모두 뒤집으면 onAllFlipped 호출 | unit | `vitest run src/components/layout/__tests__/HandPanel.test.tsx` | ✓ (테스트 추가) |
| BET-HIGHLIGHT | BettingPanel isMyTurn=true 시 강조 클래스 적용 확인 | unit | `vitest run src/components/layout/__tests__/BettingPanel.test.tsx` | ✓ (테스트 추가) |
| UX-09 | GameLayout 컴포넌트 스냅샷 또는 클래스 존재 확인 | unit | `vitest run src/components/layout/__tests__/GameLayout.test.tsx` | ❌ Wave 0 |
| UX-07/08 | 셔플/기리 애니메이션 로직 (rAF 직접 테스트 어려움) | manual | — | manual-only |
| UX-06 | 배분 애니메이션 (DOM 위치 의존) | manual | — | manual-only |

**manual-only 정당화:**
- rAF 기반 애니메이션은 `performance.now()` 타이밍에 의존 → jsdom에서 의미있는 자동화 테스트 불가
- DOM 위치 기반 배분 애니메이션은 실제 레이아웃 렌더링 필요 → 브라우저 환경에서만 검증 가능

### Sampling Rate
- **태스크 커밋 전:** `pnpm --filter @sutda/client test`
- **웨이브 병합 전:** `pnpm --filter @sutda/client test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/client/src/components/game/__tests__/HwatuCard.test.tsx` — IMG-01 커버
- [ ] `packages/client/src/components/layout/__tests__/GameLayout.test.tsx` — UX-09 커버
- [ ] `packages/client/src/lib/cardImageUtils.ts` — getCardImageSrc 유틸 + 기존 cardUtils.test.ts에 테스트 추가

---

## Open Questions

1. **Card 타입 확장 여부**
   - 파악된 내용: 현재 `Card` 타입은 `{ rank, attribute }`만 있음. 같은 rank에서 두 장 모두 normal 속성인 경우(rank 2, 5, 6) 파일 인덱스 구별이 필요.
   - 불명확한 점: 서버의 `Card` 타입에 `cardNumber: 1 | 2` 또는 `fileIndex: 1 | 2` 필드를 추가할지, 클라이언트에서 손패 인덱스로 추론할지.
   - 권고사항: 클라이언트 손패 배열 인덱스로 구별 (서버 무변경 원칙 D-04 유지). rank 2, 5, 6의 두 장은 손패에서 먼저 받은 카드가 XX-1.png.

2. **배분 애니메이션 복잡도**
   - 파악된 내용: DOM ref 기반 위치 계산은 레이아웃 재설계와 함께 진행 시 좌표 계산이 복잡해짐.
   - 불명확한 점: "날아오는" 효과를 위치 추적 기반(getBoundingClientRect)으로 구현할지, 단순 CSS keyframe(`translateY(-80px) → 0` + opacity)으로 구현할지.
   - 권고사항: 먼저 단순 CSS keyframe으로 구현하고, 위치 추적 기반 애니메이션은 선택적 강화로 처리. 레이아웃 재설계 완료 후 좌표가 안정화되면 추가.

3. **ShuffleModal을 인라인 패널로 교체 여부**
   - 파악된 내용: 현재 셔플은 Dialog(모달) 방식. rAF 셔플 애니메이션은 카드 더미를 시각화해야 하므로 공간이 필요.
   - 불명확한 점: 기존 `Dialog` 안에서 구현할지, 게임 테이블 위에 오버레이로 구현할지.
   - 권고사항: 기존 Dialog 구조 유지하면서 내부 콘텐츠를 rAF 애니메이션 컴포넌트로 교체. Dialog backdrop이 있으므로 다른 UI와 겹침 문제 없음.

---

## Sources

### Primary (HIGH 신뢰도)
- `sutda-shuffle-giri-ux.md` — 셔플/기리 전체 스펙 (프로젝트 canonical 문서)
- `card-flip.md` — 3D flip 컴포넌트 전체 스펙 (프로젝트 canonical 문서)
- `packages/client/src/` — 기존 구현 코드 직접 확인
- `img/` 폴더 — 이미지 파일 존재 확인 (21개 파일)
- `packages/client/package.json` — 설치된 패키지 버전 확인

### Secondary (MEDIUM 신뢰도)
- Tailwind CSS v4 `h-dvh` 클래스 — CSS Level 4 동적 뷰포트 단위 공식 지원
- MDN Web Docs: Pointer Events API, CSS backface-visibility

### Tertiary (LOW 신뢰도)
- 없음

---

## Metadata

**신뢰도 세부 항목:**
- Standard Stack: HIGH — package.json 직접 확인
- Architecture: HIGH — canonical 스펙 문서 (card-flip.md, sutda-shuffle-giri-ux.md) 직접 확인
- Pitfalls: HIGH — 기존 코드 구조 분석 + 스펙 문서의 명시적 경고사항 기반
- Card 이미지 매핑: MEDIUM — 파일명 규칙과 card-flip.md 주석 기반, 실제 이미지 내용 확인은 시각적 검증 필요

**연구일:** 2026-03-31
**유효기간:** 60일 (프로젝트 자체 스펙이므로 외부 변경 없음)
