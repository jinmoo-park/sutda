---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: Completed quick-260404-vl1-PLAN.md
last_updated: "2026-04-04T13:47:43.025Z"
last_activity: "2026-04-04 - Completed quick task 260404-vl1: 한장공유 결과화면 공유카드 포함 2장 표시 + 족보 뱃지"
progress:
  total_phases: 18
  completed_phases: 17
  total_plans: 46
  completed_plans: 42
  percent: 44
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-29)

**Core value:** 아무 설치 없이 링크 하나로 친구들과 실시간으로 섯다를 즐길 수 있어야 한다.
**Current focus:** v1.0 완료 — 다음 마일스톤 계획 중 (`/gsd:new-milestone`)

## Current Position

Phase: 16
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-05 - Completed quick task 260405-v03: 결과화면 퇴장 시 팟 반환 및 이력 잔액 기록 (5a454ae)

Progress: [████░░░░░░] 44%

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: ~15 min/plan
- Total execution time: ~2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 01 | 2 | ~260 min | ~130 min |
| Phase 02 | 2 | ~325 min | ~163 min |
| Phase 03 | 2 | ~15 min | ~8 min |
| Phase 04 | 3 | ~10 min | ~3 min |

**Recent Trend:**

- Last 5 plans: Phase 04-01 (4min), Phase 04-02 (6min), Phase 04-03 (4min)
- Trend: 빠름

