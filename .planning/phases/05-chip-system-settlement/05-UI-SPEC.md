---
phase: 5
slug: chip-system-settlement
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-30
---

# Phase 5 — UI 디자인 계약서: 칩 시스템 + 승패 정산

> Phase 5의 시각적·인터랙션 계약. gsd-ui-researcher가 생성, gsd-ui-checker가 검증.

---

## 범위 안내

Phase 5는 **서버 중심 페이즈**다. 칩 정산 로직, 재충전 플로우, 베팅 입력 데이터 계약이 주요 구현 대상이다.
완전한 클라이언트 시각 디자인(카드 레이아웃, 게임 테이블 원형 배치 등)은 **Phase 6**에서 구현한다.

이 계약서는 Phase 5에서 서버가 클라이언트에 내려보내는 **데이터 구조**와
Phase 6 렌더링을 위한 **인터랙션 상태 계약**을 정의한다.

출처 표기:
- `[CONTEXT]` = 05-CONTEXT.md 결정 사항
- `[REQ]` = REQUIREMENTS.md 요구사항
- `[DEFAULT]` = 합리적 기본값 적용

---

## Design System

| 속성 | 값 |
|------|---|
| Tool | none (Phase 6에서 shadcn 초기화 예정) |
| Preset | 해당 없음 |
| Component library | 없음 (Phase 5는 서버 로직 중심) |
| Icon library | 미정 (Phase 6에서 결정) |
| Font | 시스템 기본 폰트 (`system-ui, sans-serif`) `[DEFAULT]` |

> **shadcn 게이트:** `components.json` 미존재 확인. Phase 5는 서버 사이드 페이즈이므로 초기화를 Phase 6으로 연기. Phase 6 UI-SPEC 작성 시 shadcn 초기화 필수.

---

## Spacing Scale

Phase 5에서 직접 렌더링하는 UI 컴포넌트는 최소화되나, 재충전 투표 팝업과 칩 입력 버튼에 대해 아래 8pt 스케일을 선언한다.

| 토큰 | 값 | 용도 |
|------|---|------|
| xs | 4px | 칩 아이콘 내부 간격, 인라인 패딩 |
| sm | 8px | 버튼 내 요소 간격, 컴팩트 배치 |
| md | 16px | 칩 단위 버튼 패딩, 팝업 내부 여백 |
| lg | 24px | 팝업 섹션 패딩 |
| xl | 32px | 레이아웃 갭 |
| 2xl | 48px | 주요 섹션 구분 |
| 3xl | 64px | 페이지 수준 여백 |

예외: 칩 단위 버튼(500/1000/5000/10000) 터치 타겟 최소 **44px × 44px** 보장 (모바일 접근성 기준) `[DEFAULT]`

---

## Typography

Phase 5 UI 요소(재충전 팝업, 칩 잔액 수치, 칩 단위 버튼 레이블)에 적용한다.
Phase 6에서 전체 타이포그래피 토큰이 확장될 예정이므로 여기서는 최소 4종만 선언한다.

| 역할 | 크기 | 굵기 | 줄 높이 | 적용 대상 |
|------|------|------|---------|-----------|
| Body | 16px | 400 (regular) | 1.5 | 팝업 본문, 투표 설명 텍스트 |
| Label | 14px | 400 (regular) | 1.4 | 칩 단위 버튼 레이블 (500원 / 1,000원 등) |
| Heading | 20px | 600 (semibold) | 1.2 | 팝업 제목, 칩 잔액 수치 |
| Display | 28px | 600 (semibold) | 1.1 | 현재 팟(판돈) 금액 강조 표시 |

출처: `[DEFAULT]` (Phase 6에서 확정, 현재 표준값 적용)

---

## Color

Phase 5는 게임 테이블 배경을 직접 렌더링하지 않는다. 아래 색상은 재충전 팝업과 칩 단위 버튼의 상태 표현을 위한 최소 계약이다. Phase 6에서 전체 팔레트가 확정된다.

