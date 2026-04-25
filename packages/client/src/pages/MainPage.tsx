import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MainPage() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [initialChips, setInitialChips] = useState(100000);
  const navigate = useNavigate();
  const { connect, socket } = useGameStore();

  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  // Mount 시 미리 연결해 첫 클릭 때 lazy-connect race condition을 줄인다.
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
    const errorHandler = ({ message }: { message: string }) => {
      toast.error(message);
    };
    s.once('error', errorHandler);
    s.emit('create-room', { nickname: nickname.trim(), initialChips, password: password.trim() || undefined });
    s.once('room-created', ({ roomId }) => {
      s.off('error', errorHandler);
      // isHost: true -> RoomPage에서 join-room 폼을 건너뛴다.
      navigate(`/room/${roomId}`, { state: { nickname: nickname.trim(), initialChips, isHost: true } });
    });
  };

  return (
    <main className="entry-page entry-page--host">
      <h1 className="sr-only">섯다</h1>
      <form
        className="entry-panel"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateRoom();
        }}
      >
        <div className="space-y-3">
          <label htmlFor="nickname" className="sr-only">닉네임</label>
          <Input
            id="nickname"
            className="entry-input"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={10}
          />
        </div>
        <div className="space-y-3">
          <label htmlFor="room-password" className="sr-only">암구호</label>
          <Input
            id="room-password"
            className="entry-input"
            type="password"
            placeholder="암구호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="initial-chips" className="entry-label">
            시작 칩
          </label>
          <Input
            id="initial-chips"
            className="entry-input"
            type="number"
            value={initialChips}
            min={10000}
            step={10000}
            onChange={(e) => setInitialChips(Number(e.target.value))}
          />
        </div>
        <Button className="entry-button" type="submit" disabled={!socket}>
          {socket ? '방 만들기' : '연결 중...'}
        </Button>
      </form>
      <Toaster />
    </main>
  );
}
