# Configuração Claude MCP

Este diretório contém as configurações do Model Context Protocol (MCP) para o projeto.

## MCPs Configurados

### 1. **Supabase MCP**
- Acesso direto ao banco de dados
- Consultas SQL, RLS policies, migrações
- **Requer:** `SUPABASE_SERVICE_ROLE_KEY` no ambiente

### 2. **Context7**
- Documentação atualizada de Next.js 16, React 19, Supabase
- **Requer:** `CONTEXT7_API_KEY` no ambiente

### 3. **shadcn/ui**
- Componentes e documentação shadcn/ui
- Sem configuração adicional necessária

### 4. **Filesystem**
- Acesso ao código-fonte do projeto
- Pré-configurado para este diretório

### 5. **GitHub**
- Gestão de repositório, issues, PRs
- **Requer:** `GITHUB_TOKEN` no ambiente

## Variáveis de Ambiente

Adicione ao seu `~/.bashrc` ou `~/.zshrc`:

```bash
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
export CONTEXT7_API_KEY="sua-context7-key"
export GITHUB_TOKEN="seu-github-token"
```

## Uso

Os MCPs são carregados automaticamente pelo Claude Code quando este arquivo estiver presente.

**Verificar status:**
```bash
# No Claude Code
/mcp status
```

## Stack do Projeto

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Supabase (Auth + Database)
- Tailwind CSS 4
- shadcn/ui + Radix UI
- Zod (validação)
