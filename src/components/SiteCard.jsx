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
      className="relative group flex flex-col items-center"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="bg-card border border-border rounded-2xl p-0 cursor-pointer card-hover flex items-center justify-center w-20 h-20 mb-2 overflow-hidden"
      >
        {/* Favicon Container */}
        <div className="w-full h-full flex items-center justify-center bg-card">
          <img 
            src={getFaviconUrl(site.url)} 
            alt={site.name}
            className="w-14 h-14 object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <span className="hidden w-14 h-14 items-center justify-center text-xl font-bold bg-accent text-[#1a1a1a] rounded-xl">
            {site.name[0].toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Name below card */}
      <h3 className="text-xs font-semibold text-muted text-center line-clamp-1 w-full px-1 group-hover:text-text transition-colors">
        {site.name}
      </h3>
      
      {/* Action Buttons */}
      {showActions && (
        <div className="absolute top-0 -right-1 flex flex-col gap-1 animate-slideIn z-10">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-card border border-border rounded-lg text-muted hover:text-accent hover:border-accent transition-colors shadow-lg"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-card border border-border rounded-lg text-muted hover:text-red-500 hover:border-red-500 transition-colors shadow-lg"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
