# DESIGN.md — Stitch 컨텍스트 문서 (섯다 UI)

## Stitch 메타데이터

- Project ID: 15932366942382004219
- Design System ID: 3261306653240047912
- 생성일: 2026-04-01

---

## 1. 기술 스택

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| React | 19 | UI 프레임워크 |
| TypeScript | 5.x | 타입 안전성 |
| Tailwind CSS | v4 | 스타일링 (`@import "tailwindcss"` + `@theme inline`) |
| shadcn/ui | 최신 | 공통 UI 컴포넌트 (button, badge, card, dialog, input, separator, sonner) |
| Zustand | 5.x | 상태 관리 |
| Socket.IO client | 4.x | 실시간 통신 |
| Vite | 6 | 빌드 도구 |

**중요:** Tailwind v4는 `tailwind.config.ts` 파일 없이 `@theme inline` CSS 변수로 토큰 정의한다.
`@apply` 대신 CSS 변수 직접 참조 패턴 사용.

---

## 2. 디자인 컨셉 (D-09) — 군용담요

**무드:** "공장에서 군용담요 깔아놓고 하는 느낌"

민간 지하 섯다판 분위기. 폴리시된 카지노가 아닌 날것의 한국 섯다판.

### 컬러 방향

- **주조색:** 군용 올리브 드랩(OD green) — 광택 없이 바랜 녹색
- **배경:** 거의 검정에 가까운 올리브 다크 — 담요 위 게임판 느낌
- **포인트:** 카키, 다크 카모, 바랜 군용 그린
- **위험 액션:** 군용 레드 (과하지 않은 낮은 채도)

### 텍스처 & 분위기

- 담요/캔버스 패브릭 느낌, 거친 표면
- 노출 콘크리트/철판 질감 허용
- 각진 엣지 허용 (radius 최소화)
- 미니멀한 장식 — 군용 장비 같은 유틸리타리안 미학

### 타이포그래피

- **KimjungchulMyungjo** — 명조체, 한국 전통 세리프 느낌
- 굵고 실용적. 군용 장비 매뉴얼처럼 가독성 우선
- Light(300) / Regular(400) / Bold(600-700)

---

## 3. 디자인 토큰 (`packages/client/src/index.css` `@theme inline` 전체)

```css
@theme inline {
  /* 배경/표면 */
  --color-background: hsl(70 15% 8%);          /* 매우 어두운 올리브 — 게임 테이블 */
  --color-foreground: hsl(60 20% 92%);          /* 크림색 텍스트 */

  /* 카드/팝오버 표면 */
  --color-card: hsl(72 12% 13%);               /* 어두운 카드 표면 */
  --color-card-foreground: hsl(60 20% 92%);
  --color-popover: hsl(72 12% 13%);
  --color-popover-foreground: hsl(60 20% 92%);

  /* 기본 액션 — 올리브 그린 */
  --color-primary: hsl(75 55% 42%);            /* 올리브 그린 — 차례 강조, 콜 버튼 */
  --color-primary-foreground: hsl(70 15% 8%);

  /* 보조 표면 */
  --color-secondary: hsl(72 12% 18%);
  --color-secondary-foreground: hsl(60 20% 92%);
  --color-muted: hsl(72 12% 18%);
  --color-muted-foreground: hsl(70 10% 55%);
  --color-accent: hsl(72 12% 18%);
  --color-accent-foreground: hsl(60 20% 92%);

  /* 위험/경고 */
  --color-destructive: hsl(0 72% 60%);         /* 레드 — 다이 버튼 */
  --color-destructive-foreground: hsl(0 0% 100%);

  /* 테두리/입력 */
  --color-border: hsl(72 12% 20%);
  --color-input: hsl(72 12% 18%);
  --color-ring: hsl(75 55% 42%);

  /* 반경 */
  --radius: 0.5rem;
}
```

### 게임 전용 색상 (인라인 스타일로 사용)

