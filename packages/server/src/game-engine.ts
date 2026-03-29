import { createDeck } from '@sutda/shared';
import type { Card, GameState, GameMode, PlayerState, RoomPlayer } from '@sutda/shared';

/**
 * GameEngine 클래스 — 오리지날 모드 게임 플로우 FSM
 *
 * 상태 전환: dealer-select -> attend-school -> mode-select -> shuffling -> cutting -> dealing -> betting
 */
export class GameEngine {
  private state: GameState;
  private cutterPlayerId: string | null = null;

  constructor(
    roomId: string,
    players: RoomPlayer[],
    mode: GameMode,
    roundNumber = 1,
  ) {
    const playerStates: PlayerState[] = players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      chips: p.chips,
      cards: [],
      isAlive: true,
      isRevealed: false,
      currentBet: 0,
      isDealer: false,
      seatIndex: p.seatIndex,
    }));

    this.state = {
      roomId,
      phase: roundNumber === 1 ? 'dealer-select' : 'attend-school',
      mode,
      players: playerStates,
      pot: 0,
      currentPlayerIndex: 0,
      currentBetAmount: 0,
      roundNumber,
      deck: createDeck(),
      dealerSelectCards: [],
      isTtong: false,
      attendedPlayerIds: [],
    };
  }

  /** 현재 게임 상태 반환 (읽기 전용) */
  getState(): Readonly<GameState> {
    return this.state;
  }

  /**
   * 반시계 방향 배분 순서 계산
   * dealer=0, 4명 -> [3,2,1,0]
   * dealer=2, 4명 -> [1,0,3,2]
   */
  private getCounterClockwiseOrder(dealerSeatIndex: number, totalPlayers: number): number[] {
    const order: number[] = [];
    for (let i = 1; i <= totalPlayers; i++) {
      order.push((dealerSeatIndex - i + totalPlayers) % totalPlayers);
    }
    return order;
  }

  /** 딜러의 seatIndex 반환 */
  private getDealerSeatIndex(): number {
    const dealer = this.state.players.find(p => p.isDealer);
    if (!dealer) throw new Error('INVALID_ACTION');
    return dealer.seatIndex;
  }

  /** phase 유효성 검증 */
  private assertPhase(expected: GameState['phase']): void {
    if (this.state.phase !== expected) {
      throw new Error('INVALID_PHASE');
    }
  }

  /**
   * 밤일낮장 카드 선택
   * - phase가 'dealer-select'인지 검증
   * - 이미 선택한 플레이어 재선택 불가
   * - 모든 플레이어 선택 완료 시 선 결정 후 attend-school로 전환
   */
  selectDealerCard(playerId: string, cardIndex: number): void {
    this.assertPhase('dealer-select');

    const alreadySelected = this.state.dealerSelectCards!.find(sc => sc.playerId === playerId);
    if (alreadySelected) {
      throw new Error('ALREADY_ATTENDED');
    }

    if (cardIndex < 0 || cardIndex >= this.state.deck.length) {
      throw new Error('INVALID_ACTION');
    }

    this.state.dealerSelectCards!.push({ playerId, cardIndex });

    // 모든 플레이어가 선택 완료했는지 확인
    if (this.state.dealerSelectCards!.length === this.state.players.length) {
      this._resolveDealer();
      this.state.phase = 'attend-school';
    }
  }

  /** 밤일낮장 선 결정 로직 */
  private _resolveDealer(): void {
    const kstHour = (new Date().getUTCHours() + 9) % 24;
    const isNight = kstHour >= 18 || kstHour < 6;

    const selections = this.state.dealerSelectCards!;
    let winnerPlayerId: string;

    if (isNight) {
      // 밤: 가장 낮은 rank가 선
      let minRank = Infinity;
      let minPlayerId = selections[0].playerId;
      for (const sc of selections) {
        const rank = this.state.deck[sc.cardIndex].rank;
        if (rank < minRank) {
          minRank = rank;
          minPlayerId = sc.playerId;
        }
      }
      winnerPlayerId = minPlayerId;
    } else {
      // 낮: 가장 높은 rank가 선
      let maxRank = -Infinity;
      let maxPlayerId = selections[0].playerId;
      for (const sc of selections) {
        const rank = this.state.deck[sc.cardIndex].rank;
        if (rank > maxRank) {
          maxRank = rank;
          maxPlayerId = sc.playerId;
        }
      }
      winnerPlayerId = maxPlayerId;
    }

    const dealerPlayer = this.state.players.find(p => p.id === winnerPlayerId);
    if (dealerPlayer) {
      dealerPlayer.isDealer = true;
    }
  }

  /**
   * 이전 판 승자를 선으로 설정 (2판 이후)
   */
  setDealerFromPreviousWinner(winnerId: string): void {
    // 기존 dealer 초기화
    this.state.players.forEach(p => { p.isDealer = false; });
    const winner = this.state.players.find(p => p.id === winnerId);
    if (winner) {
      winner.isDealer = true;
    }
  }

  /**
   * 등교 (앤티 500원)
   * - phase가 'attend-school'인지 검증
   * - 이미 등교한 플레이어 중복 등교 불가
   * - 모든 플레이어 등교 완료 시 mode-select로 전환
   */
  attendSchool(playerId: string): void {
    this.assertPhase('attend-school');

    if (this.state.attendedPlayerIds.includes(playerId)) {
      throw new Error('ALREADY_ATTENDED');
    }

    this.state.pot += 500;
    this.state.attendedPlayerIds.push(playerId);

    // 모든 플레이어가 등교했는지 확인
    if (this.state.attendedPlayerIds.length === this.state.players.length) {
      this.completeAttendSchool();
    }
  }

  /**
   * 등교 강제 완료 (타임아웃 또는 모든 플레이어 등교 후 호출)
   * 미등교 플레이어는 isAlive=false로 설정
   */
  completeAttendSchool(): void {
    this.state.players.forEach(p => {
      if (!this.state.attendedPlayerIds.includes(p.id)) {
        p.isAlive = false;
      }
    });
    this.state.phase = 'mode-select';
  }

  /**
   * 게임 모드 선택
   * - dealer만 가능
   * - phase가 'mode-select'인지 검증
   */
  selectMode(playerId: string, mode: GameMode): void {
    this.assertPhase('mode-select');

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isDealer) {
      throw new Error('NOT_YOUR_TURN');
    }

    this.state.mode = mode;
    this.state.phase = 'shuffling';
  }

  /**
   * Fisher-Yates 셔플
   * - dealer만 가능
   * - phase가 'shuffling'인지 검증
   */
  shuffle(playerId: string): void {
    this.assertPhase('shuffling');

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isDealer) {
      throw new Error('NOT_YOUR_TURN');
    }

    const shuffled = [...this.state.deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    this.state.deck = shuffled;
    this.state.phase = 'cutting';

    // cutter = dealer의 왼쪽 플레이어 (seatIndex + 1)
    const dealerSeatIndex = this.getDealerSeatIndex();
    const totalPlayers = this.state.players.length;
    const cutterSeatIndex = (dealerSeatIndex + 1) % totalPlayers;
    const cutter = this.state.players.find(p => p.seatIndex === cutterSeatIndex);
    this.cutterPlayerId = cutter ? cutter.id : null;
  }

  /**
   * 기리 (복수 분할 재조립)
   * - cutter 플레이어만 가능
   * - phase가 'cutting'인지 검증
   * - cutPoints로 덱을 분할하고 order대로 재조립
   */
  cut(playerId: string, cutPoints: number[], order: number[]): void {
    this.assertPhase('cutting');

    if (this.cutterPlayerId !== null && playerId !== this.cutterPlayerId) {
      throw new Error('NOT_YOUR_TURN');
    }

    const deck = this.state.deck;
    const totalCards = deck.length;

    // cutPoints 유효성 검증
    for (const cp of cutPoints) {
      if (cp <= 0 || cp >= totalCards) {
        throw new Error('INVALID_CUT');
      }
    }

    // 세그먼트 분할
    const splitPoints = [0, ...cutPoints, totalCards];
    const segments: Card[][] = [];
    for (let i = 0; i < splitPoints.length - 1; i++) {
      segments.push(deck.slice(splitPoints[i], splitPoints[i + 1]));
    }

    // order 유효성 검증
    if (order.length !== segments.length) {
      throw new Error('INVALID_CUT');
    }

    // 재조립
    const reassembled: Card[] = [];
    for (const idx of order) {
      if (idx < 0 || idx >= segments.length) {
        throw new Error('INVALID_CUT');
      }
      reassembled.push(...segments[idx]);
    }

    // 20장 유지 검증
    if (reassembled.length !== totalCards) {
      throw new Error('INVALID_CUT');
    }

    this.state.deck = reassembled;
    this.state.phase = 'dealing';
    this._dealCards();
  }

  /**
   * 퉁 선언
   * - cutter 플레이어만 가능
   * - phase가 'cutting'인지 검증
   */
  declareTtong(playerId: string): void {
    this.assertPhase('cutting');

    if (this.cutterPlayerId !== null && playerId !== this.cutterPlayerId) {
      throw new Error('NOT_YOUR_TURN');
    }

    this.state.isTtong = true;
    this.state.phase = 'dealing';
    this._dealCards();
  }

  /**
   * 패 배분 (private)
   * - 등교한 플레이어(isAlive===true)만 대상
   * - 반시계 방향 배분
   * - isTtong이면 2장씩, 아니면 1장씩 2라운드
   */
  private _dealCards(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const dealerSeatIndex = this.getDealerSeatIndex();
    const counterClockwiseOrder = this.getCounterClockwiseOrder(dealerSeatIndex, alivePlayers.length);

    // seatIndex -> PlayerState 매핑
    const alivePlayersBySeat = new Map<number, PlayerState>();
    alivePlayers.forEach((p, idx) => {
      alivePlayersBySeat.set(idx, p);
    });

    // alive 플레이어의 seatIndex 순서 (dealer 기준 반시계)
    const aliveSeats = alivePlayers.map(p => p.seatIndex);
    // dealer의 alive players 내에서의 위치 찾기
    const dealerAliveIdx = aliveSeats.indexOf(dealerSeatIndex);

    // 반시계 순서로 alive 플레이어 정렬
    const orderedAlivePlayers: PlayerState[] = counterClockwiseOrder.map(idx => {
      const seatIdx = (dealerSeatIndex - (idx) + this.state.players.length) % this.state.players.length;
      return this.state.players.find(p => p.seatIndex === seatIdx)!;
    }).filter(p => p && p.isAlive);

    // alive 플레이어만 대상으로 반시계 순서 재계산
    const orderedByDealerCounterClockwise = this._getAlivePlayersInCounterClockwiseOrder(
      dealerSeatIndex,
      alivePlayers,
    );

    if (this.state.isTtong) {
      // 퉁: 2장씩 한 번에
      for (const player of orderedByDealerCounterClockwise) {
        const card1 = this.state.deck.shift();
        const card2 = this.state.deck.shift();
        if (card1) player.cards.push(card1);
        if (card2) player.cards.push(card2);
      }
    } else {
      // 일반: 1장씩 2라운드
      for (let round = 0; round < 2; round++) {
        for (const player of orderedByDealerCounterClockwise) {
          const card = this.state.deck.shift();
          if (card) player.cards.push(card);
        }
      }
    }

    this.state.phase = 'betting';
    // dealer가 첫 베팅
    this.state.currentPlayerIndex = dealerSeatIndex;
  }

  /**
   * alive 플레이어를 dealer 기준 반시계 순서로 정렬
   * dealer 자신이 마지막이 됨
   */
  private _getAlivePlayersInCounterClockwiseOrder(
    dealerSeatIndex: number,
    alivePlayers: PlayerState[],
  ): PlayerState[] {
    const totalPlayers = this.state.players.length;
    const result: PlayerState[] = [];

    // 반시계: dealer에서 1씩 빼기 (dealer 제외하고 순회, 마지막에 dealer 추가)
    for (let i = 1; i <= totalPlayers; i++) {
      const seatIdx = (dealerSeatIndex - i + totalPlayers) % totalPlayers;
      const player = alivePlayers.find(p => p.seatIndex === seatIdx);
      if (player) {
        result.push(player);
      }
    }

    return result;
  }
}
