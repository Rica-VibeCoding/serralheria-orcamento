# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Serralheria Pro** - Mobile-first quote generation system for metalworking (serralheria) with automatic cost calculations and WhatsApp integration.

**Target User:** Solo metalworker using iPhone on-site to create quotes quickly.

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

2. **Totals (Quote-level):**
   - `total_material = Σ total_item` (sum of all items with paint already included)
   - `subtotal_pos_markup = total_material × pontuacao` (markup applied to material + paint)
   - **Automatic cuts/welds:** 1 cut + 1 weld per bar (can add extras per item)
   - `custo_cortes = total_cuts × valor_por_corte`
   - `custo_soldas = total_welds × valor_por_solda`
   - `custo_transporte = km_rodado × valor_por_km`
   - `custo_produtos_genericos = Σ (quantidade × valor_unitario)`
   - `valor_final = subtotal_pos_markup + custo_cortes + custo_soldas + custo_transporte + custo_produtos_genericos`

3. **Profit Calculation:**
   - `custo_sem_markup = total_material + custo_cortes + custo_soldas + custo_transporte + custo_produtos_genericos`
   - `lucro_absoluto = valor_final - custo_sem_markup`
   - `lucro_percentual = (lucro_absoluto / custo_sem_markup) × 100`

**CRITICAL:** Paint cost is included in `total_material` BEFORE markup is applied. This is the PRD-defined behavior.

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
5. **RLS Policies** - Using `for all` instead of granular SELECT/INSERT/UPDATE/DELETE

## Mobile-First Considerations

- Layout locked to `max-w-md` for mobile optimization
- Bottom navigation bar (iPhone-friendly)
- Large touch targets on buttons
- No horizontal scroll
- Optimized for 3G/4G networks

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
