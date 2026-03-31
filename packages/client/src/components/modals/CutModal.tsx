import { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGiriStore } from '@/store/giriStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HwatuCard } from '@/components/game/HwatuCard';
import { cn } from '@/lib/utils';

interface CutModalProps {
  open: boolean;
  roomId: string;
}

const DRAG_THRESHOLD = 8; // px

export function CutModal({ open, roomId }: CutModalProps) {
  const { socket } = useGameStore();
  const { phase, piles, tapOrder, isTtong, initSplit, splitPile, tapPile, untapPile, setMerging, setDone, setTtong, reset } =
    useGiriStore();

  const pointerStartRef = useRef<{ x: number; y: number; pileId: number } | null>(null);
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (open) {
      initSplit();
    }
  }, [open, initSplit]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
    };
  }, []);

  // 합치기 애니메이션 완료 후 서버 emit
  useEffect(() => {
    if (phase === 'merging') {
      mergeTimerRef.current = setTimeout(() => {
        emitCutResult();
        setDone();
      }, 380);
    }
  }, [phase]);

  function emitCutResult() {
    if (isTtong) {
      socket?.emit('declare-ttong', { roomId });
      return;
    }

    // cutPoints: 각 더미 경계의 누적 카드 수
    const cutPoints: number[] = [];
    let acc = 0;
    for (let i = 0; i < piles.length - 1; i++) {
      acc += piles[i].cardCount;
      cutPoints.push(acc);
    }

    // order: tapOrder를 piles 배열 인덱스로 매핑
    const order = tapOrder.map((pileId) => piles.findIndex((p) => p.id === pileId));

    socket?.emit('cut', { roomId, cutPoints, order });
  }

  function handlePilePointerDown(e: React.PointerEvent, pileId: number) {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, pileId };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePilePointerMove(e: React.PointerEvent) {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      const pile = piles.find((p) => p.id === pointerStartRef.current!.pileId);
      if (pile && pile.cardCount > 1) {
        const splitPoint = Math.floor(pile.cardCount / 2);
        splitPile(pointerStartRef.current.pileId, splitPoint);
      }
      pointerStartRef.current = null;
    }
  }

  function handlePilePointerUp(e: React.PointerEvent, pileId: number) {
    if (pointerStartRef.current) {
      // 탭으로 처리: threshold 미달 이동 후 pointerup
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      if (dx <= DRAG_THRESHOLD && piles.length > 1) {
        // tap phase: 순서 지정
        const isAlreadyTapped = tapOrder.includes(pileId);
        if (isAlreadyTapped) {
          untapPile(pileId);
        } else {
          tapPile(pileId);
        }
      }
      pointerStartRef.current = null;
    }
  }

  function handleMerge() {
    setMerging();
  }

  function handleTtong() {
    setTtong();
    socket?.emit('declare-ttong', { roomId });
  }

  const allTapped = piles.length > 1 && tapOrder.length === piles.length;
  const canMerge = allTapped;

  // 더미당 시각화할 카드 수 (최대 5장 겹침)
  const CARD_STACK_MAX = 5;

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>기리</DialogTitle>
        </DialogHeader>

        {/* 안내 텍스트 */}
        <p className="text-xs text-muted-foreground text-center">
          {phase === 'split' && piles.length === 1
            ? '드래그해서 더미를 나누세요'
            : phase === 'split' && piles.length > 1
              ? '더미를 탭해서 합칠 순서를 정하세요 (1번이 맨 아래)'
              : phase === 'tap' || (phase === 'split' && tapOrder.length > 0)
                ? '더미를 탭해서 합칠 순서를 정하세요 (1번이 맨 아래)'
                : phase === 'merging'
                  ? '합치는 중...'
                  : '완료'}
        </p>

        {/* 더미 시각화 */}
        <div className="flex gap-4 justify-center py-4 min-h-[120px] items-end">
          {piles.map((pile) => {
            const orderPos = tapOrder.indexOf(pile.id);
            const isSelected = orderPos !== -1;
            const stackCount = Math.min(pile.cardCount, CARD_STACK_MAX);

            return (
              <div
                key={pile.id}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-md p-1 cursor-pointer select-none',
                  'transition-transform',
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'ring-1 ring-border opacity-70 hover:opacity-90',
                )}
                style={{
                  transform:
                    phase === 'merging'
                      ? 'translateX(0) translateY(-10px)'
                      : `translateX(${pile.offsetX}px)`,
                  transition:
                    phase === 'merging'
                      ? 'transform 380ms cubic-bezier(0.42, 0, 0.58, 1), opacity 380ms'
                      : 'transform 200ms ease-out',
                  opacity: phase === 'merging' ? 0 : 1,
                }}
                onPointerDown={(e) => handlePilePointerDown(e, pile.id)}
                onPointerMove={handlePilePointerMove}
                onPointerUp={(e) => handlePilePointerUp(e, pile.id)}
              >
                <div
                  className="relative"
                  style={{ height: `${Math.min(stackCount * 4 + 83, 120)}px`, width: '51px' }}
                >
                  {Array.from({ length: stackCount }, (_, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{ top: `${i * 4}px`, left: 0 }}
                    >
                      <HwatuCard faceUp={false} size="sm" />
                    </div>
                  ))}
                  {/* 순서 번호 배지 */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-10">
                      {orderPos + 1}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{pile.cardCount}장</span>
              </div>
            );
          })}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex gap-2 justify-center flex-wrap">
          {phase !== 'merging' && phase !== 'done' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTtong}
            >
              퉁
            </Button>
          )}
          {piles.length > 1 && (
            <Button
              size="sm"
              onClick={handleMerge}
              disabled={!canMerge}
            >
              합치기
            </Button>
          )}
        </div>

        <DialogFooter>
          {/* 더미가 1개인 경우 (기리 안 함) 바로 퉁으로 진행 */}
          {piles.length === 1 && phase === 'split' && (
            <p className="text-xs text-muted-foreground">
              드래그로 더미를 나누거나, 퉁 버튼을 누르세요
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
