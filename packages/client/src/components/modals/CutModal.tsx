import { useRef, useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGiriStore, Pile } from '@/store/giriStore';
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

const CARD_H = 78;
const GAP = 8;
const DRAG_THRESHOLD = 8;
const SWIPE_MIN = 30;   // 스와이프 인식 최소 이동 거리 (px)
const MAX_SWIPES = 3;   // 모바일: 최대 스와이프(컷팅) 횟수
const TABLE_W = 360;
const TABLE_H = 300;

// swipe 횟수별 고정 카드 배분 (20장 기준)
const CARD_DISTRIBUTIONS: number[][] = [
  [20],
  [10, 10],
  [7, 7, 6],
  [5, 5, 5, 5],
];

function pileH(n: number) { return CARD_H + (n - 1) * GAP; }

/** 더미 수에 따른 고정 레이아웃 */
function getFixedLayout(
  pileCount: number,
  tableW: number,
): { id: number; x: number; y: number }[] {
  const pileW = 60;
  const hGap = 40;
  const vGap = 20;
  const cx = Math.round((tableW - pileW) / 2);
  const dist = CARD_DISTRIBUTIONS[pileCount - 1] ?? CARD_DISTRIBUTIONS[0];

  switch (pileCount) {
    case 1: {
      return [{ id: 0, x: cx, y: Math.round((TABLE_H - pileH(dist[0])) / 2) }];
    }
    case 2: {
      const totalW = 2 * pileW + hGap;
      const startX = Math.round((tableW - totalW) / 2);
      const y = Math.round((TABLE_H - pileH(dist[0])) / 2);
      return [
        { id: 0, x: startX, y },
        { id: 1, x: startX + pileW + hGap, y },
      ];
    }
    case 3: {
      // 역삼각형: 2개 위, 1개 아래 중앙
      const totalW = 2 * pileW + hGap;
      const startX = Math.round((tableW - totalW) / 2);
      const topY = 20;
      const bottomY = topY + pileH(dist[0]) + vGap;
      return [
        { id: 0, x: startX, y: topY },
        { id: 1, x: startX + pileW + hGap, y: topY },
        { id: 2, x: cx, y: bottomY },
      ];
    }
    case 4: {
      // 2×2 그리드
      const totalW = 2 * pileW + hGap;
      const startX = Math.round((tableW - totalW) / 2);
      const topY = 20;
      const bottomY = topY + pileH(dist[0]) + vGap;
      return [
        { id: 0, x: startX, y: topY },
        { id: 1, x: startX + pileW + hGap, y: topY },
        { id: 2, x: startX, y: bottomY },
        { id: 3, x: startX + pileW + hGap, y: bottomY },
      ];
    }
    default:
      return [];
  }
}

