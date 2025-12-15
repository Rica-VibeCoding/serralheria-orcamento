
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import { MarkupSchema } from "@/lib/validations"
import type { Markup } from "@/types"

type MarkupFormData = {
    label: string
    value: number
}

export function MarkupsList() {
    const { user } = useAuth()
    const [markups, setMarkups] = useState<Markup[]>([])
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedMarkup, setSelectedMarkup] = useState<Markup | null>(null)
    const [formData, setFormData] = useState<MarkupFormData>({
        label: '',
        value: 2.0
    })

    useEffect(() => {
        if (!user) return
        fetchMarkups()
    }, [user])

    const fetchMarkups = useCallback(async () => {
        if (!user) return
        const { data, error } = await supabase
            .from('so_markups')
            .select('*')
            .eq('user_id', user.id)
            .order('value', { ascending: false })

        if (data) setMarkups(data)
        if (error) console.error('Erro ao buscar markups:', error)
    }, [user])

    const handleAdd = async () => {
        if (!user) return

        // Validação com Zod
        const validation = MarkupSchema.safeParse(formData)
        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        setLoading(true)
        const { data, error } = await supabase
            .from('so_markups')
            .insert({
                user_id: user.id,
                label: formData.label,
                value: formData.value
            })
            .select()

        if (error) {
            toast.error("Erro ao adicionar: " + error.message)
        } else if (data) {
            setMarkups([...markups, data[0]])
            setAddDialogOpen(false)
            setFormData({ label: '', value: 2.0 })
            toast.success("Pontuação adicionada!")
        }
        setLoading(false)
    }

    const handleEdit = async () => {
        if (!selectedMarkup || !user) return

        // Validação com Zod
        const validation = MarkupSchema.safeParse(formData)
        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        setLoading(true)
        const { data, error } = await supabase
            .from('so_markups')
            .update({
                label: formData.label,
                value: formData.value
            })
            .eq('id', selectedMarkup.id)
            .select()

        if (error) {
            toast.error("Erro ao editar: " + error.message)
        } else if (data) {
            setMarkups(markups.map(m => m.id === selectedMarkup.id ? data[0] : m))
            setEditDialogOpen(false)
            setSelectedMarkup(null)
            setFormData({ label: '', value: 2.0 })
            toast.success("Pontuação atualizada!")
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!selectedMarkup) return

        setLoading(true)
        const { error } = await supabase
            .from('so_markups')
            .delete()
            .eq('id', selectedMarkup.id)

        if (error) {
            toast.error("Erro ao remover: " + error.message)
        } else {
            setMarkups(markups.filter(m => m.id !== selectedMarkup.id))
            setDeleteDialogOpen(false)
            setSelectedMarkup(null)
            toast.success("Pontuação removida!")
        }
        setLoading(false)
    }

    const openEditDialog = (markup: Markup) => {
        setSelectedMarkup(markup)
        setFormData({ label: markup.label, value: markup.value })
        setEditDialogOpen(true)
    }

    const openDeleteDialog = (markup: Markup) => {
        setSelectedMarkup(markup)
        setDeleteDialogOpen(true)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Pontuações (Markups)</CardTitle>
                    <CardDescription>Gerencie suas opções de marcação de preço.</CardDescription>
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Pontuação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Label (ex: Padrão, Amigo)</Label>
                                <Input
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    placeholder="Padrão"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Valor (ex: 2.0 = dobro do custo)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    max="10"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 1 })}
                                    onFocus={e => e.target.select()}
                                />
                            </div>
                            <Button onClick={handleAdd} className="w-full" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {markups.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        Nenhuma pontuação cadastrada. Adicione sua primeira opção.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Label</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {markups.map((markup) => (
                                <TableRow key={markup.id}>
                                    <TableCell className="font-medium">{markup.label}</TableCell>
                                    <TableCell>{markup.value.toFixed(1)}x</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(markup)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDeleteDialog(markup)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Pontuação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Valor</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    max="10"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 1 })}
                                    onFocus={e => e.target.select()}
                                />
                            </div>
                            <Button onClick={handleEdit} className="w-full" disabled={loading}>
                                {loading ? "Salvando..." : "Atualizar"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Remoção</DialogTitle>
                            <DialogDescription>
                                Tem certeza que deseja remover a pontuação "{selectedMarkup?.label}"?
                                Esta ação não pode ser desfeita.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                {loading ? "Removendo..." : "Remover"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
