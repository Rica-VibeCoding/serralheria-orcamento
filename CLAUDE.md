# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Serralheria Pro** - Mobile-first (iPhone-optimized) quote generation system for metalworking (serralheria) with automatic cost calculations and WhatsApp integration.

**Target User:** Solo metalworker using iPhone on-site to create quotes quickly.

**CRITICAL DESIGN CONSTRAINT:** All UI must be optimized for iPhone vertical layout. Every component, button, and interaction should prioritize one-handed mobile use with touch targets ≥ 48px.

**Tech Stack:**
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Supabase (Database + Authentication with RLS)
- Tailwind CSS 4 + shadcn/ui components
- Zod for validation

## Development Commands

```bash
# Development server
npm run dev

# Production build (includes TypeScript check)
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

**Important:** Always run `npm run build` before committing to ensure TypeScript compilation passes.

## Business Logic Architecture

### Core Calculation Flow (CRITICAL)

The quote calculation follows this exact sequence (defined in `src/lib/calculations.ts`):

1. **Per Item (Metalon bar):**
   - `metros_totais = quantidade × metros_por_barra`
   - `custo_material = metros_totais × custo_por_metro`
   - If `pintura = true`: `custo_pintura = custo_material × (percentual_pintura / 100)`
   - `total_item = custo_material + custo_pintura`

2. **Totals (Quote-level) - FLUXO CORRETO:**

   **PASSO 1 - Custo de PRODUTOS (sem markup):**
   - `total_material = Σ total_item` (material metalon com pintura)
   - `custo_produtos_genericos = Σ (quantidade × valor_unitario)` (produtos genéricos)
   - `custo_total_produtos = total_material + custo_produtos_genericos`

   **PASSO 2 - Custo de SERVIÇOS:**
   - **Automatic cuts/welds:** 1 cut + 1 weld per bar (can add extras per item)
   - `custo_cortes = total_cuts × valor_por_corte`
   - `custo_soldas = total_welds × valor_por_solda`
   - `custo_transporte = km_rodado × valor_por_km`
   - `custo_total_servicos = custo_cortes + custo_soldas + custo_transporte`

   **PASSO 3 - Markup RESERVADO (aplicado APENAS sobre produtos):**
   - `markup_reservado = custo_total_produtos × (pontuacao - 1)`

   **PASSO 4 - Valor de Venda:**
   - `valor_final = custo_total_produtos + custo_total_servicos + markup_reservado`

   **PASSO 5 - Lucro:**
   - `lucro_absoluto = markup_reservado` (ou `valor_final - (custo_total_produtos + custo_total_servicos)`)
   - `lucro_percentual = (lucro_absoluto / (custo_total_produtos + custo_total_servicos)) × 100`

**CRITICAL:**
- Markup é aplicado APENAS sobre produtos (material + genéricos), NÃO sobre serviços
- Lucro = Markup reservado (diferença entre preço de venda e custos totais)
- Paint cost is included in `total_material` BEFORE markup is applied

### Database Schema

All tables use `so_` prefix and have Row Level Security (RLS) enabled with `user_id` filtering.

**Core tables:**
- `so_configurations` - User settings (singleton per user_id via unique constraint)
- `so_clients` - Customer database
- `so_profiles_metalon` - Material profiles (e.g., "2x2", "3x3" metalon)
- `so_markups` - Saved markup options (e.g., 2.0x, 1.8x)
- `so_quotes` - Quote headers with calculated totals snapshot
- `so_quote_items` - Metalon bars in quote
- `so_quote_generic_products` - Generic products (locks, plates, etc.)

**Important:** Quotes store calculated values as snapshots for immutable history. Don't recalculate from items when displaying saved quotes.

### Row Level Security (RLS) - Best Practices Implementation

The project implements **production-grade RLS policies** following Supabase official best practices:

**Key Principles Applied:**
1. **Separate policies per operation**: Each operation (SELECT, INSERT, UPDATE, DELETE) has its own policy
2. **WITH CHECK for INSERT**: Critical to prevent 400 Bad Request errors on insert operations
3. **USING + WITH CHECK for UPDATE**: Validates both existing row and updated row
4. **Optimized subqueries**: Uses `IN` instead of `EXISTS/JOIN` for better performance
5. **Explicit auth.uid()**: Uses `(select auth.uid())` for maximum compatibility

**Policy Pattern Example:**
```sql
-- SELECT: Who can view the data
CREATE POLICY "Users can view their own quotes"
  ON so_quotes FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- INSERT: What data can be inserted (WITH CHECK is mandatory!)
