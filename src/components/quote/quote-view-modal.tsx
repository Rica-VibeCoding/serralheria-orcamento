
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/calculations"
import { generateWhatsAppText } from "@/lib/whatsapp"
import type { QuoteItem, GenericProduct, Client } from "@/types"

interface QuoteViewModalProps {
    quoteId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface SavedQuote {
    id: string
    client_id: string
    pontuacao_aplicada: number
    km_rodado: number
    validade_dias: number
    observacoes: string
    total_material: number
    subtotal_pos_markup: number
    custo_cortes: number
    custo_soldas: number
    custo_transporte: number
    custo_produtos_genericos: number
    valor_final: number
    lucro_absoluto: number
    lucro_percentual: number
    status: string
    created_at: string
}

interface SavedQuoteItem {
    id: string
    profile_snapshot_nome: string
    quantidade: number
    metros_por_barra: number
    pintura: boolean
    custo_material_item: number
    cortes_extras: number
    soldas_extras: number
}

interface SavedGenericProduct {
    id: string
    descricao: string
    quantidade: number
    valor_unitario: number
}

export function QuoteViewModal({ quoteId, open, onOpenChange }: QuoteViewModalProps) {
    const [loading, setLoading] = useState(true)
    const [quote, setQuote] = useState<SavedQuote | null>(null)
    const [items, setItems] = useState<SavedQuoteItem[]>([])
    const [products, setProducts] = useState<SavedGenericProduct[]>([])
    const [client, setClient] = useState<Client | null>(null)

    useEffect(() => {
        if (!quoteId || !open) return
        fetchQuoteData()
    }, [quoteId, open])

    async function fetchQuoteData() {
        setLoading(true)

        // Fetch quote
        const { data: quoteData, error: quoteError } = await supabase
            .from('so_quotes')
            .select('*')
            .eq('id', quoteId)
            .single()

        if (quoteError || !quoteData) {
            toast.error("Erro ao carregar orçamento")
            setLoading(false)
            return
        }

        setQuote(quoteData)

        // Fetch items
        const { data: itemsData } = await supabase
            .from('so_quote_items')
            .select('*')
            .eq('quote_id', quoteId)

        if (itemsData) setItems(itemsData)

        // Fetch generic products
        const { data: productsData } = await supabase
            .from('so_quote_generic_products')
            .select('*')
            .eq('quote_id', quoteId)

        if (productsData) setProducts(productsData)

        // Fetch client
        const { data: clientData } = await supabase
            .from('so_clients')
            .select('*')
            .eq('id', quoteData.client_id)
            .single()

        if (clientData) setClient(clientData)

        setLoading(false)
    }

    const handleCopyWhatsApp = () => {
        if (!quote || !client) return

        // Convert saved items to QuoteItem format for WhatsApp generation
        const quoteItems: QuoteItem[] = items.map(item => ({
            id: item.id,
            type: 'metalon' as const,
            profile_id: '',
            profile_nome: item.profile_snapshot_nome,
            quantidade: item.quantidade,
            metros_por_barra: item.metros_por_barra,
            pintura: item.pintura,
            custo_por_metro: 0,
            custo_material_item: item.custo_material_item,
            cortes_extras: item.cortes_extras,
            soldas_extras: item.soldas_extras,
            metros_totais: item.quantidade * item.metros_por_barra,
            custo_pintura: 0,
            total_item: item.custo_material_item
        }))

        const genericProducts: GenericProduct[] = products.map(p => ({
            id: p.id,
            type: 'generic' as const,
            descricao: p.descricao,
            quantidade: p.quantidade,
            valor_unitario: p.valor_unitario,
            total: p.quantidade * p.valor_unitario
        }))

        const totals = {
            total_material: quote.total_material,
            subtotal_pos_markup: quote.subtotal_pos_markup,
            custo_cortes: quote.custo_cortes,
            custo_soldas: quote.custo_soldas,
            custo_transporte: quote.custo_transporte,
            custo_produtos_genericos: quote.custo_produtos_genericos,
            produtos_com_markup: quote.custo_produtos_genericos * quote.pontuacao_aplicada,
            valor_final: quote.valor_final,
            lucro_absoluto: quote.lucro_absoluto,
            lucro_percentual: quote.lucro_percentual
        }

        const text = generateWhatsAppText(
            client,
            quoteItems,
            genericProducts,
            totals,
            quote.pontuacao_aplicada,
            quote.km_rodado,
            quote.validade_dias,
            quote.observacoes
        )

        navigator.clipboard.writeText(text)
        toast.success("Orçamento copiado para área de transferência!")
    }

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Carregando orçamento</DialogTitle>
                        <DialogDescription>Aguarde enquanto carregamos os dados...</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!quote || !client) {
        return null
    }

