---
phase: 13
slug: bonus-features
status: ready
tasks: ["13-01", "13-02", "13-03"]
---

# Phase 13: 기리 실시간 스트리밍 + 관전자 UI

## 목적

기리(카드 나누기) 인터랙션을 모든 플레이어에게 실시간 스트리밍한다. 현재는 기리 플레이어만 CutModal을 보고, 나머지는 "기리 중" 텍스트만 표시된다. 이 Phase에서는 기리 플레이어의 단계 전환(split/tap/merging/done)과 더미 상태를 Socket.IO로 브로드캐스트하여, 관전자도 읽기 전용 더미 레이아웃을 실시간으로 볼 수 있게 한다.

> SFX/BGM 시스템은 Quick 260404-jn6에서 이미 완료됨. 이 Plan에서는 기리 탭 SFX 트리거만 추가.

---

<tasks>

<task id="13-01" type="auto">
  <name>소켓 프로토콜 타입 추가 + 서버 브로드캐스트 핸들러</name>
  <files>
    packages/shared/src/types/protocol.ts
    packages/server/src/index.ts
  </files>
  <action>
**1. protocol.ts 타입 추가 (D-01, D-03)**

`packages/shared/src/types/protocol.ts` 상단에 GiriPhase, Pile 타입을 import 없이 인라인 정의한다 (shared 패키지는 client의 zustand store를 참조할 수 없으므로):

```typescript
/** 기리 단계 (관전자 스트리밍용) */
export type GiriPhase = 'split' | 'tap' | 'merging' | 'done';

/** 기리 더미 정보 (관전자 스트리밍용) */
export interface GiriPile {
  id: number;
  cardCount: number;
  x: number;
  y: number;
}
```

`ClientToServerEvents` 인터페이스에 추가:
```typescript
'giri-phase-update': (data: {
  roomId: string;
  phase: GiriPhase;
  piles: GiriPile[];
  tapOrder: number[];
}) => void;
```

`ServerToClientEvents` 인터페이스에 추가:
```typescript
'giri-phase-update': (data: {
  phase: GiriPhase;
  piles: GiriPile[];
  tapOrder: number[];
  cutterNickname: string;
}) => void;
```

서버→클라이언트에는 `cutterNickname`을 추가하여 관전자가 누구의 기리인지 표시할 수 있게 한다.

**2. server/index.ts 핸들러 추가 (D-03)**

기존 `socket.on('cut', ...)` 핸들러 바로 위에 추가한다. 패턴은 기존 이벤트와 동일하게 `socket.on` + `io.to(roomId).emit`:

```typescript
socket.on('giri-phase-update', ({ roomId, phase, piles, tapOrder }) => {
  // 게임 로직 불필요 — 순수 UI 브로드캐스트
  io.to(roomId).emit('giri-phase-update', {
    phase,
    piles,
    tapOrder,
    cutterNickname: socket.data.nickname,
  });
});
```

이 핸들러는 `handleGameAction`을 사용하지 않는다. 게임 엔진 상태를 변경하지 않는 순수 UI 이벤트이므로, roomId 검증만으로 충분하다. `socket.data.nickname`은 join-room 시 이미 설정되어 있다.
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx turbo run build --filter=@sutda/shared --filter=@sutda/server</automated>
  </verify>
  <done>
    - protocol.ts에 GiriPhase, GiriPile 타입이 export됨
    - ClientToServerEvents에 'giri-phase-update' 이벤트 존재
    - ServerToClientEvents에 'giri-phase-update' 이벤트 존재 (cutterNickname 포함)
    - server/index.ts에 giri-phase-update 핸들러가 등록되어 io.to(roomId).emit으로 브로드캐스트
    - turbo build 성공
  </done>
</task>

<task id="13-02" type="auto">
  <name>CutModal 기리 단계 전환 시 socket.emit 추가</name>
  <files>
    packages/client/src/components/modals/CutModal.tsx
  </files>
  <action>
**CutModal.tsx 수정 (D-01, D-02)**

기리 플레이어가 단계를 전환할 때마다 `socket.emit('giri-phase-update', ...)` 을 호출한다. 데스크탑/모바일 두 경로 모두에서 동작해야 한다 (D-02).

**emit 헬퍼 함수 추가** (컴포넌트 내부, `emitCutResult` 함수 근처):

