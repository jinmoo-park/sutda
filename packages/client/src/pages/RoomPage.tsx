import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '@/store/gameStore';
import { WaitingRoom } from '@/components/layout/WaitingRoom';
import { GameTable } from '@/components/layout/GameTable';
import { HandPanel } from '@/components/layout/HandPanel';
import { BettingPanel } from '@/components/layout/BettingPanel';
import { InfoPanel } from '@/components/layout/InfoPanel';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { ResultScreen } from '@/components/layout/ResultScreen';
import { DealerSelectModal } from '@/components/modals/DealerSelectModal';
import { AttendSchoolModal } from '@/components/modals/AttendSchoolModal';
import { ShuffleModal } from '@/components/modals/ShuffleModal';
import { CutModal } from '@/components/modals/CutModal';
import { RechargeVoteModal } from '@/components/modals/RechargeVoteModal';
import { LeaveRoomDialog } from '@/components/modals/LeaveRoomDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket, connect, gameState, roomState, myPlayerId, error, clearError } = useGameStore();
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  // 닉네임 + 입장 상태
  const [nickname, setNickname] = useState('');
  const [initialChips, setInitialChips] = useState(100000);
  const [hasJoined, setHasJoined] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // 소켓 연결
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
  const isDealer = myPlayer?.isDealer ?? false;
  const currentPlayerNickname =
    gameState?.players[gameState.currentPlayerIndex]?.nickname;

  // 닉네임 입력 폼 (방 미입장 상태)
  const handleJoinRoom = () => {
    if (!nickname.trim() || !socket) return;
    socket.emit('join-room', {
      roomId: roomId!,
      nickname: nickname.trim(),
      initialChips,
    });
    setHasJoined(true);
  };

  if (!hasJoined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-sm space-y-4 p-6">
          <h2 className="text-xl font-semibold text-center">방 입장</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nickname-input">
              닉네임
            </label>
            <Input
              id="nickname-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinRoom();
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="chips-input">
              시작 칩 (원)
            </label>
            <Input
              id="chips-input"
              type="number"
              value={initialChips}
              onChange={(e) => setInitialChips(Number(e.target.value))}
              min={10000}
              step={10000}
            />
          </div>
          <Button
            className="w-full"
            disabled={!nickname.trim()}
            onClick={handleJoinRoom}
          >
            입장
          </Button>
        </div>
        <Toaster />
      </div>
    );
  }

  // 대기실 (게임 시작 전)
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

  // 결과 화면
  if (phase === 'result' || phase === 'finished') {
    return (
      <>
        <ResultScreen gameState={gameState} myPlayerId={myPlayerId} roomId={roomId!} />
        <Toaster />
      </>
    );
  }

  // 게임 진행 중
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* 상단 헤더 — 방 나가기 버튼 */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <span className="text-sm text-muted-foreground">방 {roomId}</span>
        <Button variant="ghost" size="sm" onClick={() => setShowLeaveDialog(true)}>
          나가기
        </Button>
      </div>

      {/* 게임 테이블 패널 */}
      <div className="flex-1 flex items-center justify-center">
        <GameTable
          players={gameState.players}
          myPlayerId={myPlayerId}
          currentPlayerIndex={gameState.currentPlayerIndex}
          pot={gameState.pot}
        />
      </div>

      {/* 하단 패널 */}
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

      {/* 특수 액션 모달 — phase에 따라 조건부 표시 */}
      <DealerSelectModal open={phase === 'dealer-select'} roomId={roomId!} />
      <AttendSchoolModal open={phase === 'attend-school' && isMyTurn} roomId={roomId!} />
      <ShuffleModal open={phase === 'shuffling' && isDealer} roomId={roomId!} />
      <CutModal open={phase === 'cutting' && isMyTurn} roomId={roomId!} />

      {/* 재충전 모달 — phase 무관, rechargeRequest 있을 때 */}
      <RechargeVoteModal roomId={roomId!} />

      {/* 방 나가기 다이얼로그 */}
      <LeaveRoomDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        roomId={roomId!}
      />

      <Toaster />
    </div>
  );
}
