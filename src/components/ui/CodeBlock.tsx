import { codeToHtml } from 'shiki';

type CodeBlockProps = {
  code: string;
  language: string;
  filename?: string;
};

export async function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: 'vesper',
  });

  const lines = code.split('\n');
  const lineCount = lines.length;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-input">
      {filename && (
        <div className="flex h-10 items-center gap-3 border-b border-border px-4">
          <span className="size-[10px] rounded-full bg-accent-red" />
          <span className="size-[10px] rounded-full bg-accent-amber" />
          <span className="size-[10px] rounded-full bg-accent-green" />
          <span className="ml-auto font-mono text-xs text-text-tertiary">
            {filename}
          </span>
        </div>
      )}
      <div className="flex">
        <div className="flex w-10 shrink-0 flex-col items-end gap-[6px] border-r border-border bg-surface px-[10px] py-3">
          {Array.from({ length: lineCount }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static line numbers, order never changes
              key={i}
              className="font-mono text-[13px] leading-none text-text-tertiary"
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div
          className="overflow-x-auto p-3 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!font-mono [&_code]:!text-[13px] [&_code]:!leading-none"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates safe HTML from server-side highlighting
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
