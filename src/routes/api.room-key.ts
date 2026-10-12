import { createFileRoute } from "@tanstack/react-router";
import { roomAction } from "../lib/rooms/action.server";

export const Route = createFileRoute("/api/room-key")({
  server: {
    handlers: {
      GET: ({ request }) => roomAction(request),
      POST: ({ request }) => roomAction(request),
      OPTIONS: ({ request }) => roomAction(request),
    },
  },
});
