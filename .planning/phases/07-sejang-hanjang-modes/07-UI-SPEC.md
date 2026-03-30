---
phase: 7
slug: sejang-hanjang-modes
status: draft
shadcn_initialized: true
preset: default (slate base, cssVariables: true)
created: 2026-03-30
---

# Phase 7 — UI Design Contract: 세장섯다 + 한장공유 모드

> 이 페이즈의 시각적 · 인터랙션 계약서. gsd-ui-researcher가 생성, gsd-ui-checker가 검증.

---

## Design System

| 속성 | 값 |
|------|-----|
| Tool | shadcn |
| Preset | default (slate), Tailwind v4, cssVariables |
| Component library | Radix UI (shadcn wrapper) |
| Icon library | lucide-react |
| Font | 시스템 기본 폰트 (sans-serif 스택) |

출처: `packages/client/components.json`, `packages/client/src/index.css`

---

## Spacing Scale

4의 배수 8포인트 스케일. Phase 6에서 확립된 스케일을 그대로 따른다.

| Token | Value | 용도 |
|-------|-------|------|
| xs | 4px | 아이콘 간격, 배지 내부 패딩 |
| sm | 8px | 카드 간격, 버튼 내부 compact |
| md | 16px | 기본 요소 간격, 패널 내부 padding |
| lg | 24px | 섹션 padding, 모달 내부 여백 |
| xl | 32px | 레이아웃 주요 간격 |
| 2xl | 48px | 주요 섹션 구분 |
| 3xl | 64px | 페이지 레벨 여백 |

**예외:**
- 카드 선택 토글 터치 타겟: 최소 44px (CardFace 기존 크기 w-16 h-24 = 64px × 96px — 이미 충족)
- 공유 카드 중앙 표시 영역: 80px × 120px (기본 카드 1.25배 크기, 테이블 중앙 강조)
- 20장 그리드 셀: gap-2 (8px) 유지 — DealerSelectModal 기존 패턴과 동일

출처: Phase 6 기존 컴포넌트 패턴 (`DealerSelectModal.tsx`, `CardFace.tsx`)

---

## Typography

Phase 6에서 확립된 타이포그래피. font weight 2가지(400, 600)로 통일.

| 역할 | Size | Weight | Line Height | 용도 |
|------|------|--------|-------------|------|
| Body | 14px (text-sm) | 400 (regular) | 1.5 | 일반 설명, 모달 본문 |
| Label | 14px (text-sm) | 600 (semibold) | 1.5 | 카드 라벨, 배지, 액션 힌트 |
| Heading | 20px (text-xl / DialogTitle 기본) | 600 (semibold) | 1.2 | 모달 제목, 섹션 헤더 |
| Display | 26px (text-[26px] 기존 팟 금액) | 600 (semibold) | 1.1 | 팟 금액, 핵심 숫자 — 26px 크기로 충분히 시각적 구분됨 |

출처: `GameTable.tsx` (text-[26px] font-bold → font-semibold로 통일), `HandPanel.tsx` (text-sm font-semibold), `DealerSelectModal.tsx` 패턴

---

## Color

Phase 6에서 확립된 어두운 올리브-그린 테마. 변경 없음.

| 역할 | CSS 변수 | HSL 값 | 용도 |
|------|----------|---------|------|
| Dominant (60%) | --color-background | hsl(70 15% 8%) | 페이지 배경, 게임 테이블 |
| Secondary (30%) | --color-card / --color-secondary | hsl(72 12% 13~18%) | 카드 컴포넌트, 패널 배경, 모달 |
| Accent (10%) | --color-primary | hsl(75 55% 42%) | 아래 "accent 전용 요소" 참조 |
| Destructive | --color-destructive | hsl(0 72% 60%) | 다이 버튼, 경고 텍스트 |

**Accent 전용 요소 (정확히 이 요소들에만 사용):**
1. 카드 선택 토글 — 선택된 카드의 ring-2 ring-primary 하이라이트
2. 현재 턴 플레이어 자리 강조 (기존 ring-primary 패턴 유지)
3. 확인 버튼 (선택 완료 시 활성화되는 "2장 선택 완료" 버튼)
4. hover 상태 카드 그리드 셀 (hover:ring-2 hover:ring-primary)
5. 공유 카드 중앙 표시 영역 border (ring-2 ring-primary/50)

