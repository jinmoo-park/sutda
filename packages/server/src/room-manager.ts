import type { RoomState, RoomPlayer } from '@sutda/shared';
import { randomUUID } from 'crypto';

type RechargeVoteResult =
  | { complete: true; approved: boolean; requesterId: string }
  | { complete: false; votedCount: number; totalNeeded: number };

interface RechargeRequest {
  requesterId: string;
  amount: number;
  votes: Map<string, boolean>;
  totalNeeded: number;
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private rechargeRequests: Map<string, RechargeRequest> = new Map();

  /** 방 생성 -- 8자리 UUID 코드 반환 (per D-01) */
  createRoom(hostId: string, nickname: string, initialChips: number): RoomState {
    const roomId = randomUUID().slice(0, 8);
    const host: RoomPlayer = {
      id: hostId,
      nickname,
      chips: initialChips,
      seatIndex: 0,
      isConnected: true,
    };
    const room: RoomState = {
      roomId,
      hostId,
      players: [host],
      maxPlayers: 6,
      gamePhase: 'waiting',
      createdAt: Date.now(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  /** 방 조회 */
  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /** 방 참여 -- 에러 시 ErrorPayload의 code를 문자열로 throw */
  joinRoom(roomId: string, playerId: string, nickname: string, initialChips: number): { room: RoomState; player: RoomPlayer } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.gamePhase === 'playing') {
      // 재접속 확인 (per D-04, D-05)
      const existing = room.players.find(p => p.nickname === nickname);
      if (existing) {
        if (room.hostId === existing.id) {
          room.hostId = playerId; // 방장 재접속 시 hostId도 새 socket.id로 갱신
        }
        existing.id = playerId; // 새 소켓 ID로 갱신
        existing.isConnected = true;
        return { room, player: existing };
      }
      throw new Error('GAME_IN_PROGRESS');
    }
    // waiting 상태에서도 동일 닉네임 → 재접속 처리 (소켓 재연결, 방장 권한 유지)
    const existingWaiting = room.players.find(p => p.nickname === nickname);
    if (existingWaiting) {
      if (room.hostId === existingWaiting.id) {
        room.hostId = playerId; // 방장 재접속 시 hostId도 새 socket.id로 갱신
      }
      existingWaiting.id = playerId;
      existingWaiting.isConnected = true;
      return { room, player: existingWaiting };
    }
    if (room.players.length >= room.maxPlayers) {
      throw new Error('ROOM_FULL');
    }
    const player: RoomPlayer = {
      id: playerId,
      nickname,
      chips: initialChips,
      seatIndex: room.players.length,
      isConnected: true,
    };
    room.players.push(player);
    return { room, player };
  }

  /** 플레이어 퇴장 -- 방장 승계 처리 (per D-12) */
  leaveRoom(roomId: string, playerId: string): { room: RoomState; removedPlayerId: string; newHostId?: string } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const idx = room.players.findIndex(p => p.id === playerId);
    if (idx === -1) return null;
    const removedPlayerId = room.players[idx].id;
    room.players.splice(idx, 1);
    // 방이 비면 삭제
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { room, removedPlayerId };
    }
    // seatIndex 재정렬
    room.players.forEach((p, i) => { p.seatIndex = i; });
    // 방장 승계: 방장이 나간 경우 입장 순서 기준 다음 (per D-12)
    let newHostId: string | undefined;
    if (room.hostId === removedPlayerId) {
      room.hostId = room.players[0].id;
      newHostId = room.players[0].id;
    }
    return { room, removedPlayerId, newHostId };
  }

  /** 연결 끊김 처리 -- isConnected = false 설정 */
  disconnectPlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (player) player.isConnected = false;
  }

  /** 게임 시작 가능 여부 체크 (per D-11) */
  canStartGame(roomId: string, playerId: string): { ok: true } | { ok: false; code: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { ok: false, code: 'ROOM_NOT_FOUND' };
    if (room.hostId !== playerId) return { ok: false, code: 'NOT_HOST' };
    if (room.players.length < 2) return { ok: false, code: 'MIN_PLAYERS' };
    if (room.gamePhase === 'playing') return { ok: false, code: 'GAME_IN_PROGRESS' };
    return { ok: true };
  }

  /** 게임 시작 -- gamePhase를 'playing'으로 전환 */
  startGame(roomId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.gamePhase = 'playing';
    return room;
  }

  /** 초기 칩 유효성 검증 (만원 단위, per INFRA-06) */
  static validateChips(chips: number): boolean {
    return Number.isInteger(chips) && chips > 0 && chips % 10000 === 0;
  }

  /** 재충전 요청 시작 */
  requestRecharge(roomId: string, requesterId: string, amount: number): { requesterId: string; requesterNickname: string; amount: number; totalNeeded: number } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (this.rechargeRequests.has(roomId)) throw new Error('RECHARGE_IN_PROGRESS');
    if (!RoomManager.validateChips(amount)) throw new Error('INVALID_CHIPS');

    const requester = room.players.find(p => p.id === requesterId);
    const requesterNickname = requester ? requester.nickname : '';
    const totalNeeded = room.players.length - 1;

    this.rechargeRequests.set(roomId, {
      requesterId,
      amount,
      votes: new Map(),
      totalNeeded,
    });

    return { requesterId, requesterNickname, amount, totalNeeded };
  }

  /** 재충전 투표 처리 */
  processRechargeVote(roomId: string, voterId: string, approved: boolean): RechargeVoteResult {
    const request = this.rechargeRequests.get(roomId);
    if (!request) throw new Error('RECHARGE_NOT_FOUND');
    if (voterId === request.requesterId) throw new Error('INVALID_ACTION');

    request.votes.set(voterId, approved);

    // 거부 시 즉시 완료
    if (!approved) {
      const requesterId = request.requesterId;
      this.rechargeRequests.delete(roomId);
      return { complete: true, approved: false, requesterId };
    }

    // 전원 찬성 완료 확인
    if (request.votes.size === request.totalNeeded) {
      return { complete: true, approved: true, requesterId: request.requesterId };
    }

    // 아직 미완료
    return { complete: false, votedCount: request.votes.size, totalNeeded: request.totalNeeded };
  }

  /** 재충전 적용 (전원 동의 후 호출) */
  applyRecharge(roomId: string): { requesterId: string; newChips: number } {
    const request = this.rechargeRequests.get(roomId);
    if (!request) throw new Error('RECHARGE_NOT_FOUND');

    const room = this.rooms.get(roomId);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const player = room.players.find(p => p.id === request.requesterId);
    if (player) {
      player.chips += request.amount;
    }
    const newChips = player ? player.chips : 0;

    this.rechargeRequests.delete(roomId);

    return { requesterId: request.requesterId, newChips };
  }

  /** 방 삭제 */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /** 전체 방 수 (디버그/테스트용) */
  get roomCount(): number {
    return this.rooms.size;
  }
}
