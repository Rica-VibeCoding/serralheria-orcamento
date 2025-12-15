
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, User, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import type { Client } from "@/types"
import { ClientForm } from "./client-form"

export function ClientList() {
    const { user } = useAuth()
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

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

    const handleSuccessCreate = (newClient: Client) => {
        setClients([...clients, newClient]) // Append is fine, or refetch
        setOpen(false)
    }

    const handleSuccessUpdate = (updatedClient: Client) => {
        setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c))
        setEditOpen(false)
        setSelectedClient(null)
    }

    const handleEditOpen = (client: Client) => {
        setSelectedClient(client)
        setEditOpen(true)
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
                        <ClientForm
                            onSuccess={handleSuccessCreate}
                            onCancel={() => setOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-1">
                {filteredClients.map((client) => (
                    <div
                        key={client.id}
                        className="group flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-all cursor-pointer active:scale-[0.99]"
                        onClick={() => handleEditOpen(client)}
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm leading-none truncate">{client.name}</span>
                                {client.phone && (
                                    <span className="text-[11px] text-muted-foreground leading-none mt-1 truncate">{client.phone}</span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleEditOpen(client)
                            }}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
                {filteredClients.length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
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
                    {selectedClient && (
                        <ClientForm
                            initialData={selectedClient}
                            onSuccess={handleSuccessUpdate}
                            onCancel={() => setEditOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
