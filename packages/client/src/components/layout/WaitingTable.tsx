import { useState } from 'react';
import type { RoomState } from '@sutda/shared';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

interface WaitingTableProps {
  roomState: RoomState;
  myPlayerId: string | null;
  roomId: string;
}

export function WaitingTable({ roomState, myPlayerId, roomId }: WaitingTableProps) {
  const [copied, setCopied] = useState(false);
  const { socket } = useGameStore();

  const isHost = myPlayerId === roomState.hostId;
  const canStart = roomState.players.length >= 2;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API 실패 시 무시
    }
  };

  const handleStartGame = () => {
    socket?.emit('start-game', { roomId });
  };

  const bgStyle = {
    backgroundImage: "url('/img/background.webp')",
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center',
  };

  const centerContent = (
    <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-xs px-4">
      {/* 링크 복사 */}
      <button
        onClick={handleCopyUrl}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
      >
        {copied ? '복사됨!' : '링크 복사'}
      </button>

      {/* 참가자 목록 */}
      <div className="w-full bg-background/70 border border-border rounded-xl px-4 py-3 space-y-2 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">참가자 {roomState.players.length}명</p>
        {roomState.players.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            친구에게 링크를 공유해 보세요
          </p>
        ) : (
          roomState.players.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
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
          ))
        )}
      </div>

      {/* 시작 / 대기 */}
      {isHost ? (
        <Button className="w-full" disabled={!canStart} onClick={handleStartGame}>
          게임 시작하기
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">방장이 게임을 시작할 때까지 기다려 주세요</p>
      )}
    </div>
  );

  return (
    <>
      {/* 데스크탑 */}
      <div
        className="absolute inset-0 hidden md:flex items-center justify-center overflow-hidden"
        style={bgStyle}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.45)' }} />
        {centerContent}
      </div>

      {/* 모바일 */}
      <div className="md:hidden h-full relative" style={bgStyle}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.45)' }} />
        <div className="relative z-10 h-full flex items-center justify-center">
          {centerContent}
        </div>
      </div>
    </>
  );
}
