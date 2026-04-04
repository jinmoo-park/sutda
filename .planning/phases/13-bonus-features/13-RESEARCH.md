# Phase 13: 부가기능 - Research

**리서치 날짜:** 2026-04-04
**도메인:** Socket.IO 상태 브로드캐스트 + 브라우저 오디오(Web Audio API / HTML Audio) + Vite 정적 에셋 서빙
**신뢰도:** HIGH (핵심 결정 사항은 기존 코드에서 직접 검증, 오디오 정책은 공식 MDN/Chrome 문서 기반)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 기리 실시간 스트리밍
- **D-01:** 동기화 범위는 단계 전환만 — `split → tap → merging → done` 4단계 전환 시점에만 Socket.IO emit. 실시간 포인터/드래그 좌표는 브로드캐스트하지 않는다.
- **D-02:** `CutModal.tsx`는 `isTouchDevice` 분기로 데스크탑/모바일이 다른 인터랙션으로 구현. 단계 전환 동기화는 두 방식 공통으로 작동해야 한다.
- **D-03:** 서버에 새 소켓 이벤트 `giri-phase-update` 추가. `{ phase: GiriPhase, piles: Pile[], tapOrder: number[] }` 브로드캐스트. 기존 `cut` / `declare-ttong` 이벤트는 그대로 유지.

#### 관전자 기리 UI
- **D-04:** 비기리 플레이어 화면에서 더미 미러링 표시 — `piles[]`와 `tapOrder`를 받아 기리 플레이어와 동일한 더미 레이아웃을 읽기 전용으로 표시.
- **D-05:** 탭 순서가 지정된 더미에는 번호 배지 표시. 현재 단계 텍스트도 함께 표시.
- **D-06:** 기리 플레이어 이름을 상단에 표시 ("[닉네임]님이 기리중입니다."). 인터랙션 없는 순수 뷰.

#### SFX 이벤트 매핑
- **D-07:** `sfx/sfx-mapping.md` 템플릿 파일을 생성. 사용자가 직접 파일명을 채워넣는다.
- **D-08:** 구현 코드는 `sfx/sfx-mapping.json`을 읽는다. `sfx-mapping.md` 완성 후 JSON으로 변환하는 단계 포함.
- **D-09:** SFX 파일은 `sfx/` 폴더에서 정적 서빙. 클라이언트에서 `new Audio()`로 재생. 이벤트 수신 시 즉시 재생.

#### BGM 제어 UI
- **D-10:** 우상단 고정 위치에 두 개의 아이콘 버튼: BGM (음악 노트 `♪`), SFX (스피커 `🔊`) — 각각 별도 토글.
- **D-11:** 음소거 상태 localStorage 키: `sutda_bgm_muted`, `sutda_sfx_muted`.
- **D-12:** BGM은 게임 진입 시 자동 재생 시도(첫 인터랙션 후). 루프 재생.

### Claude's Discretion
- SFX 재생 볼륨 기본값 및 동시 재생 처리 방식 (동일 SFX 겹치면 새로 시작 vs 무시)
- `sfx-mapping.md` → JSON 변환 방식 (수동 작성 vs 스크립트)
- BGM 파일 선택 (`bgm.mp3` vs `bgm2.mp3` vs 둘 다 랜덤)

### Deferred Ideas (OUT OF SCOPE)
- 없음 — 논의가 페이즈 범위 내에서 진행됨

</user_constraints>

---

## 요약

**기리 실시간 스트리밍**은 기존 Socket.IO 이벤트 패턴(`io.to(roomId).emit`)을 그대로 따르면 된다. `giri-phase-update` 이벤트는 `CutModal.tsx` 내부 `setMerging()` / `tapPile()` 호출 직후 emit하면 되고, 관전자 측은 `RoomPage.tsx`의 기존 `socket.on` 블록에 수신 핸들러를 추가하여 giriStore에 상태를 주입한다. **giriStore의 분리된 로컬/원격 상태 문제**가 핵심 pitfall이다 — 기리 플레이어의 로컬 인터랙션 흐름을 해치지 않으면서 관전자용 원격 상태를 주입하는 방법을 명확히 해야 한다.

**SFX/BGM**은 외부 라이브러리 없이 순수 HTML `Audio` 인터페이스로 구현한다(D-09 결정). 단, 브라우저 autoplay 정책으로 인해 BGM은 첫 사용자 인터랙션 이후에만 재생 가능하다. BGM 파일(bgm.mp3=17MB, bgm2.mp3=26MB)은 `<audio>` 스트리밍 방식으로 처리하면 전체 버퍼링 없이 재생 가능하고, SFX는 대부분 50~130KB로 초기 preload가 현실적이다.

**SFX 파일명에 한글/특수문자가 포함**되어 있으므로, 클라이언트에서 URL로 참조할 때 `encodeURIComponent`를 사용하고, 서버 정적 파일 서빙에서 URL decode 후 파일 경로 매핑이 필요하다.

**Primary recommendation:** giriStore를 건드리지 말고 관전자용 별도 Zustand slice(`spectatorGiriStore` 또는 RoomPage local state)에 서버 수신 상태를 저장한다. SFX는 `new Audio()` 인스턴스를 이벤트별로 미리 생성해 캐싱(Audio Pool 패턴)하고, BGM은 단일 `Audio` 인스턴스에 loop=true를 설정하되 `preload="none"`으로 즉시 스트리밍 시작한다.

---

## Standard Stack

### Core (이미 설치됨 — 추가 설치 불필요)

| 라이브러리 | 버전 | 용도 | 근거 |
|-----------|------|------|------|
| socket.io (서버) | ^4.x | giri-phase-update 브로드캐스트 | 기존 Socket.IO 서버 이벤트 패턴 그대로 |
| socket.io-client | ^4.8.3 | 클라이언트 이벤트 수신 | 이미 설치됨 |
| zustand | ^5.0.12 | 관전자 giri 상태 관리 | 기존 패턴 (giriStore 동일 방식) |
| Web Audio API (브라우저 내장) | — | BGM/SFX 재생 | 내장 API, 외부 라이브러리 불필요 |
| HTML Audio Element (브라우저 내장) | — | `new Audio()` SFX 재생 | D-09 결정 |

### 추가 설치 없음

D-09에서 `new Audio()`로 재생하도록 결정했으므로 `use-sound`, `howler` 등 외부 오디오 라이브러리는 설치하지 않는다.

**단, MIME 타입 추가 필요** (서버 index.ts):
```typescript
// packages/server/src/index.ts MIME 맵에 추가
'.mp3': 'audio/mpeg',
'.ogg': 'audio/ogg',
```

### 정적 에셋 서빙 방식

현재 서버(`packages/server/src/index.ts`)는 `packages/client/dist`만 서빙한다. `sfx/` 폴더는 프로젝트 루트에 있으므로 두 가지 방법 중 **방법 A를 권장**:

