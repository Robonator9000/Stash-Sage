-- Allow users to optionally make products visible to others

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_products BOOLEAN DEFAULT FALSE;

-- Drop the old fully-private select policy
DROP POLICY IF EXISTS "products_select_own" ON products;

-- New policies: own products always visible, plus public products visible to all authenticated users
CREATE POLICY "products_select_own" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = products.user_id
      AND profiles.public_products = true
    )
  );