export function CutModal({ open, roomId }: CutModalProps) {
  const { socket } = useGameStore();
  const {
    phase, piles, tapOrder, isTtong,
    initSplit, addSplitPile, splitAll,
    tapPile, untapPile, setMerging, setDone, setTtong,
  } = useGiriStore();

  const isTouchDevice = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );

  const tableRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pointerState = useRef<{
    pi: number;
    startX: number;
    startY: number;
    cutCount: number;
    isDragging: boolean;
  } | null>(null);

  // 데스크탑 드래그 중 ghost로 이동된 카드 수
  const [deducted, setDeducted] = useState<{ pi: number; count: number } | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const tw = tableRef.current?.offsetWidth ?? TABLE_W;
        const pos = getFixedLayout(1, tw);
        initSplit(pos[0].x, pos[0].y);
      });
      setDeducted(null);
    }
    return () => {
      if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
      removeGhost();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'merging') {
      // 마지막 더미가 도착한 뒤 닫히도록 stagger 총합 반영
      const stagger = Math.max(0, piles.length - 1) * 130;
      mergeTimerRef.current = setTimeout(() => {
        emitCutResult();
        setDone();
      }, 420 + stagger);
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

  // --- 데스크탑 전용: Ghost 카드 ---
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

  // 데스크탑 전용: 개별 더미 위 pointerdown
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

  // 터치 전용: 스와이프 존 전체 영역 pointerdown
  function onSwipeZoneDown(e: React.PointerEvent) {
    e.preventDefault();
    if (phase !== 'split') return;
    const tableRect = tableRef.current?.getBoundingClientRect();
    const localX = tableRect ? e.clientX - tableRect.left : e.clientX;
    const localY = tableRect ? e.clientY - tableRect.top : e.clientY;
    let closestPi = 0;
    let minDist = Infinity;
    piles.forEach((p, pi) => {
      const cx = p.x + 30;
      const cy = p.y + pileH(p.cardCount) / 2;
      const dist = Math.sqrt(Math.pow(localX - cx, 2) + Math.pow(localY - cy, 2));
      if (dist < minDist) { minDist = dist; closestPi = pi; }
    });
    pointerState.current = { pi: closestPi, startX: e.clientX, startY: e.clientY, cutCount: 0, isDragging: false };
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const ps = pointerState.current;
      if (!ps) return;

      if (isTouchDevice) {
        const dx = e.clientX - ps.startX; // signed
        const dy = Math.abs(e.clientY - ps.startY);
        if (Math.max(Math.abs(dx), dy) >= SWIPE_MIN && !ps.isDragging) {
          ps.isDragging = true;
          ps.cutCount = dx > 0 ? 1 : -1; // 1=오른쪽(추가), -1=왼쪽(감소)
        }
      } else {
        const dx = e.clientX - ps.startX;
        const dy = e.clientY - ps.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!ps.isDragging && dist >= DRAG_THRESHOLD) {
          if (phase !== 'split') return;
          ps.isDragging = true;
          setDeducted({ pi: ps.pi, count: ps.cutCount });
          spawnGhost(e.clientX, e.clientY, ps.cutCount);
        }
        if (ps.isDragging) {
          moveGhost(e.clientX, e.clientY);
        }
      }
    }

    function onUp(e: PointerEvent) {
      const ps = pointerState.current;
      if (!ps) return;
      pointerState.current = null;

      if (isTouchDevice) {
        if (ps.isDragging) {
          const swipeDir = ps.cutCount; // 1=오른쪽, -1=왼쪽
          const tw = tableRef.current?.offsetWidth ?? TABLE_W;

          if (swipeDir > 0 && piles.length <= MAX_SWIPES) {
            // 오른쪽 스와이프: 더미 추가
            const newCount = piles.length + 1;
            const positions = getFixedLayout(newCount, tw);
            const newPiles: Pile[] = CARD_DISTRIBUTIONS[piles.length].map((count, i) => ({
              id: i, cardCount: count,
              x: positions[i]?.x ?? 0, y: positions[i]?.y ?? 0,
            }));
            splitAll(newPiles);
          } else if (swipeDir < 0 && piles.length >= 2) {
            // 왼쪽 스와이프: 더미 감소
            const newCount = piles.length - 1;
            const positions = getFixedLayout(newCount, tw);
            const newPiles: Pile[] = CARD_DISTRIBUTIONS[newCount - 1].map((count, i) => ({
              id: i, cardCount: count,
              x: positions[i]?.x ?? 0, y: positions[i]?.y ?? 0,
            }));
            splitAll(newPiles);
          }
        } else if (!ps.isDragging && piles.length >= 2) {
          // 탭: 순서 지정
          const pile = piles[ps.pi];
          if (!pile) return;
          const isAlreadyTapped = tapOrder.includes(pile.id);
          if (isAlreadyTapped) untapPile(pile.id);
          else tapPile(pile.id);
        }
      } else {
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
          if (piles.length >= 2) {
            const pile = piles[ps.pi];
            const isAlreadyTapped = tapOrder.includes(pile.id);
            if (isAlreadyTapped) untapPile(pile.id);
            else tapPile(pile.id);
          }
        }
      }
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [phase, piles, tapOrder, isTouchDevice]); // eslint-disable-line react-hooks/exhaustive-deps

  const allTapped = piles.length > 1 && tapOrder.length === piles.length;
  const canSwipeMore = piles.length <= MAX_SWIPES;
  const canSwipeLess = piles.length >= 2;

  const displayPiles = deducted
    ? piles.map((p, i) => i === deducted.pi ? { ...p, cardCount: p.cardCount - deducted.count } : p)
    : piles;

  const titleText = (() => {
    if (phase === 'merging') return '합치는 중...';
    if (phase === 'done') return '완료';
    if (isTouchDevice) {
      if (piles.length === 1) return '스와이프해서 카드를 나누세요';
      if (!canSwipeMore || tapOrder.length > 0) return `탭해서 합칠 순서를 정하세요 (${tapOrder.length}/${piles.length})`;
      return `스와이프하거나 탭해서 순서를 정하세요`;
    } else {
      if (piles.length === 1) return '더미를 드래그해서 나누세요';
      if (tapOrder.length > 0) return `탭한 순서 = 아래부터 위 (${tapOrder.length}/${piles.length} 선택)`;
      return '계속 나누거나, 더미를 탭해서 합칠 순서를 정하세요';
    }
  })();

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <style>{`
          @keyframes giriSwipeGuide {
            0%, 100% { opacity: 0; }
            40%, 60% { opacity: 0.9; }
          }
          .giri-swipe-guide { animation: giriSwipeGuide 2.5s ease-in-out infinite; }
        `}</style>

        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>

        <div
          style={{ width: '100%', touchAction: 'none' }}
          onPointerDown={isTouchDevice ? onSwipeZoneDown : undefined}
        >
          <div
            ref={tableRef}
            style={{ position: 'relative', width: '100%', maxWidth: TABLE_W, height: TABLE_H, margin: '0 auto' }}
          >
            {/* 스와이프 안내선 (터치 전용) */}
            {isTouchDevice && (canSwipeMore || canSwipeLess) && phase === 'split' && (
              <div
                className="giri-swipe-guide"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 1,
                  padding: '0 8px',
                  gap: 6,
                }}
              >
                {/* 왼쪽: 줄이기 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: 'rgba(255, 200, 80, 0.75)',
                  fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                  opacity: canSwipeLess ? 1 : 0,
                }}>
                  <span>◀</span>
                  <span>줄이기</span>
                </div>
                {/* 가운데 점선 */}
                <div style={{ flex: 1, borderTop: '1.5px dashed rgba(255, 200, 80, 0.5)' }} />
                {/* 오른쪽: 나누기 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: 'rgba(255, 200, 80, 0.75)',
                  fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                  opacity: canSwipeMore ? 1 : 0,
                }}>
                  <span>나누기</span>
                  <span>▶</span>
                </div>
              </div>
            )}

            {displayPiles.map((pile, pi) => {
              const orderPos = tapOrder.indexOf(pile.id);
              const isSelected = orderPos !== -1;
              const stackCount = Math.min(pile.cardCount, 5);
              const hPx = pileH(pile.cardCount);
              // 탭 순서 기반 stagger: tapOrder[0](맨 아래) → 가장 먼저 이동
              const mergeDelay = phase === 'merging'
                ? (orderPos !== -1 ? orderPos : pi) * 130
                : 0;

              return (
                <div
                  key={pile.id}
                  style={{
                    position: 'absolute',
                    left: pile.x,
                    top: pile.y,
                    cursor: phase === 'split' ? (isTouchDevice ? 'default' : 'grab') : 'pointer',
                    opacity: phase === 'merging' ? 0 : 1,
                    transition: phase === 'merging'
                      ? `left 350ms cubic-bezier(0.42,0,0.58,1) ${mergeDelay}ms, top 350ms cubic-bezier(0.42,0,0.58,1) ${mergeDelay}ms, opacity 200ms ease ${mergeDelay + 280}ms`
                      : undefined,
                    ...(phase === 'merging' ? { left: TABLE_W / 2 - 30, top: 20 } : {}),
                  }}
                  onPointerDown={!isTouchDevice ? (e) => onPointerDown(e, pi) : undefined}
                >
                  {/* 탭 순서 배지 */}
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
              {isTouchDevice ? '스와이프로 나누거나 퉁 버튼을 누르세요' : '드래그로 나누거나 퉁 버튼을 누르세요'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
