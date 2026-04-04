# SFX 맵핑 및 트리거 조건

> 파일: `packages/client/src/hooks/useSfxPlayer.ts` (SFX_MAP)  
> 실제 파일 위치: `packages/client/public/sfx/*.mp3`

---

## 전체 SFX 목록

| SFX 키 | 파일명 | 볼륨 | 트리거 조건 | 트리거 위치 |
|--------|--------|------|------------|------------|
| `shuffle` | `shuffle.mp3` | 0.7 | ShuffleModal에서 딜러가 셔플 버튼 클릭 시 | `ShuffleModal.tsx` → `startShuffle()` |
| `giri` | `giri.mp3` | 0.7 | 기리(컷) 플레이어가 패 합치기 버튼 클릭 시 (본인) / `giri-phase-update` 소켓 이벤트 `phase === 'split'` (관전자) | `CutModal.tsx` 합치기 버튼 / `RoomPage.tsx` socket handler |
| `deal` | `deal.mp3` | 0.7 | `cutting` 또는 `shuffling` → `betting` / `betting-1` / `sejang-open` phase 전환 시 | `RoomPage.tsx` phase 변화 감지 useEffect |
| `flip` | `flip.mp3` | 0.5 | ① 카드 직접 클릭해 뒤집을 때 ② 대기실에서 새 플레이어 입장 시 ③ 밤일낮장(dealer-select)에서 카드 선택 시 | `RoomPage.tsx` HandPanel onFlip / 플레이어 카운트 useEffect / `DealerSelectModal.tsx` handleSelect |
| `chip` | `chip.mp3` | 0.5 | BettingPanel에서 레이즈 금액 증가 버튼(+) 클릭 시 | `BettingPanel.tsx` 금액 증가 버튼 onClick |
| `bet-check` | `bet-check.mp3` | 0.7 | 베팅 패널 "체크" 버튼 클릭 시 | `BettingPanel.tsx` 체크 버튼 onClick |
| `bet-call` | `bet-call.mp3` | 0.7 | 베팅 패널 "콜" 버튼 클릭 시 | `BettingPanel.tsx` 콜 버튼 onClick |
| `bet-raise` | `bet-raise.mp3` | 0.7 | 베팅 패널 "레이즈" 버튼 클릭 시 | `BettingPanel.tsx` 레이즈 버튼 onClick |
| `bet-die` | `bet-die.mp3` | 0.7 | 베팅 패널 "다이" 버튼 클릭 시 | `BettingPanel.tsx` 다이 버튼 onClick |
| `card-reveal` | `card-reveal.mp3` | 0.6 | `betting` / `betting-1` / `betting-2` / `card-select` → `card-reveal` phase 전환 시 (루프 재생, 새 라운드 시작 phase 진입 시 정지) | `RoomPage.tsx` card-reveal 감지 useEffect |
| `win-normal` | `win-normal.mp3` | 0.6 | result phase 진입, 내가 승자이고 손패가 땡이 아닐 때 | `ResultScreen.tsx` result phase useEffect |
| `win-ddaeng` | `win-ddaeng.mp3` | 0.6 | result phase 진입, 내가 승자이고 손패가 땡일 때 | `ResultScreen.tsx` result phase useEffect |
| `win-ddaeng-loser` | `win-ddaeng.mp3` | 0.3 | result phase 진입, 내가 패자이고 **승자** 손패가 땡일 때 (낮은 볼륨으로 추가 재생) | `ResultScreen.tsx` result phase useEffect |
| `lose-normal` | `lose-normal.mp3` | 0.6 | result phase 진입, 내가 패자이고 ① 땡값도 없고 ② 내 패도 땡이 아닐 때 | `ResultScreen.tsx` result phase useEffect |
| `lose-ddaeng-penalty` | `lose-ddaeng-penalty.mp3` | 0.6 | result phase 진입, 내가 패자이고 `ttaengPayments`에 내 ID가 있을 때 (땡값 납부) | `ResultScreen.tsx` result phase useEffect |
| `lose-ddaeng-but-lost` | `lose-ddaeng-but-lost.mp3` | 0.6 | result phase 진입, 내가 패자이고 땡값은 없지만 내 패가 땡일 때 (땡인데 짐) | `ResultScreen.tsx` result phase useEffect |
| `school-go` | `school-go.mp3` | 0.7 | ResultScreen에서 "학교 가기" 버튼 클릭 시 | `ResultScreen.tsx` 학교가기 버튼 onClick |
| `school-proxy` | `school-proxy.mp3` | 0.7 | ① 승자가 학교 대신 가주기 확인 버튼 클릭 시 ② 수혜자 측: `schoolProxyBeneficiaryIds`에 내 ID가 추가될 때 | `ResultScreen.tsx` handleProxyConfirm / schoolProxyBeneficiaryIds useEffect |

---

## 소스 파일 위치 요약

| 파일 | 담당 SFX |
|------|---------|
| `packages/client/src/hooks/useSfxPlayer.ts` | SFX_MAP 정의, play/stop/mute 로직 |
| `packages/client/src/pages/RoomPage.tsx` | `giri`, `deal`, `flip`(대기실), `card-reveal` |
| `packages/client/src/components/layout/BettingPanel.tsx` | `chip`, `bet-check`, `bet-call`, `bet-raise`, `bet-die` |
| `packages/client/src/components/layout/ResultScreen.tsx` | `win-*`, `lose-*`, `school-go`, `school-proxy` |
| `packages/client/src/components/modals/ShuffleModal.tsx` | `shuffle` |
| `packages/client/src/components/modals/CutModal.tsx` | `giri`(본인) |
| `packages/client/src/components/modals/DealerSelectModal.tsx` | `flip`(밤일낮장 카드 선택) |

---

## 원본 파일 (root `sfx/` 폴더 — 참조용)

루트의 `sfx/` 폴더는 원본 소스 파일이며, 실제 서빙은 `packages/client/public/sfx/`에서 이루어집니다.

| 번호 | 원본 파일명 | → public 파일명 |
|------|------------|----------------|
| 01 | `01.셔플.mp3` | `shuffle.mp3` |
| 02 | `02.기리.mp3` | `giri.mp3` |
| 03 | `03.카드배분.mp3` | `deal.mp3` |
| 04 | `04.카드뒤집기.mp3` | `flip.mp3` |
| 05 | `05.칩버튼.mp3` | `chip.mp3` |
| 06 | `06.베팅-체크.mp3` | `bet-check.mp3` |
| 07 | `07.베팅-콜.mp3` | `bet-call.mp3` |
| 08 | `08.베팅-레이즈.mp3` | `bet-raise.mp3` |
| 09 | `09.베팅-다이.mp3` | `bet-die.mp3` |
| 10 | `10.패공개중.mp3` | `card-reveal.mp3` |
| 11 | `11.승리-일반.mp3` | `win-normal.mp3` |
| 12 | `12.승리-땡으로 승리.mp3` | `win-ddaeng.mp3` |
| 13 | `13.패배-일반.mp3` | `lose-normal.mp3` |
| 14 | `14.패배-땡값.mp3` | `lose-ddaeng-penalty.mp3` |
| 15 | `15.패배-땡이지만 패배.mp3` | `lose-ddaeng-but-lost.mp3` |
| 16 | `16.학교가기 버튼.mp3` | `school-go.mp3` |
| 17 | `17.학교대납.mp3` | `school-proxy.mp3` |
