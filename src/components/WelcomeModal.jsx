import { Rocket, X } from 'lucide-react'
import useStore from '../store/useStore'
import OnboardingGuide from './OnboardingGuide'

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
            Essas dicas ficam sempre disponíveis em Configurações &gt; Comece por aqui.
          </p>

          <OnboardingGuide />
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
