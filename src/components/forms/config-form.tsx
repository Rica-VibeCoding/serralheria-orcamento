
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Configuration } from "@/types"

export function ConfigForm() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState<Partial<Configuration>>({
        valor_por_corte: 5.00,
        valor_por_solda: 10.00,
        valor_por_km: 2.50,
        percentual_pintura_default: 15,
        validade_padrao: 15
    })

    useEffect(() => {
        if (!user) return

        async function fetchConfig() {
            const { data, error } = await supabase
                .from('so_configurations')
                .select('*')
                .eq('user_id', user!.id)
                .single()

            if (data) {
                setConfig(data)
            } else if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
                console.error(error)
            }
        }
        fetchConfig()
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setConfig(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        // Check if exists using id or user_id
        // Since we have user_id unique constraint, we can upsert by user_id
        const payload = { ...config, user_id: user.id }

        // Remove id if it's undefined to let postgres gen it, or keep it if updating
        if (!payload.id) delete payload.id

        const { error } = await supabase
            .from('so_configurations')
            .upsert(payload, { onConflict: 'user_id' })

        if (error) {
            toast.error("Erro ao salvar: " + error.message)
        } else {
            toast.success("Configurações salvas com sucesso!")
        }

        setLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>Defina os valores padrão para seus orçamentos.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="valor_por_corte">Custo Corte (R$)</Label>
                            <Input
                                id="valor_por_corte"
                                name="valor_por_corte"
                                type="number"
                                step="0.01"
                                value={config.valor_por_corte}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="valor_por_solda">Custo Solda (R$)</Label>
                            <Input
                                id="valor_por_solda"
                                name="valor_por_solda"
                                type="number"
                                step="0.01"
                                value={config.valor_por_solda}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="valor_por_km">Valor KM (R$)</Label>
                            <Input
                                id="valor_por_km"
                                name="valor_por_km"
                                type="number"
                                step="0.01"
                                value={config.valor_por_km}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="percentual_pintura_default">Pintura (%)</Label>
                            <Input
                                id="percentual_pintura_default"
                                name="percentual_pintura_default"
                                type="number"
                                step="1"
                                value={config.percentual_pintura_default}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="validade_padrao">Validade Padrão (Dias)</Label>
                        <Input
                            id="validade_padrao"
                            name="validade_padrao"
                            type="number"
                            value={config.validade_padrao}
                            onChange={handleChange}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Salvando..." : "Salvar Configurações"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
