'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function CollapsibleCode({
  children,
  maxHeight = 320,
}: {
  children: React.ReactNode;
  maxHeight?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsButton, setNeedsButton] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      const needsIt = el.scrollHeight > maxHeight;
      setNeedsButton((prev) => (prev !== needsIt ? needsIt : prev));
    };

    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => observer.disconnect();
  }, [maxHeight]);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div
        ref={contentRef}
        className={`overflow-hidden ${mounted ? 'transition-all duration-300 ease-out' : ''}`}
        style={{
          maxHeight: open ? 'none' : `${maxHeight}px`,
        }}
      >
        {children}
      </div>
      {needsButton && (
        <Collapsible.Trigger className="flex w-full items-center justify-center gap-1 border-t border-border bg-surface py-2 font-mono text-xs text-accent-cyan transition-colors hover:text-text-primary">
          <ChevronDown
            className={`size-3 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
          {open ? 'show less' : 'show more'}
        </Collapsible.Trigger>
      )}
    </Collapsible.Root>
  );
}