**방법 A (권장): `client/public/sfx/` 심볼릭 링크 또는 빌드 시 복사**
- Vite는 `public/` 폴더 내 파일을 빌드 시 `dist/`로 그대로 복사
- `sfx/` 파일을 `packages/client/public/sfx/`에 심볼릭 링크하거나 실제 파일 배치
- 클라이언트에서 `/sfx/파일명.mp3`로 직접 접근 가능

**방법 B: 서버에서 `/sfx/*` 경로 별도 처리**
- `packages/server/src/index.ts`에 sfx 전용 경로 핸들러 추가
- 배포 시 sfx 폴더가 서버 코드와 함께 있어야 함
- 방법 A보다 복잡, 배포 시 경로 관리 필요

**권장 이유:** 기존 이미지 에셋(`img/`)이 `client/public/img/`에 배치되어 Vite 빌드로 서빙되는 패턴과 일치.

---

## Architecture Patterns

### Pattern 1: 기리 단계 전환 시 서버 emit (클라이언트 → 서버 → 룸 전체)

**핵심 제약:** 기리 플레이어가 로컬에서 인터랙션하면서 동시에 단계 전환을 서버에 알린다. `CutModal.tsx`는 이미 `setMerging()`, `tapPile()` 등을 호출하는 시점이 명확하다 — 그 직후 `socket.emit('giri-phase-update', ...)` 추가.

**클라이언트 emit 위치 (CutModal.tsx):**
```typescript
// 더미 탭 완료 후 (tap 단계)
function handleTapPile(pileId: number) {
  tapPile(pileId);
  // giriStore에서 최신 상태를 읽어 emit
  const { piles, tapOrder } = useGiriStore.getState();
  socket?.emit('giri-phase-update', {
    roomId,
    phase: 'tap',
    piles,
    tapOrder: [...tapOrder, pileId], // pileId 추가 후 상태
  });
}

// 합치기 시작 시 (merging 단계)
function handleSetMerging() {
  setMerging();
  const { piles, tapOrder } = useGiriStore.getState();
  socket?.emit('giri-phase-update', {
    roomId,
    phase: 'merging',
    piles,
    tapOrder,
  });
}
```

**주의:** Zustand `set()` 이후 `useGiriStore.getState()`로 최신 상태를 동기적으로 읽을 수 있다.

**서버 브로드캐스트 패턴 (index.ts):**
```typescript
socket.on('giri-phase-update', ({ roomId, phase, piles, tapOrder }) => {
  // 기리 플레이어 포함 룸 전체에 브로드캐스트 (io.to = 발신자 포함)
  io.to(roomId).emit('giri-phase-update', { phase, piles, tapOrder });
});
```

**관전자 수신 (RoomPage.tsx `useEffect` 블록):**
```typescript
socket.on('giri-phase-update', ({ phase, piles, tapOrder }) => {
  if (!isMyTurn) {
    // 관전자만 giriStore 업데이트
    useGiriStore.getState().splitAll(piles);
    // phase와 tapOrder는 별도 로컬 state로 관리
    setSpectatorGiriPhase(phase);
    setSpectatorTapOrder(tapOrder);
  }
});
```

### Pattern 2: giriStore 로컬/원격 분리

**문제:** giriStore는 기리 플레이어의 로컬 인터랙션 상태다. 관전자가 서버에서 받은 `piles`로 `splitAll()`을 호출하면, 다음 판에서 기리 플레이어 역할을 맡은 사람이 이전 관전 상태로 오염될 수 있다.

**해결 방법 (권장):**
- 관전자용 상태를 giriStore에 넣지 않고 `RoomPage.tsx` 로컬 state로 관리
```typescript
// RoomPage.tsx
const [spectatorGiriState, setSpectatorGiriState] = useState<{
  phase: GiriPhase;
  piles: Pile[];
  tapOrder: number[];
} | null>(null);
```
- `phase === 'cutting' && !isMyTurn`일 때만 `spectatorGiriState`를 `GiriSpectatorDialog`에 전달
- `phase !== 'cutting'`으로 전환 시 `setSpectatorGiriState(null)` 초기화

### Pattern 3: 관전자 UI (GiriSpectatorDialog)

**현재 상태 (RoomPage.tsx:742):**
```tsx
<Dialog open={phase === 'cutting' && !isMyTurn} modal={false}>
  <DialogContent ...>
    <DialogTitle>기리 중</DialogTitle>
    <p>{currentPlayerNickname}님이 기리 중입니다</p>
    <p>잠시만 기다려 주세요…</p>
  </DialogContent>
</Dialog>
```

**변경 목표:** 위 빈 Dialog를 `GiriSpectatorDialog` 컴포넌트로 교체.

**권장 컴포넌트 구조:**
```tsx
// packages/client/src/components/modals/GiriSpectatorDialog.tsx
interface GiriSpectatorDialogProps {
  open: boolean;
  cutterNickname: string;
  giriPhase: GiriPhase;
  piles: Pile[];
  tapOrder: number[];
}

// - 상단: "기리 중: [닉네임]" (D-06)
// - 중앙: 더미 레이아웃 (CutModal의 displayPiles 렌더 로직 재사용)
// - 배지: tapOrder 기반 번호 배지 (D-05)
// - 하단: 현재 phase 텍스트 (split/tap/merging)
// - 인터랙션: onPointerDown, onPointerUp 없음 (읽기 전용)
```

**CutModal.tsx에서 재사용 가능한 코드:**
- `getFixedLayout()` 함수 — 공유 유틸로 추출
- 더미 카드 스택 렌더 로직 — 별도 `PileStack` 컴포넌트로 추출

### Pattern 4: SFX 재생 (Audio Pool 패턴)

**결정 D-09:** `new Audio()`로 재생.

**pitfall:** 동일한 `Audio` 인스턴스를 `.play()` 전에 `.currentTime = 0` 없이 재사용하면 한 번만 재생된다. 빠른 중복 재생 시(예: 콜 버튼 연타) 이전 재생이 완료될 때까지 재생이 안 된다.

**권장 패턴 — Audio 인스턴스 복제:**
```typescript
function playSfx(src: string) {
  if (sfxMuted) return;
  const audio = new Audio(src);
  audio.volume = 0.8;
  audio.play().catch(() => {
    // autoplay 차단 시 무시 (유저 인터랙션 후 재생 재시도 없음)
  });
}
```

**단순성 이유:** 각 호출마다 새 `Audio` 인스턴스 생성. SFX는 짧은 파일(<3초)이므로 메모리 부담 최소. `.play()` 직후 GC 대상이 되지 않도록 `audio.onended = () => {}` 불필요 (play() 중인 Audio는 GC 안 됨, [MDN 확인됨](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)).

### Pattern 5: BGM 루프 + autoplay 정책 처리

