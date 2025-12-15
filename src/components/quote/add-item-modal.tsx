
"use client"

import { useState } from "react"
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
    paintPercentage: number
}

export function AddItemModal({ profiles, onAdd, paintPercentage }: AddItemModalProps) {
    const [open, setOpen] = useState(false)

    // Form State
    const [profileId, setProfileId] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [metersPerBar, setMetersPerBar] = useState(6)
    const [paint, setPaint] = useState(false)
    const [extraCuts, setExtraCuts] = useState(0)
    const [extraWelds, setExtraWelds] = useState(0)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const selectedProfile = profiles.find(p => p.id === profileId)

    // Live calculation for preview
    const stats = selectedProfile
        ? calculateItemStats(selectedProfile.custo_por_metro, quantity, metersPerBar, paint, paintPercentage)
        : { totalMeters: 0, costMaterial: 0, costPaint: 0, costMaterialWithPaint: 0 }

    const handleAdd = () => {
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

        const newItem: QuoteItem = {
            id: crypto.randomUUID(),
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

        onAdd(newItem)
        setOpen(false)
        // Reset defaults but keep some sticky if useful
        setQuantity(1)
        setExtraCuts(0)
        setExtraWelds(0)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full h-12 text-base" variant="outline">
                    <Plus className="mr-2 h-5 w-5" /> Adicionar Barra Metalon
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar Barra</DialogTitle>
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

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAdd} disabled={!selectedProfile}>Adicionar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
