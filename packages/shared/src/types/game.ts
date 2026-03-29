import type { Card } from './card';

/** 게임 진행 단계 */
export type GamePhase =
  | 'waiting'        // 대기 중 (방에서 게임 시작 전)
  | 'dealer-select'  // 밤일낮장 카드 선택 중 (첫 판 선 결정)
  | 'attend-school'  // 학교 간다 (앤티 500원)
  | 'mode-select'    // 선 플레이어가 게임 모드 선택 중
  | 'shuffling'      // 셔플 중
  | 'cutting'        // 기리 진행 중
  | 'dealing'        // 패 돌리기 중
  | 'betting'        // 베팅 중
  | 'showdown'       // 족보 비교 / 승패 결정
  | 'result'         // 결과 표시
  | 'finished';      // 게임 종료

/** 게임 모드 */
export type GameMode =
  | 'original'      // 오리지날
  | 'three-card'    // 세장섯다
  | 'shared-card'   // 한장공유
  | 'regret'        // 후회의섯다
  | 'indian';       // 인디언섯다

/** 베팅 액션 */
export type BetAction =
  | { type: 'call' }
  | { type: 'raise'; amount: number }
  | { type: 'die' }
  | { type: 'check' };

/** 개별 플레이어 상태 */
export interface PlayerState {
  id: string;
  nickname: string;
  chips: number;
  cards: Card[];
  isAlive: boolean;       // 다이하지 않았는지
  isRevealed: boolean;    // showdown에서 패를 공개했는지 (모두 true가 되면 승패 판정)
  currentBet: number;     // 현재 판에서 베팅한 총액
  isDealer: boolean;      // 선 플레이어 여부
  seatIndex: number;      // 자리 번호 (0부터)
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
}
