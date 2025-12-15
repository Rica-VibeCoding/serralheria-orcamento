# PRD — App de Orçamentos para Serralheiro (MVP)

**Produto:** Web app mobile-first (focado em iPhone) para gerar orçamentos rápidos de estruturas em metalon.
**Stack confirmado:** Next.js + TypeScript (Vercel), Supabase (DB/Auth), shadcn/ui, GitHub, n8n (automação futura).
**Objetivo do documento:** especificar o escopo, regras de negócio, requisitos funcionais e não funcionais para que a equipe de produto/desenvolvimento execute o MVP.

---

# 1. Visão geral & Objetivos

* Permitir que um serralheiro calcule e envie orçamentos rápidos via WhatsApp (texto copiable).
* Foco inicial em estruturas feitas com *barras de metalon*, com regras automáticas: **1 corte + 1 solda por barra**.
* Suportar pintura por item, pontuação (markup) por orçamento, custos de corte/solda/transporte, e inclusão de produtos genéricos (ex: chapa MDF).
* UI simples, botões grandes, fluxo rápido (usado no carro/obra).

---

# 2. Usuários / Personas

* **Serralheiro autônomo (Rica)** — usa app no iPhone, pouca paciência para campos complexos, precisa enviar orçamento no WhatsApp.
* **Assistente / ajudante** — pode cadastrar clientes, itens e gerar orçamentos.

---

# 3. Escopo do MVP (o que entra)

* Login básico com Supabase (opcional no MVP inicial — porém DB preparado).
* 3 telas principais: **Configurações**, **Clientes**, **Orçamento**.
* Cadastro de perfis de metalon com custo R$/m e espessura.
* Configuração: custo por corte, custo por solda, valor por km, percentual de pintura, lista de pontuações (markup).
* Orçamento: adicionar barras (perfil + qtd + metragem por barra + pintura yes/no), produtos genéricos (descrição, qtd, valor unitário), km rodado (manual), seleção de pontuação por orçamento.
* Cálculo automático: 1 corte e 1 solda por barra por default; possibilidade de adicionar cortes/soldas extras por item.
* Geração de texto formatado para WhatsApp e botão “Copiar”.
* Salvamento de orçamentos (histórico).
* Arredondamento: 2 casas decimais (R$).

---

# 4. Regras de Negócio (formais)

Para cada item do tipo **barra**:

* `metros_item = quantidade_barras * metragem_por_barra`
* `custo_material_item = metros_item * custo_por_metro_do_perfil`

Se `pintura = true`:

* `custo_pintura_item = custo_material_item * (percentual_pintura / 100)`
* `custo_material_com_pintura_item = custo_material_item + custo_pintura_item`
  Senão:
* `custo_material_com_pintura_item = custo_material_item`

Total material (somatório de itens metalon):

* `total_material = Σ custo_material_com_pintura_item`

Aplicar **pontuação (markup)** escolhida no orçamento:

* `subtotal_pos_markup = total_material * pontuacao`

Cálculo de cortes e soldas:

* `cuts_automaticos = Σ quantidade_barras` (1 corte por barra)
* `welds_automaticos = Σ quantidade_barras` (1 solda por barra)
* `cuts_totais = cuts_automaticos + cortes_extras_inseridos`
* `welds_totais = welds_automaticos + soldas_extras_inseridas`

Custos operacionais:

* `custo_cortes = cuts_totais * valor_por_corte`
* `custo_soldas = welds_totais * valor_por_solda`
* `custo_transporte = km_rodado * valor_por_km`

Produtos genéricos:

* `custo_produtos_genericos = Σ (qtd * valor_unitario)`

Valor final:

* `valor_final = subtotal_pos_markup + custo_cortes + custo_soldas + custo_transporte + custo_produtos_genericos`

Lucro (visão ao usuário):

* `custo_total_sem_markup = total_material + custo_cortes + custo_soldas + custo_transporte + custo_produtos_genericos`
* `lucro_absoluto = valor_final - custo_total_sem_markup`
* `lucro_percentual = lucro_absoluto / custo_total_sem_markup * 100`

Regras adicionais:

* Pintura **não** compõe a base para aplicar pontuação? (definimos aplicar pintura **antes** da pontuação, ou seja pintura entra na base que recebe markup — confirmado).
* Todos campos monetários arredondar para 2 casas.

---

# 5. UX / Telas (descrição funcional)

Usar design **mobile-first**. Botões grandes; textos curtos.

## Tela A — Configurações

Componentes:

* Lista de perfis de metalon (cada item: nome/perfil, espessura, custo R$/m, botão editar/remover)
* Campos: Valor por corte (R$), Valor por solda (R$), Valor por km (R$/km)
* Percentual de pintura padrão (ex: 15%)
* Lista de pontuações (ex: 1.0, 1.8, 2.0, 3.0) com opção de adicionar/remover
* Validade padrão do orçamento (dias)
  Ações: salvar configurações

