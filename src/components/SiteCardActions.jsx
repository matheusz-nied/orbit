import { Pencil, Trash2 } from 'lucide-react'

// Botões editar/excluir que aparecem no hover. Cada layout posiciona o
// contêiner via `className` e pode reestilizar os botões por `.site-card-action`.
export default function SiteCardActions({ site, onEdit, onDelete, className = 'absolute -top-2 -right-2' }) {
  const base = 'site-card-action p-1.5 bg-card border border-border text-muted transition-colors'
  return (
    <div className={`${className} flex gap-1.5 animate-slideIn z-30`}>
      <button onClick={onEdit} className={`${base} hover:text-accent hover:border-accent`} aria-label={`Editar ${site.name}`}>
        <Pencil size={12} />
      </button>
      <button onClick={onDelete} className={`${base} hover:text-red-400 hover:border-red-400`} aria-label={`Excluir ${site.name}`}>
        <Trash2 size={12} />
      </button>
    </div>
  )
}
