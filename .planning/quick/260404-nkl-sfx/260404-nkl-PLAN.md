---
phase: quick
plan: 260404-nkl
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/pages/RoomPage.tsx
  - packages/client/src/components/layout/ResultScreen.tsx
  - packages/client/src/components/layout/GameTable.tsx
  - packages/client/src/hooks/useSfxPlayer.ts
  - packages/client/public/sfx/bet-check.mp3
autonomous: false
requirements: []
must_haves:
  truths:
    - "동점 시 result 화면에서 족보를 확인한 뒤 '재경기' 버튼으로 직접 시작할 수 있다"
    - "내 베팅 차례가 오면 게임 테이블 중앙에 알림이 2초간 떴다가 사라진다"
    - "게임 중 현재 모드명이 판돈 패널 영역에 표시된다"
    - "체크 SFX가 새 파일(check.mp3)로 교체되어 있다"
    - "모든 SFX 파일의 재생 볼륨이 균일하다"
  artifacts:
    - path: "packages/client/src/pages/RoomPage.tsx"
      provides: "동점 재경기 UI 변경, 내턴 알림 토스트"
    - path: "packages/client/src/components/layout/GameTable.tsx"
      provides: "게임모드 표시 라벨"
    - path: "packages/client/src/hooks/useSfxPlayer.ts"
      provides: "SFX 볼륨 정규화 맵"
  key_links:
    - from: "RoomPage.tsx rematch-pending"
      to: "ResultScreen"
      via: "rematch-pending일 때 ResultScreen 렌더 + 재경기 버튼"
    - from: "GameTable.tsx"
      to: "gameState.mode"
      via: "모드 라벨 매핑 표시"
---

<objective>
4가지 UX 개선 사항을 한 번에 적용한다.

1. 동점 재경기: 별도 안내 페이지 대신 ResultScreen에서 족보를 보여주고 "학교가기" 대신 "재경기" 버튼 표시
2. 내턴 알림: 베팅 차례가 오면 GameTable 중앙에 2초 토스트
3. 게임모드 표시: 판돈 패널 영역에 현재 모드명 라벨
4. 체크 SFX 교체 + 전체 SFX 볼륨 균일화

Purpose: 게임 플레이 가독성과 피드백 개선
Output: 수정된 클라이언트 파일들, 교체된 SFX 파일
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/client/src/pages/RoomPage.tsx
@packages/client/src/components/layout/ResultScreen.tsx
@packages/client/src/components/layout/GameTable.tsx
@packages/client/src/hooks/useSfxPlayer.ts
@packages/client/src/components/layout/BettingPanel.tsx

<interfaces>
<!-- RoomPage.tsx 동점 재경기 관련 (line 604-632) -->
rematch-pending phase에서 현재 별도 화면(div)을 렌더하고 있음.
ResultScreen은 card-reveal/result phase에서만 렌더됨 (line 635, 691).
isRematch 플래그가 이미 존재: prevPhaseRef로 판별 (line 636).

<!-- GameTable.tsx 판돈 패널 (line 42-54 desktop, line 107-111 mobile) -->
데스크톱: 중앙 bg-background/60 패널에 "판돈" + pot 금액
모바일: 상단 한줄 "판돈" + pot 금액 (좌측 정렬 가능)

GameMode 타입: 'original' | 'three-card' | 'shared-card' | 'gollagolla' | 'indian'

<!-- useSfxPlayer.ts -->
SFX_MAP으로 키→파일명 매핑, audio.volume = 0.7 고정.
bet-check → bet-check.mp3 매핑.

<!-- ResultScreen.tsx -->
isCardRevealPhase에서는 버튼 미표시 (line 288).
result phase에서 "학교 가기" 버튼 표시 (line 310).
isRematch prop으로 재경기 이미지 오버레이 표시 (line 152-164).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 동점 재경기 플로우 변경 -- rematch-pending을 ResultScreen으로 통합</name>
  <files>
    packages/client/src/pages/RoomPage.tsx
    packages/client/src/components/layout/ResultScreen.tsx
  </files>
  <action>
**RoomPage.tsx:**
1. `rematch-pending` phase 분기 (line 604-632)의 별도 화면을 제거한다.
2. 대신 `isResultPhase` 조건에 `rematch-pending`을 추가한다:
   ```
   const isResultPhase = phase === 'result' || phase === 'finished' || phase === 'card-reveal' || phase === 'rematch-pending';
   ```
3. ResultScreen에 `isRematchPending` prop을 추가로 전달한다:
   ```
   isRematchPending={phase === 'rematch-pending'}
   ```
4. isRematch 판별 조건에서 `rematch-pending`은 이미 포함되어 있으므로 그대로 유지.

