import { CloudRain, Waves, Flame, AudioLines, Wind, Square, Volume1, Volume2 } from 'lucide-react'
import useStore from '../store/useStore'
import { ambientSounds } from '../utils/ambient'

const icons = {
  rain: CloudRain,
  waves: Waves,
  fire: Flame,
  brown: AudioLines,
  pink: Wind,
}

export default function AmbientPanel() {
  const ambient = useStore((state) => state.ambient)
  const playing = useStore((state) => state.ambientPlaying)
  const playAmbient = useStore((state) => state.playAmbient)
  const stopAmbient = useStore((state) => state.stopAmbient)
  const setAmbientVolume = useStore((state) => state.setAmbientVolume)

  return (
    <div className="w-72">
      <div className="flex items-center justify-between mb-3 pr-6">
        <h3 className="text-sm font-medium text-text">Som ambiente</h3>
        {playing && (
          <button
            onClick={stopAmbient}
            className="flex items-center gap-1 text-[11px] text-muted hover:text-text transition-colors"
          >
            <Square size={10} fill="currentColor" /> Parar
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {ambientSounds.map(({ id, label }) => {
          const Icon = icons[id]
          const active = playing && ambient.sound === id
          return (
            <button
              key={id}
              onClick={() => (active ? stopAmbient() : playAmbient(id))}
              aria-pressed={active}
              data-selected={active}
              className={`settings-option flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                active ? 'border-accent text-text' : 'border-border text-muted hover:text-text hover:border-accent'
              }`}
            >
              <Icon size={15} className={active ? 'text-accent' : ''} />
              <span className="truncate">{label}</span>
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-2 text-muted">
        <Volume1 size={14} className="shrink-0" />
        <input
          type="range"
          min="0"
          max="100"
          value={ambient.volume}
          onChange={(e) => setAmbientVolume(Number(e.target.value))}
          aria-label="Volume"
          className="flex-1"
          style={{ accentColor: 'var(--accent)' }}
        />
        <Volume2 size={14} className="shrink-0" />
      </label>

      <p className="text-[10px] text-muted mt-3">
        Gerado no navegador, funciona offline · continua tocando com o painel fechado
      </p>
    </div>
  )
}
