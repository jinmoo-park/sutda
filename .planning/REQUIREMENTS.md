# Requirements: 온라인 섯다 (친구들끼리)

**Defined:** 2026-03-29
**Core Value:** 아무 설치 없이 링크 하나로 친구들과 실시간으로 섯다를 즐길 수 있어야 한다.

## v1 Requirements

### 인프라 / 방 관리 (INFRA)

- [x] **INFRA-01**: 방장이 방을 생성하면 고유 링크(URL)가 발급되어 복사할 수 있다— Validated in Phase 03-01: Socket.IO 서버 부트스트랩 + RoomManager
- [ ] **INFRA-02**: 플레이어가 링크로 접속하면 닉네임 입력만으로 방에 참여할 수 있다 (회원가입 없음)
- [x] **INFRA-03**: 방에는 2~6명이 입장할 수 있으며, 7명 이상은 입장이 거부된다 — Validated in Phase 03-01: RoomManager maxPlayers=6 제한
- [x] **INFRA-04**: 모든 게임 상태는 서버에서 관리되며 클라이언트는 렌더링만 담당한다 (서버 권위 모델) — Validated in Phase 03-01: RoomManager 인메모리 서버 권위 상태
- [ ] **INFRA-05**: 플레이어가 연결이 끊겨도 같은 링크로 재접속하면 게임에 복귀할 수 있다
- [x] **INFRA-06**: 각 플레이어는 방에 입장할 때 자신의 초기 칩 금액을 만원 단위로 입력한다 (기본값 100,000원) — Validated in Phase 03-01: RoomManager.validateChips()

### 자리 배치 (SEAT)

- [x] **SEAT-01**: 플레이어들은 원형으로 배치되어 화면에 표시된다
- [x] **SEAT-02**: 첫 판은 밤일낮장 규칙으로 선 플레이어를 결정한다 (서울 기준 18:00~05:59 낮은 숫자, 06:00~17:59 높은 숫자)
- [x] **SEAT-03**: 이후 판은 이전 판 승자가 선이 된다

### 카드 덱 / 패 돌리기 (DECK)

- [x] **DECK-01**: 덱은 1~10 숫자 카드 각 2장(총 20장)으로 구성되며, 카드마다 광/열끗/일반 속성이 저장된다 (광: 1,3,8 / 열끗 특수: 4,7,9)
- [x] **DECK-02**: 선 플레이어가 셔플을 실행할 수 있다
- [x] **DECK-03**: 왼쪽 플레이어에게 기리를 요청하면, 해당 플레이어가 더미 순서를 변경하거나 "퉁"을 선언할 수 있다
- [x] **DECK-04**: 일반 배분: 선의 오른쪽 플레이어부터 반시계 방향으로 한 장씩, 모든 플레이어가 2장 받을 때까지 배분한다 (선이 마지막)
- [x] **DECK-05**: 퉁 선언 시: 오른쪽 플레이어부터 반시계 방향으로 2장씩 한 번에 배분한다

### 족보 판정 (HAND)

- [x] **HAND-01**: 삼팔광땡(3광+8광), 일팔광땡(1광+8광), 일삼광땡(1광+3광)을 올바르게 판정한다
- [x] **HAND-02**: 장땡(10x2)~일땡(1x2) 10종 땡을 올바르게 판정한다
- [x] **HAND-03**: 알리(1+2), 독사(1+4), 구삥(1+9), 장삥(1+10), 장사(10+4), 새륙(4+6) 특수 조합을 올바르게 판정한다
- [x] **HAND-04**: 구사(4+9 일반), 멍텅구리구사(열끗4+열끗9), 땡잡이(3+7), 암행어사(열끗4+열끗7)를 올바르게 판정한다
- [x] **HAND-08**: 땡잡이(3+7)는 장땡 미만의 모든 땡(구땡~일땡)을 이긴다 (장땡/광땡에게는 진다)
- [x] **HAND-09**: 암행어사(열끗4+열끗7)는 일팔광땡(1광+8광)과 일삼광땡(1광+3광)을 이긴다 (삼팔광땡에게는 진다)
- [x] **HAND-05**: 특수 조합이 없는 경우 두 수의 합의 일의 자리(끗)를 계산한다 (망통=0끗~아홉끗)
- [x] **HAND-06**: 족보 우선순위 비교: 광땡 3종 > 장땡~일땡 > 알리~새륙 > 끗 순으로 승자를 결정한다
- [x] **HAND-07**: 동점인 경우 동점자끼리 재경기한다. 다이 플레이어 및 동점 패보다 낮은 패의 플레이어는 참여 불가. 기존 판돈 유지, 앤티 없음.

