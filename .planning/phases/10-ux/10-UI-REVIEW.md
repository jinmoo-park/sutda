# Phase 10 — UI Review

**감사일:** 2026-04-01
**기준:** UI-SPEC.md (Phase 10 Design Contract, 승인 대기 상태)
**스크린샷:** 미촬영 (개발 서버 미실행 — 코드 감사로 진행)
**감사 범위:** src/ 전체 TSX, index.css

---

## 필라 점수

| 필라 | 점수 | 핵심 발견 |
|------|------|-----------|
| 1. 카피라이팅 | 3/4 | 계약 대비 대부분 충족, ChatPanel 텍스트 미계약 문구 사용 |
| 2. 비주얼 | 3/4 | BET-HIGHLIGHT · 원형 배치 양호, 데스크탑 우측 사이드 크기 계약 불일치 |
| 3. 색상 | 2/4 | accent 예약 목록 초과 사용, Tailwind semantic 외 하드코딩 색상 다수 |
| 4. 타이포그래피 | 2/4 | 계약 외 font-weight(bold, medium) 3곳 이상, text-[10px] 비표준 사이즈 |
| 5. 스페이싱 | 3/4 | 4의 배수 스케일 준수, text-[26px] · min-w-[7rem] 등 임의값 소수 |
| 6. 경험 디자인 | 3/4 | 로딩·에러·disabled 상태 잘 처리, 소켓 연결 중 로딩 UI 누락 |

**종합: 16/24**

---

## 우선 개선 3선

1. **accent 예약 목록 초과 사용 (색상)** — 계약에 없는 레이즈 금액 표시(BettingPanel:67), DealerResultOverlay의 "선 결정!" 텍스트, 모달 카드 선택 hover ring에 `text-primary` / `ring-primary` 남용 → 플레이어가 "지금 내 차례인가?" 시각 신호가 희석됨. `BettingPanel:67` 레이즈 금액을 `text-foreground`로, `DealerResultOverlay:43` "선 결정!" 텍스트를 `text-amber-500`(이미 DealerSelectModal에서 사용 중)으로 교체하고, 모달 hover ring은 `ring-muted-foreground/50`으로 변경.

2. **font-weight 계약 위반 (타이포그래피)** — UI-SPEC에서 선언한 웨이트는 `font-normal(400)` · `font-semibold(600)` 2종뿐. 실제 코드에서 `font-bold`(BettingPanel:67, GusaRejoinModal:20, GusaAnnounceModal:20), `font-medium`(BettingPanel:60, WaitingRoom:63, DealerSelectModal:50), `font-extrabold`(PlayerSeat:58 text-blue-400 "[나]") 가 사용되어 시각 계층이 불일치. `font-bold` → `font-semibold`, `font-medium` → `font-normal` 또는 `font-semibold`로 통일.

3. **소켓 연결 중 로딩 UI 부재 (경험 디자인)** — MainPage에서 `connect(serverUrl)` 후 소켓 준비 전에 "방 만들기"를 누르면 `toast.error('서버에 연결 중입니다...')`가 표시되지만, 초기 화면에 연결 상태 인디케이터가 없어 사용자가 버튼을 반복 클릭하게 됨. `useGameStore`의 소켓 연결 상태를 읽어 "방 만들기" 버튼에 `disabled` 처리 또는 소형 연결 상태 아이콘을 추가.

---

## 상세 발견 사항

### 필라 1: 카피라이팅 (3/4)

**충족 항목:**
- "나머지 카드를 탭해서 확인하세요" — HandPanel:178, 계약 일치
- 족보 표시 한국어 레이블(삼팔광땡, 알리 등) — HandPanel HAND_TYPE_KOREAN 테이블, 계약 일치
- "셔플 중..." / "버튼을 꾹 누르세요" — ShuffleModal:230, 계약 스펙 "섞는 중..." 대비 표현 소폭 다름
- 기리 페이즈별 안내 텍스트 — CutModal:204-213, 계약 일치
- "채팅은 다음 버전에서 제공됩니다" — 계약 문구, 실제 코드는 "채팅 (준비 중)"으로 불일치

**미충족 항목:**
- `ChatPanel.tsx:4` — "채팅 (준비 중)" 사용. 계약 문구는 "채팅은 다음 버전에서 제공됩니다"
- `ShuffleModal:230` — "버튼을 꾹 누르세요" (유휴 상태). 계약에는 유휴 시 레이블 "셔플"로 명시. 설명 텍스트로 쓰인 점은 UX상 문제없으나 계약과 표현 상이
- `WaitingRoom:55-58` — 빈 참가자 목록: "아직 아무도 없어요" + "친구에게 링크를 공유해 보세요." 계약 미명시 문구이나 의미 명확, 허용 가능