CREATE POLICY "Users can insert their own quotes"
  ON so_quotes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: What can be updated (both USING and WITH CHECK)
CREATE POLICY "Users can update their own quotes"
  ON so_quotes FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)      -- Check current row
  WITH CHECK ((select auth.uid()) = user_id); -- Check updated row

-- DELETE: What can be deleted
CREATE POLICY "Users can delete their own quotes"
  ON so_quotes FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
```

**Child Table Pattern (Optimized):**
For tables without direct `user_id` (like `so_quote_items`), we use optimized IN subqueries:
```sql
-- Better performance than EXISTS or JOIN
CREATE POLICY "Users can view their own quote items"
  ON so_quote_items FOR SELECT TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM so_quotes WHERE user_id = (SELECT auth.uid())
    )
  );
```

**Performance Indexes:**
All RLS-checked columns have indexes for optimal query performance:
- `idx_quotes_user_id` on `so_quotes(user_id)`
- `idx_quote_items_quote_id` on `so_quote_items(quote_id)`
- And more... (see `supabase/schema.sql`)

**Migration Files:**
- `supabase/schema.sql` - Complete schema with RLS policies (use for fresh install)
- `supabase/migrations/001_rls_policies_best_practices.sql` - Migration to update existing DB

## Code Organization

```
src/
├── app/
│   ├── (auth)/login/         # Authentication page
│   ├── (main)/               # Protected routes with shared layout
│   │   ├── quote/            # Main quote generation page
│   │   ├── clients/          # Client management
│   │   └── config/           # Settings & profiles
│   ├── layout.tsx            # Root layout with fonts
│   └── page.tsx              # Homepage (redirects to /quote)
│
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── forms/                # Client/config/profile forms
│   ├── quote/                # Quote-specific modals
│   └── main-nav.tsx          # Bottom navigation bar
│
├── lib/
│   ├── calculations.ts       # CORE: Quote calculation logic
│   ├── whatsapp.ts           # WhatsApp text generation
│   ├── validations.ts        # Zod schemas for validation
│   ├── supabase/client.ts    # Supabase singleton client
│   └── hooks/use-auth.ts     # Authentication hook
│
└── types/
    └── index.ts              # Shared TypeScript interfaces
```

## Key Architectural Decisions

### 1. Client-Side State Management
Currently uses React `useState` in main pages. Quote state (`items`, `products`, `config`) is maintained locally until save.

**When modifying quote page:**
- All calculations happen in real-time via `useMemo` on `totals`
- Changes to `items`, `products`, `markupValue`, or `km` trigger recalculation
- Save operation creates immutable snapshot in database

### 2. Supabase Integration
- **Client-side queries** for data fetching (protected by RLS)
- **Parallel fetching** via `Promise.all()` to avoid waterfalls (see `quote/page.tsx:48-73`)
- **No middleware** for auth yet (TODO: implement server-side auth check)

### 3. Performance Optimizations Applied
- `useCallback` on all handlers to prevent re-renders
- `Promise.all()` for parallel data fetching (-1500ms latency)
- Font loading with `display: 'swap'` (-800ms LCP)
- Memoized calculations via `useMemo`

## Validation Strategy

Zod schemas defined in `src/lib/validations.ts`:
- `ClientSchema` - Client name/phone validation
- `ProfileSchema` - Metalon profile validation
- `ConfigurationSchema` - Settings with numeric bounds
- `QuoteItemSchema` - Item validation (quantity, meters, extras)
- `GenericProductSchema` - Generic product validation

**TODO:** Apply Zod validation in forms before Supabase insert operations.

## WhatsApp Integration

Text generation in `src/lib/whatsapp.ts` formats quote as copyable message:
- Bold formatting with `*text*`
- Item breakdown with costs
- Final value prominently displayed
- Includes profit calculation for user reference (not shown to client)

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Security:** Client uses anon key with RLS protection. Service role key should only be used server-side (not yet implemented).

## Known Limitations & TODOs

1. **No server-side auth middleware** - Auth check happens client-side only
2. **No Server Components** - All pages are Client Components (performance opportunity)
3. **No Server Actions** - Mutations use client-side Supabase calls
4. **Validation** - Zod schemas created but not fully integrated in forms
5. ~~**RLS Policies**~~ - ✅ **FIXED:** Now using granular policies with proper WITH CHECK clauses

## Troubleshooting & Migrations Applied

### Error 400 on Quote Save (RESOLVED)

**Problem:** Saving quotes returned 400 Bad Request error.

**Root Cause:** Multiple issues with database schema vs. application code:
1. RLS not enabled on tables
2. Missing fields: `pontuacao_aplicada`, `status` in `so_quotes`
3. Column name mismatches in `so_quote_items`

**Migrations Applied via MCP:**
```sql
-- 1. Enable RLS and create policies (2025-12-15)
-- Migration: enable_rls_and_create_policies_serralheria
-- Result: 28 policies created (4 per table × 7 tables)

