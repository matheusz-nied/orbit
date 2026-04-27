import { useState, useEffect } from 'react'
import { X, Plus, Pencil } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'

const isValidUrl = (value) => {
  try {
    const candidate = value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `https://${value}`
    new URL(candidate)
    return true
  } catch {
    return false
  }
}

export default function AddSiteModal() {
  const { addSiteOpen, closeAddSite, editingSite, updateSite, addSite, setEditingSite, categories, activeCategory } = useStore()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [urlTouched, setUrlTouched] = useState(false)

  useEffect(() => {
    if (editingSite) {
      setName(editingSite.name)
      setUrl(editingSite.url)
      setCategory(editingSite.category)
    } else {
      setName('')
      setUrl('')
      setCategory(activeCategory !== 'all' ? activeCategory : (categories[0] || ''))
    }
    setUrlTouched(false)
  }, [editingSite, addSiteOpen, categories, activeCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!name.trim() || !url.trim() || !isValidUrl(url.trim())) return
    
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }
    
    if (editingSite) {
      updateSite(editingSite.id, {
        name: name.trim(),
        url: finalUrl,
        category: category || categories[0] || 'all'
      })
    } else {
      addSite({
        name: name.trim(),
        url: finalUrl,
        category: category || categories[0] || 'all'
      })
    }
    
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setUrl('')
    setCategory('')
    setUrlTouched(false)
    setEditingSite(null)
    closeAddSite()
  }

  const previewUrl = url.trim()
    ? (url.trim().startsWith('http://') || url.trim().startsWith('https://') ? url.trim() : `https://${url.trim()}`)
    : ''
  const canPreview = previewUrl && isValidUrl(url.trim())
  const urlHasError = urlTouched && url.trim() && !isValidUrl(url.trim())

  const handleUrlChange = (value) => {
    setUrl(value)

    if (!name.trim()) {
      try {
        const candidate = value.startsWith('http://') || value.startsWith('https://')
          ? value
          : `https://${value}`
        const hostname = new URL(candidate).hostname.replace(/^www\./, '')
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
              disabled={!name.trim() || !url.trim() || !isValidUrl(url.trim())}
              className="flex-1 px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity"
            >
              {editingSite ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
