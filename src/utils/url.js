// Apenas http(s) — bloqueia javascript:, data:, file:, etc.
export function normalizeHttpUrl(value) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

export function isSafeHttpUrl(value) {
  return normalizeHttpUrl(value) !== null
}
