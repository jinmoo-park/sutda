# 섯다 UI 컴포넌트 트리

> 마지막 업데이트: 2026-04-01
> 목적: 페이지/컴포넌트 전체 구조 + 개념 명칭 정리

---

## 라우팅 구조

```
/ (루트)
├── MainPage          → 입장화면 (닉네임 입력, 방 만들기 / 링크로 참여)
└── /room/:roomId
    └── RoomPage      → 방 전체 컨테이너 (게임 상태에 따라 하위 화면 전환)
```

---

## RoomPage 상태별 화면 전환

```
RoomPage (/room/:roomId)
│
├── [hasJoined = false]
│   └── RoomEntryForm ⚠️ (현재 RoomPage 인라인, 별도 컴포넌트 없음)
│       → 닉네임 입력 + 입장 버튼 (링크 공유로 입장 시)
│
├── [phase = 'waiting' || gameState 없음]
│   └── WaitingRoom   → 대기실 (방 코드 표시, 참가자 목록, 게임 시작)
│
├── [phase = 'result' || 'finished']
│   └── ResultScreen  → 결과 화면 (승패, 칩 변동, 재경기/학교가기)
│
├── [phase = 'gusa-announce']
│   └── GusaAnnounceModal → 구사 재경기 안내 (풀스크린)
│
├── [phase = 'gusa-pending']
│   ├── GusaRejoinModal   → 구사 재경기 참여 결정 (다이한 플레이어용)
│   └── 대기 텍스트 (생존 플레이어용, 인라인)
│
├── [phase = 'rematch-pending']
│   └── RematchPendingView ⚠️ (현재 RoomPage 인라인, 별도 컴포넌트 없음)
│       → 동점 재경기 대기 + 재경기 시작 버튼
│
└── [게임 진행 중 — 그 외 phase]
    └── GameLayout (데스크탑/모바일 반응형, 현재 RoomPage 인라인)
        ├── [데스크탑 md:] 3열 그리드
        │   ├── 좌사이드: InfoPanel + ChatPanel
        │   ├── 중앙: GameTable
        │   └── 우사이드: BettingPanel + HandPanel
        └── [모바일] 수직 flex
            ├── 상단: GameTable (InfoPanel compact 오버레이)
            ├── 중단: HandPanel + BettingPanel
            └── 하단: ChatPanel
```

---

## 컴포넌트 상세 트리

### 레이아웃 컴포넌트 (`components/layout/`)

```
WaitingRoom
└── 방 코드 + 복사 버튼
    참가자 목록 (닉네임, 칩, 방장 뱃지)
    게임 시작 버튼 (방장 전용, 2인 이상)

GameTable
└── PlayerSeat × N (2~6명, 원형 배치)
    │   └── HwatuCard × 2 (앞면/뒷면 3D 플립)
    │       ChipDisplay (칩 금액)
    │       베팅 액션 뱃지 (체크/콜/레이즈/다이)
    판돈(pot) 표시 (중앙)
    SharedCardDisplay (한장공유 모드 전용)

HandPanel
└── HwatuCard × 2 (내 패, 플립 인터랙션)
    족보 표시 (evaluateHand 결과)
    HandReferenceDialog (족보표 팝업, HandPanel 내부)
    카드 확인 버튼 (배분 후 최초 확인)

BettingPanel
└── 베팅 액션 버튼: 다이 / 체크 / 하프 / 따당 / 커스텀
    현재 베팅금액 표시
    내 차례 여부 (isMyTurn)
    선 권한 표시 (isEffectiveSen)

InfoPanel
└── 내 칩 잔액
    전체 플레이어 칩 현황 목록
    compact 모드 지원 (모바일 GameTable 오버레이용)

ChatPanel
└── [미구현] placeholder — "채팅은 다음 버전에서 제공됩니다"

ResultScreen
└── 승자 표시
    플레이어별 패 공개 + 족보
    칩 변동 (+/-)
    재경기 버튼 / 학교 가기 버튼
```

---

### 게임 원자 컴포넌트 (`components/game/`)

```
HwatuCard
└── 앞면: getCardImageSrc() → /img/cards/*.png
    뒷면: getCardBackSrc() → /img/card_back.png
    3D 플립 애니메이션 (CSS transform)
    size prop: sm / md / lg

PlayerSeat
└── HwatuCard × 2 (visibleCardCount 기반)
    닉네임, 칩 금액
    현재 차례 하이라이트 (isCurrentTurn)
    다이 상태 (isFolded, opacity 감소)
    베팅 액션 표시 (lastAction 뱃지)
    딜러 뱃지

ChipDisplay
└── 칩 금액을 시각적 뱃지로 표시
    ChipBreakdown 타입 사용

SharedCardDisplay
└── HwatuCard (한장공유 모드의 공개 카드)
```

---

### 모달 컴포넌트 (`components/modals/`)

게임 phase별 트리거 조건 포함:

