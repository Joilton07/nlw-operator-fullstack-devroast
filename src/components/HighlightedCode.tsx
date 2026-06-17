'use client';

import { useEffect, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { createCssVariablesTheme, createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const cssVarsTheme = createCssVariablesTheme({
  name: 'css-variables',
});

// biome-ignore lint/suspicious/noExplicitAny: Shiki language import types are dynamic
const languageLoaders: Record<string, () => Promise<any>> = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  python: () => import('@shikijs/langs/python'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  java: () => import('@shikijs/langs/java'),
  ruby: () => import('@shikijs/langs/ruby'),
  php: () => import('@shikijs/langs/php'),
  sql: () => import('@shikijs/langs/sql'),
  shellscript: () => import('@shikijs/langs/shellscript'),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [cssVarsTheme],
      langs: [],
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
  const [loadingLang, setLoadingLang] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      const hl = await getHighlighter();
      if (cancelled) return;

      const loadedLangs = hl.getLoadedLanguages() as string[];
      const lang = language === 'auto' ? 'text' : language;

      if (lang !== 'text' && !loadedLangs.includes(lang)) {
        const loader = languageLoaders[lang];
        if (loader) {
          setLoadingLang(true);
          try {
            const mod = await loader();
            if (cancelled) return;
            await hl.loadLanguage(mod.default ?? mod);
          } catch {
            if (!cancelled) setHtml(null);
            setLoadingLang(false);
            return;
          }
          setLoadingLang(false);
        }
      }

      if (cancelled) return;
      try {
        const result = hl.codeToHtml(code, { lang, theme: 'css-variables' });
        setHtml(result);
      } catch {
        if (!cancelled) setHtml(null);
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  if (!html || loadingLang) {
    return (
      <pre className="!m-0 !p-0 !overflow-visible bg-transparent font-mono text-xs leading-6 text-text-primary">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="[&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!bg-transparent [&_pre]:!overflow-visible [&_pre]:!text-xs [&_pre]:!leading-6 [&_code]:!font-mono [&_code]:!text-xs [&_code]:!leading-6"
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
