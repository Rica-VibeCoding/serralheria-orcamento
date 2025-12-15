# Changelog - Migrations Applied

Este arquivo documenta todas as migrações aplicadas no banco de dados via MCP Supabase.

---

## 2025-12-15 - Correção do Erro 400 ao Salvar Orçamentos

### Contexto
Ao tentar salvar orçamentos, o sistema retornava **400 Bad Request**. Investigação revelou 3 problemas principais.

### Migrações Aplicadas

#### 1. `enable_rls_and_create_policies_serralheria`
**Problema:** RLS (Row Level Security) estava desabilitado em todas as tabelas `so_*`.

**Solução:** Habilitou RLS e criou 28 políticas granulares seguindo best practices do Supabase.

**Resultado:**
- ✅ 7 tabelas com RLS habilitado
- ✅ 28 políticas criadas (4 por tabela: SELECT, INSERT, UPDATE, DELETE)
- ✅ Isolamento multi-usuário garantido
- ✅ Performance otimizada com 7 índices

**Verificação:**
```sql
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'so_%';
-- Deve retornar: 28
```

---

#### 2. `add_missing_fields_to_so_quotes`
**Problema:** Código frontend enviava campos `pontuacao_aplicada` e `status` que não existiam na tabela.

**Solução:** Adicionou os campos faltantes.

```sql
ALTER TABLE so_quotes ADD COLUMN pontuacao_aplicada numeric NOT NULL DEFAULT 1;
ALTER TABLE so_quotes ADD COLUMN status text DEFAULT 'draft';
```

**Resultado:**
- ✅ Campo `pontuacao_aplicada` armazena snapshot do markup aplicado
- ✅ Campo `status` rastreia estado do orçamento (draft, sent, approved, rejected)

---

#### 3. `fix_so_quote_items_column_names`
**Problema:** Nomes de colunas diferentes entre banco e código frontend.

**Antes:**
- ❌ Banco: `metros_por_unidade` → Código: `metros_por_barra`
- ❌ Banco: `pintar` → Código: `pintura`
- ❌ Faltava: `profile_snapshot_nome`

**Solução:** Renomeou colunas e adicionou campo faltante.

```sql
ALTER TABLE so_quote_items RENAME COLUMN metros_por_unidade TO metros_por_barra;
ALTER TABLE so_quote_items RENAME COLUMN pintar TO pintura;
ALTER TABLE so_quote_items ADD COLUMN profile_snapshot_nome text;
```

**Resultado:**
- ✅ Schema alinhado com código frontend
- ✅ Salvamento de orçamentos funcionando perfeitamente

---

## Status Atual do Banco

### Tabelas com RLS
- ✅ `so_clients` - 4 políticas
- ✅ `so_configurations` - 4 políticas
- ✅ `so_markups` - 4 políticas
- ✅ `so_profiles_metalon` - 4 políticas
- ✅ `so_quotes` - 4 políticas
- ✅ `so_quote_items` - 4 políticas
- ✅ `so_quote_generic_products` - 4 políticas

### Índices de Performance
- `idx_profiles_metalon_user_id`
- `idx_clients_user_id`
- `idx_configurations_user_id`
- `idx_markups_user_id`
- `idx_quotes_user_id`
- `idx_quote_items_quote_id`
- `idx_generic_products_quote_id`

### Campos Adicionados
**`so_quotes`:**
- `pontuacao_aplicada` (numeric, NOT NULL, DEFAULT 1)
- `status` (text, DEFAULT 'draft')

**`so_quote_items`:**
- `profile_snapshot_nome` (text, nullable)

### Campos Renomeados
**`so_quote_items`:**
- `metros_por_unidade` → `metros_por_barra`
- `pintar` → `pintura`

---

## Comandos Úteis

### Verificar RLS
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'so_%';
```

### Verificar Políticas
```sql
SELECT tablename, policyname, cmd, qual IS NOT NULL as has_using, with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'so_%'
ORDER BY tablename, cmd;
```

### Verificar Índices
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'so_%' AND indexname LIKE 'idx_%'
ORDER BY tablename;
```

### Testar Salvamento
```sql
-- Como usuário autenticado, deve funcionar
INSERT INTO so_quotes (user_id, client_id, pontuacao_aplicada, valor_final, status)
VALUES (auth.uid(), 'uuid-cliente', 2.0, 100.00, 'draft');
```

---

## Notas Importantes

1. **Backup:** Sempre faça backup antes de aplicar migrações em produção
2. **RLS:** Nunca desabilite RLS em produção - é crítico para segurança multi-tenant
3. **Índices:** Todos os índices RLS são essenciais para performance
4. **Schema.sql:** O arquivo `supabase/schema.sql` já reflete todas essas mudanças para novas instalações

---

**Última atualização:** 2025-12-15
**Status:** ✅ Sistema funcionando perfeitamente
