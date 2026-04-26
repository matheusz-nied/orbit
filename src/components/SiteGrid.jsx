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
import useStore from '../store/useStore'
import SiteCard from './SiteCard'

export default function SiteGrid() {
  const { sites, activeCategory, searchQuery, reorderSites, cardLayout } = useStore()

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
    let result = [...sites].sort((a, b) => a.order - b.order)
    
    if (activeCategory !== 'all') {
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
  }, [sites, activeCategory, searchQuery])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredSites.findIndex(s => s.id === active.id)
    const newIndex = filteredSites.findIndex(s => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = [...filteredSites]
    const [removed] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, removed)

    reorderSites(newOrder.map(s => s.id))
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-12">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredSites.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className={
            cardLayout === 'magazine'
              ? 'grid grid-cols-[repeat(auto-fill,minmax(75px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(105px,1fr))] gap-3 sm:gap-4'
              : cardLayout === 'bento'
              ? 'grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-4'
              : cardLayout === 'terminal'
              ? 'flex flex-col max-w-4xl mx-auto w-full border border-border/30 rounded-lg overflow-hidden bg-card/20'
              : cardLayout === 'orbital'
              ? 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 justify-items-center py-4'
              : 'grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center'
          }>
            {filteredSites.map((site, index) => (
              <SiteCard key={site.id} site={site} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {filteredSites.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p>Nenhum site encontrado</p>
        </div>
      )}
    </div>
  )
}