## Tela B — Clientes

* Lista simples com search
* Botão “+ Novo Cliente” (nome, telefone – para WhatsApp)
* Selecionar cliente e ir para Orçamento

## Tela C — Orçamento

Topo:

* Cliente (select) + botão de novo cliente
* Campo pontuação (select) com exibição de “Lucro estimado em R$” dinâmico
* Campo km rodado (manual)
* Validade do orçamento (opcional)

Corpo:

* Botão “+ Adicionar Barra” → modal

  * Seleciona perfil (dropdown)
  * Quantidade (int)
  * Metragem por barra (m)
  * Checkbox: “Pintar esta barra?”
  * Mostrar estimativas: metros totais, custo material, cortes/soldas automáticos
  * Botões: adicionar / cancelar
* Botão “+ Produto Genérico” → modal

  * Descrição
  * Quantidade
  * Valor unitário
  * Adicionar

Resumo/rodapé:

* Quebra de custos (material, pintura, corte, solda, transporte, produtos genéricos)
* Subtotal material
* Aplicar pontuação (exibir subtotal pós-markup)
* Valor final, lucro absoluto e percentual
* Botões: “Pré-visualizar texto” e “Copiar para WhatsApp”

Modal “Pré-visualizar texto”:

* Mostra o texto formatado pronto
* Botão “Copiar” e “Fechar”

---

# 6. Exemplo — cálculo prático

Itens:

* Metalon 2x2 — custo R$ 20,00 / m — 6 barras — 6 m cada — pintar = sim
* Valor por corte R$ 10,00
* Valor por solda R$ 15,00
* Valor por km R$ 3,00 — km rodado = 12
* Pontuação selecionada: 2.0

Cálculos:

* metros_item = 6 * 6 = 36 m
* custo_material_item = 36 * 20 = R$ 720,00
* pintura (ex: 15%) = 720 * 0.15 = R$ 108,00
* custo_material_com_pintura = 828,00
* subtotal material = 828,00
* subtotal_pos_markup = 828 * 2.0 = 1.656,00
* cortes automáticos = 6 → custo_cortes = 6 * 10 = 60
* soldas automáticas = 6 → custo_soldas = 6 * 15 = 90
* transporte = 12 * 3 = 36
* valor_final = 1.656 + 60 + 90 + 36 = R$ 1.842,00

Lucro:

* custo_total_sem_markup = 828 + 60 + 90 + 36 = 1.014
* lucro_absoluto = 1.842 − 1.014 = 828
* lucro_percentual ≈ 81.7%

---

# 7. Template de texto para WhatsApp (formato final)

```
ORÇAMENTO — Estrutura Metalon

Cliente: {{cliente_nome}}
Itens:
{{#each itens}}
- {{perfil}} — {{qtd}} barras x {{m_per_barra}}m = {{metros}}m
  Pintura: {{Sim/Não}}
  Custo material: R$ {{custo_material_item}}
{{/each}}

Subtotal material (c/ pintura): R$ {{total_material}}
Pontuação aplicada: x{{pontuacao}} → R$ {{subtotal_pos_markup}}

Cortes: {{cuts_totais}} x R$ {{valor_por_corte}} = R$ {{custo_cortes}}
Soldas: {{welds_totais}} x R$ {{valor_por_solda}} = R$ {{custo_soldas}}
Transporte: {{km}} km x R$ {{valor_por_km}} = R$ {{custo_transporte}}
Produtos/Outros: R$ {{custo_produtos_genericos}}

VALOR FINAL: R$ {{valor_final}}

Lucro estimado: R$ {{lucro_absoluto}} ({{lucro_percentual}}%)

Validade: {{validez}} dias
Prazo: a combinar

Obs: {{observacoes}}
```

Botão “Copiar” cola exatamente como texto para enviar no WhatsApp.

---

# 8. Modelo de dados (tabelas sugeridas — Supabase/Postgres)

**so_users** (nota: geralmente usa-se auth.users do Supabase, mas se estender: so_profiles)

* id (uuid), name, email, created_at

**so_clients**

* id, user_id, name, phone, created_at

**so_profiles_metalon** (materiais)

* id, user_id, nome (eg "2x2"), espessura, custo_por_metro (numeric), created_at

**so_configurations**

* id, user_id, valor_por_corte, valor_por_solda, valor_por_km, percentual_pintura_default, validade_padrao, created_at

**so_markups**

* id, user_id, label, value (numeric, ex 1.8)

**so_quotes** (orçamentos)

