"use client"

import { useState, useRef, useCallback, ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface PullToRefreshProps {
    onRefresh: () => Promise<void>
    children: ReactNode
    className?: string
}

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
    const [isPulling, setIsPulling] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const startY = useRef(0)
    const currentY = useRef(0)

    const THRESHOLD = 80 // Distância mínima para ativar refresh
    const MAX_PULL = 120 // Distância máxima de pull

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const container = containerRef.current
        if (!container || isRefreshing) return

        // Só ativa se estiver no topo da página
        if (container.scrollTop === 0) {
            startY.current = e.touches[0].clientY
            setIsPulling(true)
        }
    }, [isRefreshing])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return

        currentY.current = e.touches[0].clientY
        const distance = currentY.current - startY.current

        if (distance > 0) {
            // Aplica resistência para efeito mais natural
            const resistance = Math.min(distance * 0.5, MAX_PULL)
            setPullDistance(resistance)
        }
    }, [isPulling, isRefreshing])

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return

        setIsPulling(false)

        if (pullDistance >= THRESHOLD && !isRefreshing) {
            setIsRefreshing(true)
            setPullDistance(60) // Mantém indicador visível

            try {
                await onRefresh()
            } finally {
                setIsRefreshing(false)
                setPullDistance(0)
            }
        } else {
            setPullDistance(0)
        }
    }, [isPulling, pullDistance, isRefreshing, onRefresh])

    return (
        <div
            ref={containerRef}
            className={`relative overflow-auto ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Indicador de refresh */}
            <div
                className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 ease-out z-10"
                style={{
                    top: -50,
                    transform: `translateY(${pullDistance}px)`,
                    opacity: pullDistance > 20 ? 1 : 0,
                }}
            >
                <div className="bg-background border rounded-full p-2 shadow-md">
                    <Loader2
                        className={`h-5 w-5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
                        style={{
                            transform: isRefreshing ? "none" : `rotate(${pullDistance * 3}deg)`,
                        }}
                    />
                </div>
            </div>

            {/* Conteúdo */}
            <div
                className="transition-transform duration-200 ease-out"
                style={{
                    transform: `translateY(${pullDistance > 0 ? pullDistance * 0.3 : 0}px)`,
                }}
            >
                {children}
            </div>
        </div>
    )
}