**브라우저 autoplay 정책 (Chrome/Safari):**
- `AudioContext`와 `HTMLAudioElement` 모두 사용자 인터랙션 없이 자동 재생 차단
- Chrome: 사용자가 페이지와 상호작용하면 자동 허용 (MEI 점수 기반)
- iOS Safari: 첫 터치 이벤트 이후에만 재생 가능

**권장 BGM 구현:**
```typescript
// useBgm.ts
export function useBgm() {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(
    () => localStorage.getItem('sutda_bgm_muted') === 'true'
  );

  const tryPlay = useCallback(() => {
    if (!bgmRef.current || muted) return;
    bgmRef.current.play().catch(() => {
      // autoplay 차단 시 무시 — 다음 인터랙션에서 재시도하지 않음
      // 사용자가 음소거 해제 토글을 누를 때 play() 재호출
    });
  }, [muted]);

  const toggle = useCallback(() => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem('sutda_bgm_muted', String(next));
    if (bgmRef.current) {
      if (next) bgmRef.current.pause();
      else bgmRef.current.play().catch(() => {});
    }
  }, [muted]);

  return { bgmRef, muted, toggle, tryPlay };
}
```

**BGM Audio 요소 설정:**
```typescript
bgmRef.current = new Audio('/sfx/bgm.mp3'); // 또는 bgm2.mp3
bgmRef.current.loop = true;
bgmRef.current.volume = 0.4; // BGM은 SFX보다 낮은 볼륨
```

### Pattern 6: 한글 파일명 URL 인코딩

**sfx 파일명 예시:** `콜.mp3`, `화투 섞기, 패 섞기.mp3`, `[영화_타짜] 쿵짝짝쿵짝짝 사쿠라 #shorts - 숏생숏사 (128k).mp3`

**sfx-mapping.json 구조:**
```json
{
  "call": "콜.mp3",
  "raise": "레이즈.mp3",
  "die": "죽어.mp3",
  "check": "체크.mp3",
  "deal": "패날아가는소리.mp3",
  "shuffle": "화투 섞기, 패 섞기.mp3",
  "ddangValue": "땡값.mp3",
  "school": "학교가자.mp3",
  "proxySchool": "대신학교.mp3",
  "win": "포인트, 두두둥탁, 드럼, 강조.mp3",
  "chip": "짤랑, 동전.mp3",
  "bgm": "bgm.mp3"
}
```

**클라이언트에서 URL 인코딩:**
```typescript
function sfxUrl(filename: string): string {
  return `/sfx/${encodeURIComponent(filename)}`;
}

// 사용: new Audio(sfxUrl('콜.mp3'))
// → new Audio('/sfx/%EC%BD%9C.mp3')
```

**서버에서 URL 디코딩 (index.ts):**
현재 서버 정적 파일 핸들러는 `req.url`을 그대로 `join(STATIC_DIR, url)`에 사용한다. `decodeURIComponent` 처리가 없으면 한글 파일명 요청이 실패한다.

**방법 A (public/sfx/ 배치)를 택하면:** Vite dev server와 빌드된 `dist/`는 URL decode를 자동 처리하므로 별도 처리 불필요. **단, 프로덕션 서버(index.ts) HTTP 핸들러에서는 `decodeURIComponent` 추가 필수.**

```typescript
// packages/server/src/index.ts readFile 전 URL decode 추가
const rawUrl = req.url?.split('?')[0] ?? '/';
const decodedUrl = decodeURIComponent(rawUrl); // 한글 파일명 대응
const filePath = decodedUrl === '/' || !extname(decodedUrl)
  ? join(STATIC_DIR, 'index.html')
  : join(STATIC_DIR, decodedUrl);
```

### Pattern 7: SFX 트리거 — 기존 socket.on 블록 활용

기존 `RoomPage.tsx`의 `socket.on('game-state', ...)` 핸들러에서 `phase` 전환을 감지하거나, 별도 SFX 전용 `useEffect`에서 `gameState.phase` 변화를 감지하여 재생.

```typescript
// RoomPage.tsx — SFX 트리거 예시
useEffect(() => {
  if (!gameState) return;
  const phase = gameState.phase;

  // 셔플 시작
  if (phase === 'shuffling' && prevPhaseRef.current !== 'shuffling') {
    playSfx(sfxUrl(sfxMapping.shuffle));
  }
  // 베팅 페이즈 진입 (카드 배분 완료)
  if (phase === 'betting' && prevPhaseRef.current === 'cutting') {
    playSfx(sfxUrl(sfxMapping.deal));
  }
}, [gameState?.phase]);
```

**베팅 액션 SFX (콜/레이즈/다이/체크):** `handleBetAction` 함수에서 emit 직전에 재생 또는 `game-state` 수신 후 `lastAction` 비교로 트리거.

---

## 기리 상태 일반화 (Giri State Generalization)

> 심화 리서치 결과. CutModal.tsx 코드 흐름 직접 추적 기반.

### 핵심 발견: split 단계 내부는 플랫폼마다 완전히 다르다

CutModal.tsx를 직접 추적한 결과, **더미 상태 변경 지점**은 다음과 같다:

| 지점 | 호출 함수 | 플랫폼 | 상태 변화 |
|------|-----------|--------|----------|
| 오른쪽 스와이프 완료 | `splitAll(newPiles)` | 모바일 전용 | piles 전체 교체 (CARD_DISTRIBUTIONS 기반 균등 분배) |
| 왼쪽 스와이프 완료 | `splitAll(newPiles)` | 모바일 전용 | piles 전체 교체 (더미 수 감소 = 롤백) |
| 드래그 드롭 완료 | `addSplitPile(id, count, x, y)` | 데스크탑 전용 | 기존 더미에서 차감 + 새 더미 추가 |
| 더미 탭 | `tapPile(pileId)` / `untapPile(pileId)` | 공통 | tapOrder 배열 변경 |
| 합치기 버튼 클릭 | `setMerging()` | 공통 | phase = 'merging' |
| 타이머 완료 (420ms+stagger) | `emitCutResult()` + `setDone()` | 공통 | 서버로 cut 이벤트 emit, phase = 'done' |

**결론:** D-01(단계 전환만 동기화) 결정 하에서, 관전자에게 보여줄 의미 있는 스냅샷이 필요한 시점은 **`setMerging()` 호출 시점 단 하나**다. 이 시점에 `piles`와 `tapOrder`가 모두 확정된다.

### 옵션 분석 결과

**옵션 A (매 상태 변경마다 전체 스냅샷):**
- split 단계 내 스와이프/드래그마다 emit → 관전자가 실시간으로 더미 분리 과정 시청 가능
- D-01 결정에 위배. 과도한 emit, 드래그 중 수십 번 발생 가능
- **채택 불가 (D-01 위반)**

