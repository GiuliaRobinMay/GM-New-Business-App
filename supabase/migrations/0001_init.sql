-- Backbone — schema v1
-- Run once: Supabase dashboard → SQL editor → paste → Run.
-- (Or `supabase db push` if you use the CLI.)
--
-- Two tables, one private storage bucket, row-level security on everything
-- so only the signed-in user sees their own rows and files.

-- ---------------------------------------------------------------------------
-- Brain dumps
-- ---------------------------------------------------------------------------
create table if not exists public.brain_dumps (
  id                 text primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  title              text not null default '',
  body               text not null default '',
  tags               text[] not null default '{}',
  chapter            smallint check (chapter between 1 and 12),
  source             text not null default 'text' check (source in ('voice', 'text')),
  audio_path         text,                      -- path inside the `audio` bucket
  audio_duration_sec integer,
  status             text not null default 'raw' check (status in ('raw', 'reviewed', 'used'))
);

create index if not exists brain_dumps_user_created
  on public.brain_dumps (user_id, created_at desc);

alter table public.brain_dumps enable row level security;

drop policy if exists "own dumps" on public.brain_dumps;
create policy "own dumps" on public.brain_dumps
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Library
-- ---------------------------------------------------------------------------
create table if not exists public.library_items (
  id         text primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind       text not null default 'book'
             check (kind in ('book', 'article', 'video', 'podcast', 'course', 'person', 'tool', 'other')),
  title      text not null,
  author     text not null default '',
  url        text not null default '',
  note       text not null default '',
  tags       text[] not null default '{}',
  chapter    smallint check (chapter between 1 and 12),
  status     text not null default 'to-read' check (status in ('to-read', 'reading', 'done'))
);

create index if not exists library_items_user_created
  on public.library_items (user_id, created_at desc);

alter table public.library_items enable row level security;

drop policy if exists "own library" on public.library_items;
create policy "own library" on public.library_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Audio recordings — private bucket, files live under <user_id>/<id>.<ext>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

drop policy if exists "own audio select" on storage.objects;
create policy "own audio select" on storage.objects
  for select to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own audio insert" on storage.objects;
create policy "own audio insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own audio update" on storage.objects;
create policy "own audio update" on storage.objects
  for update to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own audio delete" on storage.objects;
create policy "own audio delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
