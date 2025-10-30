import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-primary group-data-[collapsible=icon]:justify-center',
        className
      )}
    >
      <ShieldCheck className="size-7 shrink-0" />
      <div className="flex flex-col overflow-hidden">
        <h1 className="font-headline text-lg font-bold leading-tight tracking-tighter truncate">
          GuardianMail
        </h1>
      </div>
    </div>
  );
}