**ResultScreen.tsx:**
1. `ResultScreenProps`에 `isRematchPending?: boolean` 추가.
2. `isRematchPending`이 true일 때:
   - 모든 플레이어의 카드와 족보를 표시한다 (기존 result 렌더링과 동일).
   - 헤더를 "동점!" 으로 표시 (기존 `{winnerNickname} 승리!` 대신).
   - 하단 버튼 영역에서 "학교 가기" 버튼 대신 "재경기" 버튼을 표시한다.
   - "재경기" 버튼 클릭 시 `socket?.emit('start-rematch', { roomId })` 호출.
   - 동점자(amTied)만 재경기 버튼 표시, 비동점자는 "재경기 대기 중..." 텍스트 표시.
   - 이미 확인한 플레이어(alreadyConfirmed)는 "다른 플레이어를 기다리는 중..." 표시.
3. gameState에서 tiedPlayerIds, rematchConfirmedIds를 읽어야 하므로 기존 prop gameState 활용.
4. 칩변동(chipDelta)은 rematch-pending에서 표시하지 않는다 (아직 승패 미결정).
5. 땡값/승리/패배 SFX도 rematch-pending에서는 재생하지 않는다 (기존 phase === 'result' 조건 유지).
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>동점 시 족보가 보이는 결과 화면에서 "재경기" 버튼으로 재경기를 시작할 수 있다. 별도 안내 페이지 제거됨.</done>
</task>

<task type="auto">
  <name>Task 2: 내 베팅 차례 중앙 알림 + 게임모드 표시</name>
  <files>
    packages/client/src/pages/RoomPage.tsx
    packages/client/src/components/layout/GameTable.tsx
  </files>
  <action>
**RoomPage.tsx -- 내 턴 알림:**
1. 베팅 phase에서 isMyTurn이 true로 변경될 때 GameTable 중앙에 토스트 알림을 표시한다.
2. 새 state 추가: `const [showMyTurnAlert, setShowMyTurnAlert] = useState(false);`
3. useEffect로 isMyTurn 변경 감지:
   ```
   useEffect(() => {
     const isBettingPhase = ['betting', 'betting-1', 'betting-2'].includes(phase);
     if (isBettingPhase && isMyTurn && dealingComplete) {
       setShowMyTurnAlert(true);
       const timer = setTimeout(() => setShowMyTurnAlert(false), 2000);
       return () => clearTimeout(timer);
     } else {
       setShowMyTurnAlert(false);
     }
   }, [isMyTurn, phase, dealingComplete]);
   ```
4. `showMyTurnAlert` prop을 GameTable에 전달.

**GameTable.tsx -- 중앙 알림 렌더링:**
1. GameTableProps에 `showMyTurnAlert?: boolean` 추가.
2. 데스크톱 중앙 팟 표시 위에 (z-20, absolute, pointer-events-none) 알림 div 렌더:
   ```
   {showMyTurnAlert && (
     <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
       <div className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-lg font-bold shadow-lg animate-in fade-in zoom-in duration-300">
         내 차례!
       </div>
     </div>
   )}
   ```
3. animate-in은 tailwindcss-animate에서 제공. fade-out은 showMyTurnAlert가 false가 되면 unmount로 처리.

**GameTable.tsx -- 게임모드 표시:**
1. 모드명 매핑 상수 추가:
   ```
   const MODE_LABELS: Record<string, string> = {
     'original': '오리지날',
     'three-card': '세장',
     'shared-card': '한장공유',
     'gollagolla': '골라골라',
     'indian': '인디언',
   };
   ```
2. 데스크톱 판돈 패널 (line 44-49) 내 "판돈" 텍스트 위에 모드 라벨 추가:
   ```
   {mode && <p className="text-[10px] text-primary font-medium tracking-wider">{MODE_LABELS[mode] ?? mode}</p>}
   ```
3. 모바일 판돈 한줄 (line 107-110)에서 "판돈" 텍스트 좌측에 모드 라벨 추가:
   ```
   <span className="text-[10px] text-primary font-medium mr-1">{MODE_LABELS[mode ?? ''] ?? ''}</span>
   ```
   모바일에서는 판돈 좌측에 표시.
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>내 베팅 차례에 게임 테이블 중앙에 "내 차례!" 알림이 2초간 표시된다. 판돈 패널에 현재 게임모드가 표시된다.</done>
</task>

<task type="auto">
  <name>Task 3: 체크 SFX 교체 + 전체 SFX 볼륨 균일화</name>
  <files>
    packages/client/public/sfx/bet-check.mp3
    packages/client/src/hooks/useSfxPlayer.ts
  </files>
  <action>
**체크 SFX 교체:**
1. `check.mp3` (프로젝트 루트)를 `packages/client/public/sfx/bet-check.mp3`로 복사하여 교체:
   ```bash
   cp check.mp3 packages/client/public/sfx/bet-check.mp3
   ```

**SFX 볼륨 균일화:**
ffmpeg가 설치되어 있지 않으므로 코드 레벨에서 개별 SFX 볼륨을 조정한다.

