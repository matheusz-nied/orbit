// Componente SiteCard — delega para o layout correto via store
import { memo } from 'react'
import useStore from '../store/useStore'
import SiteCardClassic from './SiteCardClassic'
import SiteCardBento from './SiteCardBento'
import SiteCardMagazine from './SiteCardMagazine'
import SiteCardTerminal from './SiteCardTerminal'
import SiteCardOrbital from './SiteCardOrbital'
import SiteCardOrbitalGlass from './SiteCardOrbitalGlass'
import SiteCardSingularity from './SiteCardSingularity'
import SiteCardWaveParticle from './SiteCardWaveParticle'
import SiteCardQuantumSpin from './SiteCardQuantumSpin'

function SiteCard({ site, index }) {
  const cardLayout = useStore((state) => state.cardLayout)

  if (cardLayout === 'bento') return <SiteCardBento site={site} />
  if (cardLayout === 'magazine') return <SiteCardMagazine site={site} />
  if (cardLayout === 'terminal') return <SiteCardTerminal site={site} index={index} />
  if (cardLayout === 'orbital') return <SiteCardOrbital site={site} />
  if (cardLayout === 'orbital-glass') return <SiteCardOrbitalGlass site={site} />
  if (cardLayout === 'singularity') return <SiteCardSingularity site={site} />
  if (cardLayout === 'wave-particle') return <SiteCardWaveParticle site={site} />
  if (cardLayout === 'quantum-spin') return <SiteCardQuantumSpin site={site} />

  return <SiteCardClassic site={site} />
}

export default memo(SiteCard)
