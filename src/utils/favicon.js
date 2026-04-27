const faviconCache = new Map()

export const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname
    if (faviconCache.has(domain)) {
      return faviconCache.get(domain)
    }
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    faviconCache.set(domain, faviconUrl)
    return faviconUrl
  } catch {
    return null
  }
}

export const getDomain = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
