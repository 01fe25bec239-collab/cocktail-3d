-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cocktails_updated_at ON cocktails;
CREATE TRIGGER update_cocktails_updated_at
    BEFORE UPDATE ON cocktails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Composite index
CREATE INDEX IF NOT EXISTS idx_cocktails_published_order ON cocktails (is_published, order_index);

-- JSONB array constraint
ALTER TABLE cocktails ADD CONSTRAINT ingredients_is_array CHECK (jsonb_typeof(ingredients) = 'array');