```typescript
function emitGiriUpdate(nextPhase: GiriPhase, currentPiles: Pile[], currentTapOrder: number[]) {
  socket?.emit('giri-phase-update', {
    roomId,
    phase: nextPhase,
    piles: currentPiles.map(p => ({ id: p.id, cardCount: p.cardCount, x: p.x, y: p.y })),
    tapOrder: currentTapOrder,
  });
}
```

참고: `GiriPhase`는 이미 `giriStore.ts`에서 import하고 있으므로 추가 import 불필요. protocol.ts의 GiriPhase와 동일한 리터럴 타입이므로 호환된다.

**emit 호출 위치 (4곳):**

1. **split 단계 — 더미가 변경될 때 (모바일 스와이프 완료 시)**
   `onUp` 함수 내부 터치 분기에서 `splitAll(newPiles)` 호출 직후:
   ```typescript
   play('giri');
   splitAll(newPiles);
   emitGiriUpdate('split', newPiles, []);
   ```
   오른쪽/왼쪽 스와이프 모두 동일하게 적용. 총 2곳 (swipeDir > 0, swipeDir < 0).

2. **split 단계 — 더미가 변경될 때 (데스크탑 드래그 드롭 시)**
   `onUp` 함수 내부 데스크탑 분기에서 `addSplitPile(...)` 호출 직후:
   ```typescript
   addSplitPile(pile.id, ps.cutCount, dropX, dropY);
   // addSplitPile은 zustand set이므로 즉시 반영되지 않음.
   // 대신 현재 piles로 새 더미를 수동 계산하여 emit
   const updatedPiles = [...piles];
   const idx = updatedPiles.findIndex(p => p.id === pile.id);
   if (idx !== -1) {
     updatedPiles[idx] = { ...updatedPiles[idx], cardCount: updatedPiles[idx].cardCount - ps.cutCount };
     const newId = Math.max(...updatedPiles.map(p => p.id)) + 1;
     updatedPiles.push({ id: newId, cardCount: ps.cutCount, x: dropX, y: dropY });
   }
   emitGiriUpdate('split', updatedPiles, []);
   ```

3. **tap 단계 — 더미 탭/언탭 시**
   `onUp` 함수 내부 탭 처리 부분 (모바일/데스크탑 공통). `tapPile(pile.id)` 또는 `untapPile(pile.id)` 호출 직후:
   ```typescript
   // 모바일 탭 (piles.length >= 2 분기)
   if (isAlreadyTapped) {
     untapPile(pile.id);
     emitGiriUpdate('tap', piles, tapOrder.filter(id => id !== pile.id));
   } else {
     tapPile(pile.id);
     emitGiriUpdate('tap', piles, [...tapOrder, pile.id]);
   }
   ```
   데스크탑 탭도 동일한 패턴 적용 (else 블록 내부 `piles.length >= 2` 분기).

4. **merging 단계 — "합치기" 버튼 클릭 시**
   JSX 내 `onClick` 핸들러:
   ```typescript
   <Button size="sm" disabled={!allTapped} onClick={() => {
     play('giri');
     setMerging();
     emitGiriUpdate('merging', piles, tapOrder);
   }}>
   ```

**주의사항:**
- `emitGiriUpdate`는 zustand의 비동기 상태 업데이트 전에 호출되므로, 인자로 "업데이트될 값"을 직접 전달한다 (zustand state를 읽으면 이전 값이 나옴).
- 퉁(ttong) 선언 시에는 기리 UI가 즉시 닫히므로 emit 불필요.
- `done` 단계는 `merging` useEffect의 타이머 완료 후 자동 전환되므로 별도 emit 불필요 — 관전자도 merging 애니메이션 후 Dialog가 닫힌다.
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx turbo run build --filter=@sutda/client</automated>
  </verify>
  <done>
    - CutModal.tsx에 emitGiriUpdate 헬퍼 함수 존재
    - 모바일 스와이프 (splitAll 후) emit 호출 2곳
    - 데스크탑 드래그 (addSplitPile 후) emit 호출 1곳
    - 탭/언탭 시 emit 호출 (모바일+데스크탑 각각)
    - 합치기 버튼 클릭 시 emit 호출 1곳
    - 클라이언트 빌드 성공
  </done>
</task>

<task id="13-03" type="auto">
  <name>SpectatorCutView 컴포넌트 + RoomPage 통합 + 기리 SFX</name>
  <files>
    packages/client/src/components/modals/SpectatorCutView.tsx
    packages/client/src/pages/RoomPage.tsx
  </files>
  <action>
**1. SpectatorCutView.tsx 신규 생성 (D-04, D-05, D-06)**

