import { useEffect, useState } from 'react'
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
import DarkMatterCursor from './components/DarkMatterCursor'
import { useEasterEggs } from './hooks/useEasterEggs'
import Toast from './components/Toast'

export default function App() {
  const { theme, searchProvider, openSettings } = useStore()
  useEasterEggs()

  const [hintIndex, setHintIndex] = useState(0)
  const hints = [
    "Orbit · Sua página inicial personalizada",
    "💡 Dica: O que acontece se digitar 'do a barrel roll' na busca?",
    "⚠️ Aviso: Jamais pesquise por comandos como 'sudo rm -rf /'",
    "🕹️ Segredo: O clássico código (↑ ↑ ↓ ↓ ← → ← → B A) funciona aqui...",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex(prev => (prev + 1) % hints.length)
    }, 15000) // Troca a cada 15 segundos
    return () => clearInterval(interval)
  }, [])

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
      {/* Dark Matter singularity cursor effect */}
      {theme === 'dark-matter' && <DarkMatterCursor />}

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
        <footer className="relative h-16 py-6 overflow-hidden">
          <p
            key={hintIndex}
            className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm animate-fadeIn"
          >
            {hints[hintIndex]}
          </p>
        </footer>
      </div>

      {/* Modals */}
      <SettingsModal />
      <AddSiteModal />
      <ConfirmModal />
      <AIChatModal />
      <Toast />
    </div>
  )
}
