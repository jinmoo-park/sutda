---
phase: 11
slug: social-features
status: draft
shadcn_initialized: true
preset: "style=default, baseColor=slate, cssVariables=true"
created: 2026-04-01
---

# Phase 11 — UI Design Contract: 소셜/기능 완성

> Phase 11의 시각/인터랙션 계약서. gsd-ui-researcher가 생성하며, gsd-ui-checker가 검증한다.
> 6개 기능 영역을 대상으로 한다: 텍스트 채팅(UX-02), 게임 이력(HIST-01/02), 학교 대신 가주기(SCHOOL-PROXY), Observer 모드(LATE-JOIN), 세션 종료(SESSION-END), 올인 POT(ALLIN-POT).

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn | components.json 확인 |
| Preset | style=default, baseColor=slate, cssVariables=true | packages/client/components.json |
| Component library | Radix UI (shadcn 내장) | 기존 사용 확인 |
| Icon library | lucide-react | components.json `iconLibrary: "lucide"` |
| Font | KimjungchulMyungjo (Light 300 / Regular 400 / Bold 600~700) | src/index.css @font-face |

---

## Spacing Scale

4의 배수 기준 8포인트 스케일. 기존 컴포넌트(InfoPanel p-4, BettingPanel p-3, PlayerSeat p-2)에서 이미 사용 중인 값과 일치.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | 배지 내부 패딩 (px-1 py-0), 아이콘 갭 |
| sm | 8px | 채팅 메시지 행 간격, 인라인 요소 갭 |
| md | 16px | 패널 내부 기본 패딩 (p-4), 섹션 내부 여백 |
| lg | 24px | 섹션 패딩, ResultScreen gap-6 |
| xl | 32px | 모달 내부 여백 |
| 2xl | 48px | 대형 섹션 구분 |
| 3xl | 64px | 페이지 레벨 여백 |

예외 사항:
- 채팅 입력 필드 최소 높이: 40px (터치 타겟)
- Observer/올인 배지 패딩: px-1 py-0 (xs 유지, 기존 Badge 패턴 일치)

---

## Typography

기존 코드베이스에서 사용 중인 값 기준으로 정립 (ResultScreen, InfoPanel, BettingPanel, PlayerSeat 참조).

| Role | Size | Weight | Line Height | 용도 |
|------|------|--------|-------------|------|
| Body | 14px (text-sm) | 400 (Regular) | 1.5 | 채팅 메시지, 이력 항목 텍스트, 일반 안내 |
| Label | 12px (text-xs) | 400 (Regular) | 1.4 | 배지 라벨, 칩 금액 보조, 타임스탬프 |
| Heading | 20px (text-xl) | 600 (Bold) | 1.2 | 모달 제목, 결과 화면 승자 이름 |
| Caption | 10px (text-[10px]) | 400 (Regular) | 1.3 | 콤팩트 InfoPanel 레이블, Observer 인디케이터 텍스트 |

폰트 패밀리: `KimjungchulMyungjo, serif` (전체 공통 — index.css body 규칙)

---

## Color

기존 index.css `@theme inline` CSS 변수에서 직접 추출.

| Role | CSS Variable | HSL Value | Usage |
|------|-------------|-----------|-------|
| Dominant (60%) | `--color-background` | hsl(70 15% 8%) | 게임 테이블 배경, 모달 오버레이 배경 |
| Secondary (30%) | `--color-card` / `--color-secondary` | hsl(72 12% 13%) / hsl(72 12% 18%) | 채팅 패널 배경, 이력 모달 카드, Observer 시트 |
| Accent (10%) | `--color-primary` | hsl(75 55% 42%) | 아래 Accent 예약 요소 목록 참조 |
| Destructive | `--color-destructive` | hsl(0 72% 60%) | 연결 끊김 토스트 아이콘, 다이 배지 |
| Muted | `--color-muted-foreground` | hsl(70 10% 55%) | 채팅 타임스탬프, Observer "다음 판 합류" 텍스트 |

**Accent 예약 요소 (10% 내에서만 사용):**
- 채팅 전송 버튼 (Send 버튼 활성 상태)
- Observer 배지 "관람 중" 테두리 링
- 올인 배지 인디케이터 (PlayerSeat ring-primary 확장)
- 학교 대신 가주기 확인 버튼
- 이력 버튼 (시계 아이콘 + 텍스트, InfoPanel 내부)

