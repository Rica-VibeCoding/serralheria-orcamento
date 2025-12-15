
"use client"

import { useState, useEffect } from "react"
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
    onUpdate?: (product: GenericProduct) => void
    onDelete?: (id: string) => void
    editingProduct?: GenericProduct
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AddProductModal({ onAdd, onUpdate, onDelete, editingProduct, isOpen, onOpenChange }: AddProductModalProps) {
    const [open, setOpen] = useState(false)

    // Use controlled state if provided, otherwise use internal state
    const modalOpen = isOpen !== undefined ? isOpen : open
    const setModalOpen = onOpenChange || setOpen
    const [desc, setDesc] = useState("")
    const [qtd, setQtd] = useState(1)
    const [valor, setValor] = useState(0)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Populate form when editing
    useEffect(() => {
        if (editingProduct) {
            setDesc(editingProduct.descricao)
            setQtd(editingProduct.quantidade)
            setValor(editingProduct.valor_unitario)
        }
    }, [editingProduct])

    const total = qtd * valor

    const handleSave = () => {
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

        const productData: GenericProduct = {
            id: editingProduct?.id || crypto.randomUUID(),
            type: 'generic',
            descricao: desc,
            quantidade: qtd,
            valor_unitario: valor,
            total: total
        }

        if (editingProduct && onUpdate) {
            onUpdate(productData)
        } else {
            onAdd(productData)
        }

        setModalOpen(false)

        // Reset only if adding new (not editing)
        if (!editingProduct) {
            setDesc("")
            setQtd(1)
            setValor(0)
        }
    }

    const handleDelete = () => {
        if (editingProduct && onDelete) {
            onDelete(editingProduct.id)
            setModalOpen(false)
        }
    }

    return (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            {!editingProduct && (
                <DialogTrigger asChild>
                    <Button className="w-full h-12 text-base" variant="outline">
                        <PackagePlus className="mr-2 h-5 w-5" /> Produtos/Outros
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Item Diverso'}</DialogTitle>
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

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {editingProduct && onDelete && (
                        <Button variant="destructive" onClick={handleDelete} className="sm:mr-auto">
                            Excluir
                        </Button>
                    )}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 sm:flex-initial">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} className="flex-1 sm:flex-initial">
                            {editingProduct ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
