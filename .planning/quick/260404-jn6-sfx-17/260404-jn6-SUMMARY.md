---
phase: quick-260404-jn6
plan: 01
subsystem: client/audio
tags: [sfx, bgm, audio, ux]
dependency_graph:
  requires: []
  provides: [SFX 시스템, BGM 루프 재생, AudioControlBar]
  affects: [BettingPanel, ResultScreen, ShuffleModal, CutModal, DealerSelectModal, RoomPage]
tech_stack:
  added: [Web Audio API (new Audio()), encodeURIComponent, localStorage]
  patterns: [훅 기반 오디오 관리, Audio 인스턴스 캐싱, autoplay 정책 대응]
key_files:
  created:
    - packages/client/src/hooks/useSfxPlayer.ts
    - packages/client/src/hooks/useBgmPlayer.ts
    - packages/client/src/components/layout/AudioControlBar.tsx
    - packages/client/public/sfx/ (18개 mp3 파일)
  modified:
    - packages/client/src/components/layout/BettingPanel.tsx
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/modals/ShuffleModal.tsx
    - packages/client/src/components/modals/CutModal.tsx
    - packages/client/src/components/modals/DealerSelectModal.tsx
    - packages/client/src/pages/RoomPage.tsx
decisions:
  - "useSfxPlayer는 Audio 인스턴스를 Map으로 캐싱 — 동일 키 재생 시 currentTime=0 리셋으로 연속 재생 지원"
  - "AudioControlBar: 텍스트 이모지 기반 아이콘 사용 — 외부 아이콘 라이브러리 추가 없이 구현"
  - "BGM autoplay 실패 시 click/touchstart/keydown 원샷 이벤트로 재시도 — 브라우저 정책 대응"
  - "card-reveal phase 비교 시 string 캐스팅 — 빌드 기준 GamePhase 타입 불일치 회피"
metrics:
  duration: "~20 min"
  completed_date: "2026-04-04"
  tasks: 2
  files: 10
---

# Quick Task 260404-jn6: SFX 시스템 17개 이벤트 매핑 Summary

**한 줄 요약:** Web Audio API 기반 useSfxPlayer/useBgmPlayer 훅으로 17개 게임 이벤트 SFX + BGM 루프 재생, AudioControlBar 토글 UI 구현

## 완료된 작업

### Task 1: SFX/BGM 파일 복사 + 훅 + AudioControlBar
**커밋:** 63aeb08

- `sfx/` 루트 18개 `.mp3` 파일을 `packages/client/public/sfx/`로 복사 (17 SFX + main_bgm.mp3)
- `useSfxPlayer.ts`: `play(key)` / `isMuted` / `toggleMute()` API, Audio 인스턴스 Map 캐싱, `encodeURIComponent` 적용
- `useBgmPlayer.ts`: loop=true, preload='none', volume=0.4, autoplay 정책 대응(첫 인터랙션 재시도), localStorage `sutda_bgm_muted` 저장
- `AudioControlBar.tsx`: fixed top-4 right-4 z-50, BGM/SFX 개별 토글 버튼, 음소거 시 opacity 변경

### Task 2: 17개 이벤트 SFX 트리거 연결
**커밋:** 00146f9

| # | 이벤트 | 파일 | 트리거 위치 |
|---|--------|------|------------|
| 1 | 셔플 | ShuffleModal | `startShuffle()` (선플레이어) + `useEffect(open)` (readOnly) |
| 2 | 기리 | CutModal | 합치기 버튼 onClick + 스와이프 완료 시 |
| 3 | 카드배분 | RoomPage | cutting/shuffling → betting 전환 useEffect |
| 4 | 카드뒤집기 | RoomPage / DealerSelectModal | HandPanel `onFlip` 콜백 + `handleSelect` |
| 5 | 칩버튼 | BettingPanel | CHIP_BUTTONS onClick |
| 6 | 체크 | BettingPanel | 체크 버튼 onClick |
| 7 | 콜 | BettingPanel | 콜 버튼 onClick |
| 8 | 레이즈 | BettingPanel | 레이즈 버튼 onClick |
| 9 | 다이 | BettingPanel | 다이 버튼 onClick |
| 10 | 패공개중 | RoomPage | card-reveal phase 진입 useEffect |
| 11 | 승리-일반 | ResultScreen | result phase useEffect (iAmWinner && !땡) |
| 12 | 승리-땡 | ResultScreen | result phase useEffect (iAmWinner && 땡) |
| 13 | 패배-일반 | ResultScreen | result phase useEffect (패배 && !땡 && !땡값) |
| 14 | 패배-땡값 | ResultScreen | result phase useEffect (패배 && ttaengPayments 포함) |
| 15 | 패배-땡이지만 패배 | ResultScreen | result phase useEffect (패배 && 땡 보유) |
| 16 | 학교가기 | ResultScreen | 학교 가기 버튼 onClick |
| 17 | 학교대납 | ResultScreen | handleProxyConfirm + 수혜자 감지 useEffect |

## 검증 결과

- `ls packages/client/public/sfx/*.mp3 | wc -l` = 18 ✓
- `tsc --noEmit` = 에러 없음 ✓ (기존 pre-existing 에러 4개는 제 변경과 무관한 타입 문제)
- `pnpm --filter client build` = 성공 ✓ (6.90s, 518.33 kB)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] card-reveal phase 타입 캐스팅 추가**
- **Found during:** Task 2 TypeScript 검증
- **Issue:** `prevPhaseRef.current`의 타입이 `GamePhase | null`인데 `'card-reveal'`과의 비교에서 타입 오버랩 없음 에러
- **Fix:** `(gameState?.phase ?? null) as string | null`로 캐스팅
- **Files modified:** packages/client/src/pages/RoomPage.tsx
- **Commit:** 00146f9

## Known Stubs

없음 — 모든 SFX 트리거가 실제 파일과 연결됨.

## Self-Check: PASSED

- packages/client/public/sfx/ 18개 파일 존재 ✓
- packages/client/src/hooks/useSfxPlayer.ts 존재 ✓
- packages/client/src/hooks/useBgmPlayer.ts 존재 ✓
- packages/client/src/components/layout/AudioControlBar.tsx 존재 ✓
- 커밋 63aeb08, 00146f9 존재 ✓
