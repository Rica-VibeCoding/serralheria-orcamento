
import { ClientList } from "@/components/forms/client-list"

export default function ClientsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">Meus Clientes</h2>
                <p className="text-sm text-muted-foreground">Gerencie seus contatos.</p>
            </div>
            <ClientList />
        </div>
    )
}