| 역할 | 값 | 적용 대상 |
|------|---|----------|
| Dominant (60%) | `#1a1a2e` (딥 네이비) | 게임 테이블 배경, 팝업 배경 `[DEFAULT]` |
| Secondary (30%) | `#16213e` (다크 블루) | 팝업 카드, 칩 입력 영역, 플레이어 패널 `[DEFAULT]` |
| Accent (10%) | `#e8b84b` (골드) | 아래 Accent 전용 목록 참조 `[DEFAULT]` |
| Destructive | `#dc2626` (레드-600) | 다이 확인, 재충전 거부 버튼 전용 `[DEFAULT]` |
| Success | `#16a34a` (그린-600) | 정산 완료 시 승자 칩 증가 표시, 재충전 동의 버튼 `[DEFAULT]` |

**Accent 전용 요소 (이 목록 외에는 accent 사용 금지):**
1. 현재 팟(판돈) 금액 수치
2. 베팅 입력 영역의 선택된 칩 합계 수치
3. 승자 플레이어 이름/닉네임 강조
4. 칩 잔액 증가 시 변동 수치 (정산 직후 짧은 강조)

---

## 데이터 구조 계약 (서버 → 클라이언트)

> Phase 5는 서버가 내려보내는 데이터 구조가 UI 렌더링의 핵심 계약이다. `[CONTEXT D-12]`

### chipBreakdown 구조

서버는 `game-state` 브로드캐스트에 `chips` 숫자값과 함께 `chipBreakdown` 객체를 전달한다.

```typescript
// 각 단위별 칩 개수 (Phase 5에서 계산, Phase 6에서 아이콘으로 렌더링)
interface ChipBreakdown {
  ten_thousand: number;  // 10,000원 칩 개수
  five_thousand: number; // 5,000원 칩 개수
  one_thousand: number;  // 1,000원 칩 개수
  five_hundred: number;  // 500원 칩 개수
}
```