**사소한 이슈:**
- `RoomPage:90` — `'오류가 발생했습니다. 다시 시도해 주세요.'` — 계약 스펙 없음, 범용적이나 구체적 오류 안내 없음

---

### 필라 2: 비주얼 (3/4)

**충족 항목:**
- BET-HIGHLIGHT 구현 — `BettingPanel.tsx:51` `ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_12px_hsl(var(--primary)/0.5)] bg-primary/10` — 계약 스타일과 완전 일치
- 현재 턴 PlayerSeat 강조 — `PlayerSeat:51` `ring-2 ring-primary shadow-[0_0_14px_3px] shadow-primary/50` — 계약 일치
- 판돈 표시 시각 계층 — `GameTable:38-39` 라벨 `text-xs tracking-widest uppercase` + 금액 `text-[26px] font-semibold tabular-nums` — 계약 일치
- 배경 이미지 — `GameTable.tsx` `background.jpg` cover 적용 + `rgba(0,0,0,0.45)` 오버레이
- 3D flip 카드 — `HwatuCard.tsx` rotateY + backface-visibility 패턴 계약 일치

**미충족 / 개선 여지:**
- 데스크탑 3열 그리드: `grid-cols-[256px_1fr_512px]` (RoomPage:520). 계약 스펙은 `grid-cols-[256px_1fr_256px]`인데 우측 사이드가 512px로 구현됨. 우측 사이드(BettingPanel + HandPanel)가 과도하게 넓어 중앙 GameTable 공간을 압박. 계약대로 256px 또는 최소 320px 수준으로 축소 권장
- 데스크탑 레이아웃 좌우 역전 — 계약은 "좌: BettingPanel+HandPanel / 우: InfoPanel+ChatPanel"이지만 실제 구현은 반대("좌: InfoPanel+ChatPanel / 우: BettingPanel+HandPanel"). 작업 효율면에서 베팅 패널이 우측에 있어 오른손잡이 기준 유리하나 계약과 불일치
- `HwatuCard.tsx` — hover 시 `hover:scale-105 hover:shadow-[...]` 계약 스타일이 실제 컴포넌트에 미구현. PlayerSeat에서 `disabled` 전달 시 hover 인터랙션 없음
- WaitingRoom — `main_title_alt.jpg` 사용. 계약은 `main_tilte.jpg` (오타 포함 원본). `main_title_alt.jpg`가 별도 파일이라면 계약 명시 자산과 불일치 가능성

---

### 필라 3: 색상 (2/4)

**accent 예약 목록 기준 분석:**

계약 허용 요소:
1. BET-HIGHLIGHT ring/glow — `BettingPanel:51` (충족)
2. Primary 버튼 배경 — `Button:13` `bg-primary` (충족)
3. 현재 턴 PlayerSeat 강조 테두리 — `PlayerSeat:51` (충족)
4. 족보 결과 텍스트 — HandPanel 족보 Badge 사용 (허용 가능)

**계약 외 accent 사용 — 위반:**
- `BettingPanel:55` `text-primary` — "내 차례" 텍스트. 계약 미포함
- `BettingPanel:67` `text-primary` — 레이즈 금액 표시. 계약 미포함
- `SharedCardDisplay:12` `ring-primary/50` — 공유 카드 표시. 계약 미포함
- `DealerResultOverlay:36` `ring-1 ring-primary`, `DealerResultOverlay:43` `text-primary` "선 결정!" — 계약 미포함
- `DealerSelectModal:87-88` hover/selected ring-primary — 카드 선택 hover. 계약 미포함
- `GollaSelectModal:111-112` hover/selected ring-primary — 동일 패턴
- `SejangCardSelectModal:76-77` ring-primary — 동일 패턴

**하드코딩 색상 — 의미론적 토큰 없음:**
- `PlayerSeat:58` `text-blue-400` — "[나]" 레이블. `text-primary` 또는 별도 토큰 필요
- `PlayerSeat:117-131` `text-sky-400/green-400/yellow-400/red-400` — 베팅 액션 배지. 의미론적 색상이나 토큰 미선언
- `InfoPanel:19` `text-yellow-300`, `InfoPanel:39` `text-yellow-500` — 잔액 표시. 동일 요소에 두 가지 yellow 값(compact vs 일반) 불일치
- `BettingPanel:19-22` 칩 색상 `bg-zinc-400/blue-500/green-500/red-500` — 실물 칩 구분 용도로 허용 가능하나 토큰화 미적용
- `ResultScreen:184-186` `bg-green-600/bg-red-600` — 칩 변동 배지. `bg-destructive` / `bg-primary` 활용 또는 토큰 추가 필요
- `GusaRejoinModal:51` `text-red-500` — `text-destructive` 사용 권장
- `ShuffleModal/CutModal` 카드 더미 `background: '#c0392b'` — 인라인 스타일 하드코딩. CSS 변수 또는 Tailwind 색상 토큰으로 교체 권장

