import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openSite } from '../utils/navigation'

/* Paleta Night City: vermelho neon ↔ ciano (seleção HUD). */
const cyberPalettes = [
  { primary: '#ff003c', secondary: '#00f0ff' },
  { primary: '#00f0ff', secondary: '#ff003c' },
  { primary: '#ff2a6d', secondary: '#05d9e8' },
  { primary: '#fcee0a', secondary: '#ff003c' },
  { primary: '#00ff9f', secondary: '#ff003c' },
  { primary: '#ff003c', secondary: '#fcee0a' },
]

const toHexId = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash)
  const a = (h & 0xff).toString(16).toUpperCase().padStart(2, '0')
  const b = ((h >> 8) & 0xff).toString(16).toUpperCase().padStart(2, '0')
  return `NC-${a}${b}`
}

const getPalette = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return cyberPalettes[Math.abs(hash) % cyberPalettes.length]
}

const getScanDelay = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return (Math.abs(hash) % 12) * 0.35
}

function SiteCardCyberpunk({ site }) {
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
    zIndex: isDragging ? 50 : (showActions ? 20 : 1),
  }

  const handleEdit = (e) => { e.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (e) => { e.stopPropagation(); confirmDeleteSite(site.id) }
  const handleClick = () => openSite(site, openInNewTab)

  const { primary, secondary } = useMemo(() => getPalette(site.name), [site.name])
  const hexId = useMemo(() => toHexId(site.name), [site.name])
  const scanDelay = useMemo(() => getScanDelay(site.name), [site.name])
  const shortName = (site.name || 'LINK').slice(0, 10).toUpperCase()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex flex-col items-center card-contain"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={handleClick}
        className="relative cursor-pointer w-[92px] h-[104px] sm:w-[104px] sm:h-[116px] mb-2.5 cyber-card-hit"
      >
        {/* Painel HUD chanfrado */}
        <div
          className="absolute inset-0 overflow-hidden transition-[border-color,box-shadow] duration-200"
          style={{
            background: 'rgba(6, 4, 6, 0.92)',
            border: `1px solid ${primary}99`,
            clipPath: 'polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))',
            boxShadow: `0 0 18px ${primary}33, 0 0 36px ${primary}14, inset 0 0 20px ${primary}0a`,
          }}
        >
          {/* Header bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[14px] flex items-center justify-between px-2 z-10"
            style={{
              background: `linear-gradient(90deg, ${primary}cc, ${primary}55 60%, transparent)`,
            }}
          >
            <span
              className="text-[7px] sm:text-[8px] font-bold tracking-[0.15em] leading-none"
              style={{ color: '#050505', fontFamily: "'Rajdhani', 'JetBrains Mono', monospace" }}
            >
              {hexId}
            </span>
            <span
              data-decorative
              className="w-1.5 h-1.5 rounded-[1px] gpu-layer"
              style={{
                backgroundColor: secondary,
                boxShadow: `0 0 6px ${secondary}`,
                animation: 'cyberPulse 2.2s ease-in-out infinite',
                animationDelay: `${scanDelay}s`,
              }}
            />
          </div>

          {/* Scanline varrendo — só transform/opacity */}
          <div
            data-decorative
            className="absolute left-0 right-0 h-[28%] pointer-events-none gpu-layer z-[5] mix-blend-screen"
            style={{
              background: `linear-gradient(180deg, transparent, ${primary}33, transparent)`,
              animation: 'cyberScan 4.5s linear infinite',
              animationDelay: `${scanDelay}s`,
            }}
          />

          {/* Grid interno sutil */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.12]"
            style={{
              backgroundImage: `
                linear-gradient(${primary}66 1px, transparent 1px),
                linear-gradient(90deg, ${primary}66 1px, transparent 1px)
              `,
              backgroundSize: '10px 10px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            }}
          />

          {/* Favicon */}
          <div className="absolute inset-0 flex items-center justify-center pt-2">
            <div
              className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{
                border: `1px solid ${primary}66`,
                boxShadow: `inset 0 0 12px ${primary}22, 0 0 10px ${primary}18`,
                clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))',
                background: `radial-gradient(circle at 40% 35%, ${primary}22, transparent 65%)`,
              }}
            >
              <img
                src={getFaviconUrl(site.url)}
                alt={site.name}
                loading="lazy"
                decoding="async"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
              <span
                className="hidden w-full h-full items-center justify-center text-base font-bold"
                style={{ color: primary }}
              >
                {site.name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Footer status */}
          <div className="absolute bottom-0 left-0 right-0 h-[18px] flex items-center gap-1 px-2 z-10">
            <div className="flex gap-[2px] flex-1">
              {[0.9, 0.7, 0.5, 0.35, 0.2].map((op, i) => (
                <div
                  key={i}
                  className="h-[3px] flex-1"
                  style={{ backgroundColor: primary, opacity: op }}
                />
              ))}
            </div>
            <span
              className="text-[7px] font-bold tracking-widest leading-none"
              style={{
                color: secondary,
                fontFamily: "'Rajdhani', 'JetBrains Mono', monospace",
                textShadow: `0 0 6px ${secondary}`,
              }}
            >
              LINK
            </span>
          </div>
        </div>

        {/* Brackets L nos cantos (fora do clip) */}
        <div className="absolute -inset-[3px] pointer-events-none transition-colors duration-200" aria-hidden>
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: primary }} />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: primary }} />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: primary }} />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: secondary }} />
        </div>

        {/* Hover: moldura ciano de seleção */}
        <div
          className="absolute -inset-[5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            border: `1px solid ${secondary}`,
            boxShadow: `0 0 14px ${secondary}44`,
            clipPath: 'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))',
          }}
        />
      </div>

      <h3
        className="text-[10px] sm:text-[11px] font-semibold text-center truncate w-[92px] sm:w-[104px] text-muted group-hover:text-text transition-colors tracking-[0.12em] uppercase"
        style={{ fontFamily: "'Rajdhani', 'Inter', sans-serif" }}
        title={site.name}
      >
        {shortName}
      </h3>

      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-30">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-card/90 border border-border rounded-full text-muted hover:text-accent hover:border-accent transition-all hover:scale-110 shadow-lg"
            style={{ borderRadius: '9999px' }}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-card/90 border border-border rounded-full text-muted hover:text-red-500 hover:border-red-500 transition-all hover:scale-110 shadow-lg"
            style={{ borderRadius: '9999px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardCyberpunk)
