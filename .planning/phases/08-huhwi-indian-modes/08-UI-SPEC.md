---
phase: 8
slug: huhwi-indian-modes
status: approved
reviewed_at: 2026-03-30
shadcn_initialized: true
preset: style=default, baseColor=slate, cssVariables=true
created: 2026-03-30
---

# Phase 8 — UI 디자인 컨트랙트

> 골라골라 + 인디언섯다 모드의 시각적 상호작용 계약서. gsd-ui-researcher가 생성하며 gsd-ui-checker가 검증한다.

---

## 디자인 시스템

| 속성 | 값 |
|------|----|
| Tool | shadcn/ui (components.json 확인됨) |
| Preset | style=default, baseColor=slate, cssVariables=true |
| Component library | Radix UI (shadcn 내장) |
| Icon library | lucide-react (components.json에 명시) |
| Font | 시스템 폰트 (sans-serif 기본 — html에 Google Fonts 없음) |

출처: `packages/client/components.json`, `packages/client/index.html`

---

## 스페이싱 스케일

4의 배수 원칙. 기존 컴포넌트(`gap-2`, `p-4`, `space-y-2` 등)에서 확인된 실제 사용 값과 일치한다.

| 토큰 | 값 | 용도 |
|------|----|------|
| xs | 4px (gap-1) | 아이콘 간격, 인라인 패딩, 카드 Badge 내부 |
| sm | 8px (gap-2) | 카드 그리드 gap, 버튼 간격 |
| md | 16px (p-4) | 패널 내부 패딩, 기본 섹션 간격 |
| lg | 24px (gap-6) | 모달 섹션 간격 |
| xl | 32px | 레이아웃 구분선 |
| 2xl | 48px | 주요 섹션 경계 |
| 3xl | 64px | 페이지 레벨 여백 |

예외: 카드 컴포넌트 고정 크기 `w-16 h-24` (64px × 96px) — 기존 CardFace/CardBack 그대로 유지. 터치 타깃 최소 44px (버튼 요소에 shadcn size="sm" 이상 적용).

출처: `CardFace.tsx`, `DealerSelectModal.tsx`, `HandPanel.tsx` 기존 패턴

---

## 타이포그래피

| 역할 | 크기 | 굵기 | 줄 간격 |
|------|------|------|---------|
| Body | 14px (text-sm) | 400 (regular) | 1.5 |
| Label | 14px (text-sm) | 600 (semibold) | 1.4 |
| Heading | 16px (text-base, DialogTitle 기준) | 600 (semibold) | 1.2 |
| Display | 18px (text-lg) | 600 (semibold) | 1.2 |

- 기존 컴포넌트(`DialogTitle`, `p.text-sm.font-semibold`, `span.text-lg.font-semibold`)와 일치
- 카드 숫자 표시: 18px / 600 (기존 CardFace `text-lg font-semibold`)
- 뮤트 텍스트(안내 문구): 14px / 400 / `text-muted-foreground` (hsl(70 10% 55%))

출처: `CardFace.tsx`, `HandPanel.tsx`, `DealerSelectModal.tsx`

---

## 컬러

기존 `index.css` @theme inline 값을 그대로 사용한다. Phase 8은 새 토큰을 추가하지 않는다.

| 역할 | 값 | 용도 |
|------|-----|------|
| Dominant 60% | hsl(70 15% 8%) | 배경(background), 게임 테이블 표면 |
| Secondary 30% | hsl(72 12% 13%) — card / hsl(72 12% 18%) — secondary | 카드 패널, 모달 배경, 사이드바, 플레이어 좌석 |
| Accent 10% | hsl(75 55% 42%) — primary | 아래 목록에 한정 |
| Destructive | hsl(0 72% 60%) | 다이(Fold) 버튼, 파괴적 액션에만 사용 |

**Accent(primary) 예약 요소 — 이 목록 외 사용 금지:**
1. 골라골라 선택 그리드에서 내가 선택한 카드의 `ring-2 ring-primary` 하이라이트
2. 카드 선택 hover 상태 `hover:ring-2 hover:ring-primary`
3. 선택 완료 버튼(variant="default") — shadcn Button primary
4. HandPanel 카드 선택 active ring (`ring-primary`)
5. `--color-ring` (포커스 링)

**인디언 모드 마스킹 카드 전용 표현:**
- 마스킹된 카드(`cards[0]` null 처리): 기존 `CardBack` 컴포넌트 그대로 사용 (bg-muted, `?` 텍스트)
- 별도 색상 토큰 추가 없음

**골라골라 선택 불가 카드 dim 처리:**
- `opacity-40` + `cursor-not-allowed` (DealerSelectModal 기존 패턴 그대로)

출처: `index.css`, `DealerSelectModal.tsx`, `CardBack.tsx`

---

## 컴포넌트 인벤토리

Phase 8에서 신규 생성 또는 수정되는 컴포넌트 목록.

### 신규 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|---------|------|------|
| `GollaSelectModal` | `modals/GollaSelectModal.tsx` | 골라골라 선택 전용 모달. `DealerSelectModal` 그리드 패턴 재활용, 20장 오픈 CardFace 표시, 선택된 카드 dim |

### 수정 컴포넌트

| 컴포넌트 | 변경 내용 |
|---------|---------|
| `ModeSelectModal` | `'골라골라'` 버튼, `'인디언섯다'` 버튼 2개 추가 |
| `HandPanel` | 인디언 모드 `cards[0] === null` 처리 — null 카드는 `CardBack`으로 렌더링. `visibleCardCount` prop 그대로 활용 |

### 재사용 (변경 없음)

