import { useState, useEffect, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameState } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HwatuCard } from '@/components/game/HwatuCard';
import { useGameStore } from '@/store/gameStore';
import { getHandLabel } from '@/lib/handLabels';

const mdQuery = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
const subscribe = (cb: () => void) => { mdQuery?.addEventListener('change', cb); return () => mdQuery?.removeEventListener('change', cb); };
const getSnapshot = () => mdQuery?.matches ?? false;
function useIsMd() { return useSyncExternalStore(subscribe, getSnapshot, () => false); }

interface ResultScreenProps {
  gameState: GameState;
  myPlayerId: string | null;
  roomId: string;
  isRematch?: boolean;
  onEject?: () => void;
}

const AUTO_NEXT_SECONDS = 5;

export function ResultScreen({ gameState, myPlayerId, roomId, isRematch, onEject }: ResultScreenProps) {
  const { socket } = useGameStore();
  const navigate = useNavigate();
  const [hasVotedNextRound, setHasVotedNextRound] = useState(false);
  const [hasReturnedFromBreak, setHasReturnedFromBreak] = useState(false);
  const [hasTakenBreak, setHasTakenBreak] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_NEXT_SECONDS);

  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const amAbsent = myPlayer?.isAbsent === true;
  const nonAbsentCount = gameState.players.filter((p) => !p.isAbsent).length;
  const canSkip = nonAbsentCount > 2;

  // 0칩 플레이어 존재 여부 — 다음 판 진행 불가 (강퇴 예정)
  const anyPlayerBroke = gameState.players.some((p) => !p.isAbsent && p.chips === 0);
  const iAmBroke = (myPlayer?.chips ?? 1) === 0;

  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const winnerNickname = winner?.nickname ?? '알 수 없음';

  const handleNextRound = () => {
    if (hasVotedNextRound) return;
    setHasVotedNextRound(true);
    socket?.emit('next-round', { roomId });
  };

  // 올인으로 인한 게임 종료: 패배자 → join 폼으로, 승자 → next-round 투표
  const handleConfirm = () => {
    if (iAmBroke) {
      localStorage.removeItem(`sutda_room_${roomId}`);
      if (onEject) {
        onEject();
      } else {
        navigate(`/room/${roomId}`, { replace: true });
      }
    } else {
      handleNextRound();
    }
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

  const isMd = useIsMd();
  const cardSize = isMd ? 'md' : 'sm';

  const allPlayers = gameState.players.filter((p) => !p.isAbsent);

  const playerDisplayCards = allPlayers.map((player) =>
    (player.selectedCards?.length === 2 ? player.selectedCards : player.cards)
  );

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-background text-foreground gap-4 p-3 md:gap-6 md:p-6 overflow-y-auto">
      {isRematch && (
        <div
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
          style={{ animation: 'fadeIn 0.4s ease-in' }}
        >
          <div
            role="img"
            aria-label="재경기"
            className="opacity-85"
            style={{ width: '80%', aspectRatio: '1/1', maxHeight: '80%', backgroundImage: 'url(/img/regame.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
          />
        </div>
      )}
      <h2 className="text-xl font-semibold">{winnerNickname} 승리!</h2>

      <div className={`grid gap-2 justify-items-center ${
        allPlayers.length <= 2 ? 'grid-cols-1' :
        allPlayers.length === 4 ? 'grid-cols-2' :
        'grid-cols-3'
      } md:flex md:flex-wrap md:gap-6 md:justify-center`}>
        {allPlayers.map((player, pi) => {
          const isDied = !player.isAlive;

          // 세장섯다: selectedCards 기준 족보 계산, 아니면 cards[0]/cards[1] fallback
          const displayCards = player.selectedCards?.length === 2
            ? player.selectedCards
            : player.cards;
          let handLabel: string | null = null;
          if (!isDied && displayCards.length >= 2) {
            try {
              handLabel = getHandLabel(evaluateHand(displayCards[0]!, displayCards[1]!));
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

          // 칩 변동 계산 (totalBet = 앤티 + 전체 베팅 누적액 포함)
          const baseChipDelta = isWinner
            ? gameState.pot - player.totalBet
            : -player.totalBet;
          const chipDelta = isWinner
            ? baseChipDelta + totalTtaengReceived
            : baseChipDelta - (myTtaengPayment?.amount ?? 0);

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border bg-card md:gap-2 md:p-4 ${isDied ? 'border-border opacity-70' : 'border-border'}`}
            >
              <p className="text-xs font-semibold md:text-sm">{player.nickname}</p>
              <div className="flex gap-1 md:gap-2">
                {isDied
                  ? player.cards.map((_, idx) => <HwatuCard key={idx} faceUp={false} size={cardSize} />)
                  : displayCards.map((card, idx) =>
                      player.isRevealed ? (
                        <HwatuCard key={idx} card={card!} faceUp={true} size={cardSize} />
                      ) : (
                        <HwatuCard key={idx} faceUp={false} size={cardSize} />
                      )
                    )}
              </div>
              {isDied ? (
                <Badge variant="destructive" className="text-[10px] md:text-xs">다이</Badge>
              ) : (
                player.isRevealed && handLabel && (
                  <Badge variant="secondary" className="text-[10px] md:text-xs">{handLabel}</Badge>
                )
              )}
              <Badge
                className={`text-[10px] md:text-xs ${
                  chipDelta > 0
                    ? 'bg-green-600 text-white'
                    : chipDelta < 0
                    ? 'bg-red-600 text-white'
                    : ''
                }`}
              >
                {chipDelta > 0 ? '+' : ''}
                {chipDelta.toLocaleString()}원
              </Badge>
              {isWinner && totalTtaengReceived > 0 && (
                <p className="text-[10px] text-green-400 md:text-xs">
                  땡값 +{totalTtaengReceived.toLocaleString()}원
                </p>
              )}
              {!isWinner && myTtaengPayment && (
                <p className="text-[10px] text-red-400 md:text-xs">
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
        ) : anyPlayerBroke ? (
          hasVotedNextRound ? (
            <p className="text-sm text-muted-foreground">대기 중...</p>
          ) : (
            <Button onClick={handleConfirm}>확인</Button>
          )
        ) : hasVotedNextRound ? (
          <p className="text-sm text-muted-foreground">다른 플레이어를 기다리는 중...</p>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleNextRound}>
              학교 가기
            </Button>
            {canSkip && myPlayerId !== gameState.winnerId && (
              <Button variant="ghost" disabled={hasTakenBreak} onClick={handleTakeBreak}>
                다음판 쉬기
              </Button>
            )}
          </div>
        )}

        {!anyPlayerBroke && <ProxyAnteSection gameState={gameState} myPlayerId={myPlayerId} socket={socket} />}
      </div>
    </div>
  );
}

// 학교 대신 가주기 섹션 (승자에게만 렌더)
function ProxyAnteSection({
  gameState,
  myPlayerId,
  socket,
}: {
  gameState: GameState;
  myPlayerId: string | null;
  socket: ReturnType<typeof useGameStore.getState>['socket'];
}) {
  const [proxyOpen, setProxyOpen] = useState(false);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);

  if (gameState.winnerId !== myPlayerId) return null;

  const otherPlayers = gameState.players.filter(p => p.id !== myPlayerId);

  const handleProxyConfirm = () => {
    if (selectedBeneficiaries.length === 0) return;
    socket?.emit('proxy-ante', { roomId: gameState.roomId, beneficiaryIds: selectedBeneficiaries });
    setProxyOpen(false);
    setSelectedBeneficiaries([]);
  };

  const toggleBeneficiary = (id: string) => {
    setSelectedBeneficiaries(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setProxyOpen(!proxyOpen)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        학교 대신 가주기 {proxyOpen ? '▲' : '▼'}
      </button>
      {proxyOpen && (
        <div className="mt-2 space-y-2">
          {otherPlayers.map(p => (
            <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBeneficiaries.includes(p.id)}
                onChange={() => toggleBeneficiary(p.id)}
                className="accent-primary"
              />
              <span className={selectedBeneficiaries.includes(p.id) ? 'font-semibold' : ''}>
                {p.nickname}
              </span>
            </label>
          ))}
          <button
            onClick={handleProxyConfirm}
            disabled={selectedBeneficiaries.length === 0}
            className="px-4 py-1.5 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            대신 내주기
          </button>
        </div>
      )}
    </div>
  );
}
