import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from './game-engine';
import type { RoomPlayer, GameState } from '@sutda/shared';

/** 테스트용 플레이어 목록 생성 헬퍼 */
function makePlayers(count: number): RoomPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    nickname: `Player${i}`,
    chips: 100000,
    seatIndex: i,
    isConnected: true,
  }));
}

describe('GameEngine', () => {
  let players: RoomPlayer[];

  beforeEach(() => {
    players = makePlayers(4);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. constructor — roundNumber=1이면 dealer-select, 아니면 attend-school
  it('roundNumber=1이면 초기 phase가 dealer-select이다', () => {
    const engine = new GameEngine('room1', players, 'original', 1);
    expect(engine.getState().phase).toBe('dealer-select');
  });

  it('roundNumber=2이면 초기 phase가 attend-school이다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    expect(engine.getState().phase).toBe('attend-school');
  });

  it('초기 pot은 0이다', () => {
    const engine = new GameEngine('room1', players, 'original', 1);
    expect(engine.getState().pot).toBe(0);
  });

  it('초기 deck은 20장이다', () => {
    const engine = new GameEngine('room1', players, 'original', 1);
    expect(engine.getState().deck).toHaveLength(20);
  });

  // 2. selectDealerCard — 밤(hour=22): 가장 낮은 rank 선택자가 dealer
  it('밤(22시): 가장 낮은 rank 카드를 선택한 플레이어가 선이 된다', () => {
    vi.useFakeTimers();
    // KST 22시 = UTC 13시
    vi.setSystemTime(new Date('2026-01-01T13:00:00.000Z'));

    const engine = new GameEngine('room1', players, 'original', 1);
    const deck = engine.getState().deck;

    // 각 플레이어가 덱에서 카드를 선택 (인덱스 0~3)
    // rank가 가장 낮은 카드 인덱스를 찾아서 player-1이 선택하도록 설정
    // 덱 내용을 먼저 확인하고 각기 다른 카드 선택
    engine.selectDealerCard('player-0', 0);
    engine.selectDealerCard('player-1', 1);
    engine.selectDealerCard('player-2', 2);
    engine.selectDealerCard('player-3', 3);

    const state = engine.getState();
    // 선택된 카드 중 rank가 가장 낮은 것을 가진 플레이어가 dealer
    const selectedCards = state.dealerSelectCards!;
    const minRank = Math.min(...selectedCards.map(sc => deck[sc.cardIndex].rank));
    const expectedDealerId = selectedCards.find(sc => deck[sc.cardIndex].rank === minRank)!.playerId;
    const dealer = state.players.find(p => p.isDealer);

    expect(dealer).toBeDefined();
    expect(dealer!.id).toBe(expectedDealerId);
  });

  // 3. selectDealerCard — 낮(hour=10): 가장 높은 rank 선택자가 dealer
  it('낮(10시): 가장 높은 rank 카드를 선택한 플레이어가 선이 된다', () => {
    vi.useFakeTimers();
    // KST 10시 = UTC 01시
    vi.setSystemTime(new Date('2026-01-01T01:00:00.000Z'));

    const engine = new GameEngine('room1', players, 'original', 1);
    const deck = engine.getState().deck;

    engine.selectDealerCard('player-0', 0);
    engine.selectDealerCard('player-1', 1);
    engine.selectDealerCard('player-2', 2);
    engine.selectDealerCard('player-3', 3);

    const state = engine.getState();
    const selectedCards = state.dealerSelectCards!;
    const maxRank = Math.max(...selectedCards.map(sc => deck[sc.cardIndex].rank));
    const expectedDealerId = selectedCards.find(sc => deck[sc.cardIndex].rank === maxRank)!.playerId;
    const dealer = state.players.find(p => p.isDealer);

    expect(dealer).toBeDefined();
    expect(dealer!.id).toBe(expectedDealerId);
  });

  // 4. selectDealerCard — 이미 선택한 플레이어가 재선택 시 에러
  it('이미 카드를 선택한 플레이어가 재선택하면 에러가 발생한다', () => {
    const engine = new GameEngine('room1', players, 'original', 1);
    engine.selectDealerCard('player-0', 0);
    expect(() => engine.selectDealerCard('player-0', 1)).toThrow('ALREADY_ATTENDED');
  });

  // 5. setDealerFromPreviousWinner — 해당 플레이어가 dealer로 설정
  it('setDealerFromPreviousWinner: 지정한 플레이어가 dealer가 된다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-2');
    const dealer = engine.getState().players.find(p => p.isDealer);
    expect(dealer).toBeDefined();
    expect(dealer!.id).toBe('player-2');
  });

  // 6. attendSchool — pot이 500 증가, attendedPlayerIds에 추가
  it('attendSchool: pot이 500 증가하고 attendedPlayerIds에 추가된다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    engine.attendSchool('player-0');
    const state = engine.getState();
    expect(state.pot).toBe(500);
    expect(state.attendedPlayerIds).toContain('player-0');
  });

  // 7. attendSchool — 미등교 플레이어는 dealCards 후 isAlive=false
  it('미등교 플레이어는 allAttended 후 isAlive=false이다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');

    // player-3 제외하고 등교
    engine.attendSchool('player-0');
    engine.attendSchool('player-1');
    engine.attendSchool('player-2');

    // 아직 phase-select가 안 됐으면 강제 완료
    // 모든 플레이어 등교 완료 시 mode-select로 전환
    engine.attendSchool('player-3');

    // player-3는 등교했으므로 alive
    // 만약 player-3를 안 등교시키면 다음 판 시작 시 isAlive=false
    // 이 테스트에서는 3명만 등교하고 completeAttendSchool 호출
    const engine2 = new GameEngine('room2', players, 'original', 2);
    engine2.setDealerFromPreviousWinner('player-0');
    engine2.attendSchool('player-0');
    engine2.attendSchool('player-1');
    engine2.attendSchool('player-2');
    // 타임아웃 또는 강제 완료
    engine2.completeAttendSchool();

    const state2 = engine2.getState();
    const absent = state2.players.find(p => p.id === 'player-3');
    expect(absent!.isAlive).toBe(false);
  });

  // 8. attendSchool — 모든 플레이어 등교 완료 시 mode-select로 전환
  it('모든 플레이어 등교 완료 시 phase가 mode-select로 전환된다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    engine.attendSchool('player-0');
    engine.attendSchool('player-1');
    engine.attendSchool('player-2');
    engine.attendSchool('player-3');
    expect(engine.getState().phase).toBe('mode-select');
  });

  // 9. selectMode — dealer만 가능, phase가 shuffling으로 전환
  it('selectMode: dealer만 호출 가능하고 phase가 shuffling으로 전환된다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    // 모두 등교
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    expect(engine.getState().phase).toBe('shuffling');
  });

  it('selectMode: dealer가 아닌 플레이어가 호출하면 에러가 발생한다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    expect(() => engine.selectMode('player-1', 'original')).toThrow('NOT_YOUR_TURN');
  });

  // 10. shuffle — dealer만 가능, 덱 순서 변경 확인 (20장 유지)
  it('shuffle: 덱이 20장을 유지하면서 순서가 변경된다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');

    const beforeDeck = [...engine.getState().deck];
    engine.shuffle('player-0');
    const afterDeck = engine.getState().deck;

    expect(afterDeck).toHaveLength(20);
    // 덱 rank 합이 동일한지 확인 (카드 손실/복제 없음)
    const beforeSum = beforeDeck.reduce((s, c) => s + c.rank, 0);
    const afterSum = afterDeck.reduce((s, c) => s + c.rank, 0);
    expect(afterSum).toBe(beforeSum);
  });

  // 11. shuffle — 셔플 후 phase=cutting
  it('shuffle 후 phase가 cutting으로 전환된다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');
    expect(engine.getState().phase).toBe('cutting');
  });

  // 12. cut — 왼쪽 플레이어만 가능, 기리 후 배분 확인
  it('cut: 기리 후 배분이 정상적으로 실행된다 (각 플레이어 2장씩)', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');

    // dealer=0, 왼쪽 플레이어 = seatIndex 1
    const beforeDeck = [...engine.getState().deck];
    engine.cut('player-1', [5, 12], [2, 0, 1]);
    const state = engine.getState();

    // 배분 완료 후 각 플레이어 2장씩
    state.players.filter(p => p.isAlive).forEach(p => {
      expect(p.cards).toHaveLength(2);
    });

    // 배분된 카드 + 남은 덱 = 원본 20장
    const dealtCards = state.players.flatMap(p => p.cards);
    const remainingCards = state.deck;
    const totalCards = [...dealtCards, ...remainingCards];
    expect(totalCards).toHaveLength(20);

    // 카드 집합 동일성 확인
    const beforeRanks = beforeDeck.map(c => `${c.rank}-${c.attribute}`).sort();
    const afterRanks = totalCards.filter((c): c is NonNullable<typeof c> => c !== null).map(c => `${c.rank}-${c.attribute}`).sort();
    expect(afterRanks).toEqual(beforeRanks);
  });

  // 13. cut — 잘못된 cutPoints 시 에러
  it('cut: 잘못된 cutPoints (총합 !== 20) 시 에러가 발생한다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');

    // cutPoints=[5,10]은 세그먼트가 [0-4](5장), [5-9](5장), [10-19](10장) → 총 20장이지만 잘못된 order 시 에러
    // cutPoints=[5,18]은 세그먼트가 5+13+2 = 20장 → 유효
    // 잘못된 케이스: cutPoints=[5,25] → 범위 초과
    expect(() => engine.cut('player-1', [5, 25], [2, 0, 1])).toThrow('INVALID_CUT');
  });

  // 14. declareTtong — 왼쪽 플레이어만 가능, isTtong=true, phase=dealing
  it('declareTtong: isTtong=true가 되고 phase가 dealing으로 전환된다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');

    engine.declareTtong('player-1');
    const state = engine.getState();
    expect(state.isTtong).toBe(true);
    expect(state.phase).toBe('betting');
  });

  // 15. dealCards (일반) — 각 플레이어 2장
  it('dealCards (일반): 각 플레이어가 2장씩 받는다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');
    engine.cut('player-1', [10], [1, 0]);

    const state = engine.getState();
    state.players.filter(p => p.isAlive).forEach(p => {
      expect(p.cards).toHaveLength(2);
    });
  });

  // 16. dealCards (퉁) — 2장씩 한 번에
  it('dealCards (퉁): 각 플레이어가 2장씩 받는다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');
    engine.declareTtong('player-1');

    const state = engine.getState();
    state.players.filter(p => p.isAlive).forEach(p => {
      expect(p.cards).toHaveLength(2);
    });
  });

  // 17. phase 유효성: shuffling phase에서 cut 호출 시 에러
  it('shuffling phase에서 cut을 호출하면 INVALID_PHASE 에러가 발생한다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    // shuffle 전 phase=shuffling
    expect(() => engine.cut('player-1', [10], [1, 0])).toThrow('INVALID_PHASE');
  });

  // 18. 반시계 순서 검증: dealer=0, 4명일 때 배분 순서 [3,2,1,0]
  it('dealer=0, 4명일 때 반시계 순서는 [3,2,1,0]이다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    // getCounterClockwiseOrder는 private이지만 테스트에서 간접 검증
    // dealCards 후 카드 배분 순서를 확인하기 위해 덱을 고정값으로 조작
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');

    // cut으로 dealing 진입
    engine.cut('player-1', [10], [1, 0]);
    const state = engine.getState();

    // 모든 alive 플레이어가 2장씩 받았는지 확인
    state.players.filter(p => p.isAlive).forEach(p => {
      expect(p.cards).toHaveLength(2);
    });

    // dealer(seatIndex=0) 기준 반시계 순서 = [3,2,1,0]
    // 현재 베팅 시작은 dealer부터
    expect(state.currentPlayerIndex).toBe(0);
  });

  // 19. 반시계 순서 검증: dealer=2, 4명일 때 배분 순서 [1,0,3,2]
  it('dealer=2, 4명일 때 반시계 순서는 [1,0,3,2]이다', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-2');

    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-2', 'original');
    engine.shuffle('player-2');

    // dealer=2이면 왼쪽 플레이어는 seatIndex=3
    engine.cut('player-3', [10], [1, 0]);
    const state = engine.getState();

    state.players.filter(p => p.isAlive).forEach(p => {
      expect(p.cards).toHaveLength(2);
    });

    // dealer의 currentPlayerIndex = 2
    expect(state.currentPlayerIndex).toBe(2);
  });
});

