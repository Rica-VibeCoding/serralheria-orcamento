
import { ClientList } from "@/components/forms/client-list"

export default function ClientsPage() {
    return (
        <div className="space-y-4">
            {/* Container com fundo degradê metálico */}
            <div className="bg-gradient-to-br from-slate-200 via-slate-100 to-zinc-200 border border-slate-300/60 rounded-xl p-4 shadow-lg">
                <h2 className="text-lg font-bold tracking-tight text-slate-700">Meus Clientes</h2>
                <p className="text-sm text-slate-500">Gerencie seus contatos.</p>
            </div>
            {/* Cards brancos com sombra */}
            <ClientList />
        </div>
    )
}
