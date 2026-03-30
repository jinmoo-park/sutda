/**
 * 한장공유 모드 단위 테스트
 * Phase 전환: mode-select -> shared-card-select -> setSharedCard -> shuffling
 *             -> cutting -> dealing(1장) -> betting -> showdown -> result
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../game-engine.js';

/**
 * 한장공유용 GameEngine 헬퍼
 * roundNumber=2 → dealer-select 건너뜀
 * 두 플레이어 등교 후 mode-select 상태로 만든다.
 */
function createHanjangEngine() {
  const players = [
    { id: 'p1', nickname: '플레이어1', chips: 100000, seatIndex: 0 },
    { id: 'p2', nickname: '플레이어2', chips: 100000, seatIndex: 1 },
  ];
  const engine = new GameEngine('room1', players as any, 'original', 2);
  engine.setDealerFromPreviousWinner('p1');
  engine.attendSchool('p1');
  engine.attendSchool('p2');
  // phase === 'mode-select'
  return engine;
}

describe('한장공유 모드 - GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = createHanjangEngine();
  });

  it('Test 1: selectMode("shared-card") 후 phase === "shared-card-select"', () => {
    engine.selectMode('p1', 'shared-card');
    const state = engine.getState();
    expect(state.phase).toBe('shared-card-select');
  });

  it('Test 2: setSharedCard(dealerPlayerId, cardIndex) 성공 -> state.sharedCard 설정, deck에서 제거', () => {
    engine.selectMode('p1', 'shared-card');
    const deckBefore = [...engine.getState().deck];
    const cardToSelect = deckBefore[5];
    engine.setSharedCard('p1', 5);
    const state = engine.getState() as any;
    expect(state.sharedCard).toEqual(cardToSelect);
    // deck에서 해당 카드 제거 확인
    expect(state.deck.length).toBe(deckBefore.length - 1);
    expect(state.deck).not.toContainEqual(cardToSelect);
  });

  it('Test 3: setSharedCard 후 phase === "shuffling"', () => {
    engine.selectMode('p1', 'shared-card');
    engine.setSharedCard('p1', 0);
    const state = engine.getState();
    expect(state.phase).toBe('shuffling');
  });

  it('Test 4: 비딜러가 setSharedCard 호출 -> NOT_YOUR_TURN 에러', () => {
    engine.selectMode('p1', 'shared-card');
    expect(() => engine.setSharedCard('p2', 0)).toThrow('NOT_YOUR_TURN');
  });

  it('Test 5: 한장공유 딜링 후 각 플레이어 cards.length === 1', () => {
    engine.selectMode('p1', 'shared-card');
    engine.setSharedCard('p1', 0);
    // phase === 'shuffling'
    engine.shuffle('p1');
    // phase === 'cutting'
    engine.cut('p2', [], [0]);
    // dealing 후 phase === 'betting'
    const state = engine.getState();
    expect(state.phase).toBe('betting');
    const alivePlayers = state.players.filter((p: any) => p.isAlive);
    expect(alivePlayers.every((p: any) => p.cards.length === 1)).toBe(true);
  });

  it('Test 6: 한장공유 showdown에서 evaluateHand(cards[0], sharedCard) 기반 승자 결정', () => {
    engine.selectMode('p1', 'shared-card');
    engine.setSharedCard('p1', 0);
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    // phase === 'betting'
    // 두 플레이어 체크/콜
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    const state = engine.getState();
    // result 또는 rematch-pending
    expect(['result', 'rematch-pending']).toContain(state.phase);
    // 승자 또는 동점자 확인
    if (state.phase === 'result') {
      expect(state.winnerId).toBeDefined();
    } else {
      expect(state.tiedPlayerIds).toBeDefined();
      expect((state.tiedPlayerIds as string[]).length).toBeGreaterThan(1);
    }
  });

  it('Test 7: setSharedCard에 유효하지 않은 cardIndex -> INVALID_ACTION 에러', () => {
    engine.selectMode('p1', 'shared-card');
    const deckLength = engine.getState().deck.length;
    expect(() => engine.setSharedCard('p1', -1)).toThrow('INVALID_ACTION');
    expect(() => engine.setSharedCard('p1', deckLength)).toThrow('INVALID_ACTION');
  });
});
