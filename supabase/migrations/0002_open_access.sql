-- Backbone — open access (no sign-in)
-- Run once in the SQL editor, after 0001_init.sql.
--
-- Decision 2026-09-17: no sign-in for now. Anyone holding the app link and
-- publishable key can read and write everything. Revisit before the app is
-- shared with anyone else — to lock it down again, drop the four "anyone"
-- policies below and put the sign-in gate back in the app.

-- Rows no longer belong to a user.
alter table public.brain_dumps   alter column user_id drop not null;
alter table public.library_items alter column user_id drop not null;

drop policy if exists "anyone dumps" on public.brain_dumps;
create policy "anyone dumps" on public.brain_dumps
  for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "anyone library" on public.library_items;
create policy "anyone library" on public.library_items
  for all to anon, authenticated
  using (true) with check (true);

-- Recordings: whole `audio` bucket, any path.
drop policy if exists "anyone audio select" on storage.objects;
create policy "anyone audio select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'audio');

drop policy if exists "anyone audio insert" on storage.objects;
create policy "anyone audio insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'audio');

drop policy if exists "anyone audio update" on storage.objects;
create policy "anyone audio update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'audio');

drop policy if exists "anyone audio delete" on storage.objects;
create policy "anyone audio delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'audio');
