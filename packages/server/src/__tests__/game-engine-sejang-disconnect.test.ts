/**
 * 세장섯다 sejang-open / card-select disconnect 자동 다이 회귀 테스트 (260429-urr Task 3)
 *
 * 버그: 세장섯다 모드에서 카드 배분 후 sejang-open 또는 card-select phase 중
 *       플레이어가 disconnect 되면 forceDisconnectedPlayerAction이 그 phase를
 *       처리하지 않아 게임이 멈춘다.
 * 정답: 게임 시작 후 disconnect는 즉시 자동 다이로 처리하고,
 *       나머지 플레이어가 모두 선택 완료했으면 다음 phase로 진행.
 */
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../game-engine.js';
import type { RoomPlayer } from '@sutda/shared';

/** 3인 세장섯다용 GameEngine 헬퍼 (roundNumber=2 → attend-school 시작) */
function createSejangEngine3(): GameEngine {
  const players: RoomPlayer[] = [
    { id: 'p1', nickname: '플레이어1', chips: 100000, seatIndex: 0, isConnected: true },
    { id: 'p2', nickname: '플레이어2', chips: 100000, seatIndex: 1, isConnected: true },
    { id: 'p3', nickname: '플레이어3', chips: 100000, seatIndex: 2, isConnected: true },
  ];
  const engine = new GameEngine('room1', players, 'original', 2);
  engine.setDealerFromPreviousWinner('p1');
  engine.attendSchool('p1');
  engine.attendSchool('p2');
  engine.attendSchool('p3');
  // mode-select 단계
  return engine;
}

/** 2인 세장섯다용 (생존자 1명 시 finalize 시나리오 검증) */
function createSejangEngine2(): GameEngine {
  const players: RoomPlayer[] = [
    { id: 'p1', nickname: '플레이어1', chips: 100000, seatIndex: 0, isConnected: true },
    { id: 'p2', nickname: '플레이어2', chips: 100000, seatIndex: 1, isConnected: true },
  ];
  const engine = new GameEngine('room1', players, 'original', 2);
  engine.setDealerFromPreviousWinner('p1');
  engine.attendSchool('p1');
  engine.attendSchool('p2');
  return engine;
}

/** sejang-open phase까지 진행 */
function advanceToSejangOpen(engine: GameEngine): void {
  engine.selectMode('p1', 'three-card');
  engine.shuffle('p1');
  engine.cut('p2', [], [0]);
}

/** card-select phase까지 진행 (3인) */
function advanceToCardSelect3(engine: GameEngine): void {
  advanceToSejangOpen(engine);
  engine.openSejangCard('p1', 0);
  engine.openSejangCard('p2', 0);
  engine.openSejangCard('p3', 0);
  // betting-1
  engine.processBetAction('p1', { type: 'check' });
  engine.processBetAction('p3', { type: 'call' });
  engine.processBetAction('p2', { type: 'call' });
  // betting-2
  engine.processBetAction('p1', { type: 'check' });
  engine.processBetAction('p3', { type: 'call' });
  engine.processBetAction('p2', { type: 'call' });
  // card-select
}