*Updated after each plan completion*
| Phase 01-project-foundation-shared-types P01 | 152 | 2 tasks | 17 files |
| Phase 01-project-foundation-shared-types P02 | 108 | 2 tasks | 7 files |
| Phase 02 P01 | 166 | 2 tasks | 3 files |
| Phase 02 P02 | 159 | 2 tasks | 5 files |
| Phase 03 P01 | - | 2 tasks | 3 files |
| Phase 03 P02 | 15 | 2 tasks | 5 files |
| Phase 04-original-mode-game-engine P01 | 4 | 1 tasks | 5 files |
| Phase 04-original-mode-game-engine P02 | 6 | 2 tasks | 3 files |
| Phase 04-original-mode-game-engine P03 | 4 | 1 tasks | 3 files |
| Phase 05-chip-system-settlement P01 | 5 | 1 tasks | 6 files |
| Phase 05-chip-system-settlement P02 | 198 | 2 tasks | 4 files |
| Phase 06-ui P01 | 7 | 2 tasks | 29 files |
| Phase 06-ui P02 | 8 | 3 tasks | 13 files |
| Phase 07-sejang-hanjang-modes P01 | 833 | 1 tasks | 6 files |
| Phase 07-sejang-hanjang-modes P02 | 0 | 2 tasks | 6 files |
| Phase 08 P01 | 20 | 2 tasks | 2 files |
| Phase 08-huhwi-indian-modes P03 | 20 | 2 tasks | 8 files |
| Phase 08-huhwi-indian-modes P02 | 5 | 2 tasks | 1 files |
| Phase 09-94 P01 | 1420 | 2 tasks | 4 files |
| Phase 09-94 P02 | 420 | 1 tasks | 4 files |
| Phase 10-ux P01 | 8 | 2 tasks | 28 files |
| Phase 10-ux P02 | 3 | 2 tasks | 7 files |
| Phase 10-ux P04 | 3 | 2 tasks | 4 files |
| Phase 10-ux P03 | 510 | 2 tasks | 15 files |
| Phase 10.1-stitch-ui P01 | 4 | 1 tasks | 1 files |
| Phase 10.1-stitch-ui P03 | 15 | 2 tasks | 2 files |
| Phase 10.1-stitch-ui P02 | 40min | 2 tasks | 2 files |
| Phase 11-social-features P03 | 15 | 2 tasks | 3 files |
| Phase 11-social-features P04 | 45 | 3 tasks | 11 files |
| Phase 12-deploy P01 | 6 | 2 tasks | 3 files |
| Phase 12-deploy P02 | 35 | 2 tasks | 8 files |
| Phase 14-room-password P01 | 2 | 2 tasks | 3 files |
| Phase 12.1-security-audit-owasp-top-10-npm-audit P02 | 10 | 2 tasks | 1 files |
| Phase 15 P01 | 34 | 1 tasks | 1 files |
| Phase 15-bet07-check-verification P02 | 6 | 2 tasks | 1 files |
| Phase 16-session-end-visual-fix P01 | 5 | 1 tasks | 1 files |
| Phase 16-session-end-visual-fix P02 | 5 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 로드맵: TypeScript 모노레포(shared/server/client) 구조 채택
- 로드맵: 족보 판정 엔진을 네트워크보다 먼저 구현 (순수 함수 TDD)
- 로드맵: 오리지날 모드 완성 후 Strategy 패턴으로 4가지 모드 확장
- 로드맵: 특수 규칙(땡값/94재경기)은 기본 플로우 안정화 후 마지막에 추가
- [Phase 01-project-foundation-shared-types]: pnpm workspaces + turborepo 조합 채택 (shared -> server/client 빌드 파이프라인)
- [Phase 01-project-foundation-shared-types]: tsconfig.base.json 상속 패턴 채택 (strict: true, ES2022, moduleResolution: bundler)
- [Phase 01-project-foundation-shared-types]: React 19 + Vite 6 클라이언트 스택 채택 (SSR 불필요한 실시간 SPA)
- [Phase 01-project-foundation-shared-types]: Card 인터페이스에 isSpecial 제거 - attribute(gwang/yeolkkeut/normal)로 특수 여부 직접 표현
- [Phase 01-project-foundation-shared-types]: createDeck()은 셔플 없이 정렬된 순수 함수 반환 - 셔플은 게임 엔진에서 별도 처리
- [Phase 01-project-foundation-shared-types]: vitest@3 선택 - Vite 기반 ESM 네이티브, shared(type:module)와 완전 호환
- [Phase 02]: HandType을 string union type으로 정의 - enum 대신 타입 안전성과 가독성 확보
- [Phase 02]: 점수 체계: 광땡 1100-1300, 땡 1001-1010, 특수조합 10-60, 끗 0-9 - 카테고리 간 자연스러운 비교 가능
- [Phase 02]: 땡잡이/암행어사는 handType='kkut' + isSpecialBeater=true로 표현 - compareHands에서 특수 로직 우선 적용
- [Phase 02]: 땡잡이/암행어사 구별은 score 값(0/1)으로 판별 - HandResult 변경 불필요
- [Phase 02]: compareHands는 순수 비교만 담당, 재경기 트리거는 checkGusaTrigger로 분리
- [Phase 03-01]: 방 ID를 crypto.randomUUID().slice(0, 8)로 생성 — 충돌 안전성 우선 (D-01)
- [Phase 03-01]: 재접속 식별을 닉네임+방코드 조합으로 처리, 대기실 동일 닉네임 차단 (D-04~D-06)
- [Phase 03-01]: 인메모리 Map 저장, 방장 승계는 입장 순서 기준 다음 플레이어 (D-12, D-14)
- [Phase 03-02]: beforeAll/afterAll을 Promise 기반으로 구현 (vitest의 done 콜백 미지원)
- [Phase 03-02]: Promise.all 병렬 연결 대기로 다중 클라이언트 race condition 방지
- [Phase 03-02]: NODE_ENV !== 'test' 조건부 listen으로 테스트 중 포트 충돌 방지
- [Phase 04-01]: completeAttendSchool()를 public으로 노출 — 타임아웃 처리 시 외부 호출 필요
- [Phase 04-01]: cut 후 자동으로 dealCards() 호출 — FSM 전환 일관성 유지
- [Phase 04-01]: declareTtong 후 phase=betting — 퉁 선언 후 즉시 betting 전환
- [Phase 04-02]: 베팅 액션 완료 추적에 private Set(_bettingActed)을 GameEngine 필드로 관리
- [Phase 04-02]: 레이즈 발생 시 _bettingActed를 레이즈한 플레이어만 남기고 초기화 — 순환 재베팅 구현
- [Phase 04-02]: nextRound는 winnerId를 dealer로 설정한 후 attend-school phase로 전환
- [Phase 04-03]: handleGameAction 헬퍼 패턴 — 액션 실행 후 game-state 브로드캐스트, 에러 시 game-error 개별 전송
- [Phase 04-03]: gameEngines Map export — 테스트에서 직접 engine state 접근 가능
- [Phase 04-03]: start-game에서 mode='original'은 초기값, select-mode 이벤트로 실제 모드 결정 (D-01, MODE-OG-01 부합)
- [Phase 05-chip-system-settlement]: pot은 result phase에서 표시용으로 유지, nextRound()에서 0 리셋 (D-01 부합)
- [Phase 05-chip-system-settlement]: applyRechargeToPlayer는 _updateChipBreakdowns + _updateEffectiveMaxBet 자동 연쇄 — 재충전 후 파생 상태 일관성 보장
- [Phase 05-chip-system-settlement]: 거부 시 processRechargeVote는 delete 전에 requesterId 추출하여 반환 — 투표자 ID 오염 방지
- [Phase 05-chip-system-settlement]: recharge-vote 거부 분기에서 result.requesterId 직접 사용 (socket.data.playerId 사용 금지)
- [Phase 06-ui]: Tailwind v4에서 @apply border-border 미지원 -> @theme inline CSS 변수 직접 정의 방식 채택
- [Phase 06-ui]: jsdom@24 채택 (v29는 @exodus/bytes ESM 호환성 문제)
- [Phase 06-ui-02]: evaluateHand를 클라이언트에서 직접 호출하여 족보명 인라인 표시 — 서버 result phase 이전에도 플레이어에게 자신의 패 정보 제공
- [Phase 06-ui-02]: PlayerSeat 모바일/데스크톱 이중 렌더 채택 — CSS custom properties 원형 배치는 md 이상, 모바일은 별도 flex 아이템
- [Phase 06-ui-02]: RoomPage waiting/게임진행/result 3단계 FSM, join-room emit은 06-03에서 통합
- [Phase 07-sejang-hanjang-modes]: GameModeStrategy 인터페이스 + 3개 Strategy 클래스를 game-engine.ts 내부 구현 (per D-01, D-02)
- [Phase 07-sejang-hanjang-modes]: Strategy 위임 범위: deal()+showdown()만 — 베팅/정산은 GameEngine에 유지 (per D-02)
- [Phase 07-sejang-hanjang-modes]: BETTING_PHASES 상수로 betting/betting-1/betting-2 phase 통합 처리
- [Phase 07-sejang-hanjang-modes]: sharedCard는 store에서 직접 읽지 않고 RoomPage에서 prop으로 전달 — 데이터 흐름 명확화
- [Phase 07-sejang-hanjang-modes]: HandPanel card-select 모드: selectedIndices state로 토글 관리, phase prop 외부 주입 방식 채택
- [Phase 08-01]: _gollaSelectedIndices: Map으로 선착순 골라골라 선택 인덱스 추적
- [Phase 08-01]: 인디언 betting-1 완료시 phase='dealing-extra' → 소켓 핸들러(08-02)가 dealExtraCardIndian() 자동 호출
- [Phase 08-huhwi-indian-modes]: PlayerState.cards를 (Card | null)[]로 확장 — 인디언 모드 getStateFor() 마스킹 지원
- [Phase 08-huhwi-indian-modes]: GollaSelectModal: 2장 선택 즉시 자동 emit — 확인 버튼 없는 UX
- [Phase 08-huhwi-indian-modes]: 골라골라 cutting→betting 딜링 애니메이션 스킵 — 직접 선택 모드이므로 showCardConfirm 불필요
- [Phase 08-huhwi-indian-modes]: handleGameAction 항상 per-player emit으로 단순화 — getStateFor가 인디언 모드에서만 마스킹 적용, 다른 모드 성능 동등
- [Phase 08-huhwi-indian-modes]: 인디언 bet-action 내부에서 dealing-extra 자동 처리 — fire-and-forget 패턴 유지
- [Phase 09-94]: gusa-pending과 rematch-pending을 별도 phase로 분리 — 구사 재경기는 다이 플레이어 재참여 결정 필요
- [Phase 09-94]: _startGusaRematch()는 mode를 변경하지 않음 — startRematch()와 핵심 차이
- [Phase 09-94]: GusaRejoinModal: decided 상태로 중복 emit 방지 — 결정 완료 후 텍스트로 대체
- [Phase 09-94]: gusa-pending RoomPage: needsDecision(amDied && decision===null) 조건으로 모달 vs 대기 메시지 분기
- [Phase 09-94 2차UAT]: evaluateHand 규칙 변경 — 모든 3+7=땡잡이, 모든 4+9=구사 (속성 무관), 열끗+열끗만 멍텅구리구사
- [Phase 09-94 2차UAT]: startRematch→confirmRematch 패턴 — rematchConfirmedIds로 모든 동점자 확인 후 시작
- [Phase 09-94 2차UAT]: 동점/구사 재경기 totalBet 리셋 안 함 — 이전 판 + 재경기 베팅 누적으로 정확한 손익
- [Phase 09-94 2차UAT]: SejangCardSelectModal 모달로 세장섯다 카드 선택 UI 이동 (HandPanel에서 제거)
- [Phase 09-94 2차UAT]: cardConfirmed 상태로 베팅 버튼 타이밍 제어 — 패확인 모달 확인 후에만 활성화
- [Phase 09-94 2차UAT]: takeBreak에서 dealer 거부 (DEALER_CANNOT_SKIP)
- [Phase 10-ux]: public/img/ 직접 복사 방식 — vite.config.ts publicDir 변경 없이 Vite 기본 public/ 경로 활용
- [Phase 10-ux]: HwatuCard .hwatu-face=뒷면이미지, .hwatu-back=앞면이미지 — CSS backface-visibility 관례 준수
- [Phase 10-ux-02]: RoomPage 헤더 제거 — 3열 레이아웃에서 공간 낭비, 방 ID는 InfoPanel에서 확인 가능
- [Phase 10-ux-02]: isRematch 판단을 prevPhaseRef 기반으로 구현 — gameState에 round 필드 없어 phase 이력 활용
- [Phase 10-ux]: rAF 기반 JS 애니메이션 선택 — CSS keyframe으로는 페이즈별 세밀한 타이밍 제어 불가
- [Phase 10-ux]: 드래그/탭 구분에 pointer threshold 8px 적용 — touchstart/mousedown 분기 없이 통일
- [Phase 10-ux]: HandPanel: flippedIndices(Set<number>) 로컬 상태로 flip 추적, 2장 완료 시 onAllFlipped() 콜백
- [Phase 10-ux]: showCardConfirm 오버레이 완전 제거 — flip 인터랙션으로 대체, cardConfirmed는 onAllFlipped로 설정
- [Phase 10.1-stitch-ui]: Stitch MCP는 @_davideast/stitch-mcp NPX 프록시 방식으로 연결, STITCH_API_KEY 인증
- [Phase 10.1-stitch-ui]: create_design_system theme.designMd 필드로 D-09 군용담요 가이드라인 전달, projectId/designSystemId는 name 필드에서 추출
- [Phase 10.1-stitch-ui]: 이후 Wave에서 generate_screen_from_text + apply_design_system 조합으로 컴포넌트 생성
- [Phase 10.1-stitch-ui]: Stitch generate_screen_from_text 미지원으로 타원형 게임판 felt + 코너 마커 + 3단 PlayerSeat 구조를 D-09 토큰으로 직접 구현
- [Phase 10.1-stitch-ui]: Stitch HTML 레이아웃 구조를 React primary skeleton으로 사용 — 색상 적용이 아닌 레이아웃 채용 방식
- [Phase 10.1-stitch-ui]: wool-texture CSS: radial-gradient dot-grain + backgroundColor 조합으로 캔버스 텍스처 구현
- [Phase 11-social-features]: Observer 입장 시 roomManager 우회하여 index.ts에서 직접 RoomPlayer 생성 (GAME_IN_PROGRESS 에러 회피)
- [Phase 11-social-features]: GameEngine 재생성(방법 A): nextRound() 이후 Observer 합류 시 새 GameEngine 인스턴스 생성
- [Phase 11-social-features]: InfoPanel 완전 제거 — 이력 버튼은 RoomPage 직접 관리, 잔액은 PlayerSeat isMe 골드 강조로 대체
- [Phase 11-social-features]: ChatPanel mobile prop: opacity 0.05/0.5/0.8 + pointer-events-none 패턴으로 게임 위 오버레이 구현
- [Phase 11-social-features]: handLabels.ts 공유 유틸 — HAND_TYPE_KOREAN 매핑 단일 진실 출처, ResultScreen/HistoryModal 중복 제거
- [Phase 12-deploy]: STATIC_DIR를 import.meta.url 기반으로 변경 — PM2 cwd 무관 올바른 경로 보장
- [Phase 12-deploy]: GitHub 리포지토리 jinmoo-park/sutda 퍼블릭으로 생성, VM git clone 가능
- [Phase 12-deploy]: iptables 규칙을 REJECT 이전에 삽입해야 함 — Oracle VM 기본 체인의 REJECT 위치 주의
- [Phase 12-deploy]: shared ESM .js 확장자 필수 — moduleResolution:bundler는 프로덕션 Node.js ESM에서 extensionless import 해결 불가
- [Phase 12-hotfix]: 모든 게임 이미지를 img 태그 대신 CSS background-image로 적용 — 모바일 롱프레스 다운로드 방지
- [Phase 12-hotfix]: 셔플/기리 모달 안내문구를 DialogTitle로 이동 — 카드더미 영역 침범 방지
- [Phase 12-hotfix]: 대기실 disconnect 시 room-state emit 필수 — player-left만으론 클라이언트 목록 갱신 안 됨
- [Phase 14-room-password]: ROOM_CREATE_PASSWORD 환경변수 설정 시에만 비밀번호 강제 — 미설정 시 하위 호환으로 누구나 방 생성 가능
- [Phase 14-room-password]: password 필드를 optional로 정의 — 기존 클라이언트 및 테스트 코드 변경 없이 호환
- [Phase 12.1]: CSP connect-src에 wss://sutda.duckdns.org 명시 — self만으로는 WebSocket wss:// 차단됨
- [Phase 12.1]: Medium/Low 잔여 항목 3건(innerHTML XSS, 닉네임 길이, 에러 로깅) 보고서 기록만 — D-01 결정 준수
- [Quick-260404-i8w]: 베팅 완료 후 자동 showdown 대신 `card-reveal` phase 도입 — 플레이어가 클릭으로 한장씩 공개, 전원 공개 완료 시 서버 자동 showdown
- [Quick-260404-i8w]: `PlayerState.revealedCardIndices?: number[]` 추가 — 개별 카드 공개 상태 추적
- [Quick-260404-i8w]: `reveal-my-card` 소켓 이벤트 추가 (`ClientToServerEvents`) — 카드 인덱스 전달
- [Quick-260404-i8w]: ResultScreen이 `card-reveal` / `result` 이중 모드로 동작 — `card-reveal`에서는 카드 뒷면 표시 + 클릭 공개, `result`에서만 승패 + 버튼 표시
- [Quick-260404-i8w]: 전원 다이 muck/reveal 선택 플로우는 기존 그대로 유지 — card-reveal phase 미적용
- [Phase 15]: BET-07 구현은 이미 코드베이스에 완전히 구현되어 있었으며, 추적 기록(REQUIREMENTS.md)만 누락된 orphaned gap 상태였음
- [Phase 15-bet07-check-verification]: '종료: 전원 체크 시 showdown 전환' 테스트 실패는 pre-existing 테스트 로직 오류 — 구현은 올바름 (openingBettorSeatIndex 기반 선 권한 검증)
- [Phase 16-session-end-visual-fix]: getRoom() undefined 방어: updatedRoomAfterDisconnect null check guard 패턴 (기존 index.ts 패턴과 일치)
- [Phase 16-session-end-visual-fix]: Phase 15 VERIFICATION.md 포맷을 그대로 적용 (per D-04) — 코드 트레이서빌리티 + 구현 증거 문서화, 수동 테스트 절차 생략

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 10 (구 09.1) inserted after Phase 9: 향상된 UX 및 이미지 적용 통합 페이즈 — 배포 전 필수 UX 완성 작업 (카드 이미지, 뒤집기, 채팅, 베팅 강조, 올인 POT, 이력). 기존 Phase 10(통합 테스트+배포)은 Phase 11로 번호 변경.
- Phase 10.1 inserted after Phase 10: Stitch 연계 UI 고도화 (INSERTED) — Anthropic Stitch 툴을 활용한 UI 디자인 고도화 작업.
- Phase 12.1 inserted after Phase 12: 보안 감사 (Security Audit) (URGENT) — OWASP Top 10 코드 점검, npm audit 의존성 스캔, 환경변수/시크릿 노출 점검, 인증/인가 검증, 서버 설정 보안 확인

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260404-i8w | 결과 공개 플로우 수정 — 카드 클릭 한장씩 공개 후 최종 승패 노출 | 2026-04-04 | a4ef055 | [260404-i8w-card-reveal-flow](./quick/260404-i8w-card-reveal-flow/) |
| 260404-jn6 | SFX 시스템 구현 — 17개 이벤트 매핑 및 트리거 조건 적용 | 2026-04-04 | 00146f9 | [260404-jn6-sfx-17](./quick/260404-jn6-sfx-17/) |
| 260404-nkl | UX 개선 4종 — 동점 재경기 ResultScreen 통합, 내 차례 알림, 모드 라벨, 체크 SFX 교체 + 볼륨 균일화 | 2026-04-04 | 06a1b8d | [260404-nkl-sfx](./quick/260404-nkl-sfx/) |
| 260404-o0y | 내차례 알림 전체화면 반투명 모달+3초, BGM볼륨 0.1 | 2026-04-04 | 6c23917 | [260404-o0y-3-bgm-0-1](./quick/260404-o0y-3-bgm-0-1/) |
| 260404-jdp | SFX 이중 재생 버그 수정 — ShuffleModal readOnly 경로, CutModal 터치 split 경로 | 2026-04-04 | c4bddeb | [260404-jdp-sfx-double-play-fix](./quick/260404-jdp-sfx-double-play-fix/) |
| 260404-pn6 | SFX 버그 수정 2종 — card-reveal 즉시 정지 + 패배자 win-ddaeng-loser SFX | 2026-04-04 | 634a7df | [260404-pn6-10-sfx-12-sfx](./quick/260404-pn6-10-sfx-12-sfx/) |
| 260404-pyv | master push + Oracle VM 배포 (PM2 restart) | 2026-04-04 | d3d5d37 | [260404-pyv-master-origin-push-oracle-vm-pm2-reload](./quick/260404-pyv-master-origin-push-oracle-vm-pm2-reload/) |
| 260404-qk2 | HandPanel 손패 패널 힌트 문구 제거 — 나머지 카드를 탭하세요 스팬 삭제 | 2026-04-04 | c32396e | [260404-qk2-handpanel](./quick/260404-qk2-handpanel/) |
| 260404-qni | master push + Oracle VM 배포 (PM2 restart) | 2026-04-04 | 834d4bc | [260404-qni-master-push-oracle-vm-pm2-restart](./quick/260404-qni-master-push-oracle-vm-pm2-restart/) |
| 260404-svi | sfx 트리거 조건 및 맵핑 문서화 | 2026-04-04 | a4d3e7c | [260404-svi-sfx](./quick/260404-svi-sfx/) |
| 260404-t1o | SFX 버그 수정 5종 | 2026-04-04 | 27e55c2 | [260404-t1o-sfx-5](./quick/260404-t1o-sfx-5/) |
| 260404-tat | SharedCardSelectModal 카드 선택 막힘 버그 수정 — selectedIndex 라운드 간 리셋 useEffect 추가 | 2026-04-04 | 4b0e281 | [260404-tat-shared-card-selection-stuck-bug](./quick/260404-tat-shared-card-selection-stuck-bug/) |
| 260404-tgm | 세장섯다 3장 카드 표시 버그 수정 — GameTable PlayerSeat 3장 표시 + HandPanel 공개 카드 맨앞 정렬 + 시각 구분 | 2026-04-04 | 6671d0a | [260404-tgm-sejang-3card-display-fix](./quick/260404-tgm-sejang-3card-display-fix/) |
| 260404-vct | 버그 4건 수정 — 세장섯다 PlayerSeat 공개카드 정렬, 한장공유 SFX sharedCard 포함, 공유카드 모달 모바일 최적화, 구사 재경기 오리지날 모드 강제 | 2026-04-04 | 28b1892 | [260404-vct-sfx](./quick/260404-vct-sfx/) |
| 260404-vl1 | 한장공유 결과화면 공유카드 포함 2장 표시 + 족보 뱃지 | 2026-04-04 | f5d5aee | [260404-vl1-2](./quick/260404-vl1-2/) |
| 260405-i6e | 족보 한단계차이 패배 시 lose-ddaeng-but-lost SFX + 판돈 2만원↑ BGM 교체 | 2026-04-05 | 559d4c8 | [260405-i6e-lose-ddaeng-but-lost-sfx-2-bgm-bgm](./quick/260405-i6e-lose-ddaeng-but-lost-sfx-2-bgm-bgm/) |
| 260405-ihi | 학교대신가주기 대리출석 뱃지 + 토스트 통합 + SFX 수혜자 한정 | 2026-04-05 | 12f742f | [260405-ihi-pot-2-css-sfx](./quick/260405-ihi-pot-2-css-sfx/) |
| 260405-j4v | 게임테이블 3x3 그리드 레이아웃 리팩터링 — 인원수별 플레이어 배치 최적화 + 빅팟 내부글로우 CSS 효과 | 2026-04-05 | 6ac3861 | [260405-j4v-3x3-css](./quick/260405-j4v-3x3-css/) |
| 260405-jug | 게임테이블 UI 버그+개선 7종 — 그리드마진/링크복사/빅팟pulse+BGM/판돈카드확대/모드Badge/베팅패널pulse | 2026-04-05 | e120591 | [260405-jug-ui-7-pulse-bgm](./quick/260405-jug-ui-7-pulse-bgm/) |
| 260405-kf2 | 레이아웃 중대오류 수정 + 베팅패널 초기화버튼 인라인 + card-reveal SFX 타이밍 수정 | 2026-04-05 | 72ae604 | [260405-kf2-card-reveal-sfx](./quick/260405-kf2-card-reveal-sfx/) |
| 260405-knk | PlayerSeat 박스 크기 최적화 — 데스크탑 그리드 박스 복구 + 모바일 3x3 그리드 + BGM 음량 + 폰트/카드 조정 | 2026-04-05 | d0afcf3 | [260405-knk-playerseat-3x3](./quick/260405-knk-playerseat-3x3/) |
| 260405-l55 | 학교대신가주기 수혜자 결과카드 미반영 버그 수정 — attendSchoolProxy totalBet 누락 + ihi revert 복구 | 2026-04-05 | 6e0ee5d | [260405-l55-hakgyo-result-card](./quick/260405-l55-hakgyo-result-card/) |
| 260405-l5b | 결과페이지 disconnect 즉시 진행 + tryAdvanceNextRound 추출 | 2026-04-05 | 1464b49 | [260405-l5b-disconnect-1](./quick/260405-l5b-disconnect-1/) |
| 260405-miq | 모바일 3x3 그리드 좌석배치 + 판돈 중앙 + 레이즈 텍스트 간소화 + 학교가기 버튼 조건부 텍스트 | 2026-04-05 | 7a2bba8 | [260405-miq-mobile-layout-fix](./quick/260405-miq-mobile-layout-fix/) |
| 260405-pv9 | 3장섯다 손패패널 카드 겹치기 배치 — 베팅패널 폭 확보 | 2026-04-05 | b1fc22c | [260405-pv9-3](./quick/260405-pv9-3/) |
| 260405-pz8 | 방 생성 비밀번호 명칭을 암구호로 변경 — UI 라벨/플레이스홀더/에러메시지 | 2026-04-05 | 8e29144 | [260405-pz8-ui](./quick/260405-pz8-ui/) |
| 260405-s6a | 인디언섯다/세장섯다 쇼다운 후 족보 한끗차이일때 lose-ddaeng-but-lost SFX 재생안됨 | 2026-04-05 | 5eb3299 | [260405-s6a-lose-ddaeng-but-lost-sfx](./quick/260405-s6a-lose-ddaeng-but-lost-sfx/) |
| 260405-sce | 게임이력 CSV 저장 기능 — HistoryModal CSV 다운로드 버튼 | 2026-04-05 | 6f11dc7 | [260405-sce-csv](./quick/260405-sce-csv/) |
| 260405-sgp | 플레이어 퇴장 즉시 토스트 + 재접속 알림 — 1분 유예 중에도 즉시 표시 | 2026-04-05 | f931315 | [260405-sgp-disconnect-toast](./quick/260405-sgp-disconnect-toast/) |
| 260405-t3k | 2인 게임 종료 시 방장 chips engine→room 미동기화 버그 수정 | 2026-04-05 | 94cd432 | — |
| 260405-ue1 | 족보 한단계차이 승패 SFX lose-ddaeng-but-lost 미지정 원인 디버그 | 2026-04-05 | fbf66ad | [260405-ue1-sfx-lose-ddaeng-but-lost](./quick/260405-ue1-sfx-lose-ddaeng-but-lost/) |
| 260405-ujr | 2인 게임 disconnect 후 대기실 복귀 시 chips 초기화 버그 수정 | 2026-04-05 | ce4c7f0 | [260405-ujr-2-disconnect-chips](./quick/260405-ujr-2-disconnect-chips/) |
| 260405-v03 | 결과화면 퇴장 시 팟 반환 및 이력 잔액 기록 | 2026-04-05 | 5a454ae | [260405-v03-result-exit-pot-refund](./quick/260405-v03-result-exit-pot-refund/) |

### Blockers/Concerns

- 리서치 플래그: rule_draft.md 족보 edge case를 Phase 2 시작 전 테스트 케이스로 정리 필요
- 리서치 플래그: 인디언섯다 Player View Projection 설계 검증 필요 (Phase 8)
- 리서치 플래그: 후회의섯다 드래프트 UI/UX 레퍼런스 부족 (Phase 8)

## Session Continuity

Last session: 2026-04-05T05:17:21.737Z
Stopped at: Completed quick-260405-jug — 게임테이블 UI 버그+개선 7종
Resume file: None
