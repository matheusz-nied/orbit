import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, Pencil, X } from 'lucide-react'
import useStore from '../store/useStore'

export default function WorkspaceManager() {
  const workspaces = useStore((state) => state.workspaces)
  const activeWorkspace = useStore((state) => state.activeWorkspace)
  const setActiveWorkspace = useStore((state) => state.setActiveWorkspace)
  const addWorkspace = useStore((state) => state.addWorkspace)
  const renameWorkspace = useStore((state) => state.renameWorkspace)
  const removeWorkspace = useStore((state) => state.removeWorkspace)
  const sites = useStore((state) => state.sites)

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const counts = useMemo(() => {
    const result = {}
    for (const site of sites) {
      result[site.workspace] = (result[site.workspace] || 0) + 1
    }
    return result
  }, [sites])

  const handleAdd = () => {
    const id = addWorkspace(newName)
    if (id) {
      setNewName('')
      setActiveWorkspace(id)
    }
  }

  const startEditing = (workspace) => {
    setEditingId(workspace.id)
    setEditingName(workspace.name)
  }

  const commitEditing = () => {
    if (editingId) renameWorkspace(editingId, editingName)
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-muted mb-1">Espaços</h3>
        <p className="text-xs text-muted mb-3">
          Conjuntos independentes de sites — por exemplo, Pessoal e Trabalho. As categorias
          e o tema continuam sendo compartilhados entre todos.
        </p>

        <div className="space-y-2">
          {workspaces.map((workspace) => {
            const isEditing = editingId === workspace.id
            const isActive = workspace.id === activeWorkspace
            const count = counts[workspace.id] || 0

            return (
              <div
                key={workspace.id}
                className={`flex items-center gap-2 p-3 bg-bg border rounded-lg ${
                  isActive ? 'border-accent' : 'border-border'
                }`}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditing()
                        if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
                      }}
                      className="flex-1 px-2 py-1 bg-card border border-border rounded text-sm text-text focus:border-accent transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={commitEditing}
                      className="text-muted hover:text-accent transition-colors"
                      aria-label="Salvar nome"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditingName('') }}
                      className="text-muted hover:text-text transition-colors"
                      aria-label="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveWorkspace(workspace.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <span className={`text-sm ${isActive ? 'text-accent font-medium' : 'text-text'}`}>
                        {workspace.name}
                      </span>
                      <span className="text-xs text-muted ml-2">
                        {count} {count === 1 ? 'site' : 'sites'}
                      </span>
                    </button>

                    <button
                      onClick={() => startEditing(workspace)}
                      className="text-muted hover:text-accent transition-colors"
                      aria-label={`Renomear ${workspace.name}`}
                    >
                      <Pencil size={14} />
                    </button>

                    {/* O último espaço não pode ser removido: sem nenhum, os
                        sites ficariam sem lugar para aparecer. */}
                    {workspaces.length > 1 && (
                      <button
                        onClick={() => removeWorkspace(workspace.id)}
                        className="text-muted hover:text-red-500 transition-colors"
                        title={count > 0 ? `Os ${count} sites vão para "${workspaces.find(w => w.id !== workspace.id)?.name}"` : 'Remover espaço'}
                        aria-label={`Remover ${workspace.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted mb-3">Novo espaço</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="Trabalho"
            className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted text-sm focus:border-accent transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="px-4 py-2.5 bg-accent rounded-lg text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          Remover um espaço nunca apaga sites — eles são movidos para o primeiro espaço da lista.
        </p>
      </div>
    </div>
  )
}
