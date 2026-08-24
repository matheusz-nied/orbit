import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { resolveMotion } from '../utils/motion'

const MAX_STARS = 220
const AREA_PER_STAR = 8000
const TARGET_FPS = 30
const FRAME_MS = 1000 / TARGET_FPS
// Movimento e cintilação são definidos por segundo (não por frame), então o
// visual não muda se o navegador entregar 30, 60 ou 144 fps.
const BASE_FPS = 60

// Opacidade é discretizada em faixas para desenhar todas as estrelas de uma
// faixa num único path. Sem isso seriam N chamadas de fill + N strings
// `rgba(...)` alocadas por frame.
const OPACITY_STEPS = 10
const STAR_COLORS = [
  [205, 220, 255],
  [255, 255, 255],
  [181, 194, 255],
]

const FILL_STYLES = STAR_COLORS.map(([r, g, b]) =>
  Array.from(
    { length: OPACITY_STEPS + 1 },
    (_, i) => `rgba(${r}, ${g}, ${b}, ${(i / OPACITY_STEPS).toFixed(2)})`,
  ),
)

const createStars = (width, height) => {
  const count = Math.min(Math.floor((width * height) / AREA_PER_STAR), MAX_STARS)
  const stars = new Array(count)

  for (let i = 0; i < count; i++) {
    const depth = Math.random()
    stars[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.35 + depth * 1.65,
      speed: 0.05 + depth * 0.38,
      opacity: 0.25 + Math.random() * 0.75,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      color: Math.floor(Math.random() * STAR_COLORS.length),
    }
  }

  return stars
}

export default function StarCanvas() {
  const theme = useStore((state) => state.theme)
  const motionMode = useStore((state) => state.motionMode)

  const canvasRef = useRef(null)
  const frameRef = useRef(0)
  const starsRef = useRef([])
  const bucketsRef = useRef([])

  const active = theme === 'space'
  const reduced = resolveMotion(motionMode) === 'reduced'

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    // `alpha` continua ligado (o fundo do tema aparece atrás), mas
    // `desynchronized` deixa o canvas fora do caminho crítico do compositor.
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    // Estrelas não precisam de resolução de retina: renderizar em 1x custa
    // até 4x menos pixels num display HiDPI, e a diferença é imperceptível.
    let width = 0
    let height = 0

    const buckets = STAR_COLORS.map(() =>
      Array.from({ length: OPACITY_STEPS + 1 }, () => []),
    )
    bucketsRef.current = buckets

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      for (let color = 0; color < buckets.length; color++) {
        for (let level = 0; level <= OPACITY_STEPS; level++) {
          buckets[color][level].length = 0
        }
      }

      const stars = starsRef.current
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        let level = Math.round(star.opacity * OPACITY_STEPS)
        if (level < 0) level = 0
        else if (level > OPACITY_STEPS) level = OPACITY_STEPS
        buckets[star.color][level].push(star)
      }

      // Um fill por cor/faixa de opacidade, ainda bem menos que um por estrela.
      for (let color = 0; color < buckets.length; color++) {
        for (let level = 1; level <= OPACITY_STEPS; level++) {
          const bucket = buckets[color][level]
          if (bucket.length === 0) continue

          ctx.fillStyle = FILL_STYLES[color][level]
          ctx.beginPath()
          for (let i = 0; i < bucket.length; i++) {
            const star = bucket[i]
            ctx.moveTo(star.x + star.size, star.y)
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }
    }

    const step = (delta) => {
      const stars = starsRef.current
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]

        star.opacity += star.twinkleSpeed * delta
        if (star.opacity > 1 || star.opacity < 0.2) {
          star.twinkleSpeed *= -1
          star.opacity = Math.min(1, Math.max(0.2, star.opacity))
        }

        star.y += star.speed * delta
        if (star.y > height) {
          star.y = 0
          star.x = Math.random() * width
        }
      }
    }

    const resize = () => {
      const nextWidth = window.innerWidth
      const nextHeight = window.innerHeight
      if (nextWidth === width && nextHeight === height) return

      width = nextWidth
      height = nextHeight
      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      starsRef.current = createStars(width, height)
      draw()
    }

    let resizeTimer = 0
    const onResize = () => {
      // Redimensionar recria todas as estrelas; sem debounce isso roda
      // dezenas de vezes enquanto o usuário arrasta a janela.
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 150)
    }

    resize()
    window.addEventListener('resize', onResize)

    // Em modo leve o campo de estrelas fica parado: custo zero de CPU.
    if (reduced) {
      return () => {
        clearTimeout(resizeTimer)
        window.removeEventListener('resize', onResize)
      }
    }

    let lastTime = performance.now()
    let lastFrame = 0

    const animate = (now) => {
      frameRef.current = requestAnimationFrame(animate)

      // Trava em ~30fps: metade dos frames de um monitor de 60Hz, sem
      // diferença perceptível num campo de estrelas lento.
      if (now - lastFrame < FRAME_MS) return
      lastFrame = now

      // Delta normalizado em "frames de 60fps" para manter a velocidade
      // original independente da taxa real.
      const delta = Math.min((now - lastTime) / (1000 / BASE_FPS), 4)
      lastTime = now

      step(delta)
      draw()
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameRef.current)
    }
  }, [active, reduced])

  if (!active) return null

  return (
    <div className="space-backdrop fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div className="space-nebula absolute inset-0" data-decorative />
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.92 }}
      />
      <div className="space-planet absolute" data-decorative />
      <div className="space-shooting-star space-shooting-star-one absolute gpu-layer" data-decorative />
      <div className="space-shooting-star space-shooting-star-two absolute gpu-layer" data-decorative />
    </div>
  )
}
