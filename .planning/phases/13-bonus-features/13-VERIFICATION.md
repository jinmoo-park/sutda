---
phase: 13-bonus-features
verified: 2026-04-04T00:00:00Z
status: passed
score: 5/5 must-haves 검증됨
re_verification: null
gaps: []
human_verification:
  - test: "브라우저 2개로 실시간 스트리밍 확인"
    expected: "플레이어 1이 기리(더미 나누기)를 실행하면 플레이어 2 화면에 SpectatorCutView Dialog가 열리고, 더미가 나뉘는 즉시 실시간 반영된다"
    why_human: "멀티-브라우저 소켓 실시간 동작은 정적 코드 분석으로 확인 불가"
  - test: "기리 탭 순서 배지 실시간 동기화"
    expected: "기리 플레이어가 더미를 탭하면 관전자 SpectatorCutView에 탭 순서 번호 배지(1, 2, ...)가 즉시 표시된다"
    why_human: "socket emit / receive 타이밍은 런타임에서만 검증 가능"
  - test: "merging 애니메이션 관전자 동기화"
    expected: "기리 플레이어가 '합치기'를 클릭하면 관전자 화면에도 더미가 중앙으로 모이는 CSS transition 애니메이션이 재생된다"
    why_human: "CSS transition 시각적 동작은 수동 검증 필요"
  - test: "기리 SFX 관전자 트리거"
    expected: "관전자가 split phase 수신 시 기리 효과음이 재생된다 (뮤트 해제 상태에서)"
    why_human: "오디오 재생은 브라우저 런타임에서만 확인 가능"
  - test: "BGM 루프 재생"
    expected: "게임 접속 후 배경음악이 자동으로 시작되고, AudioControlBar로 뮤트/언뮤트가 동작한다"
    why_human: "오디오 재생 상태는 브라우저 런타임에서만 확인 가능"
---

# Phase 13: 부가기능 (기리 스트리밍 + SFX/BGM) 검증 보고서

**Phase 목표:** 게임 몰입감을 높이는 두 가지 부가기능을 완성한다 — 기리 인터랙션을 모든 플레이어에게 실시간 스트리밍하고, 게임 이벤트에 맞는 효과음과 배경음악을 삽입한다.

**검증 일시:** 2026-04-04

**상태:** PASSED (자동 검증 기준)

**재검증 여부:** 아니오 (최초 검증)

---

## 구현 범위 정리

Phase 13은 두 Quick Task에 걸쳐 구현되었다:

- **Quick 260404-jn6**: FEATURE-SFX + FEATURE-BGM — SFX 17개 이벤트 매핑, BGM 루프, AudioControlBar
- **Phase 13 Plan 13 (커밋 82a93ec, eac081d, 725b7a9)**: FEATURE-CUT-STREAM — 기리 실시간 스트리밍 + 기리 탭 SFX 트리거

---

## 관찰 가능한 참(Truth) 검증

| # | Truth | 상태 | 근거 |
|---|-------|------|------|
| 1 | `giri-phase-update` 소켓 이벤트가 프로토콜에 정의되고 서버가 브로드캐스트한다 | ✓ VERIFIED | `protocol.ts` L5, L68–72, L91–95 / `server/index.ts` L488–497 |
| 2 | CutModal이 기리 단계 전환마다 `giri-phase-update`를 emit한다 | ✓ VERIFIED | `CutModal.tsx` L145–153 (emitGiriUpdate 헬퍼), L285, L296, L305, L308, L329, L337, L340, L531 (총 8곳) |
| 3 | SpectatorCutView 컴포넌트가 존재하고 읽기 전용 더미 레이아웃을 렌더링한다 | ✓ VERIFIED | `SpectatorCutView.tsx` 155줄 — Dialog + 더미 스택 + 탭 배지 + merging 트랜지션 + 단계 텍스트 |
| 4 | RoomPage가 `giri-phase-update` 이벤트를 수신하여 SpectatorCutView에 연결한다 | ✓ VERIFIED | `RoomPage.tsx` L195–216 (핸들러+cleanup), L219–223 (phase 초기화), L793–801 (JSX) |
| 5 | SFX 17개 + BGM이 구현되어 게임 이벤트와 연결되고 오디오 파일이 존재한다 | ✓ VERIFIED | `useSfxPlayer.ts` (55줄, giri 포함 17개 매핑), `useBgmPlayer.ts` (65줄, main_bgm.mp3 루프), `AudioControlBar.tsx` (26줄), `/public/sfx/` 18개 파일 |

**점수:** 5/5 Truth 검증됨

---

## 아티팩트 검증

### Level 1–3 (존재 / 실질적 구현 / 연결)