-- 2. Add missing fields to so_quotes (2025-12-15)
-- Migration: add_missing_fields_to_so_quotes
ALTER TABLE so_quotes ADD COLUMN pontuacao_aplicada numeric NOT NULL DEFAULT 1;
ALTER TABLE so_quotes ADD COLUMN status text DEFAULT 'draft';

-- 3. Fix column names in so_quote_items (2025-12-15)
-- Migration: fix_so_quote_items_column_names
ALTER TABLE so_quote_items RENAME COLUMN metros_por_unidade TO metros_por_barra;
ALTER TABLE so_quote_items RENAME COLUMN pintar TO pintura;
ALTER TABLE so_quote_items ADD COLUMN profile_snapshot_nome text;
```

**Verification:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'so_%';

-- Count policies (should be 28)
SELECT COUNT(*) FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'so_%';
```

**Status:** ✅ Resolved - Quotes save successfully with full RLS isolation

## Mobile-First iPhone Design Principles

**CRITICAL:** This app is designed EXCLUSIVELY for iPhone mobile use. All design decisions must prioritize mobile UX.

### Layout Constraints
- **Width:** Locked to `max-w-md` (448px) - NEVER exceed this
- **Height:** Optimize for iPhone screen heights (667px - 926px)
- **Scroll:** Vertical only - NO horizontal scroll ever
- **Safe zones:** Account for iPhone notch and bottom bar

### Touch Targets
- **Minimum size:** 48px × 48px (WCAG AA requirement)
- **Preferred size:** 48-56px height for primary actions
- **Spacing:** Minimum 8px gap between interactive elements
- **Icons:** 20-24px (h-5 w-5 to h-6 w-6) for visibility

### Navigation
- **Bottom navigation bar:** Fixed to bottom for thumb access
- **Primary actions:** Within thumb zone (bottom 2/3 of screen)
- **Modals:** Full-screen on mobile, centered dialogs acceptable

### Content Density
- **Text:** Prefer concise labels (remove redundant "Adicionar", "Selecionar", etc when icon is present)
- **Cards:** Use vertical stacking, generous padding (p-4)
- **Forms:** Single column layouts, large inputs

### Performance
- **Network:** Assume 3G/4G connection
- **Loading:** Use `Promise.all()` for parallel data fetching
- **Fonts:** `display: 'swap'` to prevent FOIT
- **Images:** Lazy load, compress, use WebP when possible

### When Making UI Changes
Before implementing ANY UI change, ask:
1. Can this be reached with thumb on iPhone?
2. Is the touch target ≥ 48px?
3. Does this work in portrait mode only?
4. Is the text readable at arm's length?
5. Does this add horizontal scroll? (If yes, STOP)

**Example: Button standardization**
```tsx
// ❌ BAD: Inconsistent sizes, verbose text
<Button className="h-10 text-sm">Adicionar Produto/Outros</Button>

// ✅ GOOD: Consistent height, concise text, large icon
<Button className="h-12 text-base">
  <Plus className="h-5 w-5 mr-2" /> Produtos
</Button>
```

## Testing Strategy

**Current state:** No automated tests

**When adding tests:**
- Unit test calculation functions in `src/lib/calculations.ts` (pure functions)
- Use test cases from `docs/PRD.md` section 12 for validation
- Example: 6 bars × 6m @ R$20/m + 15% paint + 2.0x markup = R$1,842

## Business Rules Reference

See `docs/PRD.md` for complete specification. Key rules:
- 1 automatic cut + 1 automatic weld per bar (extras can be added)
- Paint % applies to material cost BEFORE markup
- Markup multiplies (material + paint) total
- All monetary values use 2 decimal places (BRL)
- Quotes store calculated snapshots (not recalculated on retrieval)
