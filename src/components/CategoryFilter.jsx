import { Filter, Plus } from 'lucide-react'
import useStore from '../store/useStore'

const categoryLabels = {
  all: 'Todos',
  dev: 'Dev',
  trabalho: 'Trabalho',
  social: 'Social',
  entretenimento: 'Entretenimento',
}

export default function CategoryFilter() {
  const { categories, activeCategory, setActiveCategory, openAddSite } = useStore()

  const allCategories = ['all', ...categories]

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide flex-1">
          <Filter size={18} className="text-muted flex-shrink-0" />
          
          {allCategories.map(cat => {
            const isActive = activeCategory === cat
            const label = categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)
            
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-accent'
                    : 'bg-card border border-border hover:border-accent'
                }`}
                style={{ color: isActive ? '#1a1a1a' : 'var(--text)' }}
              >
                {label}
              </button>
            )
          })}
        </div>
        
        <button
          onClick={openAddSite}
          className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg text-[#1a1a1a] text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Adicionar Site</span>
        </button>
      </div>
    </div>
  )
}