**옵션 B (델타/diff 전송):**
- 추가된 더미 ID, 제거된 더미 ID만 전송
- 관전자 쪽에서 상태 재구성 로직 필요 → 복잡도 증가, 동기화 실패 시 복구 어려움
- 이 프로젝트 규모에서 오버엔지니어링
- **채택 불가 (복잡도 대비 이점 없음)**

**옵션 C (단계 전환 시점에만 스냅샷 — D-01 결정 유지):**
- `setMerging()` 버튼 onClick → 이 시점의 `piles`와 `tapOrder`가 최종 상태
- 관전자는 합치기 애니메이션 순간부터 동기화 시작
- split 단계 과정(더미 나누는 과정)은 관전자가 볼 수 없지만, 가장 중요한 최종 상태는 정확히 전달됨
- **채택 (D-01 결정 준수)**

### 롤백 상황에서 관전자 정확성 보장

**핵심 통찰:** 모바일 롤백(왼쪽 스와이프)은 `splitAll(newPiles)`로 piles를 완전 교체한다. 따라서 최종 `setMerging()` 시점의 `piles`는 롤백이 이미 반영된 확정 상태다. 관전자가 롤백 중간 과정을 볼 필요가 없다 — **`setMerging()` 시점의 단일 스냅샷으로 충분하다.**

```
기리 플레이어 흐름:
  split(1더미) → 스와이프→2더미 → 스와이프→3더미 → 롤백→2더미
  → 탭(더미A) → 탭(더미B) → [합치기 버튼]
                                      ↑
                              이 시점에만 emit
                              piles=[{id:0,count:10},{id:1,count:10}]
                              tapOrder=[0,1]

관전자가 받는 것:
  piles=[{id:0,count:10},{id:1,count:10}], tapOrder=[0,1], phase='merging'
  → 합치기 애니메이션을 동일하게 렌더
```

### emit 타이밍 — 정확한 위치

CutModal.tsx 497행의 "합치기" 버튼 onClick에서 `setMerging()` 직전 또는 직후:

```typescript
// CutModal.tsx 497행 버튼 onClick
onClick={() => {
  // 1. emit 전에 현재 piles, tapOrder를 로컬 변수로 캡처 (Pitfall 4 회피)
  const snapshot = {
    piles: [...piles],
    tapOrder: [...tapOrder],
  };
  // 2. store 업데이트
  setMerging();
  // 3. 서버로 브로드캐스트
  socket?.emit('giri-phase-update', {
    roomId,
    phase: 'merging' as GiriPhase,
    ...snapshot,
  });
}}
```

**이 위치를 택하는 이유:**
- `piles`와 `tapOrder`는 이미 컴포넌트 스코프에 destructure되어 있으므로 `getState()` 불필요
- `setMerging()`은 phase만 변경하고 piles/tapOrder는 건드리지 않으므로 캡처 순서 무관
- 버튼은 `allTapped` 조건(`piles.length > 1 && tapOrder.length === piles.length`)이 만족될 때만 활성화 — 불완전 상태 emit 불가능

### 관전자 화면에서 `merging` 애니메이션 렌더

관전자가 `giri-phase-update { phase: 'merging', piles, tapOrder }` 수신 시:
- `spectatorGiriState`를 업데이트하면 `GiriSpectatorDialog`가 리렌더
- CutModal.tsx의 `phase === 'merging'` 조건부 CSS 애니메이션(left/top transition + opacity)을 GiriSpectatorDialog에서도 동일하게 적용하면 관전자 화면에서 더미가 합쳐지는 애니메이션이 재생됨
- 애니메이션 지속 시간(420ms + stagger) 이후 `spectatorGiriState`를 null로 초기화 (또는 `phase` 변경 이벤트 수신 시)

### Socket.IO "UI state mirror" 패턴 참고

이 패턴은 단방향 상태 브로드캐스트로, 협업 UI에서 흔히 사용된다:
- **Figma multiplayer cursor 모델** (HIGH confidence 아님, 유사 사례): 로컬 상태는 본인이 관리, 변경 시점에 스냅샷 broadcast
- **Socket.IO 공식 패턴 — State synchronization**: `io.to(room).emit(event, state)` 형태로 방 전체에 현재 상태 emit. 클라이언트마다 받아서 로컬 뷰 갱신
- **본 프로젝트 기존 패턴** (`game-state` 이벤트): 서버가 게임 상태 변경 시 전체 state snapshot을 broadcast → giri-phase-update도 동일 패턴 적용

**결론: 기존 `game-state` broadcast 패턴과 동일한 구조. 신규 패턴 도입 불필요.**

---

## 오디오 성능 최적화 (Audio Performance)

> 심화 리서치 결과. sfx/ 폴더 실측값 기반.

### sfx/ 폴더 실측 파일 크기

```
bgm.mp3        17MB   — BGM (루프 재생)
bgm2.mp3       26MB   — BGM 대안
[영화_타짜]..mp3  909KB  — 타짜 테마 (SFX로 분류 여부 확인 필요)
화투 섞기..mp3   123KB  — 셔플 SFX
짤랑, 동전.mp3    89KB  — 칩 교환 SFX
포인트..드럼.mp3   78KB  — 승리 SFX
학교가자.mp3      56KB  — 학교대납 SFX
죽어.mp3          52KB  — 다이 SFX
레이즈.mp3        53KB  — 레이즈 SFX
체크.mp3          52KB  — 체크 SFX
콜.mp3            50KB  — 콜 SFX
대신학교.mp3      64KB  — 대신납 SFX
땡값.mp3          64KB  — 땡값 SFX
쉭, 퍽..mp3       15KB  — 기리 SFX
패날아가는소리.mp3  17KB  — 카드배분 SFX
```

**SFX 합계:** ~730KB. BGM 제외 시 전혀 문제없는 크기.
**BGM 합계:** 43MB (두 파일 합산) — 이것이 유일한 성능 우려 대상.

### new Audio() vs AudioContext + AudioBuffer 선택

**이 프로젝트에서 `new Audio()`가 정답인 이유:**

| 특성 | `new Audio()` (D-09 선택) | `AudioContext + AudioBuffer` |
|------|--------------------------|------------------------------|
| SFX 재생 지연 | 수십ms (preload 후 0에 가까움) | 거의 0 (decode 완료 후) |
| SFX 파일 수 10~15개 | 충분 | 오버엔지니어링 |
| BGM 17~26MB | 스트리밍 (`preload="none"` or `auto`) | 전체 decode 시 메모리 17~26MB 소비 |
| iOS Safari 제약 | 동일하게 적용 | 동일하게 적용 |
| 구현 복잡도 | 단순 | AudioContext 상태 관리 필요 |
| Web Worker 필요성 | 없음 (SFX < 1MB) | 대용량 decode 시 필요 |

**결론: D-09 결정이 이 규모에서 최적이다. AudioContext는 필요 없다.**

### 첫 번째 재생 지연(first-play latency) 해결

