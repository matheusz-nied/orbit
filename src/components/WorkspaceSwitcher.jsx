import { useMemo } from 'react'
import { Layers } from 'lucide-react'
import useStore from '../store/useStore'

export default function WorkspaceSwitcher() {
  const workspaces = useStore((state) => state.workspaces)
  const activeWorkspace = useStore((state) => state.activeWorkspace)
  const setActiveWorkspace = useStore((state) => state.setActiveWorkspace)
  const sites = useStore((state) => state.sites)

  const countByWorkspace = useMemo(() => {
    const counts = {}
    for (const site of sites) {
      counts[site.workspace] = (counts[site.workspace] || 0) + 1
    }
    return counts
  }, [sites])

  // Com um espaço só, o seletor não oferece escolha nenhuma — melhor não
  // ocupar a tela até o usuário criar o segundo.
  if (workspaces.length < 2) return null

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-3 animate-fadeIn">
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-hide">
        <Layers size={16} className="text-muted flex-shrink-0" />

        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspace
          return (
            <button
              key={workspace.id}
              onClick={() => setActiveWorkspace(workspace.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-muted hover:text-text hover:border-accent/50'
              }`}
            >
              {workspace.name}
              <span className={isActive ? 'text-accent/70' : 'text-muted/60'}>
                {countByWorkspace[workspace.id] || 0}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