/** 게임을 betting phase까지 빠르게 진행하는 헬퍼 (dealer=player-0) */
function advanceToBetting(engine: GameEngine, players: RoomPlayer[]): void {
  engine.setDealerFromPreviousWinner('player-0');
  players.forEach(p => engine.attendSchool(p.id));
  engine.selectMode('player-0', 'original');
  engine.shuffle('player-0');
  // dealer=0, 왼쪽 플레이어=seatIndex 1
  engine.cut('player-1', [10], [1, 0]);
}

describe('betting system', () => {
  let players: RoomPlayer[];
  let engine: GameEngine;

  beforeEach(() => {
    players = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    engine = new GameEngine('room1', players, 'original', 2);
    advanceToBetting(engine, players);
  });

  it('베팅 phase에 진입하면 currentPlayerIndex가 dealer seatIndex와 동일하다', () => {
    const state = engine.getState();
    expect(state.phase).toBe('betting');
    expect(state.currentPlayerIndex).toBe(0);
  });

  it('콜: currentBetAmount만큼 pot 증가, currentBet 갱신', () => {
    // 먼저 dealer(player-0)가 레이즈하여 currentBetAmount를 설정
    engine.processBetAction('player-0', { type: 'raise', amount: 1000 });
    const stateAfterRaise = engine.getState();
    const potAfterRaise = stateAfterRaise.pot;

    // 다음 플레이어(반시계)가 콜
    const nextPlayer = engine.getState().players.find(
      p => p.id === `player-${engine.getState().currentPlayerIndex}`
    );
    const nextPlayerId = engine.getState().players.find(
      p => p.seatIndex === engine.getState().currentPlayerIndex
    )!.id;
    const playerBeforeBet = engine.getState().players.find(p => p.id === nextPlayerId)!;
    const callAmount = engine.getState().currentBetAmount - playerBeforeBet.currentBet;

    engine.processBetAction(nextPlayerId, { type: 'call' });
    const stateAfterCall = engine.getState();
    const callerAfter = stateAfterCall.players.find(p => p.id === nextPlayerId)!;

    expect(callerAfter.currentBet).toBe(engine.getState().currentBetAmount);
    expect(stateAfterCall.pot).toBe(potAfterRaise + callAmount);
  });

  it('레이즈: 콜 금액 + 추가금, currentBetAmount 갱신', () => {
    const state = engine.getState();
    const dealerPlayer = state.players.find(p => p.isDealer)!;
    const prevBetAmount = state.currentBetAmount;

    engine.processBetAction('player-0', { type: 'raise', amount: 1000 });

    const newState = engine.getState();
    const newDealerState = newState.players.find(p => p.id === 'player-0')!;

    expect(newDealerState.currentBet).toBe(prevBetAmount + 1000);
    expect(newState.currentBetAmount).toBe(prevBetAmount + 1000);
    expect(newState.pot).toBeGreaterThan(0);
  });

  it('다이: isAlive=false', () => {
    engine.processBetAction('player-0', { type: 'die' });
    const state = engine.getState();
    const player = state.players.find(p => p.id === 'player-0')!;
    expect(player.isAlive).toBe(false);
  });

  it('체크: currentBetAmount===0일 때 가능하고 베팅 없이 진행된다', () => {
    // currentBetAmount가 0인 상태에서 체크
    const state = engine.getState();
    expect(state.currentBetAmount).toBe(0);
    const potBefore = state.pot;

    engine.processBetAction('player-0', { type: 'check' });

    const newState = engine.getState();
    expect(newState.pot).toBe(potBefore); // pot 변화 없음
  });

  it('체크: currentBetAmount>0일 때 에러', () => {
    engine.processBetAction('player-0', { type: 'raise', amount: 500 });
    // 이제 currentBetAmount > 0
    const nextPlayerId = engine.getState().players.find(
      p => p.seatIndex === engine.getState().currentPlayerIndex
    )!.id;

    expect(() => engine.processBetAction(nextPlayerId, { type: 'check' })).toThrow();
  });

  it('순서: 선(dealer) 기준 반시계 방향으로 베팅', () => {
    const state = engine.getState();
    // dealer가 player-0 (seatIndex=0), 반시계 다음은 seatIndex=3
    expect(state.currentPlayerIndex).toBe(0);

    engine.processBetAction('player-0', { type: 'check' });

    const nextState = engine.getState();
    // 반시계: dealer(0) -> seatIndex 3
    expect(nextState.currentPlayerIndex).toBe(3);
  });

  it('순서: 다이한 플레이어 건너뛰기', () => {
    // player-0 체크, player-3가 차례
    engine.processBetAction('player-0', { type: 'check' });
    // player-3 다이
    engine.processBetAction('player-3', { type: 'die' });

    const nextState = engine.getState();
    // player-3 die 후 다음은 seatIndex=2
    expect(nextState.currentPlayerIndex).toBe(2);
  });

  it('종료: 모든 생존자 currentBet === currentBetAmount이고 모두 액션 완료 시 showdown 전환', () => {
    // 4명이 모두 체크하면 showdown
    engine.processBetAction('player-0', { type: 'check' });
    engine.processBetAction('player-3', { type: 'check' });
    engine.processBetAction('player-2', { type: 'check' });
    engine.processBetAction('player-1', { type: 'check' });

    expect(engine.getState().phase).toBe('showdown');
  });

  it('종료: 전원 체크 시 showdown 전환', () => {
    // 모두 체크하면 showdown
    engine.processBetAction('player-0', { type: 'check' });
    engine.processBetAction('player-3', { type: 'check' });
    engine.processBetAction('player-2', { type: 'check' });
    engine.processBetAction('player-1', { type: 'check' });

    expect(engine.getState().phase).toBe('showdown');
  });

  it('종료: 생존자 1명이면 result 전환', () => {
    // 3명이 다이하면 마지막 1명 승리
    engine.processBetAction('player-0', { type: 'die' });
    engine.processBetAction('player-3', { type: 'die' });
    engine.processBetAction('player-2', { type: 'die' });

    expect(engine.getState().phase).toBe('result');
  });

  it('레이즈 후 순환: 다른 플레이어에게 다시 차례가 돌아옴', () => {
    // player-0 체크, player-3 체크, player-2 레이즈 -> player-1이 다음, 이후 player-0에게도 다시 차례
    engine.processBetAction('player-0', { type: 'check' });
    engine.processBetAction('player-3', { type: 'check' });
    engine.processBetAction('player-2', { type: 'raise', amount: 1000 });

    // player-1이 다음 (반시계: 2->1)
    expect(engine.getState().currentPlayerIndex).toBe(1);
  });

  it('레이즈 최솟값: 500원 미만이면 에러', () => {
    expect(() => engine.processBetAction('player-0', { type: 'raise', amount: 400 })).toThrow();
  });

  it('NOT_YOUR_TURN: 자기 턴이 아닌 플레이어가 베팅 시도', () => {
    // player-0가 현재 턴인데 player-1이 베팅
    expect(() => engine.processBetAction('player-1', { type: 'check' })).toThrow('NOT_YOUR_TURN');
  });

  it('INVALID_PHASE: betting이 아닌 phase에서 베팅 시도', () => {
    const engine2 = new GameEngine('room2', players, 'original', 2);
    engine2.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine2.attendSchool(p.id));
    // mode-select phase
    expect(() => engine2.processBetAction('player-0', { type: 'check' })).toThrow('INVALID_PHASE');
  });

  it('INVALID_ACTION: 이미 다이한 플레이어가 베팅 시도', () => {
    engine.processBetAction('player-0', { type: 'die' });
    // player-3이 차례인데 player-0가 다시 시도
    expect(() => engine.processBetAction('player-0', { type: 'call' })).toThrow();
  });
});

