// Chuva na janela do tema Lo-fi: fios finos de chuva caindo em diagonal e
// gotas grandes escorrendo devagar pelo vidro. Valores fixos (sem
// Math.random) para a cena não mudar entre renders; só transform/opacity.
// Fios: [left %, comprimento px, duração s, atraso s, opacidade]
const STREAKS = [
  [3, 34, 1.7, -0.3, 0.3], [8, 22, 1.4, -1.1, 0.22], [13, 40, 2.1, -0.7, 0.28],
  [18, 26, 1.5, -1.6, 0.2], [24, 36, 1.9, -0.2, 0.3], [29, 24, 1.3, -0.9, 0.22],
  [34, 42, 2.2, -1.4, 0.26], [40, 28, 1.6, -0.5, 0.24], [45, 34, 1.8, -1.9, 0.3],
  [51, 22, 1.4, -0.8, 0.2], [56, 38, 2.0, -1.2, 0.28], [61, 26, 1.5, -0.1, 0.22],
  [66, 40, 2.1, -1.7, 0.3], [71, 24, 1.3, -0.6, 0.2], [76, 34, 1.7, -1.3, 0.26],
  [81, 28, 1.6, -0.4, 0.24], [86, 42, 2.2, -1.0, 0.3], [91, 22, 1.4, -1.8, 0.2],
  [95, 36, 1.9, -0.7, 0.28], [98, 26, 1.5, -1.5, 0.22],
]

// Gotas: [left %, tamanho px, duração s, atraso s]
const DROPS = [
  [7, 7, 34, -6], [19, 5, 42, -22], [33, 8, 38, -14],
  [47, 5, 46, -30], [59, 7, 36, -2], [72, 6, 44, -18], [88, 8, 40, -26],
]

export default function LofiRain() {
  return (
    <div className="lofi-rain" aria-hidden>
      {STREAKS.map(([left, length, duration, delay, opacity], i) => (
        <span
          key={`s${i}`}
          className="lofi-streak gpu-layer"
          data-decorative
          style={{
            left: `${left}%`,
            height: length,
            '--dur': `${duration}s`,
            '--delay': `${delay}s`,
            '--peak': opacity,
          }}
        />
      ))}
      {DROPS.map(([left, size, duration, delay], i) => (
        <span
          key={`d${i}`}
          className="lofi-drop gpu-layer"
          data-decorative
          style={{
            left: `${left}%`,
            width: size,
            height: size * 1.35,
            '--dur': `${duration}s`,
            '--delay': `${delay}s`,
          }}
        />
      ))}
    </div>
  )
}
