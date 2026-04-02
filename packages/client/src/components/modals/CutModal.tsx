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

// --- 참조 구현 포팅 (sutda-giri.html) ---
const CARD_H = 78;
const GAP = 8;
const DRAG_THRESHOLD = 8;
const SWIPE_MIN = 15;   // 스와이프로 인식하는 최소 수평 이동 거리 (px)
const SWIPE_MAX = 220;  // 이 거리 이상 스와이프하면 최대 카드 수 컷팅
const MAX_SWIPES = 4;   // 모바일: 최대 스와이프(컷팅) 횟수
const TABLE_W = 360;
const TABLE_H = 180;

function pileH(n: number) { return CARD_H + (n - 1) * GAP; }

/** 터치 모드 전용: N개 더미를 한 줄로 균일하게 배치 */
function computeRowLayout(
  piles: Pile[],
  tableW: number,
  tableH: number
): { id: number; x: number; y: number }[] {
  const N = piles.length;
  const pileW = 60;
  const maxCards = Math.max(...piles.map((p) => p.cardCount));
  const h = pileH(maxCards);
  const y = Math.max(4, (tableH - h) / 2);
  if (N === 1) {
    return [{ id: piles[0].id, x: Math.round((tableW - pileW) / 2), y }];
  }
  const totalGap = tableW - N * pileW;
  const gap = totalGap / (N + 1);
  return piles.map((p, i) => ({
    id: p.id,
    x: Math.round(gap + i * (pileW + gap)),
    y,
  }));
}

