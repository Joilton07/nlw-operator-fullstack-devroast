'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const GROUPS = [
  {
    label: null as string | null,
    options: [{ value: 'auto', label: 'auto' }],
  },
  {
    label: 'Web',
    options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'jsx', label: 'JSX' },
      { value: 'tsx', label: 'TSX' },
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
    ],
  },
  {
    label: 'Backend / Shell',
    options: [
      { value: 'python', label: 'Python' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: 'java', label: 'Java' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'php', label: 'PHP' },
      { value: 'sql', label: 'SQL' },
      { value: 'shellscript', label: 'Shell' },
    ],
  },
];

type CodeEditorHeaderProps = {
  language: string;
  onLanguageChange: (language: string) => void;
};

function findLabel(value: string): string {
  for (const group of GROUPS) {
    for (const opt of group.options) {
      if (opt.value === value) return opt.label;
    }
  }
  return value;
}

export function CodeEditorHeader({
  language,
  onLanguageChange,
}: CodeEditorHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = findLabel(language);

  return (
    <div className="flex h-10 items-center gap-3 border-b border-border px-4">
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-accent-red" />
        <span className="size-3 rounded-full bg-accent-amber" />
        <span className="size-3 rounded-full bg-accent-green" />
      </div>
      <div className="relative ml-auto" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-text-secondary transition-all duration-200 hover:bg-input hover:text-text-primary"
        >
          <span>{currentLabel}</span>
          <ChevronDown
            size={12}
            aria-label="open language selector"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <div
          className={`absolute right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-elevated shadow-lg transition-all duration-200 ${
            open
              ? 'max-h-[400px] opacity-100'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col py-1">
            {GROUPS.map((group) => (
              <div key={group.label ?? 'first'}>
                {group.label && (
                  <div className="px-3 py-1 font-mono text-[11px] text-text-tertiary">
                    {group.label}
                  </div>
                )}
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onLanguageChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-1 text-left font-mono text-xs transition-colors duration-150 ${
                      opt.value === language
                        ? 'bg-accent-green/10 text-accent-green'
                        : 'text-text-secondary hover:bg-input hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
