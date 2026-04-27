import { X, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'

export default function ConfirmModal() {
  const deleteConfirmId = useStore((state) => state.deleteConfirmId)
  const cancelDeleteSite = useStore((state) => state.cancelDeleteSite)
  const removeSite = useStore((state) => state.removeSite)

  if (!deleteConfirmId) return null

  const handleConfirm = () => {
    removeSite(deleteConfirmId)
    cancelDeleteSite()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop" onClick={cancelDeleteSite}>
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Trash2 size={18} className="text-red-500" />
            Excluir site
          </h2>
          <button onClick={cancelDeleteSite} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-muted text-sm mb-6">
          Tem certeza que deseja excluir este site? Essa ação não pode ser desfeita.
        </p>

        <div className="flex gap-3">
          <button
            onClick={cancelDeleteSite}
            className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-muted hover:text-text transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
