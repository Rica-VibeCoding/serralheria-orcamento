
-- Tabela de Perfis de Metalon (Materiais)
create table so_profiles_metalon (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  nome text not null, -- ex: "2x2", "3x3"
  espessura text, -- ex: "#18", "1.2mm"
  custo_por_metro numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Clientes
create table so_clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  phone text, -- formato livre ou validado no front
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Configurações do Usuário (Singleton por usuário - enforce via app logic or unique constraint)
create table so_configurations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  valor_por_corte numeric default 0,
  valor_por_solda numeric default 0,
  valor_por_km numeric default 0,
  percentual_pintura_default numeric default 15, -- ex: 15 para 15%
  validade_padrao int default 15, -- dias
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Markups (Pontuações) salvos para reuso
create table so_markups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  label text not null, -- ex: "Padrão", "Amigo", "Complexo"
  value numeric not null, -- ex: 2.0, 1.8
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Orçamentos (Quotes)
create table so_quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references so_clients(id),
  
  -- Snapshots dos valores usados no momento do cálculo (para histórico imutável)
  pontuacao_aplicada numeric not null default 1, 
  km_rodado numeric default 0,
  validade_dias int default 15,
  observacoes text,
  
  -- Valores calculados (totais)
  total_material numeric default 0, -- soma dos materiais com pintura
  subtotal_pos_markup numeric default 0, -- material * markup
  custo_cortes numeric default 0,
  custo_soldas numeric default 0,
  custo_transporte numeric default 0,
  custo_produtos_genericos numeric default 0,
  
  valor_final numeric default 0, -- SOMA TUDO
  lucro_absoluto numeric default 0,
  lucro_percentual numeric default 0,
  
  status text default 'draft', -- draft, sent, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Itens do Orçamento (Barras de Metalon)
create table so_quote_items (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid references so_quotes(id) on delete cascade not null,
  profile_id uuid references so_profiles_metalon(id), -- pode ser null se o perfil for deletado? Melhor manter snapshot se possível, mas aqui linkamos.
  profile_snapshot_nome text, -- snapshot do nome caso apague
  
  quantidade int not null default 1,
  metros_por_barra numeric not null default 6,
  pintura boolean default false,
  
  custo_material_item numeric default 0, -- (qtd * m * custo_metro) [+ pintura se tiver]
  cortes_extras int default 0, -- além do 1 por barra
  soldas_extras int default 0, -- além da 1 por barra
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Produtos Genéricos no Orçamento (Chapas, Fechaduras, etc)
create table so_quote_generic_products (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid references so_quotes(id) on delete cascade not null,
  descricao text not null,
  quantidade int default 1,
  valor_unitario numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- RLS (Row Level Security) - Multi-Tenant Data Isolation
-- ============================================================================
-- Best Practices Applied:
-- 1. Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
-- 2. WITH CHECK clause for INSERT (prevents 400 Bad Request errors)
-- 3. Both USING and WITH CHECK for UPDATE (validates before and after)
-- 4. Optimized IN subqueries for child tables (better than EXISTS/JOIN)
-- 5. Explicit (select auth.uid()) for better compatibility
-- ============================================================================

alter table so_profiles_metalon enable row level security;
alter table so_clients enable row level security;
alter table so_configurations enable row level security;
alter table so_markups enable row level security;
alter table so_quotes enable row level security;
alter table so_quote_items enable row level security;
alter table so_quote_generic_products enable row level security;

-- so_profiles_metalon policies
create policy "Users can view their own profiles" on so_profiles_metalon
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own profiles" on so_profiles_metalon
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own profiles" on so_profiles_metalon
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own profiles" on so_profiles_metalon
  for delete to authenticated using ((select auth.uid()) = user_id);

-- so_clients policies
create policy "Users can view their own clients" on so_clients
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own clients" on so_clients
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own clients" on so_clients
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own clients" on so_clients
  for delete to authenticated using ((select auth.uid()) = user_id);

-- so_configurations policies
create policy "Users can view their own configs" on so_configurations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own configs" on so_configurations
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own configs" on so_configurations
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own configs" on so_configurations
  for delete to authenticated using ((select auth.uid()) = user_id);

-- so_markups policies
create policy "Users can view their own markups" on so_markups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own markups" on so_markups
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own markups" on so_markups
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own markups" on so_markups
  for delete to authenticated using ((select auth.uid()) = user_id);

-- so_quotes policies (CRITICAL: WITH CHECK prevents 400 Bad Request on INSERT)
create policy "Users can view their own quotes" on so_quotes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own quotes" on so_quotes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own quotes" on so_quotes
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own quotes" on so_quotes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- so_quote_items policies (optimized with IN for better performance)
create policy "Users can view their own quote items" on so_quote_items
  for select to authenticated using (
    quote_id in (select id from so_quotes where user_id = (select auth.uid()))
  );
create policy "Users can insert their own quote items" on so_quote_items
  for insert to authenticated with check (
    quote_id in (select id from so_quotes where user_id = (select auth.uid()))
  );
create policy "Users can update their own quote items" on so_quote_items
  for update to authenticated
  using (quote_id in (select id from so_quotes where user_id = (select auth.uid())))
  with check (quote_id in (select id from so_quotes where user_id = (select auth.uid())));
create policy "Users can delete their own quote items" on so_quote_items
  for delete to authenticated using (
    quote_id in (select id from so_quotes where user_id = (select auth.uid()))
  );

-- so_quote_generic_products policies (optimized with IN for better performance)
create policy "Users can view their own generic products" on so_quote_generic_products
  for select to authenticated using (
    quote_id in (select id from so_quotes where user_id = (select auth.uid()))
  );
create policy "Users can insert their own generic products" on so_quote_generic_products
  for insert to authenticated with check (
    quote_id in (select id from so_quotes where user_id = (select auth.uid()))
  );
create policy "Users can update their own generic products" on so_quote_generic_products
  for update to authenticated
  using (quote_id in (select id from so_quotes where user_id = (select auth.uid())))
  with check (quote_id in (select id from so_quotes where user_id = (select auth.uid())));
create policy "Users can delete their own generic products" on so_quote_generic_products
  for delete to authenticated using (
    quote_id in (select id from so_quotes where user_id = (select auth.uid()))
  );

-- ============================================================================
-- Performance Indexes
-- ============================================================================
-- Optimize RLS policy execution with indexes on frequently checked columns

create index if not exists idx_profiles_metalon_user_id on so_profiles_metalon(user_id);
create index if not exists idx_clients_user_id on so_clients(user_id);
create index if not exists idx_configurations_user_id on so_configurations(user_id);
create index if not exists idx_markups_user_id on so_markups(user_id);
create index if not exists idx_quotes_user_id on so_quotes(user_id);
create index if not exists idx_quote_items_quote_id on so_quote_items(quote_id);
create index if not exists idx_generic_products_quote_id on so_quote_generic_products(quote_id);
