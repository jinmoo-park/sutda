/**
 * 세장섯다 모드 단위 테스트
 * Phase 전환: mode-select -> shuffling -> cutting -> dealing(2장) -> sejang-open
 *             -> betting-1 -> dealing-extra(3번째) -> betting-2 -> card-select -> showdown -> result
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
  // 딜러 설정 (roundNumber=2이므로 attend-school에서 시작)
  // 이전 판 승자로 p1을 딜러 설정
  engine.setDealerFromPreviousWinner('p1');
  // 등교
  engine.attendSchool('p1');
  engine.attendSchool('p2');
  // 이 시점 phase === 'mode-select'
  return engine;
}

/** sejang-open phase까지 진행하는 헬퍼 */
function advanceToSejangOpen(engine: GameEngine) {
  engine.selectMode('p1', 'three-card');
  engine.shuffle('p1');
  engine.cut('p2', [], [0]);
  // cut 후 _dealCardsSejang() → sejang-open phase
}

/** betting-1 phase까지 진행하는 헬퍼 (sejang-open 통과) */
function advanceToBetting1(engine: GameEngine) {
  advanceToSejangOpen(engine);
  engine.openSejangCard('p1', 0);
  engine.openSejangCard('p2', 0);
  // 전원 선택 완료 → betting-1
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

  it('Test 2: 세장섯다 딜링 후 phase === "sejang-open" (오픈 카드 선택 단계)', () => {
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    // cut 후 _dealCardsSejang() 호출 → phase === 'sejang-open'
    const state = engine.getState();
    expect(state.phase).toBe('sejang-open');
    // 각 플레이어는 2장 보유
    const alivePlayers = state.players.filter((p: any) => p.isAlive);
    expect(alivePlayers.every((p: any) => p.cards.length === 2)).toBe(true);
  });

  it('Test 2b: 전원 openSejangCard 완료 -> phase === "betting-1"', () => {
    advanceToSejangOpen(engine);
    engine.openSejangCard('p1', 0);
    engine.openSejangCard('p2', 1);
    const state = engine.getState();
    expect(state.phase).toBe('betting-1');
  });

  it('Test 3: betting-1 완료 -> phase === "betting-2", 생존자 cards.length === 3 (3번째 카드 배분됨)', () => {
    advanceToBetting1(engine);
    // phase === 'betting-1', p1이 선(딜러)
    const state1 = engine.getState();
    expect(state1.phase).toBe('betting-1');

    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });

    const state2 = engine.getState();
    // betting-1 완료 → 3번째 카드 배분 → betting-2
    expect(state2.phase).toBe('betting-2');
    // betting-2 단계에서 이미 3장 보유 (3번째 카드가 betting-1 완료 시 배분됨)
    const alivePlayers = state2.players.filter((p: any) => p.isAlive);
    expect(alivePlayers.every((p: any) => p.cards.length === 3)).toBe(true);
  });

  it('Test 4: betting-2 완료 -> card-select, 생존자 cards.length === 3', () => {
    advanceToBetting1(engine);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'betting-2'
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select', 3번째 카드 이미 배분됨
    const state = engine.getState();
    expect(state.phase).toBe('card-select');
    const alivePlayers = state.players.filter((p: any) => p.isAlive);
    expect(alivePlayers.every((p: any) => p.cards.length === 3)).toBe(true);
  });

  it('Test 4b: card-select에서 selectCards([0,1]) -> player.selectedCards.length === 2', () => {
    advanceToBetting1(engine);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    engine.selectCards('p1', [0, 1]);
    const p1State = engine.getState().players.find((p: any) => p.id === 'p1') as any;
    expect(p1State.selectedCards).toBeDefined();
    expect(p1State.selectedCards.length).toBe(2);
  });

  it('Test 5: 모든 생존자 selectCards 완료 -> 자동 쇼다운 (result/rematch-pending)', () => {
    advanceToBetting1(engine);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    engine.selectCards('p1', [0, 1]);
    engine.selectCards('p2', [1, 2]);
    const state = engine.getState();
    // card-select 완료 -> 자동 쇼다운 (showdown/result)
    expect(['result', 'rematch-pending', 'gusa-pending', 'gusa-announce']).toContain(state.phase);
  });

  it('Test 6: 전체 흐름 통합 — 세장섯다 sejang-open -> betting-1 -> betting-2 -> card-select -> result', () => {
    advanceToBetting1(engine);
    // betting-1
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // betting-2
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // card-select
    engine.selectCards('p1', [0, 1]);
    engine.selectCards('p2', [1, 2]);
    const state = engine.getState();
    expect(['result', 'rematch-pending', 'gusa-pending', 'gusa-announce']).toContain(state.phase);
  });

  it('Test 7: betting-1에서 다이한 플레이어는 3번째 카드 미배분 (cards.length === 2)', () => {
    advanceToBetting1(engine);
    // p1이 선, p2가 다이
    engine.processBetAction('p1', { type: 'raise', amount: 500 });
    engine.processBetAction('p2', { type: 'die' });
    // p2가 다이했으므로 생존자 1명 -> showdown으로 직접 진행 (카드 배분 없음)
    // 다이한 p2는 cards.length === 2
    const p2State = engine.getState().players.find((p: any) => p.id === 'p2') as any;
    expect(p2State.cards.length).toBe(2);
  });

  it('Test 8: selectCards에서 중복 인덱스 거부 (i0 === i1 -> INVALID_ACTION)', () => {
    advanceToBetting1(engine);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    expect(() => engine.selectCards('p1', [1, 1])).toThrow('INVALID_ACTION');
  });

  it('Test 9: selectCards에서 인덱스 범위 밖 거부 (< 0 or >= 3 -> INVALID_ACTION)', () => {
    advanceToBetting1(engine);
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // phase === 'card-select'
    expect(() => engine.selectCards('p1', [0, 3])).toThrow('INVALID_ACTION');
    expect(() => engine.selectCards('p1', [-1, 1])).toThrow('INVALID_ACTION');
  });
});
