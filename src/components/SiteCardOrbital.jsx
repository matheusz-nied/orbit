import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openUrl } from '../utils/navigation'

const orbitColors = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ef4444', '#14b8a6',
]

const floatDelays = [0, 0.5, 1, 1.5, 2, 2.5]

const getOrbitColor = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return orbitColors[Math.abs(hash) % orbitColors.length]
}

const getFloatDelay = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return floatDelays[Math.abs(hash) % floatDelays.length]
}

function SiteCardOrbital({ site }) {
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

  const handleEdit = (e) => { e.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (e) => { e.stopPropagation(); confirmDeleteSite(site.id) }
    const handleClick = () => openUrl(site.url, openInNewTab)

  const orbitColor = useMemo(() => getOrbitColor(site.name), [site.name])
  const floatDelay = useMemo(() => getFloatDelay(site.name), [site.name])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex flex-col items-center"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="relative cursor-pointer w-20 h-20 sm:w-24 sm:h-24 mb-3 animate-float"
        style={{ animationDelay: `${floatDelay}s` }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-[-4px] rounded-full border-2 opacity-30 group-hover:opacity-60 transition-opacity"
          style={{ borderColor: orbitColor }}
        />

        {/* Glow */}
        <div
          className="absolute inset-[-8px] rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity"
          style={{ backgroundColor: orbitColor }}
        />

        {/* Main planet */}
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-300 group-hover:scale-110"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${orbitColor}44, ${orbitColor}22)`,
            borderColor: orbitColor,
            boxShadow: `0 0 16px ${orbitColor}44, inset 0 0 20px ${orbitColor}22`,
          }}
        >
          {/* Planet texture / inner glow */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle at 70% 70%, transparent 30%, ${orbitColor}66 100%)`,
            }}
          />

          <img
            src={getFaviconUrl(site.url)}
            alt={site.name}
            className="relative z-10 w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <span
            className="relative z-10 hidden w-9 h-9 sm:w-11 sm:h-11 items-center justify-center text-lg sm:text-xl font-bold text-white"
            style={{ textShadow: `0 0 8px ${orbitColor}` }}
          >
            {site.name?.[0]?.toUpperCase()}
          </span>
        </div>

        {/* Orbiting dot */}
        <div
          className="absolute inset-[-12px] rounded-full animate-spin"
          style={{ animationDuration: '8s' }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: orbitColor, boxShadow: `0 0 6px ${orbitColor}` }}
          />
        </div>
      </div>

      {/* Label */}
      <h3
        className="text-[10px] sm:text-xs font-medium text-center truncate w-24 sm:w-28 group-hover:text-accent transition-colors"
        style={{ textShadow: `0 0 8px ${orbitColor}44` }}
      >
        {site.name}
      </h3>

      {/* Actions */}
      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-30">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-accent hover:border-accent transition-all hover:scale-110 shadow-lg"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-red-500 hover:border-red-500 transition-all hover:scale-110 shadow-lg"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardOrbital)