export function CutModal({ open, roomId }: CutModalProps) {
  const { socket } = useGameStore();
  const {
    phase, piles, tapOrder, isTtong,
    initSplit, addSplitPile, addSplitPileWithLayout,
    tapPile, untapPile, setMerging, setDone, setTtong,
  } = useGiriStore();

  // pointer: coarse = 터치스크린 기기, pointer: fine = 마우스/트랙패드 기기
  const isTouchDevice = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );

  const tableRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [swipePreviewCount, setSwipePreviewCount] = useState<number | null>(null);

  // 포인터 추적 ref — 렌더링 없이 관리
  const pointerState = useRef<{
    pi: number;
    startX: number;
    startY: number;
    cutCount: number;
    isDragging: boolean;
  } | null>(null);

  // 즉시 차감된 카드 수 — 데스크탑 드래그 중 원본 더미에서 ghost로 이동
  const [deducted, setDeducted] = useState<{ pi: number; count: number } | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const tw = tableRef.current?.offsetWidth ?? TABLE_W;
        const cx = (tw - 60) / 2;
        const cy = Math.max(4, (TABLE_H - pileH(20)) / 2);
        initSplit(cx, cy);
      });
      setDeducted(null);
      setSwipePreviewCount(null);
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

  function onPointerDown(e: React.PointerEvent, pi: number) {
    e.preventDefault();
    if (phase !== 'split') return;

    if (isTouchDevice) {
      // 터치 모드: 수평 스와이프 시작 기록
      pointerState.current = { pi, startX: e.clientX, startY: e.clientY, cutCount: 0, isDragging: false };
    } else {
      // 데스크탑: 클릭 위치로 컷팅 장수 결정
      const pile = piles[pi];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const relY = e.clientY - rect.top;
      const ratio = relY / pileH(pile.cardCount);
      const cutCount = Math.max(1, Math.min(pile.cardCount - 1, Math.round((1 - ratio) * pile.cardCount)));
      pointerState.current = { pi, startX: e.clientX, startY: e.clientY, cutCount, isDragging: false };
    }
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const ps = pointerState.current;
      if (!ps) return;

      if (isTouchDevice) {
        // 터치: 수평 거리로 컷팅 장수 계산 (piles.length <= MAX_SWIPES 일 때만)
        const dx = Math.abs(e.clientX - ps.startX);
        if (dx >= SWIPE_MIN && piles.length <= MAX_SWIPES) {
          ps.isDragging = true;
          const pile = piles[ps.pi];
          if (!pile) return;
          const ratio = Math.min(dx / SWIPE_MAX, 1);
          const cutCount = Math.max(1, Math.min(pile.cardCount - 1, Math.round(ratio * pile.cardCount)));
          ps.cutCount = cutCount;
          setSwipePreviewCount(cutCount);
        }
      } else {
        // 데스크탑: 드래그 거리 임계값 초과 시 ghost 생성
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
        setSwipePreviewCount(null);
        // 스와이프 인식: isDragging && cutCount > 0 && 아직 여유 있음
        if (ps.isDragging && ps.cutCount > 0 && piles.length <= MAX_SWIPES) {
          const tw = tableRef.current?.offsetWidth ?? TABLE_W;
          addSplitPileWithLayout(piles[ps.pi].id, ps.cutCount, (newPiles) =>
            computeRowLayout(newPiles, tw, TABLE_H)
          );
        } else {
          // 탭: 순서 지정
          if (piles.length >= 2) {
            const pile = piles[ps.pi];
            if (!pile) return;
            const isAlreadyTapped = tapOrder.includes(pile.id);
            if (isAlreadyTapped) untapPile(pile.id);
            else tapPile(pile.id);
          }
        }
      } else {
        // 데스크탑
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
  const canSwipeMore = piles.length <= MAX_SWIPES; // 4번 이하 스와이프 완료 = 5개 미만 더미
  const swipesLeft = MAX_SWIPES + 1 - piles.length;

  const displayPiles = deducted
    ? piles.map((p, i) => i === deducted.pi ? { ...p, cardCount: p.cardCount - deducted.count } : p)
    : piles;

  const titleText = (() => {
    if (phase === 'merging') return '합치는 중...';
    if (phase === 'done') return '완료';
    if (isTouchDevice) {
      if (piles.length === 1) return `더미를 스와이프해서 나누세요 (최대 ${MAX_SWIPES}번)`;
      if (!canSwipeMore) return `더미를 탭해서 합칠 순서를 정하세요 (${tapOrder.length}/${piles.length})`;
      if (tapOrder.length > 0) return `탭한 순서 = 아래부터 위 (${tapOrder.length}/${piles.length} 선택)`;
      return `계속 스와이프하거나 탭해서 순서를 정하세요`;
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
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>

        {/* 기리 테이블 */}
        <div
          ref={tableRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: TABLE_W,
            height: TABLE_H,
            margin: '0 auto',
            touchAction: 'none',
          }}
        >
          {displayPiles.map((pile, pi) => {
            const orderPos = tapOrder.indexOf(pile.id);
            const isSelected = orderPos !== -1;
            const stackCount = Math.min(pile.cardCount, 5);
            const hPx = pileH(pile.cardCount);
            const isBeingSwiped = isTouchDevice &&
              pointerState.current?.pi === pi &&
              swipePreviewCount !== null;

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
                    ? 'left 380ms cubic-bezier(0.42,0,0.58,1), top 380ms cubic-bezier(0.42,0,0.58,1), opacity 380ms'
                    : 'left 200ms ease, top 200ms ease',
                  ...(phase === 'merging' ? { left: TABLE_W / 2 - 30, top: 20 } : {}),
                  touchAction: 'none',
                }}
                onPointerDown={(e) => onPointerDown(e, pi)}
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
                {/* 스와이프 미리보기 배지 (터치 모드) */}
                {isBeingSwiped && swipePreviewCount !== null && (
                  <div style={{
                    position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(52,152,219,0.92)', color: 'white',
                    borderRadius: 4, fontSize: 10, fontWeight: 700,
                    padding: '2px 6px', zIndex: 100, whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    {swipePreviewCount}장 분리
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
                        filter: isBeingSwiped ? 'brightness(1.15)' : undefined,
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
              {isTouchDevice ? '스와이프로 나누거나 퉁 버튼을 누르세요' : '드래그로 나누거나 퉁 버튼을 누르세요'}
            </p>
          )}
          {isTouchDevice && piles.length > 1 && canSwipeMore && phase === 'split' && (
            <p className="text-xs text-muted-foreground self-center">
              {swipesLeft}번 더 나눌 수 있어요
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
