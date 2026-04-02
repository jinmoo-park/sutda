# Roadmap: 온라인 섯다 (친구들끼리)

## 개요

친구들끼리 링크 하나로 접속하여 실시간 섯다를 즐길 수 있는 웹 앱을 구축한다. TypeScript 모노레포 기반으로 공유 타입과 족보 판정 엔진을 먼저 확립한 뒤, WebSocket 인프라 위에 서버 권위 게임 엔진을 올리고, 와이어프레임 UI를 연결한다. 오리지날 모드를 완전히 완성한 후 Strategy 패턴으로 4가지 추가 모드를 확장하고, 특수 규칙(땡값/94재경기)을 마지막에 얹어 안정성을 확보한다.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): 계획된 작업 단위
- Decimal phases (2.1, 2.2): 긴급 삽입 (INSERTED 표시)

- [x] **Phase 1: 프로젝트 기반 + 공유 타입** - 모노레포 구조, 공유 타입 패키지, 카드 모델 정의 (completed 2026-03-29)
- [x] **Phase 2: 족보 판정 엔진** - HandEvaluator 순수 함수 구현 및 포괄적 TDD (completed 2026-03-29)
- [ ] **Phase 3: WebSocket 인프라 + 방 관리** - Socket.IO 서버, 방 생성/참여/재접속, 메시지 프로토콜
- [ ] **Phase 4: 오리지날 모드 게임 엔진** - FSM 게임 엔진, 덱/패 돌리기, 선 결정, 베팅 시스템
- [x] **Phase 5: 칩 시스템 + 승패 정산** - 칩 추적, 판돈 계산, 승자 정산, 칩 재충전 (completed 2026-03-29)
- [x] **Phase 6: 클라이언트 UI 와이어프레임** - 로비, 게임 테이블, 카드/칩 표시, 베팅 액션 UI (completed 2026-03-30)
- [ ] **Phase 7: 세장섯다 + 한장공유 모드** - 세장섯다/한장공유 Strategy 구현 및 UI 확장
- [x] **Phase 8: 골라골라 + 인디언섯다 모드** - 골라골라 카드 선택 UI, 인디언 카드 가시성 반전 로직 (completed 2026-03-30)
- [x] **Phase 9: 특수 규칙 (땡값 + 94재경기)** - 땡값 자동 정산, 구사/멍텅구리구사 재경기 상태 머신 (completed 2026-03-30)
- [x] **Phase 10: 시각/UX 완성** - 카드 이미지, 배분 애니메이션, 뒤집기 인터랙션, 셔플/기리 고도화, 패널 레이아웃 재설계, 베팅 강조 (completed 2026-03-31)
- [x] **Phase 11: 소셜/기능 완성** - 채팅, 게임 이력, 학교 대신 가주기, 뒤늦게 입장(Observer), 세션종료 표시, 올인 POT (completed 2026-04-01)
- [x] **Phase 12: 통합 테스트 + 배포** - E2E 검증, Railway/Render 배포, 모바일 브라우저 대응 (completed 2026-04-02)
- [ ] **Phase 13: Stitch 연계 UI 고도화 (DEFERRED)** - Google Stitch MCP 활용 전체 UI D-09 군용담요 컨셉 개선

## Phase Details

### Phase 1: 프로젝트 기반 + 공유 타입
**Goal**: 서버와 클라이언트가 공유하는 타입 계약이 확립되어 이후 모든 개발의 기반이 된다
**Depends on**: Nothing (첫 번째 페이즈)
**Requirements**: DECK-01
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 모노레포(shared/server/client) 구조에서 `npm install` 및 빌드가 성공한다
  2. shared 패키지에 카드 타입(숫자, 광/열끗/일반 속성)이 정의되어 server/client에서 import 가능하다
  3. 20장 덱 생성 함수가 올바른 카드 구성(1~10 각 2장, 광: 1,3,8 / 열끗: 4,7,9)을 반환한다
  4. 게임 상태, 메시지 프로토콜 타입이 shared에 정의되어 있다
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — 모노레포 인프라 세팅 (pnpm + turborepo + 패키지 스캐폴드)
- [x] 01-02-PLAN.md — 공유 타입 정의 + createDeck() TDD (DECK-01)

