import { cn } from '@/lib/utils';

interface CardBackProps {
  className?: string;
}

export function CardBack({ className }: CardBackProps) {
  return (
    <div
      className={cn(
        'bg-muted rounded-md border border-border w-16 h-24 flex items-center justify-center',
        className
      )}
    >
      <span className="text-muted-foreground text-lg">?</span>
    </div>
  );
}
