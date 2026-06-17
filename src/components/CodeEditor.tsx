'use client';

import { useCallback, useEffect, useRef } from 'react';

import { CodeEditorHeader } from '@/components/CodeEditorHeader';
import { HighlightedCode } from '@/components/HighlightedCode';

const LINE_HEIGHT = 24;
const PADDING_Y = 32;
const MIN_LINES = 17;
const MAX_HEIGHT = 480;

export const CHAR_LIMIT = 2000;

export function detectLanguage(code: string): string {
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
    if (/\w+:\s*(?:string|number|boolean|any)\b/.test(head))
      return 'typescript';
    if (/\binterface\s+\w+\s*\{/.test(head)) return 'typescript';
    if (/React|Component|JSX|Element/.test(head)) return 'tsx';
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
  if (/\b(?:const|let|var)\s+\w+\s*=\s*require\s*\(/.test(head))
    return 'javascript';
  if (/\bmodule\.exports\b/.test(head)) return 'javascript';
  if (/\brequire\s+/.test(head) || /\brequire_relative\b/.test(head))
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

function getCurrentLine(textarea: HTMLTextAreaElement): string {
  const value = textarea.value;
  const pos = textarea.selectionStart;
  const beforeStart = value.slice(0, pos);
  const lineStart = beforeStart.lastIndexOf('\n') + 1;
  return value.slice(lineStart, pos);
}

function handleTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  const ta = e.currentTarget;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const value = ta.value;

  if (start === end) {
    if (e.shiftKey) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (value.slice(lineStart, lineStart + 2) === '  ') {
        ta.setSelectionRange(lineStart, lineStart + 2);
        document.execCommand('insertText', false, '');
      }
    } else {
      document.execCommand('insertText', false, '  ');
    }
  } else {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    ta.setSelectionRange(lineStart, end);
    const selected = value.slice(lineStart, end);

    if (e.shiftKey) {
      document.execCommand(
        'insertText',
        false,
        selected.replace(/^ {2}/gm, ''),
      );
    } else {
      document.execCommand('insertText', false, selected.replace(/^/gm, '  '));
    }
  }
}

function handleEnter(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  const ta = e.currentTarget;
  const line = getCurrentLine(ta);
  const indentMatch = line.match(/^(\s+)/);
  let indent = indentMatch ? indentMatch[1] : '';

  if (/[{[:>]$/.test(line.trim())) {
    indent += '  ';
  }

  document.execCommand('insertText', false, `\n${indent}`);
}

function handleBracketClose(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  const ta = e.currentTarget;
  const pos = ta.selectionStart;
  const line = getCurrentLine(ta);

  if (pos === ta.selectionEnd && /^\s{2,}$/.test(line)) {
    ta.setSelectionRange(pos - 2, pos);
  }

  document.execCommand('insertText', false, '}');
}

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: string;
};

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const effectiveLang = language === 'auto' ? detectLanguage(value) : language;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const isUserInput = useRef(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (isUserInput.current) {
      isUserInput.current = false;
      return;
    }
    if (ta.value !== value) {
      const pos = Math.min(ta.selectionStart, value.length);
      ta.value = value;
      ta.setSelectionRange(pos, pos);
    }
  }, [value]);

  const lines = value === '' ? [] : value.split('\n');
  const contentHeight = Math.min(
    Math.max(
      lines.length * LINE_HEIGHT + PADDING_Y,
      MIN_LINES * LINE_HEIGHT + PADDING_Y,
    ),
    MAX_HEIGHT,
  );

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

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      isUserInput.current = true;
      onChange(e.currentTarget.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          handleTab(e);
          break;
        case 'Enter':
          e.preventDefault();
          handleEnter(e);
          break;
        case '}':
          e.preventDefault();
          handleBracketClose(e);
          break;
        case 'Escape':
          e.preventDefault();
          e.currentTarget.blur();
          break;
      }
    },
    [],
  );

  return (
    <div className="w-full rounded-lg border border-border bg-input focus-within:ring-1 focus-within:ring-border-focus focus-within:ring-offset-0">
      <CodeEditorHeader />
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
            className="absolute inset-0 overflow-auto p-4 font-mono text-xs leading-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            ref={textareaRef}
            defaultValue={value}
            onInput={handleInput}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
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
