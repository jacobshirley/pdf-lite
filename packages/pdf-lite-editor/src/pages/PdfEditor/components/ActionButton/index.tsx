import React from 'react'
import { Button } from '@/components/shadcn/button'

type Props = {
    label: string
    icon: React.ComponentType<{ className?: string }>
    wide?: boolean
}

export function ActionButton({ label, icon: Icon, wide = false }: Props) {
    return (
        <Button
            type="button"
            variant="outline"
            className={`rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 active:scale-[0.98] ${wide ? 'col-span-2' : ''}`}
        >
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    )
}
