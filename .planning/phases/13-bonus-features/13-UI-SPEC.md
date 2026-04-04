---
phase: 13
slug: bonus-features
status: draft
shadcn_initialized: true
preset: "style=default, baseColor=slate, cssVariables=true, iconLibrary=lucide"
created: 2026-04-04
---

# Phase 13 — UI 디자인 컨트랙트

> 프론트엔드 페이즈를 위한 비주얼 및 인터랙션 컨트랙트. gsd-ui-researcher가 생성하고 gsd-ui-checker가 검증한다.

---

## 디자인 시스템

| 속성 | 값 |
|------|-----|
| Tool | shadcn (기존 초기화 완료) |
| Preset | style=default, baseColor=slate, cssVariables=true |
| Component library | Radix UI (shadcn 내장) |
| Icon library | lucide-react |
| Font | Noto Serif KR (Google Fonts — 기존 적용됨) |

출처: `packages/client/components.json`, `packages/client/src/index.css`

---

## 스페이싱 스케일

4의 배수 원칙 준수. 기존 Tailwind utility class 그대로 사용.

| Token | 값 | 용도 |
|-------|-----|------|
| xs | 4px | 아이콘 내부 간격, 배지 패딩 |
| sm | 8px | 버튼 내부 패딩, 인라인 요소 간격 |
| md | 16px | 기본 요소 간격, 카드 패딩 |
| lg | 24px | 섹션 패딩, 모달 내부 |
| xl | 32px | 레이아웃 갭 |
| 2xl | 48px | 주요 섹션 구분 |
| 3xl | 64px | 페이지 레벨 스페이싱 |

예외 사항:
- BGM/SFX 토글 버튼: 최소 터치 타겟 44px × 44px (모바일 접근성)
- 더미 번호 배지: 24px × 24px 원형 고정 크기

출처: 기존 코드베이스 패턴 (GameTable, InfoPanel 등) 준수

---

## 타이포그래피

기존 코드베이스(`index.css`)에서 감지된 값으로 사전 채움.

| 역할 | 크기 | 굵기 | 줄높이 |
|------|------|------|--------|
| Body | 14px | 400 (regular) | 1.5 |
| Label | 12px | 400 (regular) | 1.4 |
| Heading | 16px | 600 (semibold) | 1.2 |
| Display (모달 타이틀) | 20px | 600 (semibold) | 1.2 |

주의: `Noto Serif KR` 폰트는 400/600 두 굵기만 사용한다. 다른 굵기(300, 700)는 이 페이즈에서 사용하지 않는다.

출처: `packages/client/src/index.css` body 기본값, 기존 컴포넌트 Tailwind 클래스 패턴

---

## 컬러 컨트랙트

`index.css` CSS 변수에서 추출한 기존 팔레트를 그대로 사용한다. 신규 색상을 추가하지 않는다.

| 역할 | 값 | 사용처 |
|------|-----|--------|
| Dominant (60%) | hsl(70 15% 8%) — `--color-background` | 전체 배경, 모달 배경 |
| Secondary (30%) | hsl(72 12% 13%) — `--color-card` | 관전자 기리 UI 컨테이너, 더미 카드 배경 |
| Accent (10%) | hsl(75 55% 42%) — `--color-primary` | BGM 버튼 활성 상태, SFX 버튼 활성 상태, 단계 텍스트 강조 |
| Destructive | hsl(0 72% 60%) — `--color-destructive` | 음소거 상태 표시 (버튼 비활성 시 적색 사선 오버레이 없음 — muted-foreground 사용) |

Accent 예약 사용처 (이 외에는 사용 금지):
1. BGM 토글 버튼 — 재생 중(활성) 상태의 아이콘 색상
2. SFX 토글 버튼 — 활성 상태의 아이콘 색상
3. 관전자 기리 UI — 현재 단계 텍스트 (`split / tap / merging / done`)

음소거(비활성) 상태: `--color-muted-foreground` (hsl(70 10% 55%)) 사용. Destructive 색상 사용 안 함.

출처: `packages/client/src/index.css` @theme 블록 전체

---

## 컴포넌트 인벤토리

