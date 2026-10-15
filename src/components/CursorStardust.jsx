import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { resolveMotion } from '../utils/motion'

// Poeira estelar do Premium Dark: o cursor vira um cometa.
//  · aura: luz difusa que segue o mouse com inércia; sobre algo clicável ela
//    se fecha numa lente (anel de mira) — o "foco" do telescópio;
//  · rastro: poeira cósmica que se espalha em curvas lentas e se apaga; as
//    estrelas maiores (cintilantes) que sobrevivem juntas se ligam por fios
//    finos e desenham constelações;
//  · clique: supernova — flash, onda de choque e uma explosão de estrelas.
// Um único canvas; o laço de rAF só roda enquanto há algo vivo na tela.

const MAX_PARTICLES = 120
const SPAWN_EVERY = 12 // px de percurso por partícula
const MAX_SPAWN_PER_MOVE = 5
const LINK_DIST = 100
const MAX_LINK_STARS = 26
const HALO_RADIUS = 130
const HALO_RADIUS_FOCUS = 58
const RETICLE_RADIUS = 21
const IDLE_MS = 2600

const TINTS = ['255, 255, 255', '255, 255, 255', '214, 228, 255', '232, 236, 246']

const INTERACTIVE = 'a, button, [role="button"], summary, label, .cursor-pointer'
const TEXT_FIELD = 'input, textarea, select, [contenteditable="true"]'

const rand = (min, max) => min + Math.random() * (max - min)