**보조 시맨틱 색상:**
- 칩 증가: `text-green-600` / `bg-green-600` — 기존 ResultScreen green-600 패턴 유지
- 칩 감소: `text-red-600` / `bg-red-600` — 기존 ResultScreen red-600 패턴 유지
- 올인 상태 비활성화: `opacity-50` (베팅 패널) — 기존 `player.isAlive` opacity 패턴 확장

---

## 기능별 컴포넌트 계약

### UX-02: 텍스트 채팅 (ChatPanel.tsx 교체)

**레이아웃:**
- 데스크탑: 우사이드 패널 하단 영역 (기존 h-16 placeholder 영역 확장)
- 모바일: 하단 영역 탭 전환 (기존 Phase 10 레이아웃 유지)

**채팅 메시지 아이템:**
```
[닉네임] 14px bold  [타임스탬프] 12px text-muted-foreground
메시지 본문 14px text-foreground, max-width 100%, word-break: break-word
```
- 내 메시지: 우측 정렬, `bg-primary/10` 배경
- 상대 메시지: 좌측 정렬, `bg-card` 배경
- 메시지 아이템 패딩: px-3 py-1.5 (sm/md 조합)
- 메시지 목록 영역: 스크롤 가능, `overflow-y: auto`, 최신 메시지 자동 스크롤

**입력 필드:**
- shadcn `Input` 컴포넌트 (src/components/ui/input.tsx)
- 높이 40px (터치 타겟 최소값)
- 플레이스홀더: "메시지를 입력하세요"
- Enter 키 전송, Shift+Enter 줄바꿈 불가 (텍스트 전용 D-01)
- 전송 버튼: lucide `Send` 아이콘, `text-primary` (accent 예약 요소)
- 빈 입력 시 전송 버튼 disabled

**빈 상태:**
- 메시지 없음 시 중앙 텍스트: "아직 메시지가 없습니다"
- 색상: `text-muted-foreground`, 크기: text-sm (14px)

**인터랙션 상태:**
- 소켓 연결 끊김 시 입력 필드 disabled + 플레이스홀더: "채팅을 사용할 수 없습니다"

---

### HIST-01/02: 게임 이력 (InfoPanel 확장 + HistoryModal 신규)

**트리거 버튼 (InfoPanel 내부):**
- lucide `Clock` 아이콘 + "이력" 텍스트
- 크기: text-xs (12px), `text-muted-foreground`
- 호버: `text-foreground`
- 이력 없을 때: disabled, `opacity-50`

**모바일 트리거:**
- lucide `History` 아이콘 탭 버튼
- 크기: 24px 아이콘

**HistoryModal (Dialog 컴포넌트 활용):**
- shadcn `Dialog` (src/components/ui/dialog.tsx)
- 모달 제목: "게임 이력" (text-xl, weight 600)
- 모달 너비: 최대 480px (데스크탑), 전체 너비 (모바일)

**이력 항목 구조 (판 1개 = 1행):**
```
판 N    |  [승자 닉네임]  |  [족보명]  |  [판돈]원  |  [땡값 여부]
```
- 판 번호: text-xs text-muted-foreground
- 승자 닉네임: text-sm font-semibold
- 족보명: text-sm (ex. "장땡", "구삥")
- 판돈: text-sm tabular-nums text-yellow-500 (기존 칩 색상 패턴)
- 땡값 여부: "땡값 있음" Badge variant="secondary" text-xs

**빈 상태 (이력 없음):**
- 텍스트: "아직 이력이 없습니다"
- 색상: text-muted-foreground, text-sm

**HIST-02 정산 요약:**
- 게임 종료(finished phase) 시 동일 모달에서 전체 이력 표시
- 모달 상단에 "정산 요약" 섹션: 플레이어별 총 칩 증감 (chipDelta 누적)

---

### SCHOOL-PROXY: 학교 대신 가주기 (ResultScreen 확장)

**트리거 조건:** `myPlayerId === gameState.winnerId`일 때만 렌더

**UI 위치:** ResultScreen 하단 버튼 영역 (기존 "학교 가기" 버튼 아래)