계산 규칙: 큰 단위부터 내림차순 그리디 (`[CONTEXT]` Claude's Discretion 결정 — 객체 방식 채택)

### 유효 스택 상한 계산 기준 (`[CONTEXT D-11]`)

- 다이한 플레이어는 유효 스택 계산에서 **제외** (생존자 기준만 사용)
- 내 잔액 ≥ 생존자 최대 잔액: 생존자 중 두 번째로 잔액이 많은 플레이어 잔액이 천장
- 내 잔액 < 생존자 최대 잔액: 내 잔액 전체가 천장 (all-in)
- 서버에서 `effectiveMaxBet` 필드로 계산하여 내려보냄

---

## 컴포넌트 인벤토리

Phase 5에서 서버 로직을 지원하기 위해 최소한으로 정의되는 UI 상태 계약이다. 실제 렌더링 컴포넌트는 Phase 6에서 구현한다.

### 1. 칩 단위 베팅 입력 버튼 (`[CONTEXT D-09]`)

| 상태 | 설명 |
|------|------|
| `default` | 클릭 가능, 골드 테두리, 칩 아이콘 + 금액 레이블 |
| `disabled` | 유효 스택 상한 초과 단위 — 불투명도 0.4, 클릭 불가 |
| `selected` | 클릭 후 베팅 영역에 쌓인 상태 표시 (누적 합계 업데이트) |

버튼 최소 터치 타겟: **44px × 44px**
레이블 형식: `500원` / `1,000원` / `5,000원` / `10,000원` (한국 원화 단위 표기)

### 2. 재충전 투표 팝업 (`[CONTEXT D-05, D-06, D-07, D-08]`)

| 상태 | 설명 |
|------|------|
| `vote-pending` | "{닉네임}이 칩 재충전을 요청했습니다. ({금액}원)" + 동의/거부 버튼 표시 |
| `vote-approved` | "모든 플레이어가 동의했습니다. {금액}원 충전 완료." |
| `vote-rejected` | "{닉네임}이 거부하여 재충전이 취소되었습니다." |
| `vote-self` | 요청자 본인 화면: "재충전 투표 진행 중... ({N}/{M}명 동의)" — 버튼 없음 |

팝업 모달: 배경 딤 처리 (rgba(0,0,0,0.6)), 게임 진행 중에도 오버레이로 표시.
**재충전 투표 중 게임 진행 가능** — 투표 팝업은 게임을 블로킹하지 않음 (`[CONTEXT]` Claude's Discretion 결정)

### 3. 칩 잔액 표시 (`[CONTEXT D-12]`)

표시 형식: `₩100,000` (숫자) + 칩 아이콘 조합
변동 직후: 증가 시 골드(`#e8b84b`), 감소 시 레드(`#dc2626`)로 0.5초 강조 후 기본색 복귀

---

## Copywriting Contract

| 요소 | 문구 |
|------|------|
| Primary CTA (베팅) | "베팅하기" `[DEFAULT]` |
| Primary CTA (재충전 요청) | "칩 재충전 요청" `[CONTEXT D-08]` |
| 재충전 동의 버튼 | "동의" `[CONTEXT D-05]` |
| 재충전 거부 버튼 | "거부" `[CONTEXT D-06]` |
| 재충전 팝업 제목 | "{닉네임}이 칩 재충전을 요청합니다" `[CONTEXT D-05]` |
| 재충전 금액 입력 안내 | "충전할 금액을 만원 단위로 입력하세요" `[CONTEXT D-07]` |
| 투표 진행 중 (요청자) | "다른 플레이어의 동의를 기다리는 중..." `[DEFAULT]` |
| 칩 잔액 0 상태 | "칩이 없습니다. 재충전을 요청하거나 게임에서 빠지세요." `[REQ CHIP-03]` |
| 정산 완료 메시지 | "{닉네임} 승리! +{금액}원" `[REQ CHIP-02]` |
| 정산 패배 메시지 | "-{금액}원" `[REQ CHIP-02]` |
| 유효 스택 상한 경고 | "최대 베팅 가능 금액: {금액}원" `[CONTEXT D-11]` |
| 오류 상태 | "베팅 처리에 실패했습니다. 다시 시도해 주세요." `[DEFAULT]` |

**파괴적 행동 확인:**
- 재충전 거부: 별도 확인 없음 — 단일 "거부" 버튼 클릭으로 즉시 처리 (`[CONTEXT D-06]` — 거부는 되돌릴 수 없으나 낮은 위험)
- 칩 소진(잔액 0): 경고 문구 표시, 게임 강제 퇴장 없음 (재충전 경로 안내)

---

## Registry Safety

| 레지스트리 | 사용 블록 | Safety Gate |
|-----------|-----------|-------------|
| shadcn 공식 | 미사용 (Phase 5) | 해당 없음 |
| 서드파티 | 없음 | 해당 없음 |

> Phase 6에서 shadcn 초기화 시 이 섹션이 업데이트된다.

---

## Phase 6 인수인계 메모

Phase 5 완료 후 Phase 6 UI-SPEC 작성자에게 전달할 사항:

1. **shadcn 초기화 필수** — `components.json` 미존재. ui.shadcn.com/create에서 프리셋 구성 후 `npx shadcn init` 실행.
2. **칩 색상 컨벤션** 확정 필요 — 500원(흰색), 1,000원(파랑), 5,000원(빨강), 10,000원(검정) 물리 포커칩 색상 체계 또는 커스텀 색상 결정.
3. **게임 테이블 배경 테마** — 초록 펠트 or 다크 네이비 테마 중 결정. 현재 `#1a1a2e` 기본값으로 지정.
4. **chipBreakdown 데이터** — Phase 5 서버에서 제공. Phase 6에서 칩 아이콘 렌더링에 바로 사용 가능.
5. **effectiveMaxBet 필드** — Phase 5 서버에서 제공. Phase 6에서 버튼 비활성화 로직에 사용.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