출처: `index.css` @theme inline, `DealerSelectModal.tsx` (hover:ring-primary 패턴)

---

## 컴포넌트 인벤토리

### 신규 컴포넌트 (새로 만들어야 함)

| 컴포넌트 | 위치 | 역할 |
|---------|------|------|
| `SharedCardDisplay` | `src/components/game/SharedCardDisplay.tsx` | 한장공유 모드에서 테이블 중앙에 공유 카드 표시 |
| `SharedCardSelectModal` | `src/components/modals/SharedCardSelectModal.tsx` | DealerSelectModal 재사용 기반, 딜러에게 앞면 공개 |
| `CardSelectOverlay` | HandPanel 내부 or 별도 | card-select phase에서 카드 토글 선택 UI |

### 기존 컴포넌트 — 수정 필요

| 컴포넌트 | 수정 내용 |
|---------|---------|
| `ModeSelectModal.tsx` | 오리지날 외 세장섯다/한장공유 버튼 2개 추가 |
| `HandPanel.tsx` | `card-select` phase 감지 → 선택 모드 진입, 2장 선택 시 "선택 완료" 버튼 활성화 |
| `GameTable.tsx` | `sharedCard` prop 추가, 한장공유 모드에서 중앙에 SharedCardDisplay 렌더 |

### 기존 컴포넌트 — 재사용 (변경 없음)

| 컴포넌트 | 재사용 방법 |
|---------|-----------|
| `DealerSelectModal.tsx` | SharedCardSelectModal의 베이스 UI 패턴 참조 |
| `CardFace.tsx` | 카드 앞면 — 선택 상태는 className prop으로 외부 주입 |
| `CardBack.tsx` | 비딜러에게 보이는 공유카드 후보, 미선택 카드 |
| `Button` (shadcn) | 모든 CTA 버튼 |
| `Dialog` (shadcn) | 모든 모달 |
| `Badge` (shadcn) | 족보명 배지 |

---

## 인터랙션 계약

### 1. 모드 선택 (ModeSelectModal 확장)

- 딜러인 경우: 3개 버튼 표시 — "오리지날 섯다" / "세장섯다" / "한장공유"
- 비딜러인 경우: 버튼 전체 disabled, "선 플레이어가 모드를 선택 중입니다..." 메시지
- 버튼 레이아웃: 세로 스택 (flex-col gap-2), 각 버튼 w-full variant="outline"
- 클릭 즉시 emit 후 모달 닫힘 (서버가 phase 전환)

### 2. 세장섯다 카드 선택 (card-select phase)

- `HandPanel`이 `card-select` phase를 감지하면 선택 모드로 전환
- **선택 상태:** 카드에 `ring-2 ring-primary` + `scale-105` 트랜지션 적용
- **미선택 상태:** `opacity-70` + `hover:opacity-100 hover:ring-2 hover:ring-primary/50`
- 2장 선택 완료 시에만 "선택 완료" 버튼 활성화 (disabled 해제)
  - 1장 또는 3장(불가)이면 버튼 disabled, 힌트 텍스트: "2장을 선택하세요 ({N}/2)"
- 확인 버튼 클릭 → `select-cards` 이벤트 emit → 버튼 즉시 loading 상태
- 자신이 이미 제출한 경우: "선택 완료! 다른 플레이어를 기다리는 중..." (버튼 숨김)

### 3. 한장공유 공유카드 선택 (SharedCardSelectModal)

- DealerSelectModal 20장 그리드 패턴 그대로 재사용
- **딜러인 경우:** 20장 전부 CardFace (앞면) 표시 — 전략적 선택 가능 (D-13)
- **비딜러인 경우:** 20장 전부 CardBack (뒷면) 표시, 클릭 불가, "선 플레이어가 공유 카드를 선택 중입니다..." 메시지
- 딜러가 카드 선택 → `set-shared-card` 이벤트 emit → 모달 닫힘
- 선택 후 상태 피드백: 선택된 셀 ring-2 ring-primary (클릭 후 즉시)

### 4. 공유 카드 중앙 표시 (SharedCardDisplay)

- GameTable 중앙 팟 표시 영역 아래에 추가 (한장공유 모드에서만 렌더)
- 크기: w-20 h-30 (80px × 120px) — 기본 CardFace(64px × 96px)보다 1.25배 크게
- 라벨: "공유 카드" (text-xs text-muted-foreground, 카드 위에 표시)
- border: `ring-2 ring-primary/50` (항상 강조 상태)
- 위치: 팟 금액 표시 div 하단, 중앙 정렬

