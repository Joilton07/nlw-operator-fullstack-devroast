import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { DiffLine } from '@/components/ui/DiffLine';
import { ScoreRing } from '@/components/ui/ScoreRing';

const code = [
  'function calculateTotal(items) {',
  '  var total = 0;',
  '  for (var i = 0; i < items.length; i++) {',
  '    total = total + items[i].price;',
  '  }',
  '',
  '  if (total > 100) {',
  '    console.log("discount applied");',
  '    total = total * 0.9;',
  '  }',
  '',
  '  // TODO: handle tax calculation',
  '  // TODO: handle currency conversion',
  '',
  '  return total;',
  '}',
].join('\n');

export default async function RoastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  void id;

  const issues = [
    {
      dot: 'bg-accent-red',
      label: 'critical',
      variant: 'critical' as const,
      title: 'using var instead of const/let',
      description:
        'var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.',
    },
    {
      dot: 'bg-accent-amber',
      label: 'warning',
      variant: 'warning' as const,
      title: 'imperative loop pattern',
      description:
        'for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.',
    },
    {
      dot: 'bg-accent-green',
      label: 'good',
      variant: 'good' as const,
      title: 'clear naming conventions',
      description:
        'calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.',
    },
    {
      dot: 'bg-accent-green',
      label: 'good',
      variant: 'good' as const,
      title: 'single responsibility',
      description:
        'the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-20 py-10">
      <div className="flex flex-col gap-10">
        {/* Score Hero */}
        <div className="flex items-center gap-12">
          <ScoreRing score={3.5} maxScore={10} size="md" />
          <div className="flex flex-col gap-4">
            <Badge variant="verdict" size="md">
              needs_serious_help
            </Badge>
            <p className="font-mono text-xl leading-relaxed text-text-primary">
              &ldquo;this code looks like it was written during a power
              outage... in 2005.&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
                lang: javascript
                <span>·</span>
                16 lines
              </span>
              <Button variant="secondary" size="sm">
                $ share_roast
              </Button>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        {/* Submitted Code */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {'//'}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              your_submission
            </h2>
          </div>
          <CodeBlock code={code} language="javascript" />
        </div>

        <div className="h-px w-full bg-border" />

        {/* Detailed Analysis */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {'//'}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              detailed_analysis
            </h2>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex gap-5">
              {issues.slice(0, 2).map((issue) => (
                <Card key={issue.title} className="flex-1">
                  <CardHeader>
                    <Badge variant={issue.variant}>{issue.label}</Badge>
                  </CardHeader>
                  <CardTitle>{issue.title}</CardTitle>
                  <CardDescription>{issue.description}</CardDescription>
                </Card>
              ))}
            </div>
            <div className="flex gap-5">
              {issues.slice(2).map((issue) => (
                <Card key={issue.title} className="flex-1">
                  <CardHeader>
                    <Badge variant={issue.variant}>{issue.label}</Badge>
                  </CardHeader>
                  <CardTitle>{issue.title}</CardTitle>
                  <CardDescription>{issue.description}</CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        {/* Suggested Fix */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accent-green">
              {'//'}
            </span>
            <h2 className="font-mono text-sm font-bold text-text-primary">
              suggested_fix
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-input">
            <div className="flex h-10 items-center border-b border-border px-4">
              <span className="font-mono text-xs font-medium text-text-secondary">
                your_code.ts &rarr; improved_code.ts
              </span>
            </div>
            <div className="flex flex-col py-1">
              <DiffLine variant="context">
                function calculateTotal(items) {'{'}
              </DiffLine>
              <DiffLine variant="removed">{'  var total = 0;'}</DiffLine>
              <DiffLine variant="removed">
                {'  for (var i = 0; i < items.length; i++) {'}
              </DiffLine>
              <DiffLine variant="removed">
                {'    total = total + items[i].price;'}
              </DiffLine>
              <DiffLine variant="removed">{'  }'}</DiffLine>
              <DiffLine variant="removed">{'  return total;'}</DiffLine>
              <DiffLine variant="added">
                {'  return items.reduce((sum, item) => sum + item.price, 0);'}
              </DiffLine>
              <DiffLine variant="context">{'}'}</DiffLine>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
