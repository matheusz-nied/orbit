import { Rocket, Plus, Palette, Keyboard, ListTodo, X, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'

export default function WelcomeModal() {
  const welcomeSeen = useStore((state) => state.welcomeSeen)
  const dismissWelcome = useStore((state) => state.dismissWelcome)

  if (welcomeSeen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={dismissWelcome}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 p-6 animate-slideIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Rocket size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text">Bem-vindo ao Orbit</h2>
              <p className="text-sm text-muted">Sua página inicial personalizada.</p>
            </div>
          </div>
          <button
            onClick={dismissWelcome}
            className="text-muted hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">
            Organize sites, use atalhos de teclado e acompanhe a agenda do dia — tudo neste navegador.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
              <Plus size={18} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">Adicionar sites</p>
                <p className="text-xs text-muted mt-0.5">
                  Use o botão &quot;Adicionar Site&quot; no topo ou importe vários de uma vez em Configurações &gt; Dados.
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
                  Em Configurações &gt; Tema você escolhe o visual e o layout dos cards que combina com você.
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
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={dismissWelcome}
            className="px-5 py-2.5 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
