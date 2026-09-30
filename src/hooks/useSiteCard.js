import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useStore from '../store/useStore'
import { openSite } from '../utils/navigation'

// Estado comum a todo card de site: ordenação por arrastar, hover que revela
// editar/excluir e abertura via openSite() (é ele que registra a visita em
// Frequentes). `rootProps` vai espalhado no elemento raiz do card.
export function useSiteCard(site) {
  const confirmDeleteSite = useStore((state) => state.confirmDeleteSite)
  const openAddSite = useStore((state) => state.openAddSite)
  const setEditingSite = useStore((state) => state.setEditingSite)
  const openInNewTab = useStore((state) => state.openInNewTab)
  const [showActions, setShowActions] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id })

  const rootProps = {
    ref: setNodeRef,
    style: {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging || showActions ? 20 : 1,
    },
    onMouseEnter: () => setShowActions(true),
    onMouseLeave: () => setShowActions(false),
    ...attributes,
    ...listeners,
  }

  const open = () => openSite(site, openInNewTab)
  const edit = (event) => {
    event.stopPropagation()
    setEditingSite(site)
    openAddSite()
  }
  const remove = (event) => {
    event.stopPropagation()
    confirmDeleteSite(site.id)
  }

  return { rootProps, showActions, open, edit, remove }
}
