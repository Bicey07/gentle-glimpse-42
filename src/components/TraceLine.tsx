import { Link } from "@tanstack/react-router";
import type { Trace } from "../lib/types";
import { findPerson } from "../data/mockData";

export function TraceLine({ trace }: { trace: Trace }) {
  const person = findPerson(trace.personId);
  if (!person) return null;
  const to = person.id === "me" ? "/me" : `/friend/${person.id}`;
  return (
    <Link
      to={person.id === "me" ? "/me" : "/friend/$id"}
      params={person.id === "me" ? undefined as never : { id: person.id }}
      className="block py-2 text-sm text-[var(--quiet)] hover:text-[var(--ink)]"
    >
      <span className="font-serif text-[var(--ink)]/80">{person.name}</span>
      <span className="mx-2">·</span>
      <span>{trace.verb}</span>
      {trace.detail && (
        <span className="font-serif italic"> 「{trace.detail}」</span>
      )}
      <span className="sr-only">{to}</span>
    </Link>
  );
}
