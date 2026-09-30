// Hash estável do nome do site: dá a cada card uma "identidade" fixa (cor,
// número, inclinação) sem guardar nada — o mesmo site sempre sai igual.
export const hashName = (name) => {
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export const getHost = (url, fallback = 'local') => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return fallback
  }
}
