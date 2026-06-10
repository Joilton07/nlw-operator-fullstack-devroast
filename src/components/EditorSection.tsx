'use client';

import { useState } from 'react';
import { CHAR_LIMIT, CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';

const defaultCode = '';

export function EditorSection() {
  const [code, setCode] = useState(defaultCode);

  return (
    <>
      <div className="w-full max-w-[780px]">
        <CodeEditor value={code} onChange={setCode} />
      </div>

      <div className="flex w-full max-w-[780px] items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle label="roast mode" defaultChecked />
          <span className="font-mono text-xs text-text-tertiary">
            {'//'} maximum sarcasm enabled
          </span>
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={!code.trim() || code.length > CHAR_LIMIT}
        >
          $ roast_my_code
        </Button>
      </div>
    </>
  );
}
