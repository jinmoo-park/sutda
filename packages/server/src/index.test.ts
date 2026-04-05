import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, GameState } from '@sutda/shared';
import { httpServer, gameEngines, roomManager } from './index.js';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

let serverUrl: string;

function createClient(): TestClient {
  return ioc(serverUrl, {
    transports: ['websocket'],
    forceNew: true,
  });
}

function waitForEvent<T>(socket: TestClient, event: string): Promise<T> {
  return new Promise((resolve) => {
    (socket as any).once(event, (data: T) => resolve(data));
  });
}

/**
 * 두 플레이어가 방에 참여하고 게임을 시작하는 헬퍼 함수
 * 반환: { host, joiner, roomId, gameState }
 */
async function setupGameStarted(): Promise<{
  host: TestClient;
  joiner: TestClient;
  roomId: string;
  gameState: GameState;
}> {
  const host = createClient();
  const joiner = createClient();

  await Promise.all([
    new Promise<void>((resolve) => host.on('connect', resolve)),
    new Promise<void>((resolve) => joiner.on('connect', resolve)),
  ]);

  host.emit('create-room', { nickname: '방장', initialChips: 100000 });
  const { roomId } = await waitForEvent<{ roomId: string }>(host, 'room-created');

  joiner.emit('join-room', { roomId, nickname: '참여자', initialChips: 100000 });
  await waitForEvent<any>(joiner, 'room-state');

  // 게임 시작 -- host와 joiner 모두 game-state를 수신할 준비
  const hostGameStatePromise = waitForEvent<GameState>(host, 'game-state');
  host.emit('start-game', { roomId });
  const gameState = await hostGameStatePromise;

  return { host, joiner, roomId, gameState };
}

/**
 * dealer-select phase 이후 모든 플레이어가 attend-school을 완료해
 * mode-select phase에 도달하는 헬퍼
 */
async function advanceToModeSelect(
  host: TestClient,
  joiner: TestClient,
  roomId: string,
): Promise<GameState> {
  // 두 플레이어 모두 dealer 카드 선택
  const hostCardPromise = waitForEvent<GameState>(host, 'game-state');
  host.emit('select-dealer-card', { roomId, cardIndex: 0 });
  await hostCardPromise;

  const joinerCardPromise = waitForEvent<GameState>(host, 'game-state');
  joiner.emit('select-dealer-card', { roomId, cardIndex: 1 });
  const afterDealerSelect = await joinerCardPromise;
  // dealer-select 완료 -> attend-school phase로 전환됨

  // 두 플레이어 attend-school
  const hostAttendPromise = waitForEvent<GameState>(host, 'game-state');
  host.emit('attend-school', { roomId });
  await hostAttendPromise;

  const joinerAttendPromise = waitForEvent<GameState>(host, 'game-state');
  joiner.emit('attend-school', { roomId });
  const modeSelectState = await joinerAttendPromise;

  return modeSelectState;
}

/**
 * dealer 플레이어 찾기 (isDealer=true)
 */
function getDealerClient(
  gameState: GameState,
  host: TestClient,
  joiner: TestClient,
  hostId: string,
  joinerId: string,
): { dealer: TestClient; nonDealer: TestClient } {
  const dealerPlayer = gameState.players.find(p => p.isDealer);
  if (dealerPlayer?.id === hostId) {
    return { dealer: host, nonDealer: joiner };
  }
  return { dealer: joiner, nonDealer: host };
}

