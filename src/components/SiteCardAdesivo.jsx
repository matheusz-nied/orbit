import { memo, useMemo } from 'react'
import { useSiteCard } from '../hooks/useSiteCard'
import { hashName } from '../utils/hash'
import SiteIcon from './SiteIcon'
import SiteCardActions from './SiteCardActions'

// Cores do adesivo (variáveis `--pop-*` do tema Brutalismo Pop).
const POP_COLORS = ['yellow', 'pink', 'blue', 'green', 'orange', 'lilac']

// Layout "Adesivo" (tema Brutalismo Pop): cada site é um adesivo colado meio
// torto, com cor fixa por nome e sombra dura. O clique "afunda" o adesivo.
function SiteCardAdesivo({ site }) {
  const { rootProps, showActions, open, edit, remove } = useSiteCard(site)

  const hash = useMemo(() => hashName(site.name), [site.name])
  const color = POP_COLORS[hash % POP_COLORS.length]
  // Inclinação de −2° a +2°, em passos de 1°.
  const tilt = (hash % 5) - 2

  return (
    <div {...rootProps} className="adesivo-site group relative w-full card-contain">
      <button
        type="button"
        className="adesivo-panel relative w-full"
        style={{ '--adesivo-bg': `var(--pop-${color})`, '--adesivo-tilt': `${tilt}deg` }}
        onClick={open}
        aria-label={`Abrir ${site.name}`}
      >
        <span className="adesivo-peel" aria-hidden />
        <span className="adesivo-icon" aria-hidden>
          <SiteIcon name={site.name} url={site.url} alt="" />
        </span>
        <span className="adesivo-name">{site.name}</span>
      </button>

      {showActions && <SiteCardActions site={site} onEdit={edit} onDelete={remove} className="absolute -bottom-3 -right-2" />}
    </div>
  )
}

export default memo(SiteCardAdesivo)
