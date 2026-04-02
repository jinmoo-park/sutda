import { useState } from 'react';
import type { RoomState } from '@sutda/shared';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-6">
      <div
        role="img"
        aria-label="섯다"
        style={{ width: '100%', maxWidth: '480px', aspectRatio: '1632/656', backgroundImage: 'url(/img/main_title_alt.webp)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
      />

      {/* 방 URL 복사 */}
      <div className="w-full max-w-sm space-y-2">
        <p className="text-sm text-muted-foreground break-all">{roomUrl}</p>
        <Button variant="secondary" className="w-full" onClick={handleCopyUrl}>
          {copied ? '복사됨!' : '링크 복사'}
        </Button>
      </div>

      {/* 참가자 목록 */}
      <div className="w-full max-w-sm space-y-2">
        <p className="text-sm font-semibold">참가자 ({roomState.players.length}명)</p>
        {roomState.players.length === 0 ? (
          <div className="space-y-1 text-center py-4">
            <p className="text-muted-foreground">아직 아무도 없어요</p>
            <p className="text-sm text-muted-foreground">친구에게 링크를 공유해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {roomState.players.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1 border-b border-border">
                <span className="font-semibold">
                  {p.nickname}
                  {p.id === roomState.hostId && (
                    <span className="ml-1 text-xs text-muted-foreground">(방장)</span>
                  )}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {p.chips.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 게임 시작 / 대기 메시지 */}
      {isHost ? (
        <Button className="w-full max-w-sm" disabled={!canStart} onClick={handleStartGame}>
          게임 시작
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">방장이 게임을 시작할 때까지 기다려 주세요</p>
      )}
    </div>
  );
}
