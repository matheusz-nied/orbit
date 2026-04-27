import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import useStore from '../store/useStore'

export default function Toast() {
  const { toast, clearToast } = useStore()

  useEffect(() => {
    if (!toast) return undefined

    const timeout = setTimeout(() => {
      clearToast()
    }, 3200)

    return () => clearTimeout(timeout)
  }, [toast, clearToast])

  if (!toast) return null

  const isError = toast.type === 'error'
  const Icon = isError ? AlertCircle : CheckCircle2

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-4 w-full max-w-md">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md ${
          isError
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-card/95 border-border text-text'
        }`}
        role="status"
        aria-live="polite"
      >
        <Icon size={18} className={isError ? 'text-red-400' : 'text-accent'} />
        <p className="flex-1 text-sm">{toast.message}</p>
        <button
          onClick={clearToast}
          className="text-muted hover:text-text transition-colors"
          aria-label="Fechar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
