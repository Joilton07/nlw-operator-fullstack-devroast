'use client';

import { Switch } from '@base-ui/react/switch';
import { forwardRef, type HTMLAttributes } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

export const toggleVariants = tv({
  slots: {
    root: 'inline-flex items-center gap-3 group cursor-pointer',
    track:
      'relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[checked]:bg-accent-green data-[unchecked]:bg-border',
    thumb:
      'pointer-events-none inline-flex size-4 translate-x-0 items-center justify-center rounded-full bg-page shadow-sm transition-transform data-[checked]:translate-x-[18px] data-[unchecked]:translate-x-0',
    label:
      'font-mono text-sm text-text-secondary group-data-[checked]:text-accent-green',
  },
  defaultVariants: {},
});

type ToggleProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof toggleVariants> & {
    defaultChecked?: boolean;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    label?: string;
  };

export const Toggle = forwardRef<HTMLDivElement, ToggleProps>(
  (
    { className, label, checked, defaultChecked, onCheckedChange, ...props },
    ref,
  ) => {
    const classes = toggleVariants();

    return (
      <div ref={ref} className={classes.root({ className })} {...props}>
        <Switch.Root
          className={classes.track()}
          defaultChecked={defaultChecked}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={label}
        >
          <Switch.Thumb className={classes.thumb()} />
        </Switch.Root>
        {label && <span className={classes.label()}>{label}</span>}
      </div>
    );
  },
);

Toggle.displayName = 'Toggle';