```
레이즈/칩잔액:  bg-yellow-400 / text-yellow-300 / text-yellow-500 (#facc15)
칩 색상:
  - 500원:  bg-zinc-400  (회색)
  - 1,000원: bg-blue-500  (파랑)
  - 5,000원: bg-green-500 (초록)
  - 10,000원: bg-red-500  (빨강)
```

---

## 4. 폰트

```
KimjungchulMyungjo
경로: /font/KimjungchulMyungjo-{Light|Regular|Bold}.ttf
적용: body에 기본 적용, font-family: 'KimjungchulMyungjo', serif
```

```css
@font-face {
  font-family: 'KimjungchulMyungjo';
  src: url('/font/KimjungchulMyungjo-Light.ttf') format('truetype');
  font-weight: 300;
}
@font-face {
  font-family: 'KimjungchulMyungjo';
  src: url('/font/KimjungchulMyungjo-Regular.ttf') format('truetype');
  font-weight: 400;
}
@font-face {
  font-family: 'KimjungchulMyungjo';
  src: url('/font/KimjungchulMyungjo-Bold.ttf') format('truetype');
  font-weight: 600 700;
}
```

---

## 5. 이미지 에셋 (`/img/`)

| 파일명 | 용도 |
|--------|------|
| `background.jpg` | 게임 테이블 배경 (어두운 게임판 질감) |
| `card_back.jpg` | 화투 카드 뒷면 이미지 |
| `main_tilte.jpg` | 메인 타이틀 이미지 |
| `main_tilte_alt.jpg` | 메인 타이틀 대체 이미지 |
| `regame.png` | 재경기 오버레이 |
| `01-1.png` ~ `10-2.png` | 화투 카드 앞면 (숫자-슬롯 형식, 20장) |

**카드 이미지 규칙:** 파일명 형식 `{숫자}-{슬롯}.png`
- 숫자: 01~10
- 슬롯: 1 또는 2 (같은 숫자 2장)
- 광 속성: 1, 3, 8번 카드
- 열끗 특수패: 4, 7, 9번 카드

---

## 6. 레이아웃 원칙

### 데스크탑 (3열 레이아웃)

```
┌─────────────────────────────────────────────────────┐
│  좌 패널 (BettingPanel + HandPanel)                   │
│  ├── BettingPanel: 베팅 액션 버튼 + 칩 컨트롤          │
│  └── HandPanel: 내 패 (화투 카드 2장, 뒤집기 인터랙션) │
├─────────────────────────────────────────────────────┤
│  중앙 패널 (GameTable)                                │
│  ├── 원형 플레이어 배치 (2~6인)                        │
│  ├── 중앙 팟(POT) 금액 표시                           │
│  └── 공유패 (해당 모드 시)                             │
├─────────────────────────────────────────────────────┤
│  우 패널 (InfoPanel + ChatPanel)                      │
│  ├── InfoPanel: 내 칩, 플레이어 목록 + 칩 현황         │
│  └── ChatPanel: 채팅 (현재 플레이스홀더)               │
└─────────────────────────────────────────────────────┘
```

### 모바일 (수직 레이아웃)

```
┌─────────────────┐
│  GameTable       │  (상단, 축소된 원형 배치)
├─────────────────┤
│  HandPanel       │  (중단, 내 패 크게)
├─────────────────┤
│  BettingPanel    │  (중단 하부, 액션 버튼)
├─────────────────┤
│  ChatPanel       │  (하단, 접힌 상태)
└─────────────────┘
```

**필수 원칙:**
- 스크롤 없는 단일 화면 (100vh 고정)
- 모든 게임 정보가 한 화면에 표시되어야 함
- 세로/가로 전환 대응

---

## 7. 게임 컨텍스트

**게임명:** 섯다 (섰다)
**종류:** 한국 전통 화투 카드 게임
**인원:** 2~6인 (친구들끼리, 방장이 링크 공유)
**언어:** 한국어 UI 전용

### 게임 흐름

