---
phase: 6
slug: client-ui-wireframe
status: draft
shadcn_initialized: false
preset: pending-init
created: 2026-03-30
---

# Phase 6 — UI Design Contract

> 클라이언트 UI 와이어프레임 단계의 시각·상호작용 계약서.
> gsd-ui-researcher가 생성하고, gsd-ui-checker가 검증한다.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn/ui | CONTEXT.md D-01 |
| Preset | 초기화 시 CLI(`pnpm dlx shadcn@latest init`) 실행 — 이후 components.json 생성 | RESEARCH.md |
| Component library | Radix UI (shadcn/ui가 래핑) | RESEARCH.md |
| Icon library | lucide-react (shadcn/ui 기본 번들) | RESEARCH.md default |
| Font | system-ui (sans-serif fallback) — 커스텀 웹폰트 없음 | 기본값 |
| CSS engine | Tailwind CSS v4 (`@tailwindcss/vite` 플러그인 방식, PostCSS 불필요) | RESEARCH.md |

> **shadcn Gate 결과:** `components.json` 미존재 확인. CONTEXT.md D-01에서 shadcn/ui 채택이 확정 결정임. 실행자는 `packages/client` 디렉토리에서 `pnpm dlx shadcn@latest init` 실행 후 진행.

---

## Spacing Scale

4의 배수 기반 8-포인트 스케일:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | 아이콘 간격, 배지 내부 패딩, 카드 텍스트 간 미세 간격 |
| sm | 8px | 버튼 내부 좌우 패딩, 칩 단위 버튼 간격 |
| md | 16px | 패널 내부 기본 패딩, 카드 요소 간 기본 간격 |
| lg | 24px | 패널 간 간격, 모달 내부 섹션 패딩 |
| xl | 32px | 레이아웃 주요 영역 간격 |
| 2xl | 48px | 게임 테이블 반지름 오프셋 기준값 (데스크톱 소형) |
| 3xl | 64px | 페이지 레벨 여백 |

**예외:**
- 터치 타깃 최소 크기: 44px (콜/레이즈/다이 버튼 높이 min-h-11 = 44px)
- 원형 배치 translateY 반지름: 데스크톱 200px, 태블릿 160px, 모바일 스택 전환(md: 브레이크포인트)
- 원형 컨테이너 크기: 데스크톱 480px × 480px, 태블릿 400px × 400px

---

## Typography

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Body | 14px | 400 (regular) | 1.5 | 일반 정보 텍스트, 칩 잔액, 팟 금액 레이블 |
| Label | 12px | 600 (semibold) | 1.4 | 배지, 족보명 텍스트, 플레이어 닉네임 |
| Heading | 20px | 600 (semibold) | 1.2 | 모달 제목, 결과 화면 승자 표시 |
| Display | 28px | 600 (semibold) | 1.1 | 판돈(팟) 중앙 금액 표시 |

**선언 규칙:**
- 폰트 크기 4종: 12, 14, 20, 28px
- 폰트 웨이트 2종: 400 (regular), 600 (semibold)
- 숫자 표시(칩 금액, 팟)는 `tabular-nums` 적용 — 금액 자릿수 변동 시 레이아웃 떨림 방지

---

## Color

shadcn/ui 기본 토큰을 기반으로 다크 테마(게임 테이블 분위기) 적용.

| Role | CSS Variable | Light 값 | Dark 값 | Usage |
|------|--------------|----------|---------|-------|
| Dominant (60%) | `--background` | `hsl(0 0% 100%)` | `hsl(222 47% 11%)` | 전체 배경, 메인 화면 배경 |
| Secondary (30%) | `--card` | `hsl(0 0% 98%)` | `hsl(217 33% 17%)` | 게임 테이블 배경, 모달 배경, 플레이어 카드 영역, 정보패널 배경 |
| Accent (10%) | `--primary` | `hsl(222 84% 60%)` | `hsl(217 91% 60%)` | 아래 열거된 요소에만 사용 |
| Destructive | `--destructive` | `hsl(0 72% 51%)` | `hsl(0 91% 71%)` | "다이" 버튼 전용 |

**Accent(primary) 예약 사용처 — 이 외 요소에 사용 금지:**
1. "콜" 버튼 (primary variant)
2. "방 만들기" CTA 버튼 (메인 화면)
3. 현재 턴 플레이어 자리 하이라이트 링 (ring-2 ring-primary)
4. "게임 시작" 버튼 (대기실)
5. "학교 간다" 버튼 (등교 모달)

**Muted 보조색 (accent 아닌 비활성 상태):**
- `--muted-foreground`: 뒷면 카드 텍스트, 비활성 플레이어 자리, 채팅 placeholder 영역
- "레이즈" 버튼: `secondary` variant (primary 사용 금지)
- "체크" 버튼: `ghost` variant

