import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/PageShell";
import { PostCard } from "../components/PostCard";
import { Avatar } from "../components/Avatar";
import { me, mockPosts } from "../data/mockData";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const mine = mockPosts
    .filter((p) => p.authorId === "me")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const status = mine.find((p) => p.type === "status");

  return (
    <PageShell>
      <header className="mb-10 flex flex-col items-center text-center">
        <Avatar person={me} size={72} />
        <h1 className="mt-4 font-serif text-2xl text-[var(--ink)]">{me.name}</h1>
        <p className="mt-1 text-sm text-[var(--quiet)]">{me.bio}</p>
      </header>

      {status && status.type === "status" && (
        <section className="mb-10">
          <div className="mb-3 text-xs tracking-[0.2em] text-[var(--quiet)]">本周状态</div>
          <div
            className="rounded-2xl px-5 py-6"
            style={{ backgroundColor: "color-mix(in oklab, var(--sage) 35%, var(--paper))" }}
          >
            <div className="font-serif text-2xl text-[var(--ink)]">{status.mood}</div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-1 text-xs tracking-[0.2em] text-[var(--quiet)]">最近的痕迹</div>
        {mine.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--quiet)]">
            还没有留下什么。
          </p>
        ) : (
          mine.map((p) => <PostCard key={p.id} post={p} compact />)
        )}
      </section>
    </PageShell>
  );
}
