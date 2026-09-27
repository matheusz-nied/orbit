import { Plus, Search, Keyboard, ListTodo, Palette, ExternalLink } from 'lucide-react'

// Conteúdo compartilhado entre o WelcomeModal (primeira visita) e a aba
// "Comece por aqui" das Configurações (consulta a qualquer momento).
export default function OnboardingGuide() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
        <Plus size={18} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-text">Adicionar sites</p>
          <p className="text-xs text-muted mt-0.5">
            Use o botão &quot;Adicionar Site&quot; no topo ou importe vários de uma vez em Configurações &gt; Adicionar em lote.
            Ao escolher uma categoria, use o <span className="text-text">+</span> logo abaixo para criar subcategorias (ex.: um projeto em Trabalho).
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
        <Search size={18} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-text">Buscar</p>
          <p className="text-xs text-muted mt-0.5">
            Digite na barra de busca para filtrar seus sites, ou pressione <kbd className="px-1 py-0.5 bg-border rounded text-[10px]">Enter</kbd> para pesquisar na web.
            Clique no quadradinho colorido à esquerda da barra (não na lupa) — ou pressione <kbd className="px-1 py-0.5 bg-border rounded text-[10px]">Tab</kbd> — para trocar entre Google, DuckDuckGo, YouTube, Ecosia e o Chat IA.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
        <Keyboard size={18} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-text">Atalhos de teclado</p>
          <p className="text-xs text-muted mt-0.5">
            Ao editar um site, defina uma tecla (a–z ou 0–9) para abri-lo na hora.
            Pressione <kbd className="px-1 py-0.5 bg-border rounded text-[10px]">/</kbd> para focar a busca
            e <kbd className="px-1 py-0.5 bg-border rounded text-[10px]">t</kbd> para a agenda.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
        <ListTodo size={18} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-text">Agenda do dia</p>
          <p className="text-xs text-muted mt-0.5">
            No canto inferior, anote o que precisa fazer hoje. Pendentes passam para amanhã; concluídas somem à meia-noite.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
        <Palette size={18} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-text">Mudar tema e layout</p>
          <p className="text-xs text-muted mt-0.5">
            Em Configurações &gt; Tema e visual você escolhe o visual e o layout dos cards que combina com você.
          </p>
        </div>
      </div>

      <a
        href="https://chromewebstore.google.com/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 p-3 bg-accent/10 rounded-xl border border-accent/30 hover:border-accent transition-colors"
      >
        <ExternalLink size={18} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-accent">Use como nova aba</p>
          <p className="text-xs text-muted mt-0.5">
            Instale a extensão <span className="text-text font-medium">New Tab Redirect</span> (de terceiros, não é do Orbit) para abrir o Orbit em cada nova aba.
          </p>
        </div>
      </a>
    </div>
  )
}