| 컴포넌트 | 재사용 근거 |
|---------|-----------|
| `CardBack` | 인디언 마스킹 카드 표현에 그대로 사용 |
| `CardFace` | 골라골라 오픈 그리드 카드 표시 |
| `BettingPanel` | 베팅 UI 변경 없음 (오리지날과 동일) |
| `ResultScreen` | result phase UI 변경 없음 |

---

## 레이아웃 패턴

### 골라골라 선택 모달 (`GollaSelectModal`)

- **레이아웃:** 모달 오버레이 (`Dialog` shadcn). 풀스크린 패널이 아닌 오버레이 방식. (DealerSelectModal과 동일 구조)
- **그리드:** `grid grid-cols-5 gap-2` — 20장을 5열 4행으로 표시
- **카드 상태:**
  - 미선택(선택 가능): `CardFace` 표시, `hover:ring-2 hover:ring-primary cursor-pointer`
  - 이미 타인이 선택한 카드: `CardFace` + `opacity-40 cursor-not-allowed` (dim)
  - 내가 선택한 카드(1장): `CardFace` + `ring-2 ring-primary opacity-100` (확정 하이라이트)
  - 내가 선택한 카드(2장 완료): 자동 확정 — 별도 확인 버튼 없음
- **안내 텍스트:**
  - 선택 중: `"2장을 선택하세요 ({N}/2)"` (text-sm text-muted-foreground)
  - 선택 완료: `"선택 완료! 다른 플레이어를 기다리는 중…"` (text-sm text-muted-foreground)
  - 비참여자(대기): 모달이 표시되지 않음(phase 조건으로 관리)

### 인디언 모드 카드 가시성

- **betting-1 phase (본인 첫 카드 마스킹):** HandPanel에서 `cards[0]`이 null이면 `CardBack` 렌더링. 두 번째 카드 아직 없으므로 1장만 표시.
- **betting-2 phase (두 번째 카드 본인만 공개):** HandPanel에서 `cards[0]` CardBack + `cards[1]` CardFace. `visibleCardCount` 또는 조건부 렌더링으로 처리.
- **타인 seats(PlayerSeat)에서:** 본인 첫 카드 = CardFace(공개), 두 번째 카드 = CardBack(마스킹). 서버에서 per-player emit으로 마스킹된 gameState 수신하므로 클라이언트 조건 불필요.

---

## 카피라이팅 계약

| 요소 | 복사 |
|------|------|
| 모드 선택 CTA — 골라골라 | `"골라골라"` |
| 모드 선택 CTA — 인디언섯다 | `"인디언섯다"` |
| 골라골라 모달 타이틀 | `"골라골라 — 카드를 2장 선택하세요"` |
| 골라골라 선택 진행 안내 | `"2장을 선택하세요 ({N}/2)"` |
| 골라골라 선택 완료 안내 | `"선택 완료! 다른 플레이어를 기다리는 중…"` |
| 빈 상태 (카드 없음) | `"카드가 아직 없어요"` (기존 HandPanel 문구 그대로) |
| 에러 — 골라골라 카드 충돌 | `"이미 선택된 카드입니다. 다른 카드를 선택하세요."` (game-error 수신 시 sonner toast) |
| 에러 — 일반 서버 에러 | `"오류가 발생했습니다. 다시 시도해 주세요."` |
| 인디언 모드 첫 카드 마스킹 안내 | (별도 문구 없음 — CardBack의 `?` 텍스트로 충분) |
| 파괴적 액션: 다이(Fold) | 기존 BettingPanel `"다이"` 버튼, 확인 다이얼로그 없음 (기존 패턴 유지) |

**에러 표시 방식:** `sonner` 토스트 (기존 `components/ui/sonner.tsx` 활용). 에러 발생 위치: 골라골라 카드 충돌(`game-error` 이벤트 수신 시).

---

## 상호작용 계약

### 골라골라 카드 선택 흐름

1. `gollagolla-select` phase 진입 → `GollaSelectModal` 오픈
2. 플레이어가 카드 클릭 → 1장 선택: `ring-primary` 하이라이트
3. 플레이어가 두 번째 카드 클릭 → 2장 완료: 즉시 `select-gollagolla-cards` emit (자동 확정, 버튼 없음)
4. 서버 `game-error` 응답(충돌) → 선택 1장 해제 + sonner toast 에러 표시
5. 모든 플레이어 2장 선택 완료 → 서버가 `betting` phase로 전환 → 모달 자동 닫힘

### 인디언 모드 카드 표시 상태 전환

| Phase | 내 cards[0] | 내 cards[1] | 타인 cards[0] | 타인 cards[1] |
|-------|------------|------------|--------------|--------------|
| dealing | CardBack (서버 null) | 없음 | CardFace (서버 공개) | 없음 |
| betting-1 | CardBack | 없음 | CardFace | 없음 |
| dealing-extra | CardBack | CardFace | CardFace | CardBack |
| betting-2 | CardBack | CardFace | CardFace | CardBack |
| result | CardFace | CardFace | CardFace | CardFace |

---

## 레지스트리 안전 게이트

| 레지스트리 | 사용 블록 | 안전 게이트 |
|-----------|---------|-----------|
| shadcn official | Button, Dialog, Badge, Input, Separator, Sonner (기존 설치됨) | 불필요 |
| 서드파티 | 없음 | 해당 없음 |

Phase 8은 신규 shadcn 컴포넌트 설치 없음. 기존 설치된 컴포넌트만 사용.

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

*Phase: 08-huhwi-indian-modes*
*UI-SPEC 작성: 2026-03-30*
*출처: 08-CONTEXT.md, 08-RESEARCH.md, 기존 컴포넌트 코드 스캔*
