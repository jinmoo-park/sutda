# Quick Task: SFX 이중 재생 버그 수정

**ID:** 260404-jdp  
**생성일:** 2026-04-04

## 문제 분석

코드 조사 결과 두 군데에서 SFX 이중 재생이 발생하는 것을 확인:

### 버그 1: ShuffleModal.tsx — `shuffle` SFX 이중 재생 (readOnly 경로)

`open` 변경 시 실행되는 useEffect에서:
- 182번 줄: `if (readOnly) play('shuffle');` — 즉시 재생
- 185번 줄: `if (readOnly) startShuffle();` → `startShuffle()` 내부에서 `play('shuffle')` 재실행 (164번 줄)

**수정:** 182번 줄의 `play('shuffle')` 제거. `startShuffle()`에서 이미 재생하므로 중복.

### 버그 2: CutModal.tsx — `giri` SFX 이중 재생 (터치 기기 split 경로)

터치 기기로 카드 더미 분할 시:
- 283, 294번 줄: CutModal에서 `play('giri')` 로컬 즉시 재생
- 동시에 `emitGiriUpdate('split', ...)` 소켓 emit → 서버 브로드캐스트 → RoomPage `giri-phase-update` 핸들러 (215번 줄) 에서 `playSfx('giri')` 재실행

데스크탑 split 경로 (329번 줄)는 로컬 `play()` 없이 소켓 이벤트만 사용하므로 중복 없음.

**수정:** CutModal 283, 294번 줄의 `play('giri')` 제거. RoomPage 소켓 핸들러가 모든 클라이언트(기리하는 플레이어 포함)에게 재생 담당.

## 태스크 목록

- [x] T1: ShuffleModal.tsx readOnly 경로 중복 `play('shuffle')` 제거
- [x] T2: CutModal.tsx 터치 split 경로 중복 `play('giri')` 제거
