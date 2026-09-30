import { memo, useMemo, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { openSite } from '../utils/navigation'
import SiteIcon from './SiteIcon'

const hashName = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

// Numeração de volume em algarismos romanos, como nas lombadas da edição.
const ROMAN = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
const toRoman = (n) => {
  let out = ''
  for (const [value, symbol] of ROMAN) {
    while (n >= value) {
      out += symbol
      n -= value
    }
  }
  return out
}

const getHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'falconia.local'
  }
}

// Código curto de catálogo: as três primeiras letras da categoria do site.
const getClassCode = (category) => (category ? category.slice(0, 3).toUpperCase() : 'GEN')

function SiteCardBerserk({ site }) {
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

  const hash = useMemo(() => hashName(site.name), [site.name])
  const volume = useMemo(() => toRoman((hash % 41) + 1), [hash])
  // Inclinação de −0,4° a +0,4°: o painel parece desenhado à mão.
  const tilt = ((hash % 5) - 2) * 0.2
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
      className="berserk-site group relative w-full card-contain"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className="berserk-site-panel relative w-full text-left"
        style={{ '--berserk-tilt': `${tilt}deg` }}
        onClick={() => openSite(site, openInNewTab)}
        aria-label={`Abrir ${site.name}`}
      >
        <span className="berserk-site-body">
          <span className="berserk-site-hatch" aria-hidden />
          <span className="berserk-site-slash" aria-hidden />

          <span className="berserk-site-head">
            <em>{volume}</em>
            <i>{classCode}</i>
          </span>

          <span className="berserk-site-icon" aria-hidden>
            <span className="berserk-site-ring" />
            <span className="berserk-site-corona" />
            <SiteIcon name={site.name} url={site.url} alt="" />
          </span>

          <span className="berserk-site-copy">
            <strong>{site.name}</strong>
            <small>{host}</small>
          </span>
        </span>
      </button>

      {/* Fora do painel (o clip-path recortaria os botões) e embaixo, para não
          cobrir o código da categoria no canto cortado. */}
      {showActions && (
        <div className="absolute -bottom-3 -right-2 flex gap-1.5 animate-slideIn z-30">
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

export default memo(SiteCardBerserk)
