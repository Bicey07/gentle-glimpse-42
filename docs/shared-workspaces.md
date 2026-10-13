# Reverie shared workspaces

This release replaces cloud-room local demo UI with shared pages, file attachments, comments, members and server-issued invitations. Existing room notes appear in Discussion. Local room demos and browser memory data are not deleted.

## Enable the database

1. Open the SQL Editor for Supabase project `divpoqhkponjowmryfda`.
2. Paste **all** of `supabase/migrations/20261013060000_room_collaboration.sql` into a new query and Run it once.
3. Expect `Success. No rows returned`. The transaction is additive and can be rerun. It requires the existing `20261012093000_real_accounts_and_rooms.sql` schema.
4. Refresh Reverie, open an existing small world, create a page, save, attach a file and add a comment.
5. Generate an invitation and test with a second account/browser. The second user must accept the invitation before seeing private content. Only share invitations with intended members; links expire after 14 days.

No service-role key belongs in browser code. All reads, comments and uploads use membership RLS. Document writes use an authenticated version-checked RPC; version history is append-only. The `room-files` bucket is private. Download/preview URLs expire after five minutes. Uploads allow ordinary image and document formats, maximum 20 MB each, ten files per batch. HTML/SVG executables are not accepted. Office documents download; they are not edited in-place.

## Editing behavior

All members can edit the shared text. Saving creates a history version. If someone else saved first, the stale edit is rejected and the local text retained for manual merging. This is not simultaneous cursor/character collaboration. Visible workspaces refresh every 15 seconds. Unsaved page drafts are scoped by user + page and kept in sessionStorage for the current browser session. Plain text is rendered safely as React text, never injected as HTML. A browser with disabled storage can still save to the cloud but will not retain local drafts.

The UI lists the most recent 500 pages, 200 attachments/comments per page and 20 revisions. The aggregate discussion shows the most recent 100 comments and legacy notes. Uploads do not import Office text; authors can paste text into a shared page and attach the original.

## Checks

```sh
npm run typecheck
node --import tsx --test tests/workspace.test.ts tests/workspace-ui.test.ts
```

For the isolated PostgreSQL/RLS suite (no production connection), install PGlite outside the repo:

```sh
npm install --prefix /tmp/reverie-db-test @electric-sql/pglite --no-audit --no-fund
PGLITE_MODULE=/tmp/reverie-db-test/node_modules/@electric-sql/pglite/dist/index.js node tests/workspace-db.mjs
```

The SQL test creates disposable in-memory users, roles and rooms, verifies migration repeatability, member/nonmember access, private file permissions, cross-room constraints, invitation expiration, editor identity, version conflicts and revision history. It never alters a live Supabase project.
