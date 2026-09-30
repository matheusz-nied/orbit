// Cinzas do Eclipse: flocos de cinza caem devagar e algumas brasas sobem da
// fogueira. Valores fixos (sem Math.random) para a cena não mudar entre renders.
// [left %, tamanho px, duração s, atraso s, deriva px, giro deg, opacidade, brasa?]
const FLECKS = [
  [4, 3, 34, -6, 30, 90, 0.5, false],
  [10, 2, 42, -22, -24, -60, 0.4, false],
  [16, 4, 38, -14, 36, 120, 0.45, false],
  [23, 2, 46, -34, -30, -90, 0.35, false],
  [31, 3, 36, -2, 26, 70, 0.5, false],
  [38, 5, 50, -28, -40, 140, 0.3, false],
  [45, 2, 40, -18, 22, -80, 0.4, false],
  [52, 3, 44, -40, -28, 100, 0.45, false],
  [60, 4, 37, -9, 34, -110, 0.4, false],
  [67, 2, 48, -30, -22, 60, 0.35, false],
  [74, 3, 35, -16, 28, 130, 0.5, false],
  [81, 5, 52, -44, -38, -100, 0.3, false],
  [88, 2, 41, -24, 20, 80, 0.4, false],
  [95, 3, 39, -11, -26, -70, 0.45, false],
  // Brasas: sobem, laranja quente, mais raras.
  [14, 6, 30, -10, 26, 0, 0.8, true],
  [39, 5, 36, -26, -20, 0, 0.7, true],
  [63, 6, 33, -4, 30, 0, 0.8, true],
  [85, 5, 38, -20, -24, 0, 0.7, true],
]

export default function BerserkAsh() {
  return (
    <div className="berserk-ash" aria-hidden>
      {FLECKS.map(([left, size, duration, delay, drift, spin, opacity, ember], i) => (
        <span
          key={i}
          className={`berserk-fleck gpu-layer${ember ? ' berserk-fleck--ember' : ''}`}
          data-decorative
          style={{
            left: `${left}%`,
            top: ember ? '100%' : '-24px',
            width: size,
            height: size,
            '--dur': `${duration}s`,
            '--delay': `${delay}s`,
            '--drift': `${drift}px`,
            '--spin': `${spin}deg`,
            '--travel': ember ? '-112vh' : '112vh',
            '--peak': opacity,
          }}
        />
      ))}
    </div>
  )
}
