import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, RotateCcw } from 'lucide-react'
import useStore from '../store/useStore'
import SiteCard from './SiteCard'
import { FREQUENT_CATEGORY, FREQUENT_LIMIT, rankByUsage } from '../utils/frequent'

// Constante de módulo em vez de `[]` inline: um array novo a cada render faria
// o DndContext reconfigurar os sensores sem necessidade.
const NO_SENSORS = []

export default function SiteGrid() {
  const sites = useStore((state) => state.sites)
  const activeCategory = useStore((state) => state.activeCategory)
  const searchQuery = useStore((state) => state.searchQuery)
  const setSearchQuery = useStore((state) => state.setSearchQuery)
  const setActiveCategory = useStore((state) => state.setActiveCategory)
  const reorderSites = useStore((state) => state.reorderSites)
  const openAddSite = useStore((state) => state.openAddSite)
  const cardLayout = useStore((state) => state.cardLayout)
  const activeWorkspace = useStore((state) => state.activeWorkspace)
  const siteStats = useStore((state) => state.siteStats)

  // Em "Frequentes" a ordem é derivada do uso, então arrastar não faria
  // sentido — a posição voltaria sozinha no próximo clique.
  const isFrequentView = activeCategory === FREQUENT_CATEGORY

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredSites = useMemo(() => {
    let result = [...sites]
      .filter(s => s.workspace === activeWorkspace)
      .sort((a, b) => a.order - b.order)

    if (isFrequentView) {
      result = rankByUsage(result, siteStats).slice(0, FREQUENT_LIMIT)
    } else if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.url.toLowerCase().includes(query)
      )
    }

    return result
  }, [sites, activeCategory, searchQuery, activeWorkspace, isFrequentView, siteStats])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (isFrequentView || !over || active.id === over.id) return

    const oldIndex = filteredSites.findIndex(s => s.id === active.id)
    const newIndex = filteredSites.findIndex(s => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = [...filteredSites]
    const [removed] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, removed)

    reorderSites(newOrder.map(s => s.id))
  }

  const gridClassName = useMemo(() => {
    if (cardLayout === 'archive') {
      return 'grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2.5 sm:gap-3 py-4'
    }
    if (cardLayout === 'space' || cardLayout === 'orbital-glass' || cardLayout === 'singularity' || cardLayout === 'quantum-spin' || cardLayout === 'cyber') {
      return 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 justify-items-center py-4'
    }
    if (cardLayout === 'wave-particle') {
      return 'grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 justify-items-center py-4'
    }
    return 'grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center'
  }, [cardLayout])

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-12">
      <DndContext
        sensors={isFrequentView ? NO_SENSORS : sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredSites.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className={gridClassName}>
            {filteredSites.map((site) => (
              <div key={site.id} className="relative w-full flex justify-center">
                {site.shortcut && (
                  <kbd
                    className={`absolute z-20 min-w-[1.25rem] px-1 py-0.5 text-[9px] font-mono font-bold text-center text-muted bg-card/90 border border-border rounded shadow-sm pointer-events-none uppercase ${
                      cardLayout === 'archive'
                        ? 'top-1/2 right-1.5 -translate-y-1/2'
                        : 'top-0 left-1/2 -translate-x-[calc(50%+28px)] sm:-translate-x-[calc(50%+32px)]'
                    }`}
                    title={`Atalho: ${site.shortcut}`}
                  >
                    {site.shortcut}
                  </kbd>
                )}
                <SiteCard site={site} />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredSites.length === 0 && (
        <div className="text-center py-12 px-6 bg-card/60 border border-border rounded-2xl text-muted max-w-xl mx-auto">
          <p className="text-base text-text font-medium mb-2">
            {isFrequentView && !searchQuery.trim() ? 'Ainda sem histórico de uso' : 'Nenhum site encontrado'}
          </p>
          <p className="text-sm mb-5">
            {searchQuery.trim()
              ? 'Tente limpar o filtro atual ou adicione um novo atalho para essa busca.'
              : isFrequentView
                ? 'Assim que você abrir alguns sites daqui, os mais usados aparecem nesta aba automaticamente.'
                : 'Essa categoria ainda não tem sites. Você pode adicionar um agora.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg border border-border rounded-lg text-text hover:border-accent transition-colors"
              >
                <RotateCcw size={16} />
                Limpar filtro
              </button>
            )}

            {activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg border border-border rounded-lg text-text hover:border-accent transition-colors"
              >
                <RotateCcw size={16} />
                Ver todas as categorias
              </button>
            )}

            <button
              onClick={openAddSite}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Adicionar site
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
