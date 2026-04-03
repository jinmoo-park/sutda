# Phase 13: 부가기능 - Context

**수집일:** 2026-04-04
**상태:** 플래닝 준비 완료

<domain>
## Phase 경계

기리 인터랙션을 모든 플레이어에게 실시간 스트리밍하고, 게임 이벤트에 맞는 효과음과 배경음악을 삽입한다.
새로운 게임 로직이나 모드 추가는 이 페이즈의 범위 밖이다.

</domain>

<decisions>
## 구현 결정 사항

### 기리 실시간 스트리밍

- **D-01:** 동기화 범위는 **단계 전환만** — `split → tap → merging → done` 4단계 전환 시점에만 Socket.IO emit. 더미별 드래그 좌표나 실시간 포인터 위치는 브로드캐스트하지 않는다.
- **D-02:** `CutModal.tsx`는 `isTouchDevice` 분기로 **데스크탑(마우스 드래그)과 모바일(스와이프)이 근본적으로 다른 인터랙션**으로 구현되어 있다. 단계 전환 동기화는 두 방식 공통으로 작동해야 한다.
- **D-03:** 서버에 새 소켓 이벤트(`giri-phase-update`)를 추가하여 `{ phase: GiriPhase, piles: Pile[], tapOrder: number[] }`를 브로드캐스트. 기존 `cut` / `declare-ttong` 이벤트는 그대로 유지.

### 관전자 기리 UI

- **D-04:** 비기리 플레이어 화면에서 **더미 미러링** 표시 — `piles[]`와 `tapOrder`를 받아 기리 플레이어와 동일한 더미 레이아웃을 읽기 전용으로 표시.
- **D-05:** 탭 순서가 지정된 더미에는 번호 배지 표시. 현재 단계(`split`, `tap`, `merging` 등) 텍스트도 함께 표시.
- **D-06:** 기리 플레이어 이름을 상단에 표시 ("기리 중: [닉네임]"). 인터랙션 없는 순수 뷰.

### SFX 이벤트 매핑

- **D-07:** 플래너는 `sfx/sfx-mapping.md` 템플릿 파일을 생성한다. 이 파일에는 게임 이벤트 목록(콜, 레이즈, 다이, 체크, 카드배분, 셔플, 땡값, 학교대납, 칩 교환, 승리/결과공개)과 빈 파일명 칸이 있다. **사용자가 직접 파일명을 채워넣는다.**
- **D-08:** 구현 코드는 `sfx-mapping.md`가 아닌 `sfx/sfx-mapping.json`을 읽는다. 플래너는 `sfx-mapping.md` 작성 완료 후 JSON으로 변환하는 단계를 포함한다. (또는 별도 단계로 분리)
- **D-09:** SFX 파일은 `sfx/` 폴더에서 정적으로 서빙. 클라이언트에서 `new Audio()`로 재생. 이벤트 수신 시 즉시 재생.

### BGM 제어 UI

- **D-10:** 우상단 고정 위치에 **두 개의 아이콘 버튼** 배치:
  - BGM 버튼: 음악 노트 아이콘 (`♪`) — 배경음악 토글
  - SFX 버튼: 스피커 아이콘 (`🔊`) — 효과음 토글
- **D-11:** 각각의 음소거 상태는 `localStorage`에 저장(`sutda_bgm_muted`, `sutda_sfx_muted`). 새로고침 후에도 유지.
- **D-12:** BGM은 게임 진입 시 자동 재생 시도(브라우저 정책상 첫 인터랙션 후부터). 루프 재생.

### Claude's Discretion
- SFX 재생 볼륨 기본값 및 동시 재생 처리 방식 (동일 SFX 겹치면 새로 시작 vs 무시)
- `sfx-mapping.md` → JSON 변환 방식 (수동 작성 vs 스크립트)
- BGM 파일 선택 (`bgm.mp3` vs `bgm2.mp3` vs 둘 다 랜덤)

</decisions>

<canonical_refs>
## 정식 참조 문서

**다운스트림 에이전트는 플래닝/구현 전 반드시 읽을 것.**

### 기리 인터랙션
- `packages/client/src/components/modals/CutModal.tsx` — 기리 플레이어용 UI. `isTouchDevice` 분기로 데스크탑/모바일 인터랙션 분리 구현
- `packages/client/src/store/giriStore.ts` — 기리 상태(`GiriPhase`, `Pile`, `tapOrder`) — 전송할 데이터 구조의 원천
- `packages/client/src/pages/RoomPage.tsx` (line ~740) — 비기리 플레이어에게 현재 빈 Dialog만 표시하는 부분

### 소켓 프로토콜
- `packages/shared/src/types/protocol.ts` — 현재 `cut`, `declare-ttong` 이벤트 정의. 신규 이벤트 추가 시 여기에 타입 추가
- `packages/server/src/index.ts` — 소켓 핸들러 등록 위치

### SFX 에셋
- `sfx/` (루트) — 효과음/BGM 파일 폴더. 파일명 한글 포함

### 외부 스펙
- 외부 스펙 없음 — 결정 사항이 위 decisions에 완전히 캡처됨

</canonical_refs>

<code_context>
## 기존 코드 인사이트

### 재사용 가능한 에셋
- `useGiriStore` (giriStore.ts) — `GiriPhase`, `Pile`, `tapOrder` 타입이 전송 페이로드 구조로 바로 사용 가능
- `giriStore.splitAll()` — 관전자 쪽에서 서버로 받은 piles 상태를 초기화하는 데 활용 가능

### 기존 패턴
- 소켓 이벤트는 `packages/shared/src/types/protocol.ts` `ServerToClientEvents` / `ClientToServerEvents`에 타입 정의 후 서버 `index.ts`에 핸들러 등록
- 클라이언트 소켓 이벤트 수신은 `RoomPage.tsx` 내 `useEffect`에서 `socket.on(...)` 패턴 사용
- Zustand store 패턴: `packages/client/src/store/` 하위에 위치

### 통합 지점
- 관전자 UI: `RoomPage.tsx:742`의 빈 `<Dialog open={phase === 'cutting' && !isMyTurn}>` 교체
- BGM/SFX 버튼: 레이아웃 우상단 — `packages/client/src/components/layout/` 확인 필요
- SFX 트리거: 기존 소켓 이벤트 수신 위치(`RoomPage.tsx` `socket.on` 블록)에 훅 추가

</code_context>

<specifics>
## 구체적 요구사항

- 기리 단계 전환 동기화는 데스크탑과 모바일 **둘 다 동일하게** 작동해야 함 (다른 인터랙션이지만 단계는 공통)
- SFX 매핑은 코드에 하드코딩하지 않고 **`sfx-mapping.md` → 사용자 편집 → 구현 참조** 흐름으로
- BGM/SFX 버튼 아이콘: BGM = 음악 노트, SFX = 스피커 (각각 별도 토글)
- 음소거 상태 localStorage 키: `sutda_bgm_muted`, `sutda_sfx_muted`

</specifics>

<deferred>
## 보류된 아이디어

- 없음 — 논의가 페이즈 범위 내에서 진행됨

</deferred>

---

*Phase: 13-bonus-features*
*Context gathered: 2026-04-04*
