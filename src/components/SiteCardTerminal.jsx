import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2, FileCode } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openUrl } from '../utils/navigation'

const syntaxColors = [
  '#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa',
  '#f472b6', '#22d3ee', '#fb923c', '#a3e635', '#e879f9',
]

const getFileExtension = (name) => {
  const ext = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 3)
  return ext || 'lnk'
}

const getSyntaxColor = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return syntaxColors[Math.abs(hash) % syntaxColors.length]
}

function SiteCardTerminal({ site, index }) {
    const confirmDeleteSite = useStore((state) => state.confirmDeleteSite)
    const openAddSite = useStore((state) => state.openAddSite)
    const setEditingSite = useStore((state) => state.setEditingSite)
    const openInNewTab = useStore((state) => state.openInNewTab)
  const [showActions, setShowActions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const handleEdit = (e) => { e.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (e) => { e.stopPropagation(); confirmDeleteSite(site.id) }
    const handleClick = (e) => { if (e.target.closest('button')) return; openUrl(site.url, openInNewTab) }

  const displayUrl = useMemo(() => {
    try { return new URL(site.url).hostname.replace('www.', '') } catch { return site.url }
  }, [site.url])

  const ext = getFileExtension(site.name)
  const syntaxColor = getSyntaxColor(site.name)
  const lineNum = (index + 1).toString().padStart(2, '0')
  const perms = 'rw-r--r--'
  const size = (site.name.length * 142 + 73).toString().padStart(4, '0')
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      onMouseEnter={() => { setShowActions(true); setIsHovered(true) }}
      onMouseLeave={() => { setShowActions(false); setIsHovered(false) }}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="cursor-pointer flex items-center gap-3 px-3 py-2 font-mono text-xs sm:text-sm border-b border-border/40 hover:bg-card/60 transition-colors select-none"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {/* Line number */}
        <span className="text-muted/50 w-6 text-right shrink-0 select-none">{lineNum}</span>

        {/* Permissions & meta */}
        <span className="text-muted/60 hidden sm:inline shrink-0">{perms}</span>
        <span className="text-muted/40 hidden md:inline shrink-0 w-10 text-right">{size}</span>
        <span className="text-muted/50 hidden lg:inline shrink-0 w-12 text-right">{dateStr}</span>

        {/* Icon */}
        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
          <img
            src={getFaviconUrl(site.url)}
            alt=""
            className="w-4 h-4 object-contain"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <FileCode size={14} className="hidden text-muted/60" style={{ display: 'none' }} />
        </div>

        {/* Filename */}
        <span
          className="font-medium truncate shrink-0"
          style={{ color: syntaxColor, minWidth: '80px', maxWidth: '180px' }}
        >
          {site.name}.{ext}
        </span>

        {/* Arrow */}
        <span className="text-muted/30 hidden sm:inline">→</span>

        {/* URL */}
        <span className="text-muted/70 truncate flex-1 hidden sm:inline">
          {displayUrl}
        </span>

        {/* Cursor */}
        {isHovered && (
          <span className="w-2 h-4 bg-accent/80 animate-blink shrink-0" />
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1 bg-card/95 backdrop-blur border border-border/60 rounded-lg animate-slideIn z-20 shadow-lg">
          <button
            onClick={handleEdit}
            className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-all"
            title="Editar"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
            title="Excluir"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardTerminal)
