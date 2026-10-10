import { Link } from "@tanstack/react-router";
import type { Trace } from "../lib/types";
import { findPerson } from "../data/mockData";
import { useStore } from "../lib/store";

export function TraceLine({ trace }: { trace: Trace }) {
  const me = useStore((s) => s.me);
  const friends = useStore((s) => s.friends);
  const mode = useStore((s) => s.mode);
  const person =
    trace.personId === "me"
      ? me
      : friends.find((f) => f.id === trace.personId) ?? (mode === "demo" ? findPerson(trace.personId) : undefined);
  if (!person) return null;

  const Inner = (
    <>
      <span className="font-serif text-[var(--ink)]/80">{person.name}</span>
      <span className="mx-2">·</span>
      <span>{trace.verb}</span>
      {trace.detail && <span className="font-serif italic"> 「{trace.detail}」</span>}
    </>
  );

  const cls = "block py-2 text-sm text-[var(--quiet)] hover:text-[var(--ink)]";

  if (person.id === "me") {
    return <Link to="/me" className={cls}>{Inner}</Link>;
  }
  return (
    <Link to="/friends/$id" params={{ id: person.id }} className={cls}>
      {Inner}
    </Link>
  );
}
