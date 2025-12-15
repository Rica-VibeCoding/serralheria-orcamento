# Migrations - Serralheria Pro

Este diretório contém as migrações SQL do banco de dados Supabase.

## Como aplicar migrations

### Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Copie o conteúdo do arquivo de migration
4. Cole no editor e clique em **Run**

### Ordem de execução

Execute as migrations na ordem numérica:

1. ✅ `001_rls_policies_best_practices.sql` - Políticas RLS otimizadas
2. **🆕 `002_quote_number_and_status_update.sql`** - Numeração + Status atualizados

## Migration 002: Quote Number + Status

**O que faz:**
- ✅ Adiciona numeração sequencial automática (R-0001, R-0002, etc.)
- ✅ Atualiza status para: `open` (Não fechou), `closed` (Fechado), `inactive` (Excluído)
- ✅ Popula números para orçamentos existentes
- ✅ Cria índices para performance

**Impacto:**
- Orçamentos existentes receberão números sequenciais
- Status antigos serão migrados:
  - `draft` → `open`
  - `sent` → `open`
  - `approved` → `closed`
  - `rejected` → `inactive`

**Reversível:** Não (após execução, não há rollback automático)

## Verificando se migration foi aplicada

Execute no SQL Editor:

```sql
-- Verificar se coluna quote_number existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'so_quotes'
AND column_name = 'quote_number';

-- Verificar últimos números usados
SELECT quote_number, status, created_at
FROM so_quotes
ORDER BY quote_number DESC
LIMIT 5;
```

## Troubleshooting

### Erro: "column quote_number already exists"
A migration já foi aplicada. Ignore o erro.

### Erro: "sequence already exists"
A migration já foi aplicada parcialmente. Você pode continuar ou pular.

### Status ainda aparecem antigos na UI
1. Limpe o cache do navegador
2. Verifique se a migration foi executada com sucesso
3. Reinicie o servidor Next.js (`npm run dev`)