describe('세장섯다 sejang-open disconnect 자동 다이', () => {
  it('3인 sejang-open 중 1명 disconnect → 해당 플레이어 isAlive=false', () => {
    const engine = createSejangEngine3();
    advanceToSejangOpen(engine);
    expect(engine.getState().phase).toBe('sejang-open');

    engine.forceDisconnectedPlayerAction('p3');
    const state = engine.getState();
    const p3 = state.players.find(p => p.id === 'p3')!;
    expect(p3.isAlive).toBe(false);
    expect(p3.isDisconnected).toBe(true);
  });

  it('3인 sejang-open: p3 disconnect 후 p1/p2 모두 카드 선택 → phase=betting-1', () => {
    const engine = createSejangEngine3();
    advanceToSejangOpen(engine);
    engine.forceDisconnectedPlayerAction('p3');

    // p3 disconnect 후 phase는 아직 sejang-open
    expect(engine.getState().phase).toBe('sejang-open');

    engine.openSejangCard('p1', 0);
    expect(engine.getState().phase).toBe('sejang-open');
    engine.openSejangCard('p2', 1);
    // 나머지 둘이 모두 openSejangCard 완료 → betting-1
    expect(engine.getState().phase).toBe('betting-1');
  });

  it('3인 sejang-open: p1/p2가 먼저 선택 후 p3 disconnect → 즉시 phase=betting-1', () => {
    const engine = createSejangEngine3();
    advanceToSejangOpen(engine);

    engine.openSejangCard('p1', 0);
    engine.openSejangCard('p2', 1);
    // p3는 아직 미선택 — phase는 sejang-open 유지
    expect(engine.getState().phase).toBe('sejang-open');

    engine.forceDisconnectedPlayerAction('p3');
    // p3가 다이 처리되어 alive=[p1,p2]가 모두 선택 완료 → betting-1
    expect(engine.getState().phase).toBe('betting-1');
  });

  it('2인 sejang-open: 1명 disconnect → 남은 1명이 winnerId, phase=result', () => {
    const engine = createSejangEngine2();
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    expect(engine.getState().phase).toBe('sejang-open');

    engine.forceDisconnectedPlayerAction('p2');
    const state = engine.getState();
    expect(state.phase).toBe('result');
    expect(state.winnerId).toBe('p1');
  });

  it('정상 플레이 회귀: disconnect 없이 3명 모두 선택 → phase=betting-1', () => {
    const engine = createSejangEngine3();
    advanceToSejangOpen(engine);
    engine.openSejangCard('p1', 0);
    engine.openSejangCard('p2', 0);
    engine.openSejangCard('p3', 0);
    expect(engine.getState().phase).toBe('betting-1');
  });
});

describe('세장섯다 card-select disconnect 자동 다이', () => {
  it('3인 card-select 중 1명 disconnect → isAlive=false', () => {
    const engine = createSejangEngine3();
    advanceToCardSelect3(engine);
    expect(engine.getState().phase).toBe('card-select');

    engine.forceDisconnectedPlayerAction('p3');
    const state = engine.getState();
    const p3 = state.players.find(p => p.id === 'p3')!;
    expect(p3.isAlive).toBe(false);
    expect(p3.isDisconnected).toBe(true);
  });

  it('3인 card-select: p3 disconnect 후 p1/p2 모두 selectCards → phase=card-reveal', () => {
    const engine = createSejangEngine3();
    advanceToCardSelect3(engine);

    engine.forceDisconnectedPlayerAction('p3');
    expect(engine.getState().phase).toBe('card-select');

    engine.selectCards('p1', [0, 1]);
    expect(engine.getState().phase).toBe('card-select');
    engine.selectCards('p2', [1, 2]);
    expect(engine.getState().phase).toBe('card-reveal');
  });

  it('3인 card-select: p1/p2 먼저 selectCards 후 p3 disconnect → 즉시 phase=card-reveal', () => {
    const engine = createSejangEngine3();
    advanceToCardSelect3(engine);

    engine.selectCards('p1', [0, 1]);
    engine.selectCards('p2', [1, 2]);
    expect(engine.getState().phase).toBe('card-select');  // p3 아직 미선택

    engine.forceDisconnectedPlayerAction('p3');
    expect(engine.getState().phase).toBe('card-reveal');
  });

  it('2인 card-select: 1명 disconnect → 남은 1명이 winnerId, phase=result', () => {
    const engine = createSejangEngine2();
    engine.selectMode('p1', 'three-card');
    engine.shuffle('p1');
    engine.cut('p2', [], [0]);
    engine.openSejangCard('p1', 0);
    engine.openSejangCard('p2', 0);
    // betting-1
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    // betting-2
    engine.processBetAction('p1', { type: 'check' });
    engine.processBetAction('p2', { type: 'call' });
    expect(engine.getState().phase).toBe('card-select');

    engine.forceDisconnectedPlayerAction('p2');
    const state = engine.getState();
    expect(state.phase).toBe('result');
    expect(state.winnerId).toBe('p1');
  });
});
