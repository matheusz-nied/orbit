export const DEFAULT_CARD_LAYOUT = 'wave-particle'
export const FALLBACK_CARD_LAYOUT = 'classic'

export const cardLayoutIds = [
  'classic',
  'space',
  'orbital-glass',
  'singularity',
  'wave-particle',
  'quantum-spin',
  'cyber',
  'archive',
]

export function resolveCardLayout(layout) {
  if (!layout) return DEFAULT_CARD_LAYOUT
  // Migração do nome antigo sem perder a preferência já salva.
  if (layout === 'orbital') return 'space'
  return cardLayoutIds.includes(layout) ? layout : FALLBACK_CARD_LAYOUT
}
