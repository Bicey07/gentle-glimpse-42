-- Reverie shared workspaces. Additive: existing rooms, notes and memories remain.
begin;
create table if not exists public.room_documents (
 id uuid primary key default gen_random_uuid(),
 room_id text not null references public.rooms(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 120),
 body text not null default '' check (length(body)<=100000),
 category text not null default 'writing' check (category in ('writing','reading','film','inspiration','meeting')),
 status text not null default 'draft' check (status in ('draft','discussion','finished')),
 author_id uuid not null references auth.users(id),
 updated_by uuid not null references auth.users(id),
 version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,room_id)
);
create table if not exists public.room_document_versions (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.room_documents(id) on delete cascade,
 version integer not null, title text not null, body text not null, category text not null, status text not null,
 editor_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(document_id,version)
);
create table if not exists public.room_document_comments (
 id uuid primary key default gen_random_uuid(),
 document_id uuid not null, room_id text not null,
 author_id uuid not null default auth.uid() references auth.users(id),
 body text not null check (length(trim(body)) between 1 and 5000),
 created_at timestamptz not null default now(),
 foreign key(document_id,room_id) references public.room_documents(id,room_id) on delete cascade
);
create table if not exists public.room_document_files (
 id uuid primary key default gen_random_uuid(), document_id uuid not null, room_id text not null,
 uploader_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(name) between 1 and 240),
 path text not null unique, mime text not null, size integer not null check(size between 1 and 20971520),
 created_at timestamptz not null default now(),
 foreign key(document_id,room_id) references public.room_documents(id,room_id) on delete cascade,
 check(path=room_id || '/' || document_id::text || '/' || uploader_id::text || '/' || id::text)
);
create index if not exists reverie_documents_room on public.room_documents(room_id,updated_at desc);
create index if not exists reverie_comments_document on public.room_document_comments(document_id,created_at);
create index if not exists reverie_files_document on public.room_document_files(document_id,created_at);

alter table public.room_documents enable row level security;
alter table public.room_document_versions enable row level security;
alter table public.room_document_comments enable row level security;
alter table public.room_document_files enable row level security;
revoke all on public.room_documents,public.room_document_versions,public.room_document_comments,public.room_document_files from anon,authenticated;
grant select on public.room_documents,public.room_document_versions,public.room_document_comments,public.room_document_files to authenticated;
grant insert on public.room_document_comments,public.room_document_files to authenticated;

drop policy if exists reverie_documents_read on public.room_documents;
create policy reverie_documents_read on public.room_documents for select to authenticated using(private.quiet_member(room_id,auth.uid()));
drop policy if exists reverie_versions_read on public.room_document_versions;
create policy reverie_versions_read on public.room_document_versions for select to authenticated using(exists(select 1 from public.room_documents d where d.id=document_id));
drop policy if exists reverie_comments_read on public.room_document_comments;
create policy reverie_comments_read on public.room_document_comments for select to authenticated using(private.quiet_member(room_id,auth.uid()));
drop policy if exists reverie_comments_insert on public.room_document_comments;
create policy reverie_comments_insert on public.room_document_comments for insert to authenticated with check(author_id=auth.uid() and private.quiet_member(room_id,auth.uid()));
drop policy if exists reverie_files_read on public.room_document_files;
create policy reverie_files_read on public.room_document_files for select to authenticated using(private.quiet_member(room_id,auth.uid()));
drop policy if exists reverie_files_insert on public.room_document_files;
create policy reverie_files_insert on public.room_document_files for insert to authenticated with check(uploader_id=auth.uid() and private.quiet_member(room_id,auth.uid()) and exists(select 1 from storage.objects o where o.bucket_id='room-files' and o.name=path));

-- All document writes go through an atomic version check. Never silently overwrite a collaborator.
create or replace function public.reverie_save_document(_id uuid,_room text,_title text,_body text,_category text,_status text,_version integer)
returns public.room_documents language plpgsql security definer set search_path='' as $$
declare doc public.room_documents;
begin
 if auth.uid() is null or not private.quiet_member(_room,auth.uid()) then raise exception 'Room membership required' using errcode='42501'; end if;
 if length(trim(_title)) not between 1 and 120 or length(_body)>100000 or _category not in ('writing','reading','film','inspiration','meeting') or _status not in ('draft','discussion','finished') then raise exception 'Invalid document'; end if;
 if _version=0 then
  insert into public.room_documents(id,room_id,title,body,category,status,author_id,updated_by)
  values(_id,_room,trim(_title),_body,_category,_status,auth.uid(),auth.uid()) returning * into doc;
 else
  update public.room_documents set title=trim(_title),body=_body,category=_category,status=_status,
   version=version+1,updated_by=auth.uid(),updated_at=now()
  where id=_id and room_id=_room and version=_version returning * into doc;
  if not found then raise exception 'DOCUMENT_CONFLICT' using errcode='40001'; end if;
 end if;
 insert into public.room_document_versions(document_id,version,title,body,category,status,editor_id)
 values(doc.id,doc.version,doc.title,doc.body,doc.category,doc.status,auth.uid());
 return doc;
end $$;
revoke all on function public.reverie_save_document(uuid,text,text,text,text,text,integer) from public;
grant execute on function public.reverie_save_document(uuid,text,text,text,text,text,integer) to authenticated;

-- Restrict files to a room's members, using an opaque path and a private bucket.
create or replace function private.reverie_file_member(path text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.room_documents d where d.id::text=split_part(path,'/',2)
 and d.room_id=split_part(path,'/',1) and private.quiet_member(d.room_id,auth.uid()));
$$;
revoke all on function private.reverie_file_member(text) from public;
grant execute on function private.reverie_file_member(text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('room-files','room-files',false,20971520,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','text/markdown','text/csv','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists reverie_storage_read on storage.objects;
create policy reverie_storage_read on storage.objects for select to authenticated using(bucket_id='room-files' and private.reverie_file_member(name));
drop policy if exists reverie_storage_insert on storage.objects;
create policy reverie_storage_insert on storage.objects for insert to authenticated with check(bucket_id='room-files' and private.reverie_file_member(name) and split_part(name,'/',3)=auth.uid()::text and array_length(string_to_array(name,'/'),1)=4);
-- Allow cleanup only for the uploader's unfinished upload; attached files cannot disappear.
drop policy if exists reverie_storage_cleanup on storage.objects;
create policy reverie_storage_cleanup on storage.objects for delete to authenticated using(bucket_id='room-files' and split_part(name,'/',3)=auth.uid()::text and private.reverie_file_member(name) and not exists(select 1 from public.room_document_files f where f.path=objects.name));
notify pgrst,'reload schema';
commit;
