import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';

interface GusaAnnounceModalProps {
  roomId: string;
  isDealer: boolean;
}

export function GusaAnnounceModal({ roomId, isDealer }: GusaAnnounceModalProps) {
  const { socket } = useGameStore();

  const handleConfirm = () => {
    if (!isDealer) return;
    socket?.emit('confirm-gusa-announce', { roomId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 flex flex-col items-center gap-4 max-w-sm mx-4">
        <h3 className="text-lg font-bold">구사 재경기</h3>
        <p className="text-sm text-center text-muted-foreground">
          구사가 나와서 재경기를 진행합니다.
          <br />
          기리 없이 바로 패를 돌립니다.
        </p>
        {isDealer ? (
          <Button onClick={handleConfirm}>확인</Button>
        ) : (
          <p className="text-sm text-muted-foreground">선 플레이어의 확인을 기다리는 중...</p>
        )}
      </div>
    </div>
  );
}
