import { useEffect, useState, memo } from 'react'

const hints = [
  'Orbit · Sua página inicial personalizada',
  "💡 Dica: O que acontece se digitar 'do a barrel roll' na busca?",
  "⚠️ Aviso: Jamais pesquise por comandos como 'sudo rm -rf /'",
  '🕹️ Segredo: O clássico código (↑ ↑ ↓ ↓ ← → ← → B A) funciona aqui...',
]

// Isolado do App: antes o intervalo de 15s re-renderizava toda a árvore
// (relógio, busca, grid, notícias) só para trocar uma frase no rodapé.
function FooterHints() {
  const [hintIndex, setHintIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="relative h-16 py-6 overflow-hidden">
      <p
        key={hintIndex}
        className="absolute inset-0 flex items-center justify-center text-center text-muted text-sm animate-fadeIn"
      >
        {hints[hintIndex]}
      </p>
    </footer>
  )
}

export default memo(FooterHints)
