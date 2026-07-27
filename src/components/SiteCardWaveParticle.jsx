import { useState, useMemo, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl } from '../utils/favicon'
import { openSite } from '../utils/navigation'

const waveColors = [
  '#00f5ff', '#7b2dff', '#ff006e', '#00d4aa', '#ffbe0b',
  '#3a86ff', '#8338ec', '#06ffa5', '#ff4365', '#00bbf9',
]

const getWaveColor = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return waveColors[Math.abs(hash) % waveColors.length]
}

const getWavePhase = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

/* Três fases do pacote de probabilidade — um único spinner, três dots. */
const PROBABILITY_PHASES = [0, 120, 240]

function SiteCardWaveParticle({ site }) {
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

  const waveColor = useMemo(() => getWaveColor(site.name), [site.name])
  const phase = useMemo(() => getWavePhase(site.name), [site.name])

  const timings = useMemo(() => ({
    morph: 4.5 + (phase % 7) * 0.15,
    fringe: 16 + (phase % 9),
    orbit: 9 + (phase % 5),
    ghost: 13 + (phase % 4),
    delay: (phase % 10) * 0.08,
  }), [phase])

  const r1 = 50 + (phase % 15)
  const r2 = 50 + ((phase + 30) % 20)
  const r3 = 50 + ((phase + 60) % 18)
  const r4 = 50 + ((phase + 90) % 14)
  const r5 = 50 + ((phase + 120) % 16)
  const r6 = 50 + ((phase + 150) % 12)
  const r7 = 50 + ((phase + 180) % 19)
  const r8 = 50 + ((phase + 210) % 13)
  const borderRadius = `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`

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
        className="relative cursor-pointer w-[82px] h-[82px] sm:w-[96px] sm:h-[96px] mb-3"
      >
        {/* Glow estático — blur rasterizado uma vez. */}
        <div
          data-decorative
          className="absolute inset-[-8px] opacity-30 blur-md pointer-events-none transition-opacity duration-500 group-hover:opacity-0"
          style={{
            borderRadius,
            background: `radial-gradient(circle, ${waveColor}2b, transparent 65%)`,
          }}
        />

        {/* Membrana ondulante — morph sem filter. No hover: colapsa em partícula. */}
        <div
          data-decorative
          className="absolute inset-0 overflow-hidden border-2 pointer-events-none transition-[border-radius,box-shadow,border-color] duration-500 group-hover:rounded-full group-hover:[animation:none]"
          style={{
            borderRadius,
            borderColor: `${waveColor}66`,
            background: `radial-gradient(circle at 38% 36%, ${waveColor}22, ${waveColor}0a 55%, transparent 88%)`,
            boxShadow: `0 0 18px ${waveColor}18, inset 0 0 16px ${waveColor}0c`,
            animation: `morphWave ${timings.morph}s ease-in-out infinite`,
            animationDelay: `${timings.delay}s`,
          }}
        >
          {/* Franjas de interferência girando dentro do clip do morph. */}
          <div
            data-decorative
            className="absolute inset-[-40%] opacity-[0.22] gpu-layer group-hover:opacity-0 transition-opacity duration-500"
            style={{
              background: `repeating-linear-gradient(
                ${phase}deg,
                transparent 0 7px,
                ${waveColor}33 7px 8px
              )`,
              animation: `waveFringe ${timings.fringe}s linear infinite`,
            }}
          />
          {/* Segunda franja ortogonal, mais lenta — batimento visual. */}
          <div
            data-decorative
            className="absolute inset-[-40%] opacity-[0.12] gpu-layer group-hover:opacity-0 transition-opacity duration-500"
            style={{
              background: `repeating-linear-gradient(
                ${phase + 90}deg,
                transparent 0 11px,
                ${waveColor}28 11px 12px
              )`,
              animation: `waveFringe ${timings.fringe * 1.35}s linear infinite reverse`,
            }}
          />
        </div>

        {/* Elipse de amplitude (onda estacionária). */}
        <div
          data-decorative
          className="absolute inset-[-2px] rounded-full border pointer-events-none gpu-layer transition-opacity duration-500 group-hover:opacity-0"
          style={{
            borderColor: `${waveColor}40`,
            animation: `waveAmplitude ${2.8 + (phase % 5) * 0.2}s ease-in-out infinite`,
            animationDelay: `${timings.delay}s`,
          }}
        />

        {/* Anel de fase — gira no sentido oposto ao pacote. */}
        <div
          data-decorative
          className="absolute inset-[-10px] rounded-full border border-dashed opacity-40 pointer-events-none gpu-layer transition-opacity duration-500 group-hover:opacity-0"
          style={{
            borderColor: `${waveColor}55`,
            animation: `waveOrbit ${timings.ghost}s linear infinite reverse`,
          }}
        />

        {/* Núcleo quântico pulsando sob o favicon. */}
        <div
          data-decorative
          className="absolute inset-[28%] rounded-full pointer-events-none gpu-layer transition-opacity duration-500 group-hover:opacity-90"
          style={{
            background: `radial-gradient(circle, ${waveColor}55 0%, transparent 70%)`,
            animation: 'waveCore 2.6s ease-in-out infinite',
          }}
        />

        {/* Favicon — fora das camadas animadas. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
            <img
              src={getFaviconUrl(site.url)}
              alt={site.name}
              loading="lazy"
              decoding="async"
              width="40"
              height="40"
              className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
            <span className="hidden w-full h-full items-center justify-center text-lg font-bold" style={{ color: waveColor }}>
              {site.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Pacote de probabilidade: 1 órbita, 3 fases + bob radial = caminho ondulado. */}
        <div
          data-decorative
          className="absolute inset-[-16px] pointer-events-none gpu-layer transition-transform duration-500 group-hover:scale-[0.55]"
          style={{ animation: `waveOrbit ${timings.orbit}s linear infinite` }}
        >
          {PROBABILITY_PHASES.map((deg, i) => (
            <div
              key={deg}
              className="absolute inset-0"
              style={{ transform: `rotate(${deg}deg)` }}
            >
              <div
                className="absolute top-0 left-1/2 w-[3px] h-[3px] rounded-full gpu-layer group-hover:opacity-0 transition-opacity duration-300"
                style={{
                  backgroundColor: waveColor,
                  boxShadow: `0 0 6px ${waveColor}, 0 0 12px ${waveColor}55`,
                  animation: `waveBob ${2.2 + i * 0.35}s ease-in-out infinite`,
                  animationDelay: `${i * 0.35 + timings.delay}s`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Fantasma anti-fase — dualidade onda/partícula. */}
        <div
          data-decorative
          className="absolute inset-[-16px] pointer-events-none gpu-layer transition-opacity duration-500 group-hover:opacity-0"
          style={{ animation: `waveOrbit ${timings.ghost}s linear infinite reverse` }}
        >
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[2px] rounded-full opacity-45"
            style={{
              backgroundColor: waveColor,
              boxShadow: `0 0 5px ${waveColor}`,
            }}
          />
        </div>
      </div>

      <h3 className="text-[10px] sm:text-xs font-medium text-center truncate w-24 sm:w-28 text-muted group-hover:text-text transition-colors">
        {site.name}
      </h3>

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

export default memo(SiteCardWaveParticle)
