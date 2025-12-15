import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Client, MetalonProfile, Markup, Configuration } from "@/types"

interface UseQuoteDataResult {
    config: Configuration
    allClients: Client[]
    setAllClients: React.Dispatch<React.SetStateAction<Client[]>>
    allProfiles: MetalonProfile[]
    allMarkups: Markup[]
    isLoading: boolean
}

const DEFAULT_CONFIG: Configuration = {
    id: '', user_id: '',
    valor_por_corte: 5, valor_por_solda: 10, valor_por_km: 2.5,
    percentual_pintura_default: 15, validade_padrao: 15
}

export function useQuoteData(userId: string | undefined): UseQuoteDataResult {
    const [isLoading, setIsLoading] = useState(true)
    const [config, setConfig] = useState<Configuration>(DEFAULT_CONFIG)
    const [allClients, setAllClients] = useState<Client[]>([])
    const [allProfiles, setAllProfiles] = useState<MetalonProfile[]>([])
    const [allMarkups, setAllMarkups] = useState<Markup[]>([])

    useEffect(() => {
        if (!userId) return

        async function fetchData() {
            try {
                const [confRes, clsRes, profsRes, marksRes] = await Promise.all([
                    supabase.from('so_configurations').select('*').eq('user_id', userId).single(),
                    supabase.from('so_clients').select('*').eq('user_id', userId),
                    supabase.from('so_profiles_metalon').select('*').eq('user_id', userId),
                    supabase.from('so_markups').select('*').eq('user_id', userId)
                ])

                console.log("📊 Quote data fetched:", {
                    config: confRes.data ? "✅" : "❌",
                    clients: clsRes.data?.length || 0,
                    profiles: profsRes.data?.length || 0,
                    markups: marksRes.data?.length || 0,
                    profilesError: profsRes.error,
                })

                if (confRes.data) setConfig(confRes.data)
                if (clsRes.data) setAllClients(clsRes.data)
                if (profsRes.data) setAllProfiles(profsRes.data)
                if (marksRes.data) setAllMarkups(marksRes.data)
            } catch (error) {
                console.error("Error fetching quote data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [userId])

    return {
        config,
        allClients,
        setAllClients,
        allProfiles,
        allMarkups,
        isLoading
    }
}
