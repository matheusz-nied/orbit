import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'

const accretionPalettes = [
  ['#ff6b35', '#f7931e', '#ffd23f'], // laranja/dourado
  ['#00d4aa', '#00b4d8', '#90e0ef'], // ciano
  ['#e0aaff', '#c77dff', '#9d4edd'], // roxo
  ['#ff006e', '#fb5607', '#ffbe0b'], // quente
]

const getAccretionPalette = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return accretionPalettes[Math.abs(hash) % accretionPalettes.length]
}

function SiteCardSingularity({ site }) {
  const confirmDeleteSite = useStore((state) => state.confirmDeleteSite)
  const openAddSite = useStore((state) => state.openAddSite)
  const setEditingSite = useStore((state) => state.setEditingSite)
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
  const handleClick = () => window.open(site.url, '_blank')

  const [c1, c2, c3] = useMemo(() => getAccretionPalette(site.name), [site.name])

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
        className="relative cursor-pointer w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] mb-3"
      >
        {/* Accretion disk — outer glow */}
        <div
          className="absolute inset-[-10px] rounded-full opacity-60 blur-md"
          style={{
            background: `conic-gradient(from 0deg, ${c1}00, ${c1}66, ${c2}88, ${c3}66, ${c1}00)`,
            animation: 'spin 6s linear infinite',
          }}
        />

        {/* Second slower disk layer */}
        <div
          className="absolute inset-[-6px] rounded-full opacity-40 blur-sm"
          style={{
            background: `conic-gradient(from 180deg, ${c2}00, ${c3}55, ${c1}77, ${c2}00)`,
            animation: 'spin 10s linear infinite reverse',
          }}
        />

        {/* Event horizon — black center */}
        <div
          className="absolute inset-[2px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 50% 50%, #000000 35%, #0a0a0a 50%, #1a1a1a 65%, transparent 72%)',
          }}
        />

        {/* Gravitational lens ring */}
        <div
          className="absolute inset-[6px] rounded-full border opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            borderColor: `${c2}44`,
            boxShadow: `0 0 12px ${c1}33, inset 0 0 8px ${c3}22`,
          }}
        />

        {/* Spiraling particles */}
        <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '4s' }}>
          <div
            className="absolute top-[5%] left-1/2 w-1 h-1 rounded-full"
            style={{ backgroundColor: c1, boxShadow: `0 0 4px ${c1}` }}
          />
        </div>
        <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '7s', animationDirection: 'reverse' }}>
          <div
            className="absolute top-[12%] left-[75%] w-[3px] h-[3px] rounded-full"
            style={{ backgroundColor: c2, boxShadow: `0 0 5px ${c2}` }}
          />
        </div>
        <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '5s' }}>
          <div
            className="absolute top-[85%] left-[20%] w-[2px] h-[2px] rounded-full"
            style={{ backgroundColor: c3, boxShadow: `0 0 4px ${c3}` }}
          />
        </div>

        {/* Favicon at the singularity center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
            <img
              src={getFaviconUrl(site.url)}
              alt={site.name}
              className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] transition-transform duration-300 group-hover:scale-110"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
            <span className="hidden w-full h-full items-center justify-center text-sm font-bold text-white/90">
              {site.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Label */}
      <h3 className="text-[10px] sm:text-xs font-medium text-center truncate w-24 sm:w-28 text-muted group-hover:text-text transition-colors">
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

export default memo(SiteCardSingularity)
