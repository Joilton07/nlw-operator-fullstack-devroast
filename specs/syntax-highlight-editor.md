# Syntax Highlight Editor — Spec

## Resumo

Adicionar syntax highlight ao `CodeEditor` da homepage usando **Shiki** (já no `package.json`), mantendo consistência visual com o `CodeBlock` (server-side, tema `vesper`). O editor continua sendo um textarea simples — o highlight é renderizado como overlay HTML por baixo (padrão ray-so).

## Referência

O [ray-so](https://github.com/raycast/ray-so) usa exatamente este padrão:

1. `<textarea>` com `-webkit-text-fill-color: transparent` no topo (z-index 2)
2. `<HighlightedCode>` por baixo com o HTML gerado pelo Shiki (z-index 1)
3. Ambos compartilham fonte, tamanho, padding e line-height idênticos
4. Language detection via `highlight.js` (opcional — Shiki v4 já tem `codeToHtml` com auto-detecção?)

## Decisões de Design

| Decisão | Escolha |
|---|---|
| Engine de highlight | **Shiki** (já instalado, mesmo do `CodeBlock`) |
| Tema | **`vesper`** (consistente com `CodeBlock.tsx:12`) |
| Arquitetura | **textarea overlay** (textarea transparente sobre HTML highlight) |
| Auto-detecção linguagem | **Shiki `codeToHtml` com tentative por linguagem** OU `highlight.js` só pra detect |
| Seletor manual de linguagem | **ComboBox minimalista** no header do editor |
| Exportar imagem | **Não** — só colar, ver highlight e roast |
| State management | `useState` simples (já usado no page.tsx) |

## Linguagens Suportadas

Auto-detecção + seletor manual cobre:

- **Web**: JavaScript, TypeScript, JSX, TSX, HTML, CSS
- **Backend/Shell**: Python, Go, Rust, Java, Ruby, PHP, SQL, Shell/Bash

## Estrutura de Componentes

### Proposta

```
src/components/
  CodeEditor.tsx              — container com toolbar + editor area (já existe, será expandido)
  CodeEditorHeader.tsx        — toolbar: bolinhas decorativas + seletor de linguagem
  HighlightedCode.tsx         — client component que usa Shiki pra gerar HTML highlightado
```

### `HighlightedCode.tsx` (novo)

```tsx
'use client';

import { createHighlighter, type Highlighter } from 'shiki';

// Singleton do highlighter — carrega uma vez, reusa
let highlighter: Highlighter | null = null;

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      langs: ['javascript', 'typescript', 'python', ...], // langs populares carregadas eager
      themes: ['vesper'],
    });
  }
  return highlighter;
}
```

### `CodeEditor.tsx` — mudanças

O textarea atual (linha 38-43) ganha um overlay de highlight por baixo:

```tsx
<div className="relative">
  {/* Camada highlight (atrás) */}
  <HighlightedCode code={value} language={language} />

  {/* Camada textarea (frente, transparente) */}
  <textarea
    value={value}
    onChange={...}
    className="absolute inset-0 resize-none bg-transparent ... text-transparent caret-text-primary"
    spellCheck={false}
  />
</div>
```

### `CodeEditorHeader.tsx` (novo)

O header atual (bolinhas vermelha/amarela/verde) ganha um seletor de linguagem à direita:

```tsx
<select value={language} onChange={...}>
  <option value="auto">auto</option>
  <option value="javascript">JavaScript</option>
  <option value="typescript">TypeScript</option>
  ...
</select>
```

## Fluxo de Auto-Detecção

1. Usuário cola ou digita código
2. `onChange` dispara
3. Se o seletor de linguagem está em `"auto"`:
   - Tentar highlight com Shiki pra cada linguagem candidata e ver qual produz mais tokens
   - Ou usar `highlight.js` `highlightAuto()` (mais preciso, mas adiciona dependência)
4. Se o usuário selecionou manualmente, usar essa linguagem direto
5. Renderizar `codeToHtml(code, { lang, theme: 'vesper' })`

> **Nota**: Shiki v4 não tem `highlightAuto` nativo. Opções:
> - (A) Importar `highlight.js` só pra detecção (ray-so faz isso)
> - (B) Fazer loop em `codeToHtml` com cada linguagem candidata e comparar saída — ineficiente
> - (C) Usar `lang: 'text'` como fallback se auto falhar
> **Recomendação**: Opção (A) — `highlight.js` é leve (~20KB gzip) e só seria usado pra detectar.

## SEO e Performance

| Preocupação | Solução |
|---|---|
| Bundle size | Shiki WASM (~4MB raw, ~500KB gzip) carregado lazy; langs carregadas sob demanda |
| Flicker/Flash | Mostrar textarea puro até o highlighter inicializar |
| SSR | Editor é `'use client'`, mas pode mostrar placeholder server-side |
| Carregamento langs populares | Eager: JS, TS, Python, Go, Rust; demais: lazy `highlighter.loadLanguage()` |

## To-Dos

- [ ] **Avaliar**: Shiki v4 suporta `createHighlighter` no client ou precisa de `getHighlighterCore` com WASM?
- [ ] **Decidir**: Usar `highlight.js` pra auto-detecção ou alternativa mais leve?
- [ ] **Criar**: `HighlightedCode.tsx` — client component com singleton do highlighter
- [ ] **Modificar**: `CodeEditor.tsx` — adicionar overlay pattern (textarea + highlight)
- [ ] **Criar**: `CodeEditorHeader.tsx` — seletor de linguagem no header
- [ ] **Estilizar**: Garantir que overlay de highlight fique pixel-perfect alinhado com textarea
- [ ] **Testar**: Paste de código de diferentes linguagens — JS, Python, Go, SQL, Shell
- [ ] **Testar**: Fallback visual enquanto Shiki carrega
- [ ] **Verificar**: Seletor de linguagem funciona com `auto` e manual
- [ ] **Verificar**: Não quebrou o layout existente (linhas, scroll, responsivo)