**테마:** 기본값은 **다크 테마**. `<html class="dark">` 고정. 라이트/다크 토글 없음 (Phase 6 범위 밖).

---

## Component Inventory

Phase 6에서 사용할 shadcn/ui 컴포넌트 목록:

| 컴포넌트 | 사용처 | 설치 명령 |
|----------|--------|-----------|
| `Button` | 모든 액션 버튼 (콜/레이즈/다이/체크, 방 만들기, 게임 시작 등) | `npx shadcn add button` |
| `Dialog` | 5개 특수 액션 모달 (밤일낮장/등교/셔플/기리/재충전투표) | `npx shadcn add dialog` |
| `Input` | 닉네임 입력, 레이즈 금액 입력 | `npx shadcn add input` |
| `Badge` | 족보명 표시, 플레이어 상태(다이/콜/레이즈) 표시 | `npx shadcn add badge` |
| `Card` | 플레이어 자리 컨테이너, 결과 화면 카드 공개 | `npx shadcn add card` |
| `Separator` | 패널 구분선 | `npx shadcn add separator` |
| `Toast` (Sonner) | 게임 에러 메시지, 재충전 투표 알림 | `npx shadcn add sonner` |

**게임 도메인 커스텀 컴포넌트 (shadcn 미사용):**
- `CardFace` — 앞면 카드: 숫자(rank) + 속성(attribute) 한국어 텍스트. `bg-white text-gray-900` 고정.
- `CardBack` — 뒷면 카드: `bg-muted` 단색 블록, 패턴 없음.
- `PlayerSeat` — CSS custom properties로 원형 배치, shadcn Card 기반 래퍼.
- `ChipDisplay` — 칩 단위(500/1000/5000/10000)별 색상 배지.

---

## Screen Inventory

Phase 6에서 구현할 화면과 상태:

### 화면 1: 메인 화면 (`/`)

| 상태 | 표시 내용 |
|------|-----------|
| 기본 | "방 만들기" (primary), "링크로 참여" (secondary) 버튼 2개 |
| 링크 참여 확장 | roomId 입력 필드 + 닉네임 입력 필드 + "참여하기" 버튼 |

### 화면 2: 대기실 (`/room/:roomId` — phase: waiting)

| 상태 | 표시 내용 |
|------|-----------|
| 방장 | 방 URL 표시 + 클립보드 복사 버튼, 참가자 목록, "게임 시작" 버튼 |
| 일반 참여자 | 닉네임 입력(첫 접속), 대기 중 참가자 목록, 방장 대기 안내 |
| 빈 상태 | 방 코드 입력 후 방이 없을 때: "방을 찾을 수 없어요. 링크를 다시 확인해 주세요." |

### 화면 3: 게임 테이블 (`/room/:roomId` — phase: betting 등)

5개 패널 구성 (데스크톱 레이아웃):
```
┌──────────────────────────────────┐
│         게임테이블패널              │  ← 원형 배치, 상단 70% 높이
│  [PlayerSeat × N, 팟 중앙 표시]    │
├────────────┬─────────────────────┤
│  손패패널   │      정보패널          │  ← 하단 30%, 좌우 분할
│  (내 카드)  │  (잔액 + 팟 금액)     │
├────────────┴─────────────────────┤
│            베팅패널                │  ← 콜/레이즈/다이/체크 버튼 (내 턴일 때만 활성)
├──────────────────────────────────┤
│            채팅패널 (placeholder)  │  ← 고정 높이 64px, 빈 영역 예약
└──────────────────────────────────┘
```

모바일(< md 브레이크포인트 = 768px) 세로 스택 순서:
1. 정보패널 (팟 + 잔액 한 줄 요약)
2. 게임테이블패널 (원형 → 격자 스택 전환)
3. 손패패널
4. 베팅패널 (내 턴일 때 고정 하단 바)
5. 채팅패널 placeholder (숨김 처리 가능)

### 화면 4: 결과 화면 (`/room/:roomId` — phase: result)

