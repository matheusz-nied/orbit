import { useState, memo } from 'react'
import { Globe } from 'lucide-react'
import { getFaviconUrl } from '../utils/favicon'

// O Google S2 devolve um globo genérico de 16x16 quando o domínio não tem
// favicon — e o Chrome exibe o PNG mesmo com status 404, então onError nunca
// dispara. Detectamos o globo pelo tamanho natural da imagem no onLoad.
const GENERIC_GLOBE_PX = 16

function SiteIcon({ name, url, imgClassName, fallbackClassName, fallbackStyle, alt }) {
  const faviconUrl = getFaviconUrl(url)
  const [failedUrl, setFailedUrl] = useState(null)
  const failed = !faviconUrl || failedUrl === faviconUrl

  if (failed) {
    const letter = name?.trim()?.[0]?.toUpperCase()
    return (
      <span
        className={`flex items-center justify-center ${fallbackClassName || ''}`}
        style={fallbackStyle}
      >
        {letter || <Globe size="60%" strokeWidth={1.75} />}
      </span>
    )
  }

  return (
    <img
      src={faviconUrl}
      alt={alt ?? name ?? ''}
      loading="lazy"
      decoding="async"
      className={imgClassName}
      onLoad={(e) => { if (e.target.naturalWidth <= GENERIC_GLOBE_PX) setFailedUrl(faviconUrl) }}
      onError={() => setFailedUrl(faviconUrl)}
    />
  )
}

export default memo(SiteIcon)