`packages/client/src/components/modals/SpectatorCutView.tsx` 생성:

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type GiriPhase = 'split' | 'tap' | 'merging' | 'done';

export interface SpectatorPile {
  id: number;
  cardCount: number;
  x: number;
  y: number;
}

interface SpectatorCutViewProps {
  open: boolean;
  cutterNickname: string;
  giriPhase: GiriPhase | null;
  piles: SpectatorPile[];
  tapOrder: number[];
}
```

Props 구조:
- `open`: Dialog 열림 상태
- `cutterNickname`: 기리 중인 플레이어 닉네임 (D-06)
- `giriPhase`: 현재 단계 (null이면 초기 대기)
- `piles`: 더미 배열 (읽기 전용 렌더링) (D-04)
- `tapOrder`: 탭 순서 배열 (D-05)

렌더링 구조:
- `<Dialog open={open} modal={false}>` + `<DialogContent className="max-w-md">` (CutModal과 동일 크기)
- `onInteractOutside`, `onEscapeKeyDown` 모두 `e.preventDefault()` (닫기 방지)
- 상단 `<DialogTitle>`: `"{cutterNickname}님이 기리 중입니다"` (D-06)
- 중앙: `position: relative` 컨테이너 (width: 100%, maxWidth: 360, height: 300) 안에 더미 렌더링
  - 각 더미: CutModal의 카드 스택 렌더링 로직과 동일하게 구현
    - `position: absolute`, `left: pile.x`, `top: pile.y`
    - 카드 이미지: `backgroundImage: 'url(/img/card_back.jpg)'`, `backgroundSize: 'cover'`
    - 카드 높이: `78 + (cardCount - 1) * 8` px (CARD_H=78, GAP=8)
    - 최대 5장까지만 시각적 스택 렌더링 (`Math.min(cardCount, 5)`)
    - 카드 크기: width 54px, height 78px, borderRadius 5px, left 3px
    - `pointer-events: none` (전체 컨테이너에 적용) — 인터랙션 없는 순수 뷰 (D-06)
  - 탭 순서 배지 (D-05): `tapOrder.indexOf(pile.id)` >= 0이면 표시
    - 24px x 24px 원형 (w-6 h-6), `bg-primary text-primary-foreground`
    - 위치: `-top-2 -right-2`, `position: absolute`, `z-index: 99`
    - 내용: `orderPos + 1` (1부터 시작)
    - 글자: `text-xs font-semibold`
  - 더미 아래 카드 수 표시: `{pile.cardCount}장` (text-center, text-[10px], text-muted-foreground)
- 하단: 단계 텍스트 (D-05)
  - split: "나누는 중" (text-primary)
  - tap: "탭 순서 지정 중" (text-primary)
  - merging: "합치는 중..." (text-primary)
  - done: "완료" (text-muted-foreground)
  - null (초기): "잠시만 기다려 주세요..." (text-muted-foreground)

merging 단계 애니메이션:
- CutModal과 동일한 CSS transition 적용 (더미들이 중앙으로 모이는 효과)
- `phase === 'merging'`이면 각 더미에 `opacity: 0`, `left: 180-30=150`, `top: 20` 으로 transition
- stagger: `(orderPos !== -1 ? orderPos : index) * 130` ms
- transition: `left 350ms cubic-bezier(0.42,0,0.58,1) {delay}ms, top 350ms ... , opacity 200ms ease {delay+280}ms`

**2. RoomPage.tsx 수정**

**import 추가:**
```typescript
import { SpectatorCutView } from '@/components/modals/SpectatorCutView';
import type { GiriPhase as ProtocolGiriPhase } from '@sutda/shared/types/protocol';
```

참고: `SpectatorCutView`에서 자체 타입을 export하므로, RoomPage에서는 protocol의 GiriPhase를 직접 사용해도 되고 SpectatorCutView의 것을 사용해도 된다. 편의상 인라인 타입으로 처리.

**state 추가** (기존 state 선언부, `sejangThirdCardDismissed` 근처):
```typescript
const [spectatorGiriState, setSpectatorGiriState] = useState<{
  phase: 'split' | 'tap' | 'merging' | 'done';
  piles: { id: number; cardCount: number; x: number; y: number }[];
  tapOrder: number[];
  cutterNickname: string;
} | null>(null);
```

**소켓 이벤트 핸들러 추가** (기존 `socket.on(...)` 블록 내부, 다른 이벤트 핸들러들과 나란히):
```typescript
socket.on('giri-phase-update', (data) => {
  // 기리 플레이어 본인은 CutModal을 직접 사용하므로 무시
  // isMyTurn 판별은 gameState 의존이라 클로저 문제가 있을 수 있으므로
  // 단순히 모든 수신 데이터를 저장하고, 렌더링 시 isMyTurn으로 분기
  setSpectatorGiriState({
    phase: data.phase,
    piles: data.piles,
    tapOrder: data.tapOrder,
    cutterNickname: data.cutterNickname,
  });
});
```

cleanup 함수에 `socket.off('giri-phase-update')` 추가.

**phase 변경 시 초기화:**
기존 `useEffect`에서 `gameState?.phase` 변경을 감지하는 곳 (또는 새 useEffect):
```typescript
useEffect(() => {
  if (gameState?.phase !== 'cutting') {
    setSpectatorGiriState(null);
  }
}, [gameState?.phase]);
```

**기리 SFX 트리거:**
`giri-phase-update` 수신 핸들러에서, 본인이 기리 플레이어가 아닐 때 phase 변경 시 SFX 재생:
```typescript
socket.on('giri-phase-update', (data) => {
  setSpectatorGiriState({ ... });
  // 기리 탭 SFX: split 단계(더미 나눠질 때)에 재생
  if (data.phase === 'split') {
    playSfx('giri');  // RoomPage에서 `const { play: playSfx } = useSfxPlayer()`로 이미 alias됨
  }
});
```

`playSfx`는 이미 RoomPage 상단에서 `const { play: playSfx } = useSfxPlayer()`로 alias되어 있음. 추가 import 불필요.

**Dialog 교체:**
RoomPage.tsx 라인 756 부근의 기존 빈 Dialog:
```tsx
{/* 기리 대기 — 본인 아닌 플레이어에게 표시 */}
<Dialog open={phase === 'cutting' && !isMyTurn} modal={false}>
  <DialogContent ...>
    ...기리 중...
  </DialogContent>
