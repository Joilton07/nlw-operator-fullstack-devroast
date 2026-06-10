import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CodeBlockHeaderProps = HTMLAttributes<HTMLDivElement> & {
  filename: string;
};

export const CodeBlockHeader = forwardRef<HTMLDivElement, CodeBlockHeaderProps>(
  ({ className, filename, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-10 items-center gap-3 border-b border-border bg-input px-4',
          className,
        )}
        {...props}
      >
        <span className="size-[10px] rounded-full bg-accent-red" />
        <span className="size-[10px] rounded-full bg-accent-amber" />
        <span className="size-[10px] rounded-full bg-accent-green" />
        <span className="ml-auto font-mono text-xs text-text-tertiary">
          {filename}
        </span>
      </div>
    );
  },
);

CodeBlockHeader.displayName = 'CodeBlockHeader';