### Phase 2: 족보 판정 엔진
**Goal**: 모든 카드 조합에 대해 정확한 족보 판정과 승패 비교가 가능하다
**Depends on**: Phase 1
**Requirements**: HAND-01, HAND-02, HAND-03, HAND-04, HAND-05, HAND-06, HAND-07, HAND-08, HAND-09
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 광땡 3종(삼팔, 일팔, 일삼)이 광 속성 카드 조합에서만 정확히 판정된다
  2. 땡 10종, 특수 조합 6종(알리~새륙), 끗(0~9) 판정이 모든 경우에 올바르다
  3. 땡잡이(3+7)가 구땡~일땡을 이기고 장땡/광땡에게 지는 특수 비교가 작동한다
  4. 암행어사(열끗4+열끗7)가 일팔/일삼광땡을 이기고 삼팔광땡에게 지는 비교가 작동한다
  5. 동점 처리와 구사/멍텅구리구사 판별이 올바르게 작동한다
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — HandEvaluator 타입 정의 + evaluateHand 구현 (TDD) (HAND-01~05)
- [x] 02-02-PLAN.md — compareHands + 특수패 비교 + checkGusaTrigger 구현 (TDD) (HAND-04, 06~09)

### Phase 3: WebSocket 인프라 + 방 관리
**Goal**: 플레이어가 링크로 방에 참여하고 실시간으로 서버와 통신할 수 있다
**Depends on**: Phase 1
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 방장이 방을 생성하면 고유 URL이 발급되어 복사할 수 있다
  2. 플레이어가 링크로 접속하여 닉네임만 입력하면 방에 참여할 수 있다
  3. 방에 7명 이상 접속 시도 시 입장이 거부된다
  4. 연결이 끊긴 플레이어가 같은 링크로 재접속하면 게임에 복귀한다
  5. 각 플레이어가 입장 시 초기 칩 금액을 만원 단위로 설정할 수 있다
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Socket.IO 프로토콜 타입 + 서버 부트스트랩 + RoomManager (INFRA-01, 03, 04, 06)
- [x] 03-02-PLAN.md — RoomManager 단위 테스트 + Socket.IO 통합 테스트 (INFRA-01~03, 05, 06)

### Phase 4: 오리지날 모드 게임 엔진
**Goal**: 서버에서 오리지날 섯다 한 판의 전체 플로우가 완전히 작동한다
**Depends on**: Phase 2, Phase 3
**Requirements**: SEAT-01, SEAT-02, SEAT-03, DECK-02, DECK-03, DECK-04, DECK-05, MODE-OG-01, MODE-OG-02, BET-01, BET-02, BET-03, BET-04, BET-05, BET-06
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 첫 판에서 밤일낮장 규칙으로 선 플레이어가 자동 결정되고, 이후 판은 승자가 선이 된다
  2. 선 플레이어가 셔플 후 기리를 요청하면 왼쪽 플레이어가 기리/퉁을 선택할 수 있다
  3. 반시계 방향으로 카드가 정확히 배분된다 (일반: 1장씩, 퉁: 2장씩)
  4. 베팅 라운드에서 콜/레이즈(자유금액)/다이가 순서대로 진행되고, 모든 생존자 금액이 같아지면 종료된다
  5. 족보 비교로 승자가 결정되고 다음 판으로 넘어갈 수 있다
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — 프로토콜 타입 확장 + GameEngine FSM 핵심 (선 결정, 등교, 셔플, 기리, 배분) (SEAT-01~03, DECK-02~05, MODE-OG-01)
- [x] 04-02-PLAN.md — 베팅 시스템 + 쇼다운 + 승자 판정 + 전체 플로우 통합 (BET-01~06, MODE-OG-02)
- [x] 04-03-PLAN.md — Socket.IO 게임 이벤트 핸들러 연결 + 통합 테스트 (SEAT-01, MODE-OG-02)