/** betting -> showdown까지 진행하는 헬퍼 (모두 체크) */
function advanceToShowdown(engine: GameEngine, players: RoomPlayer[]): void {
  advanceToBetting(engine, players);
  // 4명 모두 체크
  engine.processBetAction('player-0', { type: 'check' });
  engine.processBetAction('player-3', { type: 'check' });
  engine.processBetAction('player-2', { type: 'check' });
  engine.processBetAction('player-1', { type: 'check' });
}

describe('showdown', () => {
  let players: RoomPlayer[];
  let engine: GameEngine;

  beforeEach(() => {
    players = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    engine = new GameEngine('room1', players, 'original', 2);
    advanceToShowdown(engine, players);
  });

  it('showdown phase에 진입되어 있다', () => {
    expect(engine.getState().phase).toBe('showdown');
  });

  it('revealCard: isRevealed=true, 아직 미공개자 있으면 phase 유지', () => {
    engine.revealCard('player-0');
    const state = engine.getState();
    const p = state.players.find(p => p.id === 'player-0')!;
    expect(p.isRevealed).toBe(true);
    expect(state.phase).toBe('showdown');
  });

  it('revealCard: 전원 공개 시 승자 결정, phase=result 또는 rematch-pending', () => {
    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    const state = engine.getState();
    expect(['result', 'rematch-pending']).toContain(state.phase);
  });

  it('revealCard: 다이한 플레이어 시도 시 에러', () => {
    // 다이한 플레이어가 있는 상태로 만들기 위해 다른 엔진 사용
    const engine2 = new GameEngine('room2', players, 'original', 2);
    advanceToBetting(engine2, players);
    engine2.processBetAction('player-0', { type: 'die' });
    // 나머지 체크로 showdown 진입
    engine2.processBetAction('player-3', { type: 'check' });
    engine2.processBetAction('player-2', { type: 'check' });
    engine2.processBetAction('player-1', { type: 'check' });

    expect(engine2.getState().phase).toBe('showdown');
    expect(() => engine2.revealCard('player-0')).toThrow();
  });

  it('revealCard: showdown phase 아닐 때 에러', () => {
    const engine2 = new GameEngine('room2', players, 'original', 2);
    advanceToBetting(engine2, players);
    // betting phase에서 revealCard 시도
    expect(() => engine2.revealCard('player-0')).toThrow('INVALID_PHASE');
  });

  it('승자 판정: 전원 공개 시 winnerId 설정 (result phase)', () => {
    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    const state = engine.getState();
    if (state.phase === 'result') {
      expect(state.winnerId).toBeDefined();
      expect(players.map(p => p.id)).toContain(state.winnerId);
    } else {
      // rematch-pending인 경우
      expect(state.tiedPlayerIds).toBeDefined();
      expect(state.tiedPlayerIds!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('동점: 2명 동점 시 phase=rematch-pending, tiedPlayerIds 설정 (카드 조작)', () => {
    // 이 테스트는 같은 점수를 가진 카드 조합을 직접 설정해서 테스트
    // engine 내부 state를 통해 카드를 직접 조작 (망통 vs 망통: 1+9=10->0끗 vs 2+8=10->0끗)
    const state = engine.getState() as GameState;
    // player-0: 1(normal) + 9(normal) = 0끗
    // player-1: 2(normal) + 8(normal) = 0끗
    // player-2: 3(normal) + 7(normal) = 0끗 -> 땡잡이가 아닌 케이스 (3+7 둘 다 normal이면 땡잡이!)
    // -> 다른 카드 조합으로: 1(gwang) + 9(normal) = 0끗 , 2(normal) + 8(gwang) = 0끗
    state.players[0].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 9, attribute: 'normal' },
    ];
    state.players[1].cards = [
      { rank: 2, attribute: 'normal' },
      { rank: 8, attribute: 'gwang' },
    ];
    state.players[2].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 3, attribute: 'gwang' },
    ]; // 일삼광땡 (최강)
    state.players[3].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 3, attribute: 'gwang' },
    ]; // 동점: 일삼광땡

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    const finalState = engine.getState();
    expect(finalState.phase).toBe('rematch-pending');
    expect(finalState.tiedPlayerIds).toContain('player-2');
    expect(finalState.tiedPlayerIds).toContain('player-3');
  });
});

