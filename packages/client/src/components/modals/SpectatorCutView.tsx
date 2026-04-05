import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type GiriPhase = 'split' | 'tap' | 'merging' | 'done';

export interface SpectatorPile {
  id: number;
  cardCount: number;
  x: number;
  y: number;
}

interface SpectatorCutViewProps {
  open: boolean;
  cutterNickname: string;
  giriPhase: GiriPhase | null;
  piles: SpectatorPile[];
  tapOrder: number[];
}

const CARD_H = 78;
const GAP = 8;
const TABLE_W = 360;
const TABLE_H = 300;

function pileH(n: number) {
  return CARD_H + (n - 1) * GAP;
}

export function SpectatorCutView({
  open,
  cutterNickname,
  giriPhase,
  piles,
  tapOrder,
}: SpectatorCutViewProps) {
  const phaseText = (() => {
    switch (giriPhase) {
      case 'split': return '나누는 중';
      case 'tap': return '탭 순서 지정 중';
      case 'merging': return '합치는 중...';
      case 'done': return '완료';
      default: return '잠시만 기다려 주세요...';
    }
  })();

  const phaseTextColor = giriPhase === null || giriPhase === 'done'
    ? 'text-muted-foreground'
    : 'text-primary';

  return (
    <Dialog open={open} modal={false}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{cutterNickname}님이 기리 중입니다</DialogTitle>
        </DialogHeader>

        {/* 더미 레이아웃 */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: TABLE_W,
            height: TABLE_H,
            margin: '0 auto',
            pointerEvents: 'none',
          }}
        >
          {piles.map((pile, index) => {
            const orderPos = tapOrder.indexOf(pile.id);
            const stackCount = Math.min(pile.cardCount, 5);
            const hPx = pileH(pile.cardCount);
            const mergeDelay = giriPhase === 'merging'
              ? (orderPos !== -1 ? orderPos : index) * 130
              : 0;

            return (
              <div
                key={pile.id}
                style={{
                  position: 'absolute',
                  left: giriPhase === 'merging' ? TABLE_W / 2 - 30 : pile.x,
                  top: giriPhase === 'merging' ? 20 : pile.y,
                  opacity: giriPhase === 'merging' ? 0 : 1,
                  transition: giriPhase === 'merging'
                    ? `left 350ms cubic-bezier(0.42,0,0.58,1) ${mergeDelay}ms, top 350ms cubic-bezier(0.42,0,0.58,1) ${mergeDelay}ms, opacity 200ms ease ${mergeDelay + 280}ms`
                    : undefined,
                }}
              >
                {/* 탭 순서 배지 */}
                {orderPos >= 0 && (
                  <div
                    className="bg-primary text-primary-foreground"
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      zIndex: 99,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
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

        {/* 단계 텍스트 */}
        <p className={`text-sm text-center ${phaseTextColor}`}>{phaseText}</p>
      </DialogContent>
    </Dialog>
  );
}
