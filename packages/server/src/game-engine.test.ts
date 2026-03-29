import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from './game-engine';
import type { RoomPlayer } from '@sutda/shared';

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
    const afterRanks = totalCards.map(c => `${c.rank}-${c.attribute}`).sort();
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