---

## Copywriting Contract

| 요소 | 문구 |
|------|------|
| 모드 선택 CTA — 세장섯다 | "세장섯다" |
| 모드 선택 CTA — 한장공유 | "한장공유" |
| 비딜러 모드 대기 | "선 플레이어가 모드를 선택 중입니다..." |
| card-select 진행 힌트 | "2장을 선택하세요 ({N}/2)" |
| card-select 완료 버튼 | "선택 완료" |
| card-select 제출 후 대기 | "선택 완료! 다른 플레이어를 기다리는 중..." |
| SharedCardSelectModal 제목 — 딜러 | "공유 카드 선택" |
| SharedCardSelectModal 제목 — 비딜러 | "공유 카드 선택" (동일) |
| 비딜러 공유카드 대기 | "선 플레이어가 공유 카드를 선택 중입니다..." |
| SharedCardDisplay 라벨 | "공유 카드" |
| 빈 상태 (card-select, 카드 없음) | 발생하지 않음 — card-select phase 진입 시 반드시 3장 보유 |
| 오류 상태 (select-cards 실패) | "카드 선택 중 오류가 발생했습니다. 다시 시도해주세요." |

**파괴적 액션:** Phase 7에 해당 없음 (모드 변경은 판 시작 전에만 가능, 취소 없음)

---

## 상태별 시각 규칙

### HandPanel — card-select phase 상태 매핑

| 상태 | 시각 처리 |
|------|----------|
| 미선택 카드 | `opacity-70`, 클릭 가능 |
| hover (미선택) | `opacity-100`, `ring-1 ring-primary/50` |
| 선택된 카드 | `opacity-100`, `ring-2 ring-primary`, `scale-105` |
| 이미 제출 완료 | 모든 카드 `opacity-100`, 선택 토글 비활성 |

### ModeSelectModal — 버튼 상태 매핑

| 버튼 | 딜러 | 비딜러 |
|------|------|--------|
| "오리지날 섯다" | 활성 (variant="outline") | disabled |
| "세장섯다" | 활성 (variant="outline") | disabled |
| "한장공유" | 활성 (variant="outline") | disabled |

### SharedCardSelectModal — 카드 그리드 상태

| 상태 | 딜러 | 비딜러 |
|------|------|--------|
| 카드 표시 | CardFace (앞면) | CardBack (뒷면) |
| 클릭 가능 | 예 | 아니오 (cursor-not-allowed) |
| hover 피드백 | hover:ring-2 hover:ring-primary | 없음 |
| 선택 후 | ring-2 ring-primary | - |

---

## Registry Safety

| Registry | 사용 블록 | Safety Gate |
|----------|-----------|-------------|
| shadcn 공식 | button, dialog, badge (기존 설치된 것 재사용) | 필요 없음 |

Phase 7에서 신규 third-party registry 추가 없음. 기존 shadcn 공식 컴포넌트만 사용.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## 소스 추적

| 항목 | 출처 |
|------|------|
| Design system (shadcn, tailwind, lucide) | RESEARCH.md §Standard Stack + components.json |
| 색상 토큰 | index.css @theme inline (Phase 6 확립) |
| 카드 크기 (w-16 h-24) | CardFace.tsx 기존 구현 |
| 20장 그리드 패턴 | DealerSelectModal.tsx 기존 구현 |
| card-select phase 정의 | CONTEXT.md D-06, D-09, D-10, D-11 |
| SharedCard 표시 결정 | CONTEXT.md D-13, D-14 |
| 카드 선택 확인 버튼 조건 | CONTEXT.md D-09 (정확히 2장) |
| ModeSelectModal 확장 | CONTEXT.md D-12 재사용 패턴 + code_context |
| 공유카드 중앙 표시 크기/위치 | Claude's Discretion (CONTEXT.md) — 1.25배 크기 규칙 |
| 선택 하이라이트 스타일 | Claude's Discretion (CONTEXT.md) — ring-2 ring-primary + scale-105 |
| 3번째 카드 애니메이션 | Claude's Discretion (CONTEXT.md) — 애니메이션 없음 (와이어프레임 단계, Phase 6 UI-08 기준) |
| Display weight 수정 | ui-checker Dimension 4 BLOCK — 700→600으로 통일 (2026-03-30) |
