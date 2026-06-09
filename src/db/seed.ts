import { count } from 'drizzle-orm';
import { db } from '@/db';
import { analysisIssues, submissions, suggestedFixes } from '@/db/schema';

async function seed() {
  const [{ total }] = await db.select({ total: count() }).from(submissions);

  if (total > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  const [sub1] = await db
    .insert(submissions)
    .values({
      codeContent: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`,
      language: 'javascript',
      score: '2.1',
      roastQuote:
        'this code looks like it was written during a power outage... in 2005.',
      roastMode: 'sarcasm' as const,
      verdict: 'needs_serious_help' as const,
    })
    .returning();

  const [_sub2] = await db
    .insert(submissions)
    .values({
      codeContent: `eval(prompt("enter code"))`,
      language: 'javascript',
      score: '1.2',
      roastQuote: 'eval is not a function... wait, it is. that is the problem.',
      roastMode: 'sarcasm' as const,
      verdict: 'critical' as const,
    })
    .returning();

  const [_sub3] = await db
    .insert(submissions)
    .values({
      codeContent: `if (x == true) { return true; } else if (x == false) { return false; }`,
      language: 'typescript',
      score: '1.8',
      roastQuote: 'that is a lot of branches for a boolean.',
      roastMode: 'honest' as const,
      verdict: 'warning' as const,
    })
    .returning();

  const [_sub4] = await db
    .insert(submissions)
    .values({
      codeContent: `SELECT * FROM users WHERE 1=1`,
      language: 'sql',
      score: '3.5',
      roastQuote: 'hackers love this one weird trick.',
      roastMode: 'sarcasm' as const,
      verdict: 'warning' as const,
    })
    .returning();

  const [_sub5] = await db
    .insert(submissions)
    .values({
      codeContent: `const formatDate = (d) => d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()`,
      language: 'javascript',
      score: '5.0',
      roastQuote: 'it works, but your coworkers will find you.',
      roastMode: 'honest' as const,
      verdict: 'good' as const,
    })
    .returning();

  const issues1 = await db
    .insert(analysisIssues)
    .values([
      {
        submissionId: sub1.id,
        severity: 'critical' as const,
        title: 'Using var instead of const/let',
        description:
          'The var keyword is function-scoped rather than block-scoped, which can lead to unexpected behavior and bugs. Modern JavaScript uses const for immutable bindings and let for mutable ones.',
        lineStart: 2,
        lineEnd: 2,
      },
      {
        submissionId: sub1.id,
        severity: 'warning' as const,
        title: 'Imperative loop vs functional approach',
        description:
          'A for loop with manual indexing is verbose and error-prone. Consider using array.reduce() for accumulation.',
        lineStart: 3,
        lineEnd: 5,
      },
      {
        submissionId: sub1.id,
        severity: 'good' as const,
        title: 'Function is pure',
        description:
          'The function has no side effects and always returns the same output for the same input.',
      },
    ])
    .returning();

  const [issue1] = issues1;
  const [issue2] = issues1.slice(1);
  const [_issue3] = issues1.slice(2);

  await db.insert(suggestedFixes).values([
    {
      issueId: issue1.id,
      diffType: 'removed' as const,
      codeContent: 'var total = 0;',
      lineNumber: 2,
      sortOrder: 0,
    },
    {
      issueId: issue1.id,
      diffType: 'added' as const,
      codeContent: 'const total = 0;',
      lineNumber: 2,
      sortOrder: 1,
    },
    {
      issueId: issue1.id,
      diffType: 'context' as const,
      codeContent: 'for (let i = 0; i < items.length; i++) {',
      lineNumber: 3,
      sortOrder: 2,
    },
    {
      issueId: issue2.id,
      diffType: 'removed' as const,
      codeContent: 'for (var i = 0; i < items.length; i++) {',
      lineNumber: 3,
      sortOrder: 0,
    },
    {
      issueId: issue2.id,
      diffType: 'added' as const,
      codeContent: 'return items.reduce((acc, item) => acc + item.price, 0);',
      lineNumber: 3,
      sortOrder: 1,
    },
  ]);

  console.log(`Seeded ${5} submissions, ${3} issues, ${5} fixes.`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .then(() => process.exit(0));