### 신규 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|---------|------|------|
| `AudioControlBar` | `components/layout/AudioControlBar.tsx` | BGM + SFX 두 토글 버튼을 담는 컨테이너. `fixed top-4 right-4 z-50` |
| `SpectatorCutView` | `components/modals/SpectatorCutView.tsx` | 비기리 플레이어가 보는 더미 미러링 읽기 전용 UI |
| `useSfxPlayer` | `hooks/useSfxPlayer.ts` | Audio Pool 패턴 — 이벤트별 `Audio` 인스턴스 캐싱 및 재생 |
| `useBgmPlayer` | `hooks/useBgmPlayer.ts` | 단일 BGM `Audio` 인스턴스 관리, localStorage 연동 |

### 재사용 컴포넌트 (변경 없음)

| 컴포넌트 | 경로 | 이 페이즈 사용처 |
|---------|------|----------------|
| `Badge` | `components/ui/badge.tsx` | 더미 탭 순서 번호 배지 |
| `Dialog` | `components/ui/dialog.tsx` | 관전자 기리 UI를 감싸는 모달 (기존 빈 Dialog 교체) |
| `Button` | `components/ui/button.tsx` | BGM/SFX 토글 버튼 (variant="ghost", size="icon") |

---

## 인터랙션 컨트랙트

### 1. BGM/SFX 토글 버튼

**위치:** `fixed top-4 right-4 z-50` — 모든 화면에서 우상단 고정

**구조:**
```
<AudioControlBar>
  <Button variant="ghost" size="icon" aria-label="배경음악 켜기/끄기">
    <Music /> | <MusicOff />  (lucide 아이콘)
  </Button>
  <Button variant="ghost" size="icon" aria-label="효과음 켜기/끄기">
    <Volume2 /> | <VolumeX />  (lucide 아이콘)
  </Button>
</AudioControlBar>
```

**상태 전환:**
- 활성 (재생 중): 아이콘 색상 `text-primary` (accent), 배경 없음
- 비활성 (음소거): 아이콘 색상 `text-muted-foreground`, 배경 없음
- 전환 애니메이션: 없음 (즉시 전환)

**localStorage:**
- BGM 상태: `sutda_bgm_muted` — `"true"` / `"false"`
- SFX 상태: `sutda_sfx_muted` — `"true"` / `"false"`

출처: D-10, D-11 (CONTEXT.md)

---

### 2. 관전자 기리 UI (SpectatorCutView)

**트리거:** 비기리 플레이어가 `phase === 'cutting' && !isMyTurn`일 때 Dialog 오픈

**레이아웃:**
```
<Dialog>
  <DialogContent>
    <헤더> "[닉네임]님이 기리중입니다."   (14px, regular)
    <단계 표시> "현재 단계: [split|tap|merging|완료]"  (12px, accent 색상)
    <더미 그리드>
      각 더미 카드:
        - 배경: --color-card
        - 탭 순서 지정 시: 우상단에 Badge (숫자) 표시
        - 인터랙션: 없음 (pointer-events-none)
    </>
  </DialogContent>
</Dialog>
```

**배지 스타일:**
- 크기: 24px × 24px 원형
- 배경: `bg-primary` (accent)
- 텍스트: 12px, semibold, `text-primary-foreground`
- 위치: 더미 카드 우상단 `-top-2 -right-2`

**상태 목록:**
| GiriPhase | 표시 텍스트 | 텍스트 색상 |
|-----------|------------|------------|
| `split` | 나누는 중 | text-primary |
| `tap` | 탭 순서 지정 중 | text-primary |
| `merging` | 합치는 중 | text-primary |
| `done` | 완료 | text-muted-foreground |

출처: D-04, D-05, D-06 (CONTEXT.md)

---

### 3. SFX 이벤트 매핑

**재생 방식:** `new Audio(url)` 인스턴스를 이벤트별 미리 생성 (Audio Pool 패턴)

**볼륨 기본값:** 0.7 (Claude 재량 — CONTEXT.md Discretion)

**동시 재생 처리:** 동일 SFX가 겹치면 기존 인스턴스를 `currentTime = 0`으로 리셋 후 재생 (새로 시작). 무시하지 않는다.

**SFX 이벤트 매핑표:**

