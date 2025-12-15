
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import { ProfileSchema } from "@/lib/validations"
import type { MetalonProfile } from "@/types"

export function ProfilesList() {
    const { user } = useAuth()
    const [profiles, setProfiles] = useState<MetalonProfile[]>([])
    const [open, setOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newProfile, setNewProfile] = useState<Partial<MetalonProfile>>({
        nome: '',
        espessura: '',
        custo_por_metro: 0
    })
    const [selectedProfile, setSelectedProfile] = useState<MetalonProfile | null>(null)
    const [editProfile, setEditProfile] = useState<Partial<MetalonProfile>>({
        nome: '',
        espessura: '',
        custo_por_metro: 0
    })

    useEffect(() => {
        if (!user) return
        fetchProfiles()
    }, [user])

    async function fetchProfiles() {
        const { data, error } = await supabase
            .from('so_profiles_metalon')
            .select('*')
            .eq('user_id', user!.id)
            .order('nome', { ascending: true })

        if (data) setProfiles(data)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('so_profiles_metalon').delete().eq('id', id)
        if (error) {
            toast.error("Erro ao apagar: " + error.message)
        } else {
            setProfiles(profiles.filter(p => p.id !== id))
            toast.success("Perfil removido.")
        }
    }

    const handleAdd = async () => {
        if (!newProfile.nome || !newProfile.custo_por_metro || !user) {
            toast.error("Preencha nome e custo.")
            return
        }

        // Validate with Zod
        const validation = ProfileSchema.safeParse({
            nome: newProfile.nome,
            espessura: newProfile.espessura || '',
            custo_por_metro: newProfile.custo_por_metro
        })

        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        setLoading(true)
        const { data, error } = await supabase.from('so_profiles_metalon').insert({
            user_id: user.id,
            nome: newProfile.nome,
            espessura: newProfile.espessura,
            custo_por_metro: newProfile.custo_por_metro
        }).select()

        if (error) {
            toast.error(error.message)
        } else if (data) {
            setProfiles([...profiles, data[0]])
            setOpen(false)
            setNewProfile({ nome: '', espessura: '', custo_por_metro: 0 })
            toast.success("Perfil adicionado!")
        }
        setLoading(false)
    }

    const handleEditOpen = (profile: MetalonProfile) => {
        setSelectedProfile(profile)
        setEditProfile({
            nome: profile.nome,
            espessura: profile.espessura || '',
            custo_por_metro: profile.custo_por_metro
        })
        setEditOpen(true)
    }

    const handleEdit = async () => {
        if (!editProfile.nome || !editProfile.custo_por_metro || !selectedProfile || !user) {
            toast.error("Preencha nome e custo.")
            return
        }

        // Validate with Zod
        const validation = ProfileSchema.safeParse({
            nome: editProfile.nome,
            espessura: editProfile.espessura || '',
            custo_por_metro: editProfile.custo_por_metro
        })

        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            return
        }

        setLoading(true)
        const { data, error } = await supabase
            .from('so_profiles_metalon')
            .update({
                nome: editProfile.nome,
                espessura: editProfile.espessura,
                custo_por_metro: editProfile.custo_por_metro
            })
            .eq('id', selectedProfile.id)
            .select()

        if (error) {
            toast.error(error.message)
        } else if (data) {
            setProfiles(profiles.map(p => p.id === selectedProfile.id ? data[0] : p))
            setEditOpen(false)
            setSelectedProfile(null)
            setEditProfile({ nome: '', espessura: '', custo_por_metro: 0 })
            toast.success("Perfil atualizado!")
        }
        setLoading(false)
    }

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Perfis de Metalon</CardTitle>
                    <CardDescription>Gerencie seus materiais.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Perfil</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome (ex: 30x20)</Label>
                                <Input
                                    value={newProfile.nome}
                                    onChange={e => setNewProfile({ ...newProfile, nome: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Espessura (ex: #18)</Label>
                                <Input
                                    value={newProfile.espessura || ''}
                                    onChange={e => setNewProfile({ ...newProfile, espessura: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Custo Reais/Metro</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={newProfile.custo_por_metro}
                                    onChange={e => setNewProfile({ ...newProfile, custo_por_metro: parseFloat(e.target.value) })}
                                />
                            </div>
                            <Button onClick={handleAdd} className="w-full" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Custo/m</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles.map((profile) => (
                            <TableRow key={profile.id}>
                                <TableCell>
                                    <div className="font-medium">{profile.nome}</div>
                                    <div className="text-xs text-muted-foreground">{profile.espessura}</div>
                                </TableCell>
                                <TableCell>R$ {profile.custo_por_metro.toFixed(2)}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditOpen(profile)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(profile.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Edit Profile Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome (ex: 30x20)</Label>
                            <Input
                                value={editProfile.nome}
                                onChange={e => setEditProfile({ ...editProfile, nome: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Espessura (ex: #18)</Label>
                            <Input
                                value={editProfile.espessura || ''}
                                onChange={e => setEditProfile({ ...editProfile, espessura: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Custo Reais/Metro</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={editProfile.custo_por_metro}
                                onChange={e => setEditProfile({ ...editProfile, custo_por_metro: parseFloat(e.target.value) })}
                            />
                        </div>
                        <Button onClick={handleEdit} className="w-full" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
