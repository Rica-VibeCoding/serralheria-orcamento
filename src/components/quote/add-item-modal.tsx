
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { calculateItemStats, formatCurrency } from "@/lib/calculations"
import { QuoteItemSchema } from "@/lib/validations"
import { toast } from "sonner"
import type { QuoteItem, MetalonProfile } from "@/types"

interface AddItemModalProps {
    profiles: MetalonProfile[]
    onAdd: (item: QuoteItem) => void
    onUpdate?: (item: QuoteItem) => void
    onDelete?: (id: string) => void
    editingItem?: QuoteItem
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    paintPercentage: number
}

export function AddItemModal({ profiles, onAdd, onUpdate, onDelete, editingItem, isOpen, onOpenChange, paintPercentage }: AddItemModalProps) {
    const [open, setOpen] = useState(false)

    // Use controlled state if provided, otherwise use internal state
    const modalOpen = isOpen !== undefined ? isOpen : open
    const setModalOpen = onOpenChange || setOpen

    // Form State
    const [profileId, setProfileId] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [metersPerBar, setMetersPerBar] = useState(6)
    const [paint, setPaint] = useState(true) // Default: pintura ativada
    const [extraCuts, setExtraCuts] = useState(0)
    const [extraWelds, setExtraWelds] = useState(0)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Populate form when editing
    useEffect(() => {
        if (editingItem) {
            setProfileId(editingItem.profile_id)
            setQuantity(editingItem.quantidade)
            setMetersPerBar(editingItem.metros_por_barra)
            setPaint(editingItem.pintura)
            setExtraCuts(editingItem.cortes_extras || 0)
            setExtraWelds(editingItem.soldas_extras || 0)
        }
    }, [editingItem])

    const selectedProfile = profiles.find(p => p.id === profileId)

    // Live calculation for preview
    const stats = selectedProfile
        ? calculateItemStats(selectedProfile.custo_por_metro, quantity, metersPerBar, paint, paintPercentage)
        : { totalMeters: 0, costMaterial: 0, costPaint: 0, costMaterialWithPaint: 0 }

    const handleSave = () => {
        if (!selectedProfile) {
            toast.error("Selecione um perfil")
            return
        }

        // Validação Zod
        const validation = QuoteItemSchema.safeParse({
            profile_id: profileId,
            quantidade: quantity,
            metros_por_barra: metersPerBar,
            pintura: paint,
            cortes_extras: extraCuts,
            soldas_extras: extraWelds
        })

        if (!validation.success) {
            const fieldErrors: Record<string, string> = {}
            validation.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0].toString()] = err.message
                }
            })
            setErrors(fieldErrors)
            toast.error("Corrija os erros no formulário")
            return
        }

        setErrors({})

        const itemData: QuoteItem = {
            id: editingItem?.id || crypto.randomUUID(),
            type: 'metalon',
            profile_id: selectedProfile.id,
            profile_nome: selectedProfile.nome,
            quantidade: quantity,
            metros_por_barra: metersPerBar,
            pintura: paint,
            custo_por_metro: selectedProfile.custo_por_metro,
            custo_material_item: stats.costMaterialWithPaint,
            cortes_extras: extraCuts,
            soldas_extras: extraWelds,
            metros_totais: stats.totalMeters,
            custo_pintura: stats.costPaint,
            total_item: stats.costMaterialWithPaint
        }

        if (editingItem && onUpdate) {
            onUpdate(itemData)
        } else {
            onAdd(itemData)
        }

        setModalOpen(false)

        // Reset only if adding new (not editing)
        if (!editingItem) {
            setQuantity(1)
            setExtraCuts(0)
            setExtraWelds(0)
        }
    }

    const handleDelete = () => {
        if (editingItem && onDelete) {
            onDelete(editingItem.id)
            setModalOpen(false)
        }
    }

    return (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            {!editingItem && (
                <DialogTrigger asChild>
                    <Button className="w-full h-12 text-base" variant="outline">
                        <Plus className="mr-2 h-5 w-5" /> Barra Metalon
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingItem ? 'Editar Barra' : 'Adicionar Barra'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Perfil</Label>
                        <Select value={profileId} onValueChange={setProfileId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um perfil" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.nome} ({p.espessura}) - {formatCurrency(p.custo_por_metro)}/m
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantidade (Barras)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                            />
                            {errors.quantidade && (
                                <p className="text-xs text-destructive">{errors.quantidade}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Metros por Barra</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={metersPerBar}
                                onChange={e => setMetersPerBar(Number(e.target.value))}
                            />
                            {errors.metros_por_barra && (
                                <p className="text-xs text-destructive">{errors.metros_por_barra}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <Checkbox id="paint" checked={paint} onCheckedChange={(c) => setPaint(!!c)} />
                        <Label htmlFor="paint" className="flex-1 cursor-pointer">
                            Pintura (+{paintPercentage}%)
                        </Label>
                        {paint && <span className="text-sm font-semibold">{formatCurrency(stats.costPaint)}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-md">
                        <div className="space-y-1">
                            <Label className="text-xs">Cortes Extras</Label>
                            <Input type="number" value={extraCuts} onChange={e => setExtraCuts(Number(e.target.value))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Soldas Extras</Label>
                            <Input type="number" value={extraWelds} onChange={e => setExtraWelds(Number(e.target.value))} className="h-8" />
                        </div>
                        <p className="text-[10px] text-muted-foreground col-span-2">
                            *Já inclui 1 corte e 1 solda automáticos por barra.
                        </p>
                    </div>

                    {selectedProfile && (
                        <div className="border-t pt-4 mt-2">
                            <div className="flex justify-between text-sm">
                                <span>Metros totais:</span>
                                <span>{stats.totalMeters.toFixed(1)}m</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg mt-1">
                                <span>Custo Material:</span>
                                <span>{formatCurrency(stats.costMaterialWithPaint)}</span>
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {editingItem && onDelete && (
                        <Button variant="destructive" onClick={handleDelete} className="sm:mr-auto">
                            Excluir
                        </Button>
                    )}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 sm:flex-initial">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!selectedProfile} className="flex-1 sm:flex-initial">
                            {editingItem ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