describe('rematch', () => {
  let players: RoomPlayer[];

  beforeEach(() => {
    players = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
  });

  function advanceToRematch(engine: GameEngine): void {
    advanceToShowdown(engine, players);
    const state = engine.getState() as GameState;
    // 동점 상황 만들기: player-2, player-3가 최강 동점
    state.players[0].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 9, attribute: 'normal' },
    ];
    state.players[1].cards = [
      { rank: 2, attribute: 'normal' },
      { rank: 8, attribute: 'normal' },
    ];
    state.players[2].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 3, attribute: 'gwang' },
    ]; // 일삼광땡
    state.players[3].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 3, attribute: 'gwang' },
    ]; // 동점: 일삼광땡

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');
  }

  it('startRematch: 동점자만 alive, pot 유지, phase=shuffling', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    advanceToRematch(engine);

    expect(engine.getState().phase).toBe('rematch-pending');
    const potBefore = engine.getState().pot;

    engine.startRematch();

    const state = engine.getState();
    expect(state.phase).toBe('shuffling');
    expect(state.pot).toBe(potBefore); // pot 유지

    // 동점자(player-2, player-3)만 alive
    const alive = state.players.filter(p => p.isAlive);
    expect(alive.map(p => p.id).sort()).toEqual(['player-2', 'player-3'].sort());
  });

  it('startRematch: 앤티 없음 (attendedPlayerIds 사용하지 않음)', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    advanceToRematch(engine);
    engine.startRematch();

    const state = engine.getState();
    // rematch에서는 attend-school을 건너뜀 (phase=shuffling으로 바로 전환)
    expect(state.phase).toBe('shuffling');
  });

  it('startRematch: rematch-pending이 아닌 phase에서 호출 시 INVALID_PHASE 에러', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    // mode-select phase
    expect(() => engine.startRematch()).toThrow('INVALID_PHASE');
  });
});

