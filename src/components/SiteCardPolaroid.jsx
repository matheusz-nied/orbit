import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'

const getRotation = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const rotations = [-5, -3, -1, 0, 1, 3, 5, -4, 4, -2, 2]
  return rotations[Math.abs(hash) % rotations.length]
}

const getPolaroidColor = (name) => {
  const colors = [
    '#fef3c7', '#e0f2fe', '#fce7f3', '#dcfce7', '#f3e8ff',
    '#ffedd5', '#ccfbf1', '#fee2e2', '#e0e7ff', '#ecfccb',
  ]
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function SiteCardPolaroid({ site }) {
  const { confirmDeleteSite, openAddSite, setEditingSite } = useStore()
  const [showActions, setShowActions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  const rotation = getRotation(site.name)
  const polaroidBg = getPolaroidColor(site.name)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : (isHovered ? 20 : 1),
    rotate: isHovered ? '0deg' : `${rotation}deg`,
  }

  const handleEdit = (e) => { e.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (e) => { e.stopPropagation(); confirmDeleteSite(site.id) }
  const handleClick = () => window.open(site.url, '_blank')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group select-none"
      onMouseEnter={() => { setShowActions(true); setIsHovered(true) }}
      onMouseLeave={() => { setShowActions(false); setIsHovered(false) }}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="cursor-pointer bg-card/90 backdrop-blur-sm rounded-sm shadow-[4px_4px_12px_rgba(0,0,0,0.25),1px_1px_3px_rgba(0,0,0,0.15)] hover:shadow-[8px_8px_24px_rgba(0,0,0,0.3),2px_2px_6px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-2 overflow-hidden"
        style={{ padding: '10px 10px 32px 10px' }}
      >
        {/* Photo area */}
        <div
          className="relative w-full flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '1/1', backgroundColor: polaroidBg }}
        >
          <img
            src={getFaviconUrl(site.url)}
            alt={site.name}
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <span className="hidden w-12 h-12 sm:w-14 sm:h-14 items-center justify-center text-2xl font-bold text-gray-700">
            {site.name?.[0]?.toUpperCase()}
          </span>

          {/* Subtle tape effect */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 opacity-40 rotate-[-2deg]"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          />
        </div>

        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-1">
          <p
            className="text-center text-sm truncate"
            style={{ fontFamily: "'Caveat', cursive", color: 'var(--text)' }}
          >
            {site.name}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="absolute -top-3 -right-3 flex flex-col gap-1.5 animate-slideIn z-30">
          <button
            onClick={handleEdit}
            className="p-2 bg-card border border-border rounded-full text-muted hover:text-accent hover:border-accent transition-all hover:scale-110 shadow-lg"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-card border border-border rounded-full text-muted hover:text-red-500 hover:border-red-500 transition-all hover:scale-110 shadow-lg"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
