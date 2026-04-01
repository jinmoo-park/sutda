import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '@/store/gameStore';

// D-09 군용담요 컨셉 — 올리브 드랩 팔레트, 명조 폰트, 각진 군용 UI
export function MainPage() {
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [initialChips, setInitialChips] = useState(100000);
  const navigate = useNavigate();
  const { connect, socket } = useGameStore();

  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  // 마운트 시 미리 연결 — 클릭 시 lazy-connect는 race condition 유발
  useEffect(() => {
    connect(serverUrl);
  }, [connect, serverUrl]);

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      toast.error('닉네임을 입력해 주세요.');
      return;
    }
    const s = useGameStore.getState().socket;
    if (!s) {
      toast.error('서버에 연결 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    s.emit('create-room', { nickname: nickname.trim(), initialChips });
    s.once('room-created', ({ roomId }) => {
      navigate(`/room/${roomId}`, { state: { nickname: nickname.trim(), initialChips, isHost: true } });
    });
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      toast.error('닉네임을 입력해 주세요.');
      return;
    }
    if (!roomId.trim()) {
      toast.error('방 코드를 입력해 주세요.');
      return;
    }
    navigate(`/room/${roomId.trim()}`, { state: { nickname: nickname.trim(), initialChips } });
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{
        backgroundColor: 'hsl(70 15% 8%)',
        fontFamily: "'KimjungchulMyungjo', serif",
      }}
    >
      {/* 배경 텍스처 오버레이 — 군용담요 캔버스 느낌 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm gap-8">
        {/* 타이틀 이미지 */}
        <div className="w-full">
          <img
            src="/img/main_tilte.jpg"
            alt="섯다"
            style={{
              width: '100%',
              maxWidth: '480px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'sepia(20%) brightness(0.9)',
            }}
            onError={(e) => {
              // fallback to alt title image
              (e.target as HTMLImageElement).src = '/img/main_title_alt.jpg';
            }}
          />
        </div>

        {/* 구분선 — 군용 장비 패널 느낌 */}
        <div
          className="w-full h-px"
          style={{ backgroundColor: 'hsl(75 55% 42%)', opacity: 0.6 }}
        />

        {/* 메인 폼 */}
        {mode === 'home' && (
          <div className="w-full space-y-4">
            {/* 닉네임 입력 */}
            <div className="space-y-1">
              <label
                className="text-xs tracking-widest uppercase"
                style={{ color: 'hsl(70 10% 55%)' }}
              >
                호칭
              </label>
              <input
                type="text"
                placeholder="닉네임 입력"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={10}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'hsl(72 12% 13%)',
                  border: '1px solid hsl(72 12% 20%)',
                  borderRadius: '2px',
                  color: 'hsl(60 20% 92%)',
                  fontFamily: "'KimjungchulMyungjo', serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'hsl(75 55% 42%)';
                  e.target.style.boxShadow = '0 0 0 1px hsl(75 55% 42%)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'hsl(72 12% 20%)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 초기 칩 금액 */}
            <div className="space-y-1">
              <label
                className="text-xs tracking-widest uppercase"
                style={{ color: 'hsl(70 10% 55%)' }}
              >
                초기 칩 (원)
              </label>
              <input
                type="number"
                value={initialChips}
                min={10000}
                step={10000}
                onChange={(e) => setInitialChips(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'hsl(72 12% 13%)',
                  border: '1px solid hsl(72 12% 20%)',
                  borderRadius: '2px',
                  color: 'hsl(60 20% 92%)',
                  fontFamily: "'KimjungchulMyungjo', serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'hsl(75 55% 42%)';
                  e.target.style.boxShadow = '0 0 0 1px hsl(75 55% 42%)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'hsl(72 12% 20%)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 방 만들기 버튼 — 올리브 그린 primary */}
            <button
              onClick={handleCreateRoom}
              disabled={!socket}
              className="w-full py-3 text-sm font-semibold tracking-widest uppercase transition-all"
              style={{
                backgroundColor: socket ? 'hsl(75 55% 42%)' : 'hsl(72 12% 18%)',
                color: socket ? 'hsl(70 15% 8%)' : 'hsl(70 10% 40%)',
                border: 'none',
                borderRadius: '2px',
                cursor: socket ? 'pointer' : 'not-allowed',
                fontFamily: "'KimjungchulMyungjo', serif",
                letterSpacing: '0.1em',
              }}
              onMouseEnter={(e) => {
                if (socket) {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    'hsl(75 55% 50%)';
                }
              }}
              onMouseLeave={(e) => {
                if (socket) {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    'hsl(75 55% 42%)';
                }
              }}
            >
              {socket ? '방 만들기' : '연결 중...'}
            </button>

            {/* 링크로 참여 버튼 — secondary */}
            <button
              onClick={() => setMode('join')}
              className="w-full py-3 text-sm tracking-widest transition-all"
              style={{
                backgroundColor: 'transparent',
                color: 'hsl(60 20% 92%)',
                border: '1px solid hsl(72 12% 20%)',
                borderRadius: '2px',
                cursor: 'pointer',
                fontFamily: "'KimjungchulMyungjo', serif",
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.borderColor =
                  'hsl(75 55% 42%)';
                (e.target as HTMLButtonElement).style.color = 'hsl(75 55% 42%)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.borderColor =
                  'hsl(72 12% 20%)';
                (e.target as HTMLButtonElement).style.color = 'hsl(60 20% 92%)';
              }}
            >
              링크로 참여
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="w-full space-y-4">
            {/* 닉네임 입력 */}
            <div className="space-y-1">
              <label
                className="text-xs tracking-widest uppercase"
                style={{ color: 'hsl(70 10% 55%)' }}
              >
                호칭
              </label>
              <input
                type="text"
                placeholder="닉네임 입력"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={10}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'hsl(72 12% 13%)',
                  border: '1px solid hsl(72 12% 20%)',
                  borderRadius: '2px',
                  color: 'hsl(60 20% 92%)',
                  fontFamily: "'KimjungchulMyungjo', serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'hsl(75 55% 42%)';
                  e.target.style.boxShadow = '0 0 0 1px hsl(75 55% 42%)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'hsl(72 12% 20%)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 방 코드 입력 */}
            <div className="space-y-1">
              <label
                className="text-xs tracking-widest uppercase"
                style={{ color: 'hsl(70 10% 55%)' }}
              >
                방 코드
              </label>
              <input
                type="text"
                placeholder="방 코드 입력"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'hsl(72 12% 13%)',
                  border: '1px solid hsl(72 12% 20%)',
                  borderRadius: '2px',
                  color: 'hsl(60 20% 92%)',
                  fontFamily: "'KimjungchulMyungjo', serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'hsl(75 55% 42%)';
                  e.target.style.boxShadow = '0 0 0 1px hsl(75 55% 42%)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'hsl(72 12% 20%)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 초기 칩 금액 */}
            <div className="space-y-1">
              <label
                className="text-xs tracking-widest uppercase"
                style={{ color: 'hsl(70 10% 55%)' }}
              >
                초기 칩 (원)
              </label>
              <input
                type="number"
                value={initialChips}
                min={10000}
                step={10000}
                onChange={(e) => setInitialChips(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'hsl(72 12% 13%)',
                  border: '1px solid hsl(72 12% 20%)',
                  borderRadius: '2px',
                  color: 'hsl(60 20% 92%)',
                  fontFamily: "'KimjungchulMyungjo', serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'hsl(75 55% 42%)';
                  e.target.style.boxShadow = '0 0 0 1px hsl(75 55% 42%)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'hsl(72 12% 20%)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* 참여하기 버튼 */}
            <button
              onClick={handleJoinRoom}
              className="w-full py-3 text-sm font-semibold tracking-widest uppercase transition-all"
              style={{
                backgroundColor: 'hsl(75 55% 42%)',
                color: 'hsl(70 15% 8%)',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontFamily: "'KimjungchulMyungjo', serif",
                letterSpacing: '0.1em',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  'hsl(75 55% 50%)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  'hsl(75 55% 42%)';
              }}
            >
              참여하기
            </button>

            {/* 뒤로 버튼 */}
            <button
              onClick={() => setMode('home')}
              className="w-full py-2 text-sm tracking-wide transition-all"
              style={{
                backgroundColor: 'transparent',
                color: 'hsl(70 10% 55%)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'KimjungchulMyungjo', serif",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = 'hsl(60 20% 92%)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = 'hsl(70 10% 55%)';
              }}
            >
              ← 뒤로
            </button>
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

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            backgroundColor: 'hsl(72 12% 13%)',
            border: '1px solid hsl(72 12% 20%)',
            color: 'hsl(60 20% 92%)',
            fontFamily: "'KimjungchulMyungjo', serif",
          },
        }}
      />
    </div>
  );
}
