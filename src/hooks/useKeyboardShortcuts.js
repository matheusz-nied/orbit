import { useEffect } from 'react'
import useStore from '../store/useStore'
import { openSite } from '../utils/navigation'

const FOCUS_SEARCH_EVENT = 'orbit:focus-search'

export const focusSearchBar = () => {
  window.dispatchEvent(new CustomEvent(FOCUS_SEARCH_EVENT))
}

const isTypingContext = (target) => {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

const isModalOpen = (state) =>
  state.settingsOpen ||
  state.addSiteOpen ||
  state.chatOpen ||
  state.deleteConfirmId != null

export function useKeyboardShortcuts() {
  const sites = useStore((state) => state.sites)
  const activeWorkspace = useStore((state) => state.activeWorkspace)
  const openInNewTab = useStore((state) => state.openInNewTab)
  const widgets = useStore((state) => state.widgets)
  const toggleDockPanel = useStore((state) => state.toggleDockPanel)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingContext(e.target)) return

      const state = useStore.getState()
      if (isModalOpen(state)) return

      if (e.key === '/') {
        e.preventDefault()
        focusSearchBar()
        return
      }

      if (e.key === 't' || e.key === 'T') {
        if (!widgets.agenda) return
        e.preventDefault()
        toggleDockPanel('agenda')
        return
      }

      const key = e.key.length === 1 ? e.key.toLowerCase() : ''
      if (!/^[a-z0-9]$/.test(key)) return

      const site = sites.find(
        (s) =>
          s.workspace === activeWorkspace &&
          s.shortcut &&
          s.shortcut.toLowerCase() === key,
      )
      if (!site) return

      e.preventDefault()
      openSite(site, openInNewTab)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sites, activeWorkspace, openInNewTab, widgets.agenda, toggleDockPanel])
}

export { FOCUS_SEARCH_EVENT }
