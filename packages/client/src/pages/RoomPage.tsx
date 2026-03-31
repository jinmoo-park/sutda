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
import { GollaSelectModal } from '@/components/modals/GollaSelectModal';
import { ModeSelectModal } from '@/components/modals/ModeSelectModal';
import { SharedCardSelectModal } from '@/components/modals/SharedCardSelectModal';
import { ShuffleModal } from '@/components/modals/ShuffleModal';
import { CutModal } from '@/components/modals/CutModal';
import { RechargeVoteModal } from '@/components/modals/RechargeVoteModal';
import { GusaRejoinModal } from '@/components/modals/GusaRejoinModal';
import { GusaAnnounceModal } from '@/components/modals/GusaAnnounceModal';
import { SejangCardSelectModal } from '@/components/modals/SejangCardSelectModal';
import { SejangOpenCardModal } from '@/components/modals/SejangOpenCardModal';
import { MuckChoiceModal } from '@/components/modals/MuckChoiceModal';
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
  const [showCardConfirm, setShowCardConfirm] = useState(false);
  const [cardConfirmed, setCardConfirmed] = useState(false);
  // 세장섯다 3번째 카드 확인: phase === 'card-select' && !sejangThirdCardDismissed 이면 오버레이 표시
  const [sejangThirdCardDismissed, setSejangThirdCardDismissed] = useState(false);
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

  // game-error 이벤트 핸들러 — 골라골라 카드 선착순 에러 등 코드별 토스트 표시
  useEffect(() => {
    if (!socket) return;
    const handleGameError = ({ code, message }: { code: string; message: string }) => {
      if (code === 'CARD_ALREADY_TAKEN') {
        toast.error('이미 선택된 카드입니다. 다른 카드를 선택하세요.');
      } else {
        toast.error(message || '오류가 발생했습니다. 다시 시도해 주세요.');
      }
    };
    socket.on('game-error', handleGameError);
    return () => { socket.off('game-error', handleGameError); };
  }, [socket]);

  // cutting/shuffling → betting/betting-1/sejang-open 전환 감지 → 딜링 애니메이션 후 카드 확인 오버레이 표시
  // (skipCutting 재경기 시 shuffling → betting 직접 전환)
  useEffect(() => {
    if ((prevPhaseRef.current === 'cutting' || prevPhaseRef.current === 'shuffling') &&
        (gameState?.phase === 'betting' || gameState?.phase === 'betting-1' || gameState?.phase === 'sejang-open')) {
      const players = gameState.players;
      const isTtong = gameState.isTtong;

      if (dealingIntervalRef.current) {
        clearInterval(dealingIntervalRef.current);
        dealingIntervalRef.current = null;
      }

      // 골라골라: 직접 선택이므로 딜링 애니메이션 없음 — visibleCardCounts 즉시 최종값으로 설정
      if (gameState.mode === 'gollagolla') {
        const counts: Record<string, number> = {};
        players.forEach(p => { counts[p.id] = 2; });
        setVisibleCardCounts(counts);
        prevPhaseRef.current = gameState.phase;
        return;
      }

      // 인디언섯다: 첫 패는 본인에게 숨겨지므로 카드 확인 오버레이 표시 안 함 — 즉시 베팅 가능
      if (gameState.mode === 'indian') {
        const counts: Record<string, number> = {};
        players.forEach(p => { counts[p.id] = 1; });
        setVisibleCardCounts(counts);
        setCardConfirmed(true);
        prevPhaseRef.current = gameState.phase;
        return;
      }

      // 한장공유는 1장씩 1라운드, 나머지는 1장씩 2라운드
      const cardRounds = gameState.mode === 'shared-card' ? 1 : 2;

      if (isTtong) {
        const counts: Record<string, number> = {};
        players.forEach((p) => { counts[p.id] = 2; });
        setVisibleCardCounts(counts);
        // 세장섯다는 SejangOpenCardModal이 카드 공개 역할 수행 — showCardConfirm 생략
        if (gameState.mode !== 'three-card') {
          setTimeout(() => setShowCardConfirm(true), 700);
        }
      } else {
        const initial: Record<string, number> = {};
        players.forEach((p) => { initial[p.id] = 0; });
        setVisibleCardCounts(initial);

        let step = 0;
        const totalSteps = players.length * cardRounds;
        const isSejang = gameState.mode === 'three-card';

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
            // 세장섯다는 SejangOpenCardModal이 카드 공개 역할 수행 — showCardConfirm 생략
            if (!isSejang) {
              setTimeout(() => setShowCardConfirm(true), 600);
            }
          }
        }, 500);
      }
    }

    // 세장섯다: sejang-open → betting-1 전환 시 cardConfirmed 자동 설정
    // (SejangOpenCardModal에서 이미 카드를 확인했으므로 별도 확인 불필요)
    if (prevPhaseRef.current === 'sejang-open' && gameState?.phase === 'betting-1') {
      setCardConfirmed(true);
    }

    // 골라골라: gollagolla-select → betting 전환 시 cardConfirmed 자동 설정
    // (GollaSelectModal에서 이미 카드를 선택했으므로 별도 확인 불필요)
    if (prevPhaseRef.current === 'gollagolla-select' && gameState?.phase === 'betting') {
      setCardConfirmed(true);
      prevPhaseRef.current = gameState.phase;
      return;
    }

    // 인디언 모드: betting-1 → betting-2 (dealing-extra는 서버 자동처리로 클라이언트에 안 보임)
    // visibleCardCounts가 1로 묶여 있으므로 2번째 카드가 보이도록 2로 업데이트
    if (prevPhaseRef.current === 'betting-1' && gameState?.phase === 'betting-2') {
      if (gameState.mode === 'indian') {
        const counts: Record<string, number> = {};
        gameState.players.forEach(p => { counts[p.id] = 2; });
        setVisibleCardCounts(counts);
        prevPhaseRef.current = gameState.phase;
        return;
      }
    }
  }, [gameState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // 베팅/커팅 phase 벗어나면 딜링 상태 초기화
  useEffect(() => {
    const p = gameState?.phase;
    if (p !== 'betting' && p !== 'betting-1' && p !== 'betting-2' && p !== 'cutting' && p !== 'card-select' && p !== 'sejang-open') {
      setVisibleCardCounts({});
      setShowCardConfirm(false);
      setCardConfirmed(false);
      if (dealingIntervalRef.current) {
        clearInterval(dealingIntervalRef.current);
        dealingIntervalRef.current = null;
      }
    }
    if (p !== 'betting-2') {
      setSejangThirdCardDismissed(false);
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

  // 구사 재경기 안내 (전원 생존 시)
  if (phase === 'gusa-announce') {
    return (
      <GusaAnnounceModal
        roomId={roomId!}
        isDealer={myPlayer?.isDealer ?? false}
      />
    );
  }

  // 구사 재경기 대기
  if (phase === 'gusa-pending') {
    const myDecision = gameState?.gusaPendingDecisions?.[myPlayerId ?? ''];
    const amDied = myPlayer && !myPlayer.isAlive;
    const needsDecision = amDied && myDecision === null;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground gap-6 p-6">
        <h2 className="text-xl font-semibold">구사 재경기!</h2>
        <p className="text-muted-foreground">구사 패가 감지되어 재경기를 진행합니다</p>
        {needsDecision ? (
          <GusaRejoinModal
            roomId={roomId!}
            potAmount={gameState!.pot}
            myChips={myPlayer!.chips}
          />
        ) : amDied ? (
          <p className="text-sm text-muted-foreground">
            {myDecision === true ? '재참여 결정 완료 — 대기 중...' : '불참 — 대기 중...'}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">다이한 플레이어의 결정을 기다리는 중...</p>
        )}
        <Toaster />
      </div>
    );
  }

  // 동점 재경기 대기
  if (phase === 'rematch-pending') {
    const tiedIds = gameState?.tiedPlayerIds ?? [];
    const confirmedIds = gameState?.rematchConfirmedIds ?? [];
    const tiedPlayers = gameState?.players.filter(p => tiedIds.includes(p.id)) ?? [];
    const amTied = myPlayerId ? tiedIds.includes(myPlayerId) : false;
    const alreadyConfirmed = myPlayerId ? confirmedIds.includes(myPlayerId) : false;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4 p-6">
          <h2 className="text-xl font-semibold">동점!</h2>
          <p className="text-muted-foreground">
            {tiedPlayers.map(p => p.nickname).join(' vs ')} — 재경기
          </p>
          {amTied ? (
            alreadyConfirmed ? (
              <p className="text-sm text-muted-foreground">다른 동점 플레이어를 기다리는 중...</p>
            ) : (
              <Button onClick={() => socket?.emit('start-rematch', { roomId: roomId! })}>
                재경기 시작
              </Button>
            )
          ) : (
            <p className="text-sm text-muted-foreground">동점 플레이어들의 재경기 준비를 기다리는 중...</p>
          )}
        </div>
        <Toaster />
      </div>
    );
  }

  // 게임 진행 중
  const handPanelNode = (
    <HandPanel
      myPlayer={myPlayer}
      phase={gameState.phase}
      sharedCard={gameState.mode === 'shared-card' ? gameState.sharedCard : undefined}
      visibleCardCount={
        phase === 'card-select' || (phase === 'betting-2' && gameState.mode === 'three-card')
          ? (myPlayer?.cards.length ?? 0)
          : Object.keys(visibleCardCounts).length > 0
            ? (visibleCardCounts[myPlayerId ?? ''] ?? 0)
            : undefined
      }
      nickname={myPlayer?.nickname}
    />
  );

  const bettingPanelNode = (phase === 'betting' || phase === 'betting-1' || phase === 'betting-2') && cardConfirmed && (myPlayer?.isAlive ?? false) ? (
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
  ) : null;

  const gameTableNode = (
    <GameTable
      players={gameState.players}
      myPlayerId={myPlayerId}
      currentPlayerIndex={gameState.currentPlayerIndex}
      pot={gameState.pot}
      visibleCardCounts={Object.keys(visibleCardCounts).length > 0 ? visibleCardCounts : undefined}
      sharedCard={gameState.sharedCard}
      mode={gameState.mode}
    />
  );

  const infoPanelNode = (
    <InfoPanel
      myChips={myPlayer?.chips ?? 0}
      pot={gameState.pot}
      players={gameState.players}
      myPlayerId={myPlayerId}
    />
  );

  return (
    <div className="bg-background text-foreground">
      {/* 데스크탑: 3열 그리드 */}
      <div className="hidden md:grid grid-cols-[256px_1fr_256px] h-dvh overflow-hidden">
        {/* 좌사이드: BettingPanel + HandPanel */}
        <div className="flex flex-col border-r border-border overflow-y-auto">
          {bettingPanelNode}
          {handPanelNode}
        </div>

        {/* 중앙: GameTable */}
        <div className="flex items-center justify-center overflow-hidden">
          {gameTableNode}
        </div>

        {/* 우사이드: InfoPanel + ChatPanel */}
        <div className="flex flex-col border-l border-border overflow-y-auto">
          {infoPanelNode}
          <ChatPanel />
        </div>
      </div>

      {/* 모바일: 수직 flex */}
      <div className="md:hidden flex flex-col h-dvh overflow-hidden">
        {/* 상단: GameTable + InfoPanel 오버레이 */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {gameTableNode}
          <div className="absolute top-2 right-2 z-10">
            {infoPanelNode}
          </div>
        </div>

        {/* 중단: HandPanel + BettingPanel */}
        <div className="shrink-0 border-t border-border">
          {handPanelNode}
          {bettingPanelNode}
        </div>

        {/* 하단: ChatPanel placeholder */}
        <div className="shrink-0 h-12 border-t border-border flex items-center justify-center">
          <ChatPanel />
        </div>
      </div>

      {/* 잠시 쉬기 중 → 복귀 예약 배너 (phase 무관) */}
      {myPlayer?.isAbsent && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-secondary text-secondary-foreground shadow-lg text-sm">
          <span>자리비움 중 — 다음 판부터 참여</span>
          <Button
            size="sm"
            variant="default"
            onClick={() => socket?.emit('return-from-break', { roomId: roomId! })}
          >
            복귀 예약
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
      <GollaSelectModal open={phase === 'gollagolla-select'} roomId={roomId!} />
      {/* 세장섯다: 2장 배분 후 오픈 카드 선택 */}
      <SejangOpenCardModal open={phase === 'sejang-open' && (myPlayer?.isAlive ?? false)} roomId={roomId!} />
      {/* 세장섯다: 3장 중 2장 선택 (3번째 카드 확인 후에만 표시) */}
      <SejangCardSelectModal open={phase === 'card-select' && (myPlayer?.isAlive ?? false)} roomId={roomId!} />
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



      {/* 카드 확인 오버레이 — cutting → betting 전환 시 (생존자만) */}
      {showCardConfirm && myPlayer && !myPlayer.isAbsent && myPlayer.isAlive && (
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
            <Button className="w-full" onClick={() => { setShowCardConfirm(false); setCardConfirmed(true); }}>
              확인
            </Button>
          </div>
        </div>
      )}

      {/* 세장섯다 3번째 카드 확인 오버레이 (생존자만, betting-2 진입 시 자동 표시) */}
      {phase === 'betting-2' && gameState?.mode === 'three-card' && !sejangThirdCardDismissed && myPlayer && !myPlayer.isAbsent && myPlayer.isAlive && myPlayer.cards.length >= 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="bg-card rounded-xl p-6 space-y-4 text-center shadow-xl min-w-[280px]">
            <h3 className="text-lg font-semibold">3번째 카드!</h3>
            <div className="flex justify-center">
              <CardFace card={myPlayer.cards[2]} />
            </div>
            <Button className="w-full" onClick={() => setSejangThirdCardDismissed(true)}>
              확인
            </Button>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
