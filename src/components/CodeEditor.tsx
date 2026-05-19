'use client';

const LINE_HEIGHT = 20;
const PADDING_Y = 32;

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const lines = value.split('\n');
  const contentHeight = lines.length * LINE_HEIGHT + PADDING_Y;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-input">
      <div className="flex h-10 items-center gap-3 border-b border-border px-4">
        <span className="size-[10px] rounded-full bg-accent-red" />
        <span className="size-[10px] rounded-full bg-accent-amber" />
        <span className="size-[10px] rounded-full bg-accent-green" />
      </div>
      <div className="flex">
        <div
          className="flex w-12 shrink-0 flex-col items-end border-r border-border bg-surface px-3 py-4"
          style={{ height: contentHeight }}
        >
          {lines.map((_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static line numbers, order never changes
              key={i}
              className="font-mono text-xs leading-5 text-text-tertiary"
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="flex-1" style={{ height: contentHeight }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-full w-full resize-none bg-transparent p-4 font-mono text-xs leading-5 text-text-primary outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
