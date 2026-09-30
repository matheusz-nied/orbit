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

// Grade de cada layout de card. Strings completas (não montadas) para o
// Tailwind conseguir enxergar as classes.
const DEFAULT_GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center'
const SPACED_GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 justify-items-center py-4'
const GRID_CLASSES = {
  archive: 'grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 sm:gap-2.5 py-4',
  android: 'grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3 sm:gap-3.5 py-4',
  berserk: 'grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-3 sm:gap-4 py-4',
  adesivo: 'grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4 sm:gap-5 py-4',
  tanzaku: 'grid grid-cols-[repeat(auto-fill,minmax(76px,88px))] justify-start items-start gap-x-4 gap-y-8 py-4',
  vinil: 'grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-4 gap-y-8 justify-items-center py-4',
  space: SPACED_GRID_CLASS,
  'quantum-spin': SPACED_GRID_CLASS,
  cyber: SPACED_GRID_CLASS,
  'wave-particle': 'grid grid-cols-[repeat(auto-fill,minmax(95px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 justify-items-center py-4',
}

// Posição do atalho de teclado (<kbd>) sobre o card; o padrão cabe no Clássico.
const DEFAULT_KBD_CLASS = 'top-0 left-1/2 -translate-x-[calc(50%+28px)] sm:-translate-x-[calc(50%+32px)]'
const KBD_CLASSES = {
  archive: 'top-1/2 right-1.5 -translate-y-1/2',
  android: 'top-[42%] right-1.5 -translate-y-1/2',
  berserk: 'top-[42%] right-1.5 -translate-y-1/2',
  adesivo: 'top-2 left-2',
  tanzaku: 'top-1 left-1',
}

// Constante de módulo em vez de `[]` inline: um array novo a cada render faria
// o DndContext reconfigurar os sensores sem necessidade.
const NO_SENSORS = []

export default function SiteGrid() {
  const sites = useStore((state) => state.sites)
  const activeCategory = useStore((state) => state.activeCategory)
  const activeSubcategory = useStore((state) => state.activeSubcategory)
  const setActiveSubcategory = useStore((state) => state.setActiveSubcategory)
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
      if (activeSubcategory) {
        result = result.filter(s => s.subcategory === activeSubcategory)
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.url.toLowerCase().includes(query)
      )
    }

    return result
  }, [sites, activeCategory, activeSubcategory, searchQuery, activeWorkspace, isFrequentView, siteStats])

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

  const gridClassName = GRID_CLASSES[cardLayout] || DEFAULT_GRID_CLASS

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
                    className={`absolute z-20 min-w-[1.25rem] px-1 py-0.5 text-[9px] font-mono font-bold text-center text-muted bg-card/90 border border-border rounded shadow-sm pointer-events-none uppercase ${KBD_CLASSES[cardLayout] || DEFAULT_KBD_CLASS}`}
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

            {activeSubcategory && (
              <button
                onClick={() => setActiveSubcategory(null)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg border border-border rounded-lg text-text hover:border-accent transition-colors"
              >
                <RotateCcw size={16} />
                Ver tudo da categoria
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