    const date = new Date(quote.created_at)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90%] md:max-w-[600px] max-h-[85vh] p-0 flex flex-col gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle>Orçamento - {client.name}</DialogTitle>
                    <DialogDescription>
                        Criado em {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[calc(85vh-180px)] px-6">
                    <div className="space-y-4 pr-4">
                        {/* Informações do Cliente */}
                        <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-sm font-medium mb-1">Cliente</div>
                            <div className="text-base font-semibold">{client.name}</div>
                            {client.phone && (
                                <div className="text-sm text-muted-foreground">{client.phone}</div>
                            )}
                        </div>

                        {/* Itens de Metalon */}
                        {items.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                                    Barras de Metalon
                                </h4>
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <div key={item.id} className="border-l-2 border-blue-500 pl-3 py-2 bg-muted/20">
                                            <div className="font-medium">{item.profile_snapshot_nome}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {item.quantidade} barras × {item.metros_por_barra}m = {(item.quantidade * item.metros_por_barra).toFixed(1)}m
                                            </div>
                                            {item.pintura && (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 mt-1">
                                                    Com pintura
                                                </span>
                                            )}
                                            <div className="text-sm font-semibold mt-1">
                                                {formatCurrency(item.custo_material_item)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Produtos Genéricos */}
                        {products.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                                    Produtos Genéricos
                                </h4>
                                <div className="space-y-2">
                                    {products.map((product) => (
                                        <div key={product.id} className="border-l-2 border-amber-500 pl-3 py-2 bg-muted/20">
                                            <div className="font-medium">{product.descricao}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {product.quantidade} × {formatCurrency(product.valor_unitario)}
                                            </div>
                                            <div className="text-sm font-semibold mt-1">
                                                {formatCurrency(product.quantidade * product.valor_unitario)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Resumo Financeiro */}
                        <div className="bg-muted/30 p-4 rounded-md space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal Material (c/ pintura):</span>
                                <span className="font-medium">{formatCurrency(quote.total_material)}</span>
                            </div>
                            <div className="flex justify-between text-blue-600">
                                <span>Pós-Markup (×{quote.pontuacao_aplicada}):</span>
                                <span className="font-semibold">{formatCurrency(quote.subtotal_pos_markup)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-muted-foreground">
                                <span>Cortes:</span>
                                <span>{formatCurrency(quote.custo_cortes)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Soldas:</span>
                                <span>{formatCurrency(quote.custo_soldas)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Transporte ({quote.km_rodado}km):</span>
                                <span>{formatCurrency(quote.custo_transporte)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Produtos/Outros:</span>
                                <span>{formatCurrency(quote.custo_produtos_genericos)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center bg-primary/10 p-2 rounded-md">
                                <span className="font-bold text-base">VALOR FINAL</span>
                                <span className="font-bold text-lg">{formatCurrency(quote.valor_final)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span className="font-medium">Lucro:</span>
                                <span className="font-medium">
                                    {formatCurrency(quote.lucro_absoluto)} ({quote.lucro_percentual.toFixed(1)}%)
                                </span>
                            </div>
                        </div>

                        {/* Observações */}
                        {quote.observacoes && (
                            <div className="bg-muted/20 p-3 rounded-md">
                                <div className="text-sm font-medium mb-1">Observações</div>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {quote.observacoes}
                                </div>
                            </div>
                        )}

                        {/* Metadados */}
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div>Validade: {quote.validade_dias} dias</div>
                            <div>Status: {quote.status}</div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="flex gap-2 px-6 py-4 border-t shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        Fechar
                    </Button>
                    <Button onClick={handleCopyWhatsApp} className="flex-1">
                        <Copy className="mr-2 h-4 w-4" /> Copiar WhatsApp
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
