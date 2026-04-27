import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openUrl } from '../utils/navigation'

const floatDelays = [0, 0.5, 1, 1.5, 2, 2.5]

const getFloatDelay = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return floatDelays[Math.abs(hash) % floatDelays.length]
}

function SiteCardOrbitalGlass({ site }) {
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
        {/* Outer glass ring */}
        <div
          className="absolute inset-[-4px] rounded-full border opacity-40 group-hover:opacity-70 transition-opacity"
          style={{
            borderColor: 'rgba(255,255,255,0.35)',
            boxShadow: '0 0 12px rgba(255,255,255,0.08), inset 0 0 8px rgba(255,255,255,0.05)',
          }}
        />

        {/* Soft white glow */}
        <div
          className="absolute inset-[-10px] rounded-full opacity-15 group-hover:opacity-30 transition-opacity blur-lg"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
        />

        {/* Main glass planet */}
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border transition-all duration-300 group-hover:scale-110"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
            borderColor: 'rgba(255,255,255,0.18)',
            boxShadow: '0 0 20px rgba(255,255,255,0.06), inset 0 0 24px rgba(255,255,255,0.04), inset 0 1px 1px rgba(255,255,255,0.12)',
          }}
        >
          {/* Inner glass highlight */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.15) 0%, transparent 55%)',
            }}
          />

          {/* Bottom inner shadow for 3D depth */}
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle at 70% 75%, rgba(0,0,0,0.15) 0%, transparent 50%)',
            }}
          />

          <img
            src={getFaviconUrl(site.url)}
            alt={site.name}
            className="relative z-10 w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-110"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <span className="relative z-10 hidden w-9 h-9 sm:w-11 sm:h-11 items-center justify-center text-lg sm:text-xl font-bold text-white/90">
            {site.name?.[0]?.toUpperCase()}
          </span>
        </div>

        {/* Orbiting glass dot */}
        <div
          className="absolute inset-[-14px] rounded-full animate-spin"
          style={{ animationDuration: '10s' }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.8)',
              boxShadow: '0 0 8px rgba(255,255,255,0.6), 0 0 16px rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>

      {/* Label */}
      <h3 className="text-[10px] sm:text-xs font-medium text-center truncate w-24 sm:w-28 text-white/70 group-hover:text-white transition-colors">
        {site.name}
      </h3>

      {/* Actions */}
      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-30">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/70 hover:text-white hover:border-white/40 hover:bg-white/20 transition-all hover:scale-110 shadow-lg"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/70 hover:text-red-300 hover:border-red-300/40 hover:bg-red-500/10 transition-all hover:scale-110 shadow-lg"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardOrbitalGlass)