### Phase 5: 칩 시스템 + 승패 정산
**Goal**: 플레이어의 칩이 정확히 추적되고 판 결과에 따라 올바르게 정산된다
**Depends on**: Phase 4
**Requirements**: CHIP-01, CHIP-02, CHIP-03, CHIP-04, CHIP-05
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 각 플레이어의 칩 잔액이 실시간으로 정확히 표시된다
  2. 판 종료 시 패배자 칩이 차감되고 승자에게 합산된다
  3. 칩이 0인 플레이어가 재충전을 요청하면 다른 플레이어 전원 동의 후 충전된다
  4. 베팅 시 칩 단위 버튼(500/1000/5000/10000)으로 금액을 조합하여 입력할 수 있다
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — 칩 정산 로직 + ChipBreakdown/effectiveMaxBet 타입 확장 + TDD (CHIP-01, CHIP-02, CHIP-04, CHIP-05)
- [x] 05-02-PLAN.md — 재충전 투표 플로우 + Socket.IO 핸들러 + 유효 스택 검증 (CHIP-03, CHIP-05)

### Phase 6: 클라이언트 UI 와이어프레임
**Goal**: 플레이어가 웹 브라우저에서 로비 입장부터 게임 플레이까지 전체 경험을 할 수 있다
**Depends on**: Phase 4, Phase 5
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 메인 화면에서 방 생성 또는 링크 참여를 선택할 수 있다
  2. 게임 테이블에 원형으로 플레이어 자리, 카드(숫자+속성 텍스트), 칩 잔액이 표시된다
  3. 자신의 카드는 앞면, 타인의 카드는 뒷면으로 표시된다
  4. 베팅 버튼(콜/레이즈/다이)과 판돈 중앙 표시가 작동한다
  5. 판 결과 화면에서 카드 공개, 승자, 칩 변동이 표시되고 족보 참고표를 볼 수 있다
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 06-01-PLAN.md — 패키지 설치 + Tailwind v4 + shadcn/ui 초기화 + Zustand 스토어 + 라우팅 스켈레톤
- [x] 06-02-PLAN.md — 게임 컴포넌트 + 레이아웃 패널 + 대기실 + RoomPage 상태 머신
- [x] 06-03-PLAN.md — 5개 특수 모달 + 결과 화면 + RoomPage 최종 통합

### Phase 7: 세장섯다 + 한장공유 모드
**Goal**: 오리지날 외에 세장섯다와 한장공유 모드를 선택하여 플레이할 수 있다
**Depends on**: Phase 6
**Requirements**: MODE-SJ-01, MODE-SJ-02, MODE-SH-01, MODE-SH-02, MODE-SH-03, MODE-SH-04
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 선 플레이어가 게임 시작 전 세장섯다/한장공유 모드를 선택할 수 있다
  2. 세장섯다: 2장 배분 -> 베팅 -> 1장 추가 -> 3장 중 2장 선택하여 족보 비교가 작동한다
  3. 한장공유: 선이 공유 카드 지정 -> 각자 1장 배분 -> 공유 카드와 조합한 족보 비교가 작동한다
  4. 두 모드 모두 베팅과 승패 정산이 오리지날과 동일하게 작동한다
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 07-01-PLAN.md — 공유 타입 확장 + GameEngine 세장섯다/한장공유 로직 + Socket.IO 핸들러 + 단위 테스트
- [x] 07-02-PLAN.md — 클라이언트 UI (ModeSelectModal 확장, SharedCardSelectModal, HandPanel 카드 선택, GameTable 공유카드, RoomPage 통합)

