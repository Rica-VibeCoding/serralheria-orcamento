
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Eye, Calendar, DollarSign } from "lucide-react"
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

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            open: { label: 'Não fechou', variant: 'secondary' as const, color: 'text-gray-700' },
            closed: { label: 'Fechado', variant: 'default' as const, color: 'text-green-700' }
        }
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.open
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
        <div className="space-y-4 pb-20">
            {/* Container com fundo degradê metálico */}
            <div className="bg-gradient-to-br from-slate-200 via-slate-100 to-zinc-200 border border-slate-300/60 rounded-xl p-4 shadow-lg space-y-4">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-700">Histórico de Orçamentos</h2>
                    <p className="text-sm text-slate-500">Visualize e gerencie seus orçamentos salvos.</p>
                </div>

                {/* Busca */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente ou ID..."
                            className="pl-8 bg-white/80 border-slate-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                    Carregando orçamentos...
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredQuotes.map((quote) => {
                        const statusBadge = getStatusBadge(quote.status)
                        const date = new Date(quote.created_at)

                        return (
                            <Card key={quote.id} className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-all">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{quote.client_name}</span>
                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                    {formatQuoteNumber(quote.quote_number)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {date.toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" />
                                                    Markup: {quote.pontuacao_aplicada}x
                                                </span>
                                            </div>
                                        </div>
                                        <Select
                                            value={quote.status}
                                            onValueChange={(value) => handleStatusChange(quote.id, value)}
                                        >
                                            <SelectTrigger className="w-[130px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Não fechou</SelectItem>
                                                <SelectItem value="closed">Fechado</SelectItem>
                                                <SelectItem value="inactive" className="text-destructive">Excluir</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-2xl font-bold text-primary">
                                                {formatCurrency(quote.valor_final)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Lucro: {quote.lucro_percentual.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedQuoteId(quote.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" /> Ver
                                            </Button>
                                            <Link href={`/quote?edit=${quote.id}`}>
                                                <Button variant="default" size="sm">
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
