import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openSite } from '../utils/navigation'

const spaceColors = [
  '#79a7ff', '#9b8cff', '#62d9ff', '#b48cff', '#4fbcff',
  '#d28cff', '#73e0d1', '#8ba8ff', '#a1c4ff', '#c09cff',
]

const getSpaceColor = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return spaceColors[Math.abs(hash) % spaceColors.length]
}

function SiteCardSpace({ site }) {
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
    zIndex: isDragging ? 50 : (showActions ? 20 : 1),
  }

  const accent = useMemo(() => getSpaceColor(site.name), [site.name])
  const handleEdit = (event) => { event.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (event) => { event.stopPropagation(); confirmDeleteSite(site.id) }
  const handleClick = () => openSite(site, openInNewTab)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex flex-col items-center card-contain"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="space-card relative cursor-pointer w-24 h-24 sm:w-28 sm:h-28 mb-3 rounded-[1.7rem] border overflow-hidden gpu-layer"
        style={{ '--space-card-accent': accent }}
      >
        <div className="space-card-nebula absolute inset-0" />
        <div className="space-card-stars absolute inset-0" />

        {/* Um mundo distante recortado pelo limite da viewport. */}
        <div className="space-card-world absolute rounded-full" data-decorative />
        <div className="space-card-atmosphere absolute" data-decorative />

        {/* Reflexo de vidro que cruza lentamente o painel. */}
        <div className="space-card-sweep absolute gpu-layer" data-decorative />

        {/* Marcas de enquadramento dão leitura de janela de observação. */}
        <span className="space-card-corner space-card-corner-tl absolute" />
        <span className="space-card-corner space-card-corner-br absolute" />
        <span className="space-card-signal absolute rounded-full" data-decorative />

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="space-card-icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105">
            <img
              src={getFaviconUrl(site.url)}
              alt={site.name}
              loading="lazy"
              decoding="async"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              onError={(event) => { event.target.style.display = 'none'; event.target.nextSibling.style.display = 'flex' }}
            />
            <span
              className="hidden w-8 h-8 sm:w-9 sm:h-9 items-center justify-center text-lg font-semibold text-white"
              style={{ textShadow: `0 0 10px ${accent}` }}
            >
              {site.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>

        <span className="absolute z-10 left-3 bottom-2 text-[7px] tracking-[0.2em] text-white/45 uppercase">
          Deep space
        </span>
      </div>

      <h3 className="text-[10px] sm:text-xs font-medium tracking-wide text-center truncate w-24 sm:w-28 text-muted group-hover:text-accent transition-colors">
        {site.name}
      </h3>

      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-30">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-accent hover:border-accent transition-[color,border-color,transform] hover:scale-110 shadow-lg"
            aria-label={`Editar ${site.name}`}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-red-500 hover:border-red-500 transition-[color,border-color,transform] hover:scale-110 shadow-lg"
            aria-label={`Excluir ${site.name}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardSpace)