### Phase 8: 골라골라 + 인디언섯다 모드
**Goal**: 5가지 게임 모드 전체가 플레이 가능하다
**Depends on**: Phase 7
**Requirements**: MODE-HR-01, MODE-HR-02, MODE-HR-03, MODE-HR-04, MODE-IN-01, MODE-IN-02, MODE-IN-03, MODE-IN-04, MODE-IN-05
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 골라골라: 20장 공개 -> 모든 플레이어가 동시에 자유롭게 2장 선착순 선택 -> 베팅 -> 승패 결정이 작동한다
  2. 인디언섯다: 첫 카드가 나만 안 보이고 타인에게 보이며, 이 상태에서 베팅이 진행된다
  3. 인디언섯다: 두 번째 카드는 나만 볼 수 있으며, 최종 베팅 후 승패가 결정된다
  4. 선 플레이어가 5가지 모드 중 아무 것이나 선택하여 게임을 시작할 수 있다
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] 08-01-PLAN.md — 공유 타입 확장(GameMode/GamePhase/GameState) + GameEngine 신규 Strategy + selectGollaCards + getStateFor
- [x] 08-02-PLAN.md — protocol.ts 이벤트 타입 + index.ts 소켓 핸들러 + per-player emit 개편
- [x] 08-03-PLAN.md — GollaSelectModal 신규 + ModeSelectModal 버튼 추가 + HandPanel null 카드 처리 + RoomPage 통합

### Phase 9: 특수 규칙 (땡값 + 94재경기)
**Goal**: 하우스룰의 땡값과 94재경기 특수 규칙이 자동으로 작동한다
**Depends on**: Phase 8
**Requirements**: MODE-OG-03, RULE-01, RULE-02, RULE-03, RULE-04
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 오리지날 모드에서 승자가 땡(일땡 이상)으로 이겼을 때, 다이한 모든 플레이어가 승자에게 땡값(일땡~구땡 500원, 장/광땡 1000원)을 자동으로 납부한다. 라운드 결과에서도 납부 내역이 표시되어야 한다.
  2. 구사(4+9) 보유 생존 시 최고패가 알리 이하이면 재경기가 자동 트리거된다. 다음 경기는 구사패를 가지고 있던 플레이어가 선플레이어가 된다.
  3. 멍텅구리구사(열끗4+열끗9) 보유 생존 시 최고패가 팔땡 이하이면 재경기가 자동 트리거된다. 다음 경기는 구사패를 가지고 있던 플레이어가 선플레이어가 된다.
  4. 구사 재경기에 한하여 재경기 시 다이한 플레이어가 판돈 절반을 내고 재참여할 수 있다.
  5. 땡잡이/암행어사로 승리한 경우 땡값이 적용되지 않는다.
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — 공유 타입 확장 + 땡값 정산 TDD + 구사 재경기 FSM TDD (MODE-OG-03, RULE-01~04)
- [x] 09-02-PLAN.md — 소켓 핸들러 + GusaRejoinModal + ResultScreen 땡값 UI + RoomPage 통합 (RULE-03, MODE-OG-03)

### Phase 10: 시각/UX 완성

