import { memo, useMemo, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openSite } from '../utils/navigation'

const getArchiveNumber = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return String((Math.abs(hash) % 89) + 10).padStart(2, '0')
}

const getHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'arquivo.local'
  }
}

// Código curto de catálogo: as três primeiras letras da categoria do site.
const getClassCode = (category) => (category ? category.slice(0, 3).toUpperCase() : 'GEN')

function SiteCardArchive({ site }) {
  const confirmDeleteSite = useStore((state) => state.confirmDeleteSite)
  const openAddSite = useStore((state) => state.openAddSite)
  const setEditingSite = useStore((state) => state.setEditingSite)
  const openInNewTab = useStore((state) => state.openInNewTab)
  const [showActions, setShowActions] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging || showActions ? 20 : 1,
  }

  const archiveNumber = useMemo(() => getArchiveNumber(site.name), [site.name])
  const host = useMemo(() => getHost(site.url), [site.url])
  const classCode = useMemo(() => getClassCode(site.category), [site.category])

  const handleEdit = (event) => {
    event.stopPropagation()
    setEditingSite(site)
    openAddSite()
  }
  const handleDelete = (event) => {
    event.stopPropagation()
    confirmDeleteSite(site.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="archive-site group relative w-full card-contain"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className="archive-site-plate relative w-full text-left"
        onClick={() => openSite(site, openInNewTab)}
        aria-label={`Abrir ${site.name}`}
      >
        <span className="archive-site-grid" aria-hidden />
        <span className="archive-site-spine" aria-hidden />
        <span className="archive-site-fold" aria-hidden />

        <span className="archive-site-head">
          <em>{archiveNumber}</em>
          <i>{classCode}</i>
        </span>

        <span className="archive-site-emblem" aria-hidden>
          <span className="archive-site-orbit" />
          <span className="archive-site-icon">
            <img
              src={getFaviconUrl(site.url)}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.target.style.display = 'none'
                event.target.nextSibling.style.display = 'flex'
              }}
            />
            <span>{site.name?.[0]?.toUpperCase()}</span>
          </span>
        </span>

        <span className="archive-site-copy">
          <strong>{site.name}</strong>
          <small>{host}</small>
        </span>
      </button>

      {showActions && (
        <div className="absolute -top-2 -right-2 flex gap-1.5 animate-slideIn z-30">
          <button onClick={handleEdit} className="p-1.5 bg-card border border-border text-muted hover:text-accent hover:border-accent transition-colors" aria-label={`Editar ${site.name}`}>
            <Pencil size={12} />
          </button>
          <button onClick={handleDelete} className="p-1.5 bg-card border border-border text-muted hover:text-red-400 hover:border-red-400 transition-colors" aria-label={`Excluir ${site.name}`}>
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardArchive)
