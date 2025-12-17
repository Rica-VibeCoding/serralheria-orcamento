"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/use-auth"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Extrai iniciais do email (ex: "joao.silva@email.com" → "JS")
function getInitials(email: string): string {
    const name = email.split('@')[0] // pega parte antes do @
    const parts = name.split(/[._-]/) // divide por . _ ou -

    if (parts.length >= 2) {
        // Se tem nome.sobrenome, pega primeira letra de cada
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    // Se é só um nome, pega as 2 primeiras letras
    return name.slice(0, 2).toUpperCase()
}

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { user } = useAuth()
    const [mounted, setMounted] = useState(false)

    // Evita hydration mismatch - só renderiza conteúdo dinâmico após montar no cliente
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = async () => {
        const toastId = toast.loading("Saindo...")
        await supabase.auth.signOut()
        toast.success("Logout realizado com sucesso!", { id: toastId })
        router.push("/login")
    }

    const initials = user?.email ? getInitials(user.email) : "?"

    return (
        <div className="flex min-h-screen flex-col bg-background pb-20">
            <header className="sticky top-0 z-40 bg-background/80 px-4 py-3 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h1 className="text-lg font-bold tracking-tight text-primary whitespace-nowrap">Serralheria Pro</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Avatar com iniciais - só renderiza após montar no cliente */}
                        {mounted && user?.email && (
                            <div
                                className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600"
                                title={user.email}
                            >
                                {initials}
                            </div>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div>
                                            {mounted && user?.email && (
                                                <span className="block mb-2 font-medium text-foreground">
                                                    {user.email}
                                                </span>
                                            )}
                                            <span>Tem certeza que deseja sair do sistema?</span>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout}>
                                        Sair
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </header>
            <main className="flex-1 px-4 py-6 bg-slate-50/50">
                <div className="mx-auto max-w-md">
                    {children}
                </div>
            </main>
            <MainNav />
        </div>
    )
}