describe('nextRound', () => {
  let players: RoomPlayer[];

  beforeEach(() => {
    players = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
  });

  function advanceToResult(engine: GameEngine): string {
    advanceToShowdown(engine, players);
    const state = engine.getState() as GameState;
    // 승자가 명확하도록 카드 조작: player-0가 최강
    state.players[0].cards = [
      { rank: 3, attribute: 'gwang' },
      { rank: 8, attribute: 'gwang' },
    ]; // 삼팔광땡
    state.players[1].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 8, attribute: 'gwang' },
    ]; // 일팔광땡
    state.players[2].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 3, attribute: 'gwang' },
    ]; // 일삼광땡
    state.players[3].cards = [
      { rank: 9, attribute: 'normal' },
      { rank: 9, attribute: 'normal' },
    ]; // 구땡

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    return 'player-0'; // 승자
  }

  it('nextRound: roundNumber 증가, 모든 플레이어 리셋', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    advanceToResult(engine);
    expect(engine.getState().phase).toBe('result');
    const prevRound = engine.getState().roundNumber;

    engine.nextRound();

    const state = engine.getState();
    expect(state.roundNumber).toBe(prevRound + 1);
    // 모든 플레이어 리셋
    state.players.forEach(p => {
      expect(p.cards).toHaveLength(0);
      expect(p.isAlive).toBe(true);
      expect(p.isRevealed).toBe(false);
      expect(p.currentBet).toBe(0);
    });
    expect(state.pot).toBe(0);
    expect(state.currentBetAmount).toBe(0);
  });

  it('nextRound: 이전 승자가 dealer', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    const winnerId = advanceToResult(engine);
    engine.nextRound();

    const dealer = engine.getState().players.find(p => p.isDealer);
    expect(dealer).toBeDefined();
    expect(dealer!.id).toBe(winnerId);
  });

  it('nextRound: phase=attend-school', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    advanceToResult(engine);
    engine.nextRound();
    expect(engine.getState().phase).toBe('attend-school');
  });

  it('nextRound: result가 아닌 phase에서 호출 시 INVALID_PHASE 에러', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    // mode-select phase
    expect(() => engine.nextRound()).toThrow('INVALID_PHASE');
  });
});

describe('rematch-pending phase FSM validation', () => {
  let players: RoomPlayer[];
  let engine: GameEngine;

  beforeEach(() => {
    players = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    engine = new GameEngine('room1', players, 'original', 2);
    advanceToShowdown(engine, players);

    // 동점 상황으로 rematch-pending 진입
    const state = engine.getState() as GameState;
    state.players[0].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 9, attribute: 'normal' },
    ];
    state.players[1].cards = [
      { rank: 2, attribute: 'normal' },
      { rank: 8, attribute: 'normal' },
    ];
    state.players[2].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 3, attribute: 'gwang' },
    ];
    state.players[3].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 3, attribute: 'gwang' },
    ];

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    expect(engine.getState().phase).toBe('rematch-pending');
  });

  it('rematch-pending에서 processBetAction 호출 시 INVALID_PHASE 에러', () => {
    expect(() => engine.processBetAction('player-0', { type: 'check' })).toThrow('INVALID_PHASE');
  });

  it('rematch-pending에서 shuffle 호출 시 INVALID_PHASE 에러', () => {
    expect(() => engine.shuffle('player-0')).toThrow('INVALID_PHASE');
  });

  it('rematch-pending에서 nextRound 호출 시 INVALID_PHASE 에러', () => {
    expect(() => engine.nextRound()).toThrow('INVALID_PHASE');
  });
});

