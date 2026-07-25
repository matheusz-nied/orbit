import { useEffect, useState, useCallback } from 'react'
import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning, MapPin,
} from 'lucide-react'
import useStore from '../store/useStore'
import { storage } from '../utils/storage'
import {
  fetchWeather, describeWeather, readWeatherCache, writeWeatherCache, CACHE_TTL_MS,
} from '../utils/weather'

const icons = {
  'sun': Sun,
  'cloud-sun': CloudSun,
  'cloud': Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
}

export default function WeatherWidget() {
  const widgets = useStore((state) => state.widgets)
  const location = useStore((state) => state.weatherLocation)
  const openSettings = useStore((state) => state.openSettings)

  const [weather, setWeather] = useState(null)
  const [failed, setFailed] = useState(false)

  const enabled = widgets.weather && !!location

  const load = useCallback(async (signal) => {
    if (!location) return

    const cached = readWeatherCache(location, storage)
    if (cached) {
      setWeather(cached)
      setFailed(false)
      return
    }

    try {
      const data = await fetchWeather(location, signal)
      writeWeatherCache(location, data, storage)
      setWeather(data)
      setFailed(false)
    } catch (err) {
      if (err.name === 'AbortError') return
      // Mantém o último valor conhecido na tela em vez de apagar o widget:
      // um clima de 40 minutos atrás é mais útil que nada.
      setFailed(true)
    }
  }, [location])

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    load(controller.signal)

    // Revalida no mesmo ritmo do cache e só com a aba visível — sem isso uma
    // aba esquecida ficaria consultando a API a noite inteira.
    const interval = setInterval(() => {
      if (!document.hidden) load(controller.signal)
    }, CACHE_TTL_MS)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [enabled, load])

  if (!widgets.weather) return null

  if (!location) {
    return (
      <button
        onClick={openSettings}
        className="mx-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted border border-border hover:border-accent hover:text-text transition-colors"
      >
        <MapPin size={14} />
        Definir cidade para ver o clima
      </button>
    )
  }

  if (!weather) {
    return (
      <div className="h-8 flex items-center justify-center text-xs text-muted">
        {failed ? 'Clima indisponível' : 'Carregando clima…'}
      </div>
    )
  }

  const { label, icon } = describeWeather(weather.code)
  const Icon = icons[icon] || Cloud

  return (
    <div className="flex items-center justify-center gap-3 text-muted animate-fadeIn">
      <Icon size={22} className="text-accent shrink-0" />

      <span className="text-2xl font-light text-text tabular-nums">
        {weather.temperature}°
      </span>

      <div className="text-left leading-tight">
        <p className="text-xs text-text">{label}</p>
        <p className="text-[11px] tabular-nums">
          {weather.max}° / {weather.min}° · sensação {weather.feelsLike}°
        </p>
      </div>

      <span className="text-[11px] max-w-[10rem] truncate hidden sm:inline" title={location.name}>
        {location.name}
      </span>
    </div>
  )
}