### 베팅 (BET)

- [x] **BET-01**: 각 플레이어는 자신의 턴에 콜 / 레이즈 / 다이 중 하나를 선택할 수 있다
- [x] **BET-02**: 콜은 현재 최고 베팅액과 동일한 금액을 낸다
- [x] **BET-03**: 레이즈는 현재 최고 베팅액을 콜한 뒤 추가 금액(자유 입력)을 올린다
- [x] **BET-04**: 다이는 패를 포기하며 해당 판의 베팅에서 제외된다
- [x] **BET-05**: 베팅 순서는 선 플레이어 기준 반시계 방향이다
- [x] **BET-06**: 모든 생존 플레이어의 베팅액이 같아지면 베팅이 종료된다 (전원 체크 시도 종료)
- [ ] **BET-07**: 아직 아무도 베팅하지 않은 상태에서 선 플레이어(및 해당 순서의 플레이어)는 "체크"를 선택할 수 있다. 체크는 베팅 없이 다음 플레이어로 넘기며, 이후 레이즈 발생 시 다시 콜/레이즈 기회가 주어진다

### 칩 추적 (CHIP)

- [x] **CHIP-01**: 각 플레이어의 현재 칩 잔액이 화면에 표시된다
- [x] **CHIP-02**: 판 종료 시 패배한 플레이어의 칩이 차감되고 승자에게 합산된다
- [x] **CHIP-03**: 칩이 0이 된 플레이어는 다른 플레이어 전원의 동의 하에 만원 단위로 칩을 재충전할 수 있다
- [x] **CHIP-04**: 칩은 500원 / 1,000원 / 5,000원 / 10,000원 단위로 시각적으로 구분되어 표시된다
- [x] **CHIP-05**: 베팅/레이즈 시 칩 단위 버튼(500/1000/5000/10000)으로 금액을 조합하여 입력할 수 있다

### 게임 모드 -- 오리지날 (MODE-OG)

- [x] **MODE-OG-01**: 선 플레이어가 게임 시작 전 "오리지날" 모드를 선택할 수 있다
- [x] **MODE-OG-02**: 2장 배분 -> 베팅 -> 족보 비교 -> 승패 결정의 기본 플로우가 작동한다
- [x] **MODE-OG-03**: 오리지날 모드에서만 땡값 규칙이 적용된다. 승자가 땡(일땡 이상)으로 이겼을 때, 해당 판에 다이한 모든 플레이어가 승자에게 땡값을 납부한다 (납부 금액은 승자의 땡 등급 기준: 일땡~구땡 500원, 장땡/광땡 1000원)

### 게임 모드 -- 세장섯다 (MODE-SJ)

- [x] **MODE-SJ-01**: 선 플레이어가 "세장섯다" 모드를 선택할 수 있다
- [x] **MODE-SJ-02**: 2장 배분 -> 베팅(세 번째 카드 안 보고 다이 가능) -> 1장 추가 배분 -> 3장 중 2장 조합으로 족보 비교

### 게임 모드 -- 한장공유 (MODE-SH)

