-- Allow authenticated users to view all cocktails (including drafts)
CREATE POLICY "Authenticated users can read all cocktails" 
ON cocktails 
FOR SELECT 
TO authenticated 
USING (true);
