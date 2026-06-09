'use client';

import { useEffect, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { createCssVariablesTheme, createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const cssVarsTheme = createCssVariablesTheme({
  name: 'css-variables',
});

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [cssVarsTheme],
      langs: [
        import('@shikijs/langs/javascript'),
        import('@shikijs/langs/typescript'),
        import('@shikijs/langs/jsx'),
        import('@shikijs/langs/tsx'),
        import('@shikijs/langs/html'),
        import('@shikijs/langs/css'),
        import('@shikijs/langs/python'),
        import('@shikijs/langs/go'),
        import('@shikijs/langs/rust'),
        import('@shikijs/langs/java'),
        import('@shikijs/langs/ruby'),
        import('@shikijs/langs/php'),
        import('@shikijs/langs/sql'),
        import('@shikijs/langs/shellscript'),
      ],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

type HighlightedCodeProps = {
  code: string;
  language: string;
};

export function HighlightedCode({ code, language }: HighlightedCodeProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((hl) => {
        if (cancelled) return;
        try {
          const lang = language === 'auto' ? 'text' : language;
          const result = hl.codeToHtml(code, { lang, theme: 'css-variables' });
          setHtml(result);
        } catch {
          setHtml(null);
        }
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (!html) {
    return (
      <pre className="!m-0 !p-0 !overflow-visible bg-transparent font-mono text-xs leading-6 text-text-primary">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="[&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!bg-transparent [&_pre]:!overflow-visible [&_code]:!font-mono [&_code]:!text-xs [&_code]:!leading-6"
      style={
        {
          '--shiki-foreground': 'var(--color-text-primary)',
          '--shiki-background': 'transparent',
          '--shiki-token-keyword': 'var(--color-syn-keyword)',
          '--shiki-token-string': 'var(--color-syn-string)',
          '--shiki-token-string-expression': 'var(--color-syn-string)',
          '--shiki-token-comment': 'var(--color-text-tertiary)',
          '--shiki-token-constant': 'var(--color-syn-number)',
          '--shiki-token-function': 'var(--color-syn-function)',
          '--shiki-token-parameter': 'var(--color-syn-variable)',
          '--shiki-token-punctuation': 'var(--color-syn-operator)',
          '--shiki-token-link': 'var(--color-syn-function)',
        } as React.CSSProperties
      }
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates safe HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