**문제:** `new Audio(src).play()`는 파일을 네트워크에서 받아온 뒤 재생하므로, 미리 로드하지 않으면 클릭 후 0.5~2초 지연이 발생한다.

**해결 — 게임방 입장 시 SFX preload:**

```typescript
// packages/client/src/hooks/useSfx.ts
// 앱 초기화가 아닌 '게임방 입장 시점'에 preload
// 이유: 게임방 밖에서는 SFX 불필요, 첫 인터랙션 후이므로 AudioContext 잠금 해제 상태

const audioCache = new Map<string, HTMLAudioElement>();

function preloadSfx(mapping: Record<string, string>) {
  Object.values(mapping).forEach((filename) => {
    if (filename.includes('bgm')) return; // BGM은 별도 처리
    const url = `/sfx/${encodeURIComponent(filename)}`;
    if (!audioCache.has(url)) {
      const audio = new Audio(url);
      audio.preload = 'auto'; // 브라우저에 preload 힌트
      audioCache.set(url, audio);
    }
  });
}
```

**preload 시점 선택:**
- 앱 초기화(App.tsx) — 너무 이르다. 게임을 시작하지 않을 사용자도 43MB+ 로드
- 게임방 입장 시 (RoomPage 마운트) — 권장. 게임 참가자만 로드, 이미 첫 인터랙션 완료
- lazy (이벤트 발생 직전) — 첫 재생 지연 해결 안 됨

**권장: RoomPage 마운트 시 SFX preload, BGM은 preload 안 함(스트리밍).**

### BGM 대용량 처리 — 스트리밍 방식

**bgm.mp3(17MB), bgm2.mp3(26MB) — 전체 버퍼링이 아닌 스트리밍 재생 필수.**

`new Audio()` (= `HTMLAudioElement`)는 기본적으로 HTTP Range Request를 통해 스트리밍 재생한다. `preload="none"`으로 설정하면 재생 전 불필요한 다운로드를 막을 수 있고, `play()` 호출 시 스트리밍 시작.

```typescript
const bgm = new Audio('/sfx/bgm.mp3');
bgm.preload = 'none';  // 재생 전 다운로드 안 함
bgm.loop = true;
bgm.volume = 0.4;
// play() 호출 시 스트리밍 시작 — 전체 17MB를 메모리에 올리지 않음
```

**`AudioContext + AudioBuffer`를 쓰면 안 되는 이유:** `AudioBuffer`는 파일 전체를 decode해서 메모리에 올린다. 17MB MP3 → decode 후 PCM 메모리 사용량은 약 180MB(스테레오 44.1kHz, 약 10분 분량). 모바일에서 치명적.

**`<audio loop>` vs `new Audio().loop`:** 동일한 HTMLAudioElement API. React 환경에서 `new Audio()`가 제어하기 쉬움.

### iOS Safari 재생 제약 — 실질적 한계

**제약 사항 (HIGH confidence — MDN/Apple 공식 문서):**

1. **autoplay 금지:** 사용자 제스처 없이 `play()` 호출 시 즉시 reject
2. **동시 재생 채널 수:** iOS Safari는 동시에 약 4개 Audio 스트림 가능. 초과 시 기존 재생 중단 또는 새 재생 실패
3. **백그라운드 탭:** iOS에서 탭을 전환하면 오디오 일시정지 (Web Audio API도 동일)
4. **AudioContext 잠금:** `AudioContext`는 사용자 인터랙션 이후 `resume()` 필요 (`new Audio()`는 제스처 후 play() 호출하면 자동 처리)

**이 프로젝트에서 동시 재생 한도 위험:**
- BGM(1채널) + SFX(동시 최대 2~3개) = 약 3~4채널
- 임계치 근처. 안전 마진을 위해 **BGM + SFX 동시 3개 이하** 유지
- SFX는 짧으므로(대부분 <3초) 실제로는 문제없음

**권장 처리:**
```typescript
// 새 SFX 재생 전 이전 재생 중인지 확인하지 않아도 됨
// iOS에서 4개 초과 시 새 재생은 자연스럽게 실패하므로 catch로 무시
audio.play().catch(() => {});
```

### SFX 음소거 상태 — Ref vs State

**pitfall:** SFX 재생 함수(`playSfx`)를 socket.on 콜백 안에서 쓰면 stale closure 문제가 발생한다. muted 상태가 React state면 클로저에 갇혀 항상 초기값을 읽는다.

**해결 — `useRef`로 muted 상태 관리:**
```typescript
// useSfx.ts
const sfxMutedRef = useRef(
  localStorage.getItem('sutda_sfx_muted') === 'true'
);

// toggle 시 ref와 localStorage 둘 다 업데이트
function toggleSfx() {
  const next = !sfxMutedRef.current;
  sfxMutedRef.current = next;
  localStorage.setItem('sutda_sfx_muted', String(next));
  // UI 리렌더를 위해 state도 병행 관리
  setSfxMuted(next);
}

// playSfx는 ref에서 읽음 → stale closure 없음
function playSfx(filename: string) {
  if (sfxMutedRef.current) return;
  // ...
}
```

### BGM 파일 선택 (Claude's Discretion 해결)

**bgm.mp3(17MB) vs bgm2.mp3(26MB) 선택:**
- bgm2.mp3는 9MB 더 크다 → 네트워크 비용 증가
- 두 파일 모두 스트리밍이므로 재생 시작 지연 차이는 없음
- **bgm.mp3 단독 사용 권장** (단순성, 용량 절약)
- 추후 랜덤 선택은 CONTEXT.md Deferred에 포함되지 않았으므로 보류

### 볼륨 기본값 및 동시 재생 처리 (Claude's Discretion 해결)

**볼륨:**
- BGM: `0.4` (배경음악은 SFX보다 낮게)
- SFX: `0.8` (게임 이벤트 알림이 명확하게 들려야 함)

**동시 재생 (동일 SFX 연타):** 매번 새 `Audio` 인스턴스 생성 패턴을 사용하면 자동으로 겹쳐 재생된다. 이 동작을 그대로 유지. 차단(무시)하는 것보다 겹쳐서 재생되는 것이 게임 UX에 자연스럽다 (예: 빠른 콜 연타 시 효과음 중첩).

---

## Don't Hand-Roll