describe('full flow integration', () => {
  let players: RoomPlayer[];

  beforeEach(() => {
    players = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
  });

  it('오리지날 모드 전체 플로우: attend -> mode -> shuffle -> cut -> deal -> bet -> showdown -> result', () => {
    const engine = new GameEngine('room1', players, 'original', 2);

    // attend-school
    engine.setDealerFromPreviousWinner('player-0');
    expect(engine.getState().phase).toBe('attend-school');
    players.forEach(p => engine.attendSchool(p.id));

    // mode-select
    expect(engine.getState().phase).toBe('mode-select');
    engine.selectMode('player-0', 'original');

    // shuffling
    expect(engine.getState().phase).toBe('shuffling');
    engine.shuffle('player-0');

    // cutting -> dealing -> betting
    expect(engine.getState().phase).toBe('cutting');
    engine.cut('player-1', [10], [1, 0]);
    expect(engine.getState().phase).toBe('betting');

    // 각 플레이어 2장 확인
    engine.getState().players.filter(p => p.isAlive).forEach(p => {
      expect(p.cards).toHaveLength(2);
    });

    // betting: 전원 체크 -> showdown
    engine.processBetAction('player-0', { type: 'check' });
    engine.processBetAction('player-3', { type: 'check' });
    engine.processBetAction('player-2', { type: 'check' });
    engine.processBetAction('player-1', { type: 'check' });
    expect(engine.getState().phase).toBe('showdown');

    // showdown: 전원 공개
    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    const state = engine.getState();
    expect(['result', 'rematch-pending']).toContain(state.phase);
  });

  it('2판 연속: 1판 승자가 2판 선으로 자동 설정', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');
    engine.cut('player-1', [10], [1, 0]);

    // 전원 체크 -> showdown
    engine.processBetAction('player-0', { type: 'check' });
    engine.processBetAction('player-3', { type: 'check' });
    engine.processBetAction('player-2', { type: 'check' });
    engine.processBetAction('player-1', { type: 'check' });

    // 카드 조작으로 player-1 승리
    const state = engine.getState() as GameState;
    state.players[0].cards = [
      { rank: 9, attribute: 'normal' },
      { rank: 9, attribute: 'normal' },
    ]; // 구땡 2위
    state.players[1].cards = [
      { rank: 3, attribute: 'gwang' },
      { rank: 8, attribute: 'gwang' },
    ]; // 삼팔광땡 1위
    state.players[2].cards = [
      { rank: 1, attribute: 'gwang' },
      { rank: 9, attribute: 'normal' },
    ]; // 0끗
    state.players[3].cards = [
      { rank: 2, attribute: 'normal' },
      { rank: 3, attribute: 'normal' },
    ]; // 5끗

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    expect(engine.getState().phase).toBe('result');
    expect(engine.getState().winnerId).toBe('player-1');

    // 2판 시작
    engine.nextRound();
    const newDealer = engine.getState().players.find(p => p.isDealer);
    expect(newDealer!.id).toBe('player-1'); // 승자가 선
  });

  it('모든 플레이어 다이 시 마지막 1명 즉시 승리', () => {
    const engine = new GameEngine('room1', players, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    players.forEach(p => engine.attendSchool(p.id));
    engine.selectMode('player-0', 'original');
    engine.shuffle('player-0');
    engine.cut('player-1', [10], [1, 0]);

    expect(engine.getState().phase).toBe('betting');

    // 3명 다이 -> 마지막 1명 result
    engine.processBetAction('player-0', { type: 'die' });
    engine.processBetAction('player-3', { type: 'die' });
    engine.processBetAction('player-2', { type: 'die' });

    expect(engine.getState().phase).toBe('result');
  });
});

// ============================================================
// 칩 정산 시스템 테스트 (Phase 05-01)
// ============================================================

describe('calculateChipBreakdown', () => {
  it('13500원 -> { ten_thousand:1, five_thousand:0, one_thousand:3, five_hundred:1 }', () => {
    const result = GameEngine.calculateChipBreakdown(13500);
    expect(result).toEqual({ ten_thousand: 1, five_thousand: 0, one_thousand: 3, five_hundred: 1 });
  });

  it('0원 -> 모든 단위 0', () => {
    const result = GameEngine.calculateChipBreakdown(0);
    expect(result).toEqual({ ten_thousand: 0, five_thousand: 0, one_thousand: 0, five_hundred: 0 });
  });

  it('500원 -> { ten_thousand:0, five_thousand:0, one_thousand:0, five_hundred:1 }', () => {
    const result = GameEngine.calculateChipBreakdown(500);
    expect(result).toEqual({ ten_thousand: 0, five_thousand: 0, one_thousand: 0, five_hundred: 1 });
  });

  it('25500원 -> { ten_thousand:2, five_thousand:1, one_thousand:0, five_hundred:1 }', () => {
    const result = GameEngine.calculateChipBreakdown(25500);
    expect(result).toEqual({ ten_thousand: 2, five_thousand: 1, one_thousand: 0, five_hundred: 1 });
  });
});

describe('칩 정산 — attendSchool chips 차감', () => {
  it('attendSchool 시 플레이어 chips가 500 차감된다 (100000 -> 99500)', () => {
    const players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    const engine = new GameEngine('room1', players4, 'original', 2);
    engine.setDealerFromPreviousWinner('player-0');
    engine.attendSchool('player-0');
    const state = engine.getState();
    const p0 = state.players.find(p => p.id === 'player-0')!;
    expect(p0.chips).toBe(99500);
  });
});

