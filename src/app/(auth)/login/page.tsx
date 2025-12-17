
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertCircle, Mail, UserPlus, LogIn, Loader2 } from "lucide-react"

function traduzirErroSupabase(mensagem: string): string {
    const traducoes: Record<string, string> = {
        "Invalid login credentials": "Email ou senha incorretos. Verifique e tente novamente.",
        "Email not confirmed": "Você ainda não confirmou seu email. Verifique sua caixa de entrada.",
        "User already registered": "Este email já está cadastrado. Use 'Já tenho conta'.",
        "Password should be at least 6 characters": "A senha precisa ter pelo menos 6 letras ou números.",
        "Unable to validate email address: invalid format": "Este email não parece estar correto.",
        "Signup requires a valid password": "Digite uma senha para continuar.",
        "To signup, please provide your email": "Digite seu email para continuar.",
    }
    return traducoes[mensagem] || mensagem
}

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [verificandoSessao, setVerificandoSessao] = useState(true)
    const [contaCriada, setContaCriada] = useState(false)
    const [modo, setModo] = useState<"criar" | "entrar">("criar")
    const router = useRouter()

    // Verifica se já tem sessão ativa ou se já logou antes
    useEffect(() => {
        const verificarSessao = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                // Já tem sessão ativa, vai direto pro app
                router.push("/quote")
                return
            }

            // Verifica se já logou antes (para mostrar aba correta)
            const jaLogouAntes = localStorage.getItem("serralheria-ja-logou")
            if (jaLogouAntes) {
                setModo("entrar")
            }

            setVerificandoSessao(false)
        }

        verificarSessao()
    }, [router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error("Preencha o email e a senha", {
                icon: <AlertCircle className="h-5 w-5" />,
            })
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error(traduzirErroSupabase(error.message), {
                icon: <AlertCircle className="h-5 w-5" />,
                duration: 5000,
            })
        } else {
            // Salva que o usuário já logou antes
            localStorage.setItem("serralheria-ja-logou", "true")
            toast.success("Bem-vindo de volta!")
            router.push("/quote")
        }
        setLoading(false)
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error("Preencha o email e a senha", {
                icon: <AlertCircle className="h-5 w-5" />,
            })
            return
        }

        if (password.length < 6) {
            toast.error("A senha precisa ter pelo menos 6 letras ou números", {
                icon: <AlertCircle className="h-5 w-5" />,
            })
            return
        }

        setLoading(true)
        const { error, data } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            toast.error(traduzirErroSupabase(error.message), {
                icon: <AlertCircle className="h-5 w-5" />,
                duration: 5000,
            })
        } else if (data.user?.identities?.length === 0) {
            toast.error("Este email já está cadastrado. Use 'Já tenho conta'.", {
                icon: <AlertCircle className="h-5 w-5" />,
                duration: 5000,
            })
        } else {
            setContaCriada(true)
        }
        setLoading(false)
    }

    // Tela de loading enquanto verifica sessão
    if (verificandoSessao) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        )
    }

    if (contaCriada) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <Mail className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Conta criada!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <AlertTitle className="text-green-800 text-base">Quase lá!</AlertTitle>
                            <AlertDescription className="text-green-700 text-base">
                                Enviamos um link para <strong>{email}</strong>.
                                Abra seu email e clique no link para ativar sua conta.
                            </AlertDescription>
                        </Alert>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                            <p className="text-amber-800 text-sm">
                                <strong>Não achou o email?</strong> Olhe na pasta de spam ou lixo eletrônico.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full h-12 text-base"
                            onClick={() => {
                                setContaCriada(false)
                                setModo("entrar")
                            }}
                        >
                            Já confirmei, quero entrar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">Orçamentos Fácil</CardTitle>
                    <CardDescription className="text-base">
                        Crie orçamentos profissionais em minutos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Abas de seleção */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                        <button
                            type="button"
                            onClick={() => setModo("criar")}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                                modo === "criar"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <UserPlus className="h-4 w-4" />
                            Criar conta
                        </button>
                        <button
                            type="button"
                            onClick={() => setModo("entrar")}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                                modo === "entrar"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <LogIn className="h-4 w-4" />
                            Já tenho conta
                        </button>
                    </div>

                    <form onSubmit={modo === "criar" ? handleSignUp : handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Seu email</label>
                            <Input
                                type="email"
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="h-12 text-base"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {modo === "criar" ? "Crie uma senha" : "Sua senha"}
                            </label>
                            <Input
                                type="password"
                                placeholder={modo === "criar" ? "Mínimo 6 caracteres" : "Digite sua senha"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="h-12 text-base"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 text-base"
                        >
                            {loading ? (
                                "Aguarde..."
                            ) : modo === "criar" ? (
                                <>
                                    <UserPlus className="h-5 w-5 mr-2" />
                                    Criar minha conta
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5 mr-2" />
                                    Entrar
                                </>
                            )}
                        </Button>
                    </form>

                    {modo === "criar" && (
                        <p className="text-center text-sm text-muted-foreground">
                            É rápido e gratuito!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