| 문제 | 직접 구현 금지 | 대신 사용 | 이유 |
|------|---------------|----------|------|
| 오디오 라이브러리 | Howler.js, use-sound 래퍼 빌드 | `new Audio()` 직접 사용 (D-09) | D-09 결정 준수, 파일 수가 적어 라이브러리 오버헤드 불필요 |
| Socket.IO 룸 브로드캐스트 | 커스텀 pub/sub 구현 | `io.to(roomId).emit(...)` | 기존 패턴, 이미 코드베이스에서 사용 |
| 파일명 URL 인코딩 | 직접 hex 인코딩 | `encodeURIComponent()` / `decodeURIComponent()` | 브라우저/Node.js 내장 |
| giriStore 상태 동기화 | WebSocket CRDT, OT 알고리즘 | 단방향 서버 브로드캐스트 (D-01: 단계 전환만) | 실시간 포인터 동기화 없음, 단방향으로 충분 |
| BGM 페이드인/아웃 | Web Audio API GainNode | `audio.volume` 직접 설정 | BGM 볼륨 전환 애니메이션 불필요 |
| BGM 메모리 관리 | AudioBuffer + 커스텀 스트리밍 | `new Audio()` 기본 스트리밍 | HTMLAudioElement가 HTTP Range Request로 자동 스트리밍 |
| SFX 재생 지연 해결 | Service Worker prefetch | RoomPage 마운트 시 `audio.preload = 'auto'` | 단순하고 충분함, SFX 총합 730KB |

---

## Common Pitfalls

### Pitfall 1: giriStore 로컬/원격 상태 오염

**무슨 일이 생기나:** 관전자가 `giri-phase-update` 수신 시 `useGiriStore.getState().splitAll(piles)`를 호출하면, 다음 판에서 해당 플레이어가 기리 담당이 됐을 때 이전 관전 상태가 남아있다.

**원인:** giriStore가 싱글턴이라 모든 플레이어가 공유. `initSplit()`은 `CutModal`이 `open=true`될 때 호출되지만, 관전 중 오염된 상태가 애니메이션을 깨뜨릴 수 있다.

**방지:** 관전자 상태를 giriStore에 주입하지 말고 `RoomPage.tsx` 로컬 state(`spectatorGiriState`)에 저장. `GiriSpectatorDialog`에만 prop으로 전달.

### Pitfall 2: iOS Safari autoplay 차단

**무슨 일이 생기나:** BGM이 게임 진입 시 재생 안 됨. `audio.play()` Promise가 reject됨.

**원인:** iOS Safari는 사용자 제스처(touchstart, click) 없이 audio 재생 불가.

**방지:** 
- `audio.play()`를 항상 `.catch(() => {})` 로 감싸 에러 무시
- BGM은 첫 사용자 클릭 이후에 `tryPlay()` 호출 (joinRoom emit 버튼, 닉네임 입력 완료 버튼 등)
- 음소거 해제 토글 버튼이 사용자 제스처이므로 `toggle()` 내부에서 `play()` 재시도 가능

### Pitfall 3: 한글 파일명 서버 디코딩 누락

**무슨 일이 생기나:** 클라이언트가 `/sfx/%EC%BD%9C.mp3` 요청 → 서버가 `join(STATIC_DIR, '%EC%BD%9C.mp3')`로 파일 탐색 → 파일 없음 → 404

**원인:** 현재 `packages/server/src/index.ts`의 HTTP 핸들러가 URL decode를 하지 않는다 (MIME 맵에 `.mp3`도 없음).

**방지 (2가지 수정 필요):**
1. MIME 맵에 `'.mp3': 'audio/mpeg'` 추가
2. `const url = decodeURIComponent(req.url?.split('?')[0] ?? '/')` 적용

### Pitfall 4: split 단계에서 탭을 하기 전에 giri-phase-update emit 타이밍 오차

**무슨 일이 생기나:** `tapPile(pileId)`는 Zustand의 비동기 set()이 아니지만, 상태를 읽는 시점(`useGiriStore.getState()`)과 `set()` 완료 사이에 미묘한 타이밍 차이가 생길 수 있다.

**원인:** React 컴포넌트 내부에서 zustand `set()` 직후 `getState()`를 호출하면 일반적으로 최신 상태를 반환하지만, React batch update 중엔 주의가 필요.

**방지:** emit 시 giriStore에서 읽지 않고, 호출자가 알고 있는 값을 직접 인자로 전달:
```typescript
// tapPile 호출 후 tapOrder 업데이트는 기존 tapOrder + pileId
const newTapOrder = [...tapOrder, pileId];
tapPile(pileId); // store 업데이트
socket?.emit('giri-phase-update', { roomId, phase: 'tap', piles, tapOrder: newTapOrder });
```

### Pitfall 5: merging 애니메이션 도중 관전자 화면 불일치

**무슨 일이 생기나:** 기리 플레이어가 `setMerging()` → 420ms 후 `emitCutResult()` 하는 동안, 관전자는 `merging` 상태로 업데이트되지만 `cut` 이벤트보다 먼저 `game-state`가 도착해 상태가 충돌할 수 있다.

**방지:** 관전자 `GiriSpectatorDialog`는 `phase === 'cutting'` 동안만 표시. `cutting → betting` 전환 시 자동으로 닫히므로 사용자가 보는 화면은 항상 일관됨. merging 단계 시각적 표시만 있으면 충분.

### Pitfall 6: AudioBuffer로 BGM 로드 시 메모리 폭발 (신규)

**무슨 일이 생기나:** `AudioContext.decodeAudioData(bgm.mp3)`로 BGM을 로드하면 17MB MP3가 약 180MB PCM으로 decode되어 메모리에 상주한다. 모바일에서 탭 충돌 발생.

**원인:** `AudioBuffer`는 압축 해제된 PCM 데이터를 메모리에 올린다. 44.1kHz 스테레오 × 10분 = 약 180MB.

**방지:** BGM에 `AudioBuffer` 절대 사용 금지. `new Audio()` + `loop = true` + `preload = 'none'`을 사용하면 HTTP 스트리밍으로 자동 처리.

### Pitfall 7: SFX play 함수가 socket 콜백에서 stale muted 값 읽는 문제 (신규)

**무슨 일이 생기나:** `socket.on('game-state', ...)` 콜백 안에서 `if (sfxMuted) return;` 체크 시, React state의 `sfxMuted`는 항상 초기값(`false`)를 반환한다.

**원인:** `useEffect` 내 `socket.on` 등록 시점의 클로저가 state 초기값을 캡처한다. state가 변경돼도 클로저는 갱신되지 않는다(stale closure).

**방지:** muted 상태를 `useRef`로 관리하고 `ref.current`를 읽는다. ref는 클로저 안에서도 항상 최신 값을 반환.

### Pitfall 8: 합치기 버튼에서 emit 전 piles/tapOrder 캡처 누락 (신규)

**무슨 일이 생기나:** `setMerging()` 호출 후 `useGiriStore.getState()`로 읽으면 `phase`만 바뀌고 `piles`/`tapOrder`는 동일. 그러나 `setMerging` 구현을 확인하면 piles/tapOrder를 건드리지 않으므로 실제로는 안전하다. 하지만 향후 `setMerging`이 내부적으로 상태를 정리하도록 변경되면 버그가 된다.