* id, user_id, client_id, pontuacao_id, km_rodado, validade_dias, observacoes, total_material, subtotal_pos_markup, custo_cortes, custo_soldas, custo_transporte, produtos_genericos, valor_final, lucro_absoluto, lucro_percentual, created_at

**so_quote_items**

* id, quote_id, type (metal|generic), profile_id (nullable), descricao (for generic), quantidade, metros_por_unidade (nullable), pintar (bool), custo_material_item, cortes_extras, soldas_extras

**so_quote_generic_products**

* id, quote_id, descricao, quantidade, valor_unitario

Índices: otimizar por user_id, client_id

---

# 9. Endpoints / API (Next.js / Supabase patterns)

* `GET /api/config` — pega config do user (Supabase)
* `POST /api/config` — atualiza config
* `GET /api/clients` — lista
* `POST /api/clients` — cria cliente
* `GET /api/profiles` — perfis metalon
* `POST /api/profiles` — cria perfil
* `POST /api/quotes` — cria orçamento (grava quote + items)
* `GET /api/quotes/:id` — pega orçamento e itens
* `POST /api/quotes/:id/preview` (opcional) — retorna texto formatado de preview

Observação: usar Supabase client em frontend para operações diretas ou Next.js API routes servidoras conforme segurança desejada.

---

# 10. Requisitos Não-Funcionais

* Mobile-first (iPhone) responsive
* Performance: carregamento inicial <2s em rede móvel (meta)
* Conectividade: permitir salvar rascunhos offline? (fora do MVP)
* Localização: moeda R$, formato pt-BR, datas dd/mm/yyyy
* Segurança: autenticação via Supabase; dados por usuário (multitenant)
* Backup: Supabase backups padrão
* Acessibilidade básica: contraste, tamanhos de botão adequados

---

# 11. Critérios de Aceitação (QA / Testes)

1. **Cálculo correto**: para um conjunto de itens, os valores devem bater com a fórmula oficial (testar casos com/sem pintura, com cortes/soldas extras).
2. **1 corte & 1 solda automáticos** por barra aparecem por default ao adicionar item.
3. **Pintura por item**: quando marcada, o % de pintura é aplicado sobre custo do material do item.
4. **Pontuação aplicada por orçamento**: alterar pontuação atualiza subtotal_pos_markup e lucro em tempo real.
5. **Texto WhatsApp**: botão “Copiar” copia exatamente o texto no formato mostrado; enviar no WhatsApp aparece legível.
6. **Persistência**: orçamentos salvos aparecem no histórico do usuário.
7. **UI mobile**: botões tocáveis, campos visíveis sem zoom no iPhone.
8. **Arredondamento**: todos valores com 2 casas decimais.

---

# 12. Casos de Teste rápidos (exemplos)

* Caso 1: 1 item, 2 barras de 3m, custo 10/m, pintura 10%, pontuação 1.8, km 0 → calcular manualmente e comparar.
* Caso 2: adicionar 2 cortes extras e 1 solda extra, garantir soma correta.
* Caso 3: adicionar produto genérico (MDF 2 unidades x R$ 50) e verificar inclusão.

---

# 13. Itens fora do escopo (MVP)

* Integração automática com mapas para km
* Geração de PDF
* Assinatura digital
* Controle de estoque
* Multi-idioma (apenas pt-BR)
* Workflows de aprovação/assinatura

---

# 14. Observações técnicas & recomendações

* Gerar funções utilitárias isoladas para cálculo (pure functions) e cobrir com testes unitários (Jest/Testing Library).
* Colocar regras de negócio críticas no backend (para evitar manipulação no cliente).
* Usar Supabase row-level security se o app for multi-usuário.
* Componentizar inputs reutilizáveis (profile-select, money-input, item-row).
* Pré-calcular e armazenar no registro do orçamento todos valores (não depender apenas de cálculos on-the-fly) para auditoria.

---

# 15. Entregáveis do PRD (o que eu entreguei aqui)

* Escopo do produto (MVP) validado
* Regras de negócio e fórmulas
* Wireframe funcional das telas
* Modelo de dados e endpoints sugeridos
* Template de texto WhatsApp
* Critérios de aceitação e casos de teste

---

# 16. Próximos passos sugeridos (ação imediata)

1. Confirmação final sua (responda “OK” se estiver de acordo).
2. Gerar **Backlog**: épicos + histórias de usuário (posso gerar agora se quiser).
3. Preparar **Figma / protótipo** de telas (opcional, recomendo antes do dev).
4. Plano de rollout: deploy inicial na Vercel conectado ao Supabase (podemos preparar instruções).

Se você confirmar **“OK”**, eu já gero imediatamente o **backlog com histórias de usuário e critérios de aceitação** (pronto para criar tickets no GitHub). Quer que eu gere o backlog agora?
