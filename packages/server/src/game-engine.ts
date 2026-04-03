import { createDeck, evaluateHand, compareHands, checkGusaTrigger } from '@sutda/shared';
import type { Card, GameState, GameMode, PlayerState, RoomPlayer, BetAction, ChipBreakdown, RoundHistoryEntry } from '@sutda/shared';
import type { HandResult } from '@sutda/shared';

/**
 * 승자 땡 등급에 따른 땡값 금액 계산
 * - score >= 1010 (장땡/광땡) → 1000원
 * - score >= 1001 (일땡~구땡) → 500원
 * - 그 외 → 0원 (땡값 없음)
 */
function getTtaengValueAmount(hand: HandResult): number {
  if (hand.score >= 1010) return 1000;
  if (hand.score >= 1001) return 500;
  return 0;
}

// =====================================================================
// GameModeStrategy 패턴 (per D-01, D-02)
// deal()과 showdown()만 Strategy에 위임하고, 베팅/정산은 GameEngine에 유지
// =====================================================================

interface GameModeStrategy {
  deal(engine: GameEngine, state: GameState): void;
  showdown(engine: GameEngine, state: GameState): void;
}

class OriginalModeStrategy implements GameModeStrategy {
  deal(engine: GameEngine, _state: GameState): void {
    engine['_dealCardsOriginal']();
  }
  showdown(engine: GameEngine, _state: GameState): void {
    engine['_resolveShowdownOriginal']();
  }
}

class SejangModeStrategy implements GameModeStrategy {
  deal(engine: GameEngine, _state: GameState): void {
    engine['_dealCardsSejang']();
  }
  showdown(engine: GameEngine, _state: GameState): void {
    engine['_resolveShowdownSejang']();
  }
}

class HanjangModeStrategy implements GameModeStrategy {
  deal(engine: GameEngine, _state: GameState): void {
    engine['_dealCardsHanjang']();
  }
  showdown(engine: GameEngine, _state: GameState): void {
    engine['_resolveShowdownHanjang']();
  }
}

class GollagollaModeStrategy implements GameModeStrategy {
  deal(engine: GameEngine, _state: GameState): void {
    engine['_dealCardsGollagolla']();
  }
  showdown(engine: GameEngine, _state: GameState): void {
    engine['_resolveShowdownOriginal']();  // 족보 비교는 오리지날과 동일
  }
}

class IndianModeStrategy implements GameModeStrategy {
  deal(engine: GameEngine, _state: GameState): void {
    engine['_dealCardsIndian']();
  }
  showdown(engine: GameEngine, _state: GameState): void {
    engine['_resolveShowdownOriginal']();  // 족보 비교는 오리지날과 동일 (D-09)
  }
}

/**
 * GameEngine 클래스 — 오리지날/세장섯다/한장공유 모드 게임 플로우 FSM
 *
 * 상태 전환 (오리지날): dealer-select -> attend-school -> mode-select -> shuffling -> cutting -> dealing -> betting
 * 상태 전환 (세장섯다): ... -> dealing -> betting-1 -> card-select -> betting-2 -> showdown/result
 * 상태 전환 (한장공유): ... -> mode-select -> shared-card-select -> shuffling -> cutting -> dealing(1장) -> betting
 */
export class GameEngine {
  private state: GameState;
  private cutterPlayerId: string | null = null;

  /** 마지막 판 이력 — 각 showdown 완료 후 자동 생성 */
  public lastRoundHistory: RoundHistoryEntry | null = null;

  /** 베팅이 유효한 phase 목록 */
  private static readonly BETTING_PHASES: GameState['phase'][] = ['betting', 'betting-1', 'betting-2'];