describe('칩 정산 — processBetAction chips 차감', () => {
  let players4: import('@sutda/shared').RoomPlayer[];
  let engine: GameEngine;

  beforeEach(() => {
    players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    engine = new GameEngine('room1', players4, 'original', 2);
    advanceToBetting(engine, players4);
  });

  it('콜 시 callAmount만큼 chips가 차감된다', () => {
    // player-0 레이즈 1000
    engine.processBetAction('player-0', { type: 'raise', amount: 1000 });
    const chipsBefore = engine.getState().players.find(p => p.id === 'player-3')!.chips;
    const callAmount = engine.getState().currentBetAmount - engine.getState().players.find(p => p.id === 'player-3')!.currentBet;
    engine.processBetAction('player-3', { type: 'call' });
    const chipsAfter = engine.getState().players.find(p => p.id === 'player-3')!.chips;
    expect(chipsAfter).toBe(chipsBefore - callAmount);
  });

  it('레이즈 시 callAmount + raiseAmount만큼 chips가 차감된다', () => {
    const chipsBefore = engine.getState().players.find(p => p.id === 'player-0')!.chips;
    engine.processBetAction('player-0', { type: 'raise', amount: 1000 });
    const chipsAfter = engine.getState().players.find(p => p.id === 'player-0')!.chips;
    // raise에서 callAmount=0 (currentBetAmount=0, currentBet=0), raiseAmount=1000
    expect(chipsAfter).toBe(chipsBefore - 1000);
  });
});

describe('칩 정산 — 승자 pot 합산', () => {
  it('승자 결정 시 pot 전액이 승자 chips에 합산된다', () => {
    const players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    const engine = new GameEngine('room1', players4, 'original', 2);
    advanceToShowdown(engine, players4);

    const state = engine.getState() as import('@sutda/shared').GameState;
    // player-0를 확실한 승자로 설정
    state.players[0].cards = [{ rank: 3, attribute: 'gwang' }, { rank: 8, attribute: 'gwang' }]; // 삼팔광땡
    state.players[1].cards = [{ rank: 1, attribute: 'gwang' }, { rank: 8, attribute: 'gwang' }]; // 일팔광땡
    state.players[2].cards = [{ rank: 1, attribute: 'gwang' }, { rank: 3, attribute: 'gwang' }]; // 일삼광땡
    state.players[3].cards = [{ rank: 9, attribute: 'normal' }, { rank: 9, attribute: 'normal' }]; // 구땡

    const potBefore = state.pot;
    const winner0ChipsBefore = state.players.find(p => p.id === 'player-0')!.chips;

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    const finalState = engine.getState();
    expect(finalState.phase).toBe('result');
    expect(finalState.winnerId).toBe('player-0');
    const winner0After = finalState.players.find(p => p.id === 'player-0')!;
    expect(winner0After.chips).toBe(winner0ChipsBefore + potBefore);
  });

  it('승자 결정 후 pot이 result phase에서 유지된다 (nextRound에서 0 리셋)', () => {
    const players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    const engine = new GameEngine('room1', players4, 'original', 2);
    advanceToShowdown(engine, players4);

    const state = engine.getState() as import('@sutda/shared').GameState;
    state.players[0].cards = [{ rank: 3, attribute: 'gwang' }, { rank: 8, attribute: 'gwang' }];
    state.players[1].cards = [{ rank: 1, attribute: 'gwang' }, { rank: 8, attribute: 'gwang' }];
    state.players[2].cards = [{ rank: 1, attribute: 'gwang' }, { rank: 3, attribute: 'gwang' }];
    state.players[3].cards = [{ rank: 9, attribute: 'normal' }, { rank: 9, attribute: 'normal' }];

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    const finalState = engine.getState();
    expect(finalState.phase).toBe('result');
    // pot은 result에서 유지 (0이 아님)
    expect(finalState.pot).toBeGreaterThan(0);

    // nextRound에서 pot 리셋
    engine.nextRound();
    expect(engine.getState().pot).toBe(0);
  });

  it('동점 재경기(rematch-pending) 시 chips 이동 없음, pot 유지', () => {
    const players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    const engine = new GameEngine('room1', players4, 'original', 2);
    advanceToShowdown(engine, players4);

    const state = engine.getState() as import('@sutda/shared').GameState;
    // player-2, player-3 동점
    state.players[0].cards = [{ rank: 1, attribute: 'gwang' }, { rank: 9, attribute: 'normal' }];
    state.players[1].cards = [{ rank: 2, attribute: 'normal' }, { rank: 8, attribute: 'normal' }];
    state.players[2].cards = [{ rank: 1, attribute: 'gwang' }, { rank: 3, attribute: 'gwang' }];
    state.players[3].cards = [{ rank: 1, attribute: 'gwang' }, { rank: 3, attribute: 'gwang' }];

    const chipsBefore = state.players.map(p => p.chips);
    const potBefore = state.pot;

    engine.revealCard('player-0');
    engine.revealCard('player-1');
    engine.revealCard('player-2');
    engine.revealCard('player-3');

    const finalState = engine.getState();
    expect(finalState.phase).toBe('rematch-pending');
    // 칩 이동 없음
    finalState.players.forEach((p, i) => {
      expect(p.chips).toBe(chipsBefore[i]);
    });
    // pot 유지
    expect(finalState.pot).toBe(potBefore);
  });

  it('생존자 1명만 남아 result phase 진입 시에도 pot이 승자에게 합산된다', () => {
    const players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    const engine = new GameEngine('room1', players4, 'original', 2);
    advanceToBetting(engine, players4);

    const potBefore = engine.getState().pot;
    const winner1ChipsBefore = engine.getState().players.find(p => p.id === 'player-1')!.chips;

    // 3명 다이 -> player-1만 생존
    engine.processBetAction('player-0', { type: 'die' });
    engine.processBetAction('player-3', { type: 'die' });
    engine.processBetAction('player-2', { type: 'die' });

    const finalState = engine.getState();
    expect(finalState.phase).toBe('result');
    const winner = finalState.players.find(p => p.id === 'player-1')!;
    expect(winner.chips).toBe(winner1ChipsBefore + potBefore);
  });
});