```
1. 입장: 닉네임 입력 → 방 생성/참여 링크 공유
2. 대기실: 플레이어 모임, 방장이 게임 시작
3. 학교가기(앤티): 각 플레이어 앤티 납부
4. 딜러 결정: 카드 한 장씩 뽑아 선(딜러) 결정
5. 셔플 + 기리/퉁: 딜러가 셔플, 옆 플레이어가 기리(컷)
6. 패 돌리기: 반시계 방향, 기본 2장씩
7. 베팅: 선부터 콜/레이즈/다이/체크
8. 공개: 모두 패 공개 후 족보 비교
9. 정산: 승자가 팟 획득
```

### 베팅 액션 (한국어 UI)

| 액션 | 한국어 | 설명 |
|------|--------|------|
| Call | 콜 | 현재 베팅 금액에 맞춤 |
| Raise | 레이즈 | 베팅 금액 올림 (자유 금액) |
| Die | 다이 | 패 포기, 해당 라운드 탈락 |
| Check | 체크 | 베팅 없이 넘김 (선만 가능) |
| Show | 공개 | 패 공개 (showdown 단계) |

### 게임 모드 (5종)

| 모드 | 설명 |
|------|------|
| 오리지날 | 2장 받아 베팅, 기본 모드 |
| 세장섯다 | 2장 받아 베팅 → 1장 추가 → 3장 중 2장 선택 |
| 한장공유 | 선이 공유패 1장 지정, 각자 1장 받아 조합 |
| 골라골라 | 전 20장 공개 → 자유롭게 2장 선착순 선택 |
| 인디언섯다 | 1장 앞면 반대(나만 못 봄) → 베팅 → 1장 추가 |

### 족보 (높은 순)

```
광땡 3종 > 장땡 > 구땡~일땡 > 알리 > 독사 > 구삥 > 장삥 > 새륙 > 끗(9끗~망통)
특수: 땡잡이(3+7 조합), 암행어사(4+1 조합), 구사(4+9 조합 → 재경기)
```

---

## 8. 컴포넌트 Prop Interfaces

### 페이지 컴포넌트

#### `MainPage`

내부 상태(useState)만 사용. 외부 props 없음. Socket.IO 연결 후 방 생성/참여 처리.

```typescript
// props 없음 — 내부 상태 관리
// 주요 UI 요소: 닉네임 입력 필드, 방 코드 입력, 방 만들기/참여 버튼, 타이틀 이미지
```

#### `WaitingRoom`

```typescript
interface WaitingRoomProps {
  roomState: RoomState;     // { players: PlayerState[], hostId: string }
  myPlayerId: string | null;
  roomId: string;
}
```

#### `RoomPage`

내부 오케스트레이터 — props 없음. useGameStore()에서 전체 상태 구독.

---

### 레이아웃 컴포넌트

#### `GameTable`

```typescript
interface GameTableProps {
  players: PlayerState[];
  myPlayerId: string | null;
  currentPlayerIndex: number;
  pot: number;
  visibleCardCounts?: Record<string, number>;
  sharedCard?: Card;
  mode?: GameMode;            // 'original' | 'three-card' | 'shared-card' | 'golla' | 'indian'
  dealingComplete?: boolean;
  myFlippedCardIndices?: Set<number>;
}
```

#### `BettingPanel`

```typescript
interface BettingPanelProps {
  isMyTurn: boolean;
  currentBetAmount: number;
  myCurrentBet: number;
  myChips: number;
  roomId: string;
  effectiveMaxBet?: number;
  currentPlayerNickname?: string;
  isEffectiveSen: boolean;
}
```

#### `HandPanel`

```typescript
interface HandPanelProps {
  myPlayer: PlayerState | null;
  phase?: GamePhase;
  sharedCard?: Card;
  visibleCardCount?: number;
  nickname?: string;
  onAllFlipped?: () => void;
  dealingComplete?: boolean;
  flippedIndices?: Set<number>;    // 외부 제어 모드
  onFlip?: (idx: number) => void;
}
```

#### `InfoPanel`

```typescript
interface InfoPanelProps {
  myChips: number;
  players: PlayerState[];
  myPlayerId?: string | null;
  compact?: boolean;               // 모바일 오버레이용 압축 모드
}
```

#### `ChatPanel`

현재 플레이스홀더. props 없음.

