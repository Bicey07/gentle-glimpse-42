import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "../lib/i18n";
import { PageShell } from "../components/PageShell";
import { MemoryRoom } from "../components/MemoryRoom";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/memories")({ component: MemoriesPage });

function MemoriesPage() {
  const { t: tx } = useI18n();
  const me = useStore((s) => s.me);
  return <PageShell>
    <Link to="/me" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">{tx("← 我的房间")}</Link>
    <header className="mb-8"><div className="text-[10px] uppercase tracking-[.3em] text-[var(--quiet)]">PRIVATE MEMORY</div><h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">{tx("记忆胶囊")}</h1><p className="mt-2 text-sm text-[var(--quiet)]">{tx("把只属于你的记忆，收进一张安静的唱片。")}</p></header>
    <MemoryRoom name={me.name || tx("你的房间")} />
  </PageShell>;
}
