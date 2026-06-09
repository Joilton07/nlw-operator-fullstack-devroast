'use client';

import { useCallback, useRef, useState } from 'react';
import { CodeEditorHeader } from '@/components/CodeEditorHeader';
import { HighlightedCode } from '@/components/HighlightedCode';

const LINE_HEIGHT = 24;
const PADDING_Y = 32;
const MIN_LINES = 17;
const MAX_HEIGHT = 480;

export const CHAR_LIMIT = 2000;

function detectLanguage(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return 'javascript';

  const firstLine = trimmed.split('\n')[0].trim();
  const head = trimmed.slice(0, 500);

  if (firstLine.startsWith('#!')) {
    if (/python/i.test(firstLine)) return 'python';
    if (/bash|sh/.test(firstLine)) return 'shellscript';
    if (/node/.test(firstLine)) return 'javascript';
    if (/deno/.test(firstLine)) return 'typescript';
    if (/ruby/.test(firstLine)) return 'ruby';
  }

  if (/^<\w+/.test(trimmed) && !/^<[A-Z]/.test(trimmed)) return 'html';
  if (/<\?php/.test(head)) return 'php';
  if (
    /^\s*(SELECT|FROM|WHERE|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE)\s/i.test(
      head,
    )
  )
    return 'sql';

  if (/\binterface\s+\w+\s*\{/.test(head) || /\btype\s+\w+\s*=/.test(head))
    return 'typescript';
  if (/^(import|export)\s+.*\s+from\s+['"]/.test(firstLine)) {
    if (/React|Component|JSX|Element/.test(head)) return 'tsx';
    return 'typescript';
  }

  if (/\bdef\s+\w+\s*\(/.test(head) || /\bclass\s+\w+\s*[:(]/.test(head))
    return 'python';
  if (
    /\bfn\s+\w+/.test(head) ||
    /\bpub\s+(fn|struct|enum|trait|impl)\b/.test(head) ||
    /\bimpl\s+\w+\s+for\b/.test(head)
  )
    return 'rust';
  if (/\bfunc\s+\w+/.test(head) || /\bpackage\s+\w+/.test(head)) return 'go';
  if (
    /\bpublic\s+(class|interface|enum)\b/.test(head) ||
    /\bSystem\.(out|err)\./.test(head)
  )
    return 'java';
  if (/\brequire\s+['"]/.test(head) || /\bmodule\s+\w+/.test(head))
    return 'ruby';
  if (
    /^export\s+default\s+(function|const|class)/.test(firstLine) &&
    /<[A-Z]/.test(head)
  )
    return 'jsx';
  if (
    /^\s*[.#@]\w+\s*\{/.test(head) ||
    /^\s*@(import|media|keyframes)/.test(head)
  )
    return 'css';

  return 'javascript';
}

function handleTab(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void,
) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const indent = e.shiftKey ? '' : '  ';
    const newValue = `${before}${indent}${after}`;
    onChange(newValue);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + indent.length;
    });
  }
}

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const [language, setLanguage] = useState('auto');
  const effectiveLang = language === 'auto' ? detectLanguage(value) : language;

  const lines = value === '' ? [] : value.split('\n');
  const contentHeight = Math.min(
    Math.max(
      lines.length * LINE_HEIGHT + PADDING_Y,
      MIN_LINES * LINE_HEIGHT + PADDING_Y,
    ),
    MAX_HEIGHT,
  );

  const highlightRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (linesRef.current) {
      linesRef.current.style.transform = `translateY(-${scrollTop}px)`;
    }
  }, []);

  return (
    <div className="w-full rounded-lg border border-border bg-input focus-within:ring-1 focus-within:ring-border-focus focus-within:ring-offset-0">
      <CodeEditorHeader
        language={effectiveLang}
        onLanguageChange={setLanguage}
      />
      <div className="flex overflow-hidden rounded-b-lg">
        <div
          className="flex w-12 shrink-0 flex-col items-end overflow-hidden border-r border-border bg-surface"
          style={{ height: contentHeight }}
        >
          <div
            ref={linesRef}
            className="flex flex-col items-end px-3 py-4"
            style={{ minWidth: 48 }}
          >
            {lines.map((_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: static line numbers, order never changes
                key={i}
                className="shrink-0 font-mono text-xs leading-6 text-text-tertiary"
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex-1" style={{ height: contentHeight }}>
          <div
            ref={highlightRef}
            className="absolute inset-0 overflow-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-hidden="true"
          >
            {value !== '' ? (
              <div className="pointer-events-none">
                <HighlightedCode code={value} language={effectiveLang} />
              </div>
            ) : (
              <div className="pointer-events-none font-mono text-xs leading-6 text-text-tertiary">
                paste your code here...
              </div>
            )}
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={(e) => handleTab(e, value, onChange)}
            className="absolute inset-0 resize-none overflow-auto whitespace-pre bg-transparent p-4 font-mono text-xs leading-6 text-transparent caret-text-primary outline-none selection:bg-accent-cyan/20 [scrollbar-width:thin] [scrollbar-color:var(--color-text-muted)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-text-muted"
            spellCheck={false}
          />
          <div className="absolute bottom-0 right-0 z-10 px-3 py-1.5 font-mono text-[11px] pointer-events-none">
            <span
              className={
                value.length > CHAR_LIMIT
                  ? 'text-accent-red'
                  : 'text-text-tertiary'
              }
            >
              {value.length.toLocaleString()}/{CHAR_LIMIT.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
