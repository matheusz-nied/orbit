// Controle global de animações — reduz custo de GPU/CPU em máquinas mais fracas.
// Modos: 'auto' (segue o sistema), 'full' (tudo ligado), 'reduced' (só o essencial).

const QUERY = '(prefers-reduced-motion: reduce)'

export const motionModes = [
  { id: 'auto', label: 'Automático', desc: 'Segue a preferência do sistema' },
  { id: 'full', label: 'Completo', desc: 'Todas as animações decorativas' },
  { id: 'reduced', label: 'Leve', desc: 'Menos animações, mais desempenho' },
]

export const systemPrefersReducedMotion = () => {
  try {
    return window.matchMedia(QUERY).matches
  } catch {
    return false
  }
}

export const resolveMotion = (mode) => {
  if (mode === 'reduced') return 'reduced'
  if (mode === 'full') return 'full'
  return systemPrefersReducedMotion() ? 'reduced' : 'full'
}

// Escreve o atributo que o CSS usa para desligar animações infinitas e blurs caros.
export const applyMotion = (mode) => {
  document.documentElement.setAttribute('data-motion', resolveMotion(mode))
}

// Reavalia quando o usuário muda a preferência do sistema (só importa no modo 'auto').
export const watchSystemMotion = (onChange) => {
  try {
    const mql = window.matchMedia(QUERY)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  } catch {
    return () => {}
  }
}
