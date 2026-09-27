// Um único AudioContext para o app inteiro: navegadores limitam quantos podem
// existir, e criá-lo só no primeiro uso respeita a política de autoplay
// (precisa nascer a partir de um gesto do usuário para tocar).
let ctx = null

export const getAudioContext = () => {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

/** Dois toques curtos — usado por lembretes e timers. */
export const playChime = () => {
  try {
    const audio = getAudioContext()
    if (!audio) return

    const start = audio.currentTime + 0.02
    ;[880, 1320].forEach((freq, i) => {
      const t = start + i * 0.18
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      osc.connect(gain).connect(audio.destination)
      osc.start(t)
      osc.stop(t + 0.65)
    })
  } catch {
    // Som é um extra — sem ele o aviso visual continua.
  }
}

/** Notificação do sistema + som. Silencioso se o usuário não autorizou. */
export const notify = (body) => {
  playChime()
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Orbit', { body, icon: '/icon-192.png' })
    }
  } catch {
    // Alguns navegadores móveis só aceitam notificação via service worker.
  }
}

export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}
