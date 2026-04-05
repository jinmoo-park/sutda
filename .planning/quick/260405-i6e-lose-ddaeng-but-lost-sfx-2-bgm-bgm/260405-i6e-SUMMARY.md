# Quick Task 260405-i6e — 요약

**작업:** 족보 한단계차이로 패배시에 승자와 패자 모두에게 lose-ddaeng-but-lost sfx 출력 조건 추가 + 판돈 2만원 이상 시 BGM 교체
**날짜:** 2026-04-05
**상태:** 완료

## 완료된 작업

### Task 1: BGM 교체 시스템 + bgm_bigpot.mp3 추가
**커밋:** `2b0c662`

- `packages/client/src/hooks/useBgmPlayer.ts`: `switchBgm(filename)` / `restoreBgm()` 함수 추가
- `packages/client/src/pages/RoomPage.tsx`: `pot >= 20000` 시 `bgm_bigpot.mp3`로 교체, `result` phase 진입 후 2초 딜레이 후 `main_bgm.mp3`로 복귀
- `packages/client/public/sfx/bgm_bigpot.mp3`: 파일 추가 (1.06 MB)

### Task 2: 족보 한 단계 차이 lose-ddaeng-but-lost SFX 트리거
**커밋:** `559d4c8`

- `packages/client/src/components/layout/ResultScreen.tsx`: `SCORE_RANK_ORDER` 배열 + `isOneRankApart()` 헬퍼 추가. result phase 진입 시 승자/패자 모두에게 족보 한 단계 차이 조건 체크 후 `lose-ddaeng-but-lost` 재생

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `packages/client/src/hooks/useBgmPlayer.ts` | `switchBgm` / `restoreBgm` 함수 추가 |
| `packages/client/src/pages/RoomPage.tsx` | pot 감시 + BGM 교체 로직 추가 |
| `packages/client/public/sfx/bgm_bigpot.mp3` | 빅팟 BGM 파일 추가 |
| `packages/client/src/components/layout/ResultScreen.tsx` | `isOneRankApart()` + SFX 트리거 추가 |
