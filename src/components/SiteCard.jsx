// Componente SiteCard — delega para o layout correto via store
import { memo } from 'react'
import useStore from '../store/useStore'
import SiteCardClassic from './SiteCardClassic'
import SiteCardSpace from './SiteCardSpace'
import SiteCardWaveParticle from './SiteCardWaveParticle'
import SiteCardQuantumSpin from './SiteCardQuantumSpin'
import SiteCardCyberpunk from './SiteCardCyberpunk'
import SiteCardArchive from './SiteCardArchive'
import SiteCardAndroid from './SiteCardAndroid'

function SiteCard({ site }) {
  const cardLayout = useStore((state) => state.cardLayout)

  if (cardLayout === 'space') return <SiteCardSpace site={site} />
  if (cardLayout === 'wave-particle') return <SiteCardWaveParticle site={site} />
  if (cardLayout === 'quantum-spin') return <SiteCardQuantumSpin site={site} />
  if (cardLayout === 'cyber') return <SiteCardCyberpunk site={site} />
  if (cardLayout === 'archive') return <SiteCardArchive site={site} />
  if (cardLayout === 'android') return <SiteCardAndroid site={site} />

  return <SiteCardClassic site={site} />
}

export default memo(SiteCard)
