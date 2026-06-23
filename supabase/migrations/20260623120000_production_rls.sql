-- Enable Row Level Security on the cocktails table
ALTER TABLE cocktails ENABLE ROW LEVEL SECURITY;

-- Drop any duplicate policies to clean up state
DROP POLICY IF EXISTS "Public can read published cocktails" ON cocktails;
DROP POLICY IF EXISTS "Authenticated users can read all cocktails" ON cocktails;
DROP POLICY IF EXISTS "Authenticated users can insert cocktails" ON cocktails;
DROP POLICY IF EXISTS "Authenticated users can update cocktails" ON cocktails;
DROP POLICY IF EXISTS "Authenticated users can delete cocktails" ON cocktails;

-- Enforce strict RLS policies on cocktails
CREATE POLICY "Allow public read for published cocktails" 
ON cocktails FOR SELECT 
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Allow authenticated read for all cocktails" 
ON cocktails FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert" 
ON cocktails FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update" 
ON cocktails FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" 
ON cocktails FOR DELETE 
TO authenticated
USING (true);


-- Enable Row Level Security on storage.objects for the media bucket
-- Note: storage.objects table belongs to the storage schema
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Create highly specific policies for the 'media' bucket
CREATE POLICY "Public Read Media Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Authenticated Insert Media Bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

CREATE POLICY "Authenticated Update Media Bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

CREATE POLICY "Authenticated Delete Media Bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
