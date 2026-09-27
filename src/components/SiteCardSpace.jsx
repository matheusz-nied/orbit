import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { openSite } from '../utils/navigation'
import SiteIcon from './SiteIcon'

// Tons de atmosfera — misturados com branco no CSS, então ficam sempre
// discretos: o card é monocromático e só a borda do planeta ganha cor.
const atmosphereColors = [
  '#7fa8ff', '#9cc0ff', '#6fd3ff', '#b4c6ff', '#8fe0ff',
  '#ffc68a', '#ffb07a', '#c7b8ff', '#a8f0e0', '#ffd9a8',
]

const hashName = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

// Espalha os bits do hash: nomes parecidos ("Gmail"/"Mail") caíam na mesma
// cena só com o módulo direto.
const mix = (value) => {
  let h = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  return (h ^ (h >>> 16)) >>> 0
}

// Cada site ganha um objeto celeste fixo — mesma linguagem, cenas diferentes.
const SCENES = {
  horizon: () => (
    <>
      <div className="space-card-world absolute rounded-full" />
      <div className="space-card-flare absolute" />
    </>
  ),
  eclipse: () => (
    <>
      <div className="sc-eclipse absolute rounded-full" />
      <div className="sc-eclipse-bead absolute rounded-full" />
    </>
  ),
  ringed: () => (
    <div className="sc-planet absolute rounded-full">
      <div className="sc-ring absolute" />
    </div>
  ),
  crescent: () => <div className="sc-moon absolute rounded-full" />,
  galaxy: () => (
    <>
      <div className="sc-galaxy absolute" />
      <div className="sc-galaxy-core absolute rounded-full" />
    </>
  ),
  sun: () => (
    <>
      <div className="sc-sun absolute rounded-full" />
      <div className="sc-sun-planet absolute rounded-full" />
    </>
  ),
  comet: () => (
    <div className="sc-comet absolute">
      <div className="sc-comet-head absolute rounded-full" />
    </div>
  ),
  binary: () => (
    <>
      <div className="sc-orbit absolute rounded-full" />
      <div className="sc-binary sc-binary-a absolute rounded-full" />
      <div className="sc-binary sc-binary-b absolute rounded-full" />
    </>
  ),
}

// Cena pelo id (fixo por site): ids numéricos sequenciais — os presets e os
// criados via Date.now() — percorrem as cenas em ordem em vez de sortear,
// o que evita três galáxias lado a lado. Sem id numérico, cai no hash.
const sceneSeed = (id, fallback) => {
  const n = Number.parseInt(id, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

// `limb` e `overhead` reaproveitam o horizonte com outra rotação (CSS).
const SCENE_KEYS = [...Object.keys(SCENES), 'limb', 'overhead']

function SiteCardSpace({ site }) {
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

  const { accent, designation, scene, flip, starOffset } = useMemo(() => {
    const hash = hashName(site.name)
    const bits = mix(hash)
    return {
      accent: atmosphereColors[hash % atmosphereColors.length],
      designation: `ORB-${String(hash % 1000).padStart(3, '0')}`,
      scene: SCENE_KEYS[sceneSeed(site.id, bits) % SCENE_KEYS.length],
      flip: (bits >>> 4) % 2 === 1,
      starOffset: `${(bits >>> 5) % 97}px ${(bits >>> 12) % 89}px`,
    }
  }, [site.name, site.id])
  const handleEdit = (event) => { event.stopPropagation(); setEditingSite(site); openAddSite() }
  const handleDelete = (event) => { event.stopPropagation(); confirmDeleteSite(site.id) }
  const handleClick = () => openSite(site, openInNewTab)

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
        className="space-card relative cursor-pointer w-24 h-24 sm:w-28 sm:h-28 mb-3 rounded-[1.4rem] border overflow-hidden gpu-layer"
        style={{ '--space-card-accent': accent }}
      >
        <div className="space-card-stars absolute inset-0" style={{ backgroundPosition: starOffset }} />

                <div className="space-card-scene absolute inset-0" data-scene={scene} data-flip={flip || undefined}>
          {(SCENES[scene] || SCENES.horizon)()}
        </div>

        <span className="space-card-signal absolute rounded-full" data-decorative />
        <span className="space-card-label absolute z-10">{designation}</span>

        <div className="absolute inset-0 z-10 flex items-center justify-center -translate-y-1">
          <div className="space-card-icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105">
            <SiteIcon
              name={site.name}
              url={site.url}
              imgClassName="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              fallbackClassName="w-8 h-8 sm:w-9 sm:h-9 text-lg font-semibold"
              fallbackStyle={{ color: '#fff', textShadow: '0 0 10px rgba(255, 255, 255, 0.4)' }}
            />
          </div>
        </div>
      </div>

      <h3 className="text-[10px] sm:text-xs font-medium tracking-wide text-center truncate w-24 sm:w-28 text-muted group-hover:text-accent transition-colors">
        {site.name}
      </h3>

      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-30">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-accent hover:border-accent transition-[color,border-color,transform] hover:scale-110 shadow-lg"
            aria-label={`Editar ${site.name}`}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-muted hover:text-red-500 hover:border-red-500 transition-[color,border-color,transform] hover:scale-110 shadow-lg"
            aria-label={`Excluir ${site.name}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(SiteCardSpace)
