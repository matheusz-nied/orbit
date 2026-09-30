import { memo, useMemo } from 'react'
import { useSiteCard } from '../hooks/useSiteCard'
import { hashName } from '../utils/hash'
import SiteIcon from './SiteIcon'
import SiteCardActions from './SiteCardActions'

// Layout "Tanzaku" (tema Sumi-e): tira de papel pendurada por um cordão, com
// o nome escrito na vertical, um selo hanko com a inicial e o favicon na base.
// Cada tira tem tom de papel e altura de queda próprios (fixos por nome), como
// um varal ao vento. No hover a tira balança uma vez, presa pelo cordão.
function SiteCardTanzaku({ site }) {
  const { rootProps, showActions, open, edit, remove } = useSiteCard(site)

  const hash = useMemo(() => hashName(site.name), [site.name])
  const tone = hash % 5
  // Queda extra de 0 a 18px e giro do selo de −4° a +4°.
  const drop = (hash % 7) * 3
  const sealTilt = ((hash >> 3) % 5) - 2
  const initial = site.name?.trim()?.[0]?.toUpperCase() || '?'

  return (
    <div {...rootProps} className="tanzaku-site group relative w-full card-contain">
      <button
        type="button"
        className="tanzaku-strip relative w-full"
        data-tone={tone}
        style={{ '--tanzaku-drop': `${drop}px`, '--tanzaku-seal-tilt': `${sealTilt * 2}deg` }}
        onClick={open}
        aria-label={`Abrir ${site.name}`}
      >
        <span className="tanzaku-cord" aria-hidden />
        <span className="tanzaku-hole" aria-hidden />
        <span className="tanzaku-seal" aria-hidden>{initial}</span>
        <span className="tanzaku-name">{site.name}</span>
        <span className="tanzaku-icon" aria-hidden>
          <SiteIcon name={site.name} url={site.url} alt="" />
        </span>
      </button>

      {showActions && <SiteCardActions site={site} onEdit={edit} onDelete={remove} className="absolute -bottom-3 -right-1" />}
    </div>
  )
}

export default memo(SiteCardTanzaku)
