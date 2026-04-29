/**
 * 3인 이상 땡잡이 승자 판정 회귀 테스트 (260429-urr Task 2)
 *
 * 버그: 3인 게임에서 땡잡이(0) + 4땡(1004) + 6끗(6) 같은 라운드는
 *       compareHands.reduce(...) 패턴이 비-전이성 사이클을 만들어
 *       시작 인덱스에 따라 결과가 달라졌다.
 * 정답: 땡잡이는 라운드에 일~구땡이 있고 장땡/광땡이 없을 때
 *       모든 플레이어를 이긴다. (findRoundWinner 사용)
 */
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../game-engine.js';
import type { RoomPlayer, GameState } from '@sutda/shared';

/** 3인 플레이어 헬퍼 */
function makePlayers3(): RoomPlayer[] {
  return Array.from({ length: 3 }, (_, i) => ({
    id: `player-${i}`,
    nickname: `Player${i}`,
    chips: 100000,
    seatIndex: i,
    isConnected: true,
  }));
}

/** showdown 직전 상태로 engine을 만든 뒤 카드를 강제 세팅하고 _resolveShowdown 호출 */
function runShowdownOriginal(
  engine: GameEngine,
  cardsByPlayer: Array<[import('@sutda/shared').Card, import('@sutda/shared').Card]>,
): GameState {
  const state = engine.getState() as GameState;
  state.phase = 'showdown';
  state.mode = 'original';
  for (let i = 0; i < cardsByPlayer.length; i++) {
    state.players[i].cards = cardsByPlayer[i];
    state.players[i].isAlive = true;
  }
  // private method 직접 호출 (다른 테스트에서도 동일한 bracket access 패턴 사용)
  (engine as any)._resolveShowdownOriginal();
  return engine.getState();
}

describe('3인 이상 땡잡이 승자 판정 (findRoundWinner 통합)', () => {
  it('땡잡이(3,7) + 4땡 + 6끗 → 땡잡이(player-0)가 승자', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 3, attribute: 'normal' }, { rank: 7, attribute: 'normal' }],   // 땡잡이
      [{ rank: 4, attribute: 'normal' }, { rank: 4, attribute: 'gwang' }],    // 4땡
      [{ rank: 1, attribute: 'gwang' }, { rank: 5, attribute: 'normal' }],    // 6끗
    ]);
    // result 또는 rematch-pending; 승자는 땡잡이여야 함
    expect(state.winnerId).toBe('player-0');
  });

  it('순서 무관: 4땡 + 6끗 + 땡잡이(2번 자리) → 땡잡이(player-2) 승', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 4, attribute: 'normal' }, { rank: 4, attribute: 'gwang' }],    // 4땡
      [{ rank: 1, attribute: 'gwang' }, { rank: 5, attribute: 'normal' }],    // 6끗
      [{ rank: 3, attribute: 'normal' }, { rank: 7, attribute: 'normal' }],   // 땡잡이
    ]);
    expect(state.winnerId).toBe('player-2');
  });

  it('순서 무관: 6끗 + 땡잡이 + 4땡 → 땡잡이(player-1) 승', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 1, attribute: 'gwang' }, { rank: 5, attribute: 'normal' }],    // 6끗
      [{ rank: 3, attribute: 'normal' }, { rank: 7, attribute: 'normal' }],   // 땡잡이
      [{ rank: 4, attribute: 'normal' }, { rank: 4, attribute: 'gwang' }],    // 4땡
    ]);
    expect(state.winnerId).toBe('player-1');
  });

  it('땡잡이 + 4땡 + 장땡 → 장땡 승 (땡잡이 불발)', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 3, attribute: 'normal' }, { rank: 7, attribute: 'normal' }],   // 땡잡이
      [{ rank: 4, attribute: 'normal' }, { rank: 4, attribute: 'gwang' }],    // 4땡
      [{ rank: 10, attribute: 'normal' }, { rank: 10, attribute: 'normal' }], // 장땡
    ]);
    expect(state.winnerId).toBe('player-2');
  });

  it('땡잡이 + 4땡 + 삼팔광땡 → 삼팔광땡 승', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 3, attribute: 'normal' }, { rank: 7, attribute: 'normal' }],   // 땡잡이
      [{ rank: 4, attribute: 'normal' }, { rank: 4, attribute: 'gwang' }],    // 4땡
      [{ rank: 3, attribute: 'gwang' }, { rank: 8, attribute: 'gwang' }],     // 삼팔광땡
    ]);
    expect(state.winnerId).toBe('player-2');
  });

  it('땡잡이 + 6끗 + 알리 (땡 없음) → 알리 승 (땡잡이 불발)', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 3, attribute: 'normal' }, { rank: 7, attribute: 'normal' }],   // 땡잡이
      [{ rank: 1, attribute: 'gwang' }, { rank: 5, attribute: 'normal' }],    // 6끗
      [{ rank: 1, attribute: 'gwang' }, { rank: 2, attribute: 'normal' }],    // 알리
    ]);
    expect(state.winnerId).toBe('player-2');
  });

  it('암행어사(4열,7열) + 일팔광땡 + 6끗 → 암행어사 승', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 4, attribute: 'yeolkkeut' }, { rank: 7, attribute: 'yeolkkeut' }], // 암행어사
      [{ rank: 1, attribute: 'gwang' }, { rank: 8, attribute: 'gwang' }],         // 일팔광땡
      [{ rank: 1, attribute: 'gwang' }, { rank: 5, attribute: 'normal' }],        // 6끗
    ]);
    expect(state.winnerId).toBe('player-0');
  });

  it('일반 비교 회귀: 장땡 + 구땡 + 6끗 → 장땡 승', () => {
    const engine = new GameEngine('room1', makePlayers3(), 'original', 2);
    const state = runShowdownOriginal(engine, [
      [{ rank: 9, attribute: 'normal' }, { rank: 9, attribute: 'normal' }],    // 구땡
      [{ rank: 10, attribute: 'normal' }, { rank: 10, attribute: 'normal' }],  // 장땡
      [{ rank: 1, attribute: 'gwang' }, { rank: 5, attribute: 'normal' }],     // 6끗
    ]);
    expect(state.winnerId).toBe('player-1');
  });
});
