---
phase: quick-260405-ihi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/server/src/index.ts
  - packages/shared/src/types.ts
  - packages/client/src/store/gameStore.ts
  - packages/client/src/components/layout/ResultScreen.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "학교 대신 가주기 시 수혜자가 여러 명이어도 토스트가 1개만 뜨며, 후원자+수혜자 전원이 표시된다"
    - "ResultScreen 플레이어 카드에 대리출석 수혜자는 '대리출석' 배지가 표시된다"
    - "school-proxy SFX는 수혜자 본인에게만 재생된다"
  artifacts:
    - path: "packages/server/src/index.ts"
      provides: "proxy-ante-applied 단일 이벤트 (beneficiaryNicknames 배열)"
    - path: "packages/client/src/store/gameStore.ts"
      provides: "proxyBeneficiaryNicknames 상태 + 통합 토스트"
    - path: "packages/client/src/components/layout/ResultScreen.tsx"
      provides: "대리출석 배지 + SFX 수혜자 한정"
  key_links:
    - from: "packages/server/src/index.ts"
      to: "packages/client/src/store/gameStore.ts"
      via: "proxy-ante-applied 소켓 이벤트"
      pattern: "proxy-ante-applied.*beneficiaryNicknames"
---

<objective>
학교 대신 가주기(proxy-ante) 기능의 3가지 UX 버그를 수정한다:
1) 토스트 통합 — 여러 수혜자를 한 토스트로 묶기
2) 대리출석 배지 — ResultScreen 플레이어 카드에 표시
3) SFX 수혜자 한정 — school-proxy 효과음을 수혜자 본인에게만 재생

Purpose: 학교 대신 가주기 시 누가 누구를 대신 갔는지 명확히 알 수 있도록 UX 개선
Output: 서버 단일 이벤트 + 클라이언트 통합 토스트/배지/SFX 수정
</objective>

<execution_context>
@.planning/quick/260405-ihi-pot-2-css-sfx/260405-ihi-PLAN.md
</execution_context>

<context>
@packages/server/src/index.ts (라인 820-842: proxy-ante 핸들러)
@packages/client/src/store/gameStore.ts (전체: proxy-ante-applied 핸들러, 116-118행)
@packages/client/src/components/layout/ResultScreen.tsx (전체: SFX 핸들러 98-103행, 플레이어 카드 렌더링)
@packages/shared/src/types.ts (ServerToClientEvents 타입)

<interfaces>
<!-- gameStore.ts 현재 proxy-ante-applied 핸들러 (116-118행) -->
```typescript
socket.on('proxy-ante-applied', ({ sponsorNickname, beneficiaryNickname }) => {
  toast(`${sponsorNickname}님이 ${beneficiaryNickname}의 학교를 대신 가줬습니다`);
});
```

<!-- ResultScreen.tsx 현재 SFX 핸들러 (98-103행) -->
```typescript
useEffect(() => {
  if (!socket) return;
  const handler = () => { play('school-proxy'); };
  socket.on('proxy-ante-applied', handler);
  return () => { socket.off('proxy-ante-applied', handler); };
}, [socket]);
```

<!-- server/src/index.ts 현재 emit (831-841행) -->
```typescript
const sponsorNickname = socket.data.nickname;
for (const bid of beneficiaryIds) {
  const beneficiary = room.players.find(p => p.id === bid);
  if (beneficiary) {
    io.to(roomId).emit('proxy-ante-applied', {
      sponsorNickname,
      beneficiaryNickname: beneficiary.nickname,
    } as any);
  }
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 서버 단일 이벤트 + shared 타입 + gameStore 통합 토스트/상태</name>
  <files>
    packages/server/src/index.ts,
    packages/shared/src/types.ts,
    packages/client/src/store/gameStore.ts
  </files>
  <action>
**1) shared 타입 수정 (packages/shared/src/types.ts):**
- `ServerToClientEvents`의 `proxy-ante-applied` 이벤트 타입을 변경:
  - 기존: `{ sponsorNickname: string; beneficiaryNickname: string }`
  - 변경: `{ sponsorNickname: string; beneficiaryNicknames: string[] }`
  - 주의: 기존 `beneficiaryNickname` (단수) 필드 제거, `beneficiaryNicknames` (복수, 배열)로 교체

**2) 서버 수정 (packages/server/src/index.ts, 라인 831-841):**
- for 루프를 제거하고 단일 emit으로 교체:
```typescript
const sponsorNickname = socket.data.nickname;
const beneficiaryNicknames = beneficiaryIds
  .map(bid => room.players.find(p => p.id === bid)?.nickname)
  .filter((n): n is string => !!n);
