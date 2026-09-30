import { memo, useMemo } from 'react'
import { useSiteCard } from '../hooks/useSiteCard'
import { hashName } from '../utils/hash'
import SiteIcon from './SiteIcon'
import SiteCardActions from './SiteCardActions'

// Layout "Vinil" (tema Lo-fi): um disco com sulcos e rótulo colorido com o
// favicon. No hover o braço da vitrola pousa e o disco gira; o brilho fica
// parado por cima, como a luz da lâmpada no vinil de verdade.
function SiteCardVinil({ site }) {
  const { rootProps, showActions, open, edit, remove } = useSiteCard(site)
  const tone = useMemo(() => hashName(site.name) % 5, [site.name])

  return (
    <div {...rootProps} className="vinil-site group relative flex flex-col items-center card-contain">
      <button
        type="button"
        className="vinil-disc relative"
        data-tone={tone}
        onClick={open}
        aria-label={`Abrir ${site.name}`}
      >
        <span className="vinil-spin" aria-hidden>
          <span className="vinil-label">
            <SiteIcon name={site.name} url={site.url} alt="" />
          </span>
        </span>
        <span className="vinil-sheen" aria-hidden />
        <span className="vinil-arm" aria-hidden />
      </button>

      <span className="vinil-name">{site.name}</span>

      {showActions && <SiteCardActions site={site} onEdit={edit} onDelete={remove} className="absolute -top-1 -right-1 flex-col" />}
    </div>
  )
}

export default memo(SiteCardVinil)
