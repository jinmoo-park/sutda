import { useRef, useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGiriStore } from '@/store/giriStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CutModalProps {
  open: boolean;
  roomId: string;
}

// --- 참조 구현 포팅 (sutda-giri.html) ---
const CARD_H = 78;
const GAP = 8;
const DRAG_THRESHOLD = 8;
const TABLE_W = 360;
const TABLE_H = 220;

function pileH(n: number) { return CARD_H + (n - 1) * GAP; }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

export function CutModal({ open, roomId }: CutModalProps) {
  const { socket } = useGameStore();
  const { phase, piles, tapOrder, isTtong, initSplit, addSplitPile, tapPile, untapPile, setMerging, setDone, setTtong } =
    useGiriStore();

  const tableRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 포인터 추적 ref — 렌더링 없이 관리
  const pointerState = useRef<{
    pi: number;
    startX: number;
    startY: number;
    cutCount: number;
    isDragging: boolean;
  } | null>(null);

  // 즉시 차감된 카드 수 — 드래그 중 원본 더미에서 ghost로 이동
  const [deducted, setDeducted] = useState<{ pi: number; count: number } | null>(null);

  useEffect(() => {
    if (open) {
      // 테이블 실제 너비에 맞춰 더미 중앙 배치
      requestAnimationFrame(() => {
        const tw = tableRef.current?.offsetWidth ?? TABLE_W;
        initSplit((tw - 60) / 2, (TABLE_H - pileH(20)) / 2);
      });
      setDeducted(null);
    }
    return () => {
      if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
      removeGhost();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // merging 단계: 380ms 후 서버 emit
  useEffect(() => {
    if (phase === 'merging') {
      mergeTimerRef.current = setTimeout(() => {
        emitCutResult();
        setDone();
      }, 380);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function emitCutResult() {
    if (isTtong) {
      socket?.emit('declare-ttong', { roomId });
      return;
    }
    const cutPoints: number[] = [];
    let acc = 0;
    for (let i = 0; i < piles.length - 1; i++) {
      acc += piles[i].cardCount;
      cutPoints.push(acc);
    }
    const order = tapOrder.map((pileId) => piles.findIndex((p) => p.id === pileId));
    socket?.emit('cut', { roomId, cutPoints, order });
  }

  function spawnGhost(clientX: number, clientY: number, count: number) {
    if (ghostRef.current) return;
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;pointer-events:none;z-index:9999;width:60px;opacity:0.92;`;
    el.style.height = pileH(count) + 'px';
    const stackCount = Math.min(count, 5);
    for (let i = 0; i < stackCount; i++) {
      const c = document.createElement('div');
      c.style.cssText = `position:absolute;width:54px;height:${CARD_H}px;border-radius:5px;left:3px;background-image:url(/img/card_back.jpg);background-size:cover;background-position:center;`;
      c.style.top = (count - 1 - i) * GAP + 'px';
      c.style.zIndex = String(i + 1);
      c.style.boxShadow = i === stackCount - 1
        ? '0 14px 28px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)'
        : `0 ${2 + i}px 0 rgba(0,0,0,${0.12 + i * 0.03})`;
      el.appendChild(c);
    }
    el.style.left = (clientX - 30) + 'px';
    el.style.top = (clientY - 20) + 'px';
    document.body.appendChild(el);
    ghostRef.current = el;
  }

  function moveGhost(clientX: number, clientY: number) {
    if (ghostRef.current) {
      ghostRef.current.style.left = (clientX - 30) + 'px';
      ghostRef.current.style.top = (clientY - 20) + 'px';
    }
  }

  function removeGhost() {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  }

  function onPointerDown(e: React.PointerEvent, pi: number) {
    e.preventDefault();
    if (phase !== 'split') return;
    const pile = piles[pi];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const ratio = relY / pileH(pile.cardCount);
    const cutCount = Math.max(1, Math.min(pile.cardCount - 1, Math.round((1 - ratio) * pile.cardCount)));
    pointerState.current = { pi, startX: e.clientX, startY: e.clientY, cutCount, isDragging: false };
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const ps = pointerState.current;
      if (!ps) return;
      const dx = e.clientX - ps.startX;
      const dy = e.clientY - ps.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!ps.isDragging && dist >= DRAG_THRESHOLD) {
        if (phase !== 'split') return;
        ps.isDragging = true;
        // 원본 더미에서 즉시 차감
        setDeducted({ pi: ps.pi, count: ps.cutCount });
        spawnGhost(e.clientX, e.clientY, ps.cutCount);
      }

      if (ps.isDragging) {
        moveGhost(e.clientX, e.clientY);
      }
    }

    function onUp(e: PointerEvent) {
      const ps = pointerState.current;
      if (!ps) return;
      pointerState.current = null;

      if (ps.isDragging) {
        removeGhost();
        setDeducted(null);
        const tableRect = tableRef.current?.getBoundingClientRect();
        if (tableRect) {
          const dropX = Math.max(0, Math.min(TABLE_W - 60, e.clientX - tableRect.left - 30));
          const dropY = Math.max(0, Math.min(TABLE_H - 80, e.clientY - tableRect.top - 20));
          const pile = piles[ps.pi];
          addSplitPile(pile.id, ps.cutCount, dropX, dropY);
        }
      } else {
        // 탭 처리
        if (piles.length >= 2) {
          const pile = piles[ps.pi];
          const isAlreadyTapped = tapOrder.includes(pile.id);
          if (isAlreadyTapped) untapPile(pile.id);
          else tapPile(pile.id);
        }
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [phase, piles, tapOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const allTapped = piles.length > 1 && tapOrder.length === piles.length;

  // 현재 렌더링할 더미: deducted가 있으면 해당 더미 카드 수 임시 감소
  const displayPiles = deducted
    ? piles.map((p, i) => i === deducted.pi ? { ...p, cardCount: p.cardCount - deducted.count } : p)
    : piles;

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>기리</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground text-center mb-2">
          {phase === 'split' && piles.length === 1
            ? '더미를 드래그해서 나누세요'
            : phase === 'split' && piles.length > 1
              ? '계속 나누거나, 더미를 탭해서 합칠 순서를 정하세요'
              : phase === 'tap' || tapOrder.length > 0
                ? `탭한 순서 = 아래부터 위 (${tapOrder.length}/${piles.length} 선택)`
                : phase === 'merging'
                  ? '합치는 중...'
                  : '완료'}
        </p>

        {/* 기리 테이블 */}
        <div
          ref={tableRef}
          style={{ position: 'relative', width: '100%', maxWidth: TABLE_W, height: TABLE_H, margin: '0 auto' }}
        >
          {displayPiles.map((pile, pi) => {
            const orderPos = tapOrder.indexOf(pile.id);
            const isSelected = orderPos !== -1;
            const stackCount = Math.min(pile.cardCount, 5);
            const hPx = pileH(pile.cardCount);

            return (
              <div
                key={pile.id}
                style={{
                  position: 'absolute',
                  left: pile.x,
                  top: pile.y,
                  cursor: phase === 'split' ? 'grab' : 'pointer',
                  opacity: phase === 'merging' ? 0 : 1,
                  transition: phase === 'merging' ? 'left 380ms cubic-bezier(0.42,0,0.58,1), top 380ms cubic-bezier(0.42,0,0.58,1), opacity 380ms' : undefined,
                  ...(phase === 'merging' ? { left: TABLE_W / 2 - 30, top: 20 } : {}),
                }}
                onPointerDown={(e) => onPointerDown(e, pi)}
              >
                {/* 순서 번호 배지 */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: -10, right: -6, zIndex: 99,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#e67e22', color: 'white',
                    fontSize: 10, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {orderPos + 1}
                  </div>
                )}
                {/* 카드 스택 */}
                <div style={{ position: 'relative', width: 60, height: hPx }}>
                  {Array.from({ length: stackCount }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: 54,
                        height: CARD_H,
                        borderRadius: 5,
                        left: 3,
                        top: (pile.cardCount - 1 - i) * GAP,
                        zIndex: i + 1,
                        boxShadow: `0 ${2 + i}px 0 rgba(0,0,0,${0.12 + i * 0.03})`,
                        outline: isSelected ? '2px solid rgba(255,255,255,0.5)' : undefined,
                        backgroundImage: 'url(/img/card_back.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: '#888', marginTop: 4 }}>
                  {pile.cardCount}장
                </div>
              </div>
            );
          })}
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-2 justify-center flex-wrap pt-2">
          {phase !== 'merging' && phase !== 'done' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTtong();
                socket?.emit('declare-ttong', { roomId });
              }}
            >
              퉁
            </Button>
          )}
          {piles.length > 1 && phase !== 'merging' && phase !== 'done' && (
            <Button size="sm" disabled={!allTapped} onClick={() => setMerging()}>
              합치기
            </Button>
          )}
          {piles.length === 1 && phase === 'split' && (
            <p className="text-xs text-muted-foreground self-center">
              드래그로 나누거나 퉁 버튼을 누르세요
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
