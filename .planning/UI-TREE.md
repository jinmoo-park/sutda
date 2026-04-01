# 섯다 UI 컴포넌트 트리

> 마지막 업데이트: 2026-04-01
> 목적: 페이지/컴포넌트 전체 구조 + 개념 명칭 정리

---

## 라우팅 구조

```
/ (루트)
├── MainPage          → 입장화면 (닉네임 입력, 방 만들기)
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
└── 베팅 액션 버튼: 체크 / 콜 / 레이즈 / 다이
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
| *(미생성)* | ResultScreen (결과화면) | — |
| *(미생성)* | BettingPanel + HandPanel | — |

> Stitch HTML 원본: `stitch_main.html`, `stitch_waiting.html`, `stitch_game.html`, `stitch_lobby.html` (프로젝트 루트, git untracked)

---

## Stitch 생성 프롬프트 (Phase 10.1)

> 직접 Stitch에서 생성할 때 아래 프롬프트를 사용하세요.
>
> **공통 디자인 시스템 토큰 (모든 화면 공통 적용):**
> - 배경: `#121410` (짙은 올리브 드랩)
> - primary gold: `#e4c379`
> - surface panel: `#1a1c18` ~ `#1e201c`
> - error/die: `#ffb4ab`
> - 텍스트: `#e3e3dc`
> - border-radius: `0px` (완전히 각진 엣지)
> - 폰트: Space Grotesk (헤드라인/라벨), Work Sans (바디)
> - 텍스처: wool-texture grain (3~5% opacity noise), metallic-sheen (gold 요소)
> - 무드: 군용담요 깔아놓고 하는 민간 지하 섯다판. 폴리시된 카지노 절대 아님.

---

### 1. MainPage (입장화면) ⬅️ 미생성

```
섯다 게임 입장화면. 군용담요 D-09 컨셉 (어두운 올리브 드랩, 각진 엣지, wool-texture).

배경: #121410, wool-texture grain 오버레이.

레이아웃 (모바일, 세로 중앙 정렬):
- 상단: "섯다" 타이틀 (큰 굵은 텍스트, gold #e4c379) + 가로 구분선 (gold, opacity 0.6)
- 메인 폼 영역 (surface panel #1a1c18):
  - "호칭" 라벨 (xs, 대문자, 흐린 텍스트) + 닉네임 텍스트 입력 필드 (각진, recessed)
  - "초기 칩 (원)" 라벨 + 숫자 입력 필드 (기본값 100,000)
  - "방 만들기" primary 버튼 (전체 너비, gold #e4c379 배경, 검정 텍스트, 굵은 대문자)
- 하단 장식: ◆ 심볼 + 양쪽 가로선

※ "링크로 참여" 버튼 삭제됨 — 링크 클릭 시 /room/:roomId로 직접 진입하므로 버튼 불필요

border-radius 0px, metallic-sheen on gold button, Space Grotesk 폰트.
```

---

### 2. WaitingRoom (대기실) ✅ stitch_waiting.html / stitch_lobby.html 존재

기존 `stitch_waiting.html` 또는 `stitch_lobby.html` 참조.

실제 컴포넌트 구성 확인용:
- 타이틀 이미지 상단
- 대기실 URL 표시 박스 + "링크 복사" 버튼
- 참가자 목록: [순서번호] 닉네임 (방장 배지) (나) | 칩금액
- 방장: "게임 시작" primary 버튼 (2인 미만 비활성)
- 비방장: "방장이 게임을 시작할 때까지 대기 중..." 텍스트 박스

---

### 3. GameTable (게임 진행 화면) ✅ stitch_main.html / stitch_game.html 존재

기존 `stitch_main.html` 또는 `stitch_game.html` 참조.

실제 PlayerSeat 구성 확인용:
- 닉네임 + [나] 표시
- 역할 배지: `선` (딜러), `자리비움`, `다이`
- HwatuCard 2장 (sm size, 뒷면 기본)
- 칩 잔액 (숫자)
- 베팅 액션 배지: `체크`(스카이), `콜`(올리브), `레이즈 +금액`(옐로우), `다이`(레드)
- 현재 차례: olive green 테두리 + glow 효과

---

### 4. BettingPanel + HandPanel (하단 액션 패널) ⬅️ 미생성

