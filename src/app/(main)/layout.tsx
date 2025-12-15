"use client"

import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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

    const handleLogout = async () => {
        const toastId = toast.loading("Saindo...")
        await supabase.auth.signOut()
        toast.success("Logout realizado com sucesso!", { id: toastId })
        router.push("/login")
    }

    return (
        <div className="flex min-h-screen flex-col bg-background pb-20">
            <header className="sticky top-0 z-40 bg-background/80 px-6 py-4 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-primary">Serralheria Pro</h1>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                                <AlertDialogDescription>
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
