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

const PALETTES = {
  // Cores de estrelas reais (tipos O/B → K): quase tudo branco, com leves
  // desvios azulados e âmbar. Deriva lenta — o espaço visto da órbita é
  // praticamente parado; o movimento fica por conta da cintilação.
  space: {
    colors: [
      [255, 255, 255],
      [214, 228, 255],
      [255, 244, 228],
      [255, 214, 170],
    ],
    maxStars: 160,
    sizeMin: 0.3,
    sizeRange: 1.05,
    speedScale: 0.22,
    twinkleScale: 0.8,
    minOpacity: 0.15,
    staticField: true,
  },
  nebula: {
    colors: [
      [233, 213, 255],
      [255, 255, 255],
      [165, 228, 255],
      [255, 178, 245],
      [255, 226, 180],
    ],
    maxStars: MAX_STARS,
    sizeMin: 0.35,
    sizeRange: 1.65,
    speedScale: 0.55,
    twinkleScale: 1.7,
    minOpacity: 0.1,
    staticField: false,
  },
}

// Campo de fundo do Space: milhares de estrelas minúsculas + a faixa da Via
// Láctea, desenhados UMA vez por resize num canvas separado. Custo por frame
// zero — só o canvas de cima (poucas estrelas) é animado.
const STATIC_AREA_PER_STAR = 700
const STATIC_MAX_STARS = 2600
const BRIGHT_STARS = 7

