-- Restrict write access on cocktails and the media bucket to an explicit admin
-- allowlist. Previously every policy was `TO authenticated`, so anyone who
-- obtained an account (e.g. via open email signup, which is Supabase's default)
-- had full write access to the catalog and storage.
--
-- ⚠️ BEFORE APPLYING, register your admin account or the admin panel loses write access:
--
--   INSERT INTO admin_users (user_id)
--   SELECT id FROM auth.users WHERE email = 'your-admin@email.here';
--
-- Also disable public signups: Dashboard → Authentication → Sign In / Providers
-- → turn off "Allow new users to sign up" (defense in depth; with this migration
-- applied, new signups no longer gain write access either way).

CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE
);

-- RLS on with no policies: only the service role touches this table directly.
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER so the membership check works even though admin_users
-- itself is not readable by the authenticated role.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ── cocktails: writes and draft reads become admin-only ──

DROP POLICY IF EXISTS "Allow authenticated read for all cocktails" ON cocktails;
DROP POLICY IF EXISTS "Allow authenticated insert" ON cocktails;
DROP POLICY IF EXISTS "Allow authenticated update" ON cocktails;
DROP POLICY IF EXISTS "Allow authenticated delete" ON cocktails;

CREATE POLICY "Admins can read all cocktails"
ON cocktails FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can insert cocktails"
ON cocktails FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update cocktails"
ON cocktails FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete cocktails"
ON cocktails FOR DELETE
TO authenticated
USING (is_admin());

-- ── storage.objects: media bucket writes become admin-only ──

DROP POLICY IF EXISTS "Authenticated Insert Media Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Media Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Media Bucket" ON storage.objects;

CREATE POLICY "Admin Insert Media Bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND is_admin());

CREATE POLICY "Admin Update Media Bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND is_admin())
WITH CHECK (bucket_id = 'media' AND is_admin());

CREATE POLICY "Admin Delete Media Bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND is_admin());
