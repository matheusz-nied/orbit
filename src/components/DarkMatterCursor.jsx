import { useEffect, useRef, useState } from 'react'

export default function DarkMatterCursor() {
  const cursorRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const smoothRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const rafRef = useRef(null)
  const [particles, setParticles] = useState([])
  const gridRef = useRef([])
  const gridContainerRef = useRef(null)

  // Generate static grid points
  useEffect(() => {
    const cols = Math.ceil(window.innerWidth / 50) + 2
    const rows = Math.ceil(window.innerHeight / 50) + 2
    const points = []
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        points.push({
          id: `${r}-${c}`,
          baseX: c * 50,
          baseY: r * 50,
          x: c * 50,
          y: r * 50,
        })
      }
    }
    gridRef.current = points
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorRef.current = { x: e.clientX, y: e.clientY }

      // Spawn particles being pulled into the black hole
      if (Math.random() > 0.55) {
        const count = Math.random() > 0.7 ? 2 : 1
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = 100 + Math.random() * 250
          setParticles(prev => [
            ...prev.slice(-90),
            {
              id: Date.now() + Math.random() + i,
              startX: e.clientX + Math.cos(angle) * dist,
              startY: e.clientY + Math.sin(angle) * dist,
              angle,
              size: 1.5 + Math.random() * 3.5,
              speed: 0.012 + Math.random() * 0.018,
              color: Math.random() > 0.7 ? 'rgba(255,220,180,' : 'rgba(255,255,255,',
            }
          ])
        }
      }
    }

    const animate = () => {
      smoothRef.current.x += (cursorRef.current.x - smoothRef.current.x) * 0.07
      smoothRef.current.y += (cursorRef.current.y - smoothRef.current.y) * 0.07

      const t = Date.now()

      // Animate black hole elements
      const core = document.getElementById('dm-core')
      const ring1 = document.getElementById('dm-ring-1')
      const ring2 = document.getElementById('dm-ring-2')
      const ring3 = document.getElementById('dm-ring-3')
      const photon = document.getElementById('dm-photon')
      const accretion = document.getElementById('dm-accretion')
      const glow = document.getElementById('dm-glow')
      const lens = document.getElementById('dm-lens')

      if (core) {
        core.style.transform = `translate(${smoothRef.current.x}px, ${smoothRef.current.y}px) translate(-50%, -50%)`
      }
      if (ring1) {
        const lagX = smoothRef.current.x + (cursorRef.current.x - smoothRef.current.x) * 0.35
        const lagY = smoothRef.current.y + (cursorRef.current.y - smoothRef.current.y) * 0.35
        ring1.style.transform = `translate(${lagX}px, ${lagY}px) translate(-50%, -50%) rotate(${t * 0.025}deg)`
      }
      if (ring2) {
        const lagX = smoothRef.current.x + (cursorRef.current.x - smoothRef.current.x) * 0.2
        const lagY = smoothRef.current.y + (cursorRef.current.y - smoothRef.current.y) * 0.2
        ring2.style.transform = `translate(${lagX}px, ${lagY}px) translate(-50%, -50%) rotate(${-t * 0.018}deg)`
      }
      if (ring3) {
        const lagX = smoothRef.current.x + (cursorRef.current.x - smoothRef.current.x) * 0.1
        const lagY = smoothRef.current.y + (cursorRef.current.y - smoothRef.current.y) * 0.1
        ring3.style.transform = `translate(${lagX}px, ${lagY}px) translate(-50%, -50%) rotate(${t * 0.012}deg)`
      }
      if (photon) {
        const lagX = smoothRef.current.x + (cursorRef.current.x - smoothRef.current.x) * 0.08
        const lagY = smoothRef.current.y + (cursorRef.current.y - smoothRef.current.y) * 0.08
        photon.style.transform = `translate(${lagX}px, ${lagY}px) translate(-50%, -50%) scale(${1 + Math.sin(t * 0.003) * 0.05})`
      }
      if (accretion) {
        const lagX = smoothRef.current.x + (cursorRef.current.x - smoothRef.current.x) * 0.45
        const lagY = smoothRef.current.y + (cursorRef.current.y - smoothRef.current.y) * 0.45
        accretion.style.transform = `translate(${lagX}px, ${lagY}px) translate(-50%, -50%) rotate(${t * 0.004}deg)`
      }
      if (glow) {
        const lagX = smoothRef.current.x + (cursorRef.current.x - smoothRef.current.x) * 0.5
        const lagY = smoothRef.current.y + (cursorRef.current.y - smoothRef.current.y) * 0.5
        glow.style.transform = `translate(${lagX}px, ${lagY}px) translate(-50%, -50%)`
      }
      if (lens) {
        lens.style.background = `radial-gradient(circle 280px at ${smoothRef.current.x}px ${smoothRef.current.y}px, transparent 0%, rgba(0,0,0,0.25) 100%)`
      }

      // Warp grid points toward black hole
      const container = gridContainerRef.current
      if (container) {
        const children = container.children
        const bhX = smoothRef.current.x
        const bhY = smoothRef.current.y
        const influenceRadius = 300
        const maxPull = 35

        for (let i = 0; i < children.length; i++) {
          const pt = gridRef.current[i]
          if (!pt) continue

          const dx = bhX - pt.baseX
          const dy = bhY - pt.baseY
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < influenceRadius && dist > 5) {
            const force = (1 - dist / influenceRadius) ** 2
            const pull = force * maxPull
            const pullX = (dx / dist) * pull
            const pullY = (dy / dist) * pull
            pt.x = pt.baseX + pullX
            pt.y = pt.baseY + pullY
          } else {
            pt.x += (pt.baseX - pt.x) * 0.15
            pt.y += (pt.baseY - pt.y) * 0.15
          }

          const el = children[i]
          if (el) {
            el.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%)`
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Warped gravitational grid */}
      <div ref={gridContainerRef} className="absolute inset-0">
        {gridRef.current.map((pt) => (
          <div
            key={pt.id}
            className="absolute rounded-full"
            style={{
              width: 2,
              height: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              boxShadow: '0 0 4px rgba(255,255,255,0.04)',
              top: 0,
              left: 0,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* Grid connection lines — faint horizontal */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 50px',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 100%',
        }}
      />

      {/* Outer glow / gravitational influence */}
      <div
        id="dm-glow"
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,200,150,0.04) 0%, rgba(255,255,255,0.02) 30%, transparent 60%)',
          filter: 'blur(20px)',
          top: 0,
          left: 0,
        }}
      />

      {/* Accretion disk */}
      <div
        id="dm-accretion"
        className="absolute w-[260px] h-[260px] rounded-full opacity-60"
        style={{
          background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0%, rgba(255,220,180,0.06) 15%, rgba(255,255,255,0.1) 30%, rgba(255,200,150,0.08) 50%, rgba(255,255,255,0.04) 70%, rgba(255,220,180,0.06) 85%, rgba(255,255,255,0) 100%)',
          filter: 'blur(4px)',
          top: 0,
          left: 0,
        }}
      />

      {/* Outer ring */}
      <div
        id="dm-ring-3"
        className="absolute w-[140px] h-[140px] rounded-full border-2 border-dashed"
        style={{
          borderColor: 'rgba(255,255,255,0.12)',
          boxShadow: '0 0 40px rgba(255,255,255,0.04), inset 0 0 30px rgba(255,255,255,0.02)',
          top: 0,
          left: 0,
        }}
      />

      {/* Middle ring */}
      <div
        id="dm-ring-2"
        className="absolute w-[100px] h-[100px] rounded-full border"
        style={{
          borderColor: 'rgba(255,255,255,0.18)',
          boxShadow: '0 0 30px rgba(255,255,255,0.06), inset 0 0 20px rgba(255,255,255,0.03)',
          top: 0,
          left: 0,
        }}
      />

      {/* Inner ring */}
      <div
        id="dm-ring-1"
        className="absolute w-[60px] h-[60px] rounded-full border-[1.5px]"
        style={{
          borderColor: 'rgba(255,255,255,0.25)',
          boxShadow: '0 0 25px rgba(255,255,255,0.1), inset 0 0 15px rgba(255,255,255,0.05)',
          top: 0,
          left: 0,
        }}
      />

      {/* Photon sphere — bright ring */}
      <div
        id="dm-photon"
        className="absolute w-[44px] h-[44px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
          boxShadow: '0 0 15px rgba(255,255,255,0.2), 0 0 30px rgba(255,255,255,0.1), inset 0 0 10px rgba(255,255,255,0.1)',
          top: 0,
          left: 0,
        }}
      />

      {/* Core black hole */}
      <div
        id="dm-core"
        className="absolute w-8 h-8 rounded-full"
        style={{
          background: 'radial-gradient(circle, #000000 25%, #080808 45%, #151515 65%, transparent 85%)',
          boxShadow: '0 0 30px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.7), 0 0 100px rgba(0,0,0,0.5), inset 0 0 12px rgba(255,255,255,0.08)',
          top: 0,
          left: 0,
        }}
      />

      {/* Photons escaping / orbiting particles */}
      {particles.map((p) => (
        <Particle key={p.id} {...p} target={smoothRef.current} />
      ))}

      {/* Gravitational lens distortion overlay */}
      <div
        id="dm-lens"
        className="absolute inset-0"
        style={{
          mixBlendMode: 'multiply',
          transition: 'background 0.1s ease-out',
        }}
      />
    </div>
  )
}

function Particle({ startX, startY, angle, size, speed, color }) {
  const elRef = useRef(null)
  const progressRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const animate = () => {
      progressRef.current += speed
      if (progressRef.current >= 1) {
        if (elRef.current) elRef.current.style.opacity = 0
        return
      }

      const p = progressRef.current
      const spiralAngle = angle + p * 12
      const dist = (1 - p) * 200
      const x = startX + Math.cos(spiralAngle) * dist
      const y = startY + Math.sin(spiralAngle) * dist
      const opacity = p < 0.15 ? p / 0.15 : (1 - p) / 0.85
      const scale = 1 + p * 1.2

      if (elRef.current) {
        elRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`
        elRef.current.style.opacity = opacity * 0.85
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [startX, startY, angle, speed])

  return (
    <div
      ref={elRef}
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}0.8)`,
        boxShadow: `0 0 ${size * 4}px ${color}0.5), 0 0 ${size * 8}px ${color}0.2)`,
        top: 0,
        left: 0,
      }}
    />
  )
}
