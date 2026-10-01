import { useState } from 'react'
import { Plus, Trash2, X, CornerDownRight, Pencil, Check } from 'lucide-react'
import useStore from '../store/useStore'
import { selectSubcategories } from '../utils/categories'

// Campo de renomear no lugar: Enter confirma, Esc cancela.
function RenameInput({ initial, maxLength, className, onSubmit, onCancel }) {
  const [value, setValue] = useState(initial)
  const [invalid, setInvalid] = useState(false)

  const submit = () => {
    if (onSubmit(value) === null) setInvalid(true)
  }

  return (
    <span className="flex items-center gap-1">
      <input
        autoFocus
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={e => { setValue(e.target.value); setInvalid(false) }}
        onFocus={e => e.target.select()}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        aria-invalid={invalid}
        title={invalid ? 'Nome vazio ou já existente' : undefined}
        className={`bg-transparent text-text outline-none border-b ${invalid ? 'border-red-500' : 'border-accent'} ${className}`}
      />
      <button
        onClick={submit}
        className="p-0.5 text-muted hover:text-accent transition-colors"
        aria-label="Confirmar nome"
        title="Confirmar"
      >
        <Check size={13} />
      </button>
      <button
        onClick={onCancel}
        className="p-0.5 text-muted hover:text-text transition-colors"
        aria-label="Cancelar edição"
        title="Cancelar"
      >
        <X size={13} />
      </button>
    </span>
  )
}

// Linha de uma categoria nas Configurações, com suas subcategorias.
export default function CategorySubcategories({ category, onRemoveCategory }) {
  const subcategories = useStore(selectSubcategories(category))
  const addSubcategory = useStore((state) => state.addSubcategory)
  const removeSubcategory = useStore((state) => state.removeSubcategory)
  const renameCategory = useStore((state) => state.renameCategory)
  const renameSubcategory = useStore((state) => state.renameSubcategory)

  const [draft, setDraft] = useState('')
  const [renamingCategory, setRenamingCategory] = useState(false)
  const [renamingSub, setRenamingSub] = useState(null)

  const handleAdd = () => {
    if (!draft.trim()) return
    addSubcategory(category, draft)
    setDraft('')
  }

  const submitCategory = (value) => {
    const result = renameCategory(category, value)
    if (result !== null) setRenamingCategory(false)
    return result
  }

  const submitSub = (sub, value) => {
    const result = renameSubcategory(category, sub, value)
    if (result !== null) setRenamingSub(null)
    return result
  }

  return (
    <div className="p-3 bg-bg border border-border rounded-lg">
      <div className="flex items-center justify-between gap-2">
        {renamingCategory ? (
          <RenameInput
            initial={category}
            maxLength={32}
            className="w-40 text-sm font-medium"
            onSubmit={submitCategory}
            onCancel={() => setRenamingCategory(false)}
          />
        ) : (
          <span className="text-sm font-medium text-text capitalize">{category}</span>
        )}
        {!renamingCategory && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRenamingCategory(true)}
              className="text-muted hover:text-accent transition-colors"
              aria-label={`Renomear categoria ${category}`}
              title="Renomear categoria"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onRemoveCategory}
              className="text-muted hover:text-red-500 transition-colors"
              aria-label={`Remover categoria ${category}`}
              title="Remover categoria"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <CornerDownRight size={13} className="text-muted opacity-60 shrink-0" aria-hidden />

        {subcategories.map(sub => (
          renamingSub === sub ? (
            <span
              key={sub}
              className="flex items-center pl-2.5 pr-1 py-0.5 rounded-full border border-accent text-xs"
            >
              <RenameInput
                initial={sub}
                maxLength={32}
                className="w-28 text-xs"
                onSubmit={(value) => submitSub(sub, value)}
                onCancel={() => setRenamingSub(null)}
              />
            </span>
          ) : (
            <span
              key={sub}
              className="flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full border border-border text-xs text-text"
            >
              {sub}
              <button
                onClick={() => setRenamingSub(sub)}
                className="p-0.5 text-muted hover:text-accent transition-colors"
                aria-label={`Renomear subcategoria ${sub}`}
                title="Renomear subcategoria"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => removeSubcategory(category, sub)}
                className="p-0.5 text-muted hover:text-red-500 transition-colors"
                aria-label={`Remover subcategoria ${sub}`}
                title="Remover subcategoria"
              >
                <X size={11} />
              </button>
            </span>
          )
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