beforeAll(() => {
  return new Promise<void>((resolve) => {
    httpServer.listen(0, () => {
      const addr = httpServer.address();
      if (addr && typeof addr !== 'string') {
        serverUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });
});

describe('게임 이벤트 핸들러 통합 테스트', () => {
  const clients: TestClient[] = [];

  afterEach(() => {
    clients.forEach(c => c.disconnect());
    clients.length = 0;
    // 테스트 간 gameEngines Map 정리
    gameEngines.clear();
  });

  it('start-game 후 game-state 이벤트 수신 및 dealer-select phase 확인', async () => {
    const { host, joiner, gameState } = await setupGameStarted();
    clients.push(host, joiner);

    expect(gameState).toBeDefined();
    expect(gameState.phase).toBe('dealer-select');
    expect(gameState.players).toHaveLength(2);
    expect(gameState.roundNumber).toBe(1);
  });

  it('attend-school 이벤트로 등교 처리 및 pot 증가 확인', async () => {
    const { host, joiner, roomId, gameState: initialState } = await setupGameStarted();
    clients.push(host, joiner);

    // dealer-select 완료 (두 플레이어 카드 선택)
    const hostCardPromise = waitForEvent<GameState>(host, 'game-state');
    host.emit('select-dealer-card', { roomId, cardIndex: 0 });
    await hostCardPromise;

    const joinerCardPromise = waitForEvent<GameState>(host, 'game-state');
    joiner.emit('select-dealer-card', { roomId, cardIndex: 1 });
    await joinerCardPromise;

    // 첫 번째 등교
    const firstAttendPromise = waitForEvent<GameState>(host, 'game-state');
    host.emit('attend-school', { roomId });
    const afterFirstAttend = await firstAttendPromise;

    expect(afterFirstAttend.pot).toBe(500);
    expect(afterFirstAttend.attendedPlayerIds).toHaveLength(1);

    // 두 번째 등교 -> mode-select로 전환
    const secondAttendPromise = waitForEvent<GameState>(host, 'game-state');
    joiner.emit('attend-school', { roomId });
    const afterSecondAttend = await secondAttendPromise;

    expect(afterSecondAttend.pot).toBe(1000);
    expect(afterSecondAttend.phase).toBe('mode-select');
  });

  it('select-mode 이벤트로 모드 선택 및 shuffling phase 전환 확인', async () => {
    const { host, joiner, roomId } = await setupGameStarted();
    clients.push(host, joiner);

    const modeSelectState = await advanceToModeSelect(host, joiner, roomId);
    expect(modeSelectState.phase).toBe('mode-select');

    // dealer가 select-mode 이벤트 발생 -- dealer 판별 후 올바른 클라이언트 사용
    const dealerPlayer = modeSelectState.players.find(p => p.isDealer);
    expect(dealerPlayer).toBeDefined();

    // gameEngines에서 직접 dealer id를 확인할 수 없으므로
    // host가 dealer인지 시도하고, game-error 수신 시 joiner로 시도
    const shufflingState = await new Promise<GameState>((resolve) => {
      // game-state 수신 시 resolve (어느 클라이언트든)
      const onGameState = (data: GameState) => {
        if (data.phase === 'shuffling') {
          host.off('game-state', onGameState);
          joiner.off('game-state', onGameState);
          resolve(data);
        }
      };
      host.on('game-state', onGameState);
      joiner.on('game-state', onGameState);

      // host가 dealer가 아니면 game-error -> joiner로 시도
      host.once('game-error', () => {
        joiner.emit('select-mode', { roomId, mode: 'original' });
      });

      host.emit('select-mode', { roomId, mode: 'original' });
    });

    expect(shufflingState.phase).toBe('shuffling');
    expect(shufflingState.mode).toBe('original');
  });

  it('잘못된 phase에서 액션 시 game-error 수신 (INVALID_PHASE)', async () => {
    const { host, joiner, roomId } = await setupGameStarted();
    clients.push(host, joiner);

    // dealer-select phase에서 bet-action 시도
    const errorPromise = waitForEvent<{ code: string; message: string }>(host, 'game-error');
    host.emit('bet-action', { roomId, action: { type: 'call' } });
    const error = await errorPromise;

    expect(error.code).toBe('INVALID_PHASE');
    expect(error.message).toBeTruthy();
  });

  it('bet-action 이벤트로 베팅 처리', async () => {
    const { host, joiner, roomId } = await setupGameStarted();
    clients.push(host, joiner);

    const modeSelectState = await advanceToModeSelect(host, joiner, roomId);

    // dealer 판별
    const dealerPlayer = modeSelectState.players.find(p => p.isDealer);
    expect(dealerPlayer).toBeDefined();

    // select-mode -> shuffling
    let afterShuffle: GameState | null = null;
    {
      const p1 = waitForEvent<GameState>(host, 'game-state');
      host.emit('select-mode', { roomId, mode: 'original' });
      let state: GameState | null = null;
      try {
        state = await Promise.race([
          p1,
          new Promise<GameState>((resolve) => {
            host.once('game-error', async () => {
              joiner.emit('select-mode', { roomId, mode: 'original' });
              const s = await waitForEvent<GameState>(joiner, 'game-state');
              resolve(s);
            });
          }),
        ]);
      } catch {
        joiner.emit('select-mode', { roomId, mode: 'original' });
        state = await waitForEvent<GameState>(host, 'game-state');
      }
      expect(state?.phase).toBe('shuffling');
      afterShuffle = state;
    }

    // dealer가 shuffle
    const shufflePromise = waitForEvent<GameState>(host, 'game-state');
    host.emit('shuffle', { roomId });
    let afterShuffleState: GameState | null = null;
    try {
      afterShuffleState = await Promise.race([
        shufflePromise,
        new Promise<GameState>((resolve) => {
          host.once('game-error', async () => {
            joiner.emit('shuffle', { roomId });
            const s = await waitForEvent<GameState>(host, 'game-state');
            resolve(s);
          });
        }),
      ]);
    } catch {
      joiner.emit('shuffle', { roomId });
      afterShuffleState = await waitForEvent<GameState>(host, 'game-state');
    }
    expect(afterShuffleState?.phase).toBe('cutting');

    // cutter가 declareTtong (간단히 퉁 선언으로 패 배분까지)
    const ttongPromise = waitForEvent<GameState>(host, 'game-state');
    // cutter는 dealer+1 자리. joiner 또는 host 중 한 명
    joiner.emit('declare-ttong', { roomId });
    let afterTtong: GameState | null = null;
    try {
      afterTtong = await Promise.race([
        ttongPromise,
        new Promise<GameState>((resolve) => {
          joiner.once('game-error', async () => {
            host.emit('declare-ttong', { roomId });
            const s = await waitForEvent<GameState>(host, 'game-state');
            resolve(s);
          });
        }),
      ]);
    } catch {
      host.emit('declare-ttong', { roomId });
      afterTtong = await waitForEvent<GameState>(host, 'game-state');
    }
    // cutting -> dealing -> betting
    expect(afterTtong?.phase).toBe('betting');

    // 첫 베팅 플레이어가 check (currentBetAmount=0 이므로 check 가능)
    const betPromise = waitForEvent<GameState>(host, 'game-state');
    host.emit('bet-action', { roomId, action: { type: 'check' } });
    let afterBet: GameState | null = null;
    try {
      afterBet = await Promise.race([
        betPromise,
        new Promise<GameState>((resolve) => {
          host.once('game-error', async () => {
            joiner.emit('bet-action', { roomId, action: { type: 'check' } });
            const s = await waitForEvent<GameState>(host, 'game-state');
            resolve(s);
          });
        }),
      ]);
    } catch {
      joiner.emit('bet-action', { roomId, action: { type: 'check' } });
      afterBet = await waitForEvent<GameState>(host, 'game-state');
    }

    // bet-action 후 game-state 수신됨 확인
    expect(afterBet).toBeDefined();
  });

  describe('유효 스택 상한 초과 레이즈 거부', () => {
    it('effectiveMaxBet 초과 레이즈 시 INSUFFICIENT_CHIPS game-error 반환', async () => {
      const { host, joiner, roomId } = await setupGameStarted();
      clients.push(host, joiner);

      // engine 직접 접근하여 betting phase로 설정 및 chips를 작게 설정
      const engine = gameEngines.get(roomId)!;
      const engineState = (engine as any).state;
      engineState.phase = 'betting';
      engineState.currentBetAmount = 0;
      // player[0] chips=1000, player[1] chips=100000 → effectiveMaxBet for player[0] = 1000
      engineState.players[0].chips = 1000;
      engineState.players[0].currentBet = 0;
      engineState.players[1].chips = 100000;
      engineState.players[1].currentBet = 0;
      engineState.currentPlayerIndex = 0;

      // currentPlayer index=0 가 raise 99999 시도 → effectiveMaxBet=1000 초과
      const errorPromise = waitForEvent<{ code: string; message: string }>(host, 'game-error');
      host.emit('bet-action', { roomId, action: { type: 'raise', amount: 99999 } });

      try {
        const error = await Promise.race([
          errorPromise,
          new Promise<{ code: string; message: string }>((resolve) => {
            host.once('game-error', resolve);
          }),
          new Promise<{ code: string; message: string }>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
        ]);
        // host가 currentPlayer가 아닐 수 있으므로 joiner로 재시도
        if (error.code === 'NOT_YOUR_TURN') {
          engineState.currentPlayerIndex = 1;
          engineState.players[1].chips = 1000;
          engineState.players[1].currentBet = 0;
          const error2Promise = waitForEvent<{ code: string; message: string }>(joiner, 'game-error');
          joiner.emit('bet-action', { roomId, action: { type: 'raise', amount: 99999 } });
          const error2 = await error2Promise;
          expect(error2.code).toBe('INSUFFICIENT_CHIPS');
        } else {
          expect(error.code).toBe('INSUFFICIENT_CHIPS');
        }
      } catch (e: any) {
        if (e.message === 'timeout') {
          // host가 NOT_YOUR_TURN이 아니라 단순히 에러가 안 온 경우 — joiner로 시도
          engineState.currentPlayerIndex = 1;
          engineState.players[1].chips = 1000;
          engineState.players[1].currentBet = 0;
          const error2Promise = waitForEvent<{ code: string; message: string }>(joiner, 'game-error');
          joiner.emit('bet-action', { roomId, action: { type: 'raise', amount: 99999 } });
          const error2 = await error2Promise;
          expect(error2.code).toBe('INSUFFICIENT_CHIPS');
        } else {
          throw e;
        }
      }
    });
  });

  it('next-round 이벤트로 다음 판 시작 및 roundNumber 증가 확인', async () => {
    const { host, joiner, roomId } = await setupGameStarted();
    clients.push(host, joiner);

    // gameEngines Map에서 직접 engine을 result phase로 설정
    // (복잡한 전체 게임 플로우를 거치지 않고 직접 engine state를 조작)
    const engine = gameEngines.get(roomId);
    expect(engine).toBeDefined();

    // engine의 state를 result phase로 강제 설정 (TypeScript private 우회)
    const engineState = (engine as any).state;
    engineState.phase = 'result';
    engineState.winnerId = engineState.players[0].id;

    const nextRoundPromise = waitForEvent<GameState>(host, 'game-state');
    host.emit('next-round', { roomId });
    const afterNextRound = await nextRoundPromise;

    expect(afterNextRound.roundNumber).toBe(2);
    expect(afterNextRound.phase).toBe('attend-school');
    expect(afterNextRound.pot).toBe(0);
  });
});

describe('보안: rate limiting (D-07)', () => {
  const clients: TestClient[] = [];

  afterEach(() => {
    clients.forEach(c => c.disconnect());
    clients.length = 0;
    gameEngines.clear();
  });

  it('소켓당 초당 20개 이벤트 초과 시 일부 이벤트가 무시된다', async () => {
    const client = createClient();
    clients.push(client);
    await new Promise<void>((resolve) => client.on('connect', resolve));

    // 방 생성
    client.emit('create-room', { nickname: 'rate-test', initialChips: 100000 });
    const { roomId } = await waitForEvent<{ roomId: string }>(client, 'room-created');

    // 30개 send-chat 이벤트를 동기적으로 빠르게 전송 (20개 초과)
    const received: any[] = [];
    client.on('chat-message', (msg) => received.push(msg));

    for (let i = 0; i < 30; i++) {
      client.emit('send-chat', { roomId, text: `msg-${i}` });
    }

    // 충분한 대기 시간 후 수신된 메시지 수가 30개 미만인지 확인
    await new Promise((r) => setTimeout(r, 500));
    expect(received.length).toBeLessThan(30);
    // 연결은 유지되어야 한다
    expect(client.connected).toBe(true);
  });
});

describe('보안: send-chat 접근 제어 (A01)', () => {
  const clients: TestClient[] = [];

  afterEach(() => {
    clients.forEach(c => c.disconnect());
    clients.length = 0;
    gameEngines.clear();
  });

  it('자신이 속하지 않은 방에 채팅을 보내면 무시된다', async () => {
    const client1 = createClient();
    const client2 = createClient();
    clients.push(client1, client2);
    await Promise.all([
      new Promise<void>((resolve) => client1.on('connect', resolve)),
      new Promise<void>((resolve) => client2.on('connect', resolve)),
    ]);

    // client1이 방 생성
    client1.emit('create-room', { nickname: 'owner', initialChips: 100000 });
    const { roomId } = await waitForEvent<{ roomId: string }>(client1, 'room-created');

    // client2는 다른 방을 생성 (자신의 roomId가 다름)
    client2.emit('create-room', { nickname: 'other', initialChips: 100000 });
    await waitForEvent<{ roomId: string }>(client2, 'room-created');

    // client2가 client1의 roomId로 채팅 시도
    const received: any[] = [];
    client1.on('chat-message', (msg) => received.push(msg));

    client2.emit('send-chat', { roomId, text: 'injection attempt' });
    await new Promise((r) => setTimeout(r, 300));

    // client1의 방에 메시지가 도달하지 않아야 한다
    expect(received.length).toBe(0);
  });
});

describe('버그 수정: disconnect 유예 만료 시 chips 동기화 (D-18)', () => {
  const clients: TestClient[] = [];

  afterEach(() => {
    vi.useRealTimers();
    clients.forEach(c => c.disconnect());
    clients.length = 0;
    gameEngines.clear();
  });

  it('게임 중 disconnect 유예 만료 후 대기실 전환 시 남은 플레이어의 chips가 engine 정산값을 유지한다', async () => {
    // 1. 게임 시작
    const { host, joiner, roomId } = await setupGameStarted();
    clients.push(host, joiner);

    // 2. engine의 chips를 게임 중 정산된 값으로 강제 설정 (예: 방장이 80,000원 획득)
    const engine = gameEngines.get(roomId)!;
    expect(engine).toBeDefined();
    const engineState = (engine as any).state;
    const hostPlayerId = engineState.players[0].id;
    engineState.players[0].chips = 80000; // 방장: 20,000 잃은 상태
    engineState.players[1].chips = 120000; // 참여자: 20,000 얻은 상태

    // 3. fake timers 활성화 (disconnect 60초 타이머를 가로채기 위해)
    vi.useFakeTimers();

    // 4. room-state 수신 대기 설정
    const roomStatePromise = new Promise<any>((resolve) => {
      host.once('room-state', (data: any) => resolve(data));
    });

    // 5. joiner(참여자) 연결 끊기 — 서버가 60초 타이머를 시작함
    joiner.disconnect();

    // 6. 60초 타이머를 빠르게 실행
    await vi.runAllTimersAsync();

    // 7. real timers 복원 후 room-state 이벤트 대기
    vi.useRealTimers();
    const roomState = await Promise.race([
      roomStatePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    expect(roomState).not.toBeNull();
    expect(roomState.gamePhase).toBe('waiting');

    // 8. 남은 플레이어(방장)의 chips가 engine 정산값(80,000)을 유지해야 한다
    //    (버그 수정 전: 100,000으로 리셋됨)
    const hostInRoom = roomState.players.find((p: any) => p.id === hostPlayerId);
    expect(hostInRoom).toBeDefined();
    expect(hostInRoom.chips).toBe(80000);
  });
});
