---
phase: quick
plan: 260404-nkl
subsystem: client-ux
tags: [rematch, sfx, ux, game-feedback]
dependency_graph:
  requires: []
  provides: [동점-재경기-ResultScreen-통합, 내턴-알림-토스트, 게임모드-표시, SFX-볼륨-균일화]
  affects: [RoomPage, ResultScreen, GameTable, useSfxPlayer]
tech_stack:
  added: []
  patterns: [IIFE-in-JSX, per-entry-SFX-volume-map]
key_files:
  created: []
  modified:
    - packages/client/src/pages/RoomPage.tsx
    - packages/client/src/components/layout/ResultScreen.tsx
    - packages/client/src/components/layout/GameTable.tsx
    - packages/client/src/hooks/useSfxPlayer.ts
    - packages/client/public/sfx/bet-check.mp3
decisions:
  - rematch-pending 전용 화면 제거 — isResultPhase에 포함하여 ResultScreen 단일 진실 출처 유지
  - 동점 재경기 버튼 분기를 IIFE 패턴으로 JSX 내 인라인 처리 (별도 컴포넌트 생성 불필요)
  - SFX 볼륨을 코드 레벨 카테고리 분류로 1차 균일화 (ffmpeg 미설치 환경 대응)
metrics:
  duration: ~15 min
  completed: 2026-04-04
  tasks_completed: 3
  files_modified: 5
---

# Quick Task 260404-nkl: UX 개선 4종 요약

**한 줄 요약:** 동점 재경기 ResultScreen 통합, 내 베팅 차례 2초 알림, 판돈 패널 게임모드 라벨, 체크 SFX 교체 + 전체 볼륨 균일화를 단일 배치로 적용.

## 완료된 태스크

| Task | 이름 | Commit | 주요 파일 |
|------|------|--------|-----------|
| 1 | 동점 재경기 플로우 변경 | 82e30ad | RoomPage.tsx, ResultScreen.tsx |
| 2 | 내 베팅 차례 알림 + 게임모드 표시 | b619d22 | RoomPage.tsx, GameTable.tsx |
| 3 | 체크 SFX 교체 + 볼륨 균일화 | 06a1b8d | useSfxPlayer.ts, bet-check.mp3 |

## 변경 사항 상세

### Task 1: 동점 재경기 플로우

- `rematch-pending` 전용 화면(div 렌더) 제거
- `isResultPhase`에 `'rematch-pending'` 추가 → ResultScreen이 동점 상황에서도 렌더
- `ResultScreen`에 `isRematchPending?: boolean` prop 추가
- `isRematchPending=true`일 때: 헤더 "동점!", chipDelta 숨김, 재경기 오버레이 숨김
- 동점자(amTied)에게만 "재경기" 버튼 표시 → `socket.emit('start-rematch', { roomId })`
- 비동점자에게 대기 메시지, 확인한 동점자에게 "다른 플레이어를 기다리는 중..." 표시

### Task 2: 내 차례 알림 + 게임모드

- `showMyTurnAlert` state 추가, `useEffect`로 `isMyTurn + dealingComplete + betting phase` 감지
- 2초 후 자동 소멸 (`setTimeout` + cleanup)
- `GameTable` 데스크톱에 z-20 overlay "내 차례!" (animate-in fade-in zoom-in)
- `MODE_LABELS` 상수로 GameMode → 한국어 매핑
- 데스크톱 판돈 패널 상단에 모드 라벨, 모바일 판돈 한줄 좌측에 모드 라벨 추가

### Task 3: SFX 교체 + 볼륨

- `check.mp3` (프로젝트 루트) → `packages/client/public/sfx/bet-check.mp3` 복사 교체
- `SFX_MAP`을 `Record<string, string>` → `Record<string, SfxEntry>` (`{ file, volume }`) 리팩터
- `play()` 함수에서 `audio.volume = entry.volume` 개별 적용
- 볼륨 기준: flip/chip=0.5, card-reveal/win/lose=0.6, 베팅/학교/배경=0.7

## 계획과의 차이

계획대로 정확히 실행됨.

## Known Stubs

없음.

## Self-Check: PASSED

- 82e30ad: git log 확인됨
- b619d22: git log 확인됨
- 06a1b8d: git log 확인됨
- packages/client/public/sfx/bet-check.mp3: 교체 확인됨