- [x] **MODE-SH-01**: 선 플레이어가 "한장공유" 모드를 선택할 수 있다
- [x] **MODE-SH-02**: 선 플레이어가 공유 카드 1장을 20장 중에서 지정한다
- [x] **MODE-SH-03**: 각 플레이어는 1장씩 받아 공유 카드와 조합하여 족보를 비교한다
- [x] **MODE-SH-04**: 베팅 후 최종 족보 승패를 결정한다

### 게임 모드 -- 골라골라 (MODE-HR)

- [x] **MODE-HR-01**: 선 플레이어가 "골라골라" 모드를 선택할 수 있다
- [x] **MODE-HR-02**: 20장 전부를 오픈으로 판에 깔고, 모든 플레이어가 동시에 자유롭게 2장을 선착순으로 선택한다 (이미 선택된 카드 불가)
- [x] **MODE-HR-03**: 각 플레이어가 2장 선택을 완료하면 자동으로 베팅 페이즈로 전환된다
- [x] **MODE-HR-04**: 베팅 후 선택한 2장으로 족보를 비교하여 승패를 결정한다

### 게임 모드 -- 인디언섯다 (MODE-IN)

- [x] **MODE-IN-01**: 선 플레이어가 "인디언섯다" 모드를 선택할 수 있다
- [x] **MODE-IN-02**: 오른쪽부터 1장 배분 -- 받은 카드는 본인에게는 안 보이고 다른 플레이어에게는 보인다
- [x] **MODE-IN-03**: 첫 베팅(자신의 카드 못 보고, 타인 카드 보며 베팅)
- [x] **MODE-IN-04**: 베팅 종료 후 각 플레이어에게 1장 추가 배분 (이 카드는 본인만 볼 수 있다)
- [x] **MODE-IN-05**: 최종 베팅 후 2장 족보를 비교하여 승패를 결정한다

### 특수 규칙 (RULE)

- [x] **RULE-01**: 구사(4+9 일반) 보유자가 생존 시, 생존자 최고 패가 알리 이하이면 자동으로 재경기가 트리거된다
- [x] **RULE-02**: 멍텅구리구사(열끗4+열끗9) 보유자가 생존 시, 생존자 최고 패가 팔땡 이하이면 자동으로 재경기가 트리거된다
- [x] **RULE-03**: 재경기 시 다이한 플레이어는 판돈의 절반을 추가로 내면 재참여할 수 있다
- [x] **RULE-04**: 땡잡이(3+7) 또는 암행어사(열끗4+열끗7)로 땡/광땡을 이긴 경우 땡값이 없다

### UI / UX -- 와이어프레임 (UI)

- [x] **UI-01**: 메인 화면에서 방 생성 또는 링크로 참여를 선택할 수 있다
- [ ] **UI-02**: 게임 테이블 화면에 원형으로 플레이어 자리, 카드, 칩 잔액이 표시된다
- [ ] **UI-03**: 자신의 카드는 앞면으로, 타인의 카드는 뒷면(또는 모드별 규칙)으로 표시된다
- [ ] **UI-04**: 베팅 액션 버튼(콜/레이즈/다이)과 레이즈 금액 입력 필드가 표시된다
- [ ] **UI-05**: 현재 판돈(팟) 금액이 테이블 중앙에 표시된다
- [x] **UI-06**: 판 결과 화면에서 카드를 공개하고 승자 및 칩 변동 내역을 표시한다
- [x] **UI-07**: 족보 참고표를 버튼 하나로 볼 수 있다
- [x] **UI-08**: 와이어프레임 단계에서는 카드를 숫자+속성 텍스트로 표시한다 (이미지 없음)

---

## v2 Requirements

### 향상된 UX (Phase 10: 시각/UX)