| 게임 이벤트 | 소켓 이벤트 / 트리거 | SFX 파일 (sfx-mapping.json 참조) |
|------------|---------------------|----------------------------------|
| 카드 배분 | `deal` | `패날아가는소리.mp3` |
| 셔플 | `shuffle` | `화투 섞기, 패 섞기.mp3` |
| 콜 | `bet` (call) | `콜.mp3` |
| 레이즈 | `bet` (raise) | `레이즈.mp3` |
| 다이 | `bet` (die) | `죽어.mp3` |
| 체크 | `bet` (check) | `체크.mp3` |
| 칩 교환/이동 | `round-result` | `짤랑, 동전.mp3` |
| 땡값 | `ddaeng-penalty` | `땡값.mp3` |
| 학교 대납 | `school-proxy` | `학교가자.mp3` |
| 결과 공개 | `round-result` (winner) | `포인트, 두두둥탁, 드럼, 강조.mp3` |
| 기리 탭 | `giri-phase-update` (tap) | `쉭, 퍽, 타격음, 채찍.mp3` |

주의: 최종 파일명은 `sfx/sfx-mapping.json`에서 읽는다. 위 표는 기본값이며 사용자가 `sfx-mapping.md`를 편집하여 덮어쓸 수 있다.

출처: D-07, D-08, D-09 (CONTEXT.md), `sfx/` 디렉토리 파일 목록

---

### 4. BGM 재생

**파일 선택:** `bgm.mp3`를 기본으로 사용 (Claude 재량 — bgm2.mp3보다 파일 크기 작아 초기 재생이 빠름)

**재생 설정:**
```typescript
const bgm = new Audio('/sfx/bgm.mp3');
bgm.loop = true;
bgm.preload = 'none';  // 스트리밍 방식 — 전체 버퍼링 없이 재생
bgm.volume = 0.4;      // BGM은 SFX보다 낮은 볼륨
```

**autoplay 정책 대응:** 게임 진입 직후 자동 재생 시도. 실패 시 첫 번째 사용자 인터랙션(클릭/터치) 이벤트 리스너에서 재생 재시도. 재시도 성공 시 리스너 제거.

출처: D-12 (CONTEXT.md)

---

## 카피라이팅 컨트랙트

| 요소 | 카피 |
|------|------|
| BGM 버튼 aria-label (활성) | "배경음악 끄기" |
| BGM 버튼 aria-label (비활성) | "배경음악 켜기" |
| SFX 버튼 aria-label (활성) | "효과음 끄기" |
| SFX 버튼 aria-label (비활성) | "효과음 켜기" |
| 관전자 기리 헤더 | "[닉네임]님이 기리중입니다." |
| 기리 단계: split | "나누는 중" |
| 기리 단계: tap | "탭 순서 지정 중" |
| 기리 단계: merging | "합치는 중" |
| 기리 단계: done | "완료" |
| SFX 로드 실패 (콘솔 경고) | `[SFX] 파일 로드 실패: {filename}` |
| BGM 재생 차단됨 (콘솔 info) | `[BGM] autoplay 차단됨 — 첫 인터랙션 후 재생 예정` |

빈 상태: 이 페이즈에는 빈 상태 UI 없음 — 기리 UI는 항상 서버에서 받은 상태를 표시한다.

파괴적 액션: 이 페이즈에는 파괴적 액션 없음.

출처: D-06 (CONTEXT.md), 기본값

---

## Registry Safety

| Registry | 사용 블록 | Safety Gate |
|----------|----------|-------------|
| shadcn official | Button, Badge, Dialog (기존 설치 완료) | 불필요 (공식 registry) |
| 서드파티 | 없음 | 해당 없음 |

서드파티 registry 미사용. Registry vetting gate 불필요.

출처: `packages/client/src/components/ui/` 디렉토리 확인

---

## 구현 노트 (Executor 참조용)

### 파일 경로 규칙
- SFX URL 생성 시 반드시 `encodeURIComponent(filename)` 적용 — 파일명에 한글/특수문자 포함
- 예: `new Audio('/sfx/' + encodeURIComponent('콜.mp3'))`

### AudioControlBar 배치
- `RoomPage.tsx` 최상단 레이아웃에 `<AudioControlBar />` 추가
- `z-50`으로 다른 모달/오버레이 위에 항상 표시
- 모바일 하단 베팅 패널과 겹치지 않도록 `top-4 right-4` 고정

### SpectatorCutView 통합 지점
- `RoomPage.tsx:742` 기존 빈 `<Dialog open={phase === 'cutting' && !isMyTurn}>` 을 `<SpectatorCutView>` 로 교체
- `giri-phase-update` 소켓 이벤트 수신 → spectatorGiriStore 업데이트 → SpectatorCutView 리렌더

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