const gaussian = () => {
  // Box–Muller: concentra as estrelas no centro da faixa galáctica.
  const u = 1 - Math.random()
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const drawStaticField = (ctx, width, height) => {
  ctx.clearRect(0, 0, width, height)

  // A galáxia cruza a tela na diagonal, de baixo-esquerda a cima-direita.
  const x0 = -width * 0.1
  const y0 = height * 0.95
  const x1 = width * 1.1
  const y1 = -height * 0.05
  const dx = x1 - x0
  const dy = y1 - y0
  const length = Math.hypot(dx, dy)
  const nx = -dy / length
  const ny = dx / length
  const bandWidth = Math.min(width, height) * 0.14

  // Brilho difuso da faixa: poeira quente no núcleo, borda fria.
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 14; i++) {
    const t = i / 13
    const cx = x0 + dx * t + nx * gaussian() * bandWidth * 0.25
    const cy = y0 + dy * t + ny * gaussian() * bandWidth * 0.25
    const core = 1 - Math.abs(t - 0.55) * 1.4
    const radius = bandWidth * (1.1 + Math.random() * 0.9)
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    const warm = Math.random() < 0.5
    const alpha = 0.018 + Math.max(0, core) * 0.03
    glow.addColorStop(0, warm ? `rgba(255, 236, 214, ${alpha})` : `rgba(200, 215, 255, ${alpha})`)
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
  }
  ctx.globalCompositeOperation = 'source-over'

  const count = Math.min(Math.floor((width * height) / STATIC_AREA_PER_STAR), STATIC_MAX_STARS)
  for (let i = 0; i < count; i++) {
    let x
    let y
    const inBand = Math.random() < 0.55
    if (inBand) {
      const t = Math.random()
      const offset = gaussian() * bandWidth * 0.55
      x = x0 + dx * t + nx * offset
      y = y0 + dy * t + ny * offset
    } else {
      x = Math.random() * width
      y = Math.random() * height
    }

    const r = Math.random()
    const tint = r < 0.12 ? '214, 228, 255' : r < 0.2 ? '255, 226, 196' : '255, 255, 255'
    const alpha = inBand ? 0.12 + Math.random() * 0.4 : 0.08 + Math.random() * 0.35
    const size = Math.random() < 0.9 ? 0.7 : 1.2
    ctx.fillStyle = `rgba(${tint}, ${alpha.toFixed(2)})`
    ctx.fillRect(x, y, size, size)
  }

  // Poucas estrelas de destaque com halo e raios finos de difração.
  for (let i = 0; i < BRIGHT_STARS; i++) {
    const x = Math.random() * width
    const y = Math.random() * height * 0.75
    const halo = 6 + Math.random() * 8
    const tint = i % 3 === 0 ? '214, 228, 255' : '255, 250, 240'

    const glow = ctx.createRadialGradient(x, y, 0, x, y, halo)
    glow.addColorStop(0, `rgba(${tint}, 0.55)`)
    glow.addColorStop(0.25, `rgba(${tint}, 0.12)`)
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(x - halo, y - halo, halo * 2, halo * 2)

    if (i < 3) {
      const spike = halo * 2.2
      ctx.fillStyle = `rgba(${tint}, 0.22)`
      ctx.fillRect(x - spike, y - 0.25, spike * 2, 0.5)
      ctx.fillRect(x - 0.25, y - spike, 0.5, spike * 2)
    }

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
}

const fillStylesFor = (colors) =>
  colors.map(([r, g, b]) =>
    Array.from(
      { length: OPACITY_STEPS + 1 },
      (_, i) => `rgba(${r}, ${g}, ${b}, ${(i / OPACITY_STEPS).toFixed(2)})`,
    ),
  )

const createStars = (width, height, pal) => {
  const count = Math.min(Math.floor((width * height) / AREA_PER_STAR), pal.maxStars)
  const stars = new Array(count)

  for (let i = 0; i < count; i++) {
    const depth = Math.random()
    stars[i] = {
      x: Math.random() * width,
      y: Math.random() * height,
      size: pal.sizeMin + depth * pal.sizeRange,
      speed: (0.05 + depth * 0.38) * pal.speedScale,
      opacity: 0.25 + Math.random() * 0.75,
      twinkleSpeed: (Math.random() * 0.02 + 0.005) * pal.twinkleScale,
      color: Math.floor(Math.random() * pal.colors.length),
    }
  }

  return stars
}

export default function StarCanvas() {
  const theme = useStore((state) => state.theme)
  const motionMode = useStore((state) => state.motionMode)

  const canvasRef = useRef(null)
  const staticCanvasRef = useRef(null)
  const frameRef = useRef(0)
  const starsRef = useRef([])
  const bucketsRef = useRef([])

  const isNebula = theme === 'nebula'
  const active = theme === 'space' || isNebula
  const reduced = resolveMotion(motionMode) === 'reduced'

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    // `alpha` continua ligado (o fundo do tema aparece atrás), mas
    // `desynchronized` deixa o canvas fora do caminho crítico do compositor.
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    const pal = PALETTES[isNebula ? 'nebula' : 'space']
    const fillStyles = fillStylesFor(pal.colors)

    // Estrelas não precisam de resolução de retina: renderizar em 1x custa
    // até 4x menos pixels num display HiDPI, e a diferença é imperceptível.
    let width = 0
    let height = 0

    const buckets = pal.colors.map(() =>
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

          ctx.fillStyle = fillStyles[color][level]
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
        if (star.opacity > 1 || star.opacity < pal.minOpacity) {
          star.twinkleSpeed *= -1
          star.opacity = Math.min(1, Math.max(pal.minOpacity, star.opacity))
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
      starsRef.current = createStars(width, height, pal)
      draw()

      const staticCanvas = staticCanvasRef.current
      const staticCtx = pal.staticField && staticCanvas?.getContext('2d')
      if (staticCtx) {
        staticCanvas.width = width
        staticCanvas.height = height
        staticCanvas.style.width = `${width}px`
        staticCanvas.style.height = `${height}px`
        drawStaticField(staticCtx, width, height)
      }
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
  }, [active, reduced, isNebula])

  if (!active) return null

  if (isNebula) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="nebula-sky absolute inset-0" />
        <div className="nebula-galaxy absolute gpu-layer" data-decorative />
        <div className="nebula-cloud nebula-cloud-a absolute gpu-layer" data-decorative />
        <div className="nebula-cloud nebula-cloud-b absolute gpu-layer" data-decorative />
        <div className="nebula-dust absolute inset-0" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ opacity: 0.95 }}
        />
        {/* Névoa à frente das estrelas cria profundidade de gás interestelar. */}
        <div className="nebula-cloud nebula-cloud-c absolute gpu-layer" data-decorative />
        <div className="nebula-comet nebula-comet-one absolute gpu-layer" data-decorative />
        <div className="nebula-comet nebula-comet-two absolute gpu-layer" data-decorative />
      </div>
    )
  }

  return (
    <div className="space-backdrop fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={staticCanvasRef} className="absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Horizonte planetário: disco preto com a atmosfera acesa na borda,
          como o nascer do sol visto da órbita. */}
      <div className="space-horizon absolute" />
      <div className="space-horizon-flare absolute gpu-layer" data-decorative />
      <div className="space-grain absolute inset-0" />
      <div className="space-shooting-star space-shooting-star-one absolute gpu-layer" data-decorative />
      <div className="space-shooting-star space-shooting-star-two absolute gpu-layer" data-decorative />
    </div>
  )
}
