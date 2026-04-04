import { Editor } from '@monaco-editor/react'
import { useEffect, useState } from 'react'

export interface PdfTextEditorProps {
    content: string
    className?: string
    readOnly?: boolean
    onChange?: (value: string | undefined) => void
}

export function PdfTextEditor({ content, className = '', readOnly = true, onChange }: PdfTextEditorProps) {
    const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('light')

    // Detect system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        setEditorTheme(mediaQuery.matches ? 'vs-dark' : 'light')

        const handler = (e: MediaQueryListEvent) => {
            setEditorTheme(e.matches ? 'vs-dark' : 'light')
        }

        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    return (
        <div className={`rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
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
