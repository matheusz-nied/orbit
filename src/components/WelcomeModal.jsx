import { Rocket, Plus, Palette, Newspaper, X, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'

export default function WelcomeModal() {
  const welcomeSeen = useStore((state) => state.welcomeSeen)
  const dismissWelcome = useStore((state) => state.dismissWelcome)

  if (welcomeSeen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={dismissWelcome}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 p-6 animate-slideIn"
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
            Aqui você organiza seus sites favoritos em categorias e acessa tudo rapidamente.
          </p>

          <div className="space-y-3">


            <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
              <Plus size={18} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">Adicionar sites</p>
                <p className="text-xs text-muted mt-0.5">
                  Use o botão "Adicionar Site" no topo ou importe vários de uma vez em Configurações &gt; Dados.
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

            <div className="flex items-start gap-3 p-3 bg-bg rounded-xl border border-border">
              <Newspaper size={18} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">Notícias do TabNews</p>
                <p className="text-xs text-muted mt-0.5">
                  Na parte inferior, acompanhe os posts mais recentes e relevantes da comunidade tech brasileira.
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
