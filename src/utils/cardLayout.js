export const DEFAULT_CARD_LAYOUT = 'wave-particle'
export const FALLBACK_CARD_LAYOUT = 'classic'

export const cardLayoutIds = [
  'classic',
  'orbital',
  'orbital-glass',
  'singularity',
  'wave-particle',
  'quantum-spin',
  'cyber',
]

export function resolveCardLayout(layout) {
  if (!layout) return DEFAULT_CARD_LAYOUT
  return cardLayoutIds.includes(layout) ? layout : FALLBACK_CARD_LAYOUT
}
