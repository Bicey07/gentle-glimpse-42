import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { FriendSpaceCard } from "../components/FriendSpaceCard";
import { friends } from "../data/mockData";

export const Route = createFileRoute("/friends")({
  component: FriendsPage,
});

function FriendsPage() {
  return (
    <PageShell>
      <Link to="/" className="mb-6 inline-block text-xs text-[var(--quiet)] hover:text-[var(--ink)]">
        ← 走廊
      </Link>
      <header className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--quiet)]">Friends</div>
        <h1 className="mt-3 font-serif text-2xl text-[var(--ink)]">朋友们各自的房间</h1>
        <p className="mt-2 text-sm text-[var(--quiet)]">轻轻推开任意一扇门看看。</p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {friends.map((f) => (
          <FriendSpaceCard key={f.id} person={f} />
        ))}
      </div>
    </PageShell>
  );
}
