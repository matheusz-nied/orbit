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
    </div>
  )
}
