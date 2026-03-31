---
phase: 10
slug: ux
status: draft
shadcn_initialized: true
preset: "style=default, baseColor=slate, cssVariables=true"
created: 2026-03-31
---

# Phase 10 — UI Design Contract

> Phase 10 시각/인터랙션 완성의 시각 및 인터랙션 계약서.
> gsd-ui-researcher가 생성하고 gsd-ui-checker가 검증한다.

---

## 출처 요약

| 항목 | 출처 |
|------|------|
| 잠금 결정 (D-01~D-21) | 10-CONTEXT.md `<decisions>` |
| 컴포넌트 스택 | packages/client/components.json (shadcn, style=default, baseColor=slate) |
| 색상 토큰 | packages/client/src/index.css (`@theme inline`) |
| 레이아웃 현황 | GameTable.tsx, BettingPanel.tsx 직접 확인 |
| 카드 컴포넌트 패턴 | 10-RESEARCH.md (card-flip.md 기반 HwatuCard 패턴) |
| 셔플/기리 스펙 | 10-RESEARCH.md (sutda-shuffle-giri-ux.md 기반) |
| Claude's Discretion | BET-HIGHLIGHT 스타일, 배분 애니메이션 경로, 패널 비율 |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | style=default, baseColor=slate, cssVariables=true |
| Component library | Radix UI (shadcn 기반) |
| Icon library | lucide-react |
| Font | 시스템 기본 (sans-serif) — 한글 UI에 최적화 |

설치된 shadcn 컴포넌트: `button`, `badge`, `card`, `dialog`, `input`, `separator`, `sonner`

---

## Spacing Scale

선언된 값 (4의 배수 전용):

| Token | Value | 용도 |
|-------|-------|------|
| xs | 4px | 아이콘 간격, 인라인 패딩 (gap-1, p-1) |
| sm | 8px | 카드 내부 요소 간격, 소형 버튼 패딩 (gap-2, p-2) |
| md | 16px | 기본 패널 내부 패딩, 요소 간격 (p-4, gap-4) |
| lg | 24px | 섹션 패딩, 패널 헤더 (p-6) |
| xl | 32px | 레이아웃 열 간격 (gap-8) |
| 2xl | 48px | 주요 섹션 구분 — 이 Phase에서는 미사용 |
| 3xl | 64px | 페이지 레벨 — 이 Phase에서는 미사용 |

**예외:**
- 카드 touch target: 최소 44px (모바일 탭 대상인 HwatuCard는 height 최소 44px 보장)
- 중앙 게임테이블 패널: 데스크탑 `480px × 480px` 고정 (Phase 6 D-08 원형 배치 유지)
- 패널 전체 높이: `100dvh` (스크롤 없는 단일 화면)

---

## Typography

| Role | Size | Weight | Line Height | 용도 |
|------|------|--------|-------------|------|
| Body | 14px | 400 | 1.5 | 일반 설명 텍스트, 베팅 현황 라벨 |
| Label | 12px | 400 | 1.4 | 뱃지, 상태 표시, `text-xs` 클래스 |
| Heading | 16px | 600 | 1.3 | 패널 제목, 판돈 표시 레이블 |
| Display | 26px | 600 | 1.2 | 판돈 금액 숫자 (tabular-nums) |

**웨이트 2개 선언:** `font-normal(400)` — Body + Label / `font-semibold(600)` — Heading + Display

**참고:** 현재 `GameTable.tsx` 판돈 표시가 `text-[26px] font-semibold`로 이미 정의됨 — 유지.

---

## Color

기존 `packages/client/src/index.css`의 `@theme inline` 토큰을 그대로 사용:

| Role | HSL Value | 용도 |
|------|-----------|------|
| Dominant (60%) | `hsl(70 15% 8%)` — `--color-background` | 전체 배경, body |
| Secondary (30%) | `hsl(72 12% 13%)` — `--color-card` | 패널 카드, 팝오버, 모달 배경 |
| Accent (10%) | `hsl(75 55% 42%)` — `--color-primary` | **아래 목록에만 사용** |
| Destructive | `hsl(0 72% 60%)` — `--color-destructive` | 다이 버튼, 파괴적 액션 전용 |

**Accent 예약 목록 (이 이외 요소에 accent 사용 금지):**
1. BET-HIGHLIGHT — 베팅 차례 패널의 ring/glow 강조
2. Primary 버튼 배경 (셔플 확인, 기리 합치기 완료, 게임 시작 등)
3. 현재 턴 플레이어 시트 강조 테두리
4. 족보 계산 결과 표시 텍스트

