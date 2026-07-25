// O service worker só é registrado no build de produção: em dev ele serviria
// assets em cache por cima do HMR do Vite, o que confunde mais do que ajuda.
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Falhar aqui é aceitável: sem service worker o app continua inteiro,
      // só perde o funcionamento offline.
    })
  })
}
