# Serralheria Orçamento 🛠️

**App mobile-first (iPhone)** para geração rápida de orçamentos de estruturas em metalon via WhatsApp.

> Interface otimizada especificamente para uso em iPhone em campo. Layout vertical, botões touch-friendly (48px+) e navegação inferior para fácil acesso com uma mão.

## 🚀 Tecnologias

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript 5
- **UI:** Tailwind CSS 4 + shadcn/ui
- **Banco de Dados/Auth:** Supabase (RLS)

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

O projeto utiliza o Supabase com **Row Level Security (RLS)** para isolamento multi-usuário. Todas as tabelas possuem o prefixo `so_` para evitar conflitos no esquema `public`.

### Tabelas Principais:

- `so_configurations`: Configurações globais do usuário (custo corte, solda, km).
- `so_clients`: Cadastro de clientes.
- `so_profiles_metalon`: Perfis de material cadastrados (ex: 30x20 #18).
- `so_markups`: Opções de margem de lucro (ex: 2.0x).
- `so_quotes`: Cabeçalho dos orçamentos.
- `so_quote_items`: Itens do orçamento (barras).
- `so_quote_generic_products`: Produtos avulsos (fechaduras, chapas, etc).

### Configuração do Banco de Dados

**Primeira instalação:**
```bash
# Execute o schema completo no SQL Editor do Supabase Dashboard
# Arquivo: supabase/schema.sql
```

**Se já tiver dados e precisar atualizar as políticas RLS:**
```bash
# Execute a migração no SQL Editor do Supabase Dashboard
# Arquivo: supabase/migrations/001_rls_policies_best_practices.sql
```

### Segurança RLS (Row Level Security)

O projeto implementa **isolamento completo multi-usuário** através de políticas RLS:

- ✅ Cada usuário vê apenas seus próprios dados
- ✅ Políticas separadas por operação (SELECT, INSERT, UPDATE, DELETE)
- ✅ Validação com `WITH CHECK` para prevenir erros 400
- ✅ Otimizado com índices para performance
- ✅ Compatível com múltiplos usuários simultâneos

**Política de Segurança:** Todos os dados são filtrados por `user_id = auth.uid()`, garantindo que usuários não possam acessar dados de outros usuários, mesmo com acesso direto ao banco.

## 📱 Funcionalidades

- **Login Simples**: Autenticação via email/senha (Supabase Auth)
- **Configurações Únicas**: Defina custos base (corte, solda, km, % pintura) uma vez
- **Criação de Orçamento Rápido**:
  - Adicione barras de metalon (cálculo automático de cortes e soldas)
  - Adicione produtos extras (fechaduras, chapas, etc)
  - Defina KM de entrega
  - Selecione margem de lucro (Markup customizável)
  - Cálculo em tempo real do lucro
- **Exportação WhatsApp**: Texto formatado pronto para copiar e colar
- **Edição de Orçamentos**: Reabra e edite orçamentos salvos
- **Gestão de Clientes**: Cadastro simples com nome e telefone

## 🎨 Design Mobile-First

A interface foi projetada especificamente para iPhone:
- **Layout vertical**: Máximo de largura `max-w-md` (448px)
- **Navegação inferior**: Barra fixa no rodapé para acesso com polegar
- **Botões grandes**: Mínimo 48px de altura (touch targets WCAG AA)
- **Sem scroll horizontal**: Tudo adaptado para tela estreita
- **Otimizado para 3G/4G**: Carregamento paralelo de dados

## 📦 Scripts

- `npm run dev`: Inicia servidor de desenvolvimento.
- `npm run build`: Build de produção.
- `npm run lint`: Verificação de código.
