
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

-- RLS (Row Level Security) - Básico: Usuário só vê seus dados
alter table so_profiles_metalon enable row level security;
alter table so_clients enable row level security;
alter table so_configurations enable row level security;
alter table so_markups enable row level security;
alter table so_quotes enable row level security;
alter table so_quote_items enable row level security;
alter table so_quote_generic_products enable row level security;

create policy "Users can crud their own profiles" on so_profiles_metalon for all using (auth.uid() = user_id);
create policy "Users can crud their own clients" on so_clients for all using (auth.uid() = user_id);
create policy "Users can crud their own configs" on so_configurations for all using (auth.uid() = user_id);
create policy "Users can crud their own markups" on so_markups for all using (auth.uid() = user_id);
create policy "Users can crud their own quotes" on so_quotes for all using (auth.uid() = user_id);
create policy "Users can crud their own quote items" on so_quote_items for all using (quote_id in (select id from so_quotes where user_id = auth.uid()));
create policy "Users can crud their own generic products" on so_quote_generic_products for all using (quote_id in (select id from so_quotes where user_id = auth.uid()));
