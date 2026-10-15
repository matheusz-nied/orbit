import { memo, useMemo } from 'react'
import { useSiteCard } from '../hooks/useSiteCard'
import { hashName, getHost } from '../utils/hash'
import SiteIcon from './SiteIcon'
import SiteCardActions from './SiteCardActions'

// Layout "Exsicata" (tema Herbário): ficha de espécime prensado presa por
// tirinhas de papel gomado nos cantos e um alfinete entomológico de latão no
// topo. No hover uma lente de aumento focaliza o ícone; no clique o alfinete
// afunda na prancha.
function SiteCardExsicata({ site }) {
  const { rootProps, showActions, open, edit, remove } = useSiteCard(site)

  const hash = useMemo(() => hashName(site.name), [site.name])
  const host = useMemo(() => getHost(site.url), [site.url])
  const specimenNo = String((hash % 89) + 11).padStart(3, '0')
  const tapeVariant = hash % 3
  const pinTilt = ((hash >> 2) % 5) - 2

  return (
    <div {...rootProps} className="exsicata-site group relative w-full card-contain">
      <button
        type="button"
        className="exsicata-sheet relative w-full"
        data-tape={tapeVariant}
        style={{ '--exsicata-pin-tilt': `${pinTilt * 3}deg` }}
        onClick={open}
        aria-label={`Abrir ${site.name}`}
      >
        <span className="exsicata-pin" aria-hidden />
        <span className="exsicata-mount" aria-hidden>
          <span className="exsicata-icon">
            <SiteIcon name={site.name} url={site.url} alt="" />
          </span>
          <span className="exsicata-loupe" />
        </span>
        <span className="exsicata-label">
          <small className="exsicata-meta">
            <span>Nº {specimenNo}</span>
            <span>{host}</span>
          </small>
          <strong className="exsicata-name">{site.name}</strong>
        </span>
      </button>

      {showActions && <SiteCardActions site={site} onEdit={edit} onDelete={remove} className="absolute -top-2 -right-2" />}
    </div>
  )
}

export default memo(SiteCardExsicata)