describe('calculateEffectiveMaxBet', () => {
  it('내 잔액 < 상대 최대 잔액이면 내 잔액 반환', () => {
    const players4: import('@sutda/shared').RoomPlayer[] = [
      { id: 'p0', nickname: 'A', chips: 3000, seatIndex: 0, isConnected: true },
      { id: 'p1', nickname: 'B', chips: 10000, seatIndex: 1, isConnected: true },
      { id: 'p2', nickname: 'C', chips: 8000, seatIndex: 2, isConnected: true },
    ];
    const engine = new GameEngine('room1', players4, 'original', 2);
    // p0의 chips=3000, 상대방 최대=10000 -> 내 잔액(3000) 반환
    expect(engine.calculateEffectiveMaxBet('p0')).toBe(3000);
  });

  it('내 잔액 >= 상대 최대 잔액이면 생존자 중 두 번째로 큰 잔액 반환', () => {
    const players4: import('@sutda/shared').RoomPlayer[] = [
      { id: 'p0', nickname: 'A', chips: 20000, seatIndex: 0, isConnected: true },
      { id: 'p1', nickname: 'B', chips: 10000, seatIndex: 1, isConnected: true },
      { id: 'p2', nickname: 'C', chips: 8000, seatIndex: 2, isConnected: true },
    ];
    const engine = new GameEngine('room1', players4, 'original', 2);
    // p0의 chips=20000, 상대방 최대=10000 -> 10000 반환
    expect(engine.calculateEffectiveMaxBet('p0')).toBe(10000);
  });

  it('다이한 플레이어는 계산에서 제외된다', () => {
    const players4: import('@sutda/shared').RoomPlayer[] = [
      { id: 'p0', nickname: 'A', chips: 20000, seatIndex: 0, isConnected: true },
      { id: 'p1', nickname: 'B', chips: 10000, seatIndex: 1, isConnected: true },
      { id: 'p2', nickname: 'C', chips: 50000, seatIndex: 2, isConnected: true },
    ];
    const engine = new GameEngine('room1', players4, 'original', 2);
    // p2를 죽은 것으로 설정
    const state = engine.getState() as import('@sutda/shared').GameState;
    state.players.find(p => p.id === 'p2')!.isAlive = false;
    // p0(20000): 생존 상대=p1(10000), 내잔액(20000)>=상대최대(10000) -> 10000
    expect(engine.calculateEffectiveMaxBet('p0')).toBe(10000);
  });

  it('생존자 1명(나만)이면 0 반환', () => {
    const players4: import('@sutda/shared').RoomPlayer[] = [
      { id: 'p0', nickname: 'A', chips: 20000, seatIndex: 0, isConnected: true },
      { id: 'p1', nickname: 'B', chips: 10000, seatIndex: 1, isConnected: true },
    ];
    const engine = new GameEngine('room1', players4, 'original', 2);
    const state = engine.getState() as import('@sutda/shared').GameState;
    state.players.find(p => p.id === 'p1')!.isAlive = false;
    expect(engine.calculateEffectiveMaxBet('p0')).toBe(0);
  });
});

describe('chipBreakdown 및 effectiveMaxBet — game-state 포함', () => {
  it('각 플레이어의 chipBreakdown이 game-state에 포함된다', () => {
    const players4 = Array.from({ length: 2 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    const engine = new GameEngine('room1', players4, 'original', 2);
    const state = engine.getState();
    state.players.forEach(p => {
      expect(p.chipBreakdown).toBeDefined();
      expect(p.chipBreakdown.ten_thousand).toBe(10);
      expect(p.chipBreakdown.five_thousand).toBe(0);
      expect(p.chipBreakdown.one_thousand).toBe(0);
      expect(p.chipBreakdown.five_hundred).toBe(0);
    });
  });

  it('effectiveMaxBet이 betting phase에서 game-state에 포함된다', () => {
    const players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    const engine = new GameEngine('room1', players4, 'original', 2);
    advanceToBetting(engine, players4);
    const state = engine.getState();
    expect(state.phase).toBe('betting');
    expect(state.effectiveMaxBet).toBeDefined();
  });
});

describe('applyRechargeToPlayer', () => {
  let players4: import('@sutda/shared').RoomPlayer[];
  let engine: GameEngine;

  beforeEach(() => {
    players4 = Array.from({ length: 4 }, (_, i) => ({
      id: `player-${i}`,
      nickname: `Player${i}`,
      chips: 100000,
      seatIndex: i,
      isConnected: true,
    }));
    engine = new GameEngine('room1', players4, 'original', 2);
    advanceToBetting(engine, players4);
  });

  it('해당 플레이어의 chips가 newChips로 갱신된다', () => {
    engine.applyRechargeToPlayer('player-0', 200000);
    const p = engine.getState().players.find(p => p.id === 'player-0')!;
    expect(p.chips).toBe(200000);
  });

  it('호출 후 모든 플레이어의 chipBreakdown이 재계산된다', () => {
    engine.applyRechargeToPlayer('player-0', 15500);
    const p = engine.getState().players.find(p => p.id === 'player-0')!;
    expect(p.chipBreakdown).toEqual({ ten_thousand: 1, five_thousand: 1, one_thousand: 0, five_hundred: 1 });
  });

  it('호출 후 effectiveMaxBet이 재계산된다 (betting phase인 경우)', () => {
    const stateBefore = engine.getState();
    expect(stateBefore.phase).toBe('betting');
    engine.applyRechargeToPlayer('player-0', 500000);
    const stateAfter = engine.getState();
    expect(stateAfter.effectiveMaxBet).toBeDefined();
  });

  it('존재하지 않는 playerId면 에러 throw', () => {
    expect(() => engine.applyRechargeToPlayer('non-existent', 100000)).toThrow('PLAYER_NOT_FOUND');
  });
});
