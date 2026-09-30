import useStore from '../store/useStore'

// Cabeçalho de três colunas dos temas mais recentes. O texto é dado aqui; o
// visual é todo do CSS de cada tema (`[data-theme="x"] .theme-masthead`).
const MASTHEADS = {
  pop: { label: 'Orbit Pop', left: 'Vol. 01', center: 'Orbit Pop!', right: 'Edição especial' },
  sumie: { label: 'Sumi-e', left: '墨絵', center: 'Sumi-e', right: '静' },
  // `action: 'rain'` troca o texto da direita por um botão que liga o som de chuva.
  lofi: { label: 'Lo-fi', left: 'Quarto · 02:14', center: 'Lo-fi', action: 'rain' },
}

export default function ThemeMasthead() {
  const theme = useStore((state) => state.theme)
  const rainPlaying = useStore((state) => state.ambientPlaying && state.ambient.sound === 'rain')
  const playAmbient = useStore((state) => state.playAmbient)
  const stopAmbient = useStore((state) => state.stopAmbient)
  const masthead = MASTHEADS[theme]
  if (!masthead) return null

  return (
    <header className="theme-masthead" aria-label={masthead.label}>
      <span>{masthead.left}</span>
      <strong>{masthead.center}</strong>
      {masthead.action === 'rain' ? (
        <button
          type="button"
          className="theme-masthead-action"
          aria-pressed={rainPlaying}
          onClick={() => (rainPlaying ? stopAmbient() : playAmbient('rain'))}
        >
          {rainPlaying ? 'Parar a chuva ■' : 'Tocar a chuva ▶'}
        </button>
      ) : (
        <span>{masthead.right}</span>
      )}
    </header>
  )
}