export default function CursorStardust() {
  const theme = useStore((state) => state.theme)
  const motionMode = useStore((state) => state.motionMode)
  const canvasRef = useRef(null)

  const active = theme === 'premium-dark' && resolveMotion(motionMode) !== 'reduced'

  useEffect(() => {
    if (!active) return

    // Touch não tem "passar o mouse": o efeito só existe com ponteiro fino.
    try {
      if (!window.matchMedia('(pointer: fine)').matches) return
    } catch {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const particles = []
    const rings = []

    // Ponteiro: (mx, my) é o real; (hx, hy) é a aura, que o segue com atraso.
    let mx = 0
    let my = 0
    let hx = 0
    let hy = 0
    let seen = false
    let lastX = 0
    let lastY = 0
    let lastMoveAt = 0
    let travel = 0
    let speedX = 0
    let speedY = 0
    let haloTarget = 0
    let haloAlpha = 0
    let focusTarget = 0
    let focus = 0
    let overText = false

    let raf = 0
    let lastFrame = 0

    const spawn = (x, y, vx, vy, burst) => {
      if (particles.length >= MAX_PARTICLES) particles.shift()
      const star = Math.random() < (burst ? 0.3 : 0.34)
      particles.push({
        x,
        y,
        vx,
        vy,
        age: 0,
        ttl: burst ? rand(0.7, 1.3) : rand(0.9, 1.9),
        size: star ? rand(1.2, 2.1) : rand(0.5, 1.15),
        star,
        // Dá curvas ao rastro: a velocidade gira devagar, como poeira em órbita.
        spin: rand(-1.1, 1.1),
        drag: burst ? 2.3 : 1.5,
        phase: Math.random() * Math.PI * 2,
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
      })
    }

    const supernova = (x, y) => {
      rings.push({ x, y, age: 0, delay: 0, reach: 104, alpha: 0.6, flash: true })
      rings.push({ x, y, age: 0, delay: 0.1, reach: 58, alpha: 0.32, flash: false })
      const count = 18
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + rand(-0.12, 0.12)
        const speed = rand(70, 210)
        spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, true)
      }
    }

    const tick = (now) => {
      raf = 0
      const dt = Math.min((now - lastFrame) / 1000 || 0.016, 0.05)
      lastFrame = now

      // Parado há um tempo, a aura se apaga — e com ela o laço pode parar.
      if (now - lastMoveAt > IDLE_MS) haloTarget = 0

      const follow = 1 - Math.exp(-dt * 13)
      hx += (mx - hx) * follow
      hy += (my - hy) * follow
      haloAlpha += (haloTarget - haloAlpha) * (1 - Math.exp(-dt * 6))
      focus += (focusTarget - focus) * (1 - Math.exp(-dt * 10))

      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      // Aura.
      if (haloAlpha > 0.004) {
        const radius = HALO_RADIUS + (HALO_RADIUS_FOCUS - HALO_RADIUS) * focus
        const peak = haloAlpha * (0.09 + 0.07 * focus)
        const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, radius)
        glow.addColorStop(0, `rgba(255, 255, 255, ${peak.toFixed(3)})`)
        glow.addColorStop(0.45, `rgba(214, 228, 255, ${(peak * 0.32).toFixed(3)})`)
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = glow
        ctx.fillRect(hx - radius, hy - radius, radius * 2, radius * 2)

        // Lente: anel de mira com quatro marcas, só sobre o que é clicável.
        if (focus > 0.02) {
          const a = focus * haloAlpha
          ctx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.55).toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(mx, my, RETICLE_RADIUS, 0, Math.PI * 2)
          ctx.stroke()
          ctx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.9).toFixed(3)})`
          ctx.beginPath()
          for (let i = 0; i < 4; i++) {
            const ang = (i * Math.PI) / 2
            const c = Math.cos(ang)
            const s = Math.sin(ang)
            ctx.moveTo(mx + c * (RETICLE_RADIUS - 4), my + s * (RETICLE_RADIUS - 4))
            ctx.lineTo(mx + c * (RETICLE_RADIUS + 4), my + s * (RETICLE_RADIUS + 4))
          }
          ctx.stroke()
        }
      }

      // Partículas (varre de trás para frente para remover sem pular índice).
      const stars = []
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.age += dt
        if (p.age >= p.ttl) {
          particles.splice(i, 1)
          continue
        }

        const damp = Math.exp(-p.drag * dt)
        const cos = Math.cos(p.spin * dt)
        const sin = Math.sin(p.spin * dt)
        const nvx = (p.vx * cos - p.vy * sin) * damp
        const nvy = (p.vx * sin + p.vy * cos) * damp
        p.vx = nvx
        p.vy = nvy
        p.x += p.vx * dt
        p.y += p.vy * dt

        const t = p.age / p.ttl
        let alpha = Math.pow(1 - t, 1.4)
        if (p.star) alpha *= 0.62 + 0.38 * Math.sin(p.age * 13 + p.phase)
        if (alpha <= 0.01) continue
        p.alpha = alpha

        if (p.star) {
          // Estrela de quatro pontas (difração) + miolo.
          const reach = p.size * 3.4 * (1 - t * 0.45)
          ctx.fillStyle = `rgba(${p.tint}, ${(alpha * 0.85).toFixed(3)})`
          ctx.fillRect(p.x - reach, p.y - 0.5, reach * 2, 1)
          ctx.fillRect(p.x - 0.5, p.y - reach, 1, reach * 2)
          ctx.fillStyle = `rgba(${p.tint}, ${(alpha * 0.16).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2)
          ctx.fill()
          stars.push(p)
        } else {
          ctx.fillStyle = `rgba(${p.tint}, ${(alpha * 0.8).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Constelações: estrelas vivas e próximas se ligam por fios.
      const linkable = stars.length > MAX_LINK_STARS ? stars.slice(0, MAX_LINK_STARS) : stars
      ctx.lineWidth = 0.7
      for (let i = 0; i < linkable.length; i++) {
        for (let j = i + 1; j < linkable.length; j++) {
          const a = linkable[i]
          const b = linkable[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d > LINK_DIST) continue
          const strength = (1 - d / LINK_DIST) * Math.min(a.alpha, b.alpha) * 0.6
          if (strength < 0.01) continue
          ctx.strokeStyle = `rgba(255, 255, 255, ${strength.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // Supernova: flash + ondas de choque.
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]
        r.age += dt
        const local = r.age - r.delay
        if (local < 0) continue
        const t = local / 0.85
        if (t >= 1) {
          rings.splice(i, 1)
          continue
        }

        if (r.flash && local < 0.3) {
          const k = 1 - local / 0.3
          const glow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 80)
          glow.addColorStop(0, `rgba(255, 255, 255, ${(k * 0.4).toFixed(3)})`)
          glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
          ctx.fillStyle = glow
          ctx.fillRect(r.x - 80, r.y - 80, 160, 160)
        }

        const eased = 1 - Math.pow(1 - t, 3)
        ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - t) * r.alpha).toFixed(3)})`
        ctx.lineWidth = 0.4 + (1 - t) * 1.4
        ctx.beginPath()
        ctx.arc(r.x, r.y, eased * r.reach, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'source-over'

      if (particles.length || rings.length || haloAlpha > 0.004 || haloTarget > 0) {
        raf = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, width, height)
      }
    }

    const wake = () => {
      if (raf || document.hidden) return
      lastFrame = performance.now()
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      const now = performance.now()
      const x = e.clientX
      const y = e.clientY

      if (!seen) {
        seen = true
        hx = x
        hy = y
        lastX = x
        lastY = y
      }

      const dx = x - lastX
      const dy = y - lastY
      const dist = Math.hypot(dx, dy)
      const elapsed = Math.max(now - lastMoveAt, 8) / 1000
      speedX = dx / elapsed
      speedY = dy / elapsed

      const target = e.target instanceof Element ? e.target : null
      overText = !!target?.closest(TEXT_FIELD)
      focusTarget = !overText && target?.closest(INTERACTIVE) ? 1 : 0

      // Sobre campos de texto só a aura fica: poeira atrás do que se digita distrai.
      if (!overText) {
        travel += dist
        let steps = 0
        while (travel >= SPAWN_EVERY && steps < MAX_SPAWN_PER_MOVE) {
          travel -= SPAWN_EVERY
          steps++
          const k = dist > 0 ? 1 - (travel / dist) : 1
          spawn(
            lastX + dx * Math.min(Math.max(k, 0), 1) + rand(-3, 3),
            lastY + dy * Math.min(Math.max(k, 0), 1) + rand(-3, 3),
            rand(-16, 16) + speedX * 0.035,
            rand(-16, 16) + speedY * 0.035,
            false,
          )
        }
        if (steps === MAX_SPAWN_PER_MOVE) travel = 0
      }

      mx = x
      my = y
      lastX = x
      lastY = y
      lastMoveAt = now
      haloTarget = 1
      wake()
    }

    const onDown = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest(TEXT_FIELD)) return
      mx = e.clientX
      my = e.clientY
      lastMoveAt = performance.now()
      haloTarget = 1
      supernova(mx, my)
      wake()
    }

    const onLeave = () => {
      haloTarget = 0
      focusTarget = 0
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
        particles.length = 0
        rings.length = 0
        haloAlpha = 0
        haloTarget = 0
        ctx.clearRect(0, 0, width, height)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 w-full h-full pointer-events-none z-[45]"
      data-decorative
    />
  )
}