**컴포넌트 구조:**
```
[학교 대신 가주기 (접기/펼치기 토글)]
  └─ 펼쳐진 상태:
       플레이어 A  [체크박스]
       플레이어 B  [체크박스]
       [확인] 버튼
```
- 토글 버튼: variant="ghost", text-sm
- 플레이어 행: flex items-center gap-2, text-sm
- 체크박스: shadcn 없음 → HTML `<input type="checkbox">` + Tailwind 스타일 (`accent-primary`)
- 선택된 항목: font-semibold
- 확인 버튼: variant="default" (primary 색상), text-sm
- 버튼 레이블: "대신 내주기"
- 아무도 선택 안 했을 때 확인 버튼: disabled

**토스트 알림 (수혜자 화면):**
- sonner 토스트 (src/components/ui/sonner.tsx)
- 메시지: "[닉네임]님이 학교를 대신 가줬습니다"
- duration: 4000ms
- 위치: 기존 sonner 설정 유지

---

### LATE-JOIN: Observer 모드 (PlayerSeat 확장)

**Observer 시트 표시 방식:**
- 플레이어 원형 바깥 영역에 별도 목록 렌더 (원형 배치에 포함되지 않음 — D-12)
- 위치: GameTable 우하단 고정 (데스크탑), 모바일은 게임 테이블 하단

**Observer 배지:**
- 기존 PlayerSeat의 Badge 패턴 확장
- 텍스트: "관람 중"
- variant: "outline", `border-primary text-primary` (accent 예약 요소)
- 크기: text-xs px-1 py-0 (기존 배지 패턴 일치)

**다음 판 합류 인디케이터:**
- 배지 아래 Caption: "다음 판 자동 합류"
- 크기: text-[10px] (Caption 타이포그래피)
- 색상: text-muted-foreground

**Observer 카드 표시:**
- 다른 플레이어 카드: 뒷면 유지 (`faceUp={false}`) — D-13

**인터랙션:**
- Observer 시트는 인터랙션 없음 (read-only)
- 판 교체 시 Observer 시트 사라지고 원형에 자연스럽게 합류 (애니메이션: 기존 deal-fly-in 패턴 재사용)

---

### SESSION-END: 세션 종료 표시

**연결 끊김 토스트:**
- sonner `toast.error()` 사용
- 메시지: "[닉네임]님 연결이 끊어졌습니다"
- duration: 5000ms
- 아이콘: lucide `UserX` (destructive 시맨틱)

**PlayerSeat 퇴장 처리:**
- 30초 이내 재접속 대기 중: 시트 유지 + `opacity-50` + "재접속 대기 중" Caption
- 30초 초과 퇴장 확정: 시트 제거 + 원형 재배치
- 원형 재배치 애니메이션: CSS `transition-all duration-300` (기존 스타일 활용)

**2인 게임 1명 퇴장 → WaitingRoom 전환:**
- 전환 전 토스트: "[닉네임]님이 퇴장했습니다. 대기실로 이동합니다"
- duration: 3000ms
- 자동 전환 (별도 버튼 없음)

---

### ALLIN-POT: 올인 상태 UI

**올인 배지 (PlayerSeat 확장):**
- 기존 배지 패턴에 추가
- 텍스트: "올인"
- variant: "outline", `border-primary text-primary` (accent 예약 요소)
- 크기: text-xs px-1 py-0

**올인 상태 베팅 패널:**
- isMyTurn이 true이더라도 `isAllIn={true}` prop 시 전체 패널 `opacity-50 pointer-events-none`
- 상태 텍스트: "올인 — 베팅 종료" (`text-muted-foreground`)
- 기존 `isMyTurn && ring-2 ring-primary` 강조 스타일 제거 (올인 시)

**POT 표시:**
- 단일 합산 POT만 표시 (D-23) — 현재 `gameState.pot` 값 그대로
- Main/Side pot 분리 없음
- 올인 플레이어 존재 시 POT 옆에 "올인 포함" Caption (text-[10px] text-muted-foreground)

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| 채팅 Primary CTA | "전송" (Send 아이콘 버튼) |
| 채팅 빈 상태 제목 | "아직 메시지가 없습니다" |
| 채팅 빈 상태 본문 | (없음 — 제목만 표시) |
| 채팅 비활성 | "채팅을 사용할 수 없습니다" |
| 채팅 입력 플레이스홀더 | "메시지를 입력하세요" |
| 이력 버튼 레이블 | "이력" (Clock 아이콘 함께) |
| 이력 모달 제목 | "게임 이력" |
| 이력 빈 상태 | "아직 이력이 없습니다" |
| 학교 대신 가주기 토글 | "학교 대신 가주기" |
| 학교 대신 가주기 확인 | "대신 내주기" |
| 학교 대신 가주기 토스트 | "[닉네임]님이 학교를 대신 가줬습니다" |
| Observer 배지 | "관람 중" |
| Observer 합류 예정 | "다음 판 자동 합류" |
| 세션 종료 토스트 | "[닉네임]님 연결이 끊어졌습니다" |
| 재접속 대기 Caption | "재접속 대기 중" |
| 2인 퇴장 전환 토스트 | "[닉네임]님이 퇴장했습니다. 대기실로 이동합니다" |
| 올인 배지 | "올인" |
| 올인 베팅 패널 상태 | "올인 — 베팅 종료" |
| 올인 POT Caption | "올인 포함" |
| 이력 없음 비활성 버튼 aria-label | "이력 없음" |

