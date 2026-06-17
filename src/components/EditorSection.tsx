'use client';

import { useState } from 'react';
import {
  CHAR_LIMIT,
  CodeEditor,
  detectLanguage,
} from '@/components/CodeEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';

const defaultCode = '';

export function EditorSection() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('auto');

  const detectedLang = code.trim() ? detectLanguage(code) : undefined;

  return (
    <>
      <div className="w-full max-w-[780px]">
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      <div className="flex w-full max-w-[780px] items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle label="roast mode" defaultChecked />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-text-tertiary">
              lang
            </span>
            <LanguageSelector
              language={language}
              detectedLanguage={detectedLang}
              onLanguageChange={setLanguage}
            />
          </div>
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
