import type { Friend } from "../lib/types";

export function Avatar({
  person,
  size = 36,
}: {
  person: Friend;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-serif text-[var(--ink)] select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: person.color,
        fontSize: size * 0.42,
      }}
      aria-label={person.name}
    >
      {person.avatar}
    </div>
  );
}
