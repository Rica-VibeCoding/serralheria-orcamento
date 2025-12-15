
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
    // 1. Total Material (Metalon) - Já inclui pintura se selecionado
    const total_material = items.reduce((acc, item) => acc + item.total_item, 0)

    // 2. Pontuação (Markup)
    // PRD: "pintura entra na base que recebe markup"
    const subtotal_pos_markup = total_material * markup

    // 3. Cortes e Soldas
    let total_cuts = 0
    let total_welds = 0

    items.forEach(item => {
        // 1 corte e 1 solda automáticos por barra
        const automatic_cuts = item.quantidade
        const automatic_welds = item.quantidade

        total_cuts += automatic_cuts + (item.cortes_extras || 0)
        total_welds += automatic_welds + (item.soldas_extras || 0)
    })

    const custo_cortes = total_cuts * config.valor_por_corte
    const custo_soldas = total_welds * config.valor_por_solda

    // 4. Transporte
    const custo_transporte = km * config.valor_por_km

    // 5. Produtos Genéricos
    const custo_produtos_genericos = products.reduce((acc, prod) => acc + prod.total, 0)

    // 6. Valor Final
    const valor_final =
        subtotal_pos_markup +
        custo_cortes +
        custo_soldas +
        custo_transporte +
        custo_produtos_genericos

    // 7. Lucro
    const custo_total_sem_markup =
        total_material +
        custo_cortes +
        custo_soldas +
        custo_transporte +
        custo_produtos_genericos

    const lucro_absoluto = valor_final - custo_total_sem_markup
    const lucro_percentual = custo_total_sem_markup > 0
        ? (lucro_absoluto / custo_total_sem_markup) * 100
        : 0

    return {
        total_material,
        subtotal_pos_markup,
        custo_cortes,
        custo_soldas,
        custo_transporte,
        custo_produtos_genericos,
        valor_final,
        lucro_absoluto,
        lucro_percentual
    }
}

export function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