**방지:** 버튼 onClick에서 `piles`, `tapOrder`를 스코프 변수에서 직접 읽어 emit. `getState()` 의존 없이 컴포넌트 스코프의 destructured 값을 사용.

---

## Code Examples

### giri-phase-update 타입 정의 (protocol.ts)

```typescript
// packages/shared/src/types/protocol.ts에 추가

// ClientToServerEvents에 추가:
'giri-phase-update': (data: {
  roomId: string;
  phase: GiriPhase;
  piles: Pile[];
  tapOrder: number[];
}) => void;

// ServerToClientEvents에 추가:
'giri-phase-update': (data: {
  phase: GiriPhase;
  piles: Pile[];
  tapOrder: number[];
}) => void;
```

**주의:** `GiriPhase`, `Pile`을 `shared` 패키지에서 export해야 한다. 현재 `giriStore.ts`(client 전용)에 정의됨 — `packages/shared/src/types/`로 이동 필요.

### 합치기 버튼 — 정확한 emit 위치 (CutModal.tsx)

```typescript
// CutModal.tsx 497행 버튼 onClick 수정
{piles.length > 1 && phase !== 'merging' && phase !== 'done' && (
  <Button
    size="sm"
    disabled={!allTapped}
    onClick={() => {
      // 컴포넌트 스코프의 piles, tapOrder 직접 캡처 (getState() 불필요)
      const pilesSnapshot = [...piles];
      const tapOrderSnapshot = [...tapOrder];
      setMerging();
      socket?.emit('giri-phase-update', {
        roomId,
        phase: 'merging' as GiriPhase,
        piles: pilesSnapshot,
        tapOrder: tapOrderSnapshot,
      });
    }}
  >
    합치기
  </Button>
)}
```

### sfx-mapping.json 예시

```json
{
  "call": "콜.mp3",
  "raise": "레이즈.mp3",
  "die": "죽어.mp3",
  "check": "체크.mp3",
  "deal": "패날아가는소리.mp3",
  "shuffle": "화투 섞기, 패 섞기.mp3",
  "ddangValue": "땡값.mp3",
  "school": "학교가자.mp3",
  "proxySchool": "대신학교.mp3",
  "win": "포인트, 두두둥탁, 드럼, 강조.mp3",
  "chip": "짤랑, 동전.mp3",
  "giri": "쉭, 퍽, 타격음, 채찍.mp3",
  "bgm": "bgm.mp3"
}
```

### useSfx hook — preload 포함 완성형

```typescript
// packages/client/src/hooks/useSfx.ts
import { useCallback, useEffect, useRef, useState } from 'react';

type SfxMapping = Record<string, string>;

const audioCache = new Map<string, HTMLAudioElement>();

function sfxUrl(filename: string): string {
  return `/sfx/${encodeURIComponent(filename)}`;
}

export function useSfx(mapping: SfxMapping | null) {
  // useRef로 관리 → stale closure 없음 (Pitfall 7 해결)
  const mutedRef = useRef(
    localStorage.getItem('sutda_sfx_muted') === 'true'
  );
  const [muted, setMuted] = useState(mutedRef.current);

  // 게임방 입장 시 SFX preload (Pitfall: first-play latency 해결)
  useEffect(() => {
    if (!mapping) return;
    Object.values(mapping).forEach((filename) => {
      if (!filename || filename.includes('bgm')) return;
      const url = sfxUrl(filename);
      if (!audioCache.has(url)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioCache.set(url, audio);
      }
    });
  }, [mapping]);

  const play = useCallback((eventKey: string) => {
    if (mutedRef.current || !mapping) return;
    const filename = mapping[eventKey];
    if (!filename) return;
    const audio = new Audio(sfxUrl(filename));
    audio.volume = 0.8;
    audio.play().catch(() => {});
  }, [mapping]);

  const toggle = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    localStorage.setItem('sutda_sfx_muted', String(next));
  }, []);

  return { play, muted, toggle };
}
```

### useBgm hook — 스트리밍 BGM 완성형

```typescript
// packages/client/src/hooks/useBgm.ts
import { useCallback, useEffect, useRef, useState } from 'react';

export function useBgm(src: string) {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(
    localStorage.getItem('sutda_bgm_muted') === 'true'
  );
  const [muted, setMuted] = useState(mutedRef.current);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'none'; // 재생 전 다운로드 안 함 → 17MB 즉시 로드 방지
    bgmRef.current = audio;
    return () => {
      audio.pause();
      bgmRef.current = null;
    };
  }, [src]);

  // 첫 인터랙션 이후 자동 재생 시도 (D-12)
  const tryPlay = useCallback(() => {
    if (!bgmRef.current || mutedRef.current) return;
    bgmRef.current.play().catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    localStorage.setItem('sutda_bgm_muted', String(next));
    if (bgmRef.current) {
      if (next) bgmRef.current.pause();
      else bgmRef.current.play().catch(() => {});
    }
  }, []);

  return { muted, toggle, tryPlay };
}

// 사용: useBgm('/sfx/bgm.mp3')
```

### 서버 브로드캐스트 패턴 (index.ts)

```typescript
// io.to() = 발신자 포함 룸 전체 브로드캐스트
socket.on('giri-phase-update', ({ roomId, phase, piles, tapOrder }) => {
  // 타입 검증 후
  io.to(roomId).emit('giri-phase-update', { phase, piles, tapOrder });
});
```

---

## State of the Art

| 구버전 패턴 | 현재 접근 | 비고 |
|-----------|----------|------|
| `new Audio()` 매번 생성 | 동일 (짧은 SFX에 적합) | 긴 파일엔 Audio Pool 권장 |
| `AudioContext.resume()` 직접 관리 | HTML Audio 사용 (D-09) | AudioContext는 복잡도 증가, 불필요 |
| WebSocket 모든 상태 브로드캐스트 | 단계 전환만 (D-01) | 실시간 포인터 동기화 불필요 |
| `AudioBuffer` BGM 전체 decode | `new Audio()` 스트리밍 | AudioBuffer는 메모리 폭발 위험 (Pitfall 6) |

**Deprecated/Outdated:**
- `createjs.Sound` (Flash 시대 오디오 라이브러리): 사용 금지
- `<audio>` HTML 태그를 React에서 직접 마운트하는 패턴: `new Audio()` 사용이 더 제어하기 쉬움

---

## Open Questions

1. **GiriPhase / Pile 타입을 shared로 이동 범위**
   - 현재: `packages/client/src/store/giriStore.ts`에 정의
   - 필요: `giri-phase-update` 타입을 `protocol.ts`에 추가하려면 `shared`에서 import 필요
   - 권장: `packages/shared/src/types/giri.ts`로 분리 후 `protocol.ts`에서 import

