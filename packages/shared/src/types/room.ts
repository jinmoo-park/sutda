/** 방에 참여한 플레이어 (게임 시작 전 대기실 상태) */
export interface RoomPlayer {
  id: string;           // socket.id 기반 또는 UUID
  nickname: string;
  chips: number;        // 초기 칩 금액 (만원 단위, 기본 100000)
  seatIndex: number;    // 자리 번호 (0부터, 입장 순서)
  isConnected: boolean; // 현재 연결 상태 (재접속 처리용)
}

/** 방 상태 */
export interface RoomState {
  roomId: string;           // 8자리 UUID 기반 코드 (per D-01)
  hostId: string;           // 방장 플레이어 id (per D-11, D-12)
  players: RoomPlayer[];    // 현재 방에 있는 플레이어 목록
  maxPlayers: number;       // 최대 인원 (6, per INFRA-03)
  gamePhase: 'waiting' | 'playing'; // 대기 vs 게임 진행 중
  createdAt: number;        // Date.now() 타임스탬프
}
