// Componente SiteCard — delega para o layout correto via store
import useStore from '../store/useStore'
import SiteCardClassic from './SiteCardClassic'
import SiteCardBento from './SiteCardBento'
import SiteCardMagazine from './SiteCardMagazine'
import SiteCardTerminal from './SiteCardTerminal'
import SiteCardOrbital from './SiteCardOrbital'
import SiteCardOrbitalGlass from './SiteCardOrbitalGlass'

export default function SiteCard({ site, index }) {
  const { cardLayout } = useStore()

  if (cardLayout === 'bento') return <SiteCardBento site={site} />
  if (cardLayout === 'magazine') return <SiteCardMagazine site={site} />
  if (cardLayout === 'terminal') return <SiteCardTerminal site={site} index={index} />
  if (cardLayout === 'orbital') return <SiteCardOrbital site={site} />
  if (cardLayout === 'orbital-glass') return <SiteCardOrbitalGlass site={site} />
  
  return <SiteCardClassic site={site} />
}
