import { codeToHtml } from 'shiki';

type CodeBlockProps = {
  code: string;
  language: string;
};

export async function CodeBlock({ code, language }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: 'vesper',
  });

  const lines = code.split('\n');
  const lineCount = lines.length;

  return (
    <div className="flex bg-input">
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
  );
}
