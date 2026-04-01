import { useState } from 'react';
import type { RoomState } from '@sutda/shared';
import { useGameStore } from '@/store/gameStore';

// D-09 군용담요 컨셉 — Stitch "Tactical Heritage" 레이아웃 기반
// 구조: TopAppBar(ROOM_ID + COPY), player list(rank/chip/badge cards), START GAME 3D brass button
interface WaitingRoomProps {
  roomState: RoomState;
  myPlayerId: string | null;
  roomId: string;
}

export function WaitingRoom({ roomState, myPlayerId, roomId }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const { socket } = useGameStore();

  const roomUrl = window.location.origin + '/room/' + roomId;
  const isHost = myPlayerId === roomState.hostId;
  const canStart = roomState.players.length >= 2;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API 실패 시 무시
    }
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start-game', { roomId });
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{
        fontFamily: "'KimjungchulMyungjo', serif",
        /* Stitch wool-texture: radial dot-grain + dark olive */
        backgroundColor: '#121410',
        backgroundImage: 'radial-gradient(#252a22 0.5px, transparent 0.5px)',
        backgroundSize: '4px 4px',
        position: 'relative',
      }}
    >
      {/* Stitch: 화면 상하단 vignette 오버레이 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(18,20,16,0.4) 0%, rgba(18,20,16,0) 20%, rgba(18,20,16,0) 75%, rgba(18,20,16,0.5) 100%)',
          zIndex: 1,
        }}
      />

      {/* TopAppBar — Stitch: ROOM_ID 헤더 + COPY 버튼 */}
      <header
        className="flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50"
        style={{
          backgroundColor: '#121410',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              fontSize: '18px',
              color: '#e4c379',
              lineHeight: 1,
            }}
          >
            ◆
          </span>
          <h1
            className="font-bold text-base tracking-widest uppercase"
            style={{ color: '#e4c379', fontFamily: "'KimjungchulMyungjo', serif" }}
          >
            ROOM_ID: {roomId.toUpperCase()}
          </h1>
        </div>
        <button
          onClick={handleCopyUrl}
          className="font-bold text-sm px-4 py-1 uppercase tracking-widest transition-all active:translate-y-px"
          style={{
            color: copied ? '#121410' : '#e4c379',
            border: `1px solid ${copied ? '#e4c379' : 'rgba(228,195,121,0.3)'}`,
            backgroundColor: copied ? '#e4c379' : 'transparent',
            borderRadius: '0.125rem',
            cursor: 'pointer',
            fontFamily: "'KimjungchulMyungjo', serif",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(228,195,121,0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }
          }}
        >
          {copied ? '복사됨!' : 'COPY'}
        </button>
      </header>

      {/* Main Content — Stitch: field desk tabletop */}
      <main
        className="flex-1 mt-16 mb-24 overflow-y-auto px-4 py-6 relative"
        style={{ zIndex: 2 }}
      >
        <div className="max-w-sm mx-auto space-y-5">

          {/* 섹션 헤더 — Stitch: stamped label style */}
          <div className="flex items-center gap-2 px-1">
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: '#e4c379', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              ▸ MANIFEST // ACTIVE_PERSONNEL
            </span>
            <span
              className="ml-auto text-xs px-2 py-0.5 font-bold"
              style={{
                backgroundColor: '#e4c379',
                color: '#3f2e00',
                borderRadius: '0.125rem',
                fontFamily: "'KimjungchulMyungjo', serif",
              }}
            >
              {roomState.players.length}명
            </span>
          </div>

          {/* 플레이어 목록 — Stitch: asymmetric player cards */}
          <div className="space-y-3">
            {roomState.players.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10"
                style={{
                  border: '2px dashed rgba(69,72,64,0.3)',
                  borderRadius: '0.125rem',
                  backgroundColor: 'rgba(13,15,11,0.5)',
                }}
              >
                <span
                  className="text-2xl mb-2"
                  style={{ color: '#454840' }}
                >
                  +
                </span>
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  Awaiting Personnel
                </span>
                <span
                  className="text-xs mt-1"
                  style={{ color: '#333531', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  친구에게 링크를 공유하세요
                </span>
              </div>
            ) : (
              roomState.players.map((p, idx) => {
                const isMe = p.id === myPlayerId;
                const isPlayerHost = p.id === roomState.hostId;

                return (
                  <div
                    key={p.id}
                    className="relative transition-all duration-300"
                    style={{
                      backgroundColor: isMe ? '#1a1c18' : '#1e201c',
                      borderLeft: `4px solid ${isMe ? '#e4c379' : isPlayerHost ? '#b69853' : '#454840'}`,
                      padding: '16px 20px',
                      boxShadow: isMe ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        {/* 순번 아이콘 — Stitch: military rank icon area */}
                        <div
                          className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: isMe ? '#423000' : '#292b26',
                            borderRadius: '0.125rem',
                          }}
                        >
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: isMe ? '#e4c379' : '#909288',
                              fontFamily: "'KimjungchulMyungjo', serif",
                            }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div>
                          <h3
                            className="font-bold text-base leading-tight"
                            style={{
                              color: isMe ? '#e4c379' : '#e3e3dc',
                              fontFamily: "'KimjungchulMyungjo', serif",
                              opacity: isMe ? 1 : 0.85,
                            }}
                          >
                            {p.nickname}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className="text-xs font-bold"
                              style={{
                                color: isMe ? '#b69853' : '#909288',
                                fontFamily: "'KimjungchulMyungjo', serif',",
                              }}
                            >
                              {p.chips.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 배지 영역 — Stitch: HOST/ME status badges */}
                      <div className="flex flex-col items-end gap-1.5">
                        {isPlayerHost && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 tracking-tight uppercase"
                            style={{
                              backgroundColor: '#e4c379',
                              color: '#3f2e00',
                              borderRadius: '0.125rem',
                              fontFamily: "'KimjungchulMyungjo', serif",
                            }}
                          >
                            HOST
                          </span>
                        )}
                        {isMe && !isPlayerHost && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 tracking-tight uppercase"
                            style={{
                              backgroundColor: '#444c32',
                              color: '#b4bc9b',
                              borderRadius: '0.125rem',
                              fontFamily: "'KimjungchulMyungjo', serif",
                            }}
                          >
                            ME
                          </span>
                        )}
                        {isMe && isPlayerHost && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 tracking-tight uppercase"
                            style={{
                              backgroundColor: '#444c32',
                              color: '#b4bc9b',
                              borderRadius: '0.125rem',
                              fontFamily: "'KimjungchulMyungjo', serif",
                            }}
                          >
                            ME
                          </span>
                        )}
                        {/* 진행 바 — Stitch: 플레이어 준비 상태 인디케이터 */}
                        <div
                          className="h-1 rounded-full overflow-hidden"
                          style={{
                            width: '48px',
                            backgroundColor: isMe ? 'rgba(228,195,121,0.2)' : 'rgba(69,72,64,0.2)',
                          }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: '100%',
                              backgroundColor: isMe ? '#e4c379' : '#454840',
                              boxShadow: isMe ? '0 0 8px #e4c379' : 'none',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* 빈 슬롯 — Stitch: dashed placeholder */}
            {roomState.players.length > 0 && roomState.players.length < 6 && (
              <div
                className="flex flex-col items-center justify-center py-4 opacity-30"
                style={{
                  border: '2px dashed rgba(69,72,64,0.3)',
                  borderRadius: '0.125rem',
                  backgroundColor: 'rgba(13,15,11,0.5)',
                }}
              >
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  + Awaiting Reinf.
                </span>
              </div>
            )}
          </div>

          {/* 전술 정보 섹션 — Stitch: ambient tactical decor */}
          <div
            className="mt-6 flex justify-between items-center px-2 py-3"
            style={{
              borderTop: '1px solid rgba(69,72,64,0.2)',
            }}
          >
            <div className="flex flex-col">
              <span
                className="text-xs font-bold tracking-widest uppercase mb-0.5"
                style={{ color: '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
              >
                PERSONNEL
              </span>
              <span
                className="text-base font-bold"
                style={{ color: '#909288', fontFamily: "'KimjungchulMyungjo', serif" }}
              >
                {roomState.players.length} / 6 인원
              </span>
            </div>
            <span
              className="text-xs tracking-widest"
              style={{ color: '#333531', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              ◆ ◆ ◆
            </span>
          </div>
        </div>
      </main>

      {/* 하단 고정 — 방장: START GAME / 참여자: 대기 메시지 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 z-50"
        style={{
          backgroundColor: 'rgba(18,20,16,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(69,72,64,0.2)',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.4)',
        }}
      >
        {isHost ? (
          <div className="max-w-sm mx-auto space-y-2">
            {/* START GAME — Stitch: brass primary CTA with 3D shadow offset */}
            <div className="relative">
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: '#3f2e00',
                  transform: 'translate(3px, 3px)',
                  borderRadius: '0.125rem',
                }}
              />
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className="relative w-full flex items-center justify-between px-6 py-5 transition-all active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  background: canStart
                    ? 'linear-gradient(135deg, #e4c379 0%, #b69853 100%)'
                    : '#292b26',
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  borderLeft: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '0.125rem',
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  fontFamily: "'KimjungchulMyungjo', serif",
                }}
              >
                <div className="flex flex-col items-start">
                  <span
                    className="text-xs font-bold tracking-[0.3em] uppercase mb-0.5"
                    style={{
                      color: canStart ? 'rgba(63,46,0,0.6)' : '#454840',
                      fontFamily: "'KimjungchulMyungjo', serif",
                    }}
                  >
                    Initialize Engagement
                  </span>
                  <span
                    className="text-xl font-black tracking-tight uppercase"
                    style={{
                      color: canStart ? '#3f2e00' : '#454840',
                      fontFamily: "'KimjungchulMyungjo', serif",
                    }}
                  >
                    게임 시작
                  </span>
                </div>
                <span
                  style={{
                    color: canStart ? '#3f2e00' : '#454840',
                    fontSize: '28px',
                  }}
                >
                  ▶▶
                </span>
              </button>
            </div>
            {!canStart && (
              <p
                className="text-center text-xs tracking-wide"
                style={{ color: '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
              >
                2명 이상 모이면 시작할 수 있어요
              </p>
            )}
          </div>
        ) : (
          <div
            className="max-w-sm mx-auto py-4 text-center"
            style={{
              border: '1px solid rgba(69,72,64,0.3)',
              borderRadius: '0.125rem',
              backgroundColor: '#1a1c18',
            }}
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: '#909288', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              ▸ PROTOCOL ALPHA-9 // 방장 대기 중...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
