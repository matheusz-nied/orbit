import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import useStore, { searchProviders } from './store/useStore'
import { applyTheme } from './themes/themes'
import { trackOrbitUsage } from './utils/analytics'
import Clock from './components/Clock'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import SiteGrid from './components/SiteGrid'
import NewsFeed from './components/NewsFeed'
import SettingsModal from './components/SettingsModal'
import AddSiteModal from './components/AddSiteModal'
import ConfirmModal from './components/ConfirmModal'
import AIChatModal from './components/AIChatModal'
import StarCanvas from './components/StarCanvas'

export default function App() {
  const { theme, searchProvider, openSettings } = useStore()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    trackOrbitUsage({
      theme,
      searchProvider: searchProviders[searchProvider]?.name,
    })
  }, [theme, searchProvider])

  return (
    <div className="min-h-screen relative">
      {/* Star canvas for space theme */}
      <StarCanvas />

      {/* Main content */}
      <div className="relative z-10">
        {/* Settings button */}
        <button
          onClick={openSettings}
          className="fixed top-4 right-4 p-3 bg-card border border-border rounded-xl text-muted hover:text-accent hover:border-accent transition-colors z-20"
          title="Configurações"
        >
          <Settings size={20} />
        </button>

        {/* Main layout */}
        <div className="container mx-auto px-4 flex flex-col min-h-[85vh]">
          <div className="flex-1 flex flex-col pt-8">
            <Clock />
            <SearchBar />
            <CategoryFilter />
            <SiteGrid />
          </div>
        </div>

        {/* News Section (peeking from bottom) */}
        <div className="container mx-auto px-4 pb-16 pt-8 border-t border-border">
          <NewsFeed />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-muted text-sm">
          <p>Orbit · Sua página inicial personalizada</p>
        </footer>
      </div>

      {/* Modals */}
      <SettingsModal />
      <AddSiteModal />
      <ConfirmModal />
      <AIChatModal />
    </div>
  )
}
