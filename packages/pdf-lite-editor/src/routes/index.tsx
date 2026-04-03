import { createFileRoute } from '@tanstack/react-router'
import { PdfEditor } from '@/pages/PdfEditor'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <PdfEditor />
  )
}
