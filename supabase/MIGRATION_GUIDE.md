# Guia de Migração - RLS Policies Best Practices

## 🎯 Objetivo

Atualizar as políticas RLS (Row Level Security) do seu banco de dados Supabase para seguir as melhores práticas oficiais e corrigir o erro **400 Bad Request** ao salvar orçamentos.

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard do seu projeto
- Backup dos dados (recomendado)
- Permissões de administrador no projeto Supabase

## 🚀 Aplicando a Migração

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acesse o SQL Editor:**
   - Entre no [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto
   - Vá em **SQL Editor** no menu lateral

2. **Execute a migração:**
   - Clique em **New Query**
   - Cole o conteúdo completo do arquivo:
     ```
     supabase/migrations/001_rls_policies_best_practices.sql
     ```
   - Clique em **Run** (ou pressione `Ctrl+Enter`)

3. **Verifique o resultado:**
   - Você deve ver a mensagem "Success. No rows returned"
   - Verifique se não há erros em vermelho

### Opção 2: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db execute --file supabase/migrations/001_rls_policies_best_practices.sql
```

## ✅ Verificação Pós-Migração

Execute estas queries no SQL Editor para confirmar que tudo está correto:

### 1. Verificar políticas criadas

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN cmd = 'INSERT' AND with_check IS NOT NULL THEN '✅'
    WHEN cmd = 'UPDATE' AND qual IS NOT NULL AND with_check IS NOT NULL THEN '✅'
    WHEN cmd IN ('SELECT', 'DELETE') AND qual IS NOT NULL THEN '✅'
    ELSE '❌'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'so_%'
ORDER BY tablename, cmd;
```

**Resultado esperado:** Todas as linhas devem ter status ✅

### 2. Verificar RLS habilitado

```sql
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'so_%'
ORDER BY tablename;
```

**Resultado esperado:** Todas as tabelas devem estar com RLS Enabled

### 3. Verificar índices criados

```sql
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'so_%'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Resultado esperado:** Você deve ver os índices:
- `idx_profiles_metalon_user_id`
- `idx_clients_user_id`
- `idx_configurations_user_id`
- `idx_markups_user_id`
- `idx_quotes_user_id`
- `idx_quote_items_quote_id`
- `idx_generic_products_quote_id`

## 🧪 Teste Funcional

Após a migração, teste o sistema:

1. **Login:** Faça login na aplicação
2. **Criar orçamento:**
   - Adicione um cliente
   - Adicione itens ao orçamento
   - Clique em **Salvar**
   - ✅ Deve salvar com sucesso (sem erro 400)

3. **Verificar isolamento:**
   - Crie um segundo usuário no sistema
   - Faça login com o segundo usuário
   - Verifique que ele NÃO vê os orçamentos do primeiro usuário

## 🔍 O Que Foi Corrigido?

### Antes (Problema):
```sql
-- Política genérica que causava erro 400 no INSERT
create policy "Users can crud their own quotes"
  on so_quotes for all
  using (auth.uid() = user_id);
```

### Depois (Solução):
```sql
-- Políticas separadas com WITH CHECK para INSERT
create policy "Users can view their own quotes"
  on so_quotes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own quotes"   -- 🔑 WITH CHECK previne erro 400
  on so_quotes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own quotes"
  on so_quotes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own quotes"
  on so_quotes for delete to authenticated
  using ((select auth.uid()) = user_id);
```

## 📊 Melhorias de Performance

A migração também adiciona índices para otimizar as verificações RLS:

| Índice | Tabela | Coluna | Benefício |
|--------|--------|--------|-----------|
| `idx_quotes_user_id` | `so_quotes` | `user_id` | Filtro rápido por usuário |
| `idx_quote_items_quote_id` | `so_quote_items` | `quote_id` | JOIN rápido com quotes |
| `idx_generic_products_quote_id` | `so_quote_generic_products` | `quote_id` | JOIN rápido com quotes |

**Impacto esperado:** Queries RLS 2-5x mais rápidas em bancos com muitos registros.

## 🆘 Troubleshooting

### Erro: "policy already exists"
Se você já executou a migração parcialmente:
```sql
-- Execute este comando antes de rodar a migração novamente
DROP POLICY IF EXISTS "Users can view their own quotes" ON so_quotes;
-- ... repita para todas as políticas
```

### Erro 400 ainda persiste
1. Confirme que as políticas foram criadas:
   ```sql
   SELECT count(*) FROM pg_policies
   WHERE schemaname = 'public' AND cmd = 'INSERT';
   ```
   Deve retornar **7** (uma para cada tabela)

2. Verifique se o `user_id` está sendo enviado:
   - Abra o Developer Tools no navegador
   - Vá na aba Network
   - Tente salvar um orçamento
   - Verifique o payload do POST request
   - Deve conter `user_id: "uuid-do-usuario"`

3. Confirme que `auth.uid()` retorna valor:
   ```sql
   SELECT auth.uid(); -- Deve retornar seu UUID quando logado
   ```

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Arquivo de migração: `supabase/migrations/001_rls_policies_best_practices.sql`
- Schema completo: `supabase/schema.sql`

## ✨ Próximos Passos

Após aplicar a migração com sucesso:
1. ✅ Teste criar, editar e deletar orçamentos
2. ✅ Teste com múltiplos usuários (isolamento)
3. ✅ Monitore performance no dashboard do Supabase
4. 📝 Faça commit das mudanças no Git:
   ```bash
   git add supabase/
   git commit -m "feat: Implement RLS best practices with WITH CHECK policies"
   ```
