import { useEffect } from 'react'

export function useEasterEggs() {
  useEffect(() => {
    // Konami Code: Cima Cima Baixo Baixo Esq Dir Esq Dir B A
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    let konamiIndex = 0

    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === konamiCode[konamiIndex] || e.key.toLowerCase() === konamiCode[konamiIndex]) {
        konamiIndex++
        if (konamiIndex === konamiCode.length) {
          // Trigger!
          konamiIndex = 0
          
          // Efeito visual secreto
          document.body.classList.add('animate-barrel-roll')
          
          setTimeout(() => {
            document.body.classList.remove('animate-barrel-roll')
          }, 2000)
        }
      } else {
        konamiIndex = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
