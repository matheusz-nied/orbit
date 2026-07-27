import { useState, useEffect } from 'react'
import { X, Plus, Pencil } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { isSafeHttpUrl, normalizeHttpUrl } from '../utils/url'
import { findShortcutConflict, normalizeShortcutKey } from '../utils/shortcuts'

export default function AddSiteModal() {
  const addSiteOpen = useStore((state) => state.addSiteOpen)
  const closeAddSite = useStore((state) => state.closeAddSite)
  const editingSite = useStore((state) => state.editingSite)
  const updateSite = useStore((state) => state.updateSite)
  const addSite = useStore((state) => state.addSite)
  const setEditingSite = useStore((state) => state.setEditingSite)
  const sites = useStore((state) => state.sites)
  const categories = useStore((state) => state.categories)
  const activeCategory = useStore((state) => state.activeCategory)
  const workspaces = useStore((state) => state.workspaces)
  const activeWorkspace = useStore((state) => state.activeWorkspace)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [workspace, setWorkspace] = useState(activeWorkspace)
  const [shortcut, setShortcut] = useState('')
  const [urlTouched, setUrlTouched] = useState(false)

  useEffect(() => {
    if (editingSite) {
      setName(editingSite.name)
      setUrl(editingSite.url)
      setCategory(editingSite.category)
      setWorkspace(editingSite.workspace || activeWorkspace)
      setShortcut(editingSite.shortcut || '')
    } else {
      setWorkspace(activeWorkspace)
      setName('')
      setUrl('')
      setShortcut('')
      // 'all' e 'Frequentes' são visões, não categorias atribuíveis.
      const isRealCategory = activeCategory !== 'all' && categories.includes(activeCategory)
      setCategory(isRealCategory ? activeCategory : (categories[0] || ''))
    }
    setUrlTouched(false)
  }, [editingSite, addSiteOpen, categories, activeCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const finalUrl = normalizeHttpUrl(url)
    if (!name.trim() || !finalUrl) return

    const normalizedShortcut = normalizeShortcutKey(shortcut)
    if (normalizedShortcut) {
      const conflict = findShortcutConflict(sites, normalizedShortcut, editingSite?.id)
      if (conflict) return
    }

    const payload = {
      name: name.trim(),
      url: finalUrl,
      category: category || categories[0] || 'geral',
      workspace: workspace || activeWorkspace,
      shortcut: normalizedShortcut || undefined,
    }

    if (editingSite) {
      updateSite(editingSite.id, payload)
    } else {
      addSite(payload)
    }

    handleClose()
  }

  const handleClose = () => {
    setName('')
    setUrl('')
    setCategory('')
    setWorkspace(activeWorkspace)
    setShortcut('')
    setUrlTouched(false)
    setEditingSite(null)
    closeAddSite()
  }

  const previewUrl = normalizeHttpUrl(url) || ''
  const canPreview = Boolean(previewUrl)
  const urlHasError = urlTouched && url.trim() && !isSafeHttpUrl(url.trim())
  const normalizedShortcut = normalizeShortcutKey(shortcut)
  const shortcutConflict = normalizedShortcut
    ? findShortcutConflict(sites, normalizedShortcut, editingSite?.id)
    : null

  const handleShortcutKeyDown = (e) => {
    e.preventDefault()
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setShortcut('')
      return
    }
    const key = normalizeShortcutKey(e.key)
    if (key) setShortcut(key)
  }

  const handleUrlChange = (value) => {
    setUrl(value)

    if (!name.trim()) {
      const normalized = normalizeHttpUrl(value)
      if (!normalized) return
      try {
        const hostname = new URL(normalized).hostname.replace(/^www\./, '')
        const suggestion = hostname.split('.')[0]
        if (suggestion) {
          setName(suggestion.charAt(0).toUpperCase() + suggestion.slice(1))
        }
      } catch {
        // Ignore invalid URLs while the user is typing.
      }
    }
  }

  if (!addSiteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={handleClose}>
      <div 
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text flex items-center gap-2">
            {editingSite ? <Pencil size={20} /> : <Plus size={20} />}
            {editingSite ? 'Editar Site' : 'Adicionar Site'}
          </h2>
          <button onClick={handleClose} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="GitHub"
              className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm text-muted mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://github.com"
              className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
            />
            {urlHasError && (
              <p className="text-xs text-red-400 mt-2">
                Informe uma URL válida. Você pode colar sem `https://` que o Orbit completa para você.
              </p>
            )}
          </div>

          {canPreview && (
            <div className="flex items-center gap-3 p-3 bg-bg border border-border rounded-xl">
              <img
                src={getFaviconUrl(previewUrl)}
                alt=""
                className="w-8 h-8 object-contain"
              />
              <div className="min-w-0">
                <p className="text-sm text-text font-medium line-clamp-1">{name.trim() || 'Prévia do site'}</p>
                <p className="text-xs text-muted line-clamp-1">{previewUrl}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm text-muted mb-1">Atalho de teclado</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shortcut ? shortcut.toUpperCase() : ''}
                onKeyDown={handleShortcutKeyDown}
                placeholder="Pressione uma tecla"
                className="w-24 px-4 py-3 bg-bg border border-border rounded-lg text-text text-center font-mono uppercase focus:border-accent transition-colors cursor-default"
              />
              {shortcut && (
                <button
                  type="button"
                  onClick={() => setShortcut('')}
                  className="px-3 py-3 text-sm text-muted hover:text-text border border-border rounded-lg transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            <p className="text-xs text-muted mt-1.5">
              Uma tecla (a–z ou 0–9). Funciona fora de campos de texto — abre o site no espaço atual.
            </p>
            {shortcutConflict && (
              <p className="text-xs text-red-400 mt-1">
                Já usado por &quot;{shortcutConflict.name}&quot;
              </p>
            )}
          </div>

          <div className={workspaces.length > 1 ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="block text-sm text-muted mb-1">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Só faz sentido escolher espaço quando existe mais de um. */}
            {workspaces.length > 1 && (
              <div>
                <label className="block text-sm text-muted mb-1">Espaço</label>
                <select
                  value={workspace}
                  onChange={e => setWorkspace(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors"
                >
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-muted hover:text-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !isSafeHttpUrl(url.trim()) || Boolean(shortcutConflict)}
              className="flex-1 px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {editingSite ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