2. **sfx-mapping.json Vite 빌드 시 public 경로 접근**
   - `import sfxMapping from '/sfx/sfx-mapping.json'` 문법은 Vite에서 `public/` 폴더 내 JSON 파일을 동적으로 import할 수 없음 (public 파일은 URL로만 접근)
   - 권장: `fetch('/sfx/sfx-mapping.json')` 비동기 로드 or 빌드 시 포함 (`src/assets/`에 배치 후 `import`)
   - 가장 단순한 방법: `sfx-mapping.json`을 `packages/client/src/assets/sfx-mapping.json`에 두고 일반 `import`

3. **BGM 파일 선택 (해결됨 — Claude's Discretion)**
   - `bgm.mp3` 사용. `bgm2.mp3`(26MB)는 용량 낭비. 추후 옵션 추가는 보류.

4. **sfx 파일 공백/특수문자 포함 파일명의 공식 지원**
   - `화투 섞기, 패 섞기.mp3` 처럼 공백과 쉼표가 포함된 파일명
   - `encodeURIComponent` 적용 시 완전히 인코딩되므로 문제 없음 (검증됨)
   - 서버 `decodeURIComponent` 추가 필수

5. **`[영화_타짜]...mp3`(909KB) — SFX 또는 BGM 분류 (신규)**
   - 파일 크기 909KB — SFX 치고 크지만 BGM(17MB)보다 훨씬 작음
   - 타짜 테마곡으로 보임 — 게임 시작 시 또는 승리 시 단발 재생이라면 SFX로 처리 가능
   - BGM 역할이라면 loop 재생 필요 → sfx-mapping.json에서 사용자가 직접 분류 (D-07/D-08)
   - `new Audio()` 단발 재생 시 909KB는 preload 후 0 지연으로 재생 가능

---

## Environment Availability

| 의존성 | 필요 이유 | 사용 가능 | 버전 | 폴백 |
|--------|---------|---------|------|------|
| Web Audio API (브라우저) | BGM/SFX 재생 | ✓ | 모든 현대 브라우저 | HTML Audio Element (이미 D-09) |
| HTML Audio Element | SFX 재생 (D-09) | ✓ | 모든 현대 브라우저 | — |
| sfx/*.mp3 파일들 | SFX/BGM 에셋 | ✓ | 15개 파일, 총 ~44MB | — |
| Socket.IO 4.x | giri-phase-update 이벤트 | ✓ | ^4.8.3 | — |
| Zustand 5.x | spectatorGiriState 관리 | ✓ | ^5.0.12 | — |

**추가 설치 필요 없음.** 기존 스택으로 전체 구현 가능.

---

## Validation Architecture

### Test Framework

| 속성 | 값 |
|------|---|
| Framework | vitest ^3 |
| Config file | `packages/client/vitest.config.ts` |
| 빠른 실행 | `pnpm --filter @sutda/client test` |
| 전체 실행 | `pnpm test` (turbo) |

### Phase 요구사항 → 테스트 매핑

| 요구사항 | 동작 | 테스트 유형 | 자동화 명령 | 파일 존재 여부 |
|---------|------|-----------|------------|--------------|
| D-03 giri-phase-update 브로드캐스트 | 서버가 이벤트 수신 시 룸 전체에 emit | 통합 (smoke) | 수동 브라우저 2탭 테스트 | ❌ Wave 0 (선택) |
| D-04 관전자 더미 미러링 | GiriSpectatorDialog에 piles 렌더 | 단위 | `pnpm --filter @sutda/client test -- GiriSpectatorDialog` | ❌ Wave 0 |
| D-09 SFX 재생 | playSfx 호출 시 Audio 생성 | 단위 (mock) | `pnpm --filter @sutda/client test -- useSfx` | ❌ Wave 0 |
| D-11 localStorage 음소거 | 토글 후 localStorage 업데이트 | 단위 | `pnpm --filter @sutda/client test -- useBgm` | ❌ Wave 0 |
| 한글 파일명 URL 인코딩 | encodeURIComponent 정확성 | 단위 | `pnpm --filter @sutda/client test -- sfxUrl` | ❌ Wave 0 |

**실용적 접근:** 이 페이즈의 핵심 기능(오디오 재생, 소켓 브로드캐스트)은 jsdom 환경에서 완전 자동화가 어렵다. Wave 0에서 핵심 단위 테스트(URL 인코딩, localStorage 토글) 작성 후, 통합 테스트는 브라우저 2탭으로 수동 검증.

### Wave 0 갭

- [ ] `packages/client/src/hooks/__tests__/useSfx.test.ts` — SFX 재생 로직, mute 토글
- [ ] `packages/client/src/hooks/__tests__/useBgm.test.ts` — BGM localStorage 영속성
- [ ] `packages/client/src/components/modals/__tests__/GiriSpectatorDialog.test.tsx` — 더미 렌더

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — [Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- MDN Web Docs — [Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- Chrome for Developers — [Web Audio, Autoplay Policy and Games](https://developer.chrome.com/blog/web-audio-autoplay)
- Socket.IO 공식 문서 — [Broadcasting events](https://socket.io/docs/v4/broadcasting-events/)
- 기존 코드베이스 (`giriStore.ts`, `CutModal.tsx`, `RoomPage.tsx`, `protocol.ts`, `index.ts`) — 직접 검증
- `sfx/` 폴더 직접 측정 — `ls -lh` 실측값 (2026-04-04)

### Secondary (MEDIUM confidence)
- [use-sound GitHub](https://github.com/joshwcomeau/use-sound) — Howler.js 래퍼, D-09로 인해 채택 안 함
- [Audio for Web Games (MDN)](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games) — HTML Audio vs Web Audio 비교
- MDN — [HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement) — GC 동작, preload 속성

### Tertiary (LOW confidence)
- WebSearch 결과 — Vite 유니코드 파일명 처리 (GitHub 이슈에서 부분 확인, 공식 문서로 완전 검증 안 됨)

---

## Metadata

**신뢰도 분류:**
- giri 브로드캐스트 패턴: HIGH — 기존 Socket.IO 코드 직접 확인
- 기리 상태 일반화 (emit 타이밍): HIGH — CutModal.tsx 전체 코드 추적으로 직접 검증
- 관전자 UI 패턴: HIGH — 기존 ShuffleModal readOnly 패턴 참조 가능
- SFX/BGM 오디오 패턴: HIGH — MDN/Chrome 공식 문서 기반
- BGM 스트리밍 메모리 분석: HIGH — HTMLAudioElement 스펙 및 AudioBuffer 동작 원리 기반
- 오디오 파일 크기 분석: HIGH — `ls -lh` 실측값
- 한글 파일명 URL 처리: MEDIUM — `encodeURIComponent` 표준이나 서버 decode 누락 여부는 코드 검토로 확인
- sfx-mapping.json Vite 접근 방식: MEDIUM — public vs src/assets 차이는 별도 검증 권장

**리서치 날짜:** 2026-04-04
**유효기간:** 60일 (안정적인 스택)
