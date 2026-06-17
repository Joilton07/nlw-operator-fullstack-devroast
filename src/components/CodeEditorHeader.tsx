'use client';

export function CodeEditorHeader() {
  return (
    <div className="flex h-10 items-center gap-3 border-b border-border px-4">
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-accent-red" />
        <span className="size-3 rounded-full bg-accent-amber" />
        <span className="size-3 rounded-full bg-accent-green" />
      </div>
    </div>
  );
}
