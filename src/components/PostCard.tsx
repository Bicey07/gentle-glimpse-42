import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Post } from "../lib/types";
import { findPerson, relativeTime } from "../data/mockData";
import { Avatar } from "./Avatar";

export function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  const author = findPerson(post.authorId);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState(post.replies ?? []);

  if (!author) return null;

  const isMe = author.id === "me";
  const headerLink = isMe ? "/me" : `/friend/${author.id}`;

  return (
    <article className="fade-in border-b border-[var(--border)] py-7">
      {!compact && (
        <header className="mb-3 flex items-center gap-3">
          <Link to={headerLink} className="flex items-center gap-3 group">
            <Avatar person={author} size={34} />
            <span className="font-serif text-[15px] text-[var(--ink)] group-hover:opacity-70">
              {author.name}
            </span>
          </Link>
          <span className="text-xs text-[var(--quiet)]">· {relativeTime(post.createdAt)}</span>
        </header>
      )}
      {compact && (
        <div className="mb-2 text-xs text-[var(--quiet)]">{relativeTime(post.createdAt)}</div>
      )}

      <div className="pl-0">
        <PostBody post={post} />
      </div>

      <footer className="mt-4 flex items-center gap-4 text-xs text-[var(--quiet)]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="hover:text-[var(--ink)] transition-colors"
        >
          {open ? "收起" : "回应"}
        </button>
      </footer>

      {(open || replies.length > 0) && (
        <div className="mt-4 space-y-2 pl-1">
          {replies.map((r, i) => (
            <div key={i} className="text-sm text-[var(--ink)]/80">
              <span className="font-serif text-[var(--quiet)]">{r.author}：</span>
              {r.text}
            </div>
          ))}
          {open && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                setReplies((rs) => [...rs, { author: "你", text: reply.trim() }]);
                setReply("");
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="留下一句话…"
                className="flex-1 border-b border-[var(--border)] bg-transparent py-1 text-sm outline-none placeholder:text-[var(--quiet)]/60 focus:border-[var(--bluegrey)]"
              />
              <button
                type="submit"
                className="text-xs text-[var(--bluegrey)] hover:text-[var(--ink)]"
              >
                送出
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}

function PostBody({ post }: { post: Post }) {
  switch (post.type) {
    case "sentence":
      return (
        <p className="font-serif text-[19px] leading-[1.9] text-[var(--ink)]">
          {post.text}
        </p>
      );
    case "image":
      return (
        <div>
          <img
            src={post.imageUrl}
            alt={post.caption ?? ""}
            className="w-full rounded-2xl object-cover"
            style={{ maxHeight: 460 }}
            loading="lazy"
          />
          {post.caption && (
            <p className="mt-3 text-sm text-[var(--quiet)]">{post.caption}</p>
          )}
        </div>
      );
    case "book":
      return (
        <div className="flex gap-4">
          <img
            src={post.cover}
            alt={post.title}
            className="h-24 w-16 rounded-md object-cover"
            loading="lazy"
          />
          <div className="flex-1">
            <div className="text-xs text-[var(--quiet)]">在读 · 书</div>
            <div className="font-serif text-[17px] text-[var(--ink)]">《{post.title}》</div>
            <div className="text-xs text-[var(--quiet)] mt-0.5">{post.author}</div>
            {post.note && (
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]/85">
                {post.note}
              </p>
            )}
          </div>
        </div>
      );
    case "movie":
      return (
        <div className="flex gap-4">
          <img
            src={post.cover}
            alt={post.title}
            className="h-24 w-32 rounded-md object-cover"
            loading="lazy"
          />
          <div className="flex-1">
            <div className="text-xs text-[var(--quiet)]">在看 · 电影</div>
            <div className="font-serif text-[17px] text-[var(--ink)]">《{post.title}》</div>
            <div className="text-xs text-[var(--quiet)] mt-0.5">{post.director}</div>
            {post.note && (
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]/85">
                {post.note}
              </p>
            )}
          </div>
        </div>
      );
    case "status":
      return (
        <div
          className="rounded-2xl px-5 py-6"
          style={{ backgroundColor: "color-mix(in oklab, var(--sage) 35%, var(--paper))" }}
        >
          <div className="text-xs text-[var(--quiet)]">本周状态</div>
          <div className="mt-1 font-serif text-2xl text-[var(--ink)]">{post.mood}</div>
          {post.note && (
            <p className="mt-2 text-sm text-[var(--ink)]/80">{post.note}</p>
          )}
        </div>
      );
  }
}
