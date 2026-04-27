import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'

const spinColors = [
  '#ff2a6d', '#05d9e8', '#d1f7ff', '#7700ff', '#00ff9f',
  '#ff0055', '#00ccff', '#bd00ff', '#39ff14', '#ff00ff',
]

const getSpinColor = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return spinColors[Math.abs(hash) % spinColors.length]
}

const getSpinParams = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const ax1 = 20 + (Math.abs(hash) % 40)
  const ax2 = 60 + (Math.abs(hash >> 4) % 50)
  const dir1 = Math.abs(hash) % 2 === 0 ? 'normal' : 'reverse'
  const dir2 = dir1 === 'normal' ? 'reverse' : 'normal'
  const spd1 = 5 + (Math.abs(hash >> 2) % 6)
  const spd2 = 7 + (Math.abs(hash >> 6) % 5)
  return { ax1, ax2, dir1, dir2, spd1, spd2 }
}

function SiteCardQuantumSpin({ site }) {
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

  const spinColor = useMemo(() => getSpinColor(site.name), [site.name])
  const { ax1, ax2, dir1, dir2, spd1, spd2 } = useMemo(() => getSpinParams(site.name), [site.name])

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
        {/* Outer glow field */}
        <div
          className="absolute inset-[-8px] rounded-full opacity-30 blur-md"
          style={{ backgroundColor: spinColor }}
        />

        {/* Spin ring 1 — tilted X axis */}
        <div
          className="absolute inset-0 rounded-full border-[1.5px] opacity-60 group-hover:opacity-90 transition-opacity"
          style={{
            borderColor: `${spinColor}88`,
            transform: `rotateX(${ax1}deg) rotateY(0deg)`,
            animation: `spin3dX ${spd1}s linear infinite ${dir1}`,
            boxShadow: `0 0 10px ${spinColor}33`,
          }}
        />

        {/* Spin ring 2 — tilted Y axis */}
        <div
          className="absolute inset-[4px] rounded-full border opacity-40 group-hover:opacity-70 transition-opacity"
          style={{
            borderColor: `${spinColor}66`,
            transform: `rotateX(0deg) rotateY(${ax2}deg)`,
            animation: `spin3dY ${spd2}s linear infinite ${dir2}`,
            boxShadow: `0 0 8px ${spinColor}22`,
          }}
        />

        {/* Equatorial ring */}
        <div
          className="absolute inset-[8px] rounded-full border-[1.5px] border-dashed opacity-50"
          style={{
            borderColor: `${spinColor}99`,
            animation: 'spin 4s linear infinite',
          }}
        />

        {/* Nucleus / Core */}
        <div
          className="absolute inset-[14px] rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${spinColor}44, ${spinColor}18 50%, transparent 80%)`,
            border: `1px solid ${spinColor}55`,
            boxShadow: `0 0 16px ${spinColor}33, inset 0 0 12px ${spinColor}22`,
          }}
        >
          {/* Inner energy pulse */}
          <div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: `radial-gradient(circle, ${spinColor}66 0%, transparent 60%)`,
              animation: 'pulseGlow 2.5s ease-in-out infinite',
            }}
          />

          <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
            <img
              src={getFaviconUrl(site.url)}
              alt={site.name}
              className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
            <span className="hidden w-full h-full items-center justify-center text-base sm:text-lg font-bold text-white/90">
              {site.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Spin axis indicator dots */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full" style={{ backgroundColor: spinColor, boxShadow: `0 0 5px ${spinColor}` }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full" style={{ backgroundColor: spinColor, boxShadow: `0 0 5px ${spinColor}` }} />

        {/* Orbiting electron 1 */}
        <div
          className="absolute inset-[-6px] rounded-full"
          style={{
            animation: `spin3dX ${spd1 * 0.8}s linear infinite ${dir1}`,
            transform: `rotateX(${ax1}deg)`,
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full"
            style={{ backgroundColor: spinColor, boxShadow: `0 0 8px ${spinColor}, 0 0 16px ${spinColor}66` }}
          />
        </div>

        {/* Orbiting electron 2 */}
        <div
          className="absolute inset-[-6px] rounded-full"
          style={{
            animation: `spin3dY ${spd2 * 0.7}s linear infinite ${dir2}`,
            transform: `rotateY(${ax2}deg)`,
          }}
        >
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full"
            style={{ backgroundColor: `${spinColor}cc`, boxShadow: `0 0 6px ${spinColor}` }}
          />
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

export default memo(SiteCardQuantumSpin)
