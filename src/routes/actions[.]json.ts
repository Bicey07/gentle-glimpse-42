import { createFileRoute } from "@tanstack/react-router";
import { actionHeaders, actionJson } from "../lib/rooms/action.server";

export const Route = createFileRoute("/actions.json")({
  server: {
    handlers: {
      GET: () =>
        actionJson({ rules: [{ pathPattern: "/api/room-key**", apiPath: "/api/room-key**" }] }),
      OPTIONS: () => new Response(null, { status: 204, headers: actionHeaders }),
    },
  },
});
