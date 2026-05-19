'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { Button } from '@/components/ui/Button';
import {
  TableRow,
  TableRowCode,
  TableRowLanguage,
  TableRowRank,
  TableRowScore,
} from '@/components/ui/TableRow';
import { Toggle } from '@/components/ui/Toggle';

const defaultCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`;

export default function Home() {
  const [code, setCode] = useState(defaultCode);

  return (
    <main className="mx-auto flex max-w-[960px] flex-col items-center gap-8 px-10 pt-20">
      <section className="flex flex-col items-center gap-3">
        <h1 className="flex items-center gap-3">
          <span className="font-mono text-4xl font-bold text-accent-green">
            $
          </span>
          <span className="font-mono text-4xl font-bold text-text-primary">
            paste your code. get roasted.
          </span>
        </h1>
        <p className="font-mono text-sm text-text-secondary">
          {'//'} drop your code below and we&apos;ll rate it — brutally honest
          or full roast mode
        </p>
      </section>

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
        <Button variant="primary" size="md" disabled={!code.trim()}>
          $ roast_my_code
        </Button>
      </div>

      <div className="flex items-center gap-6">
        <span className="font-mono text-xs text-text-tertiary">
          2,847 codes roasted
        </span>
        <span className="font-mono text-xs text-text-tertiary">&middot;</span>
        <span className="font-mono text-xs text-text-tertiary">
          avg score: 4.2/10
        </span>
      </div>

      <div className="h-15" />

      <section className="flex w-full flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {'//'}
            </span>
            <span className="font-mono text-sm font-bold text-text-primary">
              shame_leaderboard
            </span>
          </div>
          <Link
            href="/leaderboard"
            className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:text-text-primary"
          >
            $ view_all &gt;&gt;
          </Link>
        </div>

        <p className="font-mono text-[13px] text-text-tertiary">
          {'//'} the worst code on the internet, ranked by shame
        </p>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex h-10 items-center gap-6 bg-surface px-5">
            <div className="w-[50px]">
              <span className="font-mono text-xs text-text-secondary">
                Rank
              </span>
            </div>
            <div className="w-[70px]">
              <span className="font-mono text-xs text-text-secondary">
                Score
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-mono text-xs text-text-secondary">
                Code
              </span>
            </div>
            <div className="w-[100px]">
              <span className="font-mono text-xs text-text-secondary">
                Language
              </span>
            </div>
          </div>
          <TableRow>
            <TableRowRank>1</TableRowRank>
            <TableRowScore score={1.2} />
            <TableRowCode>eval(prompt(&quot;enter code&quot;))</TableRowCode>
            <TableRowLanguage>javascript</TableRowLanguage>
          </TableRow>
          <TableRow>
            <TableRowRank>2</TableRowRank>
            <TableRowScore score={1.8} />
            <TableRowCode>
              if (x == true) {'{'} return true; {'}'} else if (x == false)
            </TableRowCode>
            <TableRowLanguage>typescript</TableRowLanguage>
          </TableRow>
          <TableRow>
            <TableRowRank>3</TableRowRank>
            <TableRowScore score={2.1} />
            <TableRowCode>SELECT * FROM users WHERE 1=1</TableRowCode>
            <TableRowLanguage>sql</TableRowLanguage>
          </TableRow>
        </div>

        <div className="flex justify-center gap-1 py-4">
          <span className="font-mono text-xs text-text-tertiary">
            showing top 3 of 2,847 &middot;
          </span>
          <Link
            href="/leaderboard"
            className="font-mono text-xs text-text-tertiary underline underline-offset-2 hover:text-text-secondary"
          >
            view full leaderboard &gt;&gt;
          </Link>
        </div>
      </section>

      <div className="h-15" />
    </main>
  );
}
