import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, RoomState } from '@sutda/shared';
import { httpServer, roomManager } from './index.js';

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

describe('Socket.IO 통합 테스트', () => {
  const clients: TestClient[] = [];

  afterEach(() => {
    clients.forEach(c => c.disconnect());
    clients.length = 0;
  });

  it('방 생성 시 room-created 이벤트를 수신한다 (INFRA-01)', async () => {
    const client = createClient();
    clients.push(client);

    await new Promise<void>((resolve) => client.on('connect', resolve));

    client.emit('create-room', { nickname: '방장', initialChips: 100000 });
    const data = await waitForEvent<{ roomId: string; roomState: RoomState }>(client, 'room-created');

    expect(data.roomId).toHaveLength(8);
    expect(data.roomState.hostId).toBeTruthy();
    expect(data.roomState.players).toHaveLength(1);
    expect(data.roomState.players[0].nickname).toBe('방장');
  });

  it('다른 플레이어가 방에 참여하면 player-joined 이벤트를 수신한다 (INFRA-02)', async () => {
    const host = createClient();
    const joiner = createClient();
    clients.push(host, joiner);

    // 두 클라이언트 모두 연결될 때까지 병렬 대기
    await Promise.all([
      new Promise<void>((resolve) => host.on('connect', resolve)),
      new Promise<void>((resolve) => joiner.on('connect', resolve)),
    ]);

    host.emit('create-room', { nickname: '방장', initialChips: 100000 });
    const { roomId } = await waitForEvent<{ roomId: string }>(host, 'room-created');

    // player-joined 리스너를 join 전에 등록
    const joinedPromise = waitForEvent<any>(host, 'player-joined');
    joiner.emit('join-room', { roomId, nickname: '참여자', initialChips: 50000 });
    const joined = await joinedPromise;

    expect(joined.nickname).toBe('참여자');
    expect(joined.chips).toBe(50000);
  });

  it('만원 단위가 아닌 칩으로 방 생성 시 INVALID_CHIPS 에러 (INFRA-06)', async () => {
    const client = createClient();
    clients.push(client);

    await new Promise<void>((resolve) => client.on('connect', resolve));

    client.emit('create-room', { nickname: '방장', initialChips: 5000 });
    const error = await waitForEvent<{ code: string; message: string }>(client, 'error');

    expect(error.code).toBe('INVALID_CHIPS');
    expect(error.message).toContain('10,000원');
  });

  it('존재하지 않는 방에 참여하면 ROOM_NOT_FOUND 에러', async () => {
    const client = createClient();
    clients.push(client);

    await new Promise<void>((resolve) => client.on('connect', resolve));

    client.emit('join-room', { roomId: 'nonexist', nickname: 'A', initialChips: 100000 });
    const error = await waitForEvent<{ code: string }>(client, 'error');

    expect(error.code).toBe('ROOM_NOT_FOUND');
  });

  it('방장만 게임을 시작할 수 있다 (D-11)', async () => {
    const host = createClient();
    const joiner = createClient();
    clients.push(host, joiner);

    // 두 클라이언트 모두 연결될 때까지 병렬 대기
    await Promise.all([
      new Promise<void>((resolve) => host.on('connect', resolve)),
      new Promise<void>((resolve) => joiner.on('connect', resolve)),
    ]);

    host.emit('create-room', { nickname: '방장', initialChips: 100000 });
    const { roomId } = await waitForEvent<{ roomId: string }>(host, 'room-created');

    joiner.emit('join-room', { roomId, nickname: '참여자', initialChips: 100000 });
    await waitForEvent<any>(joiner, 'room-state');

    // 비방장이 시작 시도
    joiner.emit('start-game', { roomId });
    const error = await waitForEvent<{ code: string }>(joiner, 'error');
    expect(error.code).toBe('NOT_HOST');

    // 방장이 시작
    const statePromise = waitForEvent<RoomState>(host, 'room-state');
    host.emit('start-game', { roomId });
    const state = await statePromise;
    expect(state.gamePhase).toBe('playing');
  });
});
