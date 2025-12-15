
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, User, Pencil } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import { ClientSchema } from "@/lib/validations"
import type { Client } from "@/types"

export function ClientList() {
    const { user } = useAuth()
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newClient, setNewClient] = useState({ name: '', phone: '' })
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [editClient, setEditClient] = useState({ name: '', phone: '' })

    useEffect(() => {
        if (!user) return
        fetchClients()
    }, [user])

    async function fetchClients() {
        const { data } = await supabase
            .from('so_clients')
            .select('*')
            .eq('user_id', user!.id)
            .order('name', { ascending: true })

        if (data) setClients(data)
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    )

    const handleAdd = async () => {
        if (!newClient.name || !user) {
            toast.error("Nome é obrigatório")
            return
        }

        // Validate with Zod
        const validation = ClientSchema.safeParse({
            name: newClient.name,
            phone: newClient.phone || ''
        })

        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        setLoading(true)
        const { data, error } = await supabase.from('so_clients').insert({
            user_id: user.id,
            name: newClient.name,
            phone: newClient.phone
        }).select()

        if (error) {
            toast.error(error.message)
        } else if (data) {
            setClients([...clients, data[0]])
            setOpen(false)
            setNewClient({ name: '', phone: '' })
            toast.success("Cliente adicionado!")
        }
        setLoading(false)
    }

    const handleEditOpen = (client: Client) => {
        setSelectedClient(client)
        setEditClient({ name: client.name, phone: client.phone || '' })
        setEditOpen(true)
    }

    const handleEdit = async () => {
        if (!editClient.name || !selectedClient || !user) {
            toast.error("Nome é obrigatório")
            return
        }

        // Validate with Zod
        const validation = ClientSchema.safeParse({
            name: editClient.name,
            phone: editClient.phone || ''
        })

        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        setLoading(true)
        const { data, error } = await supabase
            .from('so_clients')
            .update({
                name: editClient.name,
                phone: editClient.phone
            })
            .eq('id', selectedClient.id)
            .select()

        if (error) {
            toast.error(error.message)
        } else if (data) {
            setClients(clients.map(c => c.id === selectedClient.id ? data[0] : c))
            setEditOpen(false)
            setSelectedClient(null)
            setEditClient({ name: '', phone: '' })
            toast.success("Cliente atualizado!")
        }
        setLoading(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar clientes..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon"><Plus className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                    placeholder="Ex: João da Silva"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone / WhatsApp</Label>
                                <Input
                                    value={newClient.phone}
                                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                    placeholder="Ex: 11 99999-9999"
                                />
                            </div>
                            <Button onClick={handleAdd} className="w-full" disabled={loading}>
                                {loading ? "Cadastrando..." : "Cadastrar"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {filteredClients.map((client) => (
                    <Card key={client.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="flex items-center p-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{client.name}</div>
                                <div className="text-sm text-muted-foreground">{client.phone}</div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditOpen(client)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Nenhum cliente encontrado.
                    </div>
                )}
            </div>

            {/* Edit Client Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input
                                value={editClient.name}
                                onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                                placeholder="Ex: João da Silva"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone / WhatsApp</Label>
                            <Input
                                value={editClient.phone}
                                onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                                placeholder="Ex: 11 99999-9999"
                            />
                        </div>
                        <Button onClick={handleEdit} className="w-full" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