**Goal**: 배포 전 시각/인터랙션 경험을 완성한다 — 실제 카드 이미지, 카드 배분 애니메이션, 카드 뒤집기 인터랙션, 셔플/기리 UX 고도화, 패널 레이아웃 재설계, 베팅 강조 표시가 완성된다.
**Depends on**: Phase 9
**Requirements**:
- UX-03: 카드 뒤집기 인터랙션 — 카드별 개별 클릭/탭으로 3D flip 애니메이션 후 앞면 공개
- UX-05: 카드 배분 시 즉시 노출하지 않고 사용자가 직접 뒤집어야 패 확인 처리 (2장 모두 뒤집으면 완료)
- UX-06: 카드 배분 이동 애니메이션 — 중앙 덱에서 각 플레이어 위치로 날아오는 방식
- UX-07: 셔플 인터랙션 고도화 (sutda-shuffle-giri-ux.md Section 1 전체 구현)
- UX-08: 기리(Cut) 인터랙션 고도화 (sutda-shuffle-giri-ux.md Section 2 전체 구현)
- UX-09: 패널 레이아웃 재설계 — 스크롤 없이 한 화면, 데스크탑 3열/모바일 수직
- IMG-01: 실제 카드 이미지 적용 (img/01-1, 01-2, 02-1,...10-2) — CSS 이펙트로 실물 카드 느낌 구현
- IMG-02: 카드 뒷면 이미지 적용 (img/card_back) — CSS 이펙트 적용
- IMG-03: 테이블 배경(img/background), 메인 타이틀(img/main_tilte) 적용, 재경기 시 img/regame 투명도 오버레이
- BET-HIGHLIGHT: 베팅 차례일 때 베팅 패널 강조 표시
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 카드가 실제 이미지로 표시되며 CSS 이펙트로 실물감이 있다
  2. 카드 배분 시 중앙 덱에서 날아오는 애니메이션이 표시되며, 도착 후 뒷면 상태로 대기한다
  3. 각 카드를 클릭하면 3D flip 애니메이션으로 앞면이 공개되고, 2장 모두 뒤집으면 패 확인 처리된다
  4. 셔플 버튼 누르는 동안 rAF 기반 셔플 애니메이션이 루프하고, 떼면 즉시 종료된다
  5. 기리 화면에서 드래그로 더미 분리, 탭으로 순서 지정, 합치기 완료가 작동한다
  6. 데스크탑에서 스크롤 없이 좌사이드(베팅/손패)|중앙(테이블)|우사이드(정보/채팅placeholder) 배치가 표시된다
  7. 모바일에서 스크롤 없이 상단(테이블+정보레이어)|중단(베팅/손패)|하단(채팅placeholder) 배치가 표시된다
  8. 내 베팅 차례일 때 베팅 패널이 강조 표시된다
**Plans**: 4 plans

Plans:
- [x] 10-01-PLAN.md — HwatuCard 컴포넌트 + cardImageUtils + img 에셋 설정 (IMG-01, IMG-02)
- [x] 10-02-PLAN.md — 패널 레이아웃 3열/수직 재설계 + 배경/타이틀/재경기 이미지 + 베팅 강조 (UX-09, IMG-03, BET-HIGHLIGHT)
- [x] 10-03-PLAN.md — 카드 flip 인터랙션 + CardFace/CardBack 전면 교체 + 배분 애니메이션 (UX-03, UX-05, UX-06)
- [x] 10-04-PLAN.md — 셔플 rAF 애니메이션 + 기리 드래그/탭 UX 재설계 (UX-07, UX-08)

### Phase 11: 소셜/기능 완성

**Goal**: 게임의 소셜 기능과 추가 게임 기능을 완성한다 — 텍스트 채팅, 게임 이력, 학교 대신 가주기, 뒤늦게 입장(Observer), 세션 종료 표시, 올인 POT 처리가 완성된다.
**Depends on**: Phase 10
**Requirements**:
- UX-02: 텍스트 채팅 기능 구현
- HIST-01: 게임 이력 기능 (상세 내용 플래닝 시 확정)
- HIST-02: 게임 이력 기능 (상세 내용 플래닝 시 확정)
- SCHOOL-PROXY: 학교 대신 가주기 — 결과 화면에서 승자가 다른 플레이어의 다음 판 엔티를 대신 납부
- LATE-JOIN: 게임 시작 후 입장자를 Observer로 처리, 판 교체 시 자동 참여
- SESSION-END: 플레이어 세션 종료 시 시트 제거 + 자리 재배치 + 토스트 알림
- ALLIN-POT: 올인 승리 시 POT 처리 — 올인 승리자는 자신의 잔액총액만큼만 각 플레이어에게서 받고, 차액은 원래 플레이어들에게 반환. 올인 상태에서는 베팅 패널 비활성화.
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 텍스트 채팅이 실시간으로 작동한다
  2. 게임 이력이 표시된다
  3. 결과 화면에서 승자가 [학교 대신 가주기] 버튼으로 다른 플레이어의 다음 판 엔티를 대신 낼 수 있다
  4. 게임 중 입장한 플레이어가 Observer로 진행을 관람하고 판 교체 시 자동으로 참여한다
  5. 플레이어가 연결을 끊으면 시트가 제거되고 자리가 재배치되며 토스트 알림이 표시된다
  6. 올인 상황에서 POT이 올바르게 분배된다
