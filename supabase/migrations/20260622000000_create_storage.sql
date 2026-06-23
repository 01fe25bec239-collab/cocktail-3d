-- Create media bucket
insert into storage.buckets (id, name, public) values ('media', 'media', true);

-- Enable public read access
create policy "Public Access" on storage.objects for select using ( bucket_id = 'media' );

-- Enable authenticated upload access
create policy "Auth Insert" on storage.objects for insert to authenticated with check ( bucket_id = 'media' );
create policy "Auth Update" on storage.objects for update to authenticated using ( bucket_id = 'media' );
create policy "Auth Delete" on storage.objects for delete to authenticated using ( bucket_id = 'media' );