- **UX-01**: 턴 타이머 표시 및 시간 초과 시 자동 다이 처리
- **UX-02**: 게임 내 텍스트 채팅 → Phase 11
- **UX-03**: 카드 뒤집기 인터랙션 — 카드별 개별 클릭/탭으로 3D flip 애니메이션 후 앞면 공개 → Phase 10
- **UX-04**: 음향 효과 (카드 돌리기, 베팅 소리 등)
- **UX-05**: 카드 배분 시 즉시 노출하지 않고 사용자가 직접 뒤집어야 패 확인 처리 (2장 모두 뒤집으면 완료) → Phase 10
- **UX-06**: 카드 배분 이동 애니메이션 — 중앙 덱에서 각 플레이어 위치로 날아오는 방식 → Phase 10
- **UX-07**: 셔플 인터랙션 고도화 (sutda-shuffle-giri-ux.md Section 1 전체) → Phase 10
- **UX-08**: 기리(Cut) 인터랙션 고도화 (sutda-shuffle-giri-ux.md Section 2 전체) → Phase 10
- **UX-09**: 패널 레이아웃 재설계 — 스크롤 없이 한 화면, 데스크탑 3열/모바일 수직 → Phase 10

### 게임 기록 (Phase 11)

- **HIST-01**: 세션 내 판별 칩 증감 히스토리 표시 → Phase 11
- **HIST-02**: 게임 종료 후 정산 요약 화면 → Phase 11

### 소셜/멀티 기능 (Phase 11)

- **SCHOOL-PROXY**: 학교 대신 가주기 — 결과 화면에서 승자가 다른 플레이어의 다음 판 엔티를 대신 납부, 대상 플레이어에게 토스트 알림 → Phase 11
- **LATE-JOIN**: 뒤늦게 입장 — 게임 시작 후 입장자를 Observer로 처리, 판 교체 시 자동으로 일반 플레이어로 참여 → Phase 11
- **SESSION-END**: 세션 종료 표시 — 플레이어 연결 끊김 시 시트 제거 + 자리 재배치 + 토스트 알림. 2인 게임 중 1명 퇴장 시 남은 1명은 방장 대기 화면으로 전환 → Phase 11

### 올인 POT (Phase 11)

- **ALLIN-POT**: 올인 승리 시 POT 처리 — 올인 승리자는 자신의 잔액총액만큼만 각 플레이어에게서 받고, 차액은 원래 플레이어들에게 반환. 올인 상태에서는 베팅 패널 비활성화, 나머지 플레이어는 베팅 계속 → Phase 11

### 베팅 강조 (Phase 10)

- **BET-HIGHLIGHT**: 베팅 차례일 때 베팅 패널 강조 표시 → Phase 10

---

## v3 (이미지 에셋 단계) — Phase 10

### 화투 이미지

