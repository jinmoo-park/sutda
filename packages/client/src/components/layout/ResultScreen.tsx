import { useState } from 'react';
import type { GameState } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFace } from '@/components/game/CardFace';
import { LeaveRoomDialog } from '@/components/modals/LeaveRoomDialog';
import { useGameStore } from '@/store/gameStore';

const HAND_TYPE_KOREAN: Record<string, string> = {
  'sam-pal-gwang-ttaeng': '삼팔광땡',
  'il-pal-gwang-ttaeng': '일팔광땡',
  'il-sam-gwang-ttaeng': '일삼광땡',
  'jang-ttaeng': '장땡',
  'gu-ttaeng': '구땡',
  'pal-ttaeng': '팔땡',
  'chil-ttaeng': '칠땡',
  'yuk-ttaeng': '육땡',
  'o-ttaeng': '오땡',
  'sa-ttaeng': '사땡',
  'sam-ttaeng': '삼땡',
  'i-ttaeng': '이땡',
  'il-ttaeng': '일땡',
  ali: '알리',
  'dok-sa': '독사',
  'gu-bbing': '구삥',
  'jang-bbing': '장삥',
  'jang-sa': '장사',
  'sae-ryuk': '새륙',
  kkut: '끗',
};

interface ResultScreenProps {
  gameState: GameState;
  myPlayerId: string | null;
  roomId: string;
}

export function ResultScreen({ gameState, myPlayerId: _myPlayerId, roomId }: ResultScreenProps) {
  const { socket } = useGameStore();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const winnerNickname = winner?.nickname ?? '알 수 없음';

  const survivingPlayers = gameState.players.filter((p) => p.isAlive);
  const survivorCount = survivingPlayers.length;

  const handleNextRound = () => {
    socket?.emit('next-round', { roomId });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-6 p-6">
      <h2 className="text-xl font-semibold">{winnerNickname} 승리!</h2>

      <div className="flex flex-wrap gap-6 justify-center">
        {survivingPlayers.map((player) => {
          let handLabel: string | null = null;
          if (player.cards.length >= 2) {
            try {
              const result = evaluateHand(player.cards);
              const baseName = HAND_TYPE_KOREAN[result.handType] ?? result.handType;
              handLabel = result.handType === 'kkut' ? `${result.score}끗` : baseName;
            } catch {
              // 평가 불가한 경우 무시
            }
          }

          // 칩 변동 계산
          const isWinner = player.id === gameState.winnerId;
          const chipDelta = isWinner
            ? gameState.pot - player.currentBet
            : -player.currentBet;

          // survivorCount가 0이면 fallback
          const displayDelta =
            survivorCount > 0 ? chipDelta : 0;

          return (
            <div
              key={player.id}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card"
            >
              <p className="text-sm font-semibold">{player.nickname}</p>
              <div className="flex gap-2">
                {player.cards.map((card, idx) => (
                  <CardFace key={idx} card={card} />
                ))}
              </div>
              {handLabel && (
                <Badge variant="secondary">{handLabel}</Badge>
              )}
              <Badge
                className={
                  displayDelta > 0
                    ? 'bg-green-600 text-white'
                    : displayDelta < 0
                    ? 'bg-red-600 text-white'
                    : ''
                }
              >
                {displayDelta > 0 ? '+' : ''}
                {displayDelta.toLocaleString()}원
              </Badge>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleNextRound}>
          다음 판
        </Button>
        <Button variant="ghost" onClick={() => setShowLeaveDialog(true)}>
          방 나가기
        </Button>
      </div>

      <LeaveRoomDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        roomId={roomId}
      />
    </div>
  );
}