| 요소 | 표시 내용 |
|------|-----------|
| 카드 공개 | 모든 생존 플레이어 CardFace 앞면 전환 |
| 승자 표시 | Heading 크기(20px semibold) `"{닉네임} 승리!" |
| 칩 변동 | 각 플레이어 `+N,000원` / `-N,000원` Badge |
| 족보 표시 | 각 플레이어 손 옆에 족보명 Badge |
| 액션 | "다음 판" (secondary), "방 나가기" (ghost) |

---

## Copywriting Contract

| Element | Copy | 비고 |
|---------|------|------|
| 방 생성 Primary CTA | **"방 만들기"** | CONTEXT.md D-07 |
| 링크 참여 CTA | **"링크로 참여"** | CONTEXT.md D-07 |
| 게임 시작 CTA | **"게임 시작"** | CONTEXT.md D-07 |
| 베팅 콜 | **"콜"** | 게임 용어 그대로 |
| 베팅 레이즈 | **"레이즈"** | 게임 용어 그대로 |
| 베팅 다이 | **"다이"** | 게임 용어 그대로 |
| 베팅 체크 | **"체크"** | 게임 용어 그대로 |
| 등교 앤티 납부 | **"학교 간다"** | CONTEXT.md specifics |
| 등교 패스 | **"잠시 쉬기"** | CONTEXT.md specifics |
| URL 복사 버튼 | **"링크 복사"** | 클립보드 복사 후 "복사됨!" 으로 1.5초간 전환 |
| 다음 판 | **"다음 판"** | 결과 화면 |
| 방 나가기 | **"방 나가기"** | 결과 화면 — ghost variant |
| 승자 발표 | **"{닉네임} 승리!"** | 결과 화면 Heading |
| 퉁 선언 버튼 | **"퉁 선언"** | 기리 모달 CONTEXT.md D-12 |
| 재충전 동의 | **"동의"** | 재충전 투표 모달 |
| 재충전 거부 | **"거부"** | 재충전 투표 모달 — destructive variant |

**빈 상태 (Empty State):**

| 화면 | Heading | Body |
|------|---------|------|
| 방을 찾을 수 없음 | "방을 찾을 수 없어요" | "링크를 다시 확인해 주세요. 방이 이미 종료되었을 수 있어요." |
| 대기실 — 아직 아무도 없음 | "아직 아무도 없어요" | "친구에게 링크를 공유해 보세요." |
| 내 턴 아님 | *(버튼 비활성, 별도 빈 상태 없음)* | 베팅패널 버튼 `disabled`, 상태 텍스트: "{닉네임}의 차례예요" |

**에러 상태 (Error State):**

| 에러 | Copy | 처리 |
|------|------|------|
| `game-error` 수신 | Toast: "{error.message}" | Sonner toast, 3초 auto-dismiss |
| 방 입장 실패 (6인 초과) | Toast: "방이 꽉 찼어요. 최대 6명까지 입장할 수 있어요." | Sonner toast |
| 소켓 연결 끊김 | Toast: "서버 연결이 끊겼어요. 페이지를 새로 고침해 주세요." | Sonner toast, persist |
| 닉네임 중복 | Input 아래: "이미 사용 중인 닉네임이에요." | Input error state |

**파괴적 액션 (Destructive Actions):**

| 액션 | 확인 방식 |
|------|-----------|
| "다이" 버튼 | 즉시 실행 (패를 포기하는 순간 확인은 게임 흐름 방해). destructive variant Button. |
| "방 나가기" | Dialog 확인: "방에서 나가시겠어요? 게임 중이라면 다이 처리됩니다." → "나가기" (destructive) / "취소" (ghost) |
| "재충전 거부" | 즉시 실행. destructive variant Badge/Button. |

---

## Modal Interaction Contracts

5개 특수 모달의 트리거·내용·완료 계약:

### 1. 밤일낮장 모달 (DealerSelectModal)

| 항목 | 내용 |
|------|------|
| 트리거 | `GameState.phase === 'dealer-selection'` 진입 시 자동 오픈 |
| 내용 | 20장 뒤집힌 카드 그리드 (4×5). 각 카드는 CardBack 컴포넌트. 클릭 시 1장만 선택 가능. |
| 완료 | 카드 1장 선택 → `game-action { type: 'select-dealer-card', cardIndex: N }` emit → 모달 닫힘 |
| 닫기 방지 | 외부 클릭/ESC로 닫기 불가 (`DialogContent`의 `onInteractOutside` 방지) |

### 2. 등교 모달 (AttendSchoolModal)

| 항목 | 내용 |
|------|------|
| 트리거 | `GameState.phase === 'attend-school'` + 내 플레이어 차례 시 자동 오픈 |
| 내용 | "이번 판에 참여하시겠어요?" Dialog. 버튼 2개: "학교 간다" (primary) / "잠시 쉬기" (secondary) |
| 완료 | "학교 간다" → `game-action { type: 'attend' }` emit. "잠시 쉬기" → `game-action { type: 'skip' }` emit |
| 닫기 방지 | 외부 클릭/ESC 불가 |

### 3. 셔플 모달 (ShuffleModal)

| 항목 | 내용 |
|------|------|
| 트리거 | `GameState.phase === 'shuffle'` + 내가 선(dealer) 플레이어 시 자동 오픈 |
| 내용 | "패를 섞을까요?" Dialog. 버튼 1개: "섞기" (primary) |
| 완료 | "섞기" → `game-action { type: 'shuffle' }` emit |
| 닫기 방지 | 외부 클릭/ESC 불가 |

### 4. 기리 모달 (CutModal)

| 항목 | 내용 |
|------|------|
| 트리거 | `GameState.phase === 'cut'` + 내 플레이어 차례 시 자동 오픈 |
| 내용 | 20장 덱을 1~5개 더미로 시각적으로 나누는 UI. 더미 수 슬라이더(1~5) + 각 더미 카드 수 표시. "퉁 선언" 버튼 (ghost, 상단 우측). |
| 완료 | 더미 구성 확인 → `game-action { type: 'cut', cutPoints: [...] }` emit. 또는 "퉁 선언" → `game-action { type: 'declare-ttong' }` emit |
| 닫기 방지 | 외부 클릭/ESC 불가 |

### 5. 재충전 투표 모달 (RechargeVoteModal)

| 항목 | 내용 |
|------|------|
| 트리거 | `recharge-request` 이벤트 수신 시 전체 플레이어에게 오픈 |
| 내용 | "{닉네임}님이 칩 재충전을 요청했어요. ({금액}원)" Dialog. 버튼 2개: "동의" (primary) / "거부" (destructive) |
| 완료 | 각 플레이어 투표 → `recharge-vote { approve: boolean }` emit |
| 자동 닫힘 | `recharge-result` 이벤트 수신 시 자동 닫힘 + Toast 결과 표시 |

---

## Card Display Contract

UI-08 요구사항 (와이어프레임 단계 텍스트 표시):

| 카드 속성 | 한국어 텍스트 | 표시 형식 |
|----------|------------|----------|
| rank 1~10 | 1→"일", 2→"이", ... 10→"장" | CardFace 상단 |
| attribute: 'gwang' | "광" | CardFace 하단 Badge (노란색: `bg-yellow-400 text-yellow-900`) |
| attribute: 'yeolkkeut' | "열끗" | CardFace 하단 Badge (파란색: `bg-blue-400 text-blue-900`) |
| attribute: 'normal' | *(표시 안 함)* | 속성 Badge 없음 |

**앞면 (CardFace):** `bg-white text-gray-900`, 둥근 모서리 `rounded-md`, 테두리 `border border-gray-200`
**뒷면 (CardBack):** `bg-muted rounded-md border border-border`, 내부에 "?" 텍스트 `text-muted-foreground`

---

## Chip Display Contract

CHIP-04 요구사항 (칩 단위별 시각 구분):

| 단위 | 색상 | Tailwind 클래스 |
|------|------|----------------|
| 500원 | 회색 | `bg-gray-400 text-gray-900` |
| 1,000원 | 파란색 | `bg-blue-500 text-white` |
| 5,000원 | 초록색 | `bg-green-500 text-white` |
| 10,000원 | 빨간색 | `bg-red-500 text-white` |

베팅패널 칩 입력: 4개 Button (secondary variant, 칩 색상 배지 접두사 포함) + 현재 입력 금액 표시 (Display 크기 28px) + "초기화" ghost 버튼.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | button, dialog, input, badge, card, separator, sonner | 필요 없음 (공식 레지스트리) |
| 서드파티 레지스트리 | 없음 | 해당 없음 |

> **서드파티 레지스트리 없음.** shadcn 공식 레지스트리만 사용. 별도 vetting gate 불필요.

---

## Responsive Breakpoints

| Breakpoint | 값 | 레이아웃 |
|------------|-----|---------|
| mobile (기본) | 0 ~ 767px | 세로 스택 레이아웃, 원형 → 격자 |
| tablet/desktop (`md:`) | 768px+ | 원형 테이블 레이아웃, 5패널 구성 |

원형 컨테이너:
- `md:` 이상: `w-[480px] h-[480px]`, `translateY(-200px)`
- `md:` 미만: 컴포넌트별 세로 스택, 원형 배치 비활성

---

## Accessibility Contract

| 요구사항 | 구현 방법 |
|----------|-----------|
| 버튼 포커스 | shadcn Button의 기본 focus-visible ring 유지 |
| 모달 포커스 트랩 | Radix Dialog의 기본 포커스 트랩 사용 |
| 색상만으로 상태 전달 금지 | 카드 속성은 텍스트 Badge와 색상 동시 사용 |
| 터치 타깃 44px | 콜/레이즈/다이/체크 버튼 min-h-11 (44px) |
| 언어 | `<html lang="ko">` |

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

*Phase: 06-ui*
*UI-SPEC created: 2026-03-30*
*Sources: CONTEXT.md (12 decisions), RESEARCH.md (standard stack + architecture patterns), REQUIREMENTS.md (UI-01~08)*