</Dialog>
```

이것을 `<SpectatorCutView>`로 교체:
```tsx
<SpectatorCutView
  open={phase === 'cutting' && !isMyTurn}
  cutterNickname={spectatorGiriState?.cutterNickname ?? currentPlayerNickname ?? ''}
  giriPhase={spectatorGiriState?.phase ?? null}
  piles={spectatorGiriState?.piles ?? []}
  tapOrder={spectatorGiriState?.tapOrder ?? []}
/>
```

`currentPlayerNickname`은 이미 RoomPage에 존재하므로 fallback으로 사용. spectatorGiriState가 아직 null이면 (첫 emit 전) 닉네임만 표시하고 더미는 비어있는 상태.

**Scissors import 제거 가능:**
기존 빈 Dialog에서 `<Scissors>` 아이콘을 사용했는데, SpectatorCutView가 이를 대체하므로 다른 곳에서 Scissors를 사용하지 않으면 import에서 제거. 단, 다른 곳에서 사용 여부를 확인할 것.
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx turbo run build --filter=@sutda/client</automated>
  </verify>
  <done>
    - SpectatorCutView.tsx 파일 생성됨, Dialog + 읽기 전용 더미 그리드 + 탭 순서 배지 + 단계 텍스트 표시
    - RoomPage.tsx에 spectatorGiriState useState 추가
    - socket.on('giri-phase-update') 핸들러 등록 + cleanup off
    - phase !== 'cutting' 전환 시 spectatorGiriState null 초기화
    - 기존 빈 Dialog가 SpectatorCutView로 교체됨
    - 기리 SFX (data.phase === 'split' 시 playSfx('giri')) 동작
    - 클라이언트 빌드 성공
  </done>
</task>

</tasks>

---

## 검증 계획

모든 태스크 완료 후:

1. **빌드 검증**: `cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx turbo run build`
2. **기능 테스트** (수동):
   - 브라우저 2개로 같은 방 접속
   - 플레이어 1이 기리 시작 → 플레이어 2 화면에 SpectatorCutView 열림 확인
   - 플레이어 1이 더미를 나눔 → 플레이어 2에 더미가 실시간 업데이트 확인
   - 플레이어 1이 탭 순서 지정 → 플레이어 2에 번호 배지 표시 확인
   - 플레이어 1이 합치기 클릭 → 플레이어 2에 merging 애니메이션 확인
   - 기리 완료 후 SpectatorCutView 자동 닫힘 확인
   - 관전자에게 기리 SFX 재생 확인
