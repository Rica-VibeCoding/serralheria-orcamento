
"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Login realizado com sucesso!")
            router.push("/quote")
        }
        setLoading(false)
    }

    const handleSignUp = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("Verifique seu email para confirmar o cadastro!")
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Entrar</CardTitle>
                    <CardDescription>Acesse sua conta para gerar orçamentos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Carregando..." : "Entrar"}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleSignUp} disabled={loading}>
                                Cadastrar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
