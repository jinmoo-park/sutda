import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from './room-manager.js';

describe('RoomManager', () => {
  let rm: RoomManager;

  beforeEach(() => {
    rm = new RoomManager();
  });

  describe('createRoom', () => {
    it('8자리 roomId를 가진 방을 생성한다', () => {
      const room = rm.createRoom('host-1', '방장', 100000);
      expect(room.roomId).toHaveLength(8);
      expect(room.hostId).toBe('host-1');
      expect(room.players).toHaveLength(1);
      expect(room.players[0].nickname).toBe('방장');
      expect(room.players[0].chips).toBe(100000);
      expect(room.players[0].seatIndex).toBe(0);
      expect(room.gamePhase).toBe('waiting');
      expect(room.maxPlayers).toBe(6);
    });

    it('생성된 방을 getRoom으로 조회할 수 있다', () => {
      const room = rm.createRoom('host-1', '방장', 100000);
      expect(rm.getRoom(room.roomId)).toBe(room);
    });

    it('roomCount가 증가한다', () => {
      expect(rm.roomCount).toBe(0);
      rm.createRoom('h1', 'A', 100000);
      expect(rm.roomCount).toBe(1);
      rm.createRoom('h2', 'B', 100000);
      expect(rm.roomCount).toBe(2);
    });
  });

  describe('joinRoom', () => {
    it('방에 플레이어를 추가한다 (INFRA-02)', () => {
      const room = rm.createRoom('host', '방장', 100000);
      const { player } = rm.joinRoom(room.roomId, 'p2', '참여자', 50000);
      expect(player.nickname).toBe('참여자');
      expect(player.chips).toBe(50000);
      expect(player.seatIndex).toBe(1);
      expect(rm.getRoom(room.roomId)!.players).toHaveLength(2);
    });

    it('존재하지 않는 방에 참여하면 ROOM_NOT_FOUND 에러 (INFRA-02)', () => {
      expect(() => rm.joinRoom('nonexist', 'p1', 'A', 100000)).toThrow('ROOM_NOT_FOUND');
    });

    it('7번째 플레이어는 ROOM_FULL 에러 (INFRA-03)', () => {
      const room = rm.createRoom('h', '방장', 100000);
      for (let i = 1; i <= 5; i++) {
        rm.joinRoom(room.roomId, `p${i}`, `P${i}`, 100000);
      }
      expect(rm.getRoom(room.roomId)!.players).toHaveLength(6);
      expect(() => rm.joinRoom(room.roomId, 'p7', 'P7', 100000)).toThrow('ROOM_FULL');
    });

    it('대기실에서 동일 닉네임은 NICKNAME_TAKEN 에러 (D-06)', () => {
      const room = rm.createRoom('h', '방장', 100000);
      expect(() => rm.joinRoom(room.roomId, 'p2', '방장', 100000)).toThrow('NICKNAME_TAKEN');
    });

    it('게임 중 같은 닉네임으로 재접속하면 기존 자리로 복귀 (INFRA-05, D-05)', () => {
      const room = rm.createRoom('h', '방장', 100000);
      rm.joinRoom(room.roomId, 'p2', '참여자', 100000);
      rm.startGame(room.roomId);
      // 재접속: 새 소켓 ID로 같은 닉네임
      const { player } = rm.joinRoom(room.roomId, 'new-socket', '참여자', 100000);
      expect(player.id).toBe('new-socket');
      expect(player.seatIndex).toBe(1);
      expect(player.isConnected).toBe(true);
    });

    it('게임 중 새로운 닉네임은 GAME_IN_PROGRESS 에러 (D-05)', () => {
      const room = rm.createRoom('h', '방장', 100000);
      rm.joinRoom(room.roomId, 'p2', '참여자', 100000);
      rm.startGame(room.roomId);
      expect(() => rm.joinRoom(room.roomId, 'p3', '신규', 100000)).toThrow('GAME_IN_PROGRESS');
    });
  });

  describe('leaveRoom', () => {
    it('플레이어를 제거하고 seatIndex를 재정렬한다', () => {
      const room = rm.createRoom('h', 'A', 100000);
      rm.joinRoom(room.roomId, 'p2', 'B', 100000);
      rm.joinRoom(room.roomId, 'p3', 'C', 100000);
      rm.leaveRoom(room.roomId, 'p2');
      const updated = rm.getRoom(room.roomId)!;
      expect(updated.players).toHaveLength(2);
      expect(updated.players.map(p => p.seatIndex)).toEqual([0, 1]);
    });

    it('방장이 나가면 다음 플레이어가 방장이 된다 (D-12)', () => {
      const room = rm.createRoom('h', 'A', 100000);
      rm.joinRoom(room.roomId, 'p2', 'B', 100000);
      const result = rm.leaveRoom(room.roomId, 'h');
      expect(result!.newHostId).toBe('p2');
      expect(rm.getRoom(room.roomId)!.hostId).toBe('p2');
    });

    it('마지막 플레이어가 나가면 방이 삭제된다', () => {
      const room = rm.createRoom('h', 'A', 100000);
      rm.leaveRoom(room.roomId, 'h');
      expect(rm.getRoom(room.roomId)).toBeUndefined();
      expect(rm.roomCount).toBe(0);
    });
  });

  describe('disconnectPlayer', () => {
    it('isConnected를 false로 설정한다', () => {
      const room = rm.createRoom('h', 'A', 100000);
      rm.disconnectPlayer(room.roomId, 'h');
      expect(rm.getRoom(room.roomId)!.players[0].isConnected).toBe(false);
    });
  });

  describe('canStartGame', () => {
    it('방장이고 2명 이상이면 시작 가능', () => {
      const room = rm.createRoom('h', 'A', 100000);
      rm.joinRoom(room.roomId, 'p2', 'B', 100000);
      expect(rm.canStartGame(room.roomId, 'h')).toEqual({ ok: true });
    });

    it('방장이 아니면 NOT_HOST', () => {
      const room = rm.createRoom('h', 'A', 100000);
      rm.joinRoom(room.roomId, 'p2', 'B', 100000);
      expect(rm.canStartGame(room.roomId, 'p2')).toEqual({ ok: false, code: 'NOT_HOST' });
    });

    it('1명이면 MIN_PLAYERS', () => {
      const room = rm.createRoom('h', 'A', 100000);
      expect(rm.canStartGame(room.roomId, 'h')).toEqual({ ok: false, code: 'MIN_PLAYERS' });
    });

    it('이미 게임 중이면 GAME_IN_PROGRESS', () => {
      const room = rm.createRoom('h', 'A', 100000);
      rm.joinRoom(room.roomId, 'p2', 'B', 100000);
      rm.startGame(room.roomId);
      expect(rm.canStartGame(room.roomId, 'h')).toEqual({ ok: false, code: 'GAME_IN_PROGRESS' });
    });
  });

  describe('validateChips (INFRA-06)', () => {
    it('만원 단위는 유효', () => {
      expect(RoomManager.validateChips(10000)).toBe(true);
      expect(RoomManager.validateChips(100000)).toBe(true);
      expect(RoomManager.validateChips(50000)).toBe(true);
    });

    it('만원 단위가 아니면 무효', () => {
      expect(RoomManager.validateChips(5000)).toBe(false);
      expect(RoomManager.validateChips(15000)).toBe(false);
      expect(RoomManager.validateChips(0)).toBe(false);
      expect(RoomManager.validateChips(-10000)).toBe(false);
      expect(RoomManager.validateChips(10001)).toBe(false);
    });
  });

  describe('재충전 플로우', () => {
    let roomId: string;

    beforeEach(() => {
      const room = rm.createRoom('player1-id', '플레이어1', 10000);
      roomId = room.roomId;
      rm.joinRoom(roomId, 'player2-id', '플레이어2', 100000);
    });

    describe('requestRecharge', () => {
      it('유효한 요청 시 rechargeRequest 상태가 생성된다', () => {
        const result = rm.requestRecharge(roomId, 'player1-id', 50000);
        expect(result.requesterId).toBe('player1-id');
        expect(result.requesterNickname).toBe('플레이어1');
        expect(result.amount).toBe(50000);
        expect(result.totalNeeded).toBe(1); // player2만 투표 필요
      });

      it('이미 진행 중인 재충전 요청이 있으면 RECHARGE_IN_PROGRESS 에러', () => {
        rm.requestRecharge(roomId, 'player1-id', 50000);
        expect(() => rm.requestRecharge(roomId, 'player1-id', 50000)).toThrow('RECHARGE_IN_PROGRESS');
      });

      it('amount가 만원 단위가 아니면 INVALID_CHIPS 에러', () => {
        expect(() => rm.requestRecharge(roomId, 'player1-id', 5000)).toThrow('INVALID_CHIPS');
        expect(() => rm.requestRecharge(roomId, 'player1-id', 15000)).toThrow('INVALID_CHIPS');
        expect(() => rm.requestRecharge(roomId, 'player1-id', 0)).toThrow('INVALID_CHIPS');
      });

      it('존재하지 않는 방이면 ROOM_NOT_FOUND 에러', () => {
        expect(() => rm.requestRecharge('nonexist', 'player1-id', 50000)).toThrow('ROOM_NOT_FOUND');
      });
    });

    describe('processRechargeVote', () => {
      beforeEach(() => {
        rm.requestRecharge(roomId, 'player1-id', 50000);
      });

      it('전원 동의(approved=true) 시 { complete: true, approved: true, requesterId } 반환', () => {
        const result = rm.processRechargeVote(roomId, 'player2-id', true);
        expect(result).toEqual({ complete: true, approved: true, requesterId: 'player1-id' });
      });

      it('1명 거부(approved=false) 시 즉시 { complete: true, approved: false, requesterId } 반환', () => {
        const result = rm.processRechargeVote(roomId, 'player2-id', false);
        expect(result).toEqual({ complete: true, approved: false, requesterId: 'player1-id' });
      });

      it('거부 시 result.requesterId가 요청자(player1-id)의 ID이어야 한다 (투표자 ID가 아님)', () => {
        const result = rm.processRechargeVote(roomId, 'player2-id', false);
        expect(result.complete).toBe(true);
        if (result.complete) {
          expect(result.requesterId).toBe('player1-id');
          expect(result.requesterId).not.toBe('player2-id');
        }
      });

      it('아직 투표 완료 아닌 경우 { complete: false, votedCount, totalNeeded } 반환', () => {
        // 3명 방에서 2명 투표 필요한 경우 테스트
        rm.joinRoom(roomId, 'player3-id', '플레이어3', 100000);
        const rm2 = new RoomManager();
        const room2 = rm2.createRoom('p1', '플1', 100000);
        rm2.joinRoom(room2.roomId, 'p2', '플2', 100000);
        rm2.joinRoom(room2.roomId, 'p3', '플3', 100000);
        rm2.requestRecharge(room2.roomId, 'p1', 50000);
        const result = rm2.processRechargeVote(room2.roomId, 'p2', true);
        expect(result).toEqual({ complete: false, votedCount: 1, totalNeeded: 2 });
      });

      it('요청자 본인은 투표 불가 (INVALID_ACTION 에러)', () => {
        expect(() => rm.processRechargeVote(roomId, 'player1-id', true)).toThrow('INVALID_ACTION');
      });

      it('재충전 요청이 없으면 RECHARGE_NOT_FOUND 에러', () => {
        const rm2 = new RoomManager();
        const room2 = rm2.createRoom('p1', '플1', 100000);
        rm2.joinRoom(room2.roomId, 'p2', '플2', 100000);
        expect(() => rm2.processRechargeVote(room2.roomId, 'p2', true)).toThrow('RECHARGE_NOT_FOUND');
      });
    });

    describe('applyRecharge', () => {
      it('승인 시 요청자 chips += amount 반환', () => {
        rm.requestRecharge(roomId, 'player1-id', 50000);
        rm.processRechargeVote(roomId, 'player2-id', true);
        const result = rm.applyRecharge(roomId);
        expect(result.requesterId).toBe('player1-id');
        expect(result.newChips).toBe(60000); // 10000 + 50000
      });

      it('applyRecharge 후 rechargeRequest가 제거된다 (다시 requestRecharge 가능)', () => {
        rm.requestRecharge(roomId, 'player1-id', 50000);
        rm.processRechargeVote(roomId, 'player2-id', true);
        rm.applyRecharge(roomId);
        // 제거 확인 — 다시 요청 가능
        expect(() => rm.requestRecharge(roomId, 'player1-id', 30000)).not.toThrow();
      });

      it('재충전 요청이 없으면 RECHARGE_NOT_FOUND 에러', () => {
        expect(() => rm.applyRecharge(roomId)).toThrow('RECHARGE_NOT_FOUND');
      });
    });
  });
});
