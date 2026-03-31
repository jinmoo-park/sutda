import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MainPage() {
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [initialChips, setInitialChips] = useState(100000);
  const navigate = useNavigate();
  const { connect } = useGameStore();

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
      // isHost: true → RoomPage에서 join-room 폼 건너뜀 (이미 create-room으로 입장됨)
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
    // nickname/initialChips를 state로 전달 → RoomPage에서 자동 join-room emit
    navigate(`/room/${roomId.trim()}`, { state: { nickname: nickname.trim(), initialChips } });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 p-6">
      <img
        src="/img/main_title_alt.jpg"
        alt="섯다"
        style={{ width: '100%', maxWidth: '480px', height: 'auto', objectFit: 'contain' }}
      />
      <div className="w-full max-w-sm space-y-6">

        {mode === 'home' && (
          <div className="space-y-3">
            <Input
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                초기 칩 금액 (만원 단위)
              </label>
              <Input
                type="number"
                value={initialChips}
                min={10000}
                step={10000}
                onChange={(e) => setInitialChips(Number(e.target.value))}
              />
            </div>
            <Button className="w-full" onClick={handleCreateRoom}>
              방 만들기
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setMode('join')}>
              링크로 참여
            </Button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <Input
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
            />
            <Input
              placeholder="방 코드"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                초기 칩 금액 (만원 단위)
              </label>
              <Input
                type="number"
                value={initialChips}
                min={10000}
                step={10000}
                onChange={(e) => setInitialChips(Number(e.target.value))}
              />
            </div>
            <Button className="w-full" onClick={handleJoinRoom}>
              참여하기
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setMode('home')}>
              뒤로
            </Button>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
