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
import SiteCardBerserk from './SiteCardBerserk'
import SiteCardAdesivo from './SiteCardAdesivo'
import SiteCardTanzaku from './SiteCardTanzaku'
import SiteCardVinil from './SiteCardVinil'

// id do layout (utils/cardLayout.js) -> componente. Id desconhecido cai no Clássico.
const LAYOUT_COMPONENTS = {
  space: SiteCardSpace,
  'wave-particle': SiteCardWaveParticle,
  'quantum-spin': SiteCardQuantumSpin,
  cyber: SiteCardCyberpunk,
  archive: SiteCardArchive,
  android: SiteCardAndroid,
  berserk: SiteCardBerserk,
  adesivo: SiteCardAdesivo,
  tanzaku: SiteCardTanzaku,
  vinil: SiteCardVinil,
}

function SiteCard({ site }) {
  const cardLayout = useStore((state) => state.cardLayout)
  const Layout = LAYOUT_COMPONENTS[cardLayout] || SiteCardClassic

  return <Layout site={site} />
}

export default memo(SiteCard)
