import { useMemo } from 'react'

const STREAM_LINES = 18

// Linhas pseudo-hex determinísticas (sem Math.random: o conteúdo não muda
// entre renders e a lista duplicada fecha o loop sem emenda).
const buildStream = () => {
  let seed = 0x2038
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    // Bits baixos de um LCG repetem em ciclo curto — usa os altos.
    return seed >>> 12
  }
  const hex = (n) => n.toString(16).toUpperCase().padStart(4, '0').slice(-4)
  return Array.from({ length: STREAM_LINES }, (_, i) => {
    const tail = i % 5 === 3 ? 'OK' : hex(next() % 0xff).slice(-2)
    return `0x${hex(next())} · ${tail}`
  })
}

// Um batimento a cada 60 unidades; o path cobre 240 (o dobro da janela) para
// o translateX(-50%) fechar o loop sem salto.
const ECG_PATH = [0, 60, 120, 180]
  .map((x) => `M${x} 15 H${x + 30} L${x + 33} 15 L${x + 36} 5 L${x + 40} 25 L${x + 43} 10 L${x + 46} 15 H${x + 60}`)
  .join(' ')

// Periferia do HUD de android: fica nas margens laterais, só em telas largas
// (CSS esconde abaixo de 1280px). Tudo decorativo e sem clique.
export default function DetroitHud() {
  const stream = useMemo(buildStream, [])

  return (
    <div className="dbh-hud" aria-hidden>
      <span className="dbh-hud-corner dbh-hud-corner--tl" />
      <span className="dbh-hud-corner dbh-hud-corner--tr" />
      <span className="dbh-hud-corner dbh-hud-corner--bl" />
      <span className="dbh-hud-corner dbh-hud-corner--br" />

      <div className="dbh-hud-stream">
        <p className="dbh-hud-label">Memória</p>
        <div className="dbh-hud-stream-window">
          <ul className="dbh-hud-stream-list gpu-layer" data-decorative>
            {[...stream, ...stream].map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dbh-hud-pump">
        <p className="dbh-hud-label">
          Bomba de Thirium <b>72 bpm</b>
        </p>
        <div className="dbh-hud-pump-window">
          <svg className="dbh-hud-pump-trace gpu-layer" data-decorative viewBox="0 0 240 30" preserveAspectRatio="none">
            <path d={ECG_PATH} className="dbh-hud-pump-glow" />
            <path d={ECG_PATH} className="dbh-hud-pump-line" />
          </svg>
        </div>
      </div>

      <div className="dbh-hud-gauge">
        <p className="dbh-hud-label dbh-hud-label--vertical">Estabilidade</p>
        <div className="dbh-hud-gauge-track">
          <span className="dbh-hud-gauge-marker gpu-layer" data-decorative />
        </div>
      </div>
    </div>
  )
}