| 아티팩트 | 존재 | 실질적 구현 | 연결 상태 | 최종 상태 |
|---------|------|------------|----------|----------|
| `packages/shared/src/types/protocol.ts` | ✓ | ✓ GiriPhase/GiriPile 타입 + 양방향 이벤트 정의 | ✓ 서버·클라이언트 모두 참조 | ✓ VERIFIED |
| `packages/server/src/index.ts` | ✓ | ✓ `socket.on('giri-phase-update')` 핸들러 → `io.to(roomId).emit` + `cutterNickname` | ✓ 기존 소켓 핸들러 블록 내 등록 | ✓ VERIFIED |
| `packages/client/src/components/modals/CutModal.tsx` | ✓ | ✓ `emitGiriUpdate` 헬퍼 + 8곳 호출 (스와이프×2, 드래그×1, 탭/언탭×4, merging×1) | ✓ 기리 플레이어 단계 전환 로직과 직접 연결 | ✓ VERIFIED |
| `packages/client/src/components/modals/SpectatorCutView.tsx` | ✓ | ✓ 155줄 — Dialog, 더미 스택 렌더링, 탭 배지, merging CSS 트랜지션, 단계 텍스트 | ✓ RoomPage `import`+JSX 마운트 | ✓ VERIFIED |
| `packages/client/src/pages/RoomPage.tsx` | ✓ | ✓ `spectatorGiriState` useState, `giri-phase-update` 핸들러+cleanup+초기화, JSX 통합 | ✓ 소켓 이벤트 → state → SpectatorCutView props 흐름 완성 | ✓ VERIFIED |
| `packages/client/src/hooks/useSfxPlayer.ts` | ✓ | ✓ 55줄 — 17개 이벤트 매핑, Audio 재생 로직 | ✓ RoomPage에서 `playSfx` alias로 사용 | ✓ VERIFIED |
| `packages/client/src/hooks/useBgmPlayer.ts` | ✓ | ✓ 65줄 — main_bgm.mp3 루프, 음소거 localStorage 저장 | ✓ AudioControlBar에서 호출 | ✓ VERIFIED |
| `packages/client/src/components/layout/AudioControlBar.tsx` | ✓ | ✓ 26줄 — 뮤트 토글 UI | ✓ RoomPage JSX에 마운트 | ✓ VERIFIED |

### Level 4 (데이터 흐름)

| 아티팩트 | 데이터 변수 | 소스 | 실제 데이터 생성 여부 | 상태 |
|---------|------------|------|------------------|------|
| `SpectatorCutView.tsx` | `piles`, `tapOrder`, `giriPhase` | RoomPage `spectatorGiriState` ← `socket.on('giri-phase-update')` ← 서버 브로드캐스트 ← CutModal `emitGiriUpdate` | ✓ 기리 플레이어의 실제 인터랙션에서 emit | ✓ FLOWING |
| `AudioControlBar.tsx` | `isMuted` (useBgmPlayer) | localStorage + Audio 객체 상태 | ✓ main_bgm.mp3 실제 파일 존재 | ✓ FLOWING |

---

## 핵심 링크(Key Link) 검증

| From | To | Via | 상태 | 근거 |
|------|----|-----|------|------|
| `CutModal.tsx` | `giri-phase-update` (서버) | `socket.emit('giri-phase-update', ...)` | ✓ WIRED | L146–151 emitGiriUpdate, 8곳 호출 확인 |
| 서버 `index.ts` | `giri-phase-update` (모든 클라이언트) | `io.to(roomId).emit('giri-phase-update', ...)` | ✓ WIRED | L488–497, cutterNickname 포함 |
| `RoomPage.tsx` | `SpectatorCutView` | `socket.on` → `setSpectatorGiriState` → props | ✓ WIRED | L195–216 핸들러, L795–801 JSX |
| `RoomPage.tsx` | `playSfx('giri')` | `data.phase === 'split'` 조건 → `useSfxPlayer` | ✓ WIRED | L212 — split 수신 시 SFX 트리거 |
| `useSfxPlayer.ts` | `02.기리.mp3` | `SFX_MAP['giri']` | ✓ WIRED | L5 매핑, 파일 `/public/sfx/02.기리.mp3` 존재 |
| `useBgmPlayer.ts` | `main_bgm.mp3` | `new Audio('/sfx/main_bgm.mp3')` | ✓ WIRED | L8, 파일 `/public/sfx/main_bgm.mp3` 존재 |
| `AudioControlBar.tsx` | `RoomPage` | import + JSX `<AudioControlBar />` | ✓ WIRED | RoomPage L6, L700 |

---

## 행동 스팟 체크 (Behavioral Spot-Checks)

Step 7b: SKIPPED — 서버를 기동하지 않는 상태에서 소켓 이벤트 체인을 런타임 검증할 수 없음. 커밋 82a93ec / eac081d / 725b7a9 존재 확인 및 정적 코드 분석으로 대체.

---

## 요구사항 커버리지

### PLAN 프론트매터의 요구사항 ID

Phase 13 PLAN.md 프론트매터에는 `requirements` 필드가 명시되어 있지 않음. 대신 Phase 목표에서 FEATURE-CUT-STREAM, FEATURE-SFX, FEATURE-BGM을 참조.