```
[game start 준비]
ShuffleModal        phase='shuffling' && isDealer
                    → 딜러 셔플 인터랙션 (드래그)

CutModal            phase='cutting' && isMyTurn
                    → 기리(cut) 드래그 인터랙션

[딜러 결정]
DealerSelectModal   phase='dealer-select'
                    → 밤일낮장 카드 뽑기

DealerResultOverlay phase 무관, showDealerResult=true (3초 타이머)
                    → 밤일낮장 결과 오버레이

[모드 선택]
ModeSelectModal     phase='mode-select' && isDealer
                    → 딜러가 게임 모드 선택
                    (섯다/세장섯다/골라골라/인디언/한장공유)

AttendSchoolModal   ⚠️ 현재 미사용 — 결과화면 버튼으로 대체됨

[게임 중 — 모드별 특수]
GollaSelectModal       phase='gollagolla-select'
                       → 골라골라: 덱에서 카드 직접 선택

SejangOpenCardModal    phase='sejang-open' && isAlive
                       → 세장섯다: 공유 오픈 카드 선택

SejangCardSelectModal  phase='card-select' && isAlive
                       → 세장섯다: 3장 중 2장 선택

SharedCardSelectModal  phase='shared-card-select'
                       → 한장공유: 공유 카드 선택

MuckChoiceModal        phase='showdown' && winnerId===myPlayerId
                       → 상대 전원 다이 시, 패 공개 여부 선택

[재충전]
RechargeVoteModal   rechargeRequest 있을 때 (phase 무관)
                    → 재충전 투표 (찬성/반대)

[구사 재경기]
GusaAnnounceModal   phase='gusa-announce' (풀스크린, RoomPage 레벨)
                    → 구사 패 발생 안내

GusaRejoinModal     phase='gusa-pending' && amDied && needsDecision
                    → 다이한 플레이어의 재경기 참여 결정

[기타]
LeaveRoomDialog     → 방 나가기 확인 (HandPanel에서 트리거 예정)
ReturnFromBreakModal → 자리비움 복귀 예약 (현재 미연결, 인라인 버튼으로 대체)
```

---

### UI 프리미티브 (`components/ui/`) — shadcn/ui 기반

```
button.tsx    → Button
badge.tsx     → Badge
card.tsx      → Card, CardContent, CardHeader, ...
dialog.tsx    → Dialog, DialogContent, DialogHeader, ...
input.tsx     → Input
separator.tsx → Separator
sonner.tsx    → Toaster (sonner 래퍼)
```

---

## v2 개발 중 파일 (Phase 10.1)

| 파일 | 원본 | 상태 |
|------|------|------|
| `MainPage.v2.tsx` | `MainPage.tsx` | 개발 중 (Stitch 레이아웃 기반) |
| `WaitingRoom.v2.tsx` | `WaitingRoom.tsx` | 개발 중 |
| `GameTable.v2.tsx` | `GameTable.tsx` | 개발 중 |
| `PlayerSeat.v2.tsx` | `PlayerSeat.tsx` | 개발 중 |

---

## 레거시/백업 파일

```
pages/_MainPage.tsx         → 초기 프로토타입 (미사용)
pages/MainPage.tsx_         → 에이전트 백업본
components/game/_PlayerSeat.tsx      → 초기 프로토타입 (미사용)
components/layout/_GameTable.tsx     → 초기 프로토타입 (미사용)
components/layout/_WaitingRoom.tsx   → 초기 프로토타입 (미사용)
components/layout/GameTable.tsx_     → 에이전트 백업본
components/layout/WaitingRoom.tsx_   → 에이전트 백업본
components/game/PlayerSeat.tsx_      → 에이전트 백업본
```

---

## 네이밍 이슈 / 개념 불일치 항목 ⚠️

| 현재 이름 | 문제 | 제안 |
|-----------|------|------|
| `RoomPage` 내 닉네임 폼 | 인라인, 컴포넌트 없음 | `RoomEntryForm` 분리 고려 |
| `RoomPage` 내 rematch-pending 화면 | 인라인, 컴포넌트 없음 | `RematchPendingView` 분리 고려 |
| `RoomPage` 내 GameLayout | 3열/모바일 레이아웃 인라인 | `GameLayout` 컴포넌트 분리 고려 |
| `GusaAnnounceModal` | 풀스크린 렌더링인데 "Modal" 접미사 | `GusaAnnounceScreen` 또는 유지 |
| `DealerResultOverlay` | overlay지만 실제론 Dialog 기반 | 현재 명칭 적절 |
| `AttendSchoolModal` | 실제로 미사용 상태 | 제거 또는 결과화면에 통합 확인 필요 |
| `ReturnFromBreakModal` | 실제로 연결 안 됨 (인라인 버튼으로 대체) | 연결 여부 확인 필요 |
| `ChatPanel` | 미구현 placeholder | 구현 전까지 `ChatPanelPlaceholder` 또는 제거 |

---

## Stitch HTML → React 매핑 (Phase 10.1 참조)

| Stitch 화면 | 매핑 대상 | 파일 |
|-------------|-----------|------|
| Sutda Main Screen | GameTable (게임 진행 화면) | `stitch_main.html` |
| Sutda Waiting Room | WaitingRoom | `stitch_waiting.html` |
| Sutda Lobby Command | WaitingRoom (대안 디자인) | `stitch_lobby.html` |
| Sutda Tactical Command | GameTable (전술 커맨드 뷰) | `stitch_game.html` |
| *(미생성)* | MainPage (입장화면) | — |

> Stitch HTML 원본: `stitch_main.html`, `stitch_waiting.html`, `stitch_game.html`, `stitch_lobby.html` (프로젝트 루트, git untracked)
