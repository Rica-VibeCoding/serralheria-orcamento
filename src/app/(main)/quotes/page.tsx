
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, FileText, Eye } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { useRequireAuth } from "@/lib/hooks/use-auth"
import { formatCurrency } from "@/lib/calculations"
import Link from "next/link"
import { QuoteViewModal } from "@/components/quote/quote-view-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuoteWithClient {
    id: string
    quote_number?: number // Optional until migration is executed
    created_at: string
    client_id: string
    client_name?: string
    valor_final: number
    status: string
    pontuacao_aplicada: number
    lucro_percentual: number
}

export default function QuotesPage() {
    const { user } = useRequireAuth()
    const [quotes, setQuotes] = useState<QuoteWithClient[]>([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        fetchQuotes()
    }, [user])

    async function fetchQuotes() {
        setLoading(true)

        // Fetch quotes with client data (exclude inactive/deleted)
        const { data: quotesData, error: quotesError } = await supabase
            .from('so_quotes')
            .select('*')
            .eq('user_id', user!.id)
            .neq('status', 'inactive') // Exclude soft-deleted quotes
            .order('created_at', { ascending: false })

        if (quotesError) {
            toast.error("Erro ao carregar orçamentos")
            setLoading(false)
            return
        }

        // Fetch clients to join names
        const { data: clientsData } = await supabase
            .from('so_clients')
            .select('id, name')
            .eq('user_id', user!.id)

        // Map client names
        const clientsMap = new Map(clientsData?.map(c => [c.id, c.name]) || [])

        const quotesWithClients = quotesData?.map(q => ({
            ...q,
            client_name: clientsMap.get(q.client_id) || 'Cliente desconhecido'
        })) || []

        setQuotes(quotesWithClients)
        setLoading(false)
    }

    const filteredQuotes = quotes.filter(q =>
        q.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        q.id.toLowerCase().includes(search.toLowerCase()) ||
        (q.quote_number && formatQuoteNumber(q.quote_number).toLowerCase().includes(search.toLowerCase()))
    )

    const formatQuoteNumber = (number?: number) => {
        if (!number && number !== 0) return 'R-####' // Fallback se migration não foi executada
        return `R-${number.toString().padStart(4, '0')}`
    }

    const handleStatusChange = async (quoteId: string, newStatus: string) => {
        // If deleting (inactive), remove from UI immediately
        if (newStatus === 'inactive') {
            const toastId = toast.loading("Excluindo orçamento...")

            const { error } = await supabase
                .from('so_quotes')
                .update({ status: 'inactive' })
                .eq('id', quoteId)
                .eq('user_id', user!.id)

            if (error) {
                toast.error("Erro ao excluir orçamento: " + error.message, { id: toastId })
                return
            }

            toast.success("Orçamento excluído com sucesso!", { id: toastId })

            // Remove from local state (soft delete)
            setQuotes(prev => prev.filter(q => q.id !== quoteId))
            return
        }

        // Normal status update
        const toastId = toast.loading("Atualizando status...")

        const { error } = await supabase
            .from('so_quotes')
            .update({ status: newStatus })
            .eq('id', quoteId)
            .eq('user_id', user!.id)

        if (error) {
            toast.error("Erro ao atualizar status: " + error.message, { id: toastId })
            return
        }

        toast.success("Status atualizado com sucesso!", { id: toastId })

        // Update local state
        setQuotes(prev => prev.map(q =>
            q.id === quoteId ? { ...q, status: newStatus } : q
        ))
    }

    if (!user) return <div className="p-4">Carregando usuário...</div>

    return (
        <div className="space-y-3 pb-20">
            {/* Container com fundo degradê metálico */}
            <div className="bg-gradient-to-br from-slate-200 via-slate-100 to-zinc-200 border border-slate-300/60 rounded-xl p-3 shadow-lg space-y-2">
                {/* Header */}
                <h2 className="text-base font-bold tracking-tight text-slate-700">Histórico de Orçamentos</h2>

                {/* Busca */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente ou ID..."
                        className="pl-8 bg-white/80 border-slate-300 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                    Carregando orçamentos...
                </div>
            ) : (
                <div className="space-y-1">
                    {filteredQuotes.map((quote) => {
                        const date = new Date(quote.created_at)

                        return (
                            <Card key={quote.id} className="relative overflow-hidden bg-white border-slate-200 !py-0">
                                {/* Borda lateral colorida */}
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-400" />

                                <CardContent className="px-3 py-1.5 pl-3.5">
                                    {/* Linha única compacta */}
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Esquerda: Cliente + Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                                <span className="font-semibold text-sm leading-tight truncate">{quote.client_name}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground/60">
                                                    {formatQuoteNumber(quote.quote_number)}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground/60 leading-tight">
                                                {date.toLocaleDateString('pt-BR')} · {quote.pontuacao_aplicada}x
                                            </div>
                                        </div>

                                        {/* Direita: Valor + Ações */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right tabular-nums">
                                                <span className="font-bold text-sm">{formatCurrency(quote.valor_final)}</span>
                                                <span className="text-[10px] text-muted-foreground/50 ml-1">{quote.lucro_percentual.toFixed(0)}%</span>
                                            </div>
                                            <Select
                                                value={quote.status}
                                                onValueChange={(value) => handleStatusChange(quote.id, value)}
                                            >
                                                <SelectTrigger className="w-[90px] h-6 text-[11px] border-slate-200" onClick={(e) => e.stopPropagation()}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Não fechou</SelectItem>
                                                    <SelectItem value="closed">Fechado</SelectItem>
                                                    <SelectItem value="inactive" className="text-destructive">Excluir</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[11px]"
                                                onClick={() => setSelectedQuoteId(quote.id)}
                                            >
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                            <Link href={`/quote?edit=${quote.id}`}>
                                                <Button variant="default" size="sm" className="h-6 px-2 text-[11px]">
                                                    Editar
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {filteredQuotes.length === 0 && !loading && (
                        <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Nenhum orçamento encontrado</p>
                            <p className="text-sm mt-1">Crie seu primeiro orçamento na aba "Orçamento"</p>
                        </div>
                    )}
                </div>
            )}

            {selectedQuoteId && (
                <QuoteViewModal
                    quoteId={selectedQuoteId}
                    open={!!selectedQuoteId}
                    onOpenChange={(open) => !open && setSelectedQuoteId(null)}
                />
            )}
        </div>
    )
}
