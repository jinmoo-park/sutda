/**
 * 세장섯다 모드 단위 테스트
 * Phase 전환: mode-select -> shuffling -> cutting -> dealing(2장) -> betting-1
 *             -> dealing-extra(3번째) -> card-select -> betting-2 -> showdown -> result
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../game-engine.js';

/**
 * 세장섯다용 GameEngine 헬퍼
 * roundNumber=2 → dealer-select 건너뜀, attend-school에서 시작
 * 두 플레이어에게 앤티 납부 후 mode-select 상태로 만든다.
 */
function createSejangEngine() {
  const players = [
    { id: 'p1', nickname: '플레이어1', chips: 100000, seatIndex: 0 },
    { id: 'p2', nickname: '플레이어2', chips: 100000, seatIndex: 1 },
  ];
  const engine = new GameEngine('room1', players as any, 'original', 2);
  const state = engine.getState() as any;
  // 딜러 설정 (roundNumber=2이므로 attend-school에서 시작)
  // 이전 판 승자로 p1을 딜러 설정
  engine.setDealerFromPreviousWinner('p1');
  // 등교
  engine.attendSchool('p1');
  engine.attendSchool('p2');
  // 이 시점 phase === 'mode-select'
  return engine;
}

describe('세장섯다 모드 - GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = createSejangEngine();
  });

  it('Test 1: selectMode("three-card") 후 state.mode === "three-card"', () => {
    engine.selectMode('p1', 'three-card');
    const state = engine.getState();
    expect(state.mode).toBe('three-card');
  });

  it('Test 2: 세장섯다 딜링 후 phase === "betting-1" (NOT "betting")', () => {
    engine.selectMode('p1', 'three-card');
    // phase는 now 'shuffling'
    engine.shuffle('p1');
    // phase === 'cutting'
    engine.cut('p2', [], [0]);
    // cut 후 _dealCards() 호출 → phase === 'betting-1'
    const state = engine.getState();
    expect(state.phase).toBe('betting-1');
  });

  it('Test 3: betting-1 완료 -> phase === "card-select", 생존자 cards.length === 3', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    // phase === 'betting-1', p1이 선(딜러)
    // 두 플레이어 모두 체크 (currentBetAmount === 0이고 p1이 선)
    const state1 = engine.getState();
    expect(state1.phase).toBe('betting-1');

    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });

    const state2 = engine.getState();
    expect(state2.phase).toBe('card-select');
    // 모든 생존자가 3장을 가져야 함
    const alivePlayers = state2.players.filter((p: any) => p.isAlive);
    expect(alivePlayers.every((p: any) => p.cards.length === 3)).toBe(true);
  });

  it('Test 4: selectCards([0,1]) 성공 -> player.selectedCards.length === 2', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    engine.selectCards('p1', [0, 1]);
    const p1State = engine.getState().players.find((p: any) => p.id === 'p1') as any;
    expect(p1State.selectedCards).toBeDefined();
    expect(p1State.selectedCards.length).toBe(2);
  });

  it('Test 5: 모든 생존자 selectCards 완료 -> phase === "betting-2"', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    engine.selectCards('p1', [0, 1]);
    engine.selectCards('p2', [1, 2]);
    const state = engine.getState();
    expect(state.phase).toBe('betting-2');
  });

  it('Test 6: betting-2 완료 -> showdown, 승자 결정 (selectedCards 기반 evaluateHand)', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    engine.selectCards('p1', [0, 1]);
    engine.selectCards('p2', [1, 2]);
    // phase === 'betting-2', p1이 선
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    const state = engine.getState();
    // betting-2 완료 후 result 또는 rematch-pending
    expect(['result', 'rematch-pending', 'showdown']).toContain(state.phase);
  });

  it('Test 7: betting-1에서 다이한 플레이어는 3번째 카드 미배분 (cards.length === 2)', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    // p1이 선, p2가 다이
    engine.processBetAction('p1', { type: 'raise', amount: 500 });
    engine.processBetAction('p2', { type: 'die' });
    // p2가 다이했으므로 생존자 1명 -> showdown으로 직접 진행 (카드 배분 없음)
    // 다이한 p2는 cards.length === 2
    const p2State = engine.getState().players.find((p: any) => p.id === 'p2') as any;
    expect(p2State.cards.length).toBe(2);
  });

  it('Test 8: selectCards에서 중복 인덱스 거부 (i0 === i1 -> INVALID_ACTION)', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    expect(() => engine.selectCards('p1', [1, 1])).toThrow('INVALID_ACTION');
  });

  it('Test 9: selectCards에서 인덱스 범위 밖 거부 (< 0 or >= 3 -> INVALID_ACTION)', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    expect(() => engine.selectCards('p1', [0, 3])).toThrow('INVALID_ACTION');
    expect(() => engine.selectCards('p1', [-1, 1])).toThrow('INVALID_ACTION');
  });
});
