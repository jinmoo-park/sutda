import { useState, useEffect } from 'react';
import type { GameState, HandResult } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardFace } from '@/components/game/CardFace';
import { CardBack } from '@/components/game/CardBack';
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

function getHandLabel(result: HandResult): string {
  if (result.handType !== 'kkut') {
    return HAND_TYPE_KOREAN[result.handType] ?? result.handType;
  }
  if (result.isMeongtteongguriGusa) return '멍텅구리구사';
  if (result.isGusa) return '구사';
  if (result.isSpecialBeater && result.score === 1) return '암행어사';
  if (result.isSpecialBeater && result.score === 0) return '땡잡이';
  if (result.score === 0) return '망통';
  if (result.score === 9) return '갑오';
  return `${result.score}끗`;
}

interface ResultScreenProps {
  gameState: GameState;
  myPlayerId: string | null;
  roomId: string;
}

const AUTO_NEXT_SECONDS = 5;

export function ResultScreen({ gameState, myPlayerId, roomId }: ResultScreenProps) {
  const { socket } = useGameStore();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [hasVotedNextRound, setHasVotedNextRound] = useState(false);
  const [hasReturnedFromBreak, setHasReturnedFromBreak] = useState(false);
  const [hasTakenBreak, setHasTakenBreak] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_NEXT_SECONDS);

  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const amAbsent = myPlayer?.isAbsent === true;
  const nonAbsentCount = gameState.players.filter((p) => !p.isAbsent).length;
  const canSkip = nonAbsentCount > 2;

  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const winnerNickname = winner?.nickname ?? '알 수 없음';

  const handleNextRound = () => {
    if (hasVotedNextRound) return;
    setHasVotedNextRound(true);
    socket?.emit('next-round', { roomId });
  };

  const handleReturnFromBreak = () => {
    if (hasReturnedFromBreak) return;
    setHasReturnedFromBreak(true);
    socket?.emit('return-from-break', { roomId });
  };

  const handleTakeBreak = () => {
    if (hasTakenBreak) return;
    setHasTakenBreak(true);
    socket?.emit('take-break', { roomId });
  };

  // 자리비움 상태: 카운트다운 후 자동으로 next-round 투표
  useEffect(() => {
    if (!amAbsent || hasVotedNextRound) return;
    if (countdown <= 0) {
      handleNextRound();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [amAbsent, countdown, hasVotedNextRound]);

  // amAbsent가 변경될 때 카운트다운 초기화
  useEffect(() => {
    if (amAbsent) setCountdown(AUTO_NEXT_SECONDS);
  }, [amAbsent]);

  const allPlayers = gameState.players.filter((p) => !p.isAbsent);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-6 p-6">
      <h2 className="text-xl font-semibold">{winnerNickname} 승리!</h2>

      <div className="flex flex-wrap gap-6 justify-center">
        {allPlayers.map((player) => {
          const isDied = !player.isAlive;

          let handLabel: string | null = null;
          if (!isDied && player.cards.length >= 2) {
            try {
              handLabel = getHandLabel(evaluateHand(player.cards[0], player.cards[1]));
            } catch {
              // 평가 불가한 경우 무시
            }
          }

          // 땡값 계산
          const isWinner = player.id === gameState.winnerId;
          const myTtaengPayment = gameState.ttaengPayments?.find(
            (t) => t.playerId === player.id
          );
          const totalTtaengReceived =
            isWinner && gameState.ttaengPayments
              ? gameState.ttaengPayments.reduce((sum, t) => sum + t.amount, 0)
              : 0;

          // 칩 변동 계산 (앤티 500원 + 땡값 포함)
          const ante = 500;
          const baseChipDelta = isWinner
            ? gameState.pot - player.currentBet - ante
            : -(player.currentBet + ante);
          const chipDelta = isWinner
            ? baseChipDelta + totalTtaengReceived
            : baseChipDelta - (myTtaengPayment?.amount ?? 0);

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border bg-card ${isDied ? 'border-border opacity-70' : 'border-border'}`}
            >
              <p className="text-sm font-semibold">{player.nickname}</p>
              <div className="flex gap-2">
                {isDied
                  ? player.cards.map((_, idx) => <CardBack key={idx} />)
                  : player.cards.map((card, idx) =>
                      player.isRevealed ? (
                        <CardFace key={idx} card={card} />
                      ) : (
                        <CardBack key={idx} />
                      )
                    )}
              </div>
              {isDied ? (
                <Badge variant="destructive">다이</Badge>
              ) : (
                player.isRevealed && handLabel && (
                  <Badge variant="secondary">{handLabel}</Badge>
                )
              )}
              <Badge
                className={
                  chipDelta > 0
                    ? 'bg-green-600 text-white'
                    : chipDelta < 0
                    ? 'bg-red-600 text-white'
                    : ''
                }
              >
                {chipDelta > 0 ? '+' : ''}
                {chipDelta.toLocaleString()}원
              </Badge>
              {isWinner && totalTtaengReceived > 0 && (
                <p className="text-xs text-green-400">
                  땡값 +{totalTtaengReceived.toLocaleString()}원
                </p>
              )}
              {!isWinner && myTtaengPayment && (
                <p className="text-xs text-red-400">
                  땡값 -{myTtaengPayment.amount.toLocaleString()}원
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2">
        {amAbsent ? (
          hasReturnedFromBreak ? (
            <p className="text-sm text-muted-foreground">복귀 완료 — 다음 판부터 참여합니다</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                자리비움 중 — {countdown}초 후 자동으로 넘어갑니다
              </p>
              <Button onClick={handleReturnFromBreak}>복귀하기</Button>
            </>
          )
        ) : hasVotedNextRound ? (
          <p className="text-sm text-muted-foreground">다른 플레이어를 기다리는 중...</p>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleNextRound}>
              학교 가기
            </Button>
            {canSkip && (
              <Button variant="ghost" disabled={hasTakenBreak} onClick={handleTakeBreak}>
                다음판 쉬기
              </Button>
            )}
          </div>
        )}
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
