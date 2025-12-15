
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { PackagePlus } from "lucide-react"
import { formatCurrency } from "@/lib/calculations"
import { GenericProductSchema } from "@/lib/validations"
import { toast } from "sonner"
import type { GenericProduct } from "@/types"

interface AddProductModalProps {
    onAdd: (product: GenericProduct) => void
}

export function AddProductModal({ onAdd }: AddProductModalProps) {
    const [open, setOpen] = useState(false)
    const [desc, setDesc] = useState("")
    const [qtd, setQtd] = useState(1)
    const [valor, setValor] = useState(0)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const total = qtd * valor

    const handleAdd = () => {
        // Validação Zod
        const validation = GenericProductSchema.safeParse({
            descricao: desc,
            quantidade: qtd,
            valor_unitario: valor
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

        const newProd: GenericProduct = {
            id: crypto.randomUUID(),
            type: 'generic',
            descricao: desc,
            quantidade: qtd,
            valor_unitario: valor,
            total: total
        }

        onAdd(newProd)
        setOpen(false)
        setDesc("")
        setQtd(1)
        setValor(0)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full text-sm" variant="secondary">
                    <PackagePlus className="mr-2 h-4 w-4" /> Adicionar Produto/Outros
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Item Diverso</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Chapa MDF, Fechadura..." />
                        {errors.descricao && (
                            <p className="text-xs text-destructive">{errors.descricao}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input type="number" min="1" value={qtd} onChange={e => setQtd(Number(e.target.value))} />
                            {errors.quantidade && (
                                <p className="text-xs text-destructive">{errors.quantidade}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Valor Unit. (R$)</Label>
                            <Input type="number" step="0.01" value={valor} onChange={e => setValor(Number(e.target.value))} />
                            {errors.valor_unitario && (
                                <p className="text-xs text-destructive">{errors.valor_unitario}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleAdd}>Adicionar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
