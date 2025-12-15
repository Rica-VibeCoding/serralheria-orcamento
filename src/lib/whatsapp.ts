
import type { QuoteItem, GenericProduct, QuoteTotals, Client } from "@/types"
import { formatCurrency } from "./calculations"

export function generateWhatsAppText(
    client: Client | undefined,
    items: QuoteItem[],
    products: GenericProduct[],
    totals: QuoteTotals,
    pontuacao: number,
    km: number,
    validade: number,
    observacoes: string
): string {
    const clientName = client?.name || "Cliente não informado"
    const separator = "────────────────────"

    // Build MATERIAL section (metalon bars) - SEM MARKUP (custo puro)
    // NOVA REGRA: Markup é aplicado no total, não por item
    let materialLines = ""
    items.forEach(item => {
        // Mostrar apenas custo material SEM pintura (pintura vai para serviços)
        materialLines += `• ${item.quantidade} barra${item.quantidade > 1 ? 's' : ''} ${item.profile_nome} – ${item.metros_por_barra}m: ${formatCurrency(item.custo_material_item)}\n`
    })

    // Add generic products to material section - SEM MARKUP (custo puro)
    products.forEach(prod => {
        materialLines += `• ${prod.descricao} (${prod.quantidade} un.): ${formatCurrency(prod.total)}\n`
    })

    // Build SERVIÇOS section
    // Calculate cuts/welds totals
    let total_cuts = 0
    let total_welds = 0
    items.forEach(item => {
        total_cuts += item.quantidade + (item.cortes_extras || 0)
        total_welds += item.quantidade + (item.soldas_extras || 0)
    })

    // Calculate total paint cost - SEM MARKUP (pintura é serviço)
    let total_pintura = 0
    items.forEach(item => {
        if (item.pintura) {
            total_pintura += item.custo_pintura || 0
        }
    })

    let servicosLines = ""
    if (total_cuts > 0) {
        servicosLines += `• Cortes (${total_cuts} un.): ${formatCurrency(totals.custo_cortes)}\n`
    }
    if (total_welds > 0) {
        servicosLines += `• Soldas (${total_welds} un.): ${formatCurrency(totals.custo_soldas)}\n`
    }
    if (km > 0) {
        servicosLines += `• Transporte (${km} km): ${formatCurrency(totals.custo_transporte)}\n`
    }
    if (total_pintura > 0) {
        servicosLines += `• Pintura: Inclusa 🎨 ${formatCurrency(total_pintura)}\n`
    }

    // Build final text
    let text = `🔧 *RONI SERRALHERIA*

👤 Cliente: ${clientName}

${separator}`

    // Add MATERIAL section if has items
    if (materialLines) {
        text += `\n📦 *MATERIAL*\n${materialLines}`
    }

    // Add SERVIÇOS section if has services
    if (servicosLines) {
        text += `\n${separator}\n🛠️ *SERVIÇOS*\n${servicosLines}`
    }

    // VALOR FINAL
    text += `\n${separator}\n\n👉🏼 *VALOR FINAL ${formatCurrency(totals.valor_final)}*\n`

    // Footer info
    text += `\n${separator}\n📅 Validade do orçamento: ${validade} dias\n⏳ Prazo de execução: a combinar\n💳 Forma de pagamento: a combinar`

    // Add observations if provided
    if (observacoes && observacoes.trim()) {
        text += `\n\nℹ️ ${observacoes.trim()}`
    } else {
        text += `\n\nℹ️ Valor já inclui o serviço de instalação.`
    }

    return text
}