**파괴적 액션 없음.** Phase 11에는 영구 데이터 삭제나 되돌릴 수 없는 단일 액션이 없다. 학교 대신 가주기는 "확인" 버튼으로 1회성 실행이며, 체크박스 선택 후 버튼 누르기라는 2단계 구조가 확인 역할을 대신한다.

---

## 인터랙션 계약

### 채팅
- 스크롤 잠금: 새 메시지 도착 시 유저가 이미 맨 아래에 있으면 자동 스크롤. 위로 스크롤한 상태면 자동 스크롤 안 함.
- 메시지 최대 길이: 200자 (클라이언트 측 유효성 검사)
- 빠른 연속 전송 제한: 전송 버튼 클릭 후 500ms 동안 disabled (스팸 방지)

### 이력 모달
- Dialog 열기/닫기: shadcn Dialog open 상태 관리
- 이력 정렬: 최신 판이 상단 (역순 표시)
- 스크롤: 항목 6개 초과 시 `max-h-[60vh] overflow-y-auto`

### Observer 합류
- 원형 자동 합류 시 새 PlayerSeat 슬라이드 인: `transition-all duration-300 ease-out`

### 올인 감지
- `player.chips === 0 && player.isAlive` 조건으로 올인 배지 표시 (서버에서 isAllIn 플래그 제공 시 해당 플래그 우선)

---

## Registry Safety

| Registry | 사용 컴포넌트 | Safety Gate |
|----------|------------|-------------|
| shadcn official | Button, Input, Dialog, Badge, Separator, Sonner | 검증 불필요 |
| 신규 설치 필요 | (없음 — 모든 shadcn 컴포넌트 이미 설치됨) | 해당 없음 |
| 서드파티 레지스트리 | 없음 | 해당 없음 |

**shadcn 컴포넌트 설치 상태 확인:**
- button.tsx: 설치됨
- input.tsx: 설치됨
- dialog.tsx: 설치됨
- badge.tsx: 설치됨
- separator.tsx: 설치됨
- sonner.tsx: 설치됨

신규 설치 필요 컴포넌트: **없음.** 모든 필요 컴포넌트가 기존 코드베이스에 이미 존재한다.

---

## 업스트림 소스 추적

| 섹션 | Source |
|------|--------|
| Design System (tool, preset) | packages/client/components.json |
| Design System (font, CSS 변수) | packages/client/src/index.css |
| 채팅 레이아웃 위치 | 11-CONTEXT.md D-03, prior_decisions (Phase 6/10) |
| 채팅 내용 결정 | 11-CONTEXT.md D-01, D-02 |
| 이력 UI 위치 | 11-CONTEXT.md D-05, D-06 |
| Observer 배지/인디케이터 | 11-CONTEXT.md D-14 |
| Observer 카드 가시성 | 11-CONTEXT.md D-13 |
| 세션 종료 토스트 메시지 포맷 | 11-CONTEXT.md D-16, D-18 |
| 올인 배지/패널 비활성 | 11-CONTEXT.md D-20, D-21, D-23 |
| 학교 대신 가주기 트리거/토스트 | 11-CONTEXT.md D-08, D-09, D-10, D-11 |
| 색상 토큰 | packages/client/src/index.css @theme inline |
| 컴포넌트 패턴 (Badge, Button 사용) | PlayerSeat.tsx, ResultScreen.tsx, BettingPanel.tsx |
| 타이포그래피 스케일 | InfoPanel.tsx, PlayerSeat.tsx, ResultScreen.tsx에서 추출 |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
