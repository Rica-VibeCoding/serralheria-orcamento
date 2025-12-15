
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

        // Fetch quotes with client data
        const { data: quotesData, error: quotesError } = await supabase
            .from('so_quotes')
            .select('*')
            .eq('user_id', user!.id)
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
        q.id.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { label: 'Rascunho', variant: 'secondary' as const, color: 'text-gray-700' },
            sent: { label: 'Enviado', variant: 'default' as const, color: 'text-blue-700' },
            approved: { label: 'Aprovado', variant: 'default' as const, color: 'text-green-700' },
            rejected: { label: 'Rejeitado', variant: 'destructive' as const, color: 'text-red-700' }
        }
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    }

    const handleStatusChange = async (quoteId: string, newStatus: string) => {
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
        <div className="space-y-6 pb-20">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">Histórico de Orçamentos</h2>
                <p className="text-sm text-muted-foreground">Visualize e gerencie seus orçamentos salvos.</p>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente ou ID..."
                        className="pl-8"
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
                <div className="space-y-3">
                    {filteredQuotes.map((quote) => {
                        const statusBadge = getStatusBadge(quote.status)
                        const date = new Date(quote.created_at)

                        return (
                            <Card key={quote.id} className="hover:bg-accent/30 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{quote.client_name}</span>
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
                                                <SelectItem value="draft">Rascunho</SelectItem>
                                                <SelectItem value="sent">Enviado</SelectItem>
                                                <SelectItem value="approved">Aprovado</SelectItem>
                                                <SelectItem value="rejected">Rejeitado</SelectItem>
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
