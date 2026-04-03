import { useRef, useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ShuffleModalProps {
  open: boolean;
  roomId: string;
  /** 관전 모드: 자동 재생, 버튼 없음 */
  readOnly?: boolean;
}

// --- 참조 구현 포팅 (sutda-shuffle.html) ---
const N = 5;
const BASE_TOP = 50;
const GAP = 13;
const CYCLE = 300;
const T = { peek: 0.22, hold: 0.18, rise: 0.35, drop: 0.15, rest: 0.10 };

function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeOut(t: number) { return 1 - (1 - t) * (1 - t); }

export function ShuffleModal({ open, roomId, readOnly = false }: ShuffleModalProps) {
  const { socket, gameState } = useGameStore();
  const [isShuffling, setIsShuffling] = useState(false);
  const [hasShuffled, setHasShuffled] = useState(false);
  const dealerName = gameState?.players.find((p) => p.isDealer)?.nickname ?? '딜러';

  // 카드 DOM refs — React 재렌더링 없이 직접 조작
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 애니메이션 상태 ref (모두 mutable, setState 불필요)
  const anim = useRef({
    cards: [] as { el: HTMLDivElement | null }[],
    baseRots: [] as number[],
    pickedIdx: 0,
    phase: 'idle',
    phaseStart: 0,
    shuffling: false,
    rafId: 0,
  });

  function applyT(el: HTMLDivElement, top: number, rotZ: number, transZ: number, zi: number, lifted: boolean) {
    el.style.top = top + 'px';
    el.style.zIndex = String(zi);
    el.style.transform = `rotate(${rotZ}deg) translateZ(${transZ}px)`;
    const dark = Math.max(0, -transZ * 0.4);
    el.style.filter = dark > 0 ? `brightness(${Math.max(0.55, 1 - dark / 100)})` : '';
    el.style.boxShadow = lifted
      ? '0 14px 28px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)'
      : `0 ${2 + (zi / N) * 2}px 0 rgba(0,0,0,${0.18 + (1 - zi / N) * 0.15})`;
  }

  function restAll() {
    const a = anim.current;
    a.cards.forEach((c, i) => {
      if (c.el) applyT(c.el, BASE_TOP - i * GAP, a.baseRots[i] ?? 0, 0, i + 1, false);
    });
  }

  function buildDeck() {
    const a = anim.current;
    a.cards = cardRefs.current.map((el) => ({ el }));
    a.baseRots = Array.from({ length: N }, () => rnd(-2, 2));
    restAll();
  }

  function pickNext() {
    const a = anim.current;
    a.pickedIdx = 1 + Math.floor(Math.random() * (N - 2));
    a.phase = 'peek';
    a.phaseStart = performance.now();
  }

  const tick = useCallback((now: number) => {
    const a = anim.current;
    if (!a.shuffling) return;
    const elapsed = now - a.phaseStart;

    if (a.phase === 'peek') {
      const t = Math.min(elapsed / (CYCLE * T.peek), 1);
      const et = easeInOut(t);
      const picked = a.cards[a.pickedIdx];
      if (picked?.el) applyT(picked.el,
        BASE_TOP - a.pickedIdx * GAP + GAP * 1.2 * et,
        a.baseRots[a.pickedIdx] + 1.5 * et, 0, a.pickedIdx + 1, false);
      a.cards.forEach((c, i) => {
        if (i === a.pickedIdx || !c.el) return;
        applyT(c.el, BASE_TOP - i * GAP, a.baseRots[i], 0, i + 1, false);
      });
      if (t >= 1) { a.phase = 'hold'; a.phaseStart = now; }

    } else if (a.phase === 'hold') {
      if (elapsed >= CYCLE * T.hold) { a.phase = 'rise'; a.phaseStart = now; }

    } else if (a.phase === 'rise') {
      const t = Math.min((now - a.phaseStart) / (CYCLE * T.rise), 1);
      const et = easeInOut(t);
      const picked = a.cards[a.pickedIdx];
      const fromTop = BASE_TOP - a.pickedIdx * GAP + GAP * 1.2;
      const toTop = BASE_TOP - (N - 1) * GAP - 10;
      const zArc = Math.sin(t * Math.PI) * 32;
      const toRot = rnd(-2, 2);
      if (picked?.el) applyT(picked.el,
        fromTop + (toTop - fromTop) * et,
        a.baseRots[a.pickedIdx] + 1.5 + (toRot - a.baseRots[a.pickedIdx] - 1.5) * et,
        zArc, 10, true);

      const topC = a.cards[N - 1];
      if (topC?.el) applyT(topC.el,
        BASE_TOP - (N - 1) * GAP + GAP * et,
        a.baseRots[N - 1], -38 * Math.sin(t * Math.PI * 0.9), N + 1, false);

      a.cards.forEach((c, i) => {
        if (i === a.pickedIdx || i === N - 1 || !c.el) return;
        const fromPos = BASE_TOP - i * GAP;
        const toPos = i < a.pickedIdx ? fromPos : BASE_TOP - (i - 1) * GAP;
        applyT(c.el, fromPos + (toPos - fromPos) * et, a.baseRots[i], 0, i + 1, false);
      });

      if (t >= 1) {
        const p = a.cards.splice(a.pickedIdx, 1)[0];
        a.cards.push(p);
        a.baseRots[N - 1] = rnd(-2, 2);
        a.phase = 'drop';
        a.phaseStart = now;
      }

    } else if (a.phase === 'drop') {
      const t = Math.min((now - a.phaseStart) / (CYCLE * T.drop), 1);
      const et = easeOut(t);
      const c = a.cards[N - 1];
      if (c?.el) applyT(c.el,
        BASE_TOP - (N - 1) * GAP - 10 + 10 * et,
        a.baseRots[N - 1], 8 * (1 - et), N, t < 0.5);
      a.cards.forEach((c2, i) => {
        if (i === N - 1 || !c2.el) return;
        applyT(c2.el, BASE_TOP - i * GAP, a.baseRots[i], 0, i + 1, false);
      });
      if (t >= 1) { a.phase = 'rest'; a.phaseStart = now; }

    } else if (a.phase === 'rest') {
      if (elapsed > CYCLE * T.rest) pickNext();
    }

    a.rafId = requestAnimationFrame(tick);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startShuffle() {
    const a = anim.current;
    if (a.shuffling) return;
    a.shuffling = true;
    setIsShuffling(true);
    setHasShuffled(true);
    pickNext();
    a.rafId = requestAnimationFrame(tick);
  }

  function stopShuffle() {
    const a = anim.current;
    a.shuffling = false;
    cancelAnimationFrame(a.rafId);
    a.phase = 'idle';
    setIsShuffling(false);
    restAll();
    buildDeck();
  }

  useEffect(() => {
    if (open) {
      setHasShuffled(false);
      requestAnimationFrame(() => {
        buildDeck();
        if (readOnly) startShuffle();
      });
    }
    return () => {
      cancelAnimationFrame(anim.current.rafId);
      anim.current.shuffling = false;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} modal={false}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? `${dealerName}가 카드를 섞는 중...`
              : isShuffling ? '섞는 중...' : hasShuffled ? '잘 섞였어요! 확인을 누르세요' : '카드 더미를 꾹 누르면 섞입니다'}
          </DialogTitle>
        </DialogHeader>

        {/* 카드 더미 — 레이아웃은 카드 시각 크기(130px)만, 애니메이션은 overflow:visible */}
        <div className="flex items-center justify-center" style={{ padding: '24px 0' }}>
          <div
            style={{
              perspective: '700px', perspectiveOrigin: '50% 50%',
              cursor: readOnly ? 'default' : 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
              overflow: 'visible',
            }}
            onPointerDown={readOnly ? undefined : startShuffle}
            onPointerUp={readOnly ? undefined : stopShuffle}
            onPointerLeave={readOnly ? undefined : stopShuffle}
          >
            <div
              style={{
                position: 'relative',
                width: '80px',
                height: '130px',
                transformStyle: 'preserve-3d',
              }}
            >
              {Array.from({ length: N }, (_, i) => (
                <div
                  key={i}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  style={{
                    position: 'absolute',
                    width: '54px',
                    height: '78px',
                    left: '50%',
                    marginLeft: '-27px',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    top: `${BASE_TOP - i * GAP}px`,
                    zIndex: i + 1,
                    backgroundImage: 'url(/img/card_back.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {!readOnly && (
          <DialogFooter>
            <Button onClick={() => socket?.emit('shuffle', { roomId })} disabled={!hasShuffled}>
              확인
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
