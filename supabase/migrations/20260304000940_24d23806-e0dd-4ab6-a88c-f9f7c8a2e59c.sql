
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Public upload avatars" on storage.objects for insert with check (bucket_id = 'avatars');
create policy "Public update avatars" on storage.objects for update using (bucket_id = 'avatars');
create policy "Public delete avatars" on storage.objects for delete using (bucket_id = 'avatars');