  /** 현재 모드에 맞는 Strategy 반환 (per D-01) */
  private getModeStrategy(): GameModeStrategy {
    switch (this.state.mode) {
      case 'three-card': return new SejangModeStrategy();
      case 'shared-card': return new HanjangModeStrategy();
      case 'gollagolla': return new GollagollaModeStrategy();
      case 'indian': return new IndianModeStrategy();
      default: return new OriginalModeStrategy();
    }
  }

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
      totalBet: 0,
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
    if (!GameEngine.BETTING_PHASES.includes(this.state.phase)) {
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
   * 올인 플레이어 유무에 따라 분기 정산
   * - 올인 플레이어 없으면 기존 settleChips() 호출
   * - 올인 플레이어 있으면 레벨별 사이드팟 분리 정산
   *
   * 알고리즘: totalCommitted 기준 고유 레벨 오름차순 정렬 →
   *   각 레벨의 증분(increment) × 해당 레벨에 기여한 플레이어 수 = 해당 레벨 팟
   *   그 팟은 해당 레벨에 기여한 isAlive(폴드 안 함) 플레이어 중 best hand가 수령
   */
  private settleChipsWithAllIn(): void {
    const hasAllIn = this.state.players.some(p => p.isAllIn);
    if (!hasAllIn) {
      this.settleChips();
      return;
    }

    // 각 플레이어의 족보를 미리 계산 (isAlive = 폴드하지 않은 플레이어)
    // 모드별 카드 구조 차이 대응:
    //   - 세장섯다: cards 3장 → selectedCards(선택한 2장) 우선
    //   - 한장공유: cards 1장 + sharedCard 분리
    //   - 기타: cards[0], cards[1]
    const handCache = new Map<string, ReturnType<typeof evaluateHand>>();
    const sharedCard = (this.state as any).sharedCard as import('@sutda/shared').Card | undefined;
    for (const p of this.state.players) {
      if (!p.isAlive) continue;
      const selected = (p as any).selectedCards as import('@sutda/shared').Card[] | undefined;
      if (selected?.[0] && selected?.[1]) {
        handCache.set(p.id, evaluateHand(selected[0]!, selected[1]!));
      } else if (this.state.mode === 'shared-card' && p.cards[0] && sharedCard) {
        handCache.set(p.id, evaluateHand(p.cards[0]!, sharedCard));
      } else if (p.cards[0] && p.cards[1]) {
        handCache.set(p.id, evaluateHand(p.cards[0]!, p.cards[1]!));
      }
    }

    // totalCommitted 기준으로 고유 레벨 수집 후 오름차순 정렬
    const levels = [...new Set(
      this.state.players.map(p => p.totalCommitted ?? p.totalBet)
    )].filter(v => v > 0).sort((a, b) => a - b);

    let prevLevel = 0;
    for (const level of levels) {
      const increment = level - prevLevel;
      if (increment <= 0) { prevLevel = level; continue; }

      // 이 레벨에 기여한 플레이어 수 (폴드 포함 — 기여한 칩은 팟에 있음)
      const contributorsCount = this.state.players.filter(
        p => (p.totalCommitted ?? p.totalBet) >= level
      ).length;
      const potAtLevel = increment * contributorsCount;

      // 이 레벨을 이길 수 있는 생존자: isAlive(폴드 안함) + 해당 레벨에 기여함
      const candidates = this.state.players.filter(
        p => p.isAlive && (p.totalCommitted ?? p.totalBet) >= level && handCache.has(p.id)
      );

      if (candidates.length > 0) {
        const potWinner = candidates.reduce((best, p) => {
          const result = compareHands(handCache.get(best.id)!, handCache.get(p.id)!);
          // 'b'이면 p가 더 강한 족보
          return result === 'b' ? p : best;
        });
        potWinner.chips += potAtLevel;
      }
      // candidates가 0이면(모두 폴드, 실제로는 발생 불가) 팟 무효화

      prevLevel = level;
    }

    this._updateChipBreakdowns();
  }

  /**
   * 판별 이력 생성 — 각 showdown 메서드에서 정산 후 호출
   * @param chipsBeforeSettle 정산 전 플레이어별 chips 스냅샷
   */
  private _generateRoundHistory(chipsBeforeSettle: Map<string, number>): void {
    if (!this.state.winnerId) return;
    const winner = this.state.players.find(p => p.id === this.state.winnerId);
    if (!winner) return;

    // 세장섯다: 선택된 카드로 족보 판정
    const selected = (winner as any).selectedCards as Card[] | undefined;
    const c1 = selected?.[0] ?? winner.cards[0];
    const c2 = selected?.[1] ?? winner.cards[1];
    const winnerHand = c1 && c2 ? evaluateHand(c1, c2) : null;

    this.lastRoundHistory = {
      roundNumber: this.state.roundNumber,
      winnerId: this.state.winnerId,
      winnerNickname: winner.nickname,
      winnerHandLabel: winnerHand ? winnerHand.handType : 'unknown',
      pot: this.state.pot,
      hasTtaengPayment: !!this.state.ttaengPayments && this.state.ttaengPayments.length > 0,
      playerChipChanges: this.state.players.map(p => ({
        playerId: p.id,
        nickname: p.nickname,
        chipDelta: p.chips - (chipsBeforeSettle.get(p.id) ?? p.chips),
        balance: p.chips,
      })),
    };
  }

  /**
   * 오리지날 모드 전용: 승자가 땡으로 이겼을 때 다이한 플레이어가 땡값을 납부 (RULE-03, D-01~D-04)
   * - mode !== 'original' → 무시 (D-01)
   * - 승자가 isSpecialBeater(땡잡이/암행어사) → 면제 (RULE-04, D-03)
   * - 승자 패가 땡 미만(score < 1001) → 땡값 없음
   * - 다이한 플레이어(!isAlive)만 납부 대상 (D-04)
   */
  private _settleTtaengValue(): void {
    if (this.state.mode !== 'original') return;
    if (!this.state.winnerId) return;
    if (this.state.isRematchRound) return;  // 재경기(구사/동점)에서는 땡값 면제

    const winner = this.state.players.find(p => p.id === this.state.winnerId);
    if (!winner) return;

    const winnerHand = evaluateHand(winner.cards[0]!, winner.cards[1]!);

    // 땡잡이/암행어사 승리 → 땡값 면제
    if (winnerHand.isSpecialBeater) return;

    const perPlayerAmount = getTtaengValueAmount(winnerHand);
    if (perPlayerAmount === 0) return;  // 땡 미만이면 땡값 없음

    // 다이한 플레이어만 납부 대상
    const diedPlayers = this.state.players.filter(p => !p.isAlive);
    if (diedPlayers.length === 0) return;

    const ttaengPayments: { playerId: string; amount: number }[] = [];
    for (const player of diedPlayers) {
      player.chips -= perPlayerAmount;
      ttaengPayments.push({ playerId: player.id, amount: perPlayerAmount });
    }

    winner.chips += perPlayerAmount * diedPlayers.length;
    this.state.ttaengPayments = ttaengPayments;
    this._updateChipBreakdowns();
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
      player.totalBet += 500;  // 앤티 누적
      player.totalCommitted = (player.totalCommitted ?? 0) + 500;  // 올인 정산용 기여액 추적
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
    // 이번 판 승자(다음 판 선 플레이어)는 쉬기 불가
    if (player.id === this.state.winnerId) throw new Error('DEALER_CANNOT_SKIP');
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
   * 한장공유: 딜러가 공유 카드 선택
   * - dealer만 가능
   * - phase가 'shared-card-select'인지 검증
   * - deck에서 해당 카드 제거 후 state.sharedCard에 저장
   */
  setSharedCard(playerId: string, cardIndex: number): void {
    this.assertPhase('shared-card-select');
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isDealer) throw new Error('NOT_YOUR_TURN');
    if (cardIndex < 0 || cardIndex >= this.state.deck.length) throw new Error('INVALID_ACTION');
    (this.state as any).sharedCard = this.state.deck[cardIndex];
    this.state.deck = this.state.deck.filter((_, i) => i !== cardIndex);
    this.state.phase = 'shuffling';
  }

  /**
   * 세장섯다: 3장 중 2장 선택
   * - card-select phase에서만 가능
   * - 모든 생존자 선택 완료 시 betting-2 phase로 전환
   */
  selectCards(playerId: string, cardIndices: number[]): void {
    this.assertPhase('card-select');
    if (cardIndices.length !== 2) throw new Error('INVALID_ACTION');
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) throw new Error('INVALID_ACTION');
    if ((player as any).selectedCards && (player as any).selectedCards.length === 2) {
      throw new Error('ALREADY_ATTENDED');
    }
    const [i0, i1] = cardIndices;
    if (i0 === i1 || i0 < 0 || i0 >= 3 || i1 < 0 || i1 >= 3) throw new Error('INVALID_ACTION');
    (player as any).selectedCards = [player.cards[i0], player.cards[i1]];

    // 모든 생존자 선택 완료 확인
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const allSelected = alivePlayers.every(p => (p as any).selectedCards && (p as any).selectedCards.length === 2);
    if (allSelected) {
      // 카드 선택 완료 -> 자동 쇼다운 (선택 카드로 족보 판정)
      alivePlayers.forEach(p => { p.isRevealed = true; });
      const strategy = this.getModeStrategy();
      strategy.showdown(this, this.state);
    }
  }

  /**
   * 골라골라 카드 선택 (per D-02, D-03)
   * - phase가 'gollagolla-select'인지 검증
   * - cardIndices: [number, number] — gollaOpenDeck에서의 인덱스 2개
   * - 선착순: 이미 다른 플레이어가 선택한 카드이면 'CARD_ALREADY_TAKEN' 에러
   * - 2장 선택 완료 → player.cards에 추가
   * - 모든 생존자 2장 선택 완료 시 → phase='betting' 전환
   */
  selectGollaCards(playerId: string, cardIndices: [number, number]): void {
    this.assertPhase('gollagolla-select');
    if (cardIndices[0] === cardIndices[1]) throw new Error('INVALID_ACTION');

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) throw new Error('INVALID_ACTION');
    if (player.cards.length >= 2) throw new Error('ALREADY_ATTENDED');