**BET-HIGHLIGHT 구체 스타일 (Claude's Discretion — D-21):**
```css
/* isMyTurn = true일 때 BettingPanel wrapper */
ring-2 ring-primary ring-offset-2 ring-offset-background
/* + 미세 glow */
shadow-[0_0_12px_hsl(75_55%_42%/0.35)]
```
이는 기존 shadcn `ring` 유틸리티를 활용하며 테마 일관성을 유지한다.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| 카드 뒤집기 CTA | 없음 — 카드를 탭하면 뒤집힘 (버튼 불필요, UX-03/UX-05 결정 D-07) |
| 카드 1장만 뒤집은 상태 힌트 | "나머지 카드를 탭해서 확인하세요" |
| 2장 모두 뒤집은 후 족보 표시 | "{족보명}" (예: "삼팔광땡", "알리") |
| 셔플 버튼 상태 — 누르는 중 | "셔플 중..." (버튼 레이블 또는 aria-label) |
| 셔플 버튼 상태 — 대기 | "셔플" |
| 기리 합치기 완료 버튼 | "합치기" |
| 기리 phase: split | "드래그해서 더미를 나누세요" |
| 기리 phase: tap | "탭해서 합칠 순서를 정하세요" |
| 기리 phase: merging | "" (애니메이션 진행 중, 텍스트 불필요) |
| 채팅 패널 placeholder | "채팅은 다음 버전에서 제공됩니다" |
| 배분 중 카드 상태 힌트 | 없음 — 카드가 뒷면으로 도착하면 시각적으로 자명 |
| 재경기 오버레이 (regame.png) | 이미지만 — 별도 텍스트 없음 (D-03) |
| 빈 손패 상태 (배분 전) | 없음 — 빈 공간 표시 (dealing 중 뒷면 표시됨) |
| 오류: 내 턴 아닐 때 액션 시도 | 발생하지 않도록 버튼 비활성화 (소프트 가드) |
| 다이 확인 | 다이 버튼 단일 클릭으로 즉시 처리 — 확인 다이얼로그 없음 (기존 UX 유지) |

---

## Visual Interaction Contract

### 1. HwatuCard 컴포넌트 (IMG-01, IMG-02, UX-03, UX-05)

**card-flip.md 기반 canonical 패턴 — 그대로 구현:**

```
크기 규칙 (화투 실물 1:1.583 비율):
  sm: 51px × 83px  — PlayerSeat 내 상대 카드
  md: 68px × 110px — HandPanel 내 내 카드 (기본)
  lg: 85px × 135px — 선택 강조 시 (GollaSelectModal 등)
```

**3D flip CSS 패턴:**
```
.hwatu-scene     → perspective: 600px
.hwatu-card      → transform-style: preserve-3d; transition: transform 0.45s cubic-bezier(0.4,0,0.2,1)
.hwatu-card.is-flipped → transform: rotateY(180deg)
.hwatu-face      → backface-visibility: hidden; position: absolute; inset: 0
.hwatu-back      → transform: rotateY(180deg); backface-visibility: hidden; position: absolute; inset: 0
```

**초기 상태:** `faceUp=false` (뒷면) — dealing phase 동안 클릭 이벤트 비활성화 (`pointer-events-none`)

**뒤집기 가능 상태:** dealing phase 완료 후, 내 카드에만 `onClick` 핸들러 연결

**카드 이미지 경로:** `/img/{rank padded 2자리}-{fileIndex}.png`, 뒷면: `/img/card_back.jpg`

**카드 이펙트 (Claude's Discretion):**
```css
/* 실물 카드 느낌을 위한 미세 효과 */
box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6);
border-radius: 4px;
/* hover 시 */
hover:scale-105 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)]
transition: transform 0.15s ease, box-shadow 0.15s ease
```

---

### 2. 카드 배분 애니메이션 (UX-06)

**방식:** CSS `transform: translate()` + `transition` (CSS keyframe 아님)

**경로 (Claude's Discretion):** 직선 이동 (포물선 없음) — 중앙 덱 위치에서 각 PlayerSeat DOM 위치로 직선 translate. `getBoundingClientRect()`로 목표 위치 계산.

**타이밍:**
```
카드 1장 이동 시간: 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
카드 간 딜레이: 180ms (반시계 방향 순서대로)
전체 배분 완료 후 1장 뒤집기 가능 상태로 전환
```

**dealing phase 중 규칙 (D-04):** 서버에서 카드 데이터가 도착해도 `faceUp=false` 강제. 애니메이션 진행 중 카드 클릭 불가 (`pointer-events-none`).

---

### 3. 셔플 인터랙션 (UX-07, D-10, D-11)

**트리거:** `pointerdown` → 루프 시작, `pointerup` / `pointerleave` → 즉시 종료

**5 페이즈 사이클 (1사이클 ≈ 820ms, rAF 기반):**
```
peek  → 0~120ms:  상단 카드 약간 들어올리기 (translateY -8px)
hold  → 120~300ms: 정지
rise  → 300~480ms: 완전히 들어올리기 (translateY -20px)
drop  → 480~700ms: 빠르게 내리기 + 위치 교환 (easeIn)
rest  → 700~820ms: 제자리 안정화
```

**Zustand ShuffleState:**
```ts
interface ShuffleState {
  isShuffling: boolean;
  phase: 'idle' | 'peek' | 'hold' | 'rise' | 'drop' | 'rest';
  pickedIdx: number;  // 0 또는 1 (두 카드 중 어느 쪽이 올라갈지)
}
```

---

### 4. 기리(Cut) 인터랙션 (UX-08, D-13, D-14, D-15)

**드래그 threshold:** 8px (이하는 탭으로 판정)

**4 페이즈:**
```
split   → 드래그로 더미 분리 (2~N개 더미 생성)
tap     → 탭으로 합치기 순서 지정 (번호 배지 표시)
merging → 합치기 애니메이션 진행 중 (easeInOut 380ms)
done    → 완료
```

**탭 순서 시각화:** 탭한 순서대로 더미에 원형 번호 배지 표시 (1 = 맨 아래)

**Zustand GiriState:**
```ts
interface GiriState {
  phase: 'split' | 'tap' | 'merging' | 'done';
  piles: Pile[];
  tapOrder: number[];  // 더미 인덱스 순서
}
```

---

### 5. 패널 레이아웃 재설계 (UX-09, D-16~D-20)

**데스크탑 (md 이상, 768px+) — 3열 그리드:**
```
┌─────────────────────────────────────────────────┐
│  좌사이드 (w-64)  │  중앙 (flex-1)  │  우사이드 (w-64)  │
│  BettingPanel    │  GameTable       │  InfoPanel       │
│  HandPanel       │  (480px×480px)   │  ChatPanel(ph)   │
│                  │                  │                  │
└─────────────────────────────────────────────────┘

CSS: grid grid-cols-[256px_1fr_256px] h-dvh overflow-hidden
```

**모바일 세로 (md 미만) — 수직 flex:**
```
┌────────────────────┐
│ GameTable + Info   │  (레이어 배치, h-[45dvh])
│ (상대 위치 오버레이) │
├────────────────────┤
│  BettingPanel      │  (h-auto)
│  HandPanel         │  (h-auto)
├────────────────────┤
│  ChatPanel (ph)    │  (h-12, placeholder)
└────────────────────┘

CSS: flex flex-col h-dvh overflow-hidden
```

**스크롤 없음:** 최상위 래퍼에 `overflow-hidden` 적용. 패널 내부 요소가 공간을 초과할 경우 `overflow-y-auto` (단, GameTable 제외)

**원형 배치 (D-19):** Phase 6의 CSS custom properties (`--seat-angle`, `--seat-radius`) 그대로 유지. 중앙 패널 내 480px × 480px 컨테이너 안에서 동작.

**채팅 패널 placeholder (D-20):**
- 데스크탑: 우사이드 하단에 빈 영역 + "채팅은 다음 버전에서 제공됩니다" 텍스트
- 모바일: 하단에 `h-12` 회색 바 (접힌 상태)

---

### 6. 배경 및 오버레이 이미지 (IMG-03, D-02, D-03)

**테이블 배경:** `img/background.jpg` → GameTable 중앙 패널 배경으로 적용
```css
background-image: url('/img/background.jpg');
background-size: cover;
background-position: center;
```

**메인 타이틀:** `img/main_tilte.jpg` → WaitingRoom / 로비 상단 타이틀 이미지로 교체
```css
width: auto; height: 80px; object-fit: contain;
```

**재경기 오버레이 (D-03):** `img/regame.png` → ResultScreen 위에 absolute 포지션 오버레이
```css
position: absolute; inset: 0; object-fit: contain;
opacity: 0.85;
animation: fadeIn 0.4s ease-in;
pointer-events: none;  /* 하단 버튼 클릭 방해 금지 */
```

---

## Registry Safety

| Registry | 사용 블록 | Safety Gate |
|----------|-----------|-------------|
| shadcn official | button, badge, card, dialog, input, separator, sonner | 검증 불필요 |
| 서드파티 없음 | — | 해당 없음 |

Phase 10은 외부 애니메이션 라이브러리(framer-motion, GSAP, matter.js) 추가 없음. CSS transform + requestAnimationFrame + Pointer Events API로 전 구현.

---

## 컴포넌트 인벤토리 (신규/수정)

| 컴포넌트 | 상태 | 파일 경로 |
|---------|------|-----------|
| `HwatuCard` | 신규 생성 | `src/components/game/HwatuCard.tsx` |
| `cardImageUtils` | 신규 생성 | `src/lib/cardImageUtils.ts` |
| `CardFace` | 제거 (HwatuCard로 교체) | 삭제 |
| `CardBack` | 제거 (HwatuCard로 교체) | 삭제 |
| `ShuffleModal` | 수정 (rAF 애니메이션 추가) | 기존 파일 |
| `CutModal` | 수정 (기리 드래그 UX) | 기존 파일 |
| `HandPanel` | 수정 (flip 상태, 배분 애니메이션) | 기존 파일 |
| `BettingPanel` | 수정 (BET-HIGHLIGHT ring) | 기존 파일 |
| `GameTable` | 수정 (배경 이미지) | 기존 파일 |
| `RoomPage` | 수정 (3열 레이아웃) | 기존 파일 |
| `WaitingRoom` | 수정 (타이틀 이미지) | 기존 파일 |
| `ResultScreen` | 수정 (regame 오버레이) | 기존 파일 |
| `useShuffleStore` | 신규 생성 | `src/store/shuffleStore.ts` |
| `useGiriStore` | 신규 생성 | `src/store/giriStore.ts` |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
