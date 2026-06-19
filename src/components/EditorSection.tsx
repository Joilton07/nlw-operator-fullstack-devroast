'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CHAR_LIMIT,
  CodeEditor,
  detectLanguage,
} from '@/components/CodeEditor';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useTRPC } from '@/lib/trpc/client';
import { useMutation } from '@tanstack/react-query';

const defaultCode = '';

export function EditorSection() {
  const router = useRouter();
  const trpc = useTRPC();
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('auto');
  const [roastMode, setRoastMode] = useState(true);

  const { mutate, isPending } = useMutation(
    trpc.roast.submit.mutationOptions({
      onSuccess: (data) => {
        router.push(`/roast/${data.id}`);
      },
    }),
  );

  const detectedLang = code.trim() ? detectLanguage(code) : undefined;

  const handleSubmit = () => {
    if (!code.trim() || code.length > CHAR_LIMIT || isPending) return;
    mutate({
      codeContent: code,
      language: language === 'auto' ? undefined : language,
      roastMode: roastMode ? 'sarcasm' : 'honest',
    });
  };

  return (
    <>
      <div className="w-full max-w-[780px]">
        <CodeEditor value={code} onChange={setCode} language={language} />
      </div>

      <div className="flex w-full max-w-[780px] items-center justify-between">
        <div className="flex items-center gap-4">
          <Toggle
            label="roast mode"
            defaultChecked
            onCheckedChange={setRoastMode}
          />
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
          disabled={!code.trim() || code.length > CHAR_LIMIT || isPending}
          onClick={handleSubmit}
        >
          {isPending ? '$ roasting...' : '$ roast_my_code'}
        </Button>
      </div>
    </>
  );
}
