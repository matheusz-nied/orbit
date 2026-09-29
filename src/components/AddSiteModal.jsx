import { useState, useEffect } from 'react'
import { X, Plus, Pencil, Globe, Keyboard } from 'lucide-react'
import useStore from '../store/useStore'
import { getDomain } from '../utils/favicon'
import SiteIcon from './SiteIcon'
import { isSafeHttpUrl, normalizeHttpUrl } from '../utils/url'
import { findShortcutConflict, normalizeShortcutKey } from '../utils/shortcuts'

// Valor sentinela do <select> — não colide com nomes digitados.
const NEW_SUBCATEGORY = '__new__'

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
  const activeSubcategory = useStore((state) => state.activeSubcategory)
  const subcategoriesByCategory = useStore((state) => state.subcategories)
  const addSubcategory = useStore((state) => state.addSubcategory)
  const workspaces = useStore((state) => state.workspaces)
  const activeWorkspace = useStore((state) => state.activeWorkspace)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  // '' = nenhuma; NEW_SUBCATEGORY = criando uma nova com `newSubcategory`.
  const [subcategory, setSubcategory] = useState('')
  const [newSubcategory, setNewSubcategory] = useState('')
  const [workspace, setWorkspace] = useState(activeWorkspace)
  const [shortcut, setShortcut] = useState('')
  const [urlTouched, setUrlTouched] = useState(false)

  useEffect(() => {
    if (editingSite) {
      setName(editingSite.name)
      setUrl(editingSite.url)
      setCategory(editingSite.category)
      setSubcategory(editingSite.subcategory || '')
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
      setSubcategory(isRealCategory && activeSubcategory ? activeSubcategory : '')
    }
    setNewSubcategory('')
    setUrlTouched(false)
  }, [editingSite, addSiteOpen, categories, activeCategory, activeSubcategory])

  const subcategoryOptions = subcategoriesByCategory[category] || []

  const handleCategoryChange = (value) => {
    setCategory(value)
    // Subcategorias são por categoria — a escolhida não existe na nova.
    setSubcategory('')
    setNewSubcategory('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const finalUrl = normalizeHttpUrl(url)
    if (!name.trim() || !finalUrl) return

    const normalizedShortcut = normalizeShortcutKey(shortcut)
    if (normalizedShortcut) {
      const conflict = findShortcutConflict(sites, normalizedShortcut, editingSite?.id)
      if (conflict) return
    }

    const finalCategory = category || categories[0] || 'geral'
    const finalSubcategory = subcategory === NEW_SUBCATEGORY
      ? addSubcategory(finalCategory, newSubcategory)
      : subcategory

    const payload = {
      name: name.trim(),
      url: finalUrl,
      category: finalCategory,
      // undefined some do JSON salvo — editar para "Nenhuma" limpa o campo.
      subcategory: finalSubcategory || undefined,
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
    setSubcategory('')
    setNewSubcategory('')
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

  const labelClass = 'block text-sm font-medium text-text mb-2'
  const fieldClass =
    'w-full h-12 px-4 bg-bg border border-border rounded-xl text-[15px] text-text placeholder-muted focus:border-accent transition-colors'
  const optional = <span className="font-normal text-muted">(opcional)</span>
  const canSubmit =
    name.trim() &&
    isSafeHttpUrl(url.trim()) &&
    !shortcutConflict &&
    !(subcategory === NEW_SUBCATEGORY && !newSubcategory.trim())

  // Opções visíveis de uma vez (chips) em vez de <select>: são poucas e o usuário vê tudo sem abrir nada.
  const chipClass = (active) =>
    `h-9 px-3.5 rounded-lg border text-sm transition-colors ${
      active ? 'border-accent text-accent font-medium' : 'border-border text-muted hover:text-text'
    }`
  const chipStyle = (active) =>
    active ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)' } : undefined
  const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={handleClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-xl mx-4 max-h-[92vh] overflow-y-auto animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-7 pt-6 pb-5 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-text leading-tight">
              {editingSite ? 'Editar site' : 'Adicionar site'}
            </h2>
            <p className="text-sm text-muted mt-1">
              {editingSite ? 'Atualize os dados do atalho.' : 'Cole o endereço e o resto é preenchido para você.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">
          {/* 1. Endereço primeiro: o nome é sugerido a partir dele. */}
          <div>
            <label htmlFor="site-url" className={labelClass}>Endereço (URL)</label>
            <input
              id="site-url"
              type="text"
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://github.com"
              className={`${fieldClass} ${urlHasError ? 'border-red-400' : ''}`}
              autoFocus={!editingSite}
            />
            {urlHasError && (
              <p className="text-[13px] text-red-400 mt-2">
                Informe uma URL válida. Você pode colar sem `https://` que o Orbit completa para você.
              </p>
            )}
          </div>

          {/* 2. Nome, com o ícone do site como prévia ao vivo. */}
          <div>
            <label htmlFor="site-name" className={labelClass}>Nome</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 shrink-0 bg-bg border border-border rounded-xl text-muted">
                {canPreview ? (
                  <SiteIcon
                    name={name.trim() || getDomain(previewUrl)}
                    url={previewUrl}
                    alt=""
                    imgClassName="w-7 h-7 object-contain"
                    fallbackClassName="w-7 h-7 text-sm font-bold text-accent rounded-md"
                  />
                ) : (
                  <Globe size={20} />
                )}
              </div>
              <input
                id="site-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="GitHub"
                className={fieldClass}
                autoFocus={Boolean(editingSite)}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* 3. Onde o site fica: espaço → categoria → subcategoria. */}
          {workspaces.length > 0 && (
            <div>
              <span className={labelClass}>Espaço</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Espaço">
                {workspaces.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    aria-pressed={workspace === w.id}
                    onClick={() => setWorkspace(w.id)}
                    className={chipClass(workspace === w.id)}
                    style={chipStyle(workspace === w.id)}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className={labelClass}>Categoria</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categoria">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={chipClass(category === cat)}
                  style={chipStyle(category === cat)}
                >
                  {capitalize(cat)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={labelClass}>Subcategoria {optional}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Subcategoria">
              <button
                type="button"
                aria-pressed={subcategory === ''}
                onClick={() => setSubcategory('')}
                className={chipClass(subcategory === '')}
                style={chipStyle(subcategory === '')}
              >
                Nenhuma
              </button>
              {subcategoryOptions.map(sub => (
                <button
                  key={sub}
                  type="button"
                  aria-pressed={subcategory === sub}
                  onClick={() => setSubcategory(sub)}
                  className={chipClass(subcategory === sub)}
                  style={chipStyle(subcategory === sub)}
                >
                  {sub}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={subcategory === NEW_SUBCATEGORY}
                onClick={() => setSubcategory(NEW_SUBCATEGORY)}
                className={`${chipClass(subcategory === NEW_SUBCATEGORY)} border-dashed`}
                style={chipStyle(subcategory === NEW_SUBCATEGORY)}
              >
                + Nova
              </button>
            </div>
            {subcategory === NEW_SUBCATEGORY && (
              <input
                type="text"
                value={newSubcategory}
                onChange={e => setNewSubcategory(e.target.value)}
                maxLength={32}
                placeholder="Nome da subcategoria, ex.: Projeto Apollo"
                aria-label="Nome da nova subcategoria"
                className={`${fieldClass} mt-3`}
                autoFocus
              />
            )}
          </div>

          <div className="border-t border-border" />

          {/* 4. Extra: atalho de teclado, como linha de configuração. */}
          <div>
            <div className="flex items-center gap-4">
              <Keyboard size={20} className="text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="site-shortcut" className="block text-sm font-medium text-text">
                  Atalho de teclado {optional}
                </label>
                <p className="text-[13px] leading-snug text-muted mt-0.5">
                  Clique no quadro e aperte uma tecla (a–z ou 0–9) para abrir este site sem usar o mouse.
                </p>
              </div>
              {shortcut && (
                <button
                  type="button"
                  onClick={() => setShortcut('')}
                  className="h-9 px-3 text-sm text-muted hover:text-text border border-border rounded-lg transition-colors shrink-0"
                >
                  Limpar
                </button>
              )}
              <input
                id="site-shortcut"
                type="text"
                readOnly
                value={shortcut ? shortcut.toUpperCase() : ''}
                onKeyDown={handleShortcutKeyDown}
                placeholder="?"
                aria-label="Tecla de atalho"
                className="w-12 h-12 shrink-0 bg-bg border border-border rounded-xl text-text text-center text-lg font-mono font-semibold uppercase placeholder-muted focus:border-accent transition-colors cursor-pointer caret-transparent"
              />
            </div>
            {shortcutConflict && (
              <p className="text-[13px] text-red-400 mt-2">
                Já usado por &quot;{shortcutConflict.name}&quot;
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-12 px-4 bg-bg border border-border rounded-xl text-[15px] text-muted hover:text-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-12 px-4 bg-accent rounded-xl text-[15px] text-bg font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingSite ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
