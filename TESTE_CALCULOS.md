# Validacao de Calculos - Sistema de Orcamentos

## Teste com Dados do Usuario

### Dados de Entrada
```
Material Metalon:
- 10 barras × 6m @ R$ 20/metro = R$ 1.200
- SEM pintura

Produtos Genericos:
- 2x Fechadura @ R$ 150 = R$ 300
- 1x Placa @ R$ 10 = R$ 10
- Total: R$ 310

Servicos:
- Cortes: 10 automaticos × R$ 4,50 = R$ 45
- Soldas: 10 automaticas × R$ 9,00 = R$ 90
- Transporte: 10km × R$ 5,00 = R$ 50
- Pintura: 15% sobre R$ 810 (outro orcamento) = R$ 121,50
- Total: R$ 306,50

Markup: 2.0x (pontuacao)
```

### Calculos Esperados (Regras de Negocio)

**PASSO 1: Custo Total de Produtos (SEM markup)**
```
Material sem pintura: R$ 1.000,00
Produtos genericos:   R$   310,00
────────────────────────────────
Custo Produtos:       R$ 1.310,00
```

**PASSO 2: Custo Total de Servicos (SEM markup)**
```
Cortes:               R$   45,00
Soldas:               R$   90,00
Transporte:           R$   50,00
Pintura:              R$  121,50
────────────────────────────────
Custo Servicos:       R$  306,50
```

**PASSO 3: Subtotal (Custo Total sem markup)**
```
Custo Produtos + Custo Servicos = R$ 1.616,50
```

**PASSO 4: Markup Reservado (aplicado APENAS sobre Produtos)**
```
Markup Reservado = Produtos × (Pontuacao - 1)
                 = R$ 1.310,00 × (2.0 - 1)
                 = R$ 1.310,00
```

**PASSO 5: Valor de Venda Final**
```
Valor Final = Produtos + Servicos + Markup Reservado
            = R$ 1.310,00 + R$ 306,50 + R$ 1.310,00
            = R$ 2.926,50

OU (formula alternativa):
Valor Final = (Produtos × Pontuacao) + Servicos
            = (R$ 1.310,00 × 2.0) + R$ 306,50
            = R$ 2.620,00 + R$ 306,50
            = R$ 2.926,50 ✓
```

**PASSO 6: Lucro Absoluto**
```
Lucro = Valor Final - Subtotal
      = R$ 2.926,50 - R$ 1.616,50
      = R$ 1.310,00
```

**PASSO 7: Lucro Percentual (MARGEM SOBRE VENDA)**
```
Margem % = (Lucro / Valor Final) × 100
         = (R$ 1.310,00 / R$ 2.926,50) × 100
         = 44,77%

IMPORTANTE: NAO é (Lucro / Subtotal) × 100
           = (R$ 1.310,00 / R$ 1.616,50) × 100
           = 81,05% ← ERRADO!
```

## Resumo dos Resultados Esperados

| Metrica | Valor Esperado |
|---------|----------------|
| Custo Produtos | R$ 1.310,00 |
| Custo Servicos | R$ 306,50 |
| Subtotal (Custo Total) | R$ 1.616,50 |
| Markup Reservado | R$ 1.310,00 |
| **Valor Final** | **R$ 2.926,50** |
| Lucro Absoluto | R$ 1.310,00 |
| Margem sobre Venda | 44,77% |

## Correcoes Aplicadas

### 1. calculations.ts (linha 77)
```typescript
// ANTES (ERRADO):
lucro_percentual = (lucro_absoluto / custo_total_sem_markup) * 100

// DEPOIS (CORRETO):
lucro_percentual = (lucro_absoluto / valor_final) * 100
```

### 2. calculations.ts (linhas 83-84)
```typescript
// ANTES (ERRADO - aplicava markup duplicado):
subtotal_pos_markup = total_material_sem_pintura * markup
produtos_com_markup = custo_produtos_genericos * markup

// DEPOIS (CORRETO):
subtotal_pos_markup = custo_total_produtos + markup_reservado
produtos_com_markup = custo_produtos_genericos
```

### 3. whatsapp.ts (linhas 22, 28, 45)
```typescript
// ANTES (ERRADO - aplicava markup por item):
valorComMarkup = item.total_item * pontuacao
valorComMarkup = prod.total * pontuacao
total_pintura += (item.custo_pintura || 0) * pontuacao

// DEPOIS (CORRETO - mostra custo puro, markup no total):
materialLines += formatCurrency(item.custo_material_item)
materialLines += formatCurrency(prod.total)
total_pintura += item.custo_pintura || 0
```

## Status: ✓ CORRIGIDO

Todas as formulas agora seguem as regras de negocio definidas pelo usuario.
