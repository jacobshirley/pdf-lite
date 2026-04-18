import { Editor } from '@monaco-editor/react'
import { useEffect, useState } from 'react'

export interface PdfTextEditorProps {
    content: string
    className?: string
    readOnly?: boolean
    onChange?: (value: string | undefined) => void
}

export function PdfTextEditor({ content, className = '', readOnly = true, onChange }: PdfTextEditorProps) {
    const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>(() =>
        document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'
    )

    // Sync with .dark class on <html> (set by ThemeToggle)
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setEditorTheme(
                document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'
            )
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    return (
        <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
            <Editor
                height="70vh"
                defaultLanguage="plaintext"
                value={content}
                onChange={onChange}
                theme={editorTheme}
                options={{
                    readOnly,
                    minimap: { enabled: true },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    fontFamily: 'Monaco, "Courier New", monospace',
                }}
            />
        </div>
    )
}
