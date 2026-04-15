import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shadcn/dialog'
import { Button } from '@/components/shadcn/button'
import { Input } from '@/components/shadcn/input'
import { Label } from '@/components/shadcn/label'

interface ExportPasswordDialogProps {
    open: boolean
    onExport: (password: string, ownerPassword?: string) => void
    onCancel: () => void
}

export function ExportPasswordDialog({ open, onExport, onCancel }: ExportPasswordDialogProps) {
    const [password, setPassword] = useState('')
    const [ownerPassword, setOwnerPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showOwnerPassword, setShowOwnerPassword] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (password.trim()) {
            onExport(password, ownerPassword.trim() || undefined)
            setPassword('')
            setOwnerPassword('')
            setShowPassword(false)
            setShowOwnerPassword(false)
        }
    }

    const handleCancel = () => {
        setPassword('')
        setOwnerPassword('')
        setShowPassword(false)
        setShowOwnerPassword(false)
        onCancel()
    }

    const handleExportWithoutPassword = () => {
        onExport('', undefined)
        setPassword('')
        setOwnerPassword('')
        setShowPassword(false)
        setShowOwnerPassword(false)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Export PDF</DialogTitle>
                        <DialogDescription>
                            Optionally password-protect the exported PDF. Leave blank to export without password protection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="export-password">User Password (optional)</Label>
                            <div className="relative">
                                <Input
                                    id="export-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter user password"
                                    className="pr-10"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="export-owner-password">Owner Password (optional)</Label>
                            <div className="relative">
                                <Input
                                    id="export-owner-password"
                                    type={showOwnerPassword ? 'text' : 'password'}
                                    value={ownerPassword}
                                    onChange={(e) => setOwnerPassword(e.target.value)}
                                    placeholder="Enter owner password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showOwnerPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Owner password allows full permissions. User password restricts permissions.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleExportWithoutPassword}>
                            Export Without Password
                        </Button>
                        <Button type="submit" disabled={!password.trim()}>
                            Export With Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
