
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

    let itemLines = ""
    items.forEach(item => {
        itemLines += `- ${item.profile_nome} — ${item.quantidade} barras x ${item.metros_por_barra}m = ${item.metros_totais}m\n`
        itemLines += `  Pintura: ${item.pintura ? "Sim" : "Não"}\n`
        itemLines += `  Custo material: ${formatCurrency(item.total_item)}\n` // Using total_item which is cost + paint
    })

    // Calculations for cuts/welds display
    let total_cuts = 0
    let total_welds = 0
    items.forEach(item => {
        total_cuts += item.quantidade + (item.cortes_extras || 0)
        total_welds += item.quantidade + (item.soldas_extras || 0)
    })

    const prodLines = products.length > 0
        ? products.map(p => `- ${p.descricao} (${p.quantidade}x) = ${formatCurrency(p.total)}`).join("\n")
        : "Nenhum"

    return `*ORÇAMENTO — Estrutura Metalon*

*Cliente:* ${clientName}
*Itens:*
${itemLines}

*Subtotal material (c/ pintura):* ${formatCurrency(totals.total_material)}
*Pontuação aplicada:* x${pontuacao} → ${formatCurrency(totals.subtotal_pos_markup)}

*Cortes:* ${total_cuts} un. = ${formatCurrency(totals.custo_cortes)}
*Soldas:* ${total_welds} un. = ${formatCurrency(totals.custo_soldas)}
*Transporte:* ${km} km = ${formatCurrency(totals.custo_transporte)}
*Produtos/Outros:* ${formatCurrency(totals.custo_produtos_genericos)}
${prodLines !== "Nenhum" ? `\nDetalhe produtos:\n${prodLines}` : ""}

*VALOR FINAL: ${formatCurrency(totals.valor_final)}*

Lucro estimado: ${formatCurrency(totals.lucro_absoluto)} (${totals.lucro_percentual.toFixed(1)}%)

Validade: ${validade} dias
Prazo: a combinar

Obs: ${observacoes}
`
}
