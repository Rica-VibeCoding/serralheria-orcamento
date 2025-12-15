# Serralheria Orçamento 🛠️

App mobile-first para geração rápida de orçamentos de estruturas em metalon via WhatsApp.

## 🚀 Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + shadcn/ui
- **Banco de Dados/Auth:** Supabase

## 🛠️ Configuração Inicial

1. **Clone o repositório**
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_projeto
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
   ```

## 🗄️ Banco de Dados (Supabase)

O projeto utiliza o Supabase com Row Level Security (RLS). Todas as tabelas do projeto possuem o prefixo `so_` para evitar conflitos no esquema `public`.

### Tabelas Principais:

- `so_configurations`: Configurações globais do usuário (custo corte, solda, km).
- `so_clients`: Cadastro de clientes.
- `so_profiles_metalon`: Perfis de material cadastrados (ex: 30x20 #18).
- `so_markups`: Opções de margem de lucro (ex: 2.0x).
- `so_quotes`: Cabeçalho dos orçamentos.
- `so_quote_items`: Itens do orçamento (barras).
- `so_quote_generic_products`: Produtos avulsos (fechaduras, chapas, etc).

## 📱 Funcionalidades

- **Login Simples**: Autenticação via email/senha.
- **Configurações**: Defina seus custos bases uma única vez.
- **Orçamento Rápido**:
  - Adicione barras (cálculo automático de cortes e soldas).
  - Adicione produtos extras.
  - Defina KM de entrega.
  - Selecione a margem de lucro (Markup).
- **Exportação**: Gera texto formatado pronto para enviar e "colar" no WhatsApp.

## 📦 Scripts

- `npm run dev`: Inicia servidor de desenvolvimento.
- `npm run build`: Build de produção.
- `npm run lint`: Verificação de código.
