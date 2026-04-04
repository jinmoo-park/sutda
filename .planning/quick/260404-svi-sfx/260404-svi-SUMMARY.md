# Quick Task 260404-svi: sfx 트리거 조건 및 맵핑 문서화

**Date:** 2026-04-04  
**Status:** Complete

## 완료 내용

`docs/sfx-map.md` 신규 생성.

SFX_MAP 17개 키 전수 분석:
- `shuffle`, `giri`, `deal`, `flip`, `chip`
- `bet-check`, `bet-call`, `bet-raise`, `bet-die`
- `card-reveal`
- `win-normal`, `win-ddaeng`, `win-ddaeng-loser`
- `lose-normal`, `lose-ddaeng-penalty`, `lose-ddaeng-but-lost`
- `school-go`, `school-proxy`

각 항목에 대해 기록:
1. 파일명 (public/sfx/*.mp3)
2. 볼륨
3. 트리거 조건 (정확한 분기 로직 포함)
4. 트리거 위치 (파일명 + 함수/이벤트)

루트 `sfx/` 원본 파일 (한글명) ↔ `public/sfx/` 배포 파일 (영문명) 맵핑표도 포함.

## 변경 파일

- `docs/sfx-map.md` (신규)
