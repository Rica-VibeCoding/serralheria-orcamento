"use client"

import { useState, useMemo, useEffect, useCallback, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Copy, Loader2, RefreshCw, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { AddItemModal } from "@/components/quote/add-item-modal"
import { AddProductModal } from "@/components/quote/add-product-modal"
import { NewQuoteButton } from "@/components/quote/new-quote-button"
import { calculateQuoteTotals, formatCurrency, calculateItemStats } from "@/lib/calculations"
import { generateWhatsAppText } from "@/lib/whatsapp"
import { supabase } from "@/lib/supabase/client"
import { useRequireAuth } from "@/lib/hooks/use-auth"
import type { Client, MetalonProfile, QuoteItem, GenericProduct, Configuration, Markup } from "@/types"

// UI Constants for consistency and easy refactoring
const FORM_CONTROL_HEIGHT = "!h-12" // 48px - WCAG AA touch target (! overrides shadcn defaults)
const FORM_LABEL_CLASS = "text-sm font-medium"
const FORM_FIELD_SPACING = "space-y-2.5"
const CARD_CONTENT_GAP = "gap-5"

// Item Card Constants - Dense Mobile UI for Productivity
const ITEM_CARD_PADDING = "px-3 py-2" // Ultra-compact for density (12px horizontal, 8px vertical)
const ITEM_CARD_BORDER_WIDTH = "w-0.5" // Thin accent border (2px)

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
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // Item editing state
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)

    const [editingProductId, setEditingProductId] = useState<string | null>(null)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)

    // Refs for optimization
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isFirstLoad = useRef(true)

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
            isFirstLoad.current = false
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

    const handleUpdateItem = useCallback((updatedItem: QuoteItem) => {
        setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
        setEditingItemId(null)
        setIsItemModalOpen(false)
    }, [])

    const handleUpdateProduct = useCallback((updatedProduct: GenericProduct) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
        setEditingProductId(null)
        setIsProductModalOpen(false)
    }, [])

    const handleCopyWhatsApp = useCallback(() => {
        const text = generateWhatsAppText(
            client, items, products, totals, markupValue, km, validity, obs
        )
        navigator.clipboard.writeText(text)
        toast.success("Orçamento copiado para área de transferência!")
    }, [client, items, products, totals, markupValue, km, validity, obs])

    const handleNewQuote = useCallback((newClient: Client) => {
        // Ensure client is in the list (for newly created clients)
        setAllClients(prev => {
            const exists = prev.some(c => c.id === newClient.id)
            return exists ? prev : [...prev, newClient]
        })

        setClientId(newClient.id)
        setItems([])
        setProducts([])
        setEditingQuoteId(null)
        setObs("")
        setKm(0)
        setMarkupValue(2.0)
        setLastSaved(null)
        isFirstLoad.current = false // Enables auto-save for new quote

        toast.success(`Iniciado novo orçamento para ${newClient.name}`)

        // Force save immediately for the new quote structure
        // But we rely on useEffect below to trigger it
    }, [])

    // ----------- AUTO-SAVE LOGIC -----------
    const saveQuoteToDb = useCallback(async () => {
        if (!clientId || !user) return

        setIsSaving(true)
        console.log("💾 Auto-saving...", { editingQuoteId })

        try {
            let currentQuoteId = editingQuoteId

            // Prepare Payload
            const quotePayload = {
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
                status: 'open',
                user_id: user.id
            }

            if (currentQuoteId) {
                // UPDATE
                const { error } = await supabase
                    .from('so_quotes')
                    .update(quotePayload)
                    .eq('id', currentQuoteId)

                if (error) throw error
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('so_quotes')
                    .insert(quotePayload)
                    .select()
                    .single()

                if (error) throw error
                if (data) {
                    setEditingQuoteId(data.id)
                    currentQuoteId = data.id
                }
            }

            if (currentQuoteId) {
                // Items & Products - Full Replace Strategy (Simpler for consistency)
                // Delete old
                await supabase.from('so_quote_items').delete().eq('quote_id', currentQuoteId)
                await supabase.from('so_quote_generic_products').delete().eq('quote_id', currentQuoteId)

                // Insert Items
                if (items.length > 0) {
                    const quoteItemsPayload = items.map(item => ({
                        quote_id: currentQuoteId,
                        profile_id: item.profile_id,
                        profile_snapshot_nome: item.profile_nome,
                        quantidade: item.quantidade,
                        metros_por_barra: item.metros_por_barra,
                        pintura: item.pintura,
                        custo_material_item: item.custo_material_item,
                        cortes_extras: item.cortes_extras,
                        soldas_extras: item.soldas_extras
                    }))
                    const { error: errItems } = await supabase.from('so_quote_items').insert(quoteItemsPayload)
                    if (errItems) console.error("Error saving items", errItems)
                }

                // Insert Products
                if (products.length > 0) {
                    const genericPayload = products.map(prod => ({
                        quote_id: currentQuoteId,
                        descricao: prod.descricao,
                        quantidade: prod.quantidade,
                        valor_unitario: prod.valor_unitario
                    }))
                    const { error: errProds } = await supabase.from('so_quote_generic_products').insert(genericPayload)
                    if (errProds) console.error("Error saving products", errProds)
                }

                setLastSaved(new Date())
            }

        } catch (error) {
            console.error("Auto-save failed:", error)
            toast.error("Erro ao salvar automaticamente")
        } finally {
            setIsSaving(false)
        }
    }, [clientId, user, editingQuoteId, markupValue, km, validity, obs, totals, items, products])

    // Trigger Auto-save on data changes
    useEffect(() => {
        // Skip first load or if no client selected
        if (!clientId || isFirstLoad.current || isLoadingQuote) {
            if (!isLoadingQuote) isFirstLoad.current = false
            return
        }

        // Debounce logic
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        saveTimeoutRef.current = setTimeout(() => {
            saveQuoteToDb()
        }, 1000) // 1 second debounce

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        }
    }, [clientId, markupValue, km, validity, obs, items, products, saveQuoteToDb]) // Dependencies that trigger save

    // Fallback Markups if none in DB
    const availableMarkups = allMarkups.length > 0 ? allMarkups : [
        { id: 'def', label: 'Padrão (2.0)', value: 2.0 },
        { id: 'amg', label: 'Amigo (1.8)', value: 1.8 }
    ]

    console.log("Reticências") // Force re-render just to be safe
    if (!user) return <div className="p-4">Carregando usuário...</div>

    return (
        <div className="space-y-6 pb-20">
            {/* --- TOPO --- */}
            <Card>
                <CardHeader className="pb-4 flex flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">Dados do Orçamento</CardTitle>
                        <div className="flex items-center gap-2">
                            {isSaving ? (
                                <span className="flex items-center text-xs text-muted-foreground animate-pulse">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Salvando...
                                </span>
                            ) : lastSaved ? (
                                <span className="flex items-center text-xs text-green-600/70">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Salvo
                                </span>
                            ) : null}
                        </div>
                    </div>
                    {/* Botão Novo Orçamento (Substitui o Salvar) */}
                    <NewQuoteButton clients={allClients} onNewQuote={handleNewQuote} />
                </CardHeader>
                <CardContent className={`grid ${CARD_CONTENT_GAP}`}>
                    {/* Cliente Field - Full Width */}
                    <div className={FORM_FIELD_SPACING}>
                        <Label htmlFor="cliente" className={FORM_LABEL_CLASS}>Cliente</Label>
                        <Select value={clientId} onValueChange={setClientId}>
                            <SelectTrigger id="cliente" className={`w-full ${FORM_CONTROL_HEIGHT}`}>
                                <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {allClients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Markup + KM Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={FORM_FIELD_SPACING}>
                            <Label htmlFor="markup" className={FORM_LABEL_CLASS}>Markup</Label>
                            <Select value={markupValue.toString()} onValueChange={(v) => setMarkupValue(parseFloat(v))}>
                                <SelectTrigger id="markup" className={`w-full ${FORM_CONTROL_HEIGHT}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMarkups.map(m => (
                                        <SelectItem key={m.id} value={m.value.toString()}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className={FORM_FIELD_SPACING}>
                            <Label htmlFor="km" className={FORM_LABEL_CLASS}>KM Rodado</Label>
                            <Input
                                id="km"
                                type="number"
                                value={km}
                                onChange={e => setKm(parseFloat(e.target.value) || 0)}
                                className={FORM_CONTROL_HEIGHT}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <span className="text-sm font-medium text-green-900">Lucro Estimado</span>
                        <span className="text-base font-bold text-green-700">
                            {formatCurrency(totals.lucro_absoluto)} ({totals.lucro_percentual.toFixed(1)}%)
                        </span>
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

                {/* Lista de Barras - Dense List UI */}
                {items.map((item, idx) => {
                    const valorVenda = item.total_item * markupValue
                    return (
                        <Card
                            key={item.id}
                            className="relative overflow-hidden hover:bg-accent/50 transition-colors !py-0 cursor-pointer"
                            onClick={() => {
                                setEditingItemId(item.id)
                                setIsItemModalOpen(true)
                            }}
                        >
                            {/* Thin Accent Border */}
                            <div className={`absolute left-0 top-0 bottom-0 ${ITEM_CARD_BORDER_WIDTH} bg-blue-500`} />

                            <CardContent className={`${ITEM_CARD_PADDING} pl-3.5 pr-3`}>
                                <div className="flex items-center justify-between gap-2">
                                    {/* Left: Title + Details (65% width) */}
                                    <div className="flex-1 min-w-0">
                                        {/* Primary Line: Title + Quantity */}
                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                            <span className="font-semibold text-sm leading-tight">{item.profile_nome}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {item.quantidade}×{item.metros_por_barra}m
                                            </span>
                                            {item.pintura && (
                                                <span className="inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                                    Pintura
                                                </span>
                                            )}
                                        </div>
                                        {/* Secondary Line: Total meters */}
                                        <div className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
                                            {item.metros_totais.toFixed(1)}m total
                                        </div>
                                    </div>

                                    {/* Right: Cost | Sale Price (35% width) */}
                                    <div className="flex items-baseline gap-1.5 tabular-nums shrink-0">
                                        <span className="text-xs text-muted-foreground/50">{formatCurrency(item.total_item)}</span>
                                        <span className="text-muted-foreground/40">|</span>
                                        <span className="font-bold text-sm">{formatCurrency(valorVenda)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {/* Lista de Produtos - Dense List UI */}
                {products.map((prod) => {
                    const valorVenda = prod.total * markupValue
                    return (
                        <Card
                            key={prod.id}
                            className="relative overflow-hidden hover:bg-accent/50 transition-colors !py-0 cursor-pointer"
                            onClick={() => {
                                setEditingProductId(prod.id)
                                setIsProductModalOpen(true)
                            }}
                        >
                            {/* Thin Accent Border */}
                            <div className={`absolute left-0 top-0 bottom-0 ${ITEM_CARD_BORDER_WIDTH} bg-amber-500`} />

                            <CardContent className={`${ITEM_CARD_PADDING} pl-3.5 pr-3`}>
                                <div className="flex items-center justify-between gap-2">
                                    {/* Left: Title + Details (65% width) */}
                                    <div className="flex-1 min-w-0">
                                        {/* Primary Line: Title */}
                                        <div className="font-semibold text-sm leading-tight truncate">{prod.descricao}</div>
                                        {/* Secondary Line: Quantity × Unit Price */}
                                        <div className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
                                            {prod.quantidade} × {formatCurrency(prod.valor_unitario)}
                                        </div>
                                    </div>

                                    {/* Right: Cost | Sale Price (35% width) */}
                                    <div className="flex items-baseline gap-1.5 tabular-nums shrink-0">
                                        <span className="text-xs text-muted-foreground/50">{formatCurrency(prod.total)}</span>
                                        <span className="text-muted-foreground/40">|</span>
                                        <span className="font-bold text-sm">{formatCurrency(valorVenda)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <AddItemModal
                        profiles={allProfiles}
                        onAdd={handleAddItem}
                        onUpdate={handleUpdateItem}
                        onDelete={handleRemoveItem}
                        editingItem={items.find(i => i.id === editingItemId)}
                        isOpen={isItemModalOpen}
                        onOpenChange={(open) => {
                            setIsItemModalOpen(open)
                            if (!open) setEditingItemId(null)
                        }}
                        paintPercentage={config.percentual_pintura_default}
                    />
                    <AddProductModal
                        onAdd={handleAddProduct}
                        onUpdate={handleUpdateProduct}
                        onDelete={handleRemoveProduct}
                        editingProduct={products.find(p => p.id === editingProductId)}
                        isOpen={isProductModalOpen}
                        onOpenChange={(open) => {
                            setIsProductModalOpen(open)
                            if (!open) setEditingProductId(null)
                        }}
                    />
                </div>
            </div>

            {/* --- RODAPÉ (TOTAIS) --- */}
            <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {(() => {
                        // Calculate totals for display
                        let totalPintura = 0
                        items.forEach(item => {
                            if (item.pintura) {
                                totalPintura += item.custo_pintura
                            }
                        })

                        const custoServicos = totals.custo_cortes + totals.custo_soldas + totals.custo_transporte + totalPintura
                        const custoProdutos = items.reduce((acc, item) => acc + item.custo_material_item, 0) + totals.custo_produtos_genericos
                        const subtotal = custoServicos + custoProdutos

                        return (
                            <>
                                {/* Detalhes dos Serviços */}
                                <div className="space-y-1.5">
                                    {totals.custo_cortes > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Cortes ({formatCurrency(config.valor_por_corte)}/un):</span>
                                            <span>{formatCurrency(totals.custo_cortes)}</span>
                                        </div>
                                    )}
                                    {totals.custo_soldas > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Soldas ({formatCurrency(config.valor_por_solda)}/un):</span>
                                            <span>{formatCurrency(totals.custo_soldas)}</span>
                                        </div>
                                    )}
                                    {totals.custo_transporte > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Transporte ({km}km):</span>
                                            <span>{formatCurrency(totals.custo_transporte)}</span>
                                        </div>
                                    )}
                                    {totalPintura > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Pintura:</span>
                                            <span>{formatCurrency(totalPintura)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Totais Agrupados */}
                                <div className="flex justify-between">
                                    <span>Serviço:</span>
                                    <span className="font-medium">{formatCurrency(custoServicos)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Produtos:</span>
                                    <span className="font-medium">{formatCurrency(custoProdutos)}</span>
                                </div>

                                <Separator />

                                {/* Subtotal */}
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                                </div>

                                {/* Lucro */}
                                <div className="flex justify-between text-green-700">
                                    <span>Lucro:</span>
                                    <span className="font-semibold">{formatCurrency(totals.lucro_absoluto)} ({totals.lucro_percentual.toFixed(1)}%)</span>
                                </div>

                                <Separator />

                                {/* Valor de Venda (VALOR FINAL) */}
                                <div className="flex justify-between items-center bg-primary/10 p-3 rounded-md">
                                    <span className="font-bold text-base">Valor de Venda</span>
                                    <span className="font-bold text-xl">{formatCurrency(totals.valor_final)}</span>
                                </div>
                            </>
                        )
                    })()}
                </CardContent>
                <CardFooter className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <FileText className="mr-2 h-4 w-4" /> Preview Orçamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[90%] md:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Preview Orçamento</DialogTitle>
                                <DialogDescription>
                                    Confira os dados antes de copiar para o WhatsApp
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="flex-1 mt-2 border rounded-md p-4 bg-muted/20">
                                <pre className="whitespace-pre-wrap font-sans text-sm">
                                    {generateWhatsAppText(client, items, products, totals, markupValue, km, validity, obs)}
                                </pre>
                            </ScrollArea>
                            <Button onClick={handleCopyWhatsApp} className="mt-4 w-full" size="lg">
                                <Copy className="mr-2 h-4 w-4" /> Copiar para WhatsApp
                            </Button>
                        </DialogContent>
                    </Dialog>
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