**총 accent 초과 사용 요소:** 약 7개 (계약 허용 4개 초과)

---

### 필라 4: 타이포그래피 (2/4)

**계약 선언 사이즈:** xs(12px), sm(14px), base 미사용, Display text-[26px]
**실제 사용 사이즈:**
- `text-[10px]` — `InfoPanel:18,25,26` (compact 모드). 계약 외 임의값
- `text-xs` — 광범위 사용 (계약 일치)
- `text-sm` — 광범위 사용 (계약 일치)
- `text-[26px]` — `GameTable:39` (계약 일치 — Display 역할)
- `text-lg` — `RoomPage:402,432,614`, `GusaAnnounceModal:20`, `GusaRejoinModal:44`, `MuckChoiceModal:19` (계약 미선언)
- `text-xl` — `RoomPage:402,432`, `ResultScreen:120` (계약 미선언)
- `text-2xl` — `BettingPanel:67` 레이즈 금액 (계약 미선언 — Display 역할이면 text-[26px] 사용해야 함)
- `text-[9px]` — `DealerSelectModal:99` (계약 외 임의값)

**계약 선언 웨이트:** normal(400), semibold(600) 2종
**실제 사용 웨이트:**
- `font-bold` — `BettingPanel:67`, `GusaRejoinModal:44,47`, `GusaAnnounceModal:20`, `PlayerSeat:58`(text-blue-400 "[나]") — 계약 위반
- `font-medium` — `RoomPage:316,330`(label), `BettingPanel:60`, `WaitingRoom:63`, `DealerSelectModal:50,100` — 계약 위반
- `font-semibold` — 광범위 사용 (계약 일치)
- `font-normal` — 일부 사용 (계약 일치)

**비고:** 사이즈 6종, 웨이트 4종 실사용 — 계약(사이즈 3종, 웨이트 2종) 초과

---

### 필라 5: 스페이싱 (3/4)

**4의 배수 스케일 준수 현황:**
- 대부분 `p-2/p-4/p-6/gap-1/gap-2/gap-4` 사용 — 계약 일치
- `py-1.5` — `InfoPanel:16` (compact). 6px = 4의 배수 아님
- `px-2.5` — Badge 기본값 (shadcn 기본, 10px = 4의 배수 아님이지만 컴포넌트 내부로 허용 가능)
- `gap-1.5` — `BettingPanel:78,108` 칩/액션 버튼 그리드. 6px = 계약 외

**임의값(arbitrary):**
- `text-[26px]` — 계약 명시 허용 (Display 역할)
- `text-[10px]` — 비표준, InfoPanel compact 전용
- `text-[9px]` — 비표준, DealerSelectModal 카드 닉네임
- `min-w-[7rem]` — PlayerSeat 카드 최소 너비 (112px, 계약 미명시)
- `min-w-[280px]` — RoomPage 세장 오버레이 (계약 미명시)
- `min-w-[100px]` — InfoPanel compact (계약 미명시)
- `min-w-[160px]` — InfoPanel 일반 (계약 미명시)
- `shadow-[0_0_12px_hsl(...)]` / `shadow-[0_0_14px_3px]` — 계약 허용 (BET-HIGHLIGHT 명시)
- `h-dvh` — 계약 명시 사용

**레이아웃 스페이싱:**
- 데스크탑 우측 컬럼 `p-2 gap-2` — 계약 스케일 맞음
- 모바일 상단 GameTable 오버레이 InfoPanel `top-2 right-2` — 계약 일치

---

### 필라 6: 경험 디자인 (3/4)

**로딩 상태:**
- 딜링 애니메이션 — `dealingComplete` 플래그로 flip 잠금, `deal-fly-in` 애니메이션 적용 — 양호
- 셔플 rAF 애니메이션 — 5단계 사이클 구현 — 양호
- 기리 merging 애니메이션 380ms — 양호
- 소켓 연결 중 (`MainPage`) — 버튼 클릭 시 에러 토스트만 표시, 연결 인디케이터 없음 — **개선 필요**
- 방 연결 중 (`RoomPage:366-370`) — "방 {roomId} 연결 중..." 텍스트 표시 — 기본적 처리 있음

**에러 상태:**
- `gameStore.ts` socket 연결 끊김 시 에러 메시지 set
- `RoomPage` `game-error` → `toast.error` 코드별 처리 — 양호
- `MainPage` 폼 유효성 검사 에러 — 즉시 토스트 — 양호
- 전역 ErrorBoundary 없음 — 예상치 못한 렌더링 오류 무방비

**빈 상태:**
- 카드 없음 — `HandPanel:149` "카드가 아직 없어요" — 양호
- 대기실 0명 — `WaitingRoom:55-58` 안내 텍스트 — 양호
- 베팅 패널 비활성 — 내 차례 아닐 때 `opacity-40` + `disabled` — 양호

