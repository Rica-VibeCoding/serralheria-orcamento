"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ClientSelectionModal } from "./client-selection-modal"
import type { Client } from "@/types"

interface NewQuoteButtonProps {
    clients: Client[]
    onNewQuote: (client: Client) => void
}

export function NewQuoteButton({ clients, onNewQuote }: NewQuoteButtonProps) {
    const [open, setOpen] = useState(false)

    const handleSelect = (client: Client) => {
        onNewQuote(client)
        // Dialog closes via onOpenChange inside Modal
    }

    return (
        <ClientSelectionModal
            clients={clients}
            onSelect={handleSelect}
            isOpen={open}
            onOpenChange={setOpen}
            trigger={
                <Button size="icon" className="h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-md">
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">Novo Orçamento</span>
                </Button>
            }
        />
    )
}
