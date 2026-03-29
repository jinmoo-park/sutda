import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MainPage() {
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [initialChips] = useState(100000);
  const navigate = useNavigate();
  const { socket, connect } = useGameStore();

  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  const handleCreateRoom = () => {
    if (!nickname.trim()) return;
    if (!socket) connect(serverUrl);
    const s = useGameStore.getState().socket;
    if (!s) return;
    s.emit('create-room', { nickname: nickname.trim(), initialChips });
    s.once('room-created', ({ roomId }) => {
      navigate(`/room/${roomId}`);
    });
  };

  const handleJoinRoom = () => {
    if (!nickname.trim() || !roomId.trim()) return;
    navigate(`/room/${roomId.trim()}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-center text-2xl font-semibold text-foreground">섯다</h1>

        {mode === 'home' && (
          <div className="space-y-3">
            <Input
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
            />
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
            <Button className="w-full" onClick={handleJoinRoom}>
              참여하기
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setMode('home')}>
              뒤로
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
