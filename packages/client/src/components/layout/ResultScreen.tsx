import { useState, useEffect, useSyncExternalStore, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, GameState } from '@sutda/shared';
import { evaluateHand } from '@sutda/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HwatuCard } from '@/components/game/HwatuCard';
import { useGameStore } from '@/store/gameStore';
import { useSfxPlayer } from '@/hooks/useSfxPlayer';
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
  isRematchPending?: boolean;
  onEject?: () => void;
}

const AUTO_NEXT_SECONDS = 5;

export function ResultScreen({ gameState, myPlayerId, roomId, isRematch, isRematchPending, onEject }: ResultScreenProps) {
  const { socket } = useGameStore();
  const { play } = useSfxPlayer();
  const navigate = useNavigate();
  const [hasVotedNextRound, setHasVotedNextRound] = useState(false);
  const resultSfxPlayedRef = useRef<string | null>(null);
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

  // school-proxy SFX: proxy-ante-applied 이벤트 수신 시 전 플레이어 재생
  useEffect(() => {
    if (!socket) return;
    const handler = () => { play('school-proxy'); };
    socket.on('proxy-ante-applied', handler);
    return () => { socket.off('proxy-ante-applied', handler); };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // result phase 진입 시 1회 SFX 재생
  useEffect(() => {
    if (gameState.phase !== 'result' || !myPlayerId) return;
    const phaseKey = `${gameState.phase}-${gameState.winnerId}`;
    if (resultSfxPlayedRef.current === phaseKey) return;
    resultSfxPlayedRef.current = phaseKey;

    const me = gameState.players.find(p => p.id === myPlayerId);
    if (!me) return;
    const iAmWinner = gameState.winnerId === myPlayerId;

    // 세장섯다: selectedCards 우선 사용 (me.cards[0,1]이 선택한 2장이 아닐 수 있음)
    // 한장공유 모드: 플레이어의 1장 + 공유카드로 2장 구성
    const getHandCards = (player: typeof me) => {
      if (player.selectedCards && player.selectedCards.length >= 2) return player.selectedCards;
      if (gameState.mode === 'shared-card' && gameState.sharedCard && player.cards[0]) {
        return [player.cards[0], gameState.sharedCard];
      }
      return player.cards?.filter((c): c is Card => c != null) ?? [];
    };

    const myHandCards = getHandCards(me);

    if (iAmWinner) {
      if (myHandCards.length >= 2) {
        try {
          const result = evaluateHand(myHandCards[0]!, myHandCards[1]!);
          const isDdaeng = result.handType.includes('ttaeng');
          play(isDdaeng ? 'win-ddaeng' : 'win-normal');
        } catch {
          play('win-normal');
        }
      } else {
        play('win-normal');
      }
    } else {
      const hasDdaengPenalty = gameState.ttaengPayments?.some(t => t.playerId === myPlayerId);
      if (hasDdaengPenalty) {
        play('lose-ddaeng-penalty');
      } else if (myHandCards.length >= 2) {
        try {
          const result = evaluateHand(myHandCards[0]!, myHandCards[1]!);
          const isDdaeng = result.handType.includes('ttaeng');
          if (isDdaeng) {
            play('lose-ddaeng-but-lost');
          } else {
            play('lose-normal');
          }
        } catch {
          play('lose-normal');
        }
      } else {
        play('lose-normal');
      }
      // 승자 카드가 땡인 경우 win-ddaeng-loser 추가 재생
      if (winner) {
        const winnerHandCards = getHandCards(winner);
        if (winnerHandCards.length >= 2) {
          try {
            const winnerResult = evaluateHand(winnerHandCards[0]!, winnerHandCards[1]!);
            if (winnerResult.handType.includes('ttaeng')) {
              play('win-ddaeng-loser');
            }
          } catch {
            // 평가 실패 시 무시
          }
        }
      }
    }
  }, [gameState.phase]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const isSharedCardMode = gameState.mode === 'shared-card' && gameState.sharedCard != null;

  const isCardRevealPhase = gameState.phase === 'card-reveal';

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-background text-foreground gap-4 p-3 md:gap-6 md:p-6 overflow-y-auto">
      {isRematch && !isCardRevealPhase && !isRematchPending && (
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
      {isCardRevealPhase ? (
        <h2 className="text-xl font-semibold">패를 공개하세요!</h2>
      ) : isRematchPending ? (
        <h2 className="text-xl font-semibold">동점!</h2>
      ) : (
        <h2 className="text-xl font-semibold">{winnerNickname} 승리!</h2>
      )}

      <div className={`grid gap-2 justify-items-center ${
        allPlayers.length <= 2 ? 'grid-cols-1' :
        allPlayers.length === 4 ? 'grid-cols-2' :
        'grid-cols-3'
      } md:flex md:flex-wrap md:gap-6 md:justify-center`}>
        {allPlayers.map((player) => {
          const isDied = !player.isAlive;
          const isMe = player.id === myPlayerId;

          // 세장섯다: selectedCards 기준 족보 계산, 한장공유: [본인카드, 공유카드] 2장, 아니면 player.cards fallback
          const displayCards = player.selectedCards?.length === 2
            ? player.selectedCards
            : isSharedCardMode && player.cards[0]
              ? [player.cards[0], gameState.sharedCard!]
              : player.cards;

          // card-reveal phase에서 공개 여부 결정
          const revealedIndices = player.revealedCardIndices ?? [];

          let handLabel: string | null = null;
          if (!isDied && displayCards.length >= 2 && player.isRevealed) {
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
                  : isCardRevealPhase
                  ? displayCards.map((card, idx) => {
                      const isSharedCardAtIndex = isSharedCardMode && idx === 1;
                      const isCardRevealed = isSharedCardAtIndex || revealedIndices.includes(idx);
                      const canClick = isMe && !isCardRevealed && player.isAlive;
                      return (
                        <div
                          key={idx}
                          onClick={canClick ? () => socket?.emit('reveal-my-card', { roomId, cardIndex: idx }) : undefined}
                          className={canClick ? 'cursor-pointer animate-pulse' : ''}
                        >
                          <HwatuCard
                            card={isCardRevealed ? card! : undefined}
                            faceUp={isCardRevealed}
                            size={cardSize}
                          />
                        </div>
                      );
                    })
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
              {!isCardRevealPhase && !isRematchPending && (
                <>
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
                </>
              )}
            </div>
          );
        })}
      </div>

      {!isCardRevealPhase && <div className="flex flex-col items-center gap-2">
        {isRematchPending ? (() => {
          const tiedIds = gameState.tiedPlayerIds ?? [];
          const confirmedIds = gameState.rematchConfirmedIds ?? [];
          const amTied = myPlayerId ? tiedIds.includes(myPlayerId) : false;
          const alreadyConfirmed = myPlayerId ? confirmedIds.includes(myPlayerId) : false;
          if (!amTied) {
            return <p className="text-sm text-muted-foreground">동점 플레이어들의 재경기 준비를 기다리는 중...</p>;
          }
          if (alreadyConfirmed) {
            return <p className="text-sm text-muted-foreground">다른 플레이어를 기다리는 중...</p>;
          }
          return (
            <Button onClick={() => socket?.emit('start-rematch', { roomId })}>
              재경기
            </Button>
          );
        })() : amAbsent ? (
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
            <Button variant="secondary" onClick={() => { play('school-go'); handleNextRound(); }}>
              학교 가기
            </Button>
            {canSkip && myPlayerId !== gameState.winnerId && (
              <Button variant="ghost" disabled={hasTakenBreak} onClick={handleTakeBreak}>
                다음판 쉬기
              </Button>
            )}
          </div>
        )}

        {!isRematchPending && !anyPlayerBroke && <ProxyAnteSection gameState={gameState} myPlayerId={myPlayerId} socket={socket} />}
      </div>}
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
    // school-proxy SFX는 proxy-ante-applied 이벤트 수신 시 ResultScreen에서 전체 재생
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
