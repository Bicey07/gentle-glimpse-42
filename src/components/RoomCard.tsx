import { Link } from "@tanstack/react-router";
import type { Room } from "../lib/types";

export function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      to="/rooms/$id"
      params={{ id: room.id }}
      className="group flex items-center gap-4 border-b border-[var(--border)] py-4 transition-opacity hover:opacity-80"
    >
      <span
        className="inline-block h-8 w-8 shrink-0 rounded-md"
        style={{ backgroundColor: room.color }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[15px] text-[var(--ink)]">{room.name}</div>
        <div className="mt-0.5 truncate text-xs text-[var(--quiet)]">{room.description}</div>
      </div>
      <div className="text-[11px] text-[var(--quiet)] shrink-0">{room.presence}</div>
    </Link>
  );
}
