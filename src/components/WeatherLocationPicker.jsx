import { useState, useRef, useEffect } from 'react'
import { MapPin, Search, Crosshair, X } from 'lucide-react'
import useStore from '../store/useStore'
import { searchCities, formatLocationLabel } from '../utils/weather'

export default function WeatherLocationPicker() {
  const location = useStore((state) => state.weatherLocation)
  const setWeatherLocation = useStore((state) => state.setWeatherLocation)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState(null)
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const runSearch = async () => {
    const term = query.trim()
    if (term.length < 2) return

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setStatus('loading')
    try {
      const cities = await searchCities(term, controller.signal)
      setResults(cities)
      setStatus(cities.length === 0 ? 'empty' : null)
    } catch (err) {
      if (err.name === 'AbortError') return
      setStatus('error')
    }
  }

  const pick = (city) => {
    setWeatherLocation(city)
    setResults([])
    setQuery('')
    setStatus(null)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }

    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Sem geocodificação reversa aqui: as coordenadas já bastam para a
        // previsão, e evita mais uma chamada de rede só para achar um nome.
        pick({
          name: 'Minha localização',
          region: '',
          country: '',
          lat: coords.latitude,
          lon: coords.longitude,
        })
      },
      () => setStatus('denied'),
      { timeout: 10000 },
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-muted mb-1 flex items-center gap-2">
        <MapPin size={16} />
        Cidade do clima
      </h3>
      <p className="text-xs text-muted mb-3">
        Dados do Open-Meteo — gratuito e sem cadastro. Nenhuma chave de API necessária.
      </p>

      {location && (
        <div className="flex items-center justify-between gap-3 p-3 mb-3 bg-bg border border-border rounded-xl">
          <div className="min-w-0">
            <p className="text-sm text-text font-medium line-clamp-1">{location.name}</p>
            <p className="text-xs text-muted line-clamp-1">
              {formatLocationLabel(location) || `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`}
            </p>
          </div>
          <button
            onClick={() => setWeatherLocation(null)}
            className="text-muted hover:text-red-500 transition-colors shrink-0"
            aria-label="Remover cidade"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch() } }}
          placeholder="Buscar cidade (ex.: Curitiba)"
          className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-text placeholder-muted text-sm focus:border-accent transition-colors"
        />
        <button
          onClick={runSearch}
          disabled={query.trim().length < 2}
          className="px-3 py-2.5 bg-accent rounded-lg text-bg hover:opacity-90 transition-opacity disabled:opacity-40"
          aria-label="Buscar"
        >
          <Search size={16} />
        </button>
        <button
          onClick={useMyLocation}
          className="px-3 py-2.5 bg-bg border border-border rounded-lg text-muted hover:text-accent hover:border-accent transition-colors"
          title="Usar minha localização"
          aria-label="Usar minha localização"
        >
          <Crosshair size={16} />
        </button>
      </div>

      {status && (
        <p className="text-xs text-muted mt-2">
          {status === 'loading' && 'Buscando…'}
          {status === 'locating' && 'Obtendo sua localização…'}
          {status === 'empty' && 'Nenhuma cidade encontrada com esse nome.'}
          {status === 'error' && 'Não foi possível buscar agora. Tente de novo.'}
          {status === 'denied' && 'Permissão de localização negada. Busque pelo nome da cidade.'}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((city) => (
            <button
              key={`${city.lat},${city.lon}`}
              onClick={() => pick(city)}
              className="w-full text-left p-3 bg-bg border border-border rounded-lg hover:border-accent transition-colors"
            >
              <p className="text-sm text-text">{city.name}</p>
              <p className="text-xs text-muted">
                {[city.region, city.country].filter(Boolean).join(', ')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
