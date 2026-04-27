import { useEffect, useRef, useCallback } from 'react'
import useStore from '../store/useStore'

export default function StarCanvas() {
  const canvasRef = useRef(null)
  const { theme } = useStore((state) => state.theme)
  const animationRef = useRef(null)
  const starsRef = useRef([])
  const isRunningRef = useRef(false)

  const initStars = useCallback((canvas) => {
    starsRef.current = []
    const numStars = Math.floor((canvas.width * canvas.height) / 8000)

    for (let i = 0; i < numStars; i++) {
      starsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      })
    }
  }, [])

  useEffect(() => {
    // Only setup if space theme
    if (theme !== 'space') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      isRunningRef.current = false
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars(canvas)
    }

    const animate = () => {
      if (!isRunningRef.current) return
      if (theme !== 'space') return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      starsRef.current.forEach(star => {
        star.opacity += star.twinkleSpeed
        if (star.opacity > 1 || star.opacity < 0.2) {
          star.twinkleSpeed *= -1
        }

        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 216, 255, ${star.opacity})`
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    isRunningRef.current = true
    animate()

    return () => {
      isRunningRef.current = false
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [theme, initStars])

  // Only render if space theme
  if (theme !== 'space') return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  )
}
