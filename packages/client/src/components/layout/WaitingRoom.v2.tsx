import { useState } from 'react';
import type { RoomState } from '@sutda/shared';
import { useGameStore } from '@/store/gameStore';

// D-09 군용담요 컨셉 — 올리브 드랩 팔레트, 명조 폰트, 각진 군용 UI
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
      className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{
        backgroundColor: 'hsl(70 15% 8%)',
        fontFamily: "'KimjungchulMyungjo', serif",
      }}
    >
      {/* 배경 텍스처 오버레이 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm gap-6">
        {/* 타이틀 이미지 */}
        <img
          src="/img/main_tilte.jpg"
          alt="섯다"
          style={{
            width: '100%',
            maxWidth: '320px',
            height: 'auto',
            objectFit: 'contain',
            filter: 'sepia(20%) brightness(0.9)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/img/main_title_alt.jpg';
          }}
        />

        {/* 구분선 */}
        <div
          className="w-full h-px"
          style={{ backgroundColor: 'hsl(75 55% 42%)', opacity: 0.6 }}
        />

        {/* 방 링크 섹션 */}
        <div className="w-full space-y-2">
          <label
            className="text-xs tracking-widest uppercase"
            style={{ color: 'hsl(70 10% 55%)' }}
          >
            대기실 링크
          </label>
          <div
            className="w-full px-3 py-2 text-xs break-all"
            style={{
              backgroundColor: 'hsl(72 12% 13%)',
              border: '1px solid hsl(72 12% 20%)',
              borderRadius: '2px',
              color: 'hsl(70 10% 55%)',
              fontFamily: 'monospace',
            }}
          >
            {roomUrl}
          </div>
          <button
            onClick={handleCopyUrl}
            className="w-full py-2 text-sm tracking-widest transition-all"
            style={{
              backgroundColor: copied ? 'hsl(75 55% 30%)' : 'transparent',
              color: copied ? 'hsl(75 55% 70%)' : 'hsl(60 20% 92%)',
              border: `1px solid ${copied ? 'hsl(75 55% 42%)' : 'hsl(72 12% 20%)'}`,
              borderRadius: '2px',
              cursor: 'pointer',
              fontFamily: "'KimjungchulMyungjo', serif",
              letterSpacing: '0.05em',
            }}
          >
            {copied ? '복사 완료!' : '링크 복사'}
          </button>
        </div>

        {/* 구분선 */}
        <div
          className="w-full h-px"
          style={{ backgroundColor: 'hsl(72 12% 20%)' }}
        />

        {/* 참가자 목록 */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <label
              className="text-xs tracking-widest uppercase"
              style={{ color: 'hsl(70 10% 55%)' }}
            >
              참가자
            </label>
            <span
              className="text-xs px-2 py-0.5"
              style={{
                backgroundColor: 'hsl(75 55% 42%)',
                color: 'hsl(70 15% 8%)',
                borderRadius: '2px',
                fontFamily: "'KimjungchulMyungjo', serif",
              }}
            >
              {roomState.players.length}명
            </span>
          </div>

          {roomState.players.length === 0 ? (
            <div
              className="w-full py-6 text-center"
              style={{
                border: '1px dashed hsl(72 12% 20%)',
                borderRadius: '2px',
              }}
            >
              <p className="text-sm" style={{ color: 'hsl(70 10% 55%)' }}>
                아직 아무도 없어요
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(70 10% 40%)' }}>
                친구에게 링크를 공유해 보세요
              </p>
            </div>
          ) : (
            <div className="w-full space-y-1">
              {roomState.players.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center px-3 py-2"
                  style={{
                    backgroundColor:
                      p.id === myPlayerId
                        ? 'hsl(75 55% 10%)'
                        : 'hsl(72 12% 11%)',
                    border: `1px solid ${p.id === myPlayerId ? 'hsl(75 55% 25%)' : 'hsl(72 12% 17%)'}`,
                    borderRadius: '2px',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* 순서 번호 */}
                    <span
                      className="text-xs w-4 text-center"
                      style={{ color: 'hsl(70 10% 40%)' }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color:
                          p.id === myPlayerId
                            ? 'hsl(75 55% 65%)'
                            : 'hsl(60 20% 92%)',
                      }}
                    >
                      {p.nickname}
                    </span>
                    {p.id === roomState.hostId && (
                      <span
                        className="text-xs px-1"
                        style={{
                          backgroundColor: 'hsl(75 55% 20%)',
                          color: 'hsl(75 55% 60%)',
                          borderRadius: '2px',
                          border: '1px solid hsl(75 55% 30%)',
                        }}
                      >
                        방장
                      </span>
                    )}
                    {p.id === myPlayerId && (
                      <span
                        className="text-xs"
                        style={{ color: 'hsl(70 10% 50%)' }}
                      >
                        (나)
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm tabular-nums"
                    style={{ color: 'hsl(70 10% 55%)' }}
                  >
                    {p.chips.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div
          className="w-full h-px"
          style={{ backgroundColor: 'hsl(72 12% 20%)' }}
        />

        {/* 게임 시작 / 대기 메시지 */}
        {isHost ? (
          <div className="w-full space-y-2">
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="w-full py-3 text-sm font-semibold tracking-widest uppercase transition-all"
              style={{
                backgroundColor: canStart
                  ? 'hsl(75 55% 42%)'
                  : 'hsl(72 12% 18%)',
                color: canStart ? 'hsl(70 15% 8%)' : 'hsl(70 10% 40%)',
                border: 'none',
                borderRadius: '2px',
                cursor: canStart ? 'pointer' : 'not-allowed',
                fontFamily: "'KimjungchulMyungjo', serif",
                letterSpacing: '0.1em',
              }}
              onMouseEnter={(e) => {
                if (canStart) {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    'hsl(75 55% 50%)';
                }
              }}
              onMouseLeave={(e) => {
                if (canStart) {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    'hsl(75 55% 42%)';
                }
              }}
            >
              게임 시작
            </button>
            {!canStart && (
              <p
                className="text-xs text-center tracking-wide"
                style={{ color: 'hsl(70 10% 45%)' }}
              >
                2명 이상 모이면 시작할 수 있어요
              </p>
            )}
          </div>
        ) : (
          <div
            className="w-full py-3 text-sm text-center"
            style={{
              border: '1px solid hsl(72 12% 20%)',
              borderRadius: '2px',
              color: 'hsl(70 10% 55%)',
              letterSpacing: '0.05em',
            }}
          >
            방장이 게임을 시작할 때까지 대기 중...
          </div>
        )}

        {/* 하단 장식 라인 */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(72 12% 20%)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'hsl(70 10% 35%)' }}>
            ◆
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'hsl(72 12% 20%)' }} />
        </div>
      </div>
    </div>
  );
}
