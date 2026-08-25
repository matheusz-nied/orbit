// Componente SiteCard — delega para o layout correto via store
import { memo } from 'react'
import useStore from '../store/useStore'
import SiteCardClassic from './SiteCardClassic'
import SiteCardSpace from './SiteCardSpace'
import SiteCardOrbitalGlass from './SiteCardOrbitalGlass'
import SiteCardSingularity from './SiteCardSingularity'
import SiteCardWaveParticle from './SiteCardWaveParticle'
import SiteCardQuantumSpin from './SiteCardQuantumSpin'
import SiteCardCyberpunk from './SiteCardCyberpunk'
import SiteCardArchive from './SiteCardArchive'

function SiteCard({ site }) {
  const cardLayout = useStore((state) => state.cardLayout)

  if (cardLayout === 'space') return <SiteCardSpace site={site} />
  if (cardLayout === 'orbital-glass') return <SiteCardOrbitalGlass site={site} />
  if (cardLayout === 'singularity') return <SiteCardSingularity site={site} />
  if (cardLayout === 'wave-particle') return <SiteCardWaveParticle site={site} />
  if (cardLayout === 'quantum-spin') return <SiteCardQuantumSpin site={site} />
  if (cardLayout === 'cyber') return <SiteCardCyberpunk site={site} />
  if (cardLayout === 'archive') return <SiteCardArchive site={site} />

  return <SiteCardClassic site={site} />
}

export default memo(SiteCard)
