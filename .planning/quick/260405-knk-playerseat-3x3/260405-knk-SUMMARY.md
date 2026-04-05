---
phase: quick-260405-knk
plan: 01
subsystem: client-ui
tags: [playerseat, mobile, grid, hwatu-card, layout]
tech-stack:
  added: []
  patterns: [compact-grid, xxs-card-size]
key-files:
  created: []
  modified:
    - packages/client/src/components/game/HwatuCard.tsx
    - packages/client/src/components/game/PlayerSeat.tsx
    - packages/client/src/components/layout/GameTable.tsx
decisions:
  - xxs 카드 사이즈(30x49)를 HwatuCard SIZE_MAP에 추가 — compact 모드 3x3 그리드에서 공간 효율 확보
  - compact 모드 border를 Card className에 직접 명시 — 모바일 게임판 박스 시인성 보장
metrics:
  duration: ~10분
  completed_date: "2026-04-05"
---

# Quick Task 260405-knk: PlayerSeat 박스 크기 최적화 요약

한 줄 요약: HwatuCard xxs 사이즈 추가 + PlayerSeat 모바일 폰트 확대/카드 축소 + 데스크톱 박스 확대 + 모바일 3x3 그리드 전환

## 완료된 작업

### Task 1: HwatuCard xxs 사이즈 추가 + PlayerSeat 카드/폰트/박스 크기 조정
- **커밋:** `5ebf806`
- **변경 내용:**
  - `HwatuCard.tsx`: `SIZE_MAP`에 `xxs: { width: 30, height: 49 }` 추가, size prop 타입에 `'xxs'` 포함
  - `PlayerSeat.tsx` compact 모드 폰트: `text-[9px]` → `text-[11px]` (닉네임, [나] 태그, 칩 금액 모두)
  - `PlayerSeat.tsx` compact 모드 카드: `size='xs'` → `size='xxs'`로 축소
  - `PlayerSeat.tsx` 데스크톱: `min-w-[7rem]` → `min-w-[9rem]`, `p-2` → `p-3`으로 확대

### Task 2: 모바일 3x3 그리드 레이아웃 + border/box 스타일 적용
- **커밋:** `e8ab414`
- **변경 내용:**
  - `GameTable.tsx` 모바일 그리드: `grid-cols-2` → `grid-cols-3` (3열 2행, 6명 3x2 배치)
  - 모바일 그리드 여백: `gap-1 p-1` → `gap-1.5 p-1.5`
  - `PlayerSeat.tsx` compact Card에 `border border-border/50` 명시 추가

## 검증 결과

- TypeScript 컴파일: 기존 pre-existing 오류 2건 외 신규 오류 없음
  - `ResultScreen.tsx(149)`: PlayerState | undefined 타입 오류 — 기존
  - `CutModal.tsx(145)`: GiriPhase 미정의 오류 — 기존

## 플랜 편차 없음

계획서 명세대로 정확히 구현됨.

## Self-Check

### 파일 존재 확인

- [x] `packages/client/src/components/game/HwatuCard.tsx` — 수정됨
- [x] `packages/client/src/components/game/PlayerSeat.tsx` — 수정됨
- [x] `packages/client/src/components/layout/GameTable.tsx` — 수정됨

### 커밋 존재 확인

- [x] `5ebf806` — Task 1
- [x] `e8ab414` — Task 2

## Self-Check: PASSED

---

# Quick Task 260405-knk (Not Approved 수정): 추가 수정사항 반영

한 줄 요약: 빅팟BGM 음량 2.5배 / 데스크톱 시트 확대 / 모바일 모드Badge·레이즈2줄·카드겹침·3열·팟중앙 재수정

## 추가 커밋: `299e6c2`

### 1. 빅팟 BGM 음량 증가
- `useBgmPlayer.ts`: `_bigpotAudio.volume` `0.1` → `0.25` (2.5배)

### 2. 데스크탑 PlayerSeat 박스 확대
- `PlayerSeat.tsx` 데스크톱: `min-w-[9rem]` → `min-w-[11rem]`, `p-3` → `p-4`

### 3. 모바일 게임모드명 badge/pill 처리 (문제 A)
- `GameTable.tsx` 모바일 팟 요약 영역: 텍스트 span → `rounded-full border border-primary text-primary bg-primary/10` pill 스타일

### 4. 레이즈 액션 텍스트 두 줄 분리 (문제 B)
- `PlayerSeat.tsx`: 레이즈 Badge와 베팅금액을 `flex-col` 컨테이너로 분리
  - 1줄: `레이즈 +N원` (Badge)
  - 2줄: `베팅금액 N원` (span)
- 레이즈 외 액션의 currentBet 표시는 기존 방식 유지

### 5. 카드 3장 compact 겹침 강화 (문제 C)
- `PlayerSeat.tsx`: compact 모드 3카드 `-space-x-3` (기존 `-space-x-2`에서 추가 겹침)

### 6. 모바일 3열 배치 재확인·강제 적용 (문제 D)
- `GameTable.tsx`: `grid-cols-3 justify-items-center` 명시 (이미 적용돼 있었으나 주석 수정 및 재확인)

### 7. SharedCard 중앙 배치 (문제 E)
- `GameTable.tsx` 모바일 SharedCardDisplay: `flex justify-center items-center` 명시

## Self-Check: PASSED
