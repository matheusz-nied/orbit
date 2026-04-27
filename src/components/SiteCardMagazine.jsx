import { useState, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openUrl } from '../utils/navigation'

const palettes = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'],
    ['#a1c4fd', '#c2e9fb'],
    ['#fd7043', '#ff8a65'],
]

const getGradientColors = (name) => {
    let hash = 0
    for (let i = 0; i < (name?.length || 0); i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return palettes[Math.abs(hash) % palettes.length]
}

function SiteCardMagazine({ site }) {
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
        zIndex: isDragging ? 1 : 0,
    }

    const handleEdit = (e) => { e.stopPropagation(); setEditingSite(site); openAddSite() }
    const handleDelete = (e) => { e.stopPropagation(); confirmDeleteSite(site.id) }
    const handleClick = (e) => { if (e.target.closest('button')) return; openUrl(site.url, openInNewTab) }

    const [colors] = useState(() => getGradientColors(site.name))

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
                className="relative w-full overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ aspectRatio: '3/4' }}
            >
                {/* Gradient Background */}
                <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})` }}
                />

                {/* Noise texture overlay for depth */}
                <div className="absolute inset-0 opacity-[0.08]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px',
                }} />

                {/* Favicon — centered */}
                <div className="absolute inset-0 flex items-center justify-center pb-6">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <img
                            src={getFaviconUrl(site.url)}
                            alt={site.name}
                            className="w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                        />
                        <span className="hidden w-full h-full items-center justify-center text-xl font-extrabold text-white">
                            {site.name?.[0]?.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Bottom label — always visible */}
                <div className="absolute bottom-0 inset-x-0 px-2 py-2">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
                    <p className="relative z-10 text-white text-[10px] sm:text-xs font-semibold truncate text-center drop-shadow">
                        {site.name}
                    </p>
                </div>

                {/* Hover overlay with actions */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(e) }}
                        className="relative z-10 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/40 rounded-full text-white text-xs font-medium transition-colors backdrop-blur-sm"
                    >
                        <Pencil size={12} /> Editar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(e) }}
                        className="relative z-10 flex items-center gap-2 px-4 py-2 bg-red-500/30 hover:bg-red-500/50 border border-red-300/40 rounded-full text-white text-xs font-medium transition-colors backdrop-blur-sm"
                    >
                        <Trash2 size={12} /> Excluir
                    </button>
                    <div className="relative z-10 mt-1">
                        <ExternalLink size={16} className="text-white/70" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(SiteCardMagazine)
