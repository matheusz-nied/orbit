import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openSite } from '../utils/navigation'

const getGlassMotion = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const seed = Math.abs(hash)
  return {
    floatDelay: (seed % 6) * -0.45,
    orbitDelay: (seed % 10) * -0.7,
    orbitDuration: 8 + (seed % 5),
    orbitTilt: -18 + (seed % 37),
    orbitDirection: seed % 2 === 0 ? 'normal' : 'reverse',
  }
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

  const handleEdit = (event) => { event.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (event) => { event.stopPropagation(); confirmDeleteSite(site.id) }
  const handleClick = () => openSite(site, openInNewTab)

  const motion = useMemo(() => getGlassMotion(site.name), [site.name])
  const glassStyle = {
    '--glass-float-delay': `${motion.floatDelay}s`,
    '--glass-orbit-delay': `${motion.orbitDelay}s`,
    '--glass-orbit-duration': `${motion.orbitDuration}s`,
    '--glass-orbit-tilt': `${motion.orbitTilt}deg`,
    '--glass-orbit-direction': motion.orbitDirection,
  }

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
        data-decorative
        className="orbital-glass-scene relative cursor-pointer w-24 h-24 sm:w-28 sm:h-28 mb-3 gpu-layer"
        style={glassStyle}
      >
        <div data-decorative className="orbital-glass-aura-motion absolute gpu-layer">
          <div className="orbital-glass-aura absolute inset-0 rounded-full" />
        </div>

        {/* A metade traseira da órbita desaparece naturalmente atrás do planeta. */}
        <div data-decorative className="orbital-glass-orbit orbital-glass-orbit-back absolute gpu-layer">
          <div className="orbital-glass-track absolute inset-0 rounded-full" />
          <div className="orbital-glass-spinner absolute inset-0 rounded-full gpu-layer">
            <span className="orbital-glass-moon absolute rounded-full" />
          </div>
        </div>

        <div className="orbital-glass-planet absolute inset-3 sm:inset-3.5 z-10 rounded-full overflow-hidden flex items-center justify-center gpu-layer">
          <div className="orbital-glass-depth absolute inset-0 rounded-full" />
          <div data-decorative className="orbital-glass-reflection-motion absolute gpu-layer">
            <div className="orbital-glass-reflection absolute inset-0" />
          </div>
          <span className="orbital-glass-bubble orbital-glass-bubble-one absolute rounded-full" />
          <span className="orbital-glass-bubble orbital-glass-bubble-two absolute rounded-full" />

          <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
            <img
              src={getFaviconUrl(site.url)}
              alt={site.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110"
              onError={(event) => { event.target.style.display = 'none'; event.target.nextSibling.style.display = 'flex' }}
            />
            <span className="hidden w-full h-full items-center justify-center text-xl font-bold text-text">
              {site.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Recorte frontal duplica apenas o satélite que cruza a face do planeta. */}
        <div data-decorative className="orbital-glass-orbit orbital-glass-orbit-front absolute z-20 gpu-layer">
          <div className="orbital-glass-spinner absolute inset-0 rounded-full gpu-layer">
            <span className="orbital-glass-moon absolute rounded-full" />
          </div>
        </div>

        <span className="orbital-glass-glint absolute z-30 rounded-full" />
      </div>

      <h3 className="text-[10px] sm:text-xs font-medium tracking-wide text-center truncate w-24 sm:w-28 text-muted group-hover:text-text transition-colors">
        {site.name}
      </h3>

      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-30">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-accent hover:border-accent transition-[color,border-color,background-color,transform] hover:scale-110 shadow-lg"
            aria-label={`Editar ${site.name}`}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-[color,border-color,background-color,transform] hover:scale-110 shadow-lg"
            aria-label={`Excluir ${site.name}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardOrbitalGlass)
