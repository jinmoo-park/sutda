import type { Card } from './card';

/** 칩 단위별 개수 (per CHIP-04, D-12) */
export interface ChipBreakdown {
  ten_thousand: number;
  five_thousand: number;
  one_thousand: number;
  five_hundred: number;
}

/** 게임 진행 단계 */
export type GamePhase =
  | 'waiting'          // 대기 중 (방에서 게임 시작 전)
  | 'dealer-select'    // 밤일낮장 카드 선택 중 (첫 판 선 결정)
  | 'attend-school'    // 학교 간다 (앤티 500원)
  | 'mode-select'      // 선 플레이어가 게임 모드 선택 중
  | 'shuffling'        // 셔플 중
  | 'cutting'          // 기리 진행 중
  | 'dealing'          // 패 돌리기 중
  | 'betting'          // 베팅 중 (오리지날 / 한장공유 모드)
  | 'betting-1'        // 세장섯다: 1차 베팅 (2장 배분 후)
  | 'sejang-open'      // 세장섯다: 2장 배분 후 오픈 카드 선택 (각 플레이어가 1장 공개)
  | 'dealing-extra'    // 인디언섯다: 2번째 카드 배분 (서버 자동)
  | 'card-select'      // 세장섯다: 3장 중 2장 선택
  | 'betting-2'        // 세장섯다: 2차 베팅
  | 'shared-card-select' // 한장공유: 딜러가 공유 카드 선택
  | 'gollagolla-select' // 골라골라: 20장 오픈 그리드, 동시 선착순 선택
  | 'showdown'         // 족보 비교 / 승패 결정
  | 'result'           // 결과 표시
  | 'rematch-pending'  // 동점 재경기 대기
  | 'gusa-pending'    // 구사 재경기 대기 (다이 플레이어 재참여 결정 수집 중)
  | 'gusa-announce'   // 구사 재경기 안내 (전원 생존 시 안내 모달 표시 후 shuffling 진행)
  | 'finished';        // 게임 종료

/** 게임 모드 */
export type GameMode =
  | 'original'      // 오리지날
  | 'three-card'    // 세장섯다
  | 'shared-card'   // 한장공유
  | 'gollagolla'    // 골라골라: 20장 오픈 동시 선착순 선택
  | 'indian';       // 인디언섯다: 첫 카드 가시성 반전

/** 베팅 액션 */
export type BetAction =
  | { type: 'call' }
  | { type: 'raise'; amount: number }
  | { type: 'die' }
  | { type: 'check' };

/** 마지막 베팅 액션 기록 */
export interface LastBetAction {
  type: 'call' | 'raise' | 'die' | 'check';
  amount?: number;  // raise 시 추가 금액
}

/** 개별 플레이어 상태 */
export interface PlayerState {
  id: string;
  nickname: string;
  chips: number;
  cards: (Card | null)[];  // 인디언 모드에서 null = 마스킹된 카드
  isAlive: boolean;       // 다이하지 않았는지
  isAbsent: boolean;      // 잠시 쉬기 중 (복귀 전까지 게임 미참여)
  isRevealed: boolean;    // showdown에서 패를 공개했는지 (모두 true가 되면 승패 판정)
  currentBet: number;     // 현재 베팅 라운드에서 베팅한 금액 (베팅 완료 체크용)
  totalBet: number;       // 이번 판 전체 누적 베팅액 (표시용 — 멀티 베팅 라운드 합산)
  isDealer: boolean;      // 선 플레이어 여부
  seatIndex: number;      // 자리 번호 (0부터)
  chipBreakdown: ChipBreakdown;  // 칩 단위별 개수 (per CHIP-04, D-12)
  lastBetAction?: LastBetAction; // 이번 판에서의 마지막 베팅 액션
  selectedCards?: Card[];  // 세장섯다: 3장 중 선택한 2장 (per D-04)
  openedCardIndex?: 0 | 1;  // 세장섯다: 최초 2장 중 오픈한 카드 인덱스 (상대방에게 공개)
}

/** 전체 게임 상태 */
export interface GameState {
  roomId: string;
  phase: GamePhase;
  mode: GameMode;
  players: PlayerState[];
  pot: number;                    // 현재 판돈
  currentPlayerIndex: number;     // 현재 턴 플레이어 인덱스
  currentBetAmount: number;       // 현재 콜해야 하는 금액
  roundNumber: number;            // 현재 판 번호
  deck: Card[];                   // 셔플된 덱 (서버 내부용)
  dealerSelectCards?: { playerId: string; cardIndex: number }[];  // 밤일낮장 선택 기록
  isTtong: boolean;               // 퉁 여부
  attendedPlayerIds: string[];    // 등교한 플레이어 ID 목록
  winnerId?: string;              // 이번 판 승자 ID (result phase에서 설정)
  tiedPlayerIds?: string[];       // 동점자 ID 목록 (rematch-pending phase에서 설정)
  rematchDealerId?: string;       // 재경기에서 선이 될 플레이어 ID (구사 재경기 시 설정)
  dealerSelectEligibleIds?: string[];  // 밤일낮장 현재 라운드에서 카드 선택 가능한 플레이어 IDs (undefined = 전원)
  effectiveMaxBet?: number;       // 현재 턴 플레이어의 유효 스택 상한 (per D-11)
  openingBettorSeatIndex?: number | null;  // 선 권한 보유자 seatIndex (null = 이미 행사됨)
  sharedCard?: Card;              // 한장공유: 공유 카드 (per D-05)
  gollaOpenDeck?: Card[];         // 골라골라: 공개된 20장 덱 (gollagolla-select phase에서 설정)
  gollaPlayerIndices?: Record<string, [number, number]>;  // 골라골라: 각 플레이어가 확정 선택한 openDeck 인덱스
  gollaReservedIndices?: Record<string, number[]>;         // 골라골라: 각 플레이어가 임시 예약 중인 인덱스 (0~1개)
  gusaPendingDecisions?: Record<string, boolean | null>;  // 구사 재경기 대기 중 플레이어 재참여 결정 (null=미결정)
  ttaengPayments?: { playerId: string; amount: number }[];  // 땡값 납부 내역 (오리지날 모드 전용)
  isRematchRound?: boolean;  // 재경기(구사/동점) 라운드 여부 — 땡값 면제
  skipCutting?: boolean;  // 재경기: 기리(cutting) 단계 건너뜀
  rematchConfirmedIds?: string[];  // 동점 재경기 확인한 플레이어 ID 목록
}
