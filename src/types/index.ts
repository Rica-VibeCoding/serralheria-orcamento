
export interface MetalonProfile {
    id: string
    user_id: string
    nome: string
    espessura: string | null
    custo_por_metro: number
    created_at?: string
}

export interface Client {
    id: string
    user_id: string
    name: string
    phone: string | null
    created_at?: string
}

export interface Configuration {
    id: string
    user_id: string
    valor_por_corte: number
    valor_por_solda: number
    valor_por_km: number
    percentual_pintura_default: number
    validade_padrao: number
    created_at?: string
}

export interface Markup {
    id: string
    user_id: string
    label: string
    value: number
    created_at?: string
}

export interface QuoteItem {
    id: string
    type: 'metalon'
    profile_id: string
    profile_nome: string
    quantidade: number
    metros_por_barra: number
    pintura: boolean
    custo_por_metro: number
    custo_material_item: number
    cortes_extras: number
    soldas_extras: number
    // Computed for display
    metros_totais: number
    custo_pintura: number
    total_item: number
}

export interface GenericProduct {
    id: string
    type: 'generic'
    descricao: string
    quantidade: number
    valor_unitario: number
    total: number
}

export interface QuoteState {
    client_id: string
    pontuacao: number
    km_rodado: number
    observacoes: string
    items: QuoteItem[]
    products: GenericProduct[]
}

export interface QuoteTotals {
    total_material: number
    subtotal_pos_markup: number
    custo_cortes: number
    custo_soldas: number
    custo_transporte: number
    custo_produtos_genericos: number // Custo sem markup
    produtos_com_markup: number // Valor com markup
    valor_final: number
    lucro_absoluto: number
    lucro_percentual: number
}

export interface Quote {
    id: string
    user_id: string
    client_id: string
    pontuacao_aplicada: number
    km_rodado: number
    validade_dias: number
    observacoes: string | null
    total_material: number
    subtotal_pos_markup: number
    custo_cortes: number
    custo_soldas: number
    custo_transporte: number
    custo_produtos_genericos: number
    valor_final: number
    lucro_absoluto: number
    lucro_percentual: number
    status: 'draft' | 'sent' | 'approved' | 'rejected'
    created_at: string
    client?: Client
}
