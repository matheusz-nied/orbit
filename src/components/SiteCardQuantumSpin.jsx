import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openSite } from '../utils/navigation'

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
  // Precessão: o giroscópio inteiro tomba lentamente em torno do eixo Z.
  const precessDur = 18 + (Math.abs(hash >> 8) % 13)
  const precessDir = Math.abs(hash >> 10) % 2 === 0 ? 'normal' : 'reverse'
  const floatDelay = (Math.abs(hash >> 3) % 7) * -0.5
  return { ax1, ax2, dir1, dir2, spd1, spd2, precessDur, precessDir, floatDelay }
}

function SiteCardQuantumSpin({ site }) {
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

  const p = useMemo(() => getSpinParams(site.name), [site.name])
  const spinColor = useMemo(() => getSpinColor(site.name), [site.name])

  const sceneVars = {
    '--qs-color': spinColor,
    '--qs-tilt-x': `${p.ax1}deg`,
    '--qs-tilt-y': `${p.ax2}deg`,
    '--qs-speed-x': `${p.spd1}s`,
    '--qs-speed-y': `${p.spd2}s`,
    '--qs-dir-x': p.dir1,
    '--qs-dir-y': p.dir2,
    '--qs-precess-duration': `${p.precessDur}s`,
    '--qs-precess-direction': p.precessDir,
    '--qs-float-delay': `${p.floatDelay}s`,
  }

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
        className="qs-scene relative cursor-pointer w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] mb-3 transition-transform duration-300 group-hover:scale-105"
        style={sceneVars}
      >
        {/* Flutuação de corpo inteiro — o átomo "levita" no grid. */}
        <div data-decorative className="qs-float absolute inset-0 gpu-layer">
          {/* Campo de energia: o wrapper pulsa (transform/opacity), o blur fica estático. */}
          <div data-decorative className="qs-glow-motion absolute inset-[-8px] gpu-layer">
            <div className="qs-glow absolute inset-0 rounded-full" />
          </div>

          {/* Precessão — todo o sistema orbital tomba como um giroscópio. */}
          <div data-decorative className="qs-precess absolute inset-0 gpu-layer">
            {/* Spin ring X */}
            <div
              data-decorative
              className="qs-ring qs-ring-x absolute inset-0 rounded-full gpu-layer"
            >
              <span className="qs-trail absolute rounded-full" />
            </div>

            {/* Spin ring Y */}
            <div
              data-decorative
              className="qs-ring qs-ring-y absolute inset-[4px] rounded-full gpu-layer"
            />

            {/* Anel equatorial tracejado */}
            <div
              data-decorative
              className="qs-ring-eq absolute inset-[8px] rounded-full gpu-layer"
            />

            {/* Polos do eixo de spin */}
            <span data-decorative className="qs-pole qs-pole-top absolute top-0 left-1/2 -translate-x-1/2 rounded-full" />
            <span data-decorative className="qs-pole qs-pole-bottom absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" />

            {/* Elétron 1 */}
            <div
              data-decorative
              className="qs-orbiter qs-orbiter-x absolute inset-[-6px] rounded-full gpu-layer"
            >
              <span className="qs-electron qs-electron-a absolute top-0 left-1/2 -translate-x-1/2 rounded-full" />
            </div>

            {/* Elétron 2 */}
            <div
              data-decorative
              className="qs-orbiter qs-orbiter-y absolute inset-[-6px] rounded-full gpu-layer"
            >
              <span className="qs-electron qs-electron-b absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full" />
            </div>
          </div>

          {/* Ondas de choque do estado excitado — só correm com hover. */}
          <span data-decorative className="qs-ripple qs-ripple-one absolute inset-0 rounded-full gpu-layer" />
          <span data-decorative className="qs-ripple qs-ripple-two absolute inset-0 rounded-full gpu-layer" />

          {/* Núcleo */}
          <div className="qs-core absolute inset-[14px] rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110">
            <div
              data-decorative
              className="qs-core-pulse absolute inset-0 rounded-full gpu-layer"
            />

            <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
              <img
                src={getFaviconUrl(site.url)}
                alt={site.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
              <span className="hidden w-full h-full items-center justify-center text-base sm:text-lg font-bold text-white/90">
                {site.name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
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
