import { useState } from 'react'
import { Button } from '@/components/shadcn/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/shadcn/dialog'
import { Coffee, Github, Info } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export function TopBar() {
    const [aboutOpen, setAboutOpen] = useState(false)

    return (
        <div className="flex items-center justify-end gap-2 mb-3">
            <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shadow-sm"
                    >
                        <Info className="h-4 w-4" />
                        <span className="hidden sm:inline">About</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="z-[100] max-w-sm rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold tracking-tight">
                            FOSS PDF Editor
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Free, private, client-side PDF editing
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                        <p>
                            Your documents stay on <strong className="text-slate-800 dark:text-slate-200">your device</strong>. No uploads, no servers, no tracking.
                        </p>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 space-y-1.5">
                            <p className="font-medium text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wide">Features</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                                <li>Add, edit &amp; remove AcroForm fields</li>
                                <li>Add, edit &amp; remove embedded text</li>
                                <li>Export with optional encryption</li>
                                <li>Full undo/redo support</li>
                            </ul>
                        </div>
                        <p>
                            <strong className="text-slate-800 dark:text-slate-200">MIT License — free forever.</strong>{' '}
                            No premium tiers, no paywalls.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Built on{' '}
                            <a
                                href="https://github.com/jacobshirley/pdf-lite"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                                pdf-lite
                            </a>
                            {' '}— contributions welcome.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shadow-sm"
                asChild
            >
                <a
                    href="https://github.com/jacobshirley/pdf-lite"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Github className="h-4 w-4" />
                    <span className="hidden sm:inline">GitHub</span>
                </a>
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="gap-1.5 bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900 shadow-sm"
                asChild
            >
                <a
                    href="https://www.buymeacoffee.com/jacobshirley"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Coffee className="h-4 w-4" />
                    <span className="hidden sm:inline">Buy Me a Coffee</span>
                </a>
            </Button>

            <ThemeToggle />
        </div>
    )
}
