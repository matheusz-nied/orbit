import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'

const getAvatarColor = (name) => {
  const colors = [
    'from-red-400 to-red-600',
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-yellow-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-orange-400 to-orange-600',
  ]
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function SiteCardClassic({ site }) {
  const { confirmDeleteSite, openAddSite, setEditingSite } = useStore()
  const [showActions, setShowActions] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const handleEdit = (e) => { e.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (e) => { e.stopPropagation(); confirmDeleteSite(site.id) }
  const handleClick = () => window.open(site.url, '_blank')

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
        className="group/card relative cursor-pointer w-16 h-16 sm:w-20 sm:h-20 mb-3 mx-auto"
      >
        <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
        <div className="relative w-full h-full bg-card/80 backdrop-blur-md border border-border/50 group-hover/card:border-accent/50 rounded-2xl flex items-center justify-center shadow-sm group-hover/card:shadow-md transition-all duration-300 group-hover/card:-translate-y-1 overflow-hidden">
          <img
            src={getFaviconUrl(site.url)}
            alt={site.name}
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-transform duration-300 group-hover/card:scale-110 drop-shadow-md"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <span className={`hidden w-10 h-10 sm:w-12 sm:h-12 items-center justify-center text-xl sm:text-2xl font-bold bg-gradient-to-br ${getAvatarColor(site.name)} rounded-xl text-white shadow-inner`}>
            {site.name?.[0]?.toUpperCase()}
          </span>
        </div>
      </div>

      <h3 className="text-xs sm:text-sm font-medium text-muted text-center line-clamp-1 w-full px-1 group-hover:text-text transition-colors drop-shadow-sm">
        {site.name}
      </h3>

      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-20">
          <button onClick={handleEdit} className="p-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl text-muted hover:text-accent hover:border-accent transition-all hover:scale-110 shadow-lg">
            <Pencil size={14} />
          </button>
          <button onClick={handleDelete} className="p-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl text-muted hover:text-red-500 hover:border-red-500 transition-all hover:scale-110 shadow-lg">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
