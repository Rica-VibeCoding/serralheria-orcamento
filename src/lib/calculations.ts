
import type { QuoteItem, GenericProduct, Configuration, QuoteTotals } from "@/types"

export function calculateItemStats(
    profileCostPerMeter: number,
    quantity: number,
    metersPerBar: number,
    paint: boolean,
    paintPercentage: number
) {
    const totalMeters = quantity * metersPerBar
    const costMaterial = totalMeters * profileCostPerMeter

    let costPaint = 0
    if (paint) {
        costPaint = costMaterial * (paintPercentage / 100)
    }

    const costMaterialWithPaint = costMaterial + costPaint

    return {
        totalMeters,
        costMaterial,
        costPaint,
        costMaterialWithPaint
    }
}

export function calculateQuoteTotals(
    items: QuoteItem[],
    products: GenericProduct[],
    config: Configuration,
    markup: number,
    km: number
): QuoteTotals {
    // PASSO 1: Custo de PRODUTOS (material SEM pintura + genéricos) - SEM markup
    // IMPORTANTE: Pintura é considerada SERVIÇO, não produto!
    const total_material_sem_pintura = items.reduce((acc, item) => acc + item.custo_material_item, 0)
    const custo_produtos_genericos = products.reduce((acc, prod) => acc + prod.total, 0)
    const custo_total_produtos = total_material_sem_pintura + custo_produtos_genericos

    // PASSO 2: Custo de SERVIÇOS (cortes + soldas + transporte + PINTURA)
    let total_cuts = 0
    let total_welds = 0
    let custo_pintura_total = 0

    items.forEach(item => {
        // 1 corte e 1 solda automáticos por barra
        const automatic_cuts = item.quantidade
        const automatic_welds = item.quantidade

        total_cuts += automatic_cuts + (item.cortes_extras || 0)
        total_welds += automatic_welds + (item.soldas_extras || 0)

        // Pintura é SERVIÇO
        if (item.pintura) {
            custo_pintura_total += item.custo_pintura
        }
    })

    const custo_cortes = total_cuts * config.valor_por_corte
    const custo_soldas = total_welds * config.valor_por_solda
    const custo_transporte = km * config.valor_por_km
    const custo_total_servicos = custo_cortes + custo_soldas + custo_transporte + custo_pintura_total

    // PASSO 3: Markup RESERVADO (aplicado APENAS sobre produtos, NÃO sobre serviços)
    const markup_reservado = custo_total_produtos * (markup - 1)

    // PASSO 4: Valor de Venda = custo_produtos + custo_serviços + markup_reservado
    const valor_final = custo_total_produtos + custo_total_servicos + markup_reservado

    // PASSO 5: Lucro = markup_reservado (ou valor_final - custos totais)
    const custo_total_sem_markup = custo_total_produtos + custo_total_servicos
    const lucro_absoluto = valor_final - custo_total_sem_markup // = markup_reservado
    const lucro_percentual = custo_total_sem_markup > 0
        ? (lucro_absoluto / custo_total_sem_markup) * 100
        : 0

    // Para compatibilidade com a interface existente
    const total_material = total_material_sem_pintura + custo_pintura_total // Material COM pintura (para salvar no banco)
    const subtotal_pos_markup = total_material_sem_pintura * markup // Material SEM pintura com markup
    const produtos_com_markup = custo_produtos_genericos * markup // Produtos com markup

    return {
        total_material,
        subtotal_pos_markup,
        custo_cortes,
        custo_soldas,
        custo_transporte,
        custo_produtos_genericos,
        produtos_com_markup,
        valor_final,
        lucro_absoluto,
        lucro_percentual
    }
}

export function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