if (beneficiaryNicknames.length > 0) {
  io.to(roomId).emit('proxy-ante-applied', {
    sponsorNickname,
    beneficiaryNicknames,
  });
}
```

**3) gameStore.ts 수정:**
- GameStore 인터페이스에 `proxyBeneficiaryNicknames: string[]` 상태 추가 (기본값 `[]`)
- `proxy-ante-applied` 핸들러 변경:
```typescript
socket.on('proxy-ante-applied', ({ sponsorNickname, beneficiaryNicknames }) => {
  // 통합 토스트: "홍길동님이 A, B의 학교를 대신 가줬습니다"
  const names = beneficiaryNicknames.join(', ');
  toast(`${sponsorNickname}님이 ${names}의 학교를 대신 가줬습니다`);
  // 대리출석 수혜자 추적 (ResultScreen 배지용)
  set(state => ({
    proxyBeneficiaryNicknames: [...new Set([...state.proxyBeneficiaryNicknames, ...beneficiaryNicknames])]
  }));
});
```
- `game-state` 핸들러에서 result phase를 벗어날 때 `proxyBeneficiaryNicknames: []` 초기화 (기존 `nextRoundVotedIds` 초기화와 동일 패턴, 69-76행):
```typescript
if (wasResult && !isResult) {
  set({ gameState: state, nextRoundVotedIds: [], proxyBeneficiaryNicknames: [] });
}
```
- `disconnect` 액션에서도 `proxyBeneficiaryNicknames: []` 추가 (134행)
  </action>
  <verify>
    <automated>cd D:/dev/sutda && npx tsc --noEmit -p packages/shared/tsconfig.json && npx tsc --noEmit -p packages/server/tsconfig.json && npx tsc --noEmit -p packages/client/tsconfig.json</automated>
  </verify>
  <done>
    - proxy-ante-applied 이벤트가 beneficiaryNicknames 배열을 포함하는 단일 이벤트로 발생
    - 토스트가 수혜자 전원을 한 줄로 표시
    - proxyBeneficiaryNicknames 상태가 추적되고 라운드 전환 시 초기화됨
    - TypeScript 컴파일 에러 없음
  </done>
</task>

<task type="auto">
  <name>Task 2: ResultScreen 대리출석 배지 + SFX 수혜자 한정</name>
  <files>packages/client/src/components/layout/ResultScreen.tsx</files>
  <action>
**1) SFX 수혜자 한정 (98-103행):**
- 기존 핸들러를 수정하여 수혜자 본인에게만 재생:
```typescript
useEffect(() => {
  if (!socket) return;
  const myNickname = myPlayer?.nickname;
  const handler = ({ beneficiaryNicknames }: { beneficiaryNicknames: string[] }) => {
    if (myNickname && beneficiaryNicknames.includes(myNickname)) {
      play('school-proxy');
    }
  };
  socket.on('proxy-ante-applied', handler);
  return () => { socket.off('proxy-ante-applied', handler); };
}, [socket, myPlayer?.nickname]); // eslint-disable-line react-hooks/exhaustive-deps
```
- 주의: 이벤트 페이로드가 Task 1에서 `beneficiaryNicknames` (배열)로 변경되었으므로 이에 맞춰 destructuring

**2) 대리출석 배지 (플레이어 카드 렌더링, 309행 부근):**
- useGameStore에서 `proxyBeneficiaryNicknames` 가져오기:
```typescript
const { socket, nextRoundVotedIds, proxyBeneficiaryNicknames } = useGameStore();
```
- 각 플레이어 카드의 닉네임 옆(310행, "학교" 뱃지와 같은 위치)에 대리출석 배지 추가:
```tsx
{proxyBeneficiaryNicknames.includes(player.nickname) && (
  <span className="text-[9px] px-1 py-0.5 rounded bg-blue-600/80 text-white font-medium">대리출석</span>
)}
```
- 이 배지는 isCardRevealPhase나 isRematchPending 여부와 무관하게 항상 표시 (대리출석은 라운드 시작 전 발생하므로)
- 위치: 기존 "학교" 뱃지 span 바로 앞에 배치 (닉네임 div 안, 309-313행 부근)
  </action>
  <verify>
    <automated>cd D:/dev/sutda && npx tsc --noEmit -p packages/client/tsconfig.json</automated>
  </verify>
  <done>
    - school-proxy SFX가 수혜자 본인에게만 재생됨
    - 대리출석 수혜자 플레이어 카드에 파란색 "대리출석" 배지가 표시됨
    - TypeScript 컴파일 에러 없음
  </done>
</task>

</tasks>

<verification>
1. TypeScript 컴파일: `npx tsc --noEmit` (shared, server, client 모두)
2. 기능 테스트 (수동):
   - 2인+ 게임에서 승자가 학교 대신 가주기 실행
   - 토스트가 수혜자 전원을 한 줄로 표시하는지 확인
   - 대리출석 수혜자에게 파란 배지가 표시되는지 확인
   - SFX가 수혜자에게만 재생되는지 확인
</verification>

<success_criteria>
- proxy-ante-applied 이벤트가 서버에서 1회만 emit (beneficiaryNicknames 배열)
- 토스트 1개로 통합: "홍길동님이 A, B의 학교를 대신 가줬습니다"
- ResultScreen에 "대리출석" 배지 표시 (수혜자만)
- school-proxy SFX가 수혜자 본인에게만 재생
</success_criteria>

<output>
완료 후 `.planning/quick/260405-ihi-pot-2-css-sfx/260405-ihi-SUMMARY.md` 생성
</output>
