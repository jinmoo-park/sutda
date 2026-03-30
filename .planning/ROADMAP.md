# Roadmap: 온라인 섯다 (친구들끼리)

## 개요

친구들끼리 링크 하나로 접속하여 실시간 섯다를 즐길 수 있는 웹 앱을 구축한다. TypeScript 모노레포 기반으로 공유 타입과 족보 판정 엔진을 먼저 확립한 뒤, WebSocket 인프라 위에 서버 권위 게임 엔진을 올리고, 와이어프레임 UI를 연결한다. 오리지날 모드를 완전히 완성한 후 Strategy 패턴으로 4가지 추가 모드를 확장하고, 특수 규칙(땡값/94재경기)을 마지막에 얹어 안정성을 확보한다.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): 계획된 작업 단위
- Decimal phases (2.1, 2.2): 긴급 삽입 (INSERTED 표시)

- [x] **Phase 1: 프로젝트 기반 + 공유 타입** - 모노레포 구조, 공유 타입 패키지, 카드 모델 정의 (completed 2026-03-29)
- [ ] **Phase 2: 족보 판정 엔진** - HandEvaluator 순수 함수 구현 및 포괄적 TDD
- [ ] **Phase 3: WebSocket 인프라 + 방 관리** - Socket.IO 서버, 방 생성/참여/재접속, 메시지 프로토콜
- [ ] **Phase 4: 오리지날 모드 게임 엔진** - FSM 게임 엔진, 덱/패 돌리기, 선 결정, 베팅 시스템
- [x] **Phase 5: 칩 시스템 + 승패 정산** - 칩 추적, 판돈 계산, 승자 정산, 칩 재충전 (completed 2026-03-29)
- [x] **Phase 6: 클라이언트 UI 와이어프레임** - 로비, 게임 테이블, 카드/칩 표시, 베팅 액션 UI (completed 2026-03-30)
- [ ] **Phase 7: 세장섯다 + 한장공유 모드** - 세장섯다/한장공유 Strategy 구현 및 UI 확장
- [ ] **Phase 8: 후회의섯다 + 인디언섯다 모드** - 드래프트 UI, 카드 가시성 반전 로직
- [ ] **Phase 9: 특수 규칙 (땡값 + 94재경기)** - 땡값 자동 정산, 구사/멍텅구리구사 재경기 상태 머신
- [ ] **Phase 10: 통합 테스트 + 배포** - E2E 검증, Railway/Render 배포, 모바일 브라우저 대응

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
- [ ] 07-02-PLAN.md — 클라이언트 UI (ModeSelectModal 확장, SharedCardSelectModal, HandPanel 카드 선택, GameTable 공유카드, RoomPage 통합)

### Phase 8: 후회의섯다 + 인디언섯다 모드
**Goal**: 5가지 게임 모드 전체가 플레이 가능하다
**Depends on**: Phase 7
**Requirements**: MODE-HR-01, MODE-HR-02, MODE-HR-03, MODE-HR-04, MODE-IN-01, MODE-IN-02, MODE-IN-03, MODE-IN-04, MODE-IN-05
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 후회의섯다: 20장 공개 -> 순서대로 카드 가져가기 -> 2장 선택 -> 베팅 -> 미선택 카드 공개가 작동한다
  2. 인디언섯다: 첫 카드가 나만 안 보이고 타인에게 보이며, 이 상태에서 베팅이 진행된다
  3. 인디언섯다: 두 번째 카드는 나만 볼 수 있으며, 최종 베팅 후 승패가 결정된다
  4. 선 플레이어가 5가지 모드 중 아무 것이나 선택하여 게임을 시작할 수 있다
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD
- [ ] 08-03: TBD

### Phase 9: 특수 규칙 (땡값 + 94재경기)
**Goal**: 하우스룰의 땡값과 94재경기 특수 규칙이 자동으로 작동한다
**Depends on**: Phase 8
**Requirements**: MODE-OG-03, RULE-01, RULE-02, RULE-03, RULE-04
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 오리지날 모드에서 다이한 땡 보유자가 승자에게 땡값(일~구땡 500원, 장/광땡 1000원)을 자동으로 지불한다
  2. 구사(4+9) 보유 생존 시 최고패가 알리 이하이면 재경기가 자동 트리거된다
  3. 멍텅구리구사(열끗4+열끗9) 보유 생존 시 최고패가 팔땡 이하이면 재경기가 자동 트리거된다
  4. 재경기 시 다이한 플레이어가 판돈 절반을 내고 재참여할 수 있다
  5. 땡잡이/암행어사로 승리한 경우 땡값이 적용되지 않는다
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: 통합 테스트 + 배포
**Goal**: 실제 친구들이 링크 하나로 접속하여 섯다를 플레이할 수 있다
**Depends on**: Phase 9
**Requirements**: SEAT-01
**Success Criteria** (완료 시 참이어야 하는 것):
  1. 원형 자리 배치가 2~6인 모든 인원에서 올바르게 표시된다
  2. 배포된 URL에서 방 생성, 링크 공유, 입장, 5가지 모드 플레이가 모두 작동한다
  3. 모바일 브라우저에서 게임 테이블과 베팅 UI가 사용 가능하다
  4. 게임 중 연결 끊김/재접속이 안정적으로 처리된다
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

## Progress

**실행 순서:**
Phase 1 -> 2, 3 (병렬 가능) -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 프로젝트 기반 + 공유 타입 | 2/2 | Complete   | 2026-03-29 |
| 2. 족보 판정 엔진 | 0/2 | Planned | - |
| 3. WebSocket 인프라 + 방 관리 | 2/2 | Complete | 2026-03-29 |
| 4. 오리지날 모드 게임 엔진 | 3/3 | Complete | 2026-03-29 |
| 5. 칩 시스템 + 승패 정산 | 2/2 | Complete   | 2026-03-29 |
| 6. 클라이언트 UI 와이어프레임 | 3/3 | Complete   | 2026-03-30 |
| 7. 세장섯다 + 한장공유 모드 | 1/2 | In Progress|  |
| 8. 후회의섯다 + 인디언섯다 모드 | 0/3 | Not started | - |
| 9. 특수 규칙 (땡값 + 94재경기) | 0/2 | Not started | - |
| 10. 통합 테스트 + 배포 | 0/2 | Not started | - |
