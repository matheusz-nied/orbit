/** Tecla única válida para atalho de site (a–z, 0–9). */
export const isValidSiteShortcut = (key) => /^[a-z0-9]$/.test(key)

export const normalizeShortcutKey = (key) => {
  if (!key || typeof key !== 'string') return ''
  const k = key.length === 1 ? key.toLowerCase() : ''
  return isValidSiteShortcut(k) ? k : ''
}

/** Conflito com outro site no mesmo workspace ou global? (atalhos são globais). */
export const findShortcutConflict = (sites, shortcut, excludeId = null) => {
  if (!shortcut) return null
  return sites.find(
    (s) => s.id !== excludeId && s.shortcut && s.shortcut.toLowerCase() === shortcut.toLowerCase(),
  ) || null
}
