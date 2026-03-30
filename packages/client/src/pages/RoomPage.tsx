import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import { ModeSelectModal } from '@/components/modals/ModeSelectModal';
import { SharedCardSelectModal } from '@/components/modals/SharedCardSelectModal';
import { ShuffleModal } from '@/components/modals/ShuffleModal';
import { CutModal } from '@/components/modals/CutModal';
import { RechargeVoteModal } from '@/components/modals/RechargeVoteModal';
import { MuckChoiceModal } from '@/components/modals/MuckChoiceModal';
import { LeaveRoomDialog } from '@/components/modals/LeaveRoomDialog';
import { DealerResultOverlay } from '@/components/modals/DealerResultOverlay';
import type { DealerSelectResult } from '@/components/modals/DealerResultOverlay';
import { CardFace } from '@/components/game/CardFace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// sessionStorage 키 헬퍼 (roomId별로 입장 정보 저장)
function getRoomSessionKey(roomId: string) { return `sutda_room_${roomId}`; }
interface RoomSession { nickname: string; initialChips: number; isHost: boolean }

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const locationState = location.state as { nickname?: string; initialChips?: number; isHost?: boolean } | null;
  const { socket, connect, gameState, roomState, myPlayerId, error, clearError } = useGameStore();
  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  // location.state → sessionStorage 순서로 입장 정보 복원 (새로고침 대응)
  const cachedSession: RoomSession | null = (() => {
    try { return JSON.parse(sessionStorage.getItem(getRoomSessionKey(roomId!)) ?? 'null'); } catch { return null; }
  })();
  const initNickname = locationState?.nickname ?? cachedSession?.nickname ?? '';
  const initChips = locationState?.initialChips ?? cachedSession?.initialChips ?? 100000;
  const initIsHost = locationState?.isHost === true || cachedSession?.isHost === true;

  const [nickname, setNickname] = useState(initNickname);
  const [initialChips, setInitialChips] = useState(initChips);
  const [hasJoined, setHasJoined] = useState(initIsHost);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showCardConfirm, setShowCardConfirm] = useState(false);
  const [visibleCardCounts, setVisibleCardCounts] = useState<Record<string, number>>({});
  const dealingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 입장 정보를 sessionStorage에 저장 (새로고침 시 복원용)
  useEffect(() => {
    if (locationState?.nickname && roomId) {
      const session: RoomSession = {
        nickname: locationState.nickname,
        initialChips: locationState.initialChips ?? 100000,
        isHost: locationState.isHost === true,
      };
      sessionStorage.setItem(getRoomSessionKey(roomId), JSON.stringify(session));
    }
  }, []);

  // 밤일낮장 결과 오버레이
  const [dealerResults, setDealerResults] = useState<DealerSelectResult[]>([]);
  const [dealerWinnerId, setDealerWinnerId] = useState<string | null>(null);
  const [showDealerResult, setShowDealerResult] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);

  // 소켓 연결
  useEffect(() => {
    if (!socket) connect(serverUrl);
  }, [socket, connect, serverUrl]);

  // cutting → betting 전환 감지 → 딜링 애니메이션 후 카드 확인 오버레이 표시
  useEffect(() => {
    if (prevPhaseRef.current === 'cutting' && (gameState?.phase === 'betting' || gameState?.phase === 'betting-1')) {
      const players = gameState.players;
      const isTtong = gameState.isTtong;

      // 기존 타이머 정리
      if (dealingIntervalRef.current) {
        clearInterval(dealingIntervalRef.current);
        dealingIntervalRef.current = null;
      }

      if (isTtong) {
        // 퉁: 모든 플레이어에게 동시에 2장
        const counts: Record<string, number> = {};
        players.forEach((p) => { counts[p.id] = 2; });
        setVisibleCardCounts(counts);
        setTimeout(() => setShowCardConfirm(true), 700);
      } else {
        // 기리: 각 플레이어에게 한 장씩, 2라운드 (총 players.length * 2 스텝)
        const initial: Record<string, number> = {};
        players.forEach((p) => { initial[p.id] = 0; });
        setVisibleCardCounts(initial);

        let step = 0;
        const totalSteps = players.length * 2;

        dealingIntervalRef.current = setInterval(() => {
          const playerIdx = step % players.length;
          const cardNum = Math.floor(step / players.length) + 1;
          setVisibleCardCounts((prev) => ({
            ...prev,
            [players[playerIdx].id]: cardNum,
          }));
          step++;
          if (step >= totalSteps) {
            clearInterval(dealingIntervalRef.current!);
            dealingIntervalRef.current = null;
            setTimeout(() => setShowCardConfirm(true), 600);
          }
        }, 500);
      }
    }
  }, [gameState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // 베팅/커팅 phase 벗어나면 딜링 상태 초기화
  useEffect(() => {
    const p = gameState?.phase;
    if (p !== 'betting' && p !== 'betting-1' && p !== 'betting-2' && p !== 'cutting' && p !== 'card-select') {
      setVisibleCardCounts({});
      if (dealingIntervalRef.current) {
        clearInterval(dealingIntervalRef.current);
        dealingIntervalRef.current = null;
      }
    }
  }, [gameState?.phase]);

  // dealer-select → attend-school 전환 감지 → 결과 오버레이 3초 표시
  useEffect(() => {
    const currentPhase = gameState?.phase ?? null;
    if (
      prevPhaseRef.current === 'dealer-select' &&
      currentPhase === 'attend-school' &&
      gameState?.dealerSelectCards &&
      gameState.dealerSelectCards.length > 0
    ) {
      const results: DealerSelectResult[] = gameState.dealerSelectCards
        .map((sc) => ({
          playerId: sc.playerId,
          cardIndex: sc.cardIndex,
          card: gameState.deck[sc.cardIndex],
        }))
        .filter((r) => r.card != null);
      const winner = gameState.players.find((p) => p.isDealer);
      setDealerResults(results);
      setDealerWinnerId(winner?.id ?? null);
      setShowDealerResult(true);
      const timer = setTimeout(() => setShowDealerResult(false), 3000);
      return () => clearTimeout(timer);
    }
    prevPhaseRef.current = currentPhase;
  }, [gameState?.phase]);

  // 자동 join-room emit:
  // 1) MainPage 링크로 참여 (locationState.nickname, !isHost)
  // 2) 새로고침 재접속 (locationState 없고 sessionStorage에 캐시된 경우)
  useEffect(() => {
    if (!socket) return;
    // case 1: 첫 방문 joiner (MainPage 링크로 참여)
    if (locationState?.nickname && !locationState.isHost) {
      socket.emit('join-room', {
        roomId: roomId!,
        nickname: locationState.nickname,
        initialChips: locationState.initialChips ?? 100000,
      });
      setHasJoined(true);
      return;
    }
    // case 2: 새로고침 재접속 (host/joiner 모두 re-emit)
    if (!locationState && cachedSession?.nickname) {
      socket.emit('join-room', {
        roomId: roomId!,
        nickname: cachedSession.nickname,
        initialChips: cachedSession.initialChips,
      });
      setHasJoined(true);
    }
  }, [socket]);

  // 에러 발생 시 Sonner toast
  // ROOM_NOT_FOUND: 방이 삭제됨(혼자 새로고침) → sessionStorage 삭제 후 입장 폼으로 복귀
  useEffect(() => {
    if (error) {
      toast.error(error);
      if (error.includes('존재하지 않는 방') && roomId) {
        sessionStorage.removeItem(getRoomSessionKey(roomId));
        setHasJoined(false);
      }
      clearError();
    }
  }, [error, clearError]);

  const phase = gameState?.phase ?? roomState?.gamePhase ?? 'waiting';
  const myPlayer = gameState?.players.find((p) => p.id === myPlayerId) ?? null;
  const isMyTurn =
    gameState !== null &&
    gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId;
  const isDealer = myPlayer?.isDealer ?? false;
  const nonAbsentCount = gameState?.players.filter((p) => !p.isAbsent).length ?? 0;
  const canSkip = nonAbsentCount > 2;
  const currentPlayerNickname =
    gameState?.players[gameState.currentPlayerIndex]?.nickname;
  // 선 권한 보유자 여부 (체크 가능 조건)
  const isEffectiveSen =
    gameState?.openingBettorSeatIndex !== null &&
    gameState?.openingBettorSeatIndex !== undefined &&
    myPlayer?.seatIndex === gameState?.openingBettorSeatIndex;

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

  // 동점 재경기 대기
  if (phase === 'rematch-pending') {
    const tiedIds = gameState?.tiedPlayerIds ?? [];
    const tiedPlayers = gameState?.players.filter(p => tiedIds.includes(p.id)) ?? [];
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4 p-6">
          <h2 className="text-xl font-semibold">동점!</h2>
          <p className="text-muted-foreground">
            {tiedPlayers.map(p => p.nickname).join(' vs ')} — 재경기
          </p>
          <Button onClick={() => socket?.emit('start-rematch', { roomId: roomId! })}>
            재경기 시작
          </Button>
        </div>
        <Toaster />
      </div>
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
          visibleCardCounts={Object.keys(visibleCardCounts).length > 0 ? visibleCardCounts : undefined}
          sharedCard={gameState.sharedCard}
          mode={gameState.mode}
        />
      </div>

      {/* 하단 패널 */}
      <div className="border-t border-border">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <HandPanel
            myPlayer={myPlayer}
            phase={gameState.phase}
            onSelectCards={(indices) => {
              socket?.emit('select-cards', { roomId: roomId!, cardIndices: indices });
            }}
            sharedCard={gameState.mode === 'shared-card' ? gameState.sharedCard : undefined}
          />
          <InfoPanel
            myChips={myPlayer?.chips ?? 0}
            pot={gameState.pot}
            players={gameState.players}
            myPlayerId={myPlayerId}
          />
        </div>

        {(phase === 'betting' || phase === 'betting-1' || phase === 'betting-2') && !showCardConfirm && (
          <BettingPanel
            isMyTurn={isMyTurn}
            currentBetAmount={gameState.currentBetAmount}
            myCurrentBet={myPlayer?.currentBet ?? 0}
            myChips={myPlayer?.chips ?? 0}
            roomId={roomId!}
            effectiveMaxBet={gameState.effectiveMaxBet}
            currentPlayerNickname={currentPlayerNickname}
            isEffectiveSen={isEffectiveSen}
          />
        )}

        <ChatPanel />
      </div>

      {/* 잠시 쉬기 중 → 비차단 복귀 배너 (phase 무관) */}
      {myPlayer?.isAbsent && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-secondary text-secondary-foreground shadow-lg text-sm">
          <span>자리비움 중</span>
          <Button
            size="sm"
            variant="default"
            onClick={() => socket?.emit('return-from-break', { roomId: roomId! })}
          >
            복귀하기
          </Button>
        </div>
      )}

      {/* 특수 액션 모달 — phase에 따라 조건부 표시 */}
      <DealerSelectModal open={phase === 'dealer-select'} roomId={roomId!} />
      <DealerResultOverlay
        open={showDealerResult}
        results={dealerResults}
        players={gameState.players}
        winnerId={dealerWinnerId}
        onOpenChange={setShowDealerResult}
      />
      {/* AttendSchoolModal 제거: 결과화면 "학교 가기" 클릭 시 자동 앤티 처리 */}
      <ModeSelectModal open={phase === 'mode-select'} isDealer={isDealer} roomId={roomId!} />
      <SharedCardSelectModal open={phase === 'shared-card-select'} roomId={roomId!} />
      <ShuffleModal open={phase === 'shuffling' && isDealer} roomId={roomId!} />
      <CutModal open={phase === 'cutting' && isMyTurn} roomId={roomId!} />
      {/* 상대 전원 다이 시 패 공개 선택 */}
      <MuckChoiceModal
        open={
          phase === 'showdown' &&
          gameState.winnerId === myPlayerId &&
          myPlayer !== null
        }
        roomId={roomId!}
        myCards={myPlayer?.cards ?? []}
      />

      {/* 재충전 모달 — phase 무관, rechargeRequest 있을 때 */}
      <RechargeVoteModal roomId={roomId!} />

      {/* 방 나가기 다이얼로그 */}
      <LeaveRoomDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        roomId={roomId!}
      />

      {/* 카드 확인 오버레이 — cutting → betting 전환 시 */}
      {showCardConfirm && myPlayer && !myPlayer.isAbsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="bg-card rounded-xl p-6 space-y-4 text-center shadow-xl min-w-[280px]">
            <h3 className="text-lg font-semibold">패가 나왔어요!</h3>
            {gameState?.isTtong ? (
              /* 퉁: 두 장이 나란히 */
              <div className="flex justify-center gap-3">
                {myPlayer.cards.map((card, i) => (
                  <CardFace key={i} card={card} />
                ))}
              </div>
            ) : (
              /* 기리: 1번째 / 2번째 레이블과 함께 */
              <div className="flex justify-center gap-6">
                {myPlayer.cards.map((card, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{i + 1}번째</span>
                    <CardFace card={card} />
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full" onClick={() => setShowCardConfirm(false)}>
              확인
            </Button>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
