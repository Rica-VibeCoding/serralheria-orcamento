
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calculator, Users, Settings, FileText } from "lucide-react"

export function MainNav() {
    const pathname = usePathname()

    const items = [
        {
            title: "Orçamento",
            href: "/quote",
            icon: Calculator,
        },
        {
            title: "Histórico",
            href: "/quotes",
            icon: FileText,
        },
        {
            title: "Clientes",
            href: "/clients",
            icon: Users,
        },
        {
            title: "Config",
            href: "/config",
            icon: Settings,
        },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-2">
            <div className="mx-auto flex max-w-md items-center justify-around">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center space-y-1 rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            pathname?.startsWith(item.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                    </Link>
                ))}
            </div>
        </nav>
    )
}
