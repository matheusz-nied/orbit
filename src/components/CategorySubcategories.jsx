import { useState } from 'react'
import { Plus, Trash2, X, CornerDownRight } from 'lucide-react'
import useStore from '../store/useStore'

const EMPTY = []

// Linha de uma categoria nas Configurações, com suas subcategorias.
export default function CategorySubcategories({ category, onRemoveCategory }) {
  const subcategories = useStore((state) => state.subcategories[category] || EMPTY)
  const addSubcategory = useStore((state) => state.addSubcategory)
  const removeSubcategory = useStore((state) => state.removeSubcategory)

  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    if (!draft.trim()) return
    addSubcategory(category, draft)
    setDraft('')
  }

  return (
    <div className="p-3 bg-bg border border-border rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-text capitalize">{category}</span>
        <button
          onClick={onRemoveCategory}
          className="text-muted hover:text-red-500 transition-colors"
          aria-label={`Remover categoria ${category}`}
          title="Remover categoria"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <CornerDownRight size={13} className="text-muted opacity-60 shrink-0" aria-hidden />

        {subcategories.map(sub => (
          <span
            key={sub}
            className="flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full border border-border text-xs text-text"
          >
            {sub}
            <button
              onClick={() => removeSubcategory(category, sub)}
              className="p-0.5 text-muted hover:text-red-500 transition-colors"
              aria-label={`Remover subcategoria ${sub}`}
              title="Remover subcategoria"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        <div className="flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full border border-dashed border-border focus-within:border-accent transition-colors">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            maxLength={32}
            placeholder="Nova subcategoria"
            className="w-28 bg-transparent text-xs text-text placeholder-muted outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="p-0.5 text-muted hover:text-accent transition-colors disabled:opacity-40"
            aria-label="Adicionar subcategoria"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
