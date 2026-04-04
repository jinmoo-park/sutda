import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useGameStore } from '@/store/gameStore';
import { useSfxPlayer } from '@/hooks/useSfxPlayer';
import { useBgmPlayer } from '@/hooks/useBgmPlayer';
import { AudioControlBar } from '@/components/layout/AudioControlBar';
import { WaitingTable } from '@/components/layout/WaitingTable';
import { GameTable } from '@/components/layout/GameTable';
import { HandPanel } from '@/components/layout/HandPanel';
import { BettingPanel } from '@/components/layout/BettingPanel';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { ResultScreen } from '@/components/layout/ResultScreen';
import { DealerSelectModal } from '@/components/modals/DealerSelectModal';
import { GollaSelectModal } from '@/components/modals/GollaSelectModal';
import { ModeSelectModal } from '@/components/modals/ModeSelectModal';
import { SharedCardSelectModal } from '@/components/modals/SharedCardSelectModal';
import { ShuffleModal } from '@/components/modals/ShuffleModal';
import { CutModal } from '@/components/modals/CutModal';
import { SpectatorCutView } from '@/components/modals/SpectatorCutView';
import { GusaRejoinModal } from '@/components/modals/GusaRejoinModal';
import { GusaAnnounceModal } from '@/components/modals/GusaAnnounceModal';
import { SejangCardSelectModal } from '@/components/modals/SejangCardSelectModal';
import { SejangOpenCardModal } from '@/components/modals/SejangOpenCardModal';
import { MuckChoiceModal } from '@/components/modals/MuckChoiceModal';
import { DealerResultOverlay } from '@/components/modals/DealerResultOverlay';
import type { DealerSelectResult } from '@/components/modals/DealerResultOverlay';
import { HwatuCard } from '@/components/game/HwatuCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HistoryModal } from '@/components/modals/HistoryModal';
import { Clock, Send } from 'lucide-react';
import { ModalContainerContext } from '@/lib/modalContainerContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// sessionStorage 키 헬퍼 (roomId별로 입장 정보 저장)
function getRoomSessionKey(roomId: string) { return `sutda_room_${roomId}`; }
interface RoomSession { nickname: string; initialChips: number; isHost: boolean }

