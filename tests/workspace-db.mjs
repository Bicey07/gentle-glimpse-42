process.on("uncaughtException", (e) => {
  console.error(e.message, e.code, e.query);
  process.exit(1);
});
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite");
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth,storage to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;
`);
const root = new URL("../", import.meta.url).pathname;
await db.exec(
  readFileSync(root + "supabase/migrations/20261012093000_real_accounts_and_rooms.sql", "utf8"),
);
const migration = readFileSync(
  root + "supabase/migrations/20261013060000_room_collaboration.sql",
  "utf8",
);
await db.exec(migration);
await db.exec(migration);
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222",
  c = "33333333-3333-4333-8333-333333333333",
  d = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
await db.query("insert into auth.users(id) values ($1),($2),($3)", [a, b, c]);
async function asUser(uid) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  await db.exec("set role authenticated");
}
await asUser(a);
await db.query("select public.quiet_create_room('room-test','写作小组','写点东西','#aabbcc',$1)", [
  a,
]);
const save = (id, v, title = "草稿", body = "第一版") =>
  db.query(
    "select * from public.reverie_save_document($1,'room-test',$2,$3,'writing','draft',$4)",
    [id, title, body, v],
  );
await save(d, 0);
assert.equal((await db.query("select * from public.room_document_versions")).rows.length, 1);
const token = (await db.query("select public.quiet_create_invite('room-test',$1) as token", [a]))
  .rows[0].token;
await asUser(c);
assert.equal((await db.query("select * from public.room_documents")).rows.length, 0);
assert.equal((await db.query("select * from public.room_document_versions")).rows.length, 0);
await assert.rejects(() => save(d, 1), /membership/);
await assert.rejects(
  () =>
    db.query(
      "insert into room_document_comments(document_id,room_id,body) values($1,'room-test','偷看')",
      [d],
    ),
  /row-level security/,
);
await asUser(b);
assert.ok((await db.query("select public.quiet_invite_preview($1) as room", [token])).rows[0].room);
await db.query("select public.quiet_accept_invite($1,$2)", [token, b]);
assert.equal((await db.query("select * from public.room_documents")).rows.length, 1);
await save(d, 1, "第二版", "朋友修改");
await assert.rejects(() => save(d, 1, "旧稿覆盖"), /DOCUMENT_CONFLICT/);
assert.equal((await db.query("select version from public.room_documents")).rows[0].version, 2);
await db.query(
  "insert into room_document_comments(document_id,room_id,body) values($1,'room-test','写得真好')",
  [d],
);
await assert.rejects(
  () =>
    db.query(
      "insert into room_document_comments(document_id,room_id,author_id,body) values($1,'room-test',$2,'冒充')",
      [d, a],
    ),
  /row-level security/,
);
const f = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  path = `room-test/${d}/${b}/${f}`;
await db.query("insert into storage.objects(bucket_id,name) values('room-files',$1)", [path]);
await db.query(
  "insert into room_document_files(id,document_id,room_id,name,path,mime,size) values($1,$2,'room-test','稿件.pdf',$3,'application/pdf',200)",
  [f, d, path],
);
assert.equal(
  (await db.query("delete from storage.objects where name=$1 returning *", [path])).rows.length,
  0,
  "attached files protected from cleanup",
);
await asUser(a);
assert.equal((await db.query("select * from room_document_files")).rows.length, 1);
assert.equal(
  (await db.query("select * from storage.objects where bucket_id='room-files'")).rows.length,
  1,
);
await asUser(c);
assert.equal((await db.query("select * from room_document_comments")).rows.length, 0);
assert.equal((await db.query("select * from room_document_files")).rows.length, 0);
assert.equal(
  (await db.query("select * from storage.objects where bucket_id='room-files'")).rows.length,
  0,
);
await assert.rejects(
  () =>
    db.query("insert into storage.objects(bucket_id,name) values('room-files',$1)", [
      `room-test/${d}/${c}/${f}`,
    ]),
  /row-level security/,
);
await asUser(a);
await db.query("select public.quiet_create_room('room-other','另一个房间','','#aabbcc',$1)", [a]);
await assert.rejects(
  () =>
    db.query(
      "insert into room_document_comments(document_id,room_id,body) values($1,'room-other','串房间')",
      [d],
    ),
  /foreign key/,
);
await db.exec("reset role");
await db.exec("update private.room_invites set expires_at=now()-interval '1 day'");
await asUser(c);
await assert.rejects(
  () => db.query("select quiet_accept_invite($1,$2)", [token, c]),
  /invalid or expired/,
);
console.log(
  "PASS: repeatable migration; private docs/files/comments; friend invitation; shared editing; version conflicts; revision history; author spoofing; cross-room rejection; expired invites",
);
await db.close();
