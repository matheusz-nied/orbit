import { Plus, Star } from 'lucide-react'
import useStore from '../store/useStore'
import { FREQUENT_CATEGORY, hasUsageData } from '../utils/frequent'

const categoryLabels = {
  all: 'Todos',
  dev: 'Dev',
  trabalho: 'Trabalho',
  social: 'Social',
  entretenimento: 'Entretenimento',
}

export default function CategoryFilter() {
  const categories = useStore((state) => state.categories)
  const activeCategory = useStore((state) => state.activeCategory)
  const setActiveCategory = useStore((state) => state.setActiveCategory)
  const openAddSite = useStore((state) => state.openAddSite)
  const siteStats = useStore((state) => state.siteStats)
  const widgets = useStore((state) => state.widgets)

  // Só aparece depois que existe histórico — uma aba sempre vazia no primeiro
  // uso seria só ruído.
  const showFrequent = widgets.frequent && hasUsageData(siteStats)

  const allCategories = ['all', ...categories]

  return (
    <div className="orbit-category-filter w-full max-w-6xl mx-auto px-4 mb-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide flex-1">
          {showFrequent && (
            <button
              onClick={() => setActiveCategory(FREQUENT_CATEGORY)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === FREQUENT_CATEGORY
                  ? 'bg-accent text-[#1a1a1a]'
                  : 'text-muted hover:text-text hover:bg-card'
              }`}
            >
              <Star size={14} />
              Frequentes
            </button>
          )}

          {allCategories.map(cat => {
            const isActive = activeCategory === cat
            const label = categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-accent text-[#1a1a1a]'
                    : 'text-muted hover:text-text hover:bg-card'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <button
          onClick={openAddSite}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-muted text-sm font-medium hover:text-text hover:border-accent transition-colors flex-shrink-0"
          title="Adicionar Site"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Adicionar Site</span>
        </button>
      </div>
    </div>
  )
}