#### `ResultScreen`

```typescript
interface ResultScreenProps {
  gameState: GameState;
  myPlayerId: string | null;
  roomId: string;
  isRematch?: boolean;
}
```

---

### 게임 컴포넌트

#### `PlayerSeat`

```typescript
interface PlayerSeatProps {
  seatIndex: number;
  totalPlayers: number;
  player: PlayerState;
  isMe: boolean;
  isCurrentTurn: boolean;
  visibleCardCount?: number;
  mode?: GameMode;
  dealingComplete?: boolean;
  flippedCardIndices?: Set<number>;
}
```

#### `HwatuCard`

```typescript
interface HwatuCardProps {
  card?: Card | null;
  faceUp?: boolean;               // default false
  size?: 'sm' | 'md' | 'lg';     // sm: 51x83, md: 68x110, lg: 85x135
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  slotIndex?: number;
}
```

#### `ChipDisplay`

```typescript
interface ChipDisplayProps {
  breakdown: ChipBreakdown;       // { ten_thousand, five_thousand, one_thousand, five_hundred }
  className?: string;
}
```

#### `SharedCardDisplay`

```typescript
interface SharedCardDisplayProps {
  card: Card;
}
```

---

### 모달 컴포넌트 (15개)

#### `AttendSchoolModal`

```typescript
interface AttendSchoolModalProps {
  open: boolean;
  roomId: string;
  isDealer?: boolean;
  canSkip?: boolean;
}
```

#### `CutModal`

```typescript
interface CutModalProps {
  open: boolean;
  roomId: string;
  // 내부에 복잡한 기리 드래그 UI (rAF 기반 드래그)
}
```

#### `ShuffleModal`

```typescript
interface ShuffleModalProps {
  open: boolean;
  roomId: string;
  // 내부에 rAF 기반 셔플 애니메이션
}
```

#### `DealerSelectModal`

```typescript
interface DealerSelectModalProps {
  open: boolean;
  roomId: string;
  // 20장 카드 선택 그리드
}
```

#### `DealerResultOverlay`

```typescript
interface DealerResultOverlayProps {
  open: boolean;
  results: Array<{ playerId: string; card: Card }>;
  players: PlayerState[];
  winnerId: string;
  onOpenChange?: (open: boolean) => void;
}
```

#### `ModeSelectModal`

```typescript
interface ModeSelectModalProps {
  open: boolean;
  roomId: string;
  isDealer: boolean;
}
```

#### `SharedCardSelectModal`

```typescript
interface SharedCardSelectModalProps {
  open: boolean;
  roomId: string;
}
```

#### `GollaSelectModal`

```typescript
interface GollaSelectModalProps {
  open: boolean;
  roomId: string;
  // 2장 선택 즉시 자동 emit — 확인 버튼 없음
}
```

#### `SejangCardSelectModal`

```typescript
interface SejangCardSelectModalProps {
  open: boolean;
  roomId: string;
}
```

#### `SejangOpenCardModal`

```typescript
interface SejangOpenCardModalProps {
  open: boolean;
  roomId: string;
}
```

#### `MuckChoiceModal`

```typescript
interface MuckChoiceModalProps {
  open: boolean;
  roomId: string;
  myCards: Card[];
}
```

#### `RechargeVoteModal`

```typescript
interface RechargeVoteModalProps {
  roomId: string;
  // open 제어는 store의 rechargeRequest 상태로
}
```

#### `ReturnFromBreakModal`

```typescript
interface ReturnFromBreakModalProps {
  roomId: string;
}
```

#### `GusaRejoinModal`

```typescript
interface GusaRejoinModalProps {
  roomId: string;
  potAmount: number;
  myChips: number;
}
```

#### `GusaAnnounceModal`

```typescript
interface GusaAnnounceModalProps {
  roomId: string;
  isDealer: boolean;
}
```

#### `LeaveRoomDialog`

```typescript
interface LeaveRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}
```

---

## 9. 공통 타입 참조

