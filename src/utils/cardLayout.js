export const DEFAULT_CARD_LAYOUT = 'wave-particle'
export const FALLBACK_CARD_LAYOUT = 'classic'

export const cardLayoutIds = [
  'classic',
  'space',
  'wave-particle',
  'quantum-spin',
  'cyber',
  'archive',
  'android',
  'berserk',
  'adesivo',
  'tanzaku',
  'vinil',
]

export function resolveCardLayout(layout) {
  if (!layout) return DEFAULT_CARD_LAYOUT
  // Migração do nome antigo sem perder a preferência já salva.
  if (layout === 'orbital') return 'space'
  return cardLayoutIds.includes(layout) ? layout : FALLBACK_CARD_LAYOUT
}
