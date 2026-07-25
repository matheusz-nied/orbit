import useStore from '../store/useStore'
import { normalizeHttpUrl } from './url'

export function openUrl(url, openInNewTab) {
  const safeUrl = normalizeHttpUrl(url)
  if (!safeUrl) return

  if (openInNewTab) {
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
    return
  }

  window.location.assign(safeUrl)
}

// Ponto único de abertura de sites: registra a visita antes de navegar, para
// que os 9 layouts de card não precisem repetir essa lógica.
// Lê o store via getState() em vez de hook porque isso roda em handler de
// evento, não durante o render.
export function openSite(site, openInNewTab) {
  useStore.getState().registerSiteVisit(site.id)
  openUrl(site.url, openInNewTab)
}
