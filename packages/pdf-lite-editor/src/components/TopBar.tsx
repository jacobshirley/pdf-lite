import { useState } from 'react'

const BTC_ADDRESS = 'YOUR_BTC_ADDRESS_HERE'
import { Button } from '@/components/shadcn/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/shadcn/dialog'
import { Coffee, Github, Info, AlertCircle, Mail, Bitcoin, Copy, Check } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export function TopBar() {
    const [aboutOpen, setAboutOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [btcOpen, setBtcOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyBtc = () => {
        navigator.clipboard.writeText(BTC_ADDRESS)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center justify-end gap-2 mb-3">
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shadow-sm"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Report an Issue</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="z-[100] max-w-sm rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold tracking-tight">
                            Report an Issue
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Found a bug or something not working as expected?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                        <p>
                            Please send the <strong className="text-slate-800 dark:text-slate-200">PDF file</strong> along with a description of the problem and the steps to reproduce it.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 justify-start"
                                asChild
                            >
                                <a href="mailto:jakeshirley2@gmail.com">
                                    <Mail className="h-4 w-4" />
                                    Email me
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 justify-start"
                                asChild
                            >
                                <a
                                    href="https://github.com/jacobshirley/pdf-lite/issues/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Github className="h-4 w-4" />
                                    Raise a GitHub issue
                                </a>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                            PDF Zero
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

            <Dialog open={btcOpen} onOpenChange={setBtcOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200 dark:hover:bg-orange-900 shadow-sm"
                    >
                        <Bitcoin className="h-4 w-4" />
                        <span className="hidden sm:inline">Bitcoin</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="z-[100] max-w-sm rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold tracking-tight">
                            Donate Bitcoin
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            Send BTC to support development
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-[13px]">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                            <span className="flex-1 font-mono text-xs break-all text-slate-700 dark:text-slate-300 select-all">
                                {BTC_ADDRESS}
                            </span>
                            <button
                                onClick={copyBtc}
                                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                title="Copy address"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ThemeToggle />
        </div>
    )
}
