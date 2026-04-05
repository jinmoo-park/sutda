# Quick Task 260405-v5z 요약

## 작업 내용

`docs/sfx-map.md` SFX/BGM 설정 최신화 — 코드 실제 값과 불일치하는 6건 수정

## 수정 항목

| # | 항목 | 이전 값 | 수정 값 |
|---|------|---------|---------|
| 1 | `win-normal` 볼륨 | 0.6 | **0.2** |
| 2 | `win-ddaeng-loser` 볼륨 | 0.3 | **0.15** |
| 3 | `lose-ddaeng-but-lost` 트리거 | 기본 1가지 | **승자/패자 isOneRankApart 포함 3가지** |
| 4 | `card-reveal` 정지 조건 | "새 라운드 phase" 1곳 | **RoomPage + ResultScreen 2곳** |
| 5 | BGM 섹션 | 없음 | **main_bgm(0.1), bgm_bigpot(0.4) 추가** |
| 6 | 소스 파일 테이블 | BGM 미포함 | **useBgmPlayer.ts, GameTable.tsx 추가** |

## 빅팟 BGM 볼륨 확인

`packages/client/src/hooks/useBgmPlayer.ts:22` — `_bigpotAudio.volume = 0.4`
(이전: 0.25 → 이번 세션에서 0.4로 별도 수정됨)

## 커밋

- `docs(sfx-map.md): SFX/BGM 설정 최신화 — 볼륨·트리거·BGM 섹션 추가`
