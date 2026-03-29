import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket, connect, gameState, roomState } = useGameStore();
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!socket) connect(serverUrl);
  }, [socket, connect, serverUrl]);

  const phase = gameState?.phase ?? roomState?.gamePhase ?? 'waiting';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* TODO: Plan 02에서 대기실/게임 테이블/결과 화면 구현 */}
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          방 {roomId} -- 상태: {phase}
        </p>
      </div>
    </div>
  );
}
