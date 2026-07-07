-- Server-side validation. The admin form validates on the client, but a
-- compromised session or a service-role script could still write a malformed
-- row that breaks the public menu (e.g. a non-string ingredient name crashing
-- `.toLowerCase()`). These CHECK constraints enforce the shape the UI assumes.
-- All existing rows already satisfy them.

ALTER TABLE cocktails
  ADD CONSTRAINT cocktails_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE cocktails
  ADD CONSTRAINT cocktails_abv_range
  CHECK (abv IS NULL OR (abv >= 0 AND abv <= 100));

ALTER TABLE cocktails
  ADD CONSTRAINT cocktails_hex_colors
  CHECK (
    theme_color_primary   ~ '^#[0-9A-Fa-f]{6}$' AND
    theme_color_secondary ~ '^#[0-9A-Fa-f]{6}$' AND
    liquid_color          ~ '^#[0-9A-Fa-f]{6}$'
  );

-- Every ingredient must be an object with string `name` and `amount`.
-- CHECK can't contain a subquery, so validate via an IMMUTABLE helper.
CREATE OR REPLACE FUNCTION ingredients_are_valid(ings jsonb)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT jsonb_typeof(ings) = 'array' AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(ings) AS e
    WHERE jsonb_typeof(e) <> 'object'
       OR jsonb_typeof(e -> 'name')   <> 'string'
       OR jsonb_typeof(e -> 'amount') <> 'string'
  );
$$;

ALTER TABLE cocktails
  ADD CONSTRAINT cocktails_ingredients_shape
  CHECK (ingredients_are_valid(ingredients));
