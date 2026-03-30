import { createDeck, evaluateHand, compareHands, checkGusaTrigger } from '@sutda/shared';
import type { Card, GameState, GameMode, PlayerState, RoomPlayer, BetAction, ChipBreakdown } from '@sutda/shared';

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
      isAbsent: false,
      isRevealed: false,
      currentBet: 0,
      isDealer: false,
      seatIndex: p.seatIndex,
      chipBreakdown: GameEngine.calculateChipBreakdown(p.chips),
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

  // =====================================================================
  // 칩 계산 메서드
  // =====================================================================

  /**
   * 칩 금액을 단위별 개수로 분해 (그리디)
   */
  static calculateChipBreakdown(chips: number): ChipBreakdown {
    let remaining = chips;
    const ten_thousand = Math.floor(remaining / 10000);
    remaining %= 10000;
    const five_thousand = Math.floor(remaining / 5000);
    remaining %= 5000;
    const one_thousand = Math.floor(remaining / 1000);
    remaining %= 1000;
    const five_hundred = Math.floor(remaining / 500);
    return { ten_thousand, five_thousand, one_thousand, five_hundred };
  }

  /**
   * 모든 플레이어의 chipBreakdown을 현재 chips 기준으로 갱신
   */
  private _updateChipBreakdowns(): void {
    for (const p of this.state.players) {
      p.chipBreakdown = GameEngine.calculateChipBreakdown(p.chips);
    }
  }

  /**
   * 현재 턴 플레이어의 effectiveMaxBet을 계산하여 state에 반영
   * betting phase에서만 유효, 그 외 phase에서는 undefined
   */
  private _updateEffectiveMaxBet(): void {
    if (this.state.phase !== 'betting') {
      this.state.effectiveMaxBet = undefined;
      return;
    }
    const currentPlayer = this.state.players.find(p => p.seatIndex === this.state.currentPlayerIndex);
    if (!currentPlayer) {
      this.state.effectiveMaxBet = undefined;
      return;
    }
    this.state.effectiveMaxBet = this.calculateEffectiveMaxBet(currentPlayer.id);
  }

  /**
   * 현재 플레이어의 유효 스택 상한 계산 (per D-11)
   * - 내 잔액 < 상대 최대 잔액: 내 잔액 반환
   * - 내 잔액 >= 상대 최대 잔액: 생존 상대 중 최대 잔액 반환
   * - 생존 상대 없음: 0 반환
   */
  calculateEffectiveMaxBet(playerId: string): number {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return 0;
    const alivePlayers = this.state.players.filter(p => p.isAlive && p.id !== playerId);
    if (alivePlayers.length === 0) return 0;
    const myAvailable = player.chips;
    const maxOpponent = Math.max(...alivePlayers.map(p => p.chips));
    if (myAvailable < maxOpponent) return myAvailable;
    // 내가 가장 부자면 생존 상대 중 최대값이 천장
    const opponentChips = alivePlayers.map(p => p.chips).sort((a, b) => b - a);
    return opponentChips[0];
  }

  /**
   * 승자에게 pot 전액 합산 (per D-01)
   * pot은 result phase에서 표시용으로 유지, nextRound()에서 0 리셋
   */
  private settleChips(): void {
    if (!this.state.winnerId) return;
    const winner = this.state.players.find(p => p.id === this.state.winnerId);
    if (winner) {
      winner.chips += this.state.pot;
    }
    this._updateChipBreakdowns();
  }

  /**
   * 재충전 승인 시 GameEngine 상태를 안전하게 갱신 (Plan 02 Task 2에서 호출)
   * 칩 갱신 후 chipBreakdown과 effectiveMaxBet 파생 상태를 자동으로 재계산
   */
  applyRechargeToPlayer(playerId: string, newChips: number): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('PLAYER_NOT_FOUND');
    }
    player.chips = newChips;
    this._updateChipBreakdowns();
    this._updateEffectiveMaxBet();
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
   * - dealerSelectEligibleIds가 설정된 경우 해당 플레이어만 선택 가능
   * - 모든 대상 플레이어 선택 완료 시 선 결정 (동률이면 동률자만 재추첨)
   */
  selectDealerCard(playerId: string, cardIndex: number): void {
    this.assertPhase('dealer-select');

    // 선택 자격 확인 (동률 재추첨 중이면 동률자만 가능)
    const eligibleIds = this.state.dealerSelectEligibleIds;
    if (eligibleIds && !eligibleIds.includes(playerId)) {
      throw new Error('INVALID_ACTION');
    }

    const alreadySelected = this.state.dealerSelectCards!.find(sc => sc.playerId === playerId);
    if (alreadySelected) {
      throw new Error('ALREADY_ATTENDED');
    }

    if (cardIndex < 0 || cardIndex >= this.state.deck.length) {
      throw new Error('INVALID_ACTION');
    }

    this.state.dealerSelectCards!.push({ playerId, cardIndex });

    // 현재 라운드 대상 인원 모두 선택 완료 시 선 결정
    const targetCount = eligibleIds?.length ?? this.state.players.length;
    if (this.state.dealerSelectCards!.length === targetCount) {
      this._resolveDealer();
      // _resolveDealer가 동률 감지 시 phase를 dealer-select 유지하며 상태 초기화
      // 승자 결정 시 phase를 attend-school로 전환
    }
  }

  /**
   * 밤일낮장 선 결정 로직
   * - 동률이면 동률자만 재추첨 (dealerSelectEligibleIds 갱신, phase 유지)
   * - 승자 결정 시 phase = attend-school
   */
  private _resolveDealer(): void {
    const kstHour = (new Date().getUTCHours() + 9) % 24;
    const isNight = kstHour >= 18 || kstHour < 6;

    // 현재 라운드 선택 항목만 평가
    const eligibleIds = this.state.dealerSelectEligibleIds ?? this.state.players.map(p => p.id);
    const selections = this.state.dealerSelectCards!.filter(sc => eligibleIds.includes(sc.playerId));

    // 최강 rank 찾기
    let bestRank = isNight ? Infinity : -Infinity;
    for (const sc of selections) {
      const rank = this.state.deck[sc.cardIndex].rank;
      if (isNight ? rank < bestRank : rank > bestRank) bestRank = rank;
    }

    // 동률 플레이어 목록
    const tiedSelections = selections.filter(sc => this.state.deck[sc.cardIndex].rank === bestRank);

    if (tiedSelections.length > 1) {
      // 동률: 동률자만 재추첨 (선택 기록 초기화, phase 유지)
      this.state.dealerSelectCards = [];
      this.state.dealerSelectEligibleIds = tiedSelections.map(sc => sc.playerId);
      return;
    }

    // 승자 결정
    const winnerId = tiedSelections[0].playerId;
    const dealerPlayer = this.state.players.find(p => p.id === winnerId);
    if (dealerPlayer) dealerPlayer.isDealer = true;
    this.state.dealerSelectEligibleIds = undefined;
    this.state.phase = 'attend-school';
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

    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.chips -= 500;
    }
    this.state.pot += 500;
    this.state.attendedPlayerIds.push(playerId);

    this._updateChipBreakdowns();

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
        p.isAbsent = true;
        p.isAlive = false;
      }
    });
    this.state.phase = 'mode-select';
  }

  /**
   * 결과 화면에서 다음 판 쉬기
   * - result phase에서만 가능
   */
  takeBreak(playerId: string): void {
    this.assertPhase('result');
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    player.isAbsent = true;
    player.isAlive = false;
  }

  /**
   * 잠시 쉬기에서 복귀
   * - attend-school phase: isAbsent=false + isAlive=true (이번 판 참여 가능)
   * - 그 외 phase: isAbsent=false만 (다음 판부터 참여, isAlive는 nextRound에서 복원)
   */
  returnFromBreak(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (!player.isAbsent) return; // 이미 활성 상태
    player.isAbsent = false;
    if (this.state.phase === 'attend-school') {
      player.isAlive = true;
    }
    // 다른 phase에서는 isAlive=false 유지 → nextRound()에서 isAbsent=false이므로 isAlive=true로 복원
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

    // cutter = dealer의 왼쪽 첫 번째 비-absent 플레이어
    const dealerSeatIndex = this.getDealerSeatIndex();
    const totalPlayers = this.state.players.length;
    let cutterSeatIndex = (dealerSeatIndex + 1) % totalPlayers;
    for (let i = 0; i < totalPlayers; i++) {
      const candidate = this.state.players.find(p => p.seatIndex === cutterSeatIndex);
      if (candidate && !candidate.isAbsent) break;
      cutterSeatIndex = (cutterSeatIndex + 1) % totalPlayers;
    }
    const cutter = this.state.players.find(p => p.seatIndex === cutterSeatIndex);
    this.cutterPlayerId = cutter ? cutter.id : null;
    // currentPlayerIndex를 기리자로 업데이트 → 클라이언트 isMyTurn이 올바른 플레이어에게 표시
    this.state.currentPlayerIndex = cutterSeatIndex;
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
    this.state.openingBettorSeatIndex = dealerSeatIndex;
    this._updateChipBreakdowns();
    this._updateEffectiveMaxBet();
  }

  /**
   * fromSeat 기준 반시계 방향으로 다음 alive 플레이어의 seatIndex 반환
   */
  private _findNextAliveSeat(fromSeat: number): number | null {
    const totalPlayers = this.state.players.length;
    for (let i = 1; i <= totalPlayers; i++) {
      const nextSeat = (fromSeat - i + totalPlayers) % totalPlayers;
      const next = this.state.players.find(p => p.seatIndex === nextSeat && p.isAlive);
      if (next) return nextSeat;
    }
    return null;
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

  // =====================================================================
  // 베팅 시스템
  // =====================================================================

  /**
   * 이번 베팅 라운드에서 액션을 완료한 플레이어 ID 집합
   * 레이즈 발생 시 레이즈한 플레이어 외 나머지는 초기화됨
   */
  private _bettingActed: Set<string> = new Set();

  /**
   * 베팅 액션 처리 (콜/레이즈/다이/체크)
   */
  processBetAction(playerId: string, action: BetAction): void {
    if (this.state.phase !== 'betting') {
      throw new Error('INVALID_PHASE');
    }

    const player = this.state.players.find(p => p.seatIndex === this.state.currentPlayerIndex);
    if (!player || player.id !== playerId) {
      throw new Error('NOT_YOUR_TURN');
    }

    if (!player.isAlive) {
      throw new Error('INVALID_ACTION');
    }

    switch (action.type) {
      case 'call': {
        const callAmount = this.state.currentBetAmount - player.currentBet;
        player.chips -= callAmount;
        player.currentBet += callAmount;
        this.state.pot += callAmount;
        break;
      }
      case 'raise': {
        if (action.amount < 500) {
          throw new Error('INVALID_ACTION: raise amount must be >= 500');
        }
        const callAmount = this.state.currentBetAmount - player.currentBet;
        const totalDeducted = callAmount + action.amount;
        player.chips -= totalDeducted;
        player.currentBet += callAmount + action.amount;
        this.state.pot += callAmount + action.amount;
        this.state.currentBetAmount = player.currentBet;

        // 레이즈 발생 시 선 권한 소멸 + 다른 플레이어 액션 플래그 초기화
        this.state.openingBettorSeatIndex = null;
        const allActed = new Set<string>();
        allActed.add(playerId);
        this._bettingActed = allActed;

        this._advanceBettingTurn();
        return;
      }
      case 'die': {
        player.isAlive = false;
        break;
      }
      case 'check': {
        if (this.state.currentBetAmount > 0) {
          throw new Error('INVALID_ACTION: cannot check when currentBetAmount > 0');
        }
        if (this.state.openingBettorSeatIndex !== player.seatIndex) {
          throw new Error('INVALID_ACTION: only the opening bettor can check');
        }
        // 체크: 선 권한 소멸
        this.state.openingBettorSeatIndex = null;
        break;
      }
    }

    // 다이한 플레이어가 선 권한 보유자였으면 다음 생존자에게 권한 이전
    if (action.type === 'die' && this.state.openingBettorSeatIndex === player.seatIndex) {
      this.state.openingBettorSeatIndex = this._findNextAliveSeat(player.seatIndex);
    }

    this._bettingActed.add(playerId);
    this._advanceBettingTurn();
  }

  /**
   * 다음 베팅 턴으로 진행
   */
  private _advanceBettingTurn(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);

    // 생존자 1명 이하 -> showdown (승자가 패 공개 여부 선택 후 result)
    if (alivePlayers.length <= 1) {
      if (alivePlayers.length === 1) {
        this.state.winnerId = alivePlayers[0].id;
        this.state.currentPlayerIndex = alivePlayers[0].seatIndex;
        this.state.phase = 'showdown';  // 승자가 공개/숨기기 선택
      } else {
        this.state.phase = 'result';
      }
      return;
    }

    // 베팅 종료 조건 확인
    if (this._isBettingComplete()) {
      // 자동 쇼다운: 모든 생존자 카드 공개 후 즉시 족보 비교
      this.state.players.filter(p => p.isAlive).forEach(p => { p.isRevealed = true; });
      this._resolveShowdown();
      return;
    }

    // 다음 생존 플레이어 찾기 (반시계)
    const totalPlayers = this.state.players.length;
    const currentSeatIndex = this.state.currentPlayerIndex;

    for (let i = 1; i <= totalPlayers; i++) {
      const nextSeatIndex = (currentSeatIndex - i + totalPlayers) % totalPlayers;
      const nextPlayer = this.state.players.find(p => p.seatIndex === nextSeatIndex);
      if (nextPlayer && nextPlayer.isAlive) {
        this.state.currentPlayerIndex = nextSeatIndex;
        this._updateEffectiveMaxBet();
        return;
      }
    }
  }

  /**
   * 베팅 종료 조건 확인
   * - 모든 생존자가 액션을 완료했고 currentBet === currentBetAmount
   */
  private _isBettingComplete(): boolean {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) return true;

    // 모든 생존자가 액션을 완료했는지 확인
    const allActed = alivePlayers.every(p => this._bettingActed.has(p.id));
    if (!allActed) return false;

    // 모든 생존자의 currentBet이 currentBetAmount와 동일한지 확인
    return alivePlayers.every(p => p.currentBet === this.state.currentBetAmount);
  }

  // =====================================================================
  // 쇼다운 + 승자 판정
  // =====================================================================

  /**
   * 패 공개 (showdown phase에서만 가능)
   * - 모든 생존자가 공개하면 resolveShowdown 자동 호출
   */
  revealCard(playerId: string): void {
    if (this.state.phase !== 'showdown') {
      throw new Error('INVALID_PHASE');
    }

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) {
      throw new Error('INVALID_ACTION');
    }

    player.isRevealed = true;

    const alivePlayers = this.state.players.filter(p => p.isAlive);

    // 생존자가 1명(상대 전원 다이) → 공개 선택 완료, 즉시 정산
    if (alivePlayers.length === 1) {
      this.settleChips();
      this.state.phase = 'result';
      return;
    }

    const allRevealed = alivePlayers.every(p => p.isRevealed);
    if (allRevealed) {
      this._resolveShowdown();
    }
  }

  /**
   * 패 숨기기 (showdown phase, 상대 전원 다이 상황에서만)
   * - 카드를 공개하지 않고 pot만 수령
   */
  muckHand(playerId: string): void {
    if (this.state.phase !== 'showdown') {
      throw new Error('INVALID_PHASE');
    }

    const alivePlayers = this.state.players.filter(p => p.isAlive);
    if (alivePlayers.length !== 1) {
      throw new Error('INVALID_ACTION');  // 상대가 남아있으면 숨기기 불가
    }

    if (this.state.winnerId !== playerId) {
      throw new Error('INVALID_ACTION');
    }

    // 공개 없이 정산
    this.settleChips();
    this.state.phase = 'result';
  }

  /**
   * 쇼다운 해결: evaluateHand + compareHands로 승자/동점 판정
   * 구사 재경기 조건도 확인하며, 해당 시 구사 보유자가 재경기 선이 됨
   */
  private _resolveShowdown(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);

    const hands = alivePlayers.map(p => ({
      player: p,
      hand: evaluateHand(p.cards[0], p.cards[1]),
    }));

    const allHands = hands.map(h => h.hand);

    // 구사 재경기 체크 (구사 보유자가 선)
    for (const { player, hand } of hands) {
      if (hand.isGusa || hand.isMeongtteongguriGusa) {
        const { shouldRedeal } = checkGusaTrigger(hand, allHands);
        if (shouldRedeal) {
          this.state.phase = 'rematch-pending';
          this.state.tiedPlayerIds = alivePlayers.map(p => p.id);
          this.state.rematchDealerId = player.id;  // 구사 보유자가 재경기 선
          return;
        }
      }
    }

    // 최강 패 찾기
    let best = hands[0];
    let tiedPlayers = [hands[0]];

    for (const h of hands.slice(1)) {
      const result = compareHands(best.hand, h.hand);
      if (result === 'b') {
        best = h;
        tiedPlayers = [h];
      } else if (result === 'tie') {
        tiedPlayers.push(h);
      }
    }

    if (tiedPlayers.length > 1) {
      // 동점 -> 재경기 대기 (rematchDealerId 미설정 → startRematch에서 tiedIds[0]이 선)
      this.state.phase = 'rematch-pending';
      this.state.tiedPlayerIds = tiedPlayers.map(t => t.player.id);
      return;
    }

    // 승자 결정
    this.state.winnerId = best.player.id;
    this.settleChips();  // pot을 승자에게 합산 (per D-01)
    this.state.phase = 'result';
  }

  /**
   * 동점 재경기 시작 (rematch-pending phase에서만 가능)
   * - 동점자 외 모두 isAlive=false
   * - pot 유지, 앤티 없음
   * - phase=shuffling
   */
  startRematch(): void {
    if (this.state.phase !== 'rematch-pending') {
      throw new Error('INVALID_PHASE');
    }

    const tiedIds = this.state.tiedPlayerIds ?? [];

    // 동점자 외 모두 isAlive=false, 동점자는 isAlive=true로 복원
    this.state.players.forEach(p => {
      p.isAlive = tiedIds.includes(p.id);
      p.isRevealed = false;
      p.currentBet = 0;
      p.cards = [];
    });

    // 새 덱 생성
    this.state.deck = createDeck();

    // 베팅 상태 초기화
    this.state.currentBetAmount = 0;
    this._bettingActed = new Set();

    // dealer 결정: 구사 재경기면 구사 보유자, 그 외엔 동점자 중 첫 번째
    const dealerId = this.state.rematchDealerId ?? tiedIds[0];
    this.state.players.forEach(p => { p.isDealer = false; });
    const newDealer = this.state.players.find(p => p.id === dealerId);
    if (newDealer) newDealer.isDealer = true;

    this.state.rematchDealerId = undefined;
    this.state.currentPlayerIndex = newDealer?.seatIndex ?? 0;

    // attend-school 건너뜀 (앤티 없음)
    this.state.phase = 'shuffling';
  }

  /**
   * 다음 판 시작 (result phase에서만 가능)
   * - roundNumber 증가
   * - 모든 플레이어 리셋
   * - 이전 판 승자가 dealer
   * - phase=attend-school
   */
  nextRound(): void {
    if (this.state.phase !== 'result') {
      throw new Error('INVALID_PHASE');
    }

    const prevWinnerId = this.state.winnerId;

    this.state.roundNumber += 1;
    this.state.pot = 0;
    this.state.currentBetAmount = 0;
    this.state.winnerId = undefined;
    this.state.tiedPlayerIds = undefined;
    this.state.isTtong = false;
    this.state.attendedPlayerIds = [];
    this.state.dealerSelectCards = [];
    this.state.deck = createDeck();
    this.state.openingBettorSeatIndex = null;
    this._bettingActed = new Set();

    // 모든 플레이어 리셋 (absent 플레이어는 isAlive 복원 안 함)
    this.state.players.forEach(p => {
      p.cards = [];
      p.isAlive = !p.isAbsent;  // absent이면 isAlive = false 유지
      p.isRevealed = false;
      p.currentBet = 0;
      p.isDealer = false;
    });

    // 이전 승자가 dealer
    if (prevWinnerId) {
      const winner = this.state.players.find(p => p.id === prevWinnerId);
      if (winner) {
        winner.isDealer = true;
        this.state.currentPlayerIndex = winner.seatIndex;
      }
    }

    this.state.phase = 'attend-school';
  }
}
