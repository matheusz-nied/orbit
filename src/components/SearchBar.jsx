import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import useStore, { searchProviders } from '../store/useStore'

export default function SearchBar() {
  const { searchProvider, searchQuery, setSearchQuery, cycleSearchProvider, openChat, setInitialChatMessage, setTheme } = useStore()
  const [localQuery, setLocalQuery] = useState('')
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const provider = searchProviders[searchProvider]

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = (e) => {
    const value = e.target.value
    setLocalQuery(value)

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value)
    }, 150)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      cycleSearchProvider()
    } else if (e.key === 'Enter' && localQuery.trim()) {
      const q = localQuery.trim().toLowerCase()
      
      // Easter Eggs
      if (q === 'do a barrel roll') {
        document.body.classList.add('animate-barrel-roll')
        setTimeout(() => document.body.classList.remove('animate-barrel-roll'), 2000)
        setLocalQuery('')
        setSearchQuery('')
        return
      }
      
      if (q === 'sudo rm -rf /') {
        setTheme('hacking')
        document.body.classList.add('animate-shake')
        setTimeout(() => document.body.classList.remove('animate-shake'), 1000)
        setLocalQuery('')
        setSearchQuery('')
        return
      }

      // Normal Search Behavior
      if (provider.type === 'ai') {
        setInitialChatMessage(localQuery.trim())
        setLocalQuery('')
        setSearchQuery('')
        openChat()
      } else {
        window.open(provider.url + encodeURIComponent(localQuery.trim()), '_blank')
      }
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mb-8 animate-fadeIn">
      {/* Provider indicator above input */}
      <div className="flex items-center justify-center gap-2 mb-3 mr-7">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer hover:scale-105 transition-transform"
          style={{ backgroundColor: provider.color + '20', color: provider.color }}
          onClick={cycleSearchProvider}
          title="Clique ou pressione Tab para trocar"
        >
          <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold"
            style={{ backgroundColor: provider.color, color: '#fff' }}>
            {provider.icon}
          </span>
          <span>{provider.name}</span>
        </div>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Pesquisar ou filtrar sites..."
          className="w-full pl-12 pr-12 py-[0.625rem] bg-card border border-border rounded-xl text-text placeholder-muted text-lg focus:border-accent transition-colors"
        />

        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-accent transition-colors"
          onClick={() => inputRef.current?.focus()}
        >
          <Search size={20} />
        </button>
      </div>

      <p className="text-center text-muted text-sm mt-2">
        <kbd className="px-1.5 py-0.5 bg-border rounded text-xs">Tab</kbd> ou clique no provedor para trocar ·
        <kbd className="px-1.5 py-0.5 bg-border rounded text-xs ml-1">Enter</kbd> {provider.type === 'ai' ? 'para abrir o chat' : 'para pesquisar'}
      </p>
    </div>
  )
}
