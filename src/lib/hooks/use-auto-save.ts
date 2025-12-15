import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import type { QuoteItem, GenericProduct } from "@/types"

interface AutoSaveProps {
    clientId: string
    userId: string | undefined
    editingQuoteId: string | null
    setEditingQuoteId: (id: string | null) => void
    markupValue: number
    km: number
    validity: number
    obs: string
    totals: any
    items: QuoteItem[]
    products: GenericProduct[]
    isFirstLoad: React.MutableRefObject<boolean>
    isLoadingQuote: boolean
}

export function useAutoSave({
    clientId,
    userId,
    editingQuoteId,
    setEditingQuoteId,
    markupValue,
    km,
    validity,
    obs,
    totals,
    items,
    products,
    isFirstLoad,
    isLoadingQuote
}: AutoSaveProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const saveQuoteToDb = useCallback(async () => {
        if (!clientId || !userId) return

        setIsSaving(true)

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
                user_id: userId
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
                // Items & Products - Full Replace Strategy
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
    }, [clientId, userId, editingQuoteId, markupValue, km, validity, obs, totals, items, products, setEditingQuoteId])

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
    }, [clientId, markupValue, km, validity, obs, items, products, saveQuoteToDb, isFirstLoad, isLoadingQuote])

    return {
        isSaving,
        lastSaved,
        setLastSaved // Exposed if needed to reset manually
    }
}
