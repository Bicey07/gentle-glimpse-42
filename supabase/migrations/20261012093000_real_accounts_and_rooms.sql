-- Quiet Space application schema. No sample users, rooms, entries, or memories.
-- Existing rows are retained. Legacy rooms without an owner are not exposed.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

do $$ begin create type public.entry_kind as enum ('sentence','image','book','movie','status'); exception when duplicate_object then null; end $$;
do $$ begin create type public.entry_visibility as enum ('self','friends'); exception when duplicate_object then null; end $$;
do $$ begin create type public.friendship_status as enum ('pending','accepted'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '', bio text not null default '', color text not null default '#8fa3b5',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.entries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind public.entry_kind not null, visibility public.entry_visibility not null default 'friends',
 text text, title text, creator text, note text, mood text, caption text, image_path text,
 created_at timestamptz not null default now()
);
create table if not exists public.friendships (
 id uuid primary key default gen_random_uuid(), requester_id uuid not null references auth.users(id) on delete cascade,
 addressee_id uuid not null references auth.users(id) on delete cascade,
 status public.friendship_status not null default 'pending', created_at timestamptz not null default now(),
 check (requester_id <> addressee_id)
);
create unique index if not exists quiet_friendship_pair on public.friendships (least(requester_id,addressee_id), greatest(requester_id,addressee_id));
create table if not exists public.replies (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 entry_id uuid references public.entries(id) on delete cascade, text text not null check (length(text) between 1 and 2000),
 created_at timestamptz not null default now()
);
create table if not exists public.rooms (
 id text primary key, name text not null, description text not null default '', created_at timestamptz not null default now()
);
alter table public.rooms add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.rooms add column if not exists color text not null default '#B8C9B0';
create table if not exists public.room_members (
 room_id text not null references public.rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, joined_at timestamptz not null default now(),
 primary key (room_id,user_id)
);
alter table public.room_members add column if not exists receipt jsonb;
create table if not exists public.room_notes (
 id uuid primary key default gen_random_uuid(), room_id text not null references public.rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 text text not null check (length(text) between 1 and 2000), created_at timestamptz not null default now()
);
create table if not exists private.room_invites (
 token_hash text primary key, room_id text not null references public.rooms(id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete cascade,
 expires_at timestamptz not null default (now() + interval '14 days')
);
create table if not exists public.shared_memories (
 id uuid primary key, room_id text not null references public.rooms(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 data jsonb not null, receipt jsonb, created_at timestamptz not null default now(),
 check (data->>'id' = id::text and data->>'roomId' = room_id),
 check (octet_length(data::text) <= 1600000)
);
create table if not exists public.memory_capsules (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 data jsonb not null, created_at timestamptz not null default now(),
 check (data->>'id' = id::text),
 check (data ?& array['ciphertext','iv','salt','proof']),
 check (not data ?| array['title','note','imageDataUrl','password','passphrase']),
 check (octet_length(data::text) <= 12000000)
);
create index if not exists quiet_entries_user_time on public.entries(user_id,created_at desc);
create index if not exists quiet_members_user on public.room_members(user_id);
create index if not exists quiet_notes_room_time on public.room_notes(room_id,created_at desc);
create index if not exists quiet_memories_room_time on public.shared_memories(room_id,created_at desc);
create index if not exists quiet_capsules_user on public.memory_capsules(user_id);

create or replace function private.quiet_friends(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.friendships where status='accepted' and ((requester_id=a and addressee_id=b) or (requester_id=b and addressee_id=a)));
$$;
create or replace function private.quiet_member(room text, person uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.room_members m join public.rooms r on r.id=m.room_id where m.room_id=room and m.user_id=person and r.owner_id is not null);
$$;
create or replace function private.quiet_profile_visible(person uuid) returns boolean language sql stable security definer set search_path='' as $$
 select person=auth.uid() or exists(select 1 from public.friendships where (requester_id=auth.uid() and addressee_id=person) or (addressee_id=auth.uid() and requester_id=person))
 or exists(select 1 from public.room_members a join public.room_members b using(room_id) join public.rooms r on r.id=a.room_id where a.user_id=auth.uid() and b.user_id=person and r.owner_id is not null);
$$;
create or replace function private.quiet_image_visible(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.entries where image_path=path and (user_id=auth.uid() or (visibility='friends' and private.quiet_friends(user_id,auth.uid()))));
$$;
revoke all on function private.quiet_friends(uuid,uuid), private.quiet_member(text,uuid), private.quiet_profile_visible(uuid), private.quiet_image_visible(text) from public;
grant execute on function private.quiet_friends(uuid,uuid), private.quiet_member(text,uuid), private.quiet_profile_visible(uuid), private.quiet_image_visible(text) to authenticated;

-- Replace policies only on the app-owned tables; no data is deleted.
do $$ declare r record; t text; begin
 for t in select unnest(array['profiles','entries','friendships','replies','rooms','room_members','room_notes','shared_memories','memory_capsules']) loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon,authenticated',t);
  for r in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy %I on public.%I',r.policyname,t);
  end loop;
 end loop;
end $$;
grant select on public.profiles,public.entries,public.friendships,public.replies,public.rooms,public.room_members,public.room_notes,public.shared_memories,public.memory_capsules to authenticated;
grant insert on public.entries,public.friendships,public.replies,public.room_notes,public.shared_memories,public.memory_capsules to authenticated;
grant update(display_name,bio,color,updated_at) on public.profiles to authenticated;
grant update(status) on public.friendships to authenticated;
grant update(receipt) on public.room_members,public.shared_memories to authenticated;
grant update(data) on public.memory_capsules to authenticated;
grant delete on public.entries,public.memory_capsules to authenticated;

create policy quiet_profile_read on public.profiles for select to authenticated using (private.quiet_profile_visible(id));
create policy quiet_profile_update on public.profiles for update to authenticated using (id=auth.uid()) with check(id=auth.uid());
create policy quiet_entry_read on public.entries for select to authenticated using(user_id=auth.uid() or (visibility='friends' and private.quiet_friends(user_id,auth.uid())));
create policy quiet_entry_insert on public.entries for insert to authenticated with check(user_id=auth.uid() and (image_path is null or split_part(image_path,'/',1)=auth.uid()::text));
create policy quiet_entry_delete on public.entries for delete to authenticated using(user_id=auth.uid());
create policy quiet_friend_read on public.friendships for select to authenticated using(auth.uid() in (requester_id,addressee_id));
create policy quiet_friend_request on public.friendships for insert to authenticated with check(requester_id=auth.uid() and addressee_id<>auth.uid() and status='pending');
create policy quiet_friend_accept on public.friendships for update to authenticated using(addressee_id=auth.uid() and status='pending') with check(addressee_id=auth.uid() and status='accepted');
create policy quiet_reply_read on public.replies for select to authenticated using(auth.uid() in (author_id,recipient_id));
create policy quiet_reply_insert on public.replies for insert to authenticated with check(author_id=auth.uid() and private.quiet_friends(author_id,recipient_id) and (entry_id is null or exists(select 1 from public.entries e where e.id=entry_id and e.user_id=recipient_id and e.visibility='friends')));
create policy quiet_room_read on public.rooms for select to authenticated using(owner_id is not null and private.quiet_member(id,auth.uid()));
create policy quiet_members_read on public.room_members for select to authenticated using(private.quiet_member(room_id,auth.uid()));
create policy quiet_members_receipt on public.room_members for update to authenticated using(user_id=auth.uid() and private.quiet_member(room_id,auth.uid())) with check(user_id=auth.uid());
create policy quiet_note_read on public.room_notes for select to authenticated using(private.quiet_member(room_id,auth.uid()));
create policy quiet_note_insert on public.room_notes for insert to authenticated with check(user_id=auth.uid() and private.quiet_member(room_id,auth.uid()));
create policy quiet_memory_read on public.shared_memories for select to authenticated using(private.quiet_member(room_id,auth.uid()));
create policy quiet_memory_insert on public.shared_memories for insert to authenticated with check(author_id=auth.uid() and receipt is null and private.quiet_member(room_id,auth.uid()));
create policy quiet_memory_receipt on public.shared_memories for update to authenticated using(author_id=auth.uid() and private.quiet_member(room_id,auth.uid())) with check(author_id=auth.uid());
create policy quiet_capsule_read on public.memory_capsules for select to authenticated using(user_id=auth.uid());
create policy quiet_capsule_insert on public.memory_capsules for insert to authenticated with check(user_id=auth.uid());
create policy quiet_capsule_update on public.memory_capsules for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy quiet_capsule_delete on public.memory_capsules for delete to authenticated using(user_id=auth.uid());

create or replace function public.quiet_create_room(_id text,_name text,_description text,_color text,_expected_user uuid)
 returns text language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.uid() is distinct from _expected_user then raise exception 'Sign in again' using errcode='42501'; end if;
 if _id !~ '^room-[a-z0-9-]{1,59}$' or length(trim(_name)) not between 1 and 40 or length(_description)>160 or _color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Invalid room'; end if;
 insert into public.rooms(id,name,description,color,owner_id) values(_id,trim(_name),_description,_color,auth.uid());
 insert into public.room_members(room_id,user_id) values(_id,auth.uid());
 return _id;
end $$;
create or replace function public.quiet_create_invite(_room text,_expected_user uuid) returns text language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if auth.uid() is null or auth.uid() is distinct from _expected_user or not private.quiet_member(_room,auth.uid()) then raise exception 'Room membership required' using errcode='42501'; end if;
 token := replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
 insert into private.room_invites(token_hash,room_id,created_by) values(encode(sha256(convert_to(token,'UTF8')),'hex'),_room,auth.uid());
 return token;
end $$;
create or replace function public.quiet_invite_preview(_token text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',r.id,'name',r.name,'description',r.description,'color',r.color)
 from private.room_invites i join public.rooms r on r.id=i.room_id
 where length(_token)=64 and i.token_hash=encode(sha256(convert_to(_token,'UTF8')),'hex') and i.expires_at>now() and r.owner_id is not null;
$$;
create or replace function public.quiet_accept_invite(_token text,_expected_user uuid) returns text language plpgsql security definer set search_path='' as $$
declare room text;
begin
 if auth.uid() is null or auth.uid() is distinct from _expected_user then raise exception 'Sign in again' using errcode='42501'; end if;
 select i.room_id into room from private.room_invites i join public.rooms r on r.id=i.room_id where length(_token)=64 and i.token_hash=encode(sha256(convert_to(_token,'UTF8')),'hex') and i.expires_at>now() and r.owner_id is not null;
 if room is null then raise exception 'Invitation is invalid or expired'; end if;
 insert into public.room_members(room_id,user_id) values(room,auth.uid()) on conflict do nothing;
 return room;
end $$;
revoke all on function public.quiet_create_room(text,text,text,text,uuid),public.quiet_create_invite(text,uuid),public.quiet_accept_invite(text,uuid),public.quiet_invite_preview(text) from public;
grant execute on function public.quiet_create_room(text,text,text,text,uuid),public.quiet_create_invite(text,uuid),public.quiet_accept_invite(text,uuid) to authenticated;
grant execute on function public.quiet_invite_preview(text) to anon,authenticated;

create or replace function private.quiet_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name,bio) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),40),'') on conflict(id) do nothing;
 return new;
end $$;
revoke all on function private.quiet_new_user() from public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.quiet_new_user();
insert into public.profiles(id,display_name,bio) select id,left(coalesce(raw_user_meta_data->>'display_name',''),40),'' from auth.users on conflict(id) do nothing;

-- Private image uploads; reads must match a visible entry (or the uploader).
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('entry-images','entry-images',false,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
 on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
do $$ declare r record; begin
 for r in select policyname from pg_policies where schemaname='storage' and tablename='objects' and (coalesce(qual,'') like '%entry-images%' or coalesce(with_check,'') like '%entry-images%') loop
  execute format('drop policy %I on storage.objects',r.policyname);
 end loop;
end $$;
create policy quiet_image_read on storage.objects for select to authenticated using(bucket_id='entry-images' and (split_part(name,'/',1)=auth.uid()::text or private.quiet_image_visible(name)));
create policy quiet_image_insert on storage.objects for insert to authenticated with check(bucket_id='entry-images' and split_part(name,'/',1)=auth.uid()::text);
create policy quiet_image_delete on storage.objects for delete to authenticated using(bucket_id='entry-images' and split_part(name,'/',1)=auth.uid()::text);
notify pgrst,'reload schema';
commit;