| 요구사항 ID | 출처 | 설명 | 구현 근거 | 상태 |
|------------|------|------|---------|------|
| FEATURE-CUT-STREAM | Phase 13 목표 | 기리 인터랙션 실시간 스트리밍 | `giri-phase-update` 프로토콜 + 서버 브로드캐스트 + SpectatorCutView | ✓ SATISFIED |
| FEATURE-SFX | Quick 260404-jn6 | 게임 이벤트 17개 효과음 | `useSfxPlayer.ts` 17개 매핑 + 17개 mp3 파일 + RoomPage 트리거 | ✓ SATISFIED |
| FEATURE-BGM | Quick 260404-jn6 | 배경음악 루프 + 음소거 컨트롤 | `useBgmPlayer.ts` + AudioControlBar + main_bgm.mp3 | ✓ SATISFIED |

### REQUIREMENTS.md 고아 요구사항 확인

REQUIREMENTS.md에 FEATURE-CUT-STREAM / FEATURE-SFX / FEATURE-BGM ID가 등록되어 있지 않음. 해당 파일의 마지막 업데이트가 2026-03-31 (Phase 11/12 기준)이며, Phase 13 요구사항은 미추가 상태. **이는 REQUIREMENTS.md 문서 업데이트 누락이지 구현 결함이 아님.** 구현 코드는 목표를 충족한다.

---

## 안티패턴 스캔

| 파일 | 패턴 | 분류 | 영향 |
|------|------|------|------|
| 검사 대상 5개 파일 전체 | TODO / FIXME / placeholder 없음 | - | - |
| `SpectatorCutView.tsx` | `return null` 없음, 155줄 실질 구현 | - | - |
| `CutModal.tsx` | emit 8곳 — 빈 핸들러 없음 | - | - |
| `RoomPage.tsx` | `spectatorGiriState` 초기값 `null` — 이후 소켓 데이터로 덮어씀 (정상 초기 상태) | ℹ️ Info | 영향 없음 |

블로커 안티패턴 없음.

---

## 수동 검증 항목

### 1. 브라우저 2개 기리 스트리밍 확인

**테스트:** 브라우저 창 2개로 같은 방에 접속하여 기리 단계를 진행  
**기대 결과:** 기리 플레이어가 더미를 나누면 관전자 화면에 SpectatorCutView Dialog가 열리고 더미가 실시간 반영됨  
**수동 이유:** 멀티-브라우저 Socket.IO 실시간 동작은 정적 분석 불가

### 2. 탭 순서 배지 동기화

**테스트:** 기리 플레이어가 더미를 탭하는 순서대로 관전자 화면에 번호 배지 확인  
**기대 결과:** 탭한 순서에 맞게 1, 2, 3... 배지가 해당 더미에 표시됨  
**수동 이유:** Socket emit→receive 타이밍은 런타임에서만 검증 가능

### 3. merging 애니메이션 관전자 동기화

**테스트:** 기리 플레이어가 '합치기' 클릭 → 관전자 화면 확인  
**기대 결과:** 관전자 화면에도 더미들이 CSS transition으로 중앙에 모이는 애니메이션 재생  
**수동 이유:** CSS transition 시각적 동작은 수동 검증 필요

### 4. SFX/BGM 오디오 재생

**테스트:** 게임 접속 후 배경음악 자동 시작 확인, AudioControlBar 뮤트 토글, 기리 SFX 트리거  
**기대 결과:** BGM 자동 재생 (뮤트 상태가 아닌 경우), 기리 split 수신 시 효과음 재생  
**수동 이유:** 브라우저 오디오 자동재생 정책 및 실제 재생 여부는 런타임에서만 확인 가능

---

## 커밋 검증

| 커밋 | 상태 | 내용 |
|------|------|------|
| 82a93ec | ✓ 존재 | GiriPhase/GiriPile 타입 + giri-phase-update 브로드캐스트 핸들러 |
| eac081d | ✓ 존재 | CutModal 기리 단계 전환 emit 추가 |
| 725b7a9 | ✓ 존재 | SpectatorCutView + RoomPage giri-phase-update 통합 |
| 2ae9ccd | ✓ 존재 | SFX 17개 이벤트 매핑 + AudioControlBar 마운트 |
| 63aeb08 | ✓ 존재 | useSfxPlayer + useBgmPlayer + AudioControlBar + 18개 mp3 |

---

## 갭 요약

갭 없음. 모든 must-have Truth가 코드베이스에서 검증됨.

- 기리 실시간 스트리밍: 프로토콜 → 서버 브로드캐스트 → 클라이언트 수신 → SpectatorCutView 렌더링 전체 체인 확인
- SFX: 17개 이벤트 매핑 + 17개 mp3 파일 + RoomPage 트리거 확인
- BGM: useBgmPlayer + main_bgm.mp3 + AudioControlBar 확인
- 기리 탭 SFX 트리거: split 수신 시 `playSfx('giri')` 호출 확인

REQUIREMENTS.md에 FEATURE-* ID가 등록되지 않은 것은 문서 업데이트 누락으로, 구현 품질과 무관함.

---

_검증 일시: 2026-04-04_
_검증자: Claude (gsd-verifier)_
