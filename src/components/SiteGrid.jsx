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
  const { sites, activeCategory, searchQuery, reorderSites } = useStore()

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
    if (active.id !== over?.id) {
      const oldIndex = filteredSites.findIndex(s => s.id === active.id)
      const newIndex = filteredSites.findIndex(s => s.id === over.id)
      
      const newOrder = [...filteredSites]
      const [removed] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, removed)
      
      reorderSites(newOrder.map(s => s.id))
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-36">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredSites.map(s => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-4 justify-items-center">
            {filteredSites.map(site => (
              <SiteCard key={site.id} site={site} />
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
