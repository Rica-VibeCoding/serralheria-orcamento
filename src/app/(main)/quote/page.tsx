
"use client"

import { useState, useMemo, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, FileText, Copy, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { AddItemModal } from "@/components/quote/add-item-modal"
import { AddProductModal } from "@/components/quote/add-product-modal"
import { calculateQuoteTotals, formatCurrency, calculateItemStats } from "@/lib/calculations"
import { generateWhatsAppText } from "@/lib/whatsapp"
import { supabase } from "@/lib/supabase/client"
import { useRequireAuth } from "@/lib/hooks/use-auth"
import type { Client, MetalonProfile, QuoteItem, GenericProduct, Configuration, Markup } from "@/types"

function QuotePageContent() {
    const { user } = useRequireAuth()
    const searchParams = useSearchParams()
    const editQuoteId = searchParams?.get('edit')

    // Data State
    const [config, setConfig] = useState<Configuration>({
        id: '', user_id: '',
        valor_por_corte: 5, valor_por_solda: 10, valor_por_km: 2.5,
        percentual_pintura_default: 15, validade_padrao: 15
    })
    const [allClients, setAllClients] = useState<Client[]>([])
    const [allProfiles, setAllProfiles] = useState<MetalonProfile[]>([])
    const [allMarkups, setAllMarkups] = useState<Markup[]>([])

    // Quote State
    const [clientId, setClientId] = useState<string>("")
    const [markupValue, setMarkupValue] = useState<number>(2.0)
    const [km, setKm] = useState<number>(0)
    const [validity, setValidity] = useState<number>(15)
    const [obs, setObs] = useState("")

    const [items, setItems] = useState<QuoteItem[]>([])
    const [products, setProducts] = useState<GenericProduct[]>([])
    const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null)
    const [isLoadingQuote, setIsLoadingQuote] = useState(false)

    // Load Data - Optimized with Promise.all to avoid waterfall
    useEffect(() => {
        if (!user) return

        async function fetchData() {
            // Type narrowing: user is guaranteed to exist here due to useRequireAuth
            const userId = user!.id

            // Fetch all data in parallel
            const [confRes, clsRes, profsRes, marksRes] = await Promise.all([
                supabase.from('so_configurations').select('*').eq('user_id', userId).single(),
                supabase.from('so_clients').select('*').eq('user_id', userId),
                supabase.from('so_profiles_metalon').select('*').eq('user_id', userId),
                supabase.from('so_markups').select('*').eq('user_id', userId)
            ])

            if (confRes.data) {
                setConfig(confRes.data)
                setValidity(confRes.data.validade_padrao)
            }
            if (clsRes.data) setAllClients(clsRes.data)
            if (profsRes.data) setAllProfiles(profsRes.data)
            if (marksRes.data) setAllMarkups(marksRes.data)
        }
        fetchData()
    }, [user])

    // Load existing quote for editing
    useEffect(() => {
        if (!editQuoteId || !user || allProfiles.length === 0) return

        async function loadQuote() {
            setIsLoadingQuote(true)

            // Fetch quote
            const { data: quoteData, error: quoteError } = await supabase
                .from('so_quotes')
                .select('*')
                .eq('id', editQuoteId)
                .eq('user_id', user!.id)
                .single()

            if (quoteError || !quoteData) {
                toast.error("Erro ao carregar orçamento para edição")
                setIsLoadingQuote(false)
                return
            }

            // Set quote data
            setClientId(quoteData.client_id)
            setMarkupValue(quoteData.pontuacao_aplicada)
            setKm(quoteData.km_rodado)
            setValidity(quoteData.validade_dias)
            setObs(quoteData.observacoes || '')
            setEditingQuoteId(editQuoteId)

            // Fetch items
            const { data: itemsData } = await supabase
                .from('so_quote_items')
                .select('*')
                .eq('quote_id', editQuoteId)

            if (itemsData) {
                // Convert saved items to QuoteItem format
                const loadedItems: QuoteItem[] = itemsData.map(item => {
                    const profile = allProfiles.find(p => p.id === item.profile_id)
                    const metrosTotais = item.quantidade * item.metros_por_barra
                    const custoPorMetro = profile?.custo_por_metro || 0

                    const stats = calculateItemStats(
                        custoPorMetro,
                        item.quantidade,
                        item.metros_por_barra,
                        item.pintura,
                        config.percentual_pintura_default
                    )

                    return {
                        id: item.id,
                        type: 'metalon',
                        profile_id: item.profile_id,
                        profile_nome: item.profile_snapshot_nome,
                        quantidade: item.quantidade,
                        metros_por_barra: item.metros_por_barra,
                        pintura: item.pintura,
                        custo_por_metro: custoPorMetro,
                        custo_material_item: stats.costMaterial,
                        cortes_extras: item.cortes_extras || 0,
                        soldas_extras: item.soldas_extras || 0,
                        metros_totais: stats.totalMeters,
                        custo_pintura: stats.costPaint,
                        total_item: stats.costMaterialWithPaint
                    }
                })
                setItems(loadedItems)
            }

            // Fetch generic products
            const { data: productsData } = await supabase
                .from('so_quote_generic_products')
                .select('*')
                .eq('quote_id', editQuoteId)

            if (productsData) {
                const loadedProducts: GenericProduct[] = productsData.map(p => ({
                    id: p.id,
                    type: 'generic',
                    descricao: p.descricao,
                    quantidade: p.quantidade,
                    valor_unitario: p.valor_unitario,
                    total: p.quantidade * p.valor_unitario
                }))
                setProducts(loadedProducts)
            }

            toast.success("Orçamento carregado para edição")
            setIsLoadingQuote(false)
        }

        loadQuote()
    }, [editQuoteId, user, allProfiles, config.percentual_pintura_default])

    // Computed
    const totals = useMemo(() =>
        calculateQuoteTotals(items, products, config, markupValue, km),
        [items, products, config, markupValue, km]
    )

    const client = allClients.find(c => c.id === clientId)

    // Handlers - Memoized to prevent unnecessary re-renders
    const handleAddItem = useCallback((item: QuoteItem) => {
        setItems(prev => [...prev, item])
    }, [])

    const handleAddProduct = useCallback((prod: GenericProduct) => {
        setProducts(prev => [...prev, prod])
    }, [])

    const handleRemoveItem = useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id))
    }, [])

    const handleRemoveProduct = useCallback((id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id))
    }, [])

    const handleCopyWhatsApp = useCallback(() => {
        const text = generateWhatsAppText(
            client, items, products, totals, markupValue, km, validity, obs
        )
        navigator.clipboard.writeText(text)
        toast.success("Orçamento copiado para área de transferência!")
    }, [client, items, products, totals, markupValue, km, validity, obs])

    const handleSaveQuote = async () => {
        if (!clientId || !user) {
            toast.error("Selecione um cliente para salvar.")
            return
        }

        const toastId = toast.loading(editingQuoteId ? "Atualizando orçamento..." : "Salvando orçamento...")

        if (editingQuoteId) {
            // UPDATE existing quote
            const { error: quoteError } = await supabase
                .from('so_quotes')
                .update({
                    client_id: clientId,
                    pontuacao_aplicada: markupValue,
                    km_rodado: km,
                    validade_dias: validity,
                    observacoes: obs,
                    total_material: totals.total_material,
                    subtotal_pos_markup: totals.subtotal_pos_markup,
                    custo_cortes: totals.custo_cortes,
                    custo_soldas: totals.custo_soldas,
                    custo_transporte: totals.custo_transporte,
                    custo_produtos_genericos: totals.custo_produtos_genericos,
                    valor_final: totals.valor_final,
                    lucro_absoluto: totals.lucro_absoluto,
                    lucro_percentual: totals.lucro_percentual
                })
                .eq('id', editingQuoteId)

            if (quoteError) {
                toast.error("Erro ao atualizar orçamento: " + quoteError.message, { id: toastId })
                return
            }

            // Delete old items and products
            await supabase.from('so_quote_items').delete().eq('quote_id', editingQuoteId)
            await supabase.from('so_quote_generic_products').delete().eq('quote_id', editingQuoteId)

            // Insert updated items and products
            if (items.length > 0) {
                const quoteItemsPayload = items.map(item => ({
                    quote_id: editingQuoteId,
                    profile_id: item.profile_id,
                    profile_snapshot_nome: item.profile_nome,
                    quantidade: item.quantidade,
                    metros_por_barra: item.metros_por_barra,
                    pintura: item.pintura,
                    custo_material_item: item.custo_material_item,
                    cortes_extras: item.cortes_extras,
                    soldas_extras: item.soldas_extras
                }))
                await supabase.from('so_quote_items').insert(quoteItemsPayload)
            }

            if (products.length > 0) {
                const genericPayload = products.map(prod => ({
                    quote_id: editingQuoteId,
                    descricao: prod.descricao,
                    quantidade: prod.quantidade,
                    valor_unitario: prod.valor_unitario
                }))
                await supabase.from('so_quote_generic_products').insert(genericPayload)
            }

            toast.success("Orçamento atualizado com sucesso!", { id: toastId })
        } else {
            // CREATE new quote
            const { data: quote, error: quoteError } = await supabase.from('so_quotes').insert({
                user_id: user.id,
                client_id: clientId,
                pontuacao_aplicada: markupValue,
                km_rodado: km,
                validade_dias: validity,
                observacoes: obs,
                total_material: totals.total_material,
                subtotal_pos_markup: totals.subtotal_pos_markup,
                custo_cortes: totals.custo_cortes,
                custo_soldas: totals.custo_soldas,
                custo_transporte: totals.custo_transporte,
                custo_produtos_genericos: totals.custo_produtos_genericos,
                valor_final: totals.valor_final,
                lucro_absoluto: totals.lucro_absoluto,
                lucro_percentual: totals.lucro_percentual,
                status: 'draft'
            }).select().single()

            if (quoteError || !quote) {
                toast.error("Erro ao salvar orçamento: " + quoteError?.message, { id: toastId })
                return
            }

            // Create Items
            const quoteItemsPayload = items.map(item => ({
                quote_id: quote.id,
                profile_id: item.profile_id,
                profile_snapshot_nome: item.profile_nome,
                quantidade: item.quantidade,
                metros_por_barra: item.metros_por_barra,
                pintura: item.pintura,
                custo_material_item: item.custo_material_item,
                cortes_extras: item.cortes_extras,
                soldas_extras: item.soldas_extras
            }))

            if (quoteItemsPayload.length > 0) {
                const { error: itemsError } = await supabase.from('so_quote_items').insert(quoteItemsPayload)
                if (itemsError) console.error("Error saving items", itemsError)
            }

            // Create Generic Products
            const genericPayload = products.map(prod => ({
                quote_id: quote.id,
                descricao: prod.descricao,
                quantidade: prod.quantidade,
                valor_unitario: prod.valor_unitario
            }))

            if (genericPayload.length > 0) {
                const { error: genError } = await supabase.from('so_quote_generic_products').insert(genericPayload)
                if (genError) console.error("Error saving generic products", genError)
            }

            toast.success("Orçamento salvo com sucesso!", { id: toastId })
        }
    }

    // Fallback Markups if none in DB
    const availableMarkups = allMarkups.length > 0 ? allMarkups : [
        { id: 'def', label: 'Padrão (2.0)', value: 2.0 },
        { id: 'amg', label: 'Amigo (1.8)', value: 1.8 }
    ]

    if (!user) return <div className="p-4">Carregando usuário...</div>

    return (
        <div className="space-y-6 pb-20">
            {/* --- TOPO --- */}
            <Card>
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                    <CardTitle>Dados do Orçamento</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleSaveQuote}>
                        <Save className="mr-2 h-4 w-4" /> Salvar
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select value={clientId} onValueChange={setClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {allClients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Pontuação (Markup)</Label>
                            <Select value={markupValue.toString()} onValueChange={(v) => setMarkupValue(parseFloat(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMarkups.map(m => (
                                        <SelectItem key={m.id} value={m.value.toString()}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>KM Rodado</Label>
                            <Input type="number" value={km} onChange={e => setKm(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>

                    <div className="text-sm font-medium text-muted-foreground">
                        Lucro Estimado: <span className="text-green-600">{formatCurrency(totals.lucro_absoluto)} ({totals.lucro_percentual.toFixed(1)}%)</span>
                    </div>
                </CardContent>
            </Card>

            {/* --- CORPO (ITENS) --- */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Itens do Orçamento</h3>

                {items.length === 0 && products.length === 0 && (
                    <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground">
                        Nenhum item adicionado.
                    </div>
                )}

                {/* Lista de Barras */}
                {items.map((item, idx) => (
                    <Card key={item.id} className="relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        <CardContent className="p-4 flex justify-between items-start">
                            <div>
                                <div className="font-bold text-base">{item.profile_nome}</div>
                                <div className="text-sm text-muted-foreground">
                                    {item.quantidade} barras x {item.metros_por_barra}m
                                    {item.pintura && <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Pintura</span>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Total: {item.metros_totais.toFixed(1)}m
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{formatCurrency(item.total_item)}</div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Lista de Produtos */}
                {products.map((prod) => (
                    <Card key={prod.id} className="relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        <CardContent className="p-4 flex justify-between items-start">
                            <div>
                                <div className="font-bold text-base">{prod.descricao}</div>
                                <div className="text-sm text-muted-foreground">
                                    {prod.quantidade} x {formatCurrency(prod.valor_unitario)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{formatCurrency(prod.total)}</div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => handleRemoveProduct(prod.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <AddItemModal
                        profiles={allProfiles}
                        onAdd={handleAddItem}
                        paintPercentage={config.percentual_pintura_default}
                    />
                    <AddProductModal onAdd={handleAddProduct} />
                </div>
            </div>

            {/* --- RODAPÉ (TOTAIS) --- */}
            <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal Material (c/ pintura):</span>
                        <span>{formatCurrency(totals.total_material)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-blue-600">
                        <span>Pós-Markup (x{markupValue}):</span>
                        <span>{formatCurrency(totals.subtotal_pos_markup)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-muted-foreground">
                        <span>Cortes ({formatCurrency(config.valor_por_corte)}/un):</span>
                        <span>{formatCurrency(totals.custo_cortes)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Soldas ({formatCurrency(config.valor_por_solda)}/un):</span>
                        <span>{formatCurrency(totals.custo_soldas)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Transporte ({km}km):</span>
                        <span>{formatCurrency(totals.custo_transporte)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Produtos/Outros:</span>
                        <span>{formatCurrency(totals.custo_produtos_genericos)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center bg-primary/10 p-2 rounded-md">
                        <span className="font-bold text-lg">VALOR FINAL</span>
                        <span className="font-bold text-xl">{formatCurrency(totals.valor_final)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                                <FileText className="mr-2 h-4 w-4" /> Preview
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[90%] md:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Preview WhatsApp</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="flex-1 mt-2 border rounded-md p-4 bg-muted/20">
                                <pre className="whitespace-pre-wrap font-sans text-sm">
                                    {generateWhatsAppText(client, items, products, totals, markupValue, km, validity, obs)}
                                </pre>
                            </ScrollArea>
                            <Button onClick={handleCopyWhatsApp} className="mt-4">
                                <Copy className="mr-2 h-4 w-4" /> Copiar Texto
                            </Button>
                        </DialogContent>
                    </Dialog>

                    <Button className="flex-1" onClick={handleCopyWhatsApp}>
                        <Copy className="mr-2 h-4 w-4" /> Copiar WhatsApp
                    </Button>
                </CardFooter>
            </Card>

            <div className="px-1">
                <Label htmlFor="obs">Observações Internas (ou Cliente)</Label>
                <Textarea
                    id="obs"
                    placeholder="Obs para sair no orçamento..."
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    className="mt-1"
                />
            </div>
        </div>
    )
}

export default function QuotePage() {
    return (
        <Suspense fallback={<div className="p-4">Carregando...</div>}>
            <QuotePageContent />
        </Suspense>
    )
}
