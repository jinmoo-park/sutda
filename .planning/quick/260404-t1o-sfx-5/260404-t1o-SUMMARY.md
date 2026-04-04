# Quick Task 260404-t1o: SFX 버그 수정 5종

**Date:** 2026-04-04  
**Status:** Complete  
**Commit:** 27e55c2

## 완료 내용

### Bug 1: school-proxy 수혜자 미재생
- `SchoolProxySection`이 승자 전용 컴포넌트라 수혜자의 useEffect가 미실행됨
- **Fix:** `ResultScreen` 메인 컴포넌트에 `proxy-ante-applied` 소켓 리스너 추가 → 전 플레이어 재생
- `handleProxyConfirm`의 `play('school-proxy')` 제거 (중복 방지)
- `SchoolProxySection`의 잘못된 `schoolProxyBeneficiaryIds` useEffect 제거

### Bug 2 & 3: win-ddaeng / lose-ddaeng-but-lost 미재생
- 세장섯다에서 `me.cards[0,1]`이 선택한 2장이 아닐 수 있었음
- **Fix:** `selectedCards` 우선 사용 헬퍼 `getHandCards()` 적용 (winner/loser 공통)

### Bug 4: win-normal 볼륨
- `useSfxPlayer.ts`: `win-normal` volume 0.6 → 0.2

### Bug 5: 베팅 SFX 전체 브로드캐스트
- `RoomPage.tsx`에 `prevBetActionsRef` + `gameState.players` useEffect 추가
- `roundNumber`를 키에 포함해 라운드 간 동일 액션도 재생
- 상대 플레이어의 `lastBetAction` 변화 감지 → 해당 bet-* sfx 재생

## 변경 파일

- `packages/client/src/hooks/useSfxPlayer.ts`
- `packages/client/src/components/layout/ResultScreen.tsx`
- `packages/client/src/pages/RoomPage.tsx`
