export function openUrl(url, openInNewTab) {
  if (openInNewTab) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  window.location.assign(url)
}