    const openDeck = this.state.gollaOpenDeck;
    if (!openDeck) throw new Error('INVALID_ACTION');

    if (!this._gollaSelectedIndices) {
      this._gollaSelectedIndices = new Map();
    }

    // 타인이 이미 선택한 인덱스 수집
    const takenByOthers = new Set<number>();
    for (const [pid, indices] of this._gollaSelectedIndices.entries()) {
      if (pid !== playerId) {
        indices.forEach(i => takenByOthers.add(i));
      }
    }

    if (takenByOthers.has(cardIndices[0]) || takenByOthers.has(cardIndices[1])) {
      throw new Error('CARD_ALREADY_TAKEN');
    }
    if (cardIndices[0] < 0 || cardIndices[0] >= openDeck.length ||
        cardIndices[1] < 0 || cardIndices[1] >= openDeck.length) {
      throw new Error('INVALID_ACTION');
    }

    // 선택 확정
    this._gollaSelectedIndices.set(playerId, cardIndices);
    player.cards = [openDeck[cardIndices[0]], openDeck[cardIndices[1]]];
    if (!this.state.gollaPlayerIndices) this.state.gollaPlayerIndices = {};
    this.state.gollaPlayerIndices[playerId] = cardIndices;

    // 모든 생존자 선택 완료 확인
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const allDone = alivePlayers.every(p => p.cards.length >= 2);
    if (allDone) {
      const dealerSeatIndex = this.getDealerSeatIndex();
      this.state.phase = 'betting';
      this.state.currentPlayerIndex = dealerSeatIndex;
      this.state.openingBettorSeatIndex = dealerSeatIndex;
      this.state.currentBetAmount = 0;
      this._bettingActed = new Set();
      alivePlayers.forEach(p => { p.currentBet = 0; });
      this._updateEffectiveMaxBet();
    }
  }

  /**
   * 골라골라 카드 한 장씩 예약 (선착순 per-card 방식)
   * - reserve=true: 해당 인덱스를 임시 예약 (타인이 이미 예약/확정했으면 CARD_ALREADY_TAKEN)
   * - reserve=false: 예약 취소
   * - 내 예약이 2장이 되면 selectGollaCards 자동 호출하여 확정
   */
  reserveGollaCard(playerId: string, cardIndex: number, reserve: boolean): void {
    this.assertPhase('gollagolla-select');

    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) throw new Error('INVALID_ACTION');
    if (player.cards.length >= 2) throw new Error('ALREADY_ATTENDED');

    const openDeck = this.state.gollaOpenDeck;
    if (!openDeck || cardIndex < 0 || cardIndex >= openDeck.length) throw new Error('INVALID_ACTION');

    const mySlots = this._gollaReservedSlots.get(playerId) ?? [];

    if (!reserve) {
      this._gollaReservedSlots.set(playerId, mySlots.filter(i => i !== cardIndex));
      this._syncGollaReservedState();
      return;
    }

    if (mySlots.includes(cardIndex)) return; // 이미 예약됨, 무시
    if (mySlots.length >= 2) throw new Error('INVALID_ACTION');

    // 타인의 예약 + 확정 인덱스 수집
    const takenByOthers = new Set<number>();
    if (this._gollaSelectedIndices) {
      for (const [pid, indices] of this._gollaSelectedIndices.entries()) {
        if (pid !== playerId) indices.forEach(i => takenByOthers.add(i));
      }
    }
    for (const [pid, indices] of this._gollaReservedSlots.entries()) {
      if (pid !== playerId) indices.forEach(i => takenByOthers.add(i));
    }

    if (takenByOthers.has(cardIndex)) throw new Error('CARD_ALREADY_TAKEN');

    const newSlots = [...mySlots, cardIndex];
    this._gollaReservedSlots.set(playerId, newSlots);

    if (newSlots.length === 2) {
      // 2장 예약 완료 → 자동 확정
      this._gollaReservedSlots.delete(playerId);
      this._syncGollaReservedState();
      this.selectGollaCards(playerId, [newSlots[0], newSlots[1]] as [number, number]);
      return;
    }

    this._syncGollaReservedState();
  }

  private _syncGollaReservedState(): void {
    const reserved: Record<string, number[]> = {};
    for (const [pid, indices] of this._gollaReservedSlots.entries()) {
      if (indices.length > 0) reserved[pid] = [...indices];
    }
    this.state.gollaReservedIndices = reserved;
  }

  /**
   * 인디언섯다 2번째 카드 배분 — 서버 자동 처리 (betting-1 종료 시)
   * dealing-extra phase로 전환된 후 소켓 핸들러에서 호출
   */
  dealExtraCardIndian(): void {
    if (this.state.mode !== 'indian') throw new Error('INVALID_ACTION');
    if (this.state.phase !== 'dealing-extra') throw new Error('INVALID_PHASE');
    this._dealExtraCardIndian();
  }

  /**
   * 플레이어별 필터링된 게임 상태 반환 (인디언 모드 카드 마스킹)
   * - 인디언 모드 + dealing/betting-1 phase:
   *   본인의 cards[0]을 null로 마스킹 (자신의 패는 볼 수 없음)
   *   타인 cards[0]는 정상 공개
   * - 인디언 모드 + dealing-extra/betting-2 phase:
   *   본인 cards[0] = 여전히 null (숨김)
   *   타인 cards[1] = null (2번째 카드는 본인에게만 공개)
   * - result phase: 모든 카드 공개
   * - 다른 모드: 기존 getState()와 동일 (마스킹 없음)
   */
  getStateFor(playerId: string): GameState {
    const state = this.state;

    if (state.mode !== 'indian') {
      return state as GameState;
    }

    const phase = state.phase;
    const isResultPhase = phase === 'result' || phase === 'showdown';

    if (isResultPhase) {
      return state as GameState;
    }

    // 인디언 모드 마스킹 적용
    const maskedPlayers = state.players.map(p => {
      const cards = [...p.cards];

      if (phase === 'dealing' || phase === 'betting-1') {
        // 1차: cards[0]가 있는 경우 — 본인에게는 숨김, 타인에게는 공개
        if (p.id === playerId && cards.length > 0) {
          cards[0] = null as any;  // 클라이언트는 null을 CardBack으로 렌더링
        }
      } else if (phase === 'dealing-extra' || phase === 'betting-2') {
        // 2차: cards[0] = 반전 (타인 공개, 본인 숨김) 유지
        // cards[1] = 본인에게만 공개, 타인에게는 숨김
        if (p.id === playerId && cards.length > 0) {
          cards[0] = null as any;  // 여전히 본인에게 숨김
        }
        if (p.id !== playerId && cards.length > 1) {
          cards[1] = null as any;  // 타인의 2번째 카드는 숨김
        }
      }

      return { ...p, cards };
    });

    return { ...state, players: maskedPlayers } as GameState;
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
    // 한장공유: 딜러가 공유카드를 먼저 선택해야 함 (per D-03)
    if (mode === 'shared-card') {
      this.state.phase = 'shared-card-select';
    } else if (mode === 'gollagolla') {
      // 골라골라: 기리 없음 — 자동 셔플 후 바로 카드 선택 화면으로 진입
      const shuffled = [...this.state.deck];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      this.state.deck = shuffled;
      this._dealCardsGollagolla();
    } else {
      this.state.phase = 'shuffling';
    }
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

    // 기리 스킵: 구사/동점 재경기, 한장공유, 인디안섯다
    if (this.state.skipCutting || this.state.mode === 'shared-card' || this.state.mode === 'indian') {
      this.state.skipCutting = undefined;
      this.state.phase = 'dealing';
      this._dealCards();
      return;
    }

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
   * 패 배분 — Strategy 패턴으로 모드별 위임 (per D-01, D-02)
   */
  private _dealCards(): void {
    const strategy = this.getModeStrategy();
    strategy.deal(this, this.state);
  }

  /**
   * 오리지날 모드 패 배분 (OriginalModeStrategy에서 호출)
   * - 등교한 플레이어(isAlive===true)만 대상
   * - 반시계 방향 배분
   * - isTtong이면 2장씩, 아니면 1장씩 2라운드
   */
  private _dealCardsOriginal(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const dealerSeatIndex = this.getDealerSeatIndex();

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
   * 세장섯다 모드 패 배분 (SejangModeStrategy에서 호출)
   * - 2장 배분 후 sejang-open phase로 전환 (각 플레이어가 오픈할 카드 선택)
   */
  private _dealCardsSejang(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const dealerSeatIndex = this.getDealerSeatIndex();

    const orderedByDealerCounterClockwise = this._getAlivePlayersInCounterClockwiseOrder(
      dealerSeatIndex,
      alivePlayers,
    );

    // 1장씩 2라운드 배분 (퉁 없음)
    for (let round = 0; round < 2; round++) {
      for (const player of orderedByDealerCounterClockwise) {
        const card = this.state.deck.shift();
        if (card) player.cards.push(card);
      }
    }

    // sejang-open phase: 각 플레이어가 오픈할 카드 선택 후 betting-1로 전환
    this.state.phase = 'sejang-open';
  }

  /**
   * 세장섯다: 각 플레이어가 오픈할 카드(0 또는 1)를 선택
   * - sejang-open phase에서만 가능
   * - 모든 생존자 선택 완료 시 betting-1로 전환
   */
  openSejangCard(playerId: string, cardIndex: 0 | 1): void {
    this.assertPhase('sejang-open');
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) throw new Error('INVALID_ACTION');
    if (player.openedCardIndex !== undefined) throw new Error('ALREADY_ATTENDED');
    if (cardIndex !== 0 && cardIndex !== 1) throw new Error('INVALID_ACTION');
    if (player.cards.length < 2) throw new Error('INVALID_ACTION');

    player.openedCardIndex = cardIndex;

    // 모든 생존자 선택 완료 시 betting-1 전환
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const allOpened = alivePlayers.every(p => p.openedCardIndex !== undefined);
    if (allOpened) {
      const dealerSeatIndex = this.getDealerSeatIndex();
      this.state.phase = 'betting-1';
      this.state.currentPlayerIndex = dealerSeatIndex;
      this.state.openingBettorSeatIndex = dealerSeatIndex;
      this._bettingActed = new Set();
      this._updateChipBreakdowns();
      this._updateEffectiveMaxBet();
    }
  }

  /**
   * 세장섯다: 생존자에게 3번째 카드 배분 (phase 전환 없음)
   * - betting-1 완료 후 호출: 3번째 카드 배분 → betting-2
   */
  private _dealExtraCardForSejang(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const dealerSeatIndex = this.getDealerSeatIndex();
    const orderedByDealerCounterClockwise = this._getAlivePlayersInCounterClockwiseOrder(
      dealerSeatIndex,
      alivePlayers,
    );

    for (const player of orderedByDealerCounterClockwise) {
      const card = this.state.deck.shift();
      if (card) player.cards.push(card);
    }
  }

  /**
   * 한장공유 모드 패 배분 (HanjangModeStrategy에서 호출)
   * - 각 플레이어에게 1장씩만 배분
   * - betting phase (기존 betting 사용, per D-08)
   */
  private _dealCardsHanjang(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const dealerSeatIndex = this.getDealerSeatIndex();

    const orderedByDealerCounterClockwise = this._getAlivePlayersInCounterClockwiseOrder(
      dealerSeatIndex,
      alivePlayers,
    );

    // 1장씩 배분
    for (const player of orderedByDealerCounterClockwise) {
      const card = this.state.deck.shift();
      if (card) player.cards.push(card);
    }

    this.state.phase = 'betting';
    this.state.currentPlayerIndex = dealerSeatIndex;
    this.state.openingBettorSeatIndex = dealerSeatIndex;
    this._updateChipBreakdowns();
    this._updateEffectiveMaxBet();
  }

  /**
   * 골라골라 모드 패 배분 (GollagollaModeStrategy에서 호출)
   * - 덱 20장 전체를 공개 배열로 state.gollaOpenDeck에 설정
   * - 모든 플레이어 cards는 빈 배열 유지 (선택 완료 시 채워짐)
   * - phase = 'gollagolla-select' 전환
   * - 참고: cut() 호출 이후이므로 deck은 이미 셔플+기리 완료 상태
   */
  private _dealCardsGollagolla(): void {
    // 셔플된 덱 20장 전체를 오픈 배열로 복사
    this.state.gollaOpenDeck = [...this.state.deck];
    // 선택 전까지 플레이어 cards는 비움
    this.state.players.forEach(p => { p.cards = []; });
    // 골라 선택 인덱스 초기화
    this._gollaSelectedIndices = new Map();
    this._gollaReservedSlots = new Map();
    this.state.gollaPlayerIndices = {};
    this.state.gollaReservedIndices = {};
    this.state.phase = 'gollagolla-select';
  }

  /**
   * 인디언섯다 모드 패 배분 (IndianModeStrategy에서 호출)
   * - 각 플레이어에게 1장씩 배분 (반시계 방향)
   * - phase = 'betting-1' 전환 (BETTING_PHASES에 포함됨)
   * - getStateFor()에서 dealing/betting-1 phase에 cards[0]를 마스킹하여 per-player emit
   */
  private _dealCardsIndian(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const dealerSeatIndex = this.getDealerSeatIndex();
    const ordered = this._getAlivePlayersInCounterClockwiseOrder(dealerSeatIndex, alivePlayers);

    // 1장씩 배분
    for (const player of ordered) {
      const card = this.state.deck.shift();
      if (card) player.cards.push(card);
    }

    // 베팅 1차 시작
    this.state.phase = 'betting-1';
    this.state.currentPlayerIndex = dealerSeatIndex;
    this.state.openingBettorSeatIndex = dealerSeatIndex;
    this.state.currentBetAmount = 0;
    this._bettingActed = new Set();
    alivePlayers.forEach(p => { p.currentBet = 0; });
    this._updateEffectiveMaxBet();
  }

  /**
   * 인디언섯다: 2번째 카드 배분 (dealing-extra phase)
   * - 각 플레이어에게 1장씩 추가 배분 (반시계 방향)
   * - 본인에게만 공개 (getStateFor에서 타인에게는 cards[1]을 마스킹)
   * - phase = 'betting-2' 전환
   */
  private _dealExtraCardIndian(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const dealerSeatIndex = this.getDealerSeatIndex();
    const ordered = this._getAlivePlayersInCounterClockwiseOrder(dealerSeatIndex, alivePlayers);

    for (const player of ordered) {
      const card = this.state.deck.shift();
      if (card) player.cards.push(card);
    }

    // 2차 베팅 시작
    this.state.phase = 'betting-2';
    this.state.currentPlayerIndex = dealerSeatIndex;
    this.state.openingBettorSeatIndex = dealerSeatIndex;
    this.state.currentBetAmount = 0;
    this._bettingActed = new Set();
    alivePlayers.forEach(p => { p.currentBet = 0; });
    this._updateEffectiveMaxBet();

    // 전원 올인이면 betting-2 즉시 종료
    const activeBettorsIndian = alivePlayers.filter(p => !p.isAllIn);
    if (activeBettorsIndian.length === 0) {
      this._advanceBettingTurn();
      return;
    }
    // 선 플레이어(딜러)가 올인이면 다음 활성 플레이어로 진행
    const dealerP = this.state.players.find(p => p.seatIndex === dealerSeatIndex);
    if (dealerP?.isAllIn) {
      this._bettingActed.add(dealerP.id);
      this._advanceBettingTurn();
    }
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
   * 골라골라 모드: 각 플레이어가 선택한 gollaOpenDeck 인덱스 추적
   */
  private _gollaSelectedIndices: Map<string, [number, number]> | null = null;
  private _gollaReservedSlots: Map<string, number[]> = new Map();

  /**
   * 베팅 액션 처리 (콜/레이즈/다이/체크)
   */
  processBetAction(playerId: string, action: BetAction): void {
    if (!GameEngine.BETTING_PHASES.includes(this.state.phase)) {
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
        const callAmount = Math.min(player.chips, this.state.currentBetAmount - player.currentBet);
        player.chips -= callAmount;
        player.currentBet += callAmount;
        player.totalBet += callAmount;
        player.totalCommitted = (player.totalCommitted ?? 0) + callAmount;
        this.state.pot += callAmount;
        if (player.chips === 0) {
          player.isAllIn = true;
        }
        player.lastBetAction = { type: 'call' };
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
        player.totalBet += callAmount + action.amount;
        player.totalCommitted = (player.totalCommitted ?? 0) + totalDeducted;
        this.state.pot += callAmount + action.amount;
        this.state.currentBetAmount = player.currentBet;
        if (player.chips === 0) {
          player.isAllIn = true;
        }
        player.lastBetAction = { type: 'raise', amount: action.amount };

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
        player.lastBetAction = { type: 'die' };
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
        player.lastBetAction = { type: 'check' };
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
      if (this.state.phase === 'betting-1') {
        if (this.state.mode === 'indian') {
          // 인디언섯다: 2번째 카드 배분을 위해 dealing-extra phase로 전환
          // 소켓 핸들러에서 dealExtraCardIndian()을 자동 호출해야 함
          this.state.phase = 'dealing-extra';
          return;
        }
        // 세장섯다: betting-1 완료 → 3번째 카드 배분 → betting-2
        if (this.state.mode === 'three-card') {
          this._dealExtraCardForSejang();
        }
        const dealerSeatIndex2 = this.getDealerSeatIndex();
        this.state.phase = 'betting-2';
        this.state.currentPlayerIndex = dealerSeatIndex2;
        this.state.openingBettorSeatIndex = dealerSeatIndex2;
        this.state.currentBetAmount = 0;
        this._bettingActed = new Set();
        this.state.players.filter(p => p.isAlive).forEach(p => { p.currentBet = 0; });
        this._updateEffectiveMaxBet();

        // 전원 올인이면 betting-2 즉시 종료
        const activeBettors2 = this.state.players.filter(p => p.isAlive && !p.isAllIn);
        if (activeBettors2.length === 0) {
          this._advanceBettingTurn();
          return;
        }
        // 선 플레이어(딜러)가 올인이면 다음 활성 플레이어로 진행
        const dealerPlayer2 = this.state.players.find(p => p.seatIndex === dealerSeatIndex2);
        if (dealerPlayer2?.isAllIn) {
          // 딜러를 이미 acted로 간주하고 다음 턴으로 진행
          this._bettingActed.add(dealerPlayer2.id);
          this._advanceBettingTurn();
        }
        return;
      }
      // 세장섯다 betting-2 완료: card-select phase로 전환
      if (this.state.phase === 'betting-2' && this.state.mode === 'three-card') {
        this.state.phase = 'card-select';
        return;
      }
      // betting / betting-2(non-sejang): 자동 쇼다운 — Strategy 위임
      this.state.players.filter(p => p.isAlive).forEach(p => { p.isRevealed = true; });
      const strategy = this.getModeStrategy();
      strategy.showdown(this, this.state);
      return;
    }

    // 다음 생존 플레이어 찾기 (반시계) — 올인/disconnect 플레이어 스킵
    const totalPlayers = this.state.players.length;
    const currentSeatIndex = this.state.currentPlayerIndex;

    for (let i = 1; i <= totalPlayers; i++) {
      const nextSeatIndex = (currentSeatIndex - i + totalPlayers) % totalPlayers;
      const nextPlayer = this.state.players.find(p => p.seatIndex === nextSeatIndex);
      if (nextPlayer && nextPlayer.isAlive && !nextPlayer.isAllIn) {
        // disconnect된 플레이어 차례 → 자동 다이
        if (nextPlayer.isDisconnected) {
          nextPlayer.isAlive = false;
          nextPlayer.lastBetAction = { type: 'die' };
          this._bettingActed.add(nextPlayer.id);
          this.state.currentPlayerIndex = nextSeatIndex;
          // 재귀적으로 다음 턴 처리
          this._advanceBettingTurn();
          return;
        }
        this.state.currentPlayerIndex = nextSeatIndex;
        this._updateEffectiveMaxBet();
        return;
      }
    }
  }

  /**
   * 베팅 종료 조건 확인
   * - 올인이 아닌 모든 생존자가 액션을 완료했고 currentBet === currentBetAmount
   * - 올인 플레이어는 이미 완료로 간주
   */
  private _isBettingComplete(): boolean {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) return true;

    // 올인이 아닌 생존자만 베팅 참여 대상
    const activeBettors = alivePlayers.filter(p => !p.isAllIn);
    if (activeBettors.length === 0) return true;  // 전원 올인이면 베팅 종료

    // 모든 활성 베터가 액션을 완료했는지 확인
    const allActed = activeBettors.every(p => this._bettingActed.has(p.id));
    if (!allActed) return false;

    // 모든 활성 베터의 currentBet이 currentBetAmount와 동일한지 확인
    return activeBettors.every(p => p.currentBet === this.state.currentBetAmount);
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
      this.state.winnerId = alivePlayers[0].id;
      const chipsSnapshot1 = new Map(this.state.players.map(p => [p.id, p.chips]));
      this.settleChipsWithAllIn();
      this._settleTtaengValue();  // 오리지날 모드: 땡값 정산 (상대 전원 다이 후 공개)
      this._generateRoundHistory(chipsSnapshot1);
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
    const chipsSnapshotMuck = new Map(this.state.players.map(p => [p.id, p.chips]));
    this.settleChipsWithAllIn();
    this._generateRoundHistory(chipsSnapshotMuck);
    this.state.phase = 'result';
  }

  /**
   * revealCard에서 모든 생존자 공개 시 호출 — Strategy로 위임
   */
  private _resolveShowdown(): void {
    const strategy = this.getModeStrategy();
    strategy.showdown(this, this.state);
  }

  /**
   * 쇼다운 해결: evaluateHand + compareHands로 승자/동점 판정
   * 구사 재경기 조건도 확인하며, 해당 시 구사 보유자가 재경기 선이 됨
   */
  private _resolveShowdownOriginal(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);

    const hands = alivePlayers.map(p => ({
      player: p,
      hand: evaluateHand(p.cards[0]!, p.cards[1]!),
    }));

    const allHands = hands.map(h => h.hand);

    // 최강 패 먼저 계산 (D-07 구사 면제 판단용)
    let best = hands[0];
    let tiedPlayers = [hands[0]];
    for (const h of hands.slice(1)) {
      const result = compareHands(best.hand, h.hand);
      if (result === 'b') { best = h; tiedPlayers = [h]; }
      else if (result === 'tie') { tiedPlayers.push(h); }
    }
    const winnerHand = best.hand;

    // 구사 재경기 체크 (구사 보유자가 선) — D-07 특수패 면제 포함
    for (const { player, hand } of hands) {
      if (hand.isGusa || hand.isMeongtteongguriGusa) {
        const { shouldRedeal } = checkGusaTrigger(hand, allHands);
        if (shouldRedeal) {
          // D-07: 특수패(땡잡이/암행어사) 승리 시 면제 체크
          if (winnerHand.isSpecialBeater) {
            if (winnerHand.score === 1) continue;  // 암행어사 → 모든 구사 무시
            if (winnerHand.score === 0 && !hand.isMeongtteongguriGusa) continue;  // 땡잡이 + 일반구사 → 무시
            // 땡잡이 + 멍텅구리구사 → 트리거됨 (아래로 진행)
          }
          this.state.rematchDealerId = player.id;  // 구사 보유자가 재경기 선
          const diedPlayers = this.state.players.filter(p => !p.isAlive);
          if (diedPlayers.length === 0) {
            this._startGusaRematchImmediate();
          } else {
            this.state.phase = 'gusa-pending';
            this.state.gusaPendingDecisions = Object.fromEntries(
              diedPlayers.map(p => [p.id, null])
            );
          }
          return;
        }
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
    const chipsSnapshotOrig = new Map(this.state.players.map(p => [p.id, p.chips]));
    this.settleChipsWithAllIn();  // 올인 여부에 따라 분기 정산
    this._settleTtaengValue();  // 오리지날 모드: 땡값 정산 (Phase 09-01)
    this._generateRoundHistory(chipsSnapshotOrig);
    this.state.phase = 'result';
  }

  /**
   * 세장섯다 쇼다운 — selectedCards 기반으로 족보 판정 (SejangModeStrategy에서 호출)
   * fallback: selectedCards가 없으면 cards[0], cards[1] 사용
   */
  private _resolveShowdownSejang(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);

    const hands = alivePlayers.map(p => {
      const selected = (p as any).selectedCards as Card[] | undefined;
      const card1 = selected?.[0] ?? p.cards[0]!;
      const card2 = selected?.[1] ?? p.cards[1]!;
      return {
        player: p,
        hand: evaluateHand(card1, card2),
      };
    });

    const allHands = hands.map(h => h.hand);

    // 최강 패 먼저 계산 (D-07 구사 면제 판단용)
    let best = hands[0];
    let tiedPlayers = [hands[0]];
    for (const h of hands.slice(1)) {
      const result = compareHands(best.hand, h.hand);
      if (result === 'b') { best = h; tiedPlayers = [h]; }
      else if (result === 'tie') { tiedPlayers.push(h); }
    }
    const winnerHand = best.hand;

    // 구사 재경기 체크 — D-07 특수패 면제 포함
    for (const { player, hand } of hands) {
      if (hand.isGusa || hand.isMeongtteongguriGusa) {
        const { shouldRedeal } = checkGusaTrigger(hand, allHands);
        if (shouldRedeal) {
          if (winnerHand.isSpecialBeater) {
            if (winnerHand.score === 1) continue;
            if (winnerHand.score === 0 && !hand.isMeongtteongguriGusa) continue;
          }
          this.state.rematchDealerId = player.id;
          const diedPlayers = this.state.players.filter(p => !p.isAlive);
          if (diedPlayers.length === 0) {
            this._startGusaRematchImmediate();
          } else {
            this.state.phase = 'gusa-pending';
            this.state.gusaPendingDecisions = Object.fromEntries(
              diedPlayers.map(p => [p.id, null])
            );
          }
          return;
        }
      }
    }

    if (tiedPlayers.length > 1) {
      this.state.phase = 'rematch-pending';
      this.state.tiedPlayerIds = tiedPlayers.map(t => t.player.id);
      return;
    }

    this.state.winnerId = best.player.id;
    const chipsSnapshotSejang = new Map(this.state.players.map(p => [p.id, p.chips]));
    this.settleChipsWithAllIn();
    this._generateRoundHistory(chipsSnapshotSejang);
    this.state.phase = 'result';
  }

  /**
   * 한장공유 쇼다운 — evaluateHand(playerCard, sharedCard) 기반 (HanjangModeStrategy에서 호출)
   */
  private _resolveShowdownHanjang(): void {
    const alivePlayers = this.state.players.filter(p => p.isAlive);
    const sharedCard = (this.state as any).sharedCard as Card | undefined;

    const hands = alivePlayers.map(p => ({
      player: p,
      hand: evaluateHand(p.cards[0]!, sharedCard ?? p.cards[0]!),
    }));

    const allHands = hands.map(h => h.hand);

    // 최강 패 먼저 계산 (D-07 구사 면제 판단용)
    let best = hands[0];
    let tiedPlayers = [hands[0]];
    for (const h of hands.slice(1)) {
      const result = compareHands(best.hand, h.hand);
      if (result === 'b') { best = h; tiedPlayers = [h]; }
      else if (result === 'tie') { tiedPlayers.push(h); }
    }
    const winnerHand = best.hand;

    // 구사 재경기 체크 — D-07 특수패 면제 포함
    for (const { player, hand } of hands) {
      if (hand.isGusa || hand.isMeongtteongguriGusa) {
        const { shouldRedeal } = checkGusaTrigger(hand, allHands);
        if (shouldRedeal) {
          if (winnerHand.isSpecialBeater) {
            if (winnerHand.score === 1) continue;
            if (winnerHand.score === 0 && !hand.isMeongtteongguriGusa) continue;
          }
          this.state.rematchDealerId = player.id;
          const diedPlayers = this.state.players.filter(p => !p.isAlive);
          if (diedPlayers.length === 0) {
            this._startGusaRematchImmediate();
          } else {
            this.state.phase = 'gusa-pending';
            this.state.gusaPendingDecisions = Object.fromEntries(
              diedPlayers.map(p => [p.id, null])
            );
          }
          return;
        }
      }
    }

    if (tiedPlayers.length > 1) {
      this.state.phase = 'rematch-pending';
      this.state.tiedPlayerIds = tiedPlayers.map(t => t.player.id);
      return;
    }

    this.state.winnerId = best.player.id;
    const chipsSnapshotHanjang = new Map(this.state.players.map(p => [p.id, p.chips]));
    this.settleChipsWithAllIn();
    this._generateRoundHistory(chipsSnapshotHanjang);
    this.state.phase = 'result';
  }

  /**
   * 동점 재경기 확인 (rematch-pending phase에서만 가능)
   * - 동점자만 확인 가능
   * - 모든 동점자가 확인하면 자동으로 재경기 시작
   */
  confirmRematch(playerId: string): void {
    if (this.state.phase !== 'rematch-pending') {
      throw new Error('INVALID_PHASE');
    }
    const tiedIds = this.state.tiedPlayerIds ?? [];
    if (!tiedIds.includes(playerId)) {
      throw new Error('INVALID_ACTION');
    }
    if (!this.state.rematchConfirmedIds) {
      this.state.rematchConfirmedIds = [];
    }
    if (this.state.rematchConfirmedIds.includes(playerId)) return;
    this.state.rematchConfirmedIds.push(playerId);

    // 모든 동점자가 확인했는지 체크
    if (this.state.rematchConfirmedIds.length >= tiedIds.length) {
      this._startTieRematch();
    }
  }

  /**
   * 동점 재경기 시작 (내부 호출)
   * - 동점자 외 모두 isAlive=false
   * - pot 유지, 앤티 없음
   * - skipCutting=true (기리 없이 바로 dealing)
   */
  private _startTieRematch(): void {
    const tiedIds = this.state.tiedPlayerIds ?? [];

    // 동점자 외 모두 isAlive=false, 동점자는 isAlive=true로 복원
    // totalBet: 전원 유지 — 이전 라운드 + 재경기 누적으로 정확한 손익 표시
    this.state.players.forEach(p => {
      const isTied = tiedIds.includes(p.id);
      p.isAlive = isTied;
      p.isRevealed = false;
      p.currentBet = 0;
      // totalBet 리셋 안 함 — 원래 판 베팅액 유지하여 재경기 베팅과 누적
      p.lastBetAction = undefined;
      p.cards = [];
      (p as any).selectedCards = undefined;
      p.openedCardIndex = undefined;
    });

    // 새 덱 생성
    this.state.deck = createDeck();

    // 베팅 상태 초기화
    this.state.currentBetAmount = 0;
    this._bettingActed = new Set();

    // dealer 결정: 이전 선의 반시계 다음 동점자
    let dealerId = this.state.rematchDealerId;
    if (!dealerId) {
      const prevDealerSeatIndex = this.getDealerSeatIndex();
      const totalPlayers = this.state.players.length;
      for (let i = 1; i <= totalPlayers; i++) {
        const candidateSeat = (prevDealerSeatIndex - i + totalPlayers) % totalPlayers;
        const candidate = this.state.players.find(p => p.seatIndex === candidateSeat);
        if (candidate && tiedIds.includes(candidate.id)) {
          dealerId = candidate.id;
          break;
        }
      }
      if (!dealerId) dealerId = tiedIds[0];
    }
    this.state.players.forEach(p => { p.isDealer = false; });
    const newDealer = this.state.players.find(p => p.id === dealerId);
    if (newDealer) newDealer.isDealer = true;

    this.state.rematchDealerId = undefined;
    this.state.rematchConfirmedIds = undefined;
    this.state.currentPlayerIndex = newDealer?.seatIndex ?? 0;

    // attend-school/mode-select 건너뜀 (앤티 없음), 오리지날 2장 섯다로 자동 실행
    (this.state as any).sharedCard = undefined;
    this.state.mode = 'original';
    this.state.isRematchRound = true;   // 동점 재경기 — 땡값 면제
    this.state.skipCutting = true;      // 동점 재경기 — 기리 없이 바로 dealing
    this.state.phase = 'shuffling';
  }

  /**
   * 구사 재경기 대기 중 플레이어의 재참여 결정 처리 (gusa-pending phase에서만 가능)
   * - join=true이고 chips >= pot/2 → 재참여 승인: chips 차감, isAlive=true, pot 증가
   * - join=true이고 chips < pot/2 → 자동 거절 처리
   * - 모든 결정 수집 완료 시 → _startGusaRematch() 자동 호출
   */
  recordGusaRejoinDecision(playerId: string, join: boolean): void {
    if (this.state.phase !== 'gusa-pending') {
      throw new Error('INVALID_PHASE');
    }

    const decisions = this.state.gusaPendingDecisions;
    if (!decisions || !(playerId in decisions)) {
      throw new Error('INVALID_ACTION');
    }

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) throw new Error('INVALID_ACTION');

    const halfPot = Math.floor(this.state.pot / 2);

    // 잔액 부족 시 자동 거절
    if (join && player.chips < halfPot) {
      join = false;
    }

    if (join) {
      player.chips -= halfPot;
      this.state.pot += halfPot;
      player.isAlive = true;
    }

    decisions[playerId] = join;

    // 모든 결정 수집 완료 여부 확인
    const allDecided = Object.values(decisions).every(v => v !== null);
    if (allDecided) {
      this._startGusaRematch();
    }
  }

  /**
   * 구사 재경기 시작 — gusaPendingDecisions 결과에 따라 참여자 확정 후 shuffling 전환
   * startRematch()와 달리 mode를 변경하지 않음
   */
  private _startGusaRematch(): void {
    // 결정 정리: gusaPendingDecisions에서 false인 플레이어는 isAlive=false 유지
    // (true인 플레이어는 recordGusaRejoinDecision에서 이미 isAlive=true로 설정됨)
    this.state.gusaPendingDecisions = undefined;

    // 카드/베팅 상태 초기화 — totalBet 유지 (이전 라운드 베팅 누적)
    this.state.players.forEach(p => {
      p.cards = [];
      p.isRevealed = false;
      p.currentBet = 0;
      // totalBet 리셋 안 함 — 원래 판 베팅액 유지하여 재경기 베팅과 누적
      p.lastBetAction = undefined;
      (p as any).selectedCards = undefined;
      p.openedCardIndex = undefined;
    });

    // 새 덱 생성
    this.state.deck = createDeck();

    // 베팅 상태 초기화
    this.state.currentBetAmount = 0;
    this._bettingActed = new Set();

    // dealer: 구사 보유자(rematchDealerId)를 dealer로 설정
    const dealerId = this.state.rematchDealerId;
    this.state.players.forEach(p => { p.isDealer = false; });
    if (dealerId) {
      const dealer = this.state.players.find(p => p.id === dealerId);
      if (dealer) {
        dealer.isDealer = true;
        this.state.currentPlayerIndex = dealer.seatIndex;
      }
    }

    this.state.rematchDealerId = undefined;

    // 공유 카드 초기화
    (this.state as any).sharedCard = undefined;

    // mode 유지 (startRematch와의 핵심 차이)
    this.state.isRematchRound = true;  // 구사 재경기 — 땡값 면제
    this.state.skipCutting = true;     // 구사 재경기 — 기리 없이 바로 dealing
    this.state.phase = 'shuffling';
  }

  /**
   * 다이 플레이어 0명 시 gusa-announce phase로 전환 — 클라이언트 안내 모달 표시 후 confirmGusaAnnounce() 호출
   */
  private _startGusaRematchImmediate(): void {
    // 전원 생존: gusa-announce로 안내 모달 표시 (confirmGusaAnnounce 후 _startGusaRematch 호출)
    this.state.phase = 'gusa-announce';
  }

  /**
   * 구사 재경기 안내 확인 (gusa-announce phase에서 선 플레이어가 확인)
   * - phase = gusa-announce에서만 가능
   * - _startGusaRematch() 호출하여 shuffling 진행
   */
  confirmGusaAnnounce(playerId: string): void {
    this.assertPhase('gusa-announce');
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.isDealer) throw new Error('NOT_YOUR_TURN');
    this._startGusaRematch();
  }

  /**
   * disconnect 즉시 호출 — isDisconnected 마킹 + 현재 베팅 차례면 자동 다이
   */
  forceDisconnectedPlayerAction(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    player.isDisconnected = true;

    if (!player.isAlive) return;

    const currentPlayer = this.state.players.find(p => p.seatIndex === this.state.currentPlayerIndex);
    if (currentPlayer?.id === playerId && GameEngine.BETTING_PHASES.includes(this.state.phase)) {
      try {
        this.processBetAction(playerId, { type: 'die' });
      } catch { /* no-op */ }
    }
  }

  /**
   * 재접속 시 호출 — 닉네임으로 기존 플레이어를 찾아 id를 새 socket.id로 갱신하고 isDisconnected 해제.
   * roomManager.joinRoom은 room.players만 갱신하므로 engine.state.players도 여기서 동기화해야 함.
   */
  markReconnected(nickname: string, newPlayerId: string): void {
    const player = this.state.players.find(p => p.nickname === nickname);
    if (player) {
      player.id = newPlayerId;
      player.isDisconnected = false;
    }
  }

  /**
   * 게임 중 플레이어 강제 퇴장 처리 (60초 타임아웃 만료 시 호출)
   * - 베팅 phase 중이면 자동 다이 처리
   * - 그 외 phase에서는 isAlive = false 설정
   */
  forcePlayerLeave(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    if (GameEngine.BETTING_PHASES.includes(this.state.phase) && player.isAlive) {
      try {
        this.processBetAction(playerId, { type: 'die' });
      } catch {
        player.isAlive = false;
      }
    } else {
      player.isAlive = false;
    }
  }

  /**
   * 등교 대납 (D-15: 학교 대신 가주기)
   * - sponsorId 플레이어가 beneficiaryId 플레이어 대신 앤티 500원 납부
   * - phase가 'attend-school'인지 검증
   * - 후원자 잔액 < 500 시 fallback으로 수혜자가 직접 납부 (Pitfall 5 예방)
   */
  attendSchoolProxy(beneficiaryId: string, sponsorId: string): void {
    this.assertPhase('attend-school');

    if (this.state.attendedPlayerIds.includes(beneficiaryId)) {
      throw new Error('ALREADY_ATTENDED');
    }

    const beneficiary = this.state.players.find(p => p.id === beneficiaryId);
    const sponsor = this.state.players.find(p => p.id === sponsorId);
    if (!beneficiary || !sponsor) throw new Error('INVALID_ACTION');

    // 후원자 잔액 부족 시 fallback — 수혜자가 직접 납부 (Pitfall 5 예방)
    if (sponsor.chips < 500) {
      this.attendSchool(beneficiaryId);
      return;
    }

    // 후원자 칩 차감
    sponsor.chips -= 500;
    sponsor.totalCommitted = (sponsor.totalCommitted ?? 0) + 500;

    // 수혜자는 무료 참여 (chips 차감 없음)
    this.state.pot += 500;
    this.state.attendedPlayerIds.push(beneficiaryId);

    this._updateChipBreakdowns();

    // 전원 등교 완료 체크
    if (this.state.attendedPlayerIds.length === this.state.players.length) {
      this.completeAttendSchool();
    }
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
    this.state.rematchConfirmedIds = undefined;
    this.state.ttaengPayments = undefined;
    this.state.isTtong = false;
    this.state.isRematchRound = undefined;
    this.state.skipCutting = undefined;
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
      p.totalBet = 0;
      p.lastBetAction = undefined;
      p.isDealer = false;
      p.isAllIn = false;
      p.totalCommitted = 0;
      (p as any).selectedCards = undefined;  // 세장섯다: 선택 카드 초기화
      p.openedCardIndex = undefined;  // 세장섯다: 오픈 카드 인덱스 초기화
    });
    (this.state as any).sharedCard = undefined;  // 한장공유: 공유 카드 초기화
    this.state.schoolProxyBeneficiaryIds = undefined;  // 학교 대납 수혜자 리셋

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