```typescript
// 게임 모드
type GameMode = 'original' | 'three-card' | 'shared-card' | 'golla' | 'indian';

// 게임 페이즈
type GamePhase =
  | 'waiting'
  | 'attend-school'
  | 'dealer-select'
  | 'dealer-result'
  | 'cutting'
  | 'dealing'
  | 'betting'
  | 'betting-1'
  | 'betting-2'
  | 'showdown'
  | 'result'
  | 'rematch-pending'
  | 'gusa-pending';

// 카드
interface Card {
  number: number;          // 1~10
  slot: 1 | 2;             // 같은 숫자 2장 구분
  attribute: 'gwang' | 'yeolkkeut' | 'normal';
}

// 플레이어 상태
interface PlayerState {
  id: string;
  nickname: string;
  chips: number;
  cards: (Card | null)[];
  isAlive: boolean;
  currentBet: number;
  totalBet: number;
  isDealer: boolean;
  isSen?: boolean;
  chipBreakdown?: ChipBreakdown;
}

// 칩 분류
interface ChipBreakdown {
  ten_thousand: number;
  five_thousand: number;
  one_thousand: number;
  five_hundred: number;
}

// 게임 전체 상태
interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  currentPlayerIndex: number;
  pot: number;
  mode?: GameMode;
  sharedCard?: Card;
  dealingComplete?: boolean;
  winnerId?: string;
  results?: Array<{ playerId: string; handType: string; score: number }>;
}
```

---

## 10. Stitch 도구 파라미터 실측 결과

### 확인된 도구 스키마 (2026-04-01 실측)

**출처:** `@_davideast/stitch-mcp` 패키지 (`tool` 서브커맨드로 직접 호출)

#### `list_projects`
```json
{}
// 파라미터 없음
// 반환: { projects: [{ name, title, createTime, ... }] }
```

#### `create_project`
```json
{ "title": "프로젝트명" }
// 반환: { name: "projects/{id}", origin, projectType, visibility }
// projectId = name에서 추출: "projects/15932366942382004219" → "15932366942382004219"
```

#### `create_design_system`
```json
{
  "projectId": "15932366942382004219",
  "designSystem": {
    "displayName": "디자인 시스템명",
    "theme": {
      "colorMode": "DARK",          // "LIGHT" | "DARK"
      "customColor": "#6b7c2e",     // hex 색상 (primary 컬러 기준)
      "colorVariant": "TONAL_SPOT", // Material You 컬러 변형
      "font": "NOTO_SERIF_KR",      // 본문 폰트
      "headlineFont": "NOTO_SERIF_KR",
      "bodyFont": "NOTO_SANS_KR",
      "labelFont": "NOTO_SANS_KR",
      "designMd": "마크다운 형태의 디자인 가이드라인"
    }
  }
}
// 반환: { name: "assets/{id}", designSystem: { theme: {} }, version: "1" }
// designSystemId = name에서 추출: "assets/3261306653240047912" → "3261306653240047912"
```

#### `generate_screen_from_text`
```json
{
  "projectId": "15932366942382004219",
  "prompt": "컴포넌트 설명 텍스트",
  "modelId": "GEMINI_3_FLASH"  // 또는 "GEMINI_3_1_PRO"
}
```

#### `apply_design_system`
```json
{
  "projectId": "15932366942382004219",
  "selectedScreenInstances": [],  // get_project에서 가져온 스크린 인스턴스 배열
  "assetId": "3261306653240047912"  // list_design_systems에서 가져온 asset ID
}
```

#### `list_screens`
```json
{ "projectId": "15932366942382004219" }
```

#### `get_screen`
```json
{ "name": "projects/{projectId}/screens/{screenId}" }
// 반환에 HTML 포함
```

### 이후 Wave에서의 활용

이 스키마를 바탕으로 다음 플랜들에서:
1. `generate_screen_from_text`로 각 컴포넌트 HTML 생성
2. `apply_design_system`으로 D-09 디자인 시스템 적용
3. `get_screen`으로 HTML 추출 → React/Tailwind 변환

---

*Phase: 10.1-stitch-ui | Plan: 01 | 생성일: 2026-04-01*
