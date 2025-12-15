"use client"

import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
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

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { user } = useAuth()

    const handleLogout = async () => {
        const toastId = toast.loading("Saindo...")
        await supabase.auth.signOut()
        toast.success("Logout realizado com sucesso!", { id: toastId })
        router.push("/login")
    }

    return (
        <div className="flex min-h-screen flex-col bg-background pb-20">
            <header className="sticky top-0 z-40 bg-background/80 px-4 py-3 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h1 className="text-lg font-bold tracking-tight text-primary whitespace-nowrap">Serralheria Pro</h1>
                        {user?.email && (
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                            </div>
                        )}
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {user?.email && (
                                        <span className="block mb-2 font-medium text-foreground">
                                            {user.email}
                                        </span>
                                    )}
                                    Tem certeza que deseja sair do sistema?
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
            </header>
            <main className="flex-1 px-4 py-6">
                <div className="mx-auto max-w-md">
                    {children}
                </div>
            </main>
            <MainNav />
        </div>
    )
}
