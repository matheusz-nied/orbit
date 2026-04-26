import { useState, useMemo } from 'react'
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

export default function SiteCardBento({ site }) {
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
  const handleClick = (e) => { if (e.target.closest('button')) return; window.open(site.url, '_blank') }

  const displayUrl = useMemo(() => {
    try { return new URL(site.url).hostname.replace('www.', '') } catch { return site.url }
  }, [site.url])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group w-full"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="group/card relative w-full h-[70px] cursor-pointer bg-card/40 hover:bg-card/80 backdrop-blur-xl border border-border/50 hover:border-accent/60 rounded-[18px] flex items-center px-3 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-card/90 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-border/50 flex items-center justify-center shrink-0 overflow-hidden group-hover/card:scale-105 transition-transform duration-300">
          <img
            src={getFaviconUrl(site.url)}
            alt={site.name}
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
          <span className={`hidden w-full h-full items-center justify-center text-lg sm:text-xl font-bold bg-gradient-to-br ${getAvatarColor(site.name)} text-white`}>
            {site.name?.[0]?.toUpperCase()}
          </span>
        </div>

        <div className="relative z-10 ml-3.5 flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-[13px] sm:text-[14px] font-semibold text-text truncate group-hover/card:text-accent transition-colors">
            {site.name}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-muted truncate mt-0.5 opacity-70">
            {displayUrl}
          </p>
        </div>
      </div>

      {showActions && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 p-1 bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl animate-slideIn z-30 shadow-lg">
          <button onClick={handleEdit} className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-all" title="Editar">
            <Pencil size={14} />
          </button>
          <div className="w-[1px] h-4 bg-border/60 mx-0.5" />
          <button onClick={handleDelete} className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Excluir">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
