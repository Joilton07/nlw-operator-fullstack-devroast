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
import {
  TableRow,
  TableRowCode,
  TableRowLanguage,
  TableRowRank,
  TableRowScore,
} from '@/components/ui/TableRow';
import { Toggle } from '@/components/ui/Toggle';

const diffCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`;

export default function Componentes() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 bg-page p-8">
      <header>
        <h1 className="font-mono text-3xl font-bold text-text-primary">
          Component Library
        </h1>
      </header>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} badges
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          <Badge variant="critical">critical</Badge>
          <Badge variant="warning">warning</Badge>
          <Badge variant="good">good</Badge>
          <Badge variant="verdict" size="md">
            needs_serious_help
          </Badge>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} buttons
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="md">
            $ roast_my_code
          </Button>
          <Button variant="secondary" size="sm">
            $ share_roast
          </Button>
          <Button variant="ghost" size="sm">
            $ view_all {'>>'}
          </Button>
        </div>
      </section>

      {/* Toggle */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} toggle
        </h2>
        <div className="flex flex-col gap-4">
          <Toggle label="roast mode" defaultChecked />
          <Toggle label="roast mode" />
        </div>
      </section>

      {/* Card */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} cards
        </h2>
        <Card>
          <CardHeader>
            <Badge variant="critical">critical</Badge>
          </CardHeader>
          <CardTitle>using var instead of const/let</CardTitle>
          <CardDescription>
            the var keyword is function-scoped rather than block-scoped, which
            can lead to unexpected behavior and bugs. modern javascript uses
            const for immutable bindings and let for mutable ones.
          </CardDescription>
        </Card>
      </section>

      {/* CodeBlock */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} code_block
        </h2>
        <CodeBlock
          code={diffCode}
          language="javascript"
          filename="calculate.js"
        />
      </section>

      {/* DiffLine */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} diff_line
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <DiffLine variant="removed">var total = 0;</DiffLine>
          <DiffLine variant="added">const total = 0;</DiffLine>
          <DiffLine variant="context">
            for (let i = 0; i &lt; items.length; i++) {`{`}
          </DiffLine>
        </div>
      </section>

      {/* TableRow */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} table_row
        </h2>
        <div className="rounded-lg border border-border">
          <TableRow>
            <TableRowRank>1</TableRowRank>
            <TableRowScore score={2.1} />
            <TableRowCode>
              function calculateTotal(items) {'{'} var total = 0; ...
            </TableRowCode>
            <TableRowLanguage>javascript</TableRowLanguage>
          </TableRow>
          <TableRow>
            <TableRowRank>2</TableRowRank>
            <TableRowScore score={5.8} />
            <TableRowCode>
              def process_data(data): for item in data:
            </TableRowCode>
            <TableRowLanguage>python</TableRowLanguage>
          </TableRow>
          <TableRow>
            <TableRowRank>3</TableRowRank>
            <TableRowScore score={8.4} />
            <TableRowCode>
              function renderComponent(props) {'{'} const {'{'} title {'}'}
            </TableRowCode>
            <TableRowLanguage>typescript</TableRowLanguage>
          </TableRow>
        </div>
      </section>

      {/* ScoreRing */}
      <section className="space-y-4">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {'//'} score_ring
        </h2>
        <div className="flex items-center gap-8">
          <ScoreRing score={8.4} maxScore={10} size="lg" />
        </div>
      </section>
    </div>
  );
}