**Plans**: 4 plans

Plans:
- [x] 11-01-PLAN.md — 공유 타입/프로토콜 계약 확장 + 채팅 서버/클라이언트 (UX-02)
- [x] 11-02-PLAN.md — GameEngine 올인 POT + 학교 대납 + 이력 생성 (ALLIN-POT, SCHOOL-PROXY, HIST-01/02)
- [x] 11-03-PLAN.md — Observer + 세션 종료 서버 로직 (LATE-JOIN, SESSION-END)
- [x] 11-04-PLAN.md — 클라이언트 UI 통합 — 이력 모달, 학교 대납, Observer/올인 배지, 세션 종료 토스트

### Phase 12: 통합 테스트 + 배포
**Goal**: 실제 친구들이 링크 하나로 접속하여 섯다를 플레이할 수 있다
**Depends on**: Phase 11
**Requirements**: SEAT-01
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 원형 자리 배치가 2~6인 모든 인원에서 올바르게 표시된다
  2. 배포된 URL에서 방 생성, 링크 공유, 입장, 5가지 모드 플레이가 모두 작동한다
  3. 모바일 브라우저에서 게임 테이블과 베팅 UI가 사용 가능하다
  4. 게임 중 연결 끊김/재접속이 안정적으로 처리된다
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — 코드 수정 (STATIC_DIR fix + ecosystem.config.cjs) + GitHub push
- [x] 12-02-PLAN.md — Oracle VM 배포 (Node.js + nginx + SSL + PM2) + 배포 검증

### Phase 12.1: 보안 감사 (Security Audit) — OWASP Top 10 코드 점검, npm audit 의존성 스캔, 환경변수/시크릿 노출 점검, 인증/인가 검증, 서버 설정 보안 확인 (INSERTED)

**Goal:** 실서비스의 OWASP Top 10 기준 보안 취약점을 감사하고, Critical/High 취약점을 즉시 수정한다
**Requirements**: D-03, D-04, D-05, D-06, D-07, D-08, A01, A03, A09
**Depends on:** Phase 12
**Plans:** 2 plans
**Success Criteria** (완료 시 참이어야 하는 것):
  1. .env가 .gitignore에 포함되어 시크릿 노출이 방지된다
  2. CORS fallback이 명시적 도메인으로 설정되어 모든 origin 허용이 차단된다
  3. Socket.IO rate limiting이 소켓당 초당 20개 이벤트로 제한된다
  4. nginx 보안 헤더 3종이 적용되고 WebSocket 연결이 IP당 5개로 제한된다
  5. OWASP Top 10 감사 보고서가 전체 항목을 커버한다

Plans:
- [ ] 12.1-01-PLAN.md — 코드 레벨 보안 수정 (CORS, rate limiting, send-chat 접근 제어) + 통합 테스트
- [ ] 12.1-02-PLAN.md — nginx 인프라 보안 설정 + OWASP Top 10 감사 보고서

### Phase 14: 서버 레벨 방 생성 패스워드

**Goal:** 방 생성 시 서버 관리자 비밀번호 입력을 요구한다. 올바른 비밀번호 없이는 방을 만들 수 없어 낯선 사람이 무단으로 방을 생성하는 것을 방지한다. 비밀번호는 서버 환경변수(.env)로 관리하며 검증은 서버 권위로 동작한다.
**Requirements:** ROOM-CREATE-PASSWORD-SERVER, ROOM-CREATE-PASSWORD-CLIENT
**Depends on:** Phase 12
**Plans:** 1/1 plans complete

Plans:
- [ ] 14-01-PLAN.md — 프로토콜 타입 확장 + 서버 비밀번호 검증 + 클라이언트 UI (ROOM-CREATE-PASSWORD-SERVER, ROOM-CREATE-PASSWORD-CLIENT)

