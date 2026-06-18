import { LeaderboardSection } from '@/components/ui/LeaderboardSection';
import { EditorSection } from '@/components/EditorSection';
import { MetricsCards } from '@/components/ui/MetricsCards';

export const revalidate = 3600;

export default function Home() {
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

      <EditorSection />

      <MetricsCards />

      <div className="h-15" />

      <LeaderboardSection />

      <div className="h-15" />
    </main>
  );
}
