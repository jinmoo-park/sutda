import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface HandReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HAND_RANKINGS = [
  { rank: 1, name: '삼팔광땡', desc: '3광 + 8광', tier: '광땡' },
  { rank: 2, name: '일팔광땡', desc: '1광 + 8광', tier: '광땡' },
  { rank: 3, name: '일삼광땡', desc: '1광 + 3광', tier: '광땡' },
  { rank: 4, name: '장땡', desc: '10 + 10', tier: '땡' },
  { rank: 5, name: '구땡', desc: '9 + 9', tier: '땡' },
  { rank: 6, name: '팔땡', desc: '8 + 8', tier: '땡' },
  { rank: 7, name: '칠땡', desc: '7 + 7', tier: '땡' },
  { rank: 8, name: '육땡', desc: '6 + 6', tier: '땡' },
  { rank: 9, name: '오땡', desc: '5 + 5', tier: '땡' },
  { rank: 10, name: '사땡', desc: '4 + 4', tier: '땡' },
  { rank: 11, name: '삼땡', desc: '3 + 3', tier: '땡' },
  { rank: 12, name: '이땡', desc: '2 + 2', tier: '땡' },
  { rank: 13, name: '일땡', desc: '1 + 1', tier: '땡' },
  { rank: 14, name: '알리', desc: '1 + 2', tier: '특수' },
  { rank: 15, name: '독사', desc: '1 + 4', tier: '특수' },
  { rank: 16, name: '구삥', desc: '1 + 9', tier: '특수' },
  { rank: 17, name: '장삥', desc: '1 + 10', tier: '특수' },
  { rank: 18, name: '장사', desc: '4 + 10', tier: '특수' },
  { rank: 19, name: '새륙', desc: '4 + 6', tier: '특수' },
  { rank: 20, name: '끗', desc: '합의 일의 자리 (9끗~0끗)', tier: '끗' },
];

const TIER_COLORS: Record<string, string> = {
  광땡: 'bg-yellow-400 text-yellow-900',
  땡: 'bg-orange-400 text-orange-900',
  특수: 'bg-purple-400 text-purple-900',
  끗: 'bg-gray-400 text-gray-900',
};

function getTierLabel(tier: string): string {
  return tier;
}

export function HandReferenceDialog({ open, onOpenChange }: HandReferenceDialogProps) {
  const tiers = ['광땡', '땡', '특수', '끗'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>족보 순위표</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {tiers.map((tier, tierIdx) => (
            <div key={tier}>
              {tierIdx > 0 && <Separator className="mb-3" />}
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {getTierLabel(tier)}
              </p>
              <div className="space-y-1">
                {HAND_RANKINGS.filter((h) => h.tier === tier).map((hand) => (
                  <div key={hand.rank} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground w-5 text-right">
                      {hand.rank}.
                    </span>
                    <Badge className={`${TIER_COLORS[tier]} border-transparent text-xs`}>
                      {hand.name}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{hand.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Separator />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">특수 패</p>
            <p>땡잡이 (3+7): 장땡 미만의 땡을 이김</p>
            <p>암행어사 (열끗4+열끗7): 일팔광땡, 일삼광땡을 이김</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
