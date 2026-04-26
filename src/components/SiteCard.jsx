// Componente SiteCard — delega para o layout correto via store
import useStore from '../store/useStore'
import SiteCardClassic from './SiteCardClassic'
import SiteCardBento from './SiteCardBento'
import SiteCardMagazine from './SiteCardMagazine'

export default function SiteCard({ site }) {
  const { cardLayout } = useStore()

  if (cardLayout === 'bento') return <SiteCardBento site={site} />
  if (cardLayout === 'magazine') return <SiteCardMagazine site={site} />
  return <SiteCardClassic site={site} />
}
