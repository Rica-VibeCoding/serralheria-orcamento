-- ============================================================================
-- Migration: RLS Policies - Best Practices for Multi-Tenant Isolation
-- ============================================================================
-- Date: 2025-12-15
-- Description: Implements Row Level Security policies following Supabase
--              official best practices for secure multi-user data isolation.
--
-- Key Principles:
-- 1. Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
-- 2. Use WITH CHECK for INSERT operations (critical for 400 errors)
-- 3. Use both USING and WITH CHECK for UPDATE operations
-- 4. Explicit auth.uid() checks for user isolation
-- 5. Optimized subqueries to avoid expensive joins
-- ============================================================================

-- Clean up existing policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON so_profiles_metalon;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON so_profiles_metalon;
DROP POLICY IF EXISTS "Users can update their own profiles" ON so_profiles_metalon;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON so_profiles_metalon;

DROP POLICY IF EXISTS "Users can view their own clients" ON so_clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON so_clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON so_clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON so_clients;

DROP POLICY IF EXISTS "Users can view their own configs" ON so_configurations;
DROP POLICY IF EXISTS "Users can insert their own configs" ON so_configurations;
DROP POLICY IF EXISTS "Users can update their own configs" ON so_configurations;
DROP POLICY IF EXISTS "Users can delete their own configs" ON so_configurations;

DROP POLICY IF EXISTS "Users can view their own markups" ON so_markups;
DROP POLICY IF EXISTS "Users can insert their own markups" ON so_markups;
DROP POLICY IF EXISTS "Users can update their own markups" ON so_markups;
DROP POLICY IF EXISTS "Users can delete their own markups" ON so_markups;

DROP POLICY IF EXISTS "Users can view their own quotes" ON so_quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON so_quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON so_quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON so_quotes;

DROP POLICY IF EXISTS "Users can view their own quote items" ON so_quote_items;
DROP POLICY IF EXISTS "Users can insert their own quote items" ON so_quote_items;
DROP POLICY IF EXISTS "Users can update their own quote items" ON so_quote_items;
DROP POLICY IF EXISTS "Users can delete their own quote items" ON so_quote_items;

DROP POLICY IF EXISTS "Users can view their own generic products" ON so_quote_generic_products;
DROP POLICY IF EXISTS "Users can insert their own generic products" ON so_quote_generic_products;
DROP POLICY IF EXISTS "Users can update their own generic products" ON so_quote_generic_products;
DROP POLICY IF EXISTS "Users can delete their own generic products" ON so_quote_generic_products;

-- ============================================================================
-- TABLE: so_profiles_metalon
-- Description: Material profiles (e.g., "2x2", "3x3" metalon tubes)
-- Isolation: user_id column
-- ============================================================================

CREATE POLICY "Users can view their own profiles"
  ON so_profiles_metalon
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own profiles"
  ON so_profiles_metalon
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own profiles"
  ON so_profiles_metalon
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON so_profiles_metalon
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TABLE: so_clients
-- Description: Customer database
-- Isolation: user_id column
-- ============================================================================

CREATE POLICY "Users can view their own clients"
  ON so_clients
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own clients"
  ON so_clients
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own clients"
  ON so_clients
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own clients"
  ON so_clients
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TABLE: so_configurations
-- Description: User settings (singleton per user via unique constraint)
-- Isolation: user_id column
-- ============================================================================

CREATE POLICY "Users can view their own configs"
  ON so_configurations
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own configs"
  ON so_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own configs"
  ON so_configurations
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own configs"
  ON so_configurations
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TABLE: so_markups
-- Description: Saved markup/profit margin options
-- Isolation: user_id column
-- ============================================================================

CREATE POLICY "Users can view their own markups"
  ON so_markups
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own markups"
  ON so_markups
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own markups"
  ON so_markups
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own markups"
  ON so_markups
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TABLE: so_quotes
-- Description: Quote headers with calculated totals snapshot
-- Isolation: user_id column
-- CRITICAL: This is the main entity - must have WITH CHECK for INSERT
-- ============================================================================

CREATE POLICY "Users can view their own quotes"
  ON so_quotes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- CRITICAL FIX: WITH CHECK clause prevents 400 Bad Request on INSERT
CREATE POLICY "Users can insert their own quotes"
  ON so_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own quotes"
  ON so_quotes
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON so_quotes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TABLE: so_quote_items
-- Description: Metalon bars in quote
-- Isolation: Via parent so_quotes.user_id (optimized with IN clause)
-- Performance: Uses IN subquery instead of JOIN for better performance
-- ============================================================================

CREATE POLICY "Users can view their own quote items"
  ON so_quote_items
  FOR SELECT
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert their own quote items"
  ON so_quote_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update their own quote items"
  ON so_quote_items
  FOR UPDATE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete their own quote items"
  ON so_quote_items
  FOR DELETE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- TABLE: so_quote_generic_products
-- Description: Generic products in quote (locks, plates, etc.)
-- Isolation: Via parent so_quotes.user_id (optimized with IN clause)
-- Performance: Uses IN subquery instead of JOIN for better performance
-- ============================================================================

CREATE POLICY "Users can view their own generic products"
  ON so_quote_generic_products
  FOR SELECT
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert their own generic products"
  ON so_quote_generic_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update their own generic products"
  ON so_quote_generic_products
  FOR UPDATE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete their own generic products"
  ON so_quote_generic_products
  FOR DELETE
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- Description: Optimize RLS policy execution
-- ============================================================================

-- Index on user_id columns for faster policy checks
CREATE INDEX IF NOT EXISTS idx_profiles_metalon_user_id ON so_profiles_metalon(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON so_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_configurations_user_id ON so_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_markups_user_id ON so_markups(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON so_quotes(user_id);

-- Index on quote_id for child tables (critical for IN subquery performance)
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON so_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_generic_products_quote_id ON so_quote_generic_products(quote_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after migration to verify RLS is working:
--
-- 1. Check all policies are created:
--    SELECT schemaname, tablename, policyname, cmd, qual, with_check
--    FROM pg_policies
--    WHERE schemaname = 'public' AND tablename LIKE 'so_%'
--    ORDER BY tablename, cmd;
--
-- 2. Verify RLS is enabled on all tables:
--    SELECT tablename, rowsecurity
--    FROM pg_tables
--    WHERE schemaname = 'public' AND tablename LIKE 'so_%';
--
-- 3. Test insert as authenticated user:
--    INSERT INTO so_quotes (user_id, client_id, pontuacao_aplicada, valor_final)
--    VALUES (auth.uid(), 'some-client-id', 2.0, 100.00);
-- ============================================================================
