"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Search, User, Plus, ArrowLeft } from "lucide-react"
import { ClientForm } from "@/components/forms/client-form"
import type { Client } from "@/types"

interface ClientSelectionModalProps {
    clients: Client[]
    onSelect: (client: Client) => void
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    trigger?: React.ReactNode
}

export function ClientSelectionModal({ clients, onSelect, isOpen, onOpenChange, trigger }: ClientSelectionModalProps) {
    const [view, setView] = useState<'search' | 'create'>('search')
    const [search, setSearch] = useState("")

    // Reset view when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setView('search')
                setSearch("")
            }, 300)
        }
    }, [isOpen])

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    )

    const handleClientSelect = (client: Client) => {
        onSelect(client)
        onOpenChange(false)
    }

    const handleSuccessCreate = (newClient: Client) => {
        onSelect(newClient)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        {view === 'create' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -ml-2 mr-1"
                                onClick={() => setView('search')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        {view === 'search' ? 'Novo Orçamento' : 'Novo Cliente'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4">
                    {view === 'search' ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cliente..."
                                    className="pl-9 h-12 text-base"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    Clientes Encontrados
                                </Label>

                                {filteredClients.length > 0 ? (
                                    <div className="grid gap-1">
                                        {filteredClients.map(client => (
                                            <div
                                                key={client.id}
                                                className="group flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-all cursor-pointer active:scale-[0.99]"
                                                onClick={() => handleClientSelect(client)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
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
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                        {search ? "Nenhum cliente encontrado." : "Digite para buscar..."}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="w-full h-12 text-base"
                                    variant="outline"
                                    onClick={() => setView('create')}
                                >
                                    <Plus className="mr-2 h-5 w-5" /> Cadastrar Novo Cliente
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <ClientForm
                            onSuccess={handleSuccessCreate}
                            onCancel={() => setView('search')}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