- **IMG-01**: 1~10 광/열끗/일반 화투 카드 이미지로 와이어프레임 텍스트 카드 대체 → Phase 10
- **IMG-02**: 카드 뒷면 이미지 → Phase 10
- **IMG-03**: 게임 테이블 배경(img/background), 메인 타이틀(img/main_tilte) 적용, 재경기 시 img/regame 투명도 오버레이 → Phase 10

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| 회원가입/로그인 | 친구끼리 닉네임으로 참여가 목적, 마찰 없애기 위해 제외 |
| 실제 현금 결제/송금 | 법적 리스크, 오프라인 정산 전제 |
| AI 봇 플레이어 | 친구끼리 플레이 목적, 복잡도 증가 불필요 |
| 관전자 모드 (상시) | v1 범위 밖 — 단, 뒤늦게 입장한 플레이어의 일시적 Observer는 Phase 11에서 구현 |
| 모바일 네이티브 앱 | 웹 앱으로 모바일 브라우저 대응 충분 |
| 영구 계정/전적 저장 | 방 세션 단위 운영, DB 불필요 |
| 글로벌 로비/매치메이킹 | 친구 전용, 공개 방 목록 불필요 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DECK-01 | Phase 1 | Complete |
| HAND-01 | Phase 2 | Complete |
| HAND-02 | Phase 2 | Complete |
| HAND-03 | Phase 2 | Complete |
| HAND-04 | Phase 2 | Complete |
| HAND-05 | Phase 2 | Complete |
| HAND-06 | Phase 2 | Complete |
| HAND-07 | Phase 2 | Complete |
| HAND-08 | Phase 2 | Complete |
| HAND-09 | Phase 2 | Complete |
| INFRA-01 | Phase 3 | Pending |
| INFRA-02 | Phase 3 | Pending |
| INFRA-03 | Phase 3 | Pending |
| INFRA-04 | Phase 3 | Pending |
| INFRA-05 | Phase 3 | Pending |
| INFRA-06 | Phase 3 | Pending |
| SEAT-02 | Phase 4 | Complete |
| SEAT-03 | Phase 4 | Complete |
| DECK-02 | Phase 4 | Complete |
| DECK-03 | Phase 4 | Complete |
| DECK-04 | Phase 4 | Complete |
| DECK-05 | Phase 4 | Complete |
| MODE-OG-01 | Phase 4 | Complete |
| MODE-OG-02 | Phase 4 | Complete |
| BET-01 | Phase 4 | Complete |
| BET-02 | Phase 4 | Complete |
| BET-03 | Phase 4 | Complete |
| BET-04 | Phase 4 | Complete |
| BET-05 | Phase 4 | Complete |
| BET-06 | Phase 4 | Complete |
| CHIP-01 | Phase 5 | Complete |
| CHIP-02 | Phase 5 | Complete |
| CHIP-03 | Phase 5 | Complete |
| CHIP-04 | Phase 5 | Complete |
| CHIP-05 | Phase 5 | Complete |
| UI-01 | Phase 6 | Complete |
| UI-02 | Phase 6 | Pending |
| UI-03 | Phase 6 | Pending |
| UI-04 | Phase 6 | Pending |
| UI-05 | Phase 6 | Pending |
| UI-06 | Phase 6 | Complete |
| UI-07 | Phase 6 | Complete |
| UI-08 | Phase 6 | Complete |
| MODE-SJ-01 | Phase 7 | Complete |
| MODE-SJ-02 | Phase 7 | Complete |
| MODE-SH-01 | Phase 7 | Complete |
| MODE-SH-02 | Phase 7 | Complete |
| MODE-SH-03 | Phase 7 | Complete |
| MODE-SH-04 | Phase 7 | Complete |
| MODE-HR-01 | Phase 8 | Complete |
| MODE-HR-02 | Phase 8 | Complete |
| MODE-HR-03 | Phase 8 | Complete |
| MODE-HR-04 | Phase 8 | Complete |
| MODE-IN-01 | Phase 8 | Complete |
| MODE-IN-02 | Phase 8 | Complete |
| MODE-IN-03 | Phase 8 | Complete |
| MODE-IN-04 | Phase 8 | Complete |
| MODE-IN-05 | Phase 8 | Complete |
| MODE-OG-03 | Phase 9 | Complete |
| RULE-01 | Phase 9 | Complete |
| RULE-02 | Phase 9 | Complete |
| RULE-03 | Phase 9 | Complete |
| RULE-04 | Phase 9 | Complete |
| SEAT-01 | Phase 10 | Complete |
| UX-03 | Phase 10 | Pending |
| UX-05 | Phase 10 | Pending |
| UX-06 | Phase 10 | Pending |
| UX-07 | Phase 10 | Pending |
| UX-08 | Phase 10 | Pending |
| UX-09 | Phase 10 | Complete |
| IMG-01 | Phase 10 | Complete |
| IMG-02 | Phase 10 | Complete |
| IMG-03 | Phase 10 | Complete |
| BET-HIGHLIGHT | Phase 10 | Complete |
| UX-02 | Phase 11 | Pending |
| HIST-01 | Phase 11 | Pending |
| HIST-02 | Phase 11 | Pending |
| SCHOOL-PROXY | Phase 11 | Pending |
| LATE-JOIN | Phase 11 | Pending |
| SESSION-END | Phase 11 | Pending |
| ALLIN-POT | Phase 11 | Pending |

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-31 — Phase 10/11/12 분할 및 신규 요구사항 추가*
