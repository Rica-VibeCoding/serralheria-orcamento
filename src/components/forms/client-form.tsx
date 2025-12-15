"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import { ClientSchema } from "@/lib/validations"
import type { Client } from "@/types"

interface ClientFormProps {
    onSuccess: (client: Client) => void
    onCancel: () => void
    initialData?: Client
}

export function ClientForm({ onSuccess, onCancel, initialData }: ClientFormProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || ''
    })

    // Update form data when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                phone: initialData.phone || ''
            })
        }
    }, [initialData])

    const handleSubmit = async () => {
        if (!user) return

        if (!formData.name) {
            toast.error("Nome é obrigatório")
            return
        }

        // Validate with Zod
        const validation = ClientSchema.safeParse({
            name: formData.name,
            phone: formData.phone || ''
        })

        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        setLoading(true)

        try {
            if (initialData) {
                // UPDATE existing client
                const { data, error } = await supabase
                    .from('so_clients')
                    .update({
                        name: formData.name,
                        phone: formData.phone
                    })
                    .eq('id', initialData.id)
                    .select()
                    .single()

                if (error) throw error
                if (data) {
                    toast.success("Cliente atualizado!")
                    onSuccess(data)
                }
            } else {
                // INSERT new client
                const { data, error } = await supabase
                    .from('so_clients')
                    .insert({
                        user_id: user.id,
                        name: formData.name,
                        phone: formData.phone
                    })
                    .select()
                    .single()

                if (error) throw error
                if (data) {
                    toast.success("Cliente cadastrado!")
                    onSuccess(data)
                }
            }
        } catch (error) {
            console.error("Erro ao salvar cliente:", error)
            toast.error(error instanceof Error ? error.message : "Erro ao salvar cliente")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    disabled={loading}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: 11 99999-9999"
                    disabled={loading}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={loading}
                >
                    {loading ? "Salvando..." : (initialData ? "Atualizar" : "Cadastrar")}
                </Button>
            </div>
        </div>
    )
}