```
섯다 게임 베팅/패 확인 패널. 모바일 하단 고정 영역. 군용담요 D-09 컨셉.

배경: #121410, surface panel #1a1c18.

레이아웃 (위에서 아래로):

[HandPanel 영역]
- "내 패" 또는 "닉네임의 패" 소제목
- 화투 카드 2장 (md size, 뒷면 상태 — 탭해서 뒤집기)
- 1장 뒤집힌 상태: "나머지 카드를 탭해서 확인하세요" 힌트 텍스트
- 2장 모두 뒤집힌 후: 족보 배지 (예: "장땡", "구사", "5끗")
- "족보 참고표" ghost 텍스트 버튼 (작게)

[BettingPanel 영역]
- 상태 표시줄: "내 차례" (gold, 굵게) 또는 "홍길동 차례" (흐리게)
- 콜 금액 표시: "콜 5,000원" (오른쪽 정렬, 작게)
- 레이즈 금액 표시: "+10,000원" (크게, gold)
- 칩 추가 버튼 그리드 (1행 4열):
  - +500 (회색 원 아이콘)
  - +1천 (파랑 원 아이콘)
  - +5천 (초록 원 아이콘)
  - +1만 (빨강 원 아이콘)
- [레이즈 금액 있을 때] "초기화" ghost 버튼
- 액션 버튼 그리드 (1행 4열):
  - "체크" outline 버튼
  - "콜" primary 버튼
  - "레이즈" 노란색 버튼
  - "다이" destructive/red 버튼

내 차례일 때: 패널 전체에 gold ring glow 효과.
border-radius 0px, Space Grotesk 폰트.
```

---

### 5. ResultScreen (결과화면) ⬅️ 미생성

```
섯다 게임 결과화면. 군용담요 D-09 컨셉.

배경: #121410, wool-texture.

레이아웃:
- 헤더: "[닉네임] 승리!" (Space Grotesk, 굵게, 중앙)
- 플레이어 카드 목록 (flex wrap, 2~4명):
  각 플레이어 카드 (surface #1a1c18, 각진 border):
    - 닉네임 (굵게)
    - HwatuCard 2장 (md size, 앞면 공개)
    - 족보 배지 (예: "장땡", "구사", "5끗") — 다이한 플레이어는 뒷면 + "다이" 배지
    - 칩 변동 배지: "+15,000원" (초록), "-5,000원" (빨강)
    - (땡값 발생 시) "땡값 +N원" 작은 텍스트
- 하단 버튼:
  - "학교 가기" secondary 버튼 (다음 판으로)
  - "다음판 쉬기" ghost 버튼 (조건부, 3인 이상 + 패자만)

주의: "재경기" 버튼 없음 (서버가 자동 처리).
border-radius 0px, metallic-sheen on winner card.
```

---

### 6. 주요 모달 (우선순위 순)

#### ModeSelectModal
```
섯다 게임 모드 선택 모달 (방장 전용). 군용담요 D-09.

다이얼로그 박스 (surface #1e201c, 각진 엣지, 화면 중앙).

헤더: "게임 모드 선택" (Space Grotesk, gold underline)

모드 목록 (라디오 버튼 스타일, 각 항목 surface-low #1a1c18 패널):
1. 섯다 (기본) — "2장 배분, 표준 섯다 규칙"
2. 세장섯다 — "3장 배분 후 2장 선택"
3. 골라골라 — "덱에서 원하는 2장 직접 선택"
4. 인디언섯다 — "자신의 패를 모르는 채로 베팅"
5. 한장공유 — "공유 카드 1장 + 내 카드 1장"

선택된 항목: gold 테두리 + gold 텍스트.
"확인" primary 버튼, "취소" ghost 버튼.
```

#### DealerSelectModal
```
섯다 밤일낮장 딜러 결정 모달. 군용담요 D-09.

"딜러 결정" 헤더.
카드 더미 (뒤집기 전): 여러 장의 뒷면 카드가 펼쳐진 형태.
플레이어들이 각자 카드 1장을 선택 (탭/클릭).
선택 전: "카드를 1장 뽑으세요" 안내 텍스트.
```

#### ShuffleModal
```
섯다 셔플 인터랙션 모달 (딜러 전용). 군용담요 D-09.

"셔플" 헤더.
카드 더미 이미지 (드래그 가능 영역).
"카드를 좌우로 드래그해서 섞으세요" 안내.
진행 표시 (예: ████░░ 50%).
완료 시 "셔플 완료" 상태 표시.
```
