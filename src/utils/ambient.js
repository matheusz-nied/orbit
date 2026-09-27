import { getAudioContext } from './audio'

// Sons ambiente sintetizados na hora com Web Audio — nada de arquivos de áudio
// para baixar nem cachear, e funciona offline.
export const ambientSounds = [
  { id: 'rain', label: 'Chuva' },
  { id: 'waves', label: 'Ondas' },
  { id: 'fire', label: 'Lareira' },
  { id: 'brown', label: 'Ruído marrom' },
  { id: 'pink', label: 'Ruído rosa' },
]

const BUFFER_SECONDS = 6
const buffers = {}

// Buffers estéreo com ruído independente por canal — em mono o som fica
// "dentro da cabeça" e cansa mais rápido.
const makeNoise = (audio, kind) => {
  if (buffers[kind]) return buffers[kind]

  const length = audio.sampleRate * BUFFER_SECONDS
  const buffer = audio.createBuffer(2, length, audio.sampleRate)

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    let last = 0

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1

      if (kind === 'white') {
        data[i] = white * 0.5
      } else if (kind === 'pink') {
        // Filtro de Paul Kellet — aproximação clássica de ruído 1/f.
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      } else {
        // Marrom: ruído branco integrado (passeio aleatório com vazamento).
        last = (last + 0.02 * white) / 1.02
        data[i] = last * 3.5
      }
    }
  }

  buffers[kind] = buffer
  return buffer
}

const loopSource = (audio, kind) => {
  const source = audio.createBufferSource()
  source.buffer = makeNoise(audio, kind)
  source.loop = true
  // Offset aleatório evita que dois sons com o mesmo buffer andem em fase.
  source.start(0, Math.random() * BUFFER_SECONDS)
  return source
}

const filter = (audio, type, frequency, Q = 0.7) => {
  const node = audio.createBiquadFilter()
  node.type = type
  node.frequency.value = frequency
  node.Q.value = Q
  return node
}

// Eventos curtos (gotas, estalos) agendados no relógio do áudio com folga de
// ~1s: o setInterval que os agenda é limitado em abas de segundo plano, mas o
// que já foi agendado toca no tempo certo.
const scheduleBursts = (audio, output, { every, jitter, make }) => {
  let next = audio.currentTime + 0.1
  const tick = () => {
    const horizon = audio.currentTime + 1.2
    while (next < horizon) {
      make(next)
      next += every * (1 - jitter + Math.random() * jitter * 2)
    }
  }
  tick()
  const id = setInterval(tick, 250)
  return () => clearInterval(id)
}

const burst = (audio, output, time, { freq, Q, duration, level }) => {
  const source = audio.createBufferSource()
  source.buffer = makeNoise(audio, 'white')
  const band = filter(audio, 'bandpass', freq, Q)
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(level, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  source.connect(band).connect(gain).connect(output)
  source.start(time, Math.random() * (BUFFER_SECONDS - 1))
  source.stop(time + duration + 0.05)
}

// Cada receita liga suas fontes em `output` e devolve uma função de limpeza.
const recipes = {
  brown: (audio, output) => {
    const src = loopSource(audio, 'brown')
    src.connect(output)
    return () => src.stop()
  },

  pink: (audio, output) => {
    const src = loopSource(audio, 'pink')
    const gain = audio.createGain()
    gain.gain.value = 0.7
    src.connect(gain).connect(output)
    return () => src.stop()
  },

  rain: (audio, output) => {
    const src = loopSource(audio, 'pink')
    const hp = filter(audio, 'highpass', 500)
    const lp = filter(audio, 'lowpass', 7000)
    const gain = audio.createGain()
    gain.gain.value = 0.8
    src.connect(hp).connect(lp).connect(gain).connect(output)

    const stopDrops = scheduleBursts(audio, output, {
      every: 0.06,
      jitter: 0.9,
      make: (t) => burst(audio, output, t, {
        freq: 2500 + Math.random() * 3500,
        Q: 4,
        duration: 0.02 + Math.random() * 0.03,
        level: 0.04 + Math.random() * 0.08,
      }),
    })

    return () => { stopDrops(); src.stop() }
  },

  waves: (audio, output) => {
    const src = loopSource(audio, 'brown')
    const lp = filter(audio, 'lowpass', 900)
    const swell = audio.createGain()
    swell.gain.value = 0.55

    // LFO lento no volume = ondas chegando e recuando (~11s por ciclo).
    const lfo = audio.createOscillator()
    lfo.frequency.value = 0.09
    const depth = audio.createGain()
    depth.gain.value = 0.45
    lfo.connect(depth).connect(swell.gain)
    lfo.start()

    src.connect(lp).connect(swell).connect(output)
    return () => { lfo.stop(); src.stop() }
  },

  fire: (audio, output) => {
    const src = loopSource(audio, 'brown')
    const lp = filter(audio, 'lowpass', 500)
    const gain = audio.createGain()
    gain.gain.value = 0.9
    src.connect(lp).connect(gain).connect(output)

    const stopCrackles = scheduleBursts(audio, output, {
      every: 0.35,
      jitter: 0.95,
      make: (t) => burst(audio, output, t, {
        freq: 1500 + Math.random() * 3000,
        Q: 1.5,
        duration: 0.015 + Math.random() * 0.05,
        level: 0.15 + Math.random() * 0.35,
      }),
    })

    return () => { stopCrackles(); src.stop() }
  },
}

let master = null
let stopCurrent = null
let currentId = null

const FADE = 0.6

const toGain = (volume) => Math.max(0.0001, (volume / 100) ** 2)

export const playAmbient = (id, volume) => {
  const audio = getAudioContext()
  if (!audio || !recipes[id]) return false
  if (currentId === id) return true

  stopAmbient()

  master = audio.createGain()
  master.gain.setValueAtTime(0.0001, audio.currentTime)
  master.gain.exponentialRampToValueAtTime(toGain(volume), audio.currentTime + FADE)
  master.connect(audio.destination)

  stopCurrent = recipes[id](audio, master)
  currentId = id
  return true
}

export const stopAmbient = () => {
  if (!master) return
  const audio = getAudioContext()
  const oldMaster = master
  const oldStop = stopCurrent

  // Fade-out antes de parar — cortar ruído no meio dá um estalo.
  oldMaster.gain.cancelScheduledValues(audio.currentTime)
  oldMaster.gain.setValueAtTime(oldMaster.gain.value, audio.currentTime)
  oldMaster.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + FADE)
  setTimeout(() => {
    try { oldStop?.() } catch { /* fonte já parada */ }
    oldMaster.disconnect()
  }, FADE * 1000 + 50)

  master = null
  stopCurrent = null
  currentId = null
}

export const setAmbientVolume = (volume) => {
  if (!master) return
  const audio = getAudioContext()
  master.gain.setTargetAtTime(toGain(volume), audio.currentTime, 0.05)
}
