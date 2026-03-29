import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '@/store/gameStore';
import { WaitingRoom } from '@/components/layout/WaitingRoom';
import { GameTable } from '@/components/layout/GameTable';
import { HandPanel } from '@/components/layout/HandPanel';
import { BettingPanel } from '@/components/layout/BettingPanel';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { ChatPanel } from '@/components/layout/ChatPanel';

const GAME_PHASES = [
  'dealer-select',
  'attend-school',
  'mode-select',
  'shuffling',
  'cutting',
  'dealing',
  'betting',
  'showdown',
  'rematch-pending',
] as const;

type GamePhaseInProgress = (typeof GAME_PHASES)[number];

function isInGamePhase(phase: string): phase is GamePhaseInProgress {
  return (GAME_PHASES as readonly string[]).includes(phase);
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket, connect, gameState, roomState, myPlayerId, error, clearError } = useGameStore();
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!socket) connect(serverUrl);
  }, [socket, connect, serverUrl]);

  // 에러 발생 시 Sonner toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const phase = gameState?.phase ?? roomState?.gamePhase ?? 'waiting';

  const myPlayer = gameState?.players.find((p) => p.id === myPlayerId) ?? null;
  const isMyTurn =
    gameState !== null &&
    gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId;
  const currentPlayerNickname =
    gameState?.players[gameState.currentPlayerIndex]?.nickname;

  // 대기실
  if (phase === 'waiting' || !gameState) {
    if (roomState) {
      return (
        <>
          <WaitingRoom roomState={roomState} myPlayerId={myPlayerId} roomId={roomId!} />
          <Toaster />
        </>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">방 {roomId} 연결 중...</p>
        <Toaster />
      </div>
    );
  }

  // 결과 화면 (Plan 03에서 ResultScreen으로 교체)
  if (phase === 'result' || phase === 'finished') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">결과 화면 (준비 중)</p>
        <Toaster />
      </div>
    );
  }

  // 게임 진행 중
  if (isInGamePhase(phase)) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <div className="flex-1 flex items-center justify-center">
          <GameTable
            players={gameState.players}
            myPlayerId={myPlayerId}
            currentPlayerIndex={gameState.currentPlayerIndex}
            pot={gameState.pot}
          />
        </div>
        <div className="border-t border-border">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            <HandPanel myPlayer={myPlayer} />
            <InfoPanel
              myChips={myPlayer?.chips ?? 0}
              pot={gameState.pot}
              players={gameState.players}
              myPlayerId={myPlayerId}
            />
          </div>
          {phase === 'betting' && (
            <BettingPanel
              isMyTurn={isMyTurn}
              currentBetAmount={gameState.currentBetAmount}
              myChips={myPlayer?.chips ?? 0}
              roomId={roomId!}
              effectiveMaxBet={gameState.effectiveMaxBet}
              currentPlayerNickname={currentPlayerNickname}
            />
          )}
          <ChatPanel />
        </div>
        <Toaster />
      </div>
    );
  }

  // fallback
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-muted-foreground">방 {roomId} — 상태: {phase}</p>
      <Toaster />
    </div>
  );
}
