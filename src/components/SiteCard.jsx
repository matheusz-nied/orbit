import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'

export default function SiteCard({ site }) {
  const { removeSite, openAddSite, setEditingSite } = useStore()
  const [showActions, setShowActions] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setEditingSite(site)
    openAddSite()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    removeSite(site.id)
  }

  const handleClick = () => {
    window.open(site.url, '_blank')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="bg-card border border-border rounded-xl p-3 cursor-pointer card-hover flex flex-col items-center justify-center w-28 h-28"
      >
        {/* Favicon */}
        <div className="w-12 h-12 rounded-lg bg-bg flex items-center justify-center overflow-hidden flex-shrink-0 mb-2">
          <img 
            src={getFaviconUrl(site.url)} 
            alt={site.name}
            className="w-8 h-8"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <span className="hidden w-8 h-8 items-center justify-center text-xs font-bold bg-accent text-bg rounded">
            {site.name[0].toUpperCase()}
          </span>
        </div>
        
        {/* Name */}
        <h3 className="text-xs font-medium text-text text-center line-clamp-2 leading-tight w-full px-1">
          {site.name}
        </h3>
      </div>
      
      {/* Action Buttons */}
      {showActions && (
        <div className="absolute -top-1 -right-1 flex gap-0.5 animate-slideIn">
          <button
            onClick={handleEdit}
            className="p-1 bg-card border border-border rounded-md text-muted hover:text-accent hover:border-accent transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 bg-card border border-border rounded-md text-muted hover:text-red-500 hover:border-red-500 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
