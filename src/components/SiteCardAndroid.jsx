import { memo, useMemo, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { openSite } from '../utils/navigation'
import SiteIcon from './SiteIcon'

// Modelos de android de Detroit: Become Human — cada site "é" um deles.
const MODELS = ['RK800', 'AX400', 'WR600', 'PL600', 'HK400', 'YK500', 'ST300', 'TR400']

const hashName = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const getHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'cyberlife.local'
  }
}

function SiteCardAndroid({ site }) {
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
  const model = MODELS[hash % MODELS.length]
  // "Probabilidade" da análise, 62–99%: a barra completa no hover.
  const probability = (hash % 38) + 62
  const host = useMemo(() => getHost(site.url), [site.url])

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
      className="dbh-site group relative w-full card-contain"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <span className="dbh-site-lock" aria-hidden />

      <button
        type="button"
        className="dbh-site-panel relative w-full text-left"
        style={{ '--dbh-pct': probability / 100 }}
        onClick={() => openSite(site, openInNewTab)}
        aria-label={`Abrir ${site.name}`}
      >
        <span className="dbh-site-scan" aria-hidden />

        <span className="dbh-site-head">
          <em><span className="dbh-site-tri" aria-hidden />{model}</em>
          <i className="dbh-site-led" aria-hidden />
        </span>

        <span className="dbh-site-icon" aria-hidden>
          <span className="dbh-site-ring" />
          <SiteIcon name={site.name} url={site.url} alt="" />
        </span>

        <span className="dbh-site-copy">
          <strong>{site.name}</strong>
          <small>{host} · {probability}%</small>
        </span>

        <span className="dbh-site-meter" aria-hidden />
      </button>

      {/* Embaixo, para não cobrir o LED — ele é o feedback do hover. */}
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

export default memo(SiteCardAndroid)
