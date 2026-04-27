import { useState, useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'

const getWaveColor = (name) => {
  const colors = [
    '#00f5ff', '#7b2dff', '#ff006e', '#00d4aa', '#ffbe0b',
    '#3a86ff', '#8338ec', '#06ffa5', '#ff4365', '#00bbf9',
  ]
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getWavePhase = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export default function SiteCardWaveParticle({ site }) {
  const { confirmDeleteSite, openAddSite, setEditingSite } = useStore()
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

  const waveColor = useMemo(() => getWaveColor(site.name), [site.name])
  const phase = useMemo(() => getWavePhase(site.name), [site.name])

  // Wavy border-radius values that animate
  const r1 = 50 + (phase % 15)
  const r2 = 50 + ((phase + 30) % 20)
  const r3 = 50 + ((phase + 60) % 18)
  const r4 = 50 + ((phase + 90) % 14)
  const r5 = 50 + ((phase + 120) % 16)
  const r6 = 50 + ((phase + 150) % 12)
  const r7 = 50 + ((phase + 180) % 19)
  const r8 = 50 + ((phase + 210) % 13)

  const borderRadius = `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`

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
        className="relative cursor-pointer w-[82px] h-[82px] sm:w-[96px] sm:h-[96px] mb-3"
      >
        {/* Probability wave glow — ghost layer 1 */}
        <div
          className="absolute inset-[-8px] opacity-30 blur-md group-hover:opacity-0 transition-opacity duration-500"
          style={{
            borderRadius,
            background: `radial-gradient(circle, ${waveColor}22, transparent 70%)`,
            transform: `translate(-3px, 2px)`,
            animation: 'morphWave 5s ease-in-out infinite',
          }}
        />

        {/* Probability wave glow — ghost layer 2 */}
        <div
          className="absolute inset-[-6px] opacity-25 blur-sm group-hover:opacity-0 transition-opacity duration-500"
          style={{
            borderRadius,
            background: `radial-gradient(circle, ${waveColor}33, transparent 60%)`,
            transform: `translate(3px, -2px)`,
            animation: 'morphWave 6s ease-in-out infinite reverse',
          }}
        />

        {/* Main wave packet */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden border-2 transition-all duration-500 group-hover:rounded-2xl"
          style={{
            borderRadius,
            borderColor: `${waveColor}55`,
            background: `radial-gradient(circle at 40% 40%, ${waveColor}18, ${waveColor}08 60%, transparent 90%)`,
            boxShadow: `0 0 20px ${waveColor}15, inset 0 0 20px ${waveColor}08`,
            animation: 'morphWave 4s ease-in-out infinite',
            animationDelay: `${(phase % 10) * 0.1}s`,
          }}
        >
          {/* Interference pattern lines */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            background: `repeating-linear-gradient(
              ${phase}deg,
              transparent,
              transparent 8px,
              ${waveColor}22 8px,
              ${waveColor}22 9px
            )`,
          }} />

          {/* Favicon */}
          <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
            <img
              src={getFaviconUrl(site.url)}
              alt={site.name}
              className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
            <span className="hidden w-full h-full items-center justify-center text-lg font-bold" style={{ color: waveColor }}>
              {site.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Wave function probability dots orbiting */}
        <div className="absolute inset-[-14px] rounded-full animate-spin" style={{ animationDuration: '8s' }}>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full opacity-70 group-hover:opacity-0 transition-opacity"
            style={{ backgroundColor: waveColor, boxShadow: `0 0 6px ${waveColor}` }}
          />
        </div>
        <div className="absolute inset-[-14px] rounded-full animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full opacity-50 group-hover:opacity-0 transition-opacity"
            style={{ backgroundColor: waveColor, boxShadow: `0 0 4px ${waveColor}` }}
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
