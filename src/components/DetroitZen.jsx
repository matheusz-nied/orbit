// Jardim Zen: partículas de luz e pequenos triângulos (o símbolo da Cyberlife)
// que sobem devagar pelo fundo, como as pétalas do jardim da Amanda.
// Valores fixos (sem Math.random) para a cena não mudar entre renders.
// [left %, tamanho px, duração s, atraso s, deriva px, giro deg, opacidade, triângulo?]
const MOTES = [
  [6, 4, 46, -8, 40, 0, 0.55, false],
  [12, 14, 62, -30, -30, 140, 0.4, true],
  [19, 3, 38, -20, 24, 0, 0.5, false],
  [27, 5, 52, -44, -36, 0, 0.45, false],
  [34, 12, 70, -12, 50, -120, 0.35, true],
  [42, 3, 41, -33, -20, 0, 0.5, false],
  [50, 5, 58, -3, 30, 0, 0.4, false],
  [58, 16, 76, -52, -44, 160, 0.3, true],
  [66, 4, 44, -25, 36, 0, 0.55, false],
  [73, 3, 49, -38, -26, 0, 0.45, false],
  [80, 12, 66, -18, 34, -150, 0.35, true],
  [87, 5, 54, -47, -40, 0, 0.5, false],
  [93, 4, 43, -6, 22, 0, 0.5, false],
  [46, 10, 80, -60, -50, 130, 0.3, true],
]

export default function DetroitZen() {
  return (
    <div className="dbh-zen" aria-hidden>
      {MOTES.map(([left, size, duration, delay, drift, spin, opacity, triangle], i) => (
        <span
          key={i}
          className="dbh-mote gpu-layer"
          data-decorative
          style={{
            left: `${left}%`,
            width: size,
            height: size,
            '--dur': `${duration}s`,
            '--delay': `${delay}s`,
            '--drift': `${drift}px`,
            '--spin': `${spin}deg`,
            '--peak': opacity,
          }}
        >
          {triangle ? (
            <svg viewBox="0 0 20 20" width="100%" height="100%">
              <polygon points="10,2 18,17 2,17" />
            </svg>
          ) : (
            <i />
          )}
        </span>
      ))}
    </div>
  )
}
