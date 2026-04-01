import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '@/store/gameStore';

// D-09 군용담요 컨셉 — Stitch 기반 레이아웃
// 레이아웃 구조: Stitch "Iron & Felt" 디자인 시스템 기반
// wool-texture 배경, brass gradient CTA, surface layering, 군용 UI 언어
export function MainPage() {
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [initialChips, setInitialChips] = useState(100000);
  const navigate = useNavigate();
  const { connect, socket } = useGameStore();

  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

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
    s.once('room-created', ({ roomId: newRoomId }: { roomId: string }) => {
      navigate(`/room/${newRoomId}`, {
        state: { nickname: nickname.trim(), initialChips, isHost: true },
      });
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
    navigate(`/room/${roomId.trim()}`, {
      state: { nickname: nickname.trim(), initialChips },
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{
        fontFamily: "'KimjungchulMyungjo', serif",
        /* Stitch wool-texture: dot-pattern grain + dark olive base */
        backgroundColor: '#121410',
        backgroundImage: 'radial-gradient(#252a22 0.5px, transparent 0.5px)',
        backgroundSize: '4px 4px',
        position: 'relative',
      }}
    >
      {/* Stitch 渐变 오버레이 — 화면 상하단 vignet */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(18,20,16,0.3) 0%, rgba(18,20,16,0) 30%, rgba(18,20,16,0) 70%, rgba(18,20,16,0.5) 100%)',
          zIndex: 1,
        }}
      />

      {/* TopAppBar — Stitch 패턴: 어두운 고정 헤더, 작전명 스타일 */}
      <header
        className="flex justify-between items-center px-6 h-14 w-full fixed top-0 z-50"
        style={{
          backgroundColor: '#0d0f0b',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold tracking-[0.3em] uppercase"
            style={{ color: '#e4c379', fontFamily: "'KimjungchulMyungjo', serif" }}
          >
            ◆ 섯다
          </span>
        </div>
        {/* 연결 상태 표시 — 군용 장비 인디케이터 */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: socket ? '#4ade80' : '#ef4444',
              boxShadow: socket ? '0 0 6px #4ade80' : 'none',
            }}
          />
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: socket ? '#909288' : '#ef4444', fontFamily: "'KimjungchulMyungjo', serif" }}
          >
            {socket ? 'ONLINE' : 'CONN...'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-14 pb-6 relative" style={{ zIndex: 2 }}>
        <div className="w-full max-w-sm px-4">

          {/* 타이틀 이미지 영역 — Stitch: 전체 너비, 어두운 오버레이 */}
          <div className="relative w-full mb-0 overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <img
              src="/img/main_tilte.jpg"
              alt="섯다"
              className="w-full h-full object-cover"
              style={{
                filter: 'sepia(30%) brightness(0.75) contrast(1.1)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/main_title_alt.jpg';
              }}
            />
            {/* Stitch: 이미지 하단 페이드 그라디언트 */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(18,20,16,0.1) 0%, rgba(18,20,16,0) 40%, rgba(18,20,16,0.7) 100%)',
              }}
            />
          </div>

          {/* 섹션 헤더 — Stitch: 스탬프 레이블 스타일 */}
          <div
            className="flex items-center gap-2 px-2 py-3"
            style={{ backgroundColor: '#1a1c18' }}
          >
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: '#e4c379', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              ▸ ENTRY // COMMAND INIT
            </span>
          </div>

          {/* 폼 영역 — Stitch: surface-container-low 배경 */}
          {mode === 'home' && (
            <div
              className="px-5 py-6 space-y-5"
              style={{ backgroundColor: '#1a1c18' }}
            >
              {/* 닉네임 입력 — Stitch: surface-container-lowest "sunken" 필드 */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: '#909288', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  호칭 // HANDLE
                </label>
                <input
                  type="text"
                  placeholder="닉네임 입력"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={10}
                  className="w-full px-3 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#0d0f0b',
                    border: '1px solid rgba(69, 72, 64, 0.4)',
                    borderRadius: '0.125rem',
                    color: '#e3e3dc',
                    fontFamily: "'KimjungchulMyungjo', serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#e4c379';
                    e.target.style.boxShadow = '0 0 0 1px #e4c379';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(69, 72, 64, 0.4)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* 초기 칩 — Stitch: 동일한 sunken 필드 패턴 */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: '#909288', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  초기 칩 // STAKE_INIT (원)
                </label>
                <input
                  type="number"
                  value={initialChips}
                  min={10000}
                  step={10000}
                  onChange={(e) => setInitialChips(Number(e.target.value))}
                  className="w-full px-3 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#0d0f0b',
                    border: '1px solid rgba(69, 72, 64, 0.4)',
                    borderRadius: '0.125rem',
                    color: '#e3e3dc',
                    fontFamily: "'KimjungchulMyungjo', serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#e4c379';
                    e.target.style.boxShadow = '0 0 0 1px #e4c379';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(69, 72, 64, 0.4)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* 방 만들기 버튼 — Stitch: brass gradient primary CTA with 3D shadow offset */}
              <div className="pt-2 relative">
                {/* 3D 오프셋 그림자 — Stitch 패턴 */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: '#3f2e00',
                    transform: 'translate(3px, 3px)',
                    borderRadius: '0.125rem',
                  }}
                />
                <button
                  onClick={handleCreateRoom}
                  disabled={!socket}
                  className="relative w-full py-5 flex items-center justify-between px-6 transition-all active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    background: socket
                      ? 'linear-gradient(135deg, #e4c379 0%, #b69853 100%)'
                      : '#292b26',
                    borderTop: '1px solid rgba(255,255,255,0.15)',
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '0.125rem',
                    cursor: socket ? 'pointer' : 'not-allowed',
                    fontFamily: "'KimjungchulMyungjo', serif",
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span
                      className="text-xs font-bold tracking-[0.3em] uppercase mb-0.5"
                      style={{ color: socket ? 'rgba(63,46,0,0.6)' : '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
                    >
                      Initialize Session
                    </span>
                    <span
                      className="text-xl font-black tracking-tight uppercase"
                      style={{ color: socket ? '#3f2e00' : '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
                    >
                      {socket ? '방 만들기' : '연결 중...'}
                    </span>
                  </div>
                  <span style={{ color: socket ? '#3f2e00' : '#454840', fontSize: '28px' }}>▶▶</span>
                </button>
              </div>

              {/* 링크로 참여 버튼 — Stitch: secondary drab action */}
              <button
                onClick={() => setMode('join')}
                className="w-full py-3 px-6 text-sm tracking-widest transition-all"
                style={{
                  backgroundColor: '#292b26',
                  color: '#b69853',
                  border: '1px solid rgba(228, 195, 121, 0.2)',
                  borderRadius: '0.125rem',
                  cursor: 'pointer',
                  fontFamily: "'KimjungchulMyungjo', serif",
                  letterSpacing: '0.1em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#333531';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(228, 195, 121, 0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#292b26';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(228, 195, 121, 0.2)';
                }}
              >
                링크로 참여
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div
              className="px-5 py-6 space-y-5"
              style={{ backgroundColor: '#1a1c18' }}
            >
              {/* 닉네임 */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: '#909288', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  호칭 // HANDLE
                </label>
                <input
                  type="text"
                  placeholder="닉네임 입력"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={10}
                  className="w-full px-3 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#0d0f0b',
                    border: '1px solid rgba(69, 72, 64, 0.4)',
                    borderRadius: '0.125rem',
                    color: '#e3e3dc',
                    fontFamily: "'KimjungchulMyungjo', serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#e4c379';
                    e.target.style.boxShadow = '0 0 0 1px #e4c379';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(69, 72, 64, 0.4)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* 방 코드 */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: '#909288', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  방 코드 // ROOM_ID
                </label>
                <input
                  type="text"
                  placeholder="방 코드 입력"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#0d0f0b',
                    border: '1px solid rgba(69, 72, 64, 0.4)',
                    borderRadius: '0.125rem',
                    color: '#e3e3dc',
                    fontFamily: "'KimjungchulMyungjo', serif",
                    letterSpacing: '0.15em',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#e4c379';
                    e.target.style.boxShadow = '0 0 0 1px #e4c379';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(69, 72, 64, 0.4)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* 초기 칩 */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: '#909288', fontFamily: "'KimjungchulMyungjo', serif" }}
                >
                  초기 칩 // STAKE_INIT (원)
                </label>
                <input
                  type="number"
                  value={initialChips}
                  min={10000}
                  step={10000}
                  onChange={(e) => setInitialChips(Number(e.target.value))}
                  className="w-full px-3 py-3 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#0d0f0b',
                    border: '1px solid rgba(69, 72, 64, 0.4)',
                    borderRadius: '0.125rem',
                    color: '#e3e3dc',
                    fontFamily: "'KimjungchulMyungjo', serif",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#e4c379';
                    e.target.style.boxShadow = '0 0 0 1px #e4c379';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(69, 72, 64, 0.4)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* 참여 버튼 — Stitch brass primary */}
              <div className="pt-2 relative">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: '#3f2e00',
                    transform: 'translate(3px, 3px)',
                    borderRadius: '0.125rem',
                  }}
                />
                <button
                  onClick={handleJoinRoom}
                  className="relative w-full py-5 flex items-center justify-between px-6 transition-all active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #e4c379 0%, #b69853 100%)',
                    borderTop: '1px solid rgba(255,255,255,0.15)',
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '0.125rem',
                    cursor: 'pointer',
                    fontFamily: "'KimjungchulMyungjo', serif",
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span
                      className="text-xs font-bold tracking-[0.3em] uppercase mb-0.5"
                      style={{ color: 'rgba(63,46,0,0.6)', fontFamily: "'KimjungchulMyungjo', serif" }}
                    >
                      Join Operation
                    </span>
                    <span
                      className="text-xl font-black tracking-tight uppercase"
                      style={{ color: '#3f2e00', fontFamily: "'KimjungchulMyungjo', serif" }}
                    >
                      참여하기
                    </span>
                  </div>
                  <span style={{ color: '#3f2e00', fontSize: '28px' }}>▶▶</span>
                </button>
              </div>

              {/* 뒤로 — Stitch tertiary ghost button */}
              <button
                onClick={() => setMode('home')}
                className="w-full py-2 text-sm tracking-wide transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: '#909288',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'KimjungchulMyungjo', serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#e3e3dc';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#909288';
                }}
              >
                ← 뒤로
              </button>
            </div>
          )}

          {/* 하단 장식 — Stitch: 섹션 정보 영역 */}
          <div
            className="mt-0 flex justify-between items-center px-5 py-3"
            style={{ backgroundColor: '#1a1c18', borderTop: '1px solid rgba(69,72,64,0.3)' }}
          >
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              PROTOCOL ALPHA-9
            </span>
            <span
              className="text-xs tracking-widest"
              style={{ color: '#454840', fontFamily: "'KimjungchulMyungjo', serif" }}
            >
              ◆ ◆ ◆
            </span>
          </div>
        </div>
      </main>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            backgroundColor: '#1e201c',
            border: '1px solid rgba(69, 72, 64, 0.4)',
            color: '#e3e3dc',
            fontFamily: "'KimjungchulMyungjo', serif",
          },
        }}
      />
    </div>
  );
}
