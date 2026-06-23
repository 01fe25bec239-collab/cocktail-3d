-- Drop the restrictive authenticated-only policies for storage
drop policy if exists "Auth Insert" on storage.objects;
drop policy if exists "Auth Update" on storage.objects;
drop policy if exists "Auth Delete" on storage.objects;

-- Create public-friendly policies for the media bucket to avoid session sync issues
create policy "Public Insert" on storage.objects for insert with check ( bucket_id = 'media' );
create policy "Public Update" on storage.objects for update using ( bucket_id = 'media' );
create policy "Public Delete" on storage.objects for delete using ( bucket_id = 'media' );