### Phase 13: Stitch 연계 UI 고도화 (DEFERRED)

**Goal:** Google Stitch MCP를 활용하여 전체 UI를 D-09 군용담요 컨셉("공장에서 군용담요 깔아놓고 하는 느낌")으로 프로페셔널하게 개선한다 — 메인화면, 대기실, 게임테이블, 패널, 모달 16개, 공통 UI 전체.
**Requirements**: STITCH-SETUP, STITCH-DESIGN-SYSTEM, STITCH-MAINPAGE, STITCH-WAITINGROOM, STITCH-GAMETABLE, STITCH-PLAYERSEAT, STITCH-BETTINGPANEL, STITCH-HANDPANEL, STITCH-INFOPANEL, STITCH-MODAL-HIGH, STITCH-MODAL-REST, STITCH-COMMON-UI, STITCH-RESULTSCREEN
**Depends on:** Phase 12
**Plans:** 2/2 plans complete
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 모든 주요 화면과 모달이 D-09 군용담요 컨셉으로 시각적으로 개선되어 있다
  2. 기존 게임 로직(소켓 통신, 상태 관리)이 변경 없이 동작한다
  3. ShuffleModal/CutModal의 rAF 애니메이션/드래그 로직이 완전히 보존되어 있다
  4. HwatuCard 3D flip 인터랙션이 모든 v2 컴포넌트에서 정상 동작한다
  5. pnpm test 통과 (리그레션 없음)

Plans:
- [x] 10.1-01-PLAN.md — Stitch MCP 환경 설정 + DESIGN.md 작성 + 디자인 시스템 등록
- [x] 10.1-02-PLAN.md — MainPage + WaitingRoom UI 고도화
- [x] 10.1-03-PLAN.md — GameTable + PlayerSeat UI 고도화
- [ ] 10.1-04-PLAN.md — BettingPanel + HandPanel + InfoPanel UI 고도화
- [ ] 10.1-05-PLAN.md — 고우선순위 모달 4개 UI 고도화 (ModeSelect, AttendSchool, DealerSelect, DealerResult)
- [ ] 10.1-06-PLAN.md — 나머지 모달 12개 UI 고도화 (Shuffle, Cut 외관만 + 나머지 10개)
- [ ] 10.1-07-PLAN.md — shadcn/ui 공통 UI 커스터마이징 + ResultScreen + 전체 리그레션

## Progress

**실행 순서:**
Phase 1 -> 2, 3 (병렬 가능) -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 프로젝트 기반 + 공유 타입 | 2/2 | Complete   | 2026-03-29 |
| 2. 족보 판정 엔진 | 2/2 | Complete | 2026-03-29 |
| 3. WebSocket 인프라 + 방 관리 | 2/2 | Complete | 2026-03-29 |
| 4. 오리지날 모드 게임 엔진 | 3/3 | Complete | 2026-03-29 |
| 5. 칩 시스템 + 승패 정산 | 2/2 | Complete   | 2026-03-29 |
| 6. 클라이언트 UI 와이어프레임 | 3/3 | Complete   | 2026-03-30 |
| 7. 세장섯다 + 한장공유 모드 | 2/2 | Complete | 2026-03-30 |
| 8. 골라골라 + 인디언섯다 모드 | 3/3 | Complete   | 2026-03-30 |
| 9. 특수 규칙 (땡값 + 94재경기) | 2/2 | Complete   | 2026-03-30 |
| 10. 시각/UX 완성 | 4/4 | Complete    | 2026-03-31 |
| 11. 소셜/기능 완성 | 4/4 | Complete    | 2026-04-01 |
| 12. 통합 테스트 + 배포 | 2/2 | Complete    | 2026-04-02 |
| 13. Stitch UI 고도화 | 3/7 | Deferred | - |
| 14. 서버 레벨 방 생성 패스워드 | 0/1 | Complete    | 2026-04-02 |

