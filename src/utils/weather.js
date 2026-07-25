// Open-Meteo: gratuito e sem API key — combina com a proposta do Orbit de
// não exigir cadastro em nada.
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const CACHE_KEY = 'weather_cache'
export const CACHE_TTL_MS = 30 * 60 * 1000

// Códigos WMO agrupados por aparência: o ícone exato de cada variação de
// chuva importa menos que a leitura rápida.
const WMO = [
  { codes: [0], label: 'Céu limpo', icon: 'sun' },
  { codes: [1, 2], label: 'Parcialmente nublado', icon: 'cloud-sun' },
  { codes: [3], label: 'Nublado', icon: 'cloud' },
  { codes: [45, 48], label: 'Névoa', icon: 'cloud-fog' },
  { codes: [51, 53, 55, 56, 57], label: 'Garoa', icon: 'cloud-drizzle' },
  { codes: [61, 63, 65, 66, 67], label: 'Chuva', icon: 'cloud-rain' },
  { codes: [71, 73, 75, 77], label: 'Neve', icon: 'cloud-snow' },
  { codes: [80, 81, 82], label: 'Pancadas de chuva', icon: 'cloud-rain' },
  { codes: [85, 86], label: 'Pancadas de neve', icon: 'cloud-snow' },
  { codes: [95, 96, 99], label: 'Tempestade', icon: 'cloud-lightning' },
]

export const describeWeather = (code) => {
  const match = WMO.find((entry) => entry.codes.includes(code))
  return match || { label: 'Indisponível', icon: 'cloud' }
}

export const searchCities = async (query, signal) => {
  const params = new URLSearchParams({
    name: query,
    count: '6',
    language: 'pt',
    format: 'json',
  })

  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal })
  if (!response.ok) throw new Error('Falha na busca de cidades')

  const data = await response.json()
  return (data.results || []).map((city) => ({
    name: city.name,
    // `admin1` é o estado/província — sem ele, "Springfield" vira adivinhação.
    region: city.admin1 || '',
    country: city.country || '',
    countryCode: city.country_code || '',
    lat: city.latitude,
    lon: city.longitude,
  }))
}

export const fetchWeather = async ({ lat, lon }, signal) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '1',
  })

  const response = await fetch(`${FORECAST_URL}?${params}`, { signal })
  if (!response.ok) throw new Error('Falha ao consultar o clima')

  const data = await response.json()

  return {
    temperature: Math.round(data.current.temperature_2m),
    feelsLike: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    code: data.current.weather_code,
    max: Math.round(data.daily.temperature_2m_max[0]),
    min: Math.round(data.daily.temperature_2m_min[0]),
  }
}

// Chave por coordenada arredondada: mudar de cidade invalida o cache, mas um
// GPS oscilando alguns metros não dispara request novo.
const cacheKeyFor = ({ lat, lon }) => `${lat.toFixed(2)},${lon.toFixed(2)}`

export const readWeatherCache = (location, storage) => {
  if (!location) return null

  const cached = storage.get(CACHE_KEY)
  if (!cached || cached.key !== cacheKeyFor(location)) return null
  if (Date.now() - cached.at > CACHE_TTL_MS) return null

  return cached.data
}

export const writeWeatherCache = (location, data, storage) => {
  storage.set(CACHE_KEY, { key: cacheKeyFor(location), at: Date.now(), data })
}

export const formatLocationLabel = (location) => {
  if (!location) return ''
  return [location.name, location.region, location.country]
    .filter(Boolean)
    .join(', ')
}