1. `useSfxPlayer.ts`의 SFX_MAP 구조를 `{ file: string; volume: number }` 형태로 변경한다:
   ```typescript
   interface SfxEntry { file: string; volume: number; }
   const SFX_MAP: Record<string, SfxEntry> = {
     'shuffle':              { file: 'shuffle.mp3',              volume: 0.7 },
     'giri':                 { file: 'giri.mp3',                 volume: 0.7 },
     'deal':                 { file: 'deal.mp3',                 volume: 0.7 },
     'flip':                 { file: 'flip.mp3',                 volume: 0.5 },
     'chip':                 { file: 'chip.mp3',                 volume: 0.5 },
     'bet-check':            { file: 'bet-check.mp3',            volume: 0.7 },
     'bet-call':             { file: 'bet-call.mp3',             volume: 0.7 },
     'bet-raise':            { file: 'bet-raise.mp3',            volume: 0.7 },
     'bet-die':              { file: 'bet-die.mp3',              volume: 0.7 },
     'card-reveal':          { file: 'card-reveal.mp3',          volume: 0.6 },
     'win-normal':           { file: 'win-normal.mp3',           volume: 0.6 },
     'win-ddaeng':           { file: 'win-ddaeng.mp3',           volume: 0.6 },
     'lose-normal':          { file: 'lose-normal.mp3',          volume: 0.6 },
     'lose-ddaeng-penalty':  { file: 'lose-ddaeng-penalty.mp3',  volume: 0.6 },
     'lose-ddaeng-but-lost': { file: 'lose-ddaeng-but-lost.mp3', volume: 0.6 },
     'school-go':            { file: 'school-go.mp3',            volume: 0.7 },
     'school-proxy':         { file: 'school-proxy.mp3',         volume: 0.7 },
   };
   ```
2. `play()` 함수에서 `audio.volume = 0.7` 하드코딩을 `audio.volume = entry.volume`으로 변경.
3. 볼륨 값 기준:
   - 짧은 UI 효과음(flip, chip): 0.5 (상대적으로 큰 소리이므로 낮춤)
   - 결과 알림(win/lose 계열, card-reveal): 0.6 (중간)
   - 베팅/행동/배경(shuffle, giri, deal, bet-*, school-*): 0.7 (기본)
4. 실제 배포 후 사용자 피드백으로 미세 조정 가능하도록 볼륨 값을 명시적 상수로 관리.

NOTE: 정확한 볼륨 균일화는 각 파일의 실제 라우드니스를 측정해야 하지만, ffmpeg 미설치 환경이므로 SFX 카테고리별 상대 볼륨으로 1차 균일화한다. 이후 필요 시 ffmpeg loudnorm으로 파일 레벨 정규화 가능.
  </action>
  <verify>
    <automated>cd "C:/Users/Jinmoo Park/Desktop/sutda" && npx tsc --noEmit --project packages/client/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>체크 SFX가 새 파일로 교체되었고, 모든 SFX의 볼륨이 카테고리별로 균일하게 설정되었다.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    1. 동점 재경기: 패 오픈 후 족보가 보이는 결과 화면에서 직접 "재경기" 버튼 클릭
    2. 내 턴 알림: 베팅 차례 시 중앙에 "내 차례!" 2초 알림
    3. 게임모드 표시: 판돈 패널에 현재 모드 라벨
    4. 체크 SFX 교체 + 볼륨 균일화
  </what-built>
  <how-to-verify>
    1. `cd packages/client && pnpm dev`로 로컬 서버 실행
    2. 2인 이상 접속 후 게임 시작
    3. [모드 표시] 판돈 패널 영역에 "오리지날" 등 모드 라벨이 보이는지 확인
    4. [내턴 알림] 베팅 차례가 오면 테이블 중앙에 "내 차례!" 토스트가 2초간 떴다 사라지는지 확인
    5. [체크 SFX] 체크 버튼 클릭 시 새로운 소리가 재생되는지 확인
    6. [볼륨] 여러 SFX가 비슷한 크기로 재생되는지 확인
    7. [동점 재경기] 동점 상황을 만들어 족보가 보이고 "재경기" 버튼이 표시되는지 확인 (테스트가 어렵다면 코드 리뷰로 대체)
  </how-to-verify>
  <resume-signal>"approved" 입력 또는 수정 사항 설명</resume-signal>
</task>

</tasks>

<verification>
- TypeScript 컴파일 에러 없음
- 동점 재경기 시 ResultScreen에서 족보 + 재경기 버튼 표시
- 내 턴 알림 2초 후 자동 소멸
- 모드 라벨이 데스크톱/모바일 모두에서 표시
- bet-check.mp3가 새 파일로 교체됨
</verification>

<success_criteria>
- 동점 시 별도 안내 페이지 없이 ResultScreen에서 족보 확인 + 재경기 가능
- 내 차례 알림이 게임 테이블 중앙에 2초간 표시
- 게임모드가 판돈 패널에 표시 (모바일은 판돈 좌측)
- 체크 SFX가 check.mp3로 교체되어 재생
- SFX 볼륨이 카테고리별로 균일
</success_criteria>

<output>
완료 후 `.planning/quick/260404-nkl-sfx/260404-nkl-SUMMARY.md` 생성
</output>