/** 모바일 전용 채팅 입력 바 — 손패/베팅 패널 바로 위에 항상 표시 */
function MobileChatInput() {
  const { socket, roomState } = useGameStore();
  const [input, setInput] = useState('');
  const [sendDisabled, setSendDisabled] = useState(false);
  const isConnected = socket?.connected ?? false;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !roomState?.roomId || sendDisabled) return;
    socket?.emit('send-chat', { roomId: roomState.roomId, text: trimmed });
    setInput('');
    setSendDisabled(true);
    setTimeout(() => setSendDisabled(false), 500);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-background/80">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value.slice(0, 200))}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        placeholder="채팅"
        disabled={!isConnected}
        className="flex-1 h-7 px-2 rounded border border-input bg-background text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        style={{ fontSize: '16px' }}
        maxLength={200}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || sendDisabled || !isConnected}
        className="h-7 w-7 flex items-center justify-center rounded text-primary hover:bg-accent disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as { nickname?: string; initialChips?: number; isHost?: boolean } | null;
  const { socket, connect, gameState, roomState, myPlayerId, error, clearError } = useGameStore();
  const { play: playSfx, isMuted: sfxMuted, toggleMute: toggleSfx } = useSfxPlayer();
  const { isMuted: bgmMuted, toggleMute: toggleBgm } = useBgmPlayer();
  const serverUrl = import.meta.env.VITE_SERVER_URL || '';

  // location.state → sessionStorage 순서로 입장 정보 복원 (새로고침 대응)
  const cachedSession: RoomSession | null = (() => {
    try { return JSON.parse(localStorage.getItem(getRoomSessionKey(roomId!)) ?? 'null'); } catch { return null; }
  })();
  const initNickname = locationState?.nickname ?? cachedSession?.nickname ?? '';
  const initChips = locationState?.initialChips ?? cachedSession?.initialChips ?? 100000;
  const initIsHost = locationState?.isHost === true || cachedSession?.isHost === true;

  const [nickname, setNickname] = useState(initNickname);
  const [initialChips, setInitialChips] = useState(initChips);
  // cachedSession이 있으면 재접속 중 — 폼을 먼저 보여주지 않음
  const [hasJoined, setHasJoined] = useState(initIsHost || !!cachedSession?.nickname);
  const [dealingComplete, setDealingComplete] = useState(true);
  const [cardConfirmed, setCardConfirmed] = useState(false);
  const [myFlippedIndices, setMyFlippedIndices] = useState<Set<number>>(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const { roundHistory } = useGameStore();
  // 세장섯다 3번째 카드 확인: phase === 'card-select' && !sejangThirdCardDismissed 이면 오버레이 표시
  const [sejangThirdCardDismissed, setSejangThirdCardDismissed] = useState(false);
  // 기리 관전자 상태 (본인 외 플레이어에게 실시간 스트리밍)
  const [spectatorGiriState, setSpectatorGiriState] = useState<{
    phase: 'split' | 'tap' | 'merging' | 'done';
    piles: { id: number; cardCount: number; x: number; y: number }[];
    tapOrder: number[];
    cutterNickname: string;
  } | null>(null);
  const [visibleCardCounts, setVisibleCardCounts] = useState<Record<string, number>>({});
  const dealingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 모달 포털 컨테이너 (게임 테이블 영역)
  const [modalContainer, setModalContainer] = useState<HTMLElement | null>(null);
  const modalContainerRef = useCallback((node: HTMLElement | null) => { if (node && node.offsetWidth > 0) setModalContainer(node); }, []);

  // 입장 정보를 localStorage에 저장 (브라우저 닫혀도 복원용 — iOS 브라우저가 잠시 닫힐 때 sessionStorage 소실 방지)
  useEffect(() => {
    if (locationState?.nickname && roomId) {
      const session: RoomSession = {
        nickname: locationState.nickname,
        initialChips: locationState.initialChips ?? 100000,
        isHost: locationState.isHost === true,
      };
      localStorage.setItem(getRoomSessionKey(roomId), JSON.stringify(session));
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

  // 재연결 시 자동 재입장 — connect 이벤트마다 localStorage 세션으로 join-room 재전송
  // hasReconnectedRef 제거: iOS 브라우저 닫힘/재로드 후 첫 connect도 재입장 처리해야 함
  // 서버의 joinRoom은 닉네임 기반 중복 처리로 멱등성 보장
  useEffect(() => {
    if (!socket) return;
    const handleReconnect = () => {
      const session: RoomSession | null = (() => {
        try { return JSON.parse(localStorage.getItem(getRoomSessionKey(roomId!)) ?? 'null'); } catch { return null; }
      })();
      if (session?.nickname && roomId) {
        socket.emit('join-room', {
          roomId,
          nickname: session.nickname,
          initialChips: session.initialChips,
        });
      }
    };
    socket.on('connect', handleReconnect);
    return () => { socket.off('connect', handleReconnect); };
  }, [socket, roomId]);

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

  // kicked 이벤트 — 0원 강제퇴장: localStorage 세션 삭제 후 홈으로 이동
  useEffect(() => {
    if (!socket) return;
    const handleKicked = ({ reason }: { reason: string }) => {
      if (roomId) localStorage.removeItem(getRoomSessionKey(roomId));
      if (reason === 'NO_CHIPS') {
        toast.error('칩이 부족하여 퇴장되었습니다. 다시 입장하려면 닉네임을 입력하세요.');
      } else {
        toast.error('방에서 퇴장되었습니다.');
      }
      // 같은 방 URL로 돌아가되 locationState 없이 → cachedSession도 없으므로 닉네임 폼 표시
      setTimeout(() => navigate(`/room/${roomId}`, { replace: true }), 1500);
    };
    socket.on('kicked', handleKicked);
    return () => { socket.off('kicked', handleKicked); };
  }, [socket, roomId, navigate]);

  // giri-phase-update 이벤트: 기리 플레이어가 단계 전환 시 관전자에게 실시간 브로드캐스트
  useEffect(() => {
    if (!socket) return;
    const handleGiriPhaseUpdate = (data: {
      phase: 'split' | 'tap' | 'merging' | 'done';
      piles: { id: number; cardCount: number; x: number; y: number }[];
      tapOrder: number[];
      cutterNickname: string;
    }) => {
      setSpectatorGiriState({
        phase: data.phase,
        piles: data.piles,
        tapOrder: data.tapOrder,
        cutterNickname: data.cutterNickname,
      });
      // 기리 split 단계 SFX (관전자에게도 재생)
      if (data.phase === 'split') {
        playSfx('giri');
      }
    };
    socket.on('giri-phase-update', handleGiriPhaseUpdate);
    return () => { socket.off('giri-phase-update', handleGiriPhaseUpdate); };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // cutting phase 벗어나면 spectatorGiriState 초기화
  useEffect(() => {
    if (gameState?.phase !== 'cutting') {
      setSpectatorGiriState(null);
    }
  }, [gameState?.phase]);

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

      // 배분 시작: dealingComplete → false (flip 인터랙션 잠금)
      playSfx('deal');
      setDealingComplete(false);

      // 골라골라: 직접 선택이므로 딜링 애니메이션 없음 — visibleCardCounts 즉시 최종값으로 설정
      if (gameState.mode === 'gollagolla') {
        const counts: Record<string, number> = {};
        players.forEach(p => { counts[p.id] = 2; });
        setVisibleCardCounts(counts);
        setDealingComplete(true);
        prevPhaseRef.current = gameState.phase;
        return;
      }

      // 인디언섯다: 첫 패는 본인에게 숨겨지므로 카드 확인 오버레이 표시 안 함 — 즉시 베팅 가능
      if (gameState.mode === 'indian') {
        const counts: Record<string, number> = {};
        players.forEach(p => { counts[p.id] = 1; });
        setVisibleCardCounts(counts);
        setCardConfirmed(true);
        setDealingComplete(true);
        prevPhaseRef.current = gameState.phase;
        return;
      }

      // 한장공유는 1장씩 1라운드, 나머지는 1장씩 2라운드
      const cardRounds = gameState.mode === 'shared-card' ? 1 : 2;

      if (isTtong) {
        const counts: Record<string, number> = {};
        players.forEach((p) => { counts[p.id] = 2; });
        setVisibleCardCounts(counts);
        // 퉁: 배분 애니메이션 후 즉시 flip 가능
        setTimeout(() => {
          setDealingComplete(true);
          // 세장섯다: 퉁 시에도 두 장 자동 공개
          if (gameState.mode === 'three-card') {
            setMyFlippedIndices(new Set([0, 1]));
          }
        }, 700);
      } else {
        const initial: Record<string, number> = {};
        players.forEach((p) => { initial[p.id] = 0; });
        setVisibleCardCounts(initial);

        let step = 0;
        const totalSteps = players.length * cardRounds;

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
            // 배분 완료 후 flip 인터랙션 활성화
            setTimeout(() => {
              setDealingComplete(true);
              // 세장섯다: 딜링 완료 시 두 장을 자동으로 공개 (미리 보고 공유 카드 선택)
              if (gameState.mode === 'three-card') {
                setMyFlippedIndices(new Set([0, 1]));
              }
            }, 600);
          }
        }, 500);
      }
    }

    // 세장섯다: sejang-open → betting-1 전환 시 cardConfirmed 자동 설정
    // (SejangOpenCardModal에서 이미 카드를 확인했으므로 별도 확인 불필요)
    if (prevPhaseRef.current === 'sejang-open' && gameState?.phase === 'betting-1') {
      setCardConfirmed(true);
      // 세장섯다: betting-1 진입 시 두 장 공개 상태 유지
      setMyFlippedIndices(new Set([0, 1]));
    }

    // 골라골라: gollagolla-select → betting 전환 시 cardConfirmed 자동 설정
    // (GollaSelectModal에서 이미 카드를 선택했으므로 별도 확인 불필요)
    if (prevPhaseRef.current === 'gollagolla-select' && gameState?.phase === 'betting') {
      setCardConfirmed(true);
      prevPhaseRef.current = gameState.phase;
      return;
    }

    // 인디언 모드: betting-1 → betting-2 (dealing-extra가 클라이언트에 도달하는 경우도 처리)
    // visibleCardCounts가 1로 묶여 있으므로 2번째 카드가 보이도록 2로 업데이트
    if ((prevPhaseRef.current === 'betting-1' || prevPhaseRef.current === 'dealing-extra') && gameState?.phase === 'betting-2') {
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
    if (p !== 'betting' && p !== 'betting-1' && p !== 'betting-2' && p !== 'cutting' && p !== 'card-select' && p !== 'sejang-open' && p !== 'dealing-extra') {
      setVisibleCardCounts({});
      setMyFlippedIndices(new Set());
      setDealingComplete(true);
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

  // card-reveal phase 진입 감지 → play('card-reveal')
  useEffect(() => {
    const currentPhase = (gameState?.phase ?? null) as string | null;
    const BETTING_PHASES = ['betting', 'betting-1', 'betting-2', 'card-select'];
    if (BETTING_PHASES.includes(prevPhaseRef.current ?? '') && currentPhase === 'card-reveal') {
      playSfx('card-reveal');
    }
  }, [gameState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // dealer-select → attend-school 전환 감지 → 결과 오버레이 3초 표시
  useEffect(() => {
    const currentPhase = gameState?.phase ?? null;
    if (
      prevPhaseRef.current === 'dealer-select' &&
      (currentPhase === 'attend-school' || currentPhase === 'mode-select') &&
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
        localStorage.removeItem(getRoomSessionKey(roomId));
        setHasJoined(false);
      }
      clearError();
    }
  }, [error, clearError]);

  // 대기중(waiting)일 때 다른 플레이어가 입장하면 카드 뒤집기 SFX 재생
  const prevPlayerCountRef = useRef<number>(0);
  useEffect(() => {
    const currentCount = roomState?.players.length ?? 0;
    const prevCount = prevPlayerCountRef.current;
    if (roomState?.gamePhase === 'waiting' && currentCount > prevCount && prevCount > 0) {
      playSfx('flip');
    }
    prevPlayerCountRef.current = currentCount;
  }, [roomState?.players.length, roomState?.gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // 재접속 시 폼 없이 복원될 수 있도록 localStorage에 세션 저장
    localStorage.setItem(getRoomSessionKey(roomId!), JSON.stringify({
      nickname: nickname.trim(),
      initialChips,
      isHost: false,
    } satisfies RoomSession));
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
          <div
            role="img"
            aria-label="섯다"
            style={{ width: '100%', maxWidth: '360px', aspectRatio: '1632/656', backgroundImage: 'url(/img/main_title_alt.webp)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', margin: '0 auto 8px' }}
          />
          <div className="space-y-2">
            <label className="text-sm font-normal text-muted-foreground" htmlFor="nickname-input">
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
            <label className="text-sm font-normal text-muted-foreground" htmlFor="chips-input">
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

  // 대기실 (게임 시작 전) — 게임 레이아웃과 동일한 구조, 중앙만 대기 UI
  if (phase === 'waiting' || !gameState) {
    if (!roomState) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <p className="text-muted-foreground">방 {roomId} 연결 중...</p>
          <Toaster />
        </div>
      );
    }
    return (
      <div className="bg-background text-foreground">
        {/* 데스크탑: 2열 그리드 */}
        <div className="hidden md:grid grid-cols-[1fr_clamp(256px,calc(100vw-1408px),512px)] h-dvh overflow-hidden">
          <div className="relative overflow-hidden">
            <WaitingTable roomState={roomState} myPlayerId={myPlayerId} roomId={roomId!} />
          </div>
          <div className="flex flex-col border-l border-border overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatPanel />
            </div>
          </div>
        </div>
        {/* 모바일: 수직 flex */}
        <div className="md:hidden flex flex-col h-dvh overflow-hidden">
          <div className="relative flex-1 min-h-0 overflow-hidden">
            <WaitingTable roomState={roomState} myPlayerId={myPlayerId} roomId={roomId!} />
          </div>
          <div className="shrink-0 border-t border-border">
            <MobileChatInput />
          </div>
        </div>
        <Toaster />
      </div>
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

  // 게임 진행 중
  const isResultPhase = phase === 'result' || phase === 'finished' || phase === 'card-reveal' || phase === 'rematch-pending';
  const isRematch = ['gusa-pending', 'gusa-announce', 'rematch-pending'].includes(prevPhaseRef.current ?? '');

  const handPanelNode = (
    <HandPanel
      myPlayer={myPlayer}
      phase={gameState.phase}
      mode={gameState.mode}
      sharedCard={gameState.mode === 'shared-card' ? gameState.sharedCard : undefined}
      visibleCardCount={
        phase === 'card-select' || (phase === 'betting-2' && gameState.mode === 'three-card')
          ? (myPlayer?.cards.length ?? 0)
          : Object.keys(visibleCardCounts).length > 0
            ? (visibleCardCounts[myPlayerId ?? ''] ?? 0)
            : undefined
      }
      nickname={myPlayer?.nickname}
      flippedIndices={myFlippedIndices}
      onFlip={(idx) => { playSfx('flip'); setMyFlippedIndices(prev => { const n = new Set(prev); n.add(idx); return n; }); }}
      dealingComplete={dealingComplete}
      bgmMuted={bgmMuted}
      onToggleBgm={toggleBgm}
      sfxMuted={sfxMuted}
      onToggleSfx={toggleSfx}
    />
  );

  const bettingPanelNode = (phase === 'betting' || phase === 'betting-1' || phase === 'betting-2') && dealingComplete && (myPlayer?.isAlive ?? false) ? (
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
      dealingComplete={dealingComplete}
      myFlippedCardIndices={myFlippedIndices}
      roomState={roomState}
    />
  );

  // 결과화면 or 게임테이블 중앙 패널
  const centerNode = isResultPhase ? (
    <ResultScreen
      gameState={gameState}
      myPlayerId={myPlayerId}
      roomId={roomId!}
      isRematch={isRematch}
      isRematchPending={phase === 'rematch-pending'}
      onEject={() => { setNickname(''); setHasJoined(false); }}
    />
  ) : gameTableNode;

  // 이력 버튼 노드 (데스크탑 우사이드 상단, 모바일 GameTable 우상단)
  const historyButtonNode = (
    <button
      onClick={() => setHistoryOpen(true)}
      disabled={roundHistory.length === 0}
      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 rounded transition-colors"
      aria-label={roundHistory.length === 0 ? '이력 없음' : '게임 이력'}
    >
      <Clock className="h-3.5 w-3.5" />
      이력
    </button>
  );

  return (
    <ModalContainerContext.Provider value={modalContainer}>
    <div className="bg-background text-foreground">
      <AudioControlBar />
      {/* 데스크탑: 2열 그리드 */}
      <div className="hidden md:grid grid-cols-[1fr_clamp(256px,calc(100vw-1408px),512px)] h-dvh overflow-hidden">
        {/* 중앙: GameTable or ResultScreen — 모달 포털 대상 영역 */}
        <div ref={modalContainerRef} className="relative overflow-hidden">
          {centerNode}
        </div>

        {/* 우사이드: 이력 버튼 (상단) + ChatPanel (중단) + BettingPanel + HandPanel (하단, 게임 중에만) */}
        <div className="flex flex-col border-l border-border overflow-hidden">
          <div className="shrink-0 flex items-center justify-end px-3 py-1.5 border-b border-border">
            {historyButtonNode}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel />
          </div>
          {!isResultPhase && (
            <div className="shrink-0 p-2 space-y-2 border-t border-border">
              {bettingPanelNode}
              {handPanelNode}
            </div>
          )}
        </div>
      </div>

      {/* 모바일: 수직 flex */}
      <div className="md:hidden flex flex-col h-dvh overflow-hidden">
        {/* 상단: GameTable or ResultScreen (flex-1) */}
        <div ref={node => { if (node && node.offsetWidth > 0) setModalContainer(node); }} className="relative flex-1 min-h-0 overflow-hidden">
          {centerNode}
          {/* 우상단: 이력 버튼 (결과화면 제외) */}
          {!isResultPhase && (
            <div className="absolute top-2 right-2 z-10 bg-black/50 rounded backdrop-blur-sm">
              {historyButtonNode}
            </div>
          )}
        </div>

        {/* 하단: 채팅(최하단 고정) + 채팅 입력 + HandPanel + BettingPanel */}
        <div className="shrink-0 border-t border-border">
          {/* 모바일 채팅 — 모달/결과화면과 독립, 항상 최하단 */}
          <ChatPanel mobile />
          <MobileChatInput />
          {!isResultPhase && (
            <>
              <div className="flex flex-row items-start gap-1 p-1">
                <div className="shrink-0">
                  {handPanelNode}
                </div>
                {bettingPanelNode && (
                  <div className="flex-1 min-w-0">
                    {bettingPanelNode}
                  </div>
                )}
              </div>
            </>
          )}
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
      <ShuffleModal open={phase === 'shuffling' && !isDealer} roomId={roomId!} readOnly />
      <CutModal open={phase === 'cutting' && isMyTurn} roomId={roomId!} />
      {/* 기리 대기 — 본인 아닌 플레이어에게 실시간 더미 스트리밍 표시 */}
      <SpectatorCutView
        open={phase === 'cutting' && !isMyTurn}
        cutterNickname={spectatorGiriState?.cutterNickname ?? currentPlayerNickname ?? ''}
        giriPhase={spectatorGiriState?.phase ?? null}
        piles={spectatorGiriState?.piles ?? []}
        tapOrder={spectatorGiriState?.tapOrder ?? []}
      />
      {/* 상대 전원 다이 시 패 공개 선택 */}
      <MuckChoiceModal
        open={
          phase === 'showdown' &&
          gameState.winnerId === myPlayerId &&
          myPlayer !== null
        }
        roomId={roomId!}
        myCards={(myPlayer?.cards ?? []).filter((c): c is NonNullable<typeof c> => c != null)}
      />

      {/* 세장섯다 3번째 카드 확인 오버레이 (생존자만, betting-2 진입 시 자동 표시) */}
      {phase === 'betting-2' && gameState?.mode === 'three-card' && !sejangThirdCardDismissed && myPlayer && !myPlayer.isAbsent && myPlayer.isAlive && myPlayer.cards.length >= 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="bg-card rounded-xl p-6 space-y-4 text-center shadow-xl min-w-[280px]">
            <h3 className="text-lg font-semibold">3번째 카드!</h3>
            <div className="flex justify-center">
              <HwatuCard card={myPlayer.cards[2]} faceUp={true} size="md" />
            </div>
            <Button className="w-full" onClick={() => {
              setSejangThirdCardDismissed(true);
              setMyFlippedIndices(prev => { const n = new Set(prev); n.add(2); return n; });
            }}>
              확인
            </Button>
          </div>
        </div>
      )}

      <HistoryModal entries={roundHistory} open={historyOpen} onOpenChange={setHistoryOpen} />
      <Toaster />
    </div>
    </ModalContainerContext.Provider>
  );
}