**disabled 가드:**
- 베팅 액션 4개 모두 `disabled={!isMyTurn}` 처리 — 계약 "소프트 가드" 충족
- 카드 뒤집기 `disabled={!dealingComplete || isFlipped || card === null}` — 충족
- 다이 확인 다이얼로그 없음 — 계약 일치 (단일 클릭 즉시 처리)

**기타 개선 여지:**
- `PlayerSeat.tsx` 원형 배치 radius 220px 고정 — 2인~5인 모두 동일 반경, 5인 시 카드가 패널 경계에 근접 가능
- 모바일 grid-cols-2 배치(`GameTable.tsx:93`) — 5인 게임 시 2열×3행 불규칙 배치 발생 가능
- `BettingPanel.tsx` — `myChips`, `effectiveMaxBet` props 수신하지만 최대 베팅 한도 UI 미표시 (라인 32: `effectiveMaxBet` 파라미터 미사용). 잔액 초과 레이즈 시 서버 에러만 발생

---

## Registry 감사

`components.json` 존재 확인 (`shadcn_initialized: true`). UI-SPEC.md 레지스트리 테이블:
- shadcn official: button, badge, card, dialog, input, separator, sonner — 서드파티 없음
- 서드파티 레지스트리 0개

Registry 감사: 서드파티 블록 없음 — 건너뜀.

---

## 감사 대상 파일

**Pages:**
- `src/pages/RoomPage.tsx`
- `src/pages/MainPage.tsx`

**Layout Components:**
- `src/components/layout/GameTable.tsx`
- `src/components/layout/BettingPanel.tsx`
- `src/components/layout/HandPanel.tsx`
- `src/components/layout/InfoPanel.tsx`
- `src/components/layout/WaitingRoom.tsx`
- `src/components/layout/ResultScreen.tsx`
- `src/components/layout/ChatPanel.tsx`
- `src/components/layout/HandReferenceDialog.tsx`

**Game Components:**
- `src/components/game/PlayerSeat.tsx`
- `src/components/game/HwatuCard.tsx`
- `src/components/game/SharedCardDisplay.tsx`
- `src/components/game/ChipDisplay.tsx`

**Modals:**
- `src/components/modals/ShuffleModal.tsx`
- `src/components/modals/CutModal.tsx`
- `src/components/modals/DealerSelectModal.tsx`
- `src/components/modals/DealerResultOverlay.tsx`
- `src/components/modals/GollaSelectModal.tsx`
- `src/components/modals/SejangCardSelectModal.tsx`
- `src/components/modals/SejangOpenCardModal.tsx`
- `src/components/modals/GusaRejoinModal.tsx`
- `src/components/modals/GusaAnnounceModal.tsx`
- `src/components/modals/MuckChoiceModal.tsx`
- `src/components/modals/ModeSelectModal.tsx`

**Styles & Lib:**
- `src/index.css`
- `src/lib/cardImageUtils.ts`

---

## 부록: 파일별 빠른 수정 참조

| 파일 | 라인 | 문제 | 제안 |
|------|------|------|------|
| `BettingPanel.tsx` | 67 | `text-primary font-bold` 레이즈 금액 | `text-foreground font-semibold` |
| `BettingPanel.tsx` | 55 | `text-primary` "내 차례" 텍스트 | isMyTurn 강조는 BG/ring으로 충분, `text-foreground` |
| `InfoPanel.tsx` | 19,39 | `text-yellow-300` vs `text-yellow-500` 불일치 | 단일 토큰 통일 (예: CSS `--color-chip: hsl(48 90% 60%)` 추가) |
| `PlayerSeat.tsx` | 58 | `text-blue-400 font-bold` "[나]" | `text-primary font-semibold` (accent 예약 목록 내 허용) |
| `ChatPanel.tsx` | 4 | "채팅 (준비 중)" | "채팅은 다음 버전에서 제공됩니다" (계약 문구) |
| `RoomPage.tsx` | 520 | `grid-cols-[256px_1fr_512px]` | `grid-cols-[256px_1fr_320px]` (계약 256px, 현실적 최소 320px) |
| `GusaRejoinModal.tsx` | 51 | `text-red-500` | `text-destructive` |
| `ResultScreen.tsx` | 184-186 | `bg-green-600/bg-red-600` | `bg-primary/bg-destructive` 또는 토큰 추가 |
| `BettingPanel.tsx` | 32 | `effectiveMaxBet` 미사용 | 최대 베팅 한도 표시 추가 (UX 개선) |
| `MainPage.tsx` | 83 | 소켓 연결 중 버튼 활성화 | `socket` null 시 버튼 `disabled` 처리 |
