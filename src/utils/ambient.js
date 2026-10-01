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
    // Fogo real = rugido grave + estalos. O "chiado" do fogo não é ruído
    // contínuo: é uma chuva densa de microestalos. Ruído filtrado com corte
    // variando ou agudo constante soa como vento/assovio, então aqui nenhum
    // filtro tem a frequência modulada e não há camada aguda contínua.
    const stops = []

    // LFOs em taxas que não se encaixam entre si, só no volume e bem sutis:
    // a chama "respira" sem parecer tremolo.
    const wobble = (param, rates, depth) => {
      rates.forEach((rate) => {
        const lfo = audio.createOscillator()
        lfo.frequency.value = rate
        const amount = audio.createGain()
        amount.gain.value = depth
        lfo.connect(amount).connect(param)
        lfo.start()
        stops.push(() => lfo.stop())
      })
    }

    // Rugido: ruído marrom grave e fixo.
    const roar = loopSource(audio, 'brown')
    const roarLp = filter(audio, 'lowpass', 300)
    const roarGain = audio.createGain()
    roarGain.gain.value = 0.7
    wobble(roarGain.gain, [0.13, 0.37], 0.06)
    roar.connect(roarLp).connect(roarGain).connect(output)
    stops.push(() => roar.stop())

    // Corpo: ruído rosa de grave a médio-grave, sem passar de ~900Hz (acima
    // disso começa a parecer ar soprando).
    const body = loopSource(audio, 'pink')
    const bodyHp = filter(audio, 'highpass', 120)
    const bodyLp = filter(audio, 'lowpass', 900)
    const bodyGain = audio.createGain()
    bodyGain.gain.value = 0.1
    wobble(bodyGain.gain, [0.5, 1.1], 0.035)
    body.connect(bodyHp).connect(bodyLp).connect(bodyGain).connect(output)
    stops.push(() => body.stop())

    // Estalos passam por um compressor: um estalo grande não pode estourar o
    // volume, e vários juntos ficam coesos em vez de somar.
    const crackleBus = audio.createDynamicsCompressor()
    crackleBus.threshold.value = -18
    crackleBus.ratio.value = 6
    crackleBus.attack.value = 0.001
    crackleBus.release.value = 0.12
    crackleBus.connect(output)

    const phase = Math.random() * 100
    const stopCrackles = scheduleBursts(audio, crackleBus, {
      every: 0.14,
      jitter: 0.95,
      make: (t) => {
        // A brasa passa por fases: ora estala muito, ora quase nada.
        const activity = 0.55 + 0.45 * Math.sin(t * 0.09 + phase)
        if (Math.random() > Math.max(0.25, activity)) return
        woodEvent(audio, crackleBus, t)
      },
    })

    // Chiado: microestalos muito densos, curtos e baixinhos.
    const stopSizzle = scheduleBursts(audio, crackleBus, {
      every: 0.03,
      jitter: 0.95,
      make: (t) => crackle(audio, crackleBus, t, {
        freq: 3000 + Math.random() * 5000,
        Q: 0.6 + Math.random() * 0.6,
        decay: 0.002 + Math.random() * 0.005,
        level: 0.03 + Math.random() * 0.07,
        pan: Math.random() * 1.8 - 0.9,
      }),
    })

    return () => { stopCrackles(); stopSizzle(); stops.forEach((stop) => stop()) }
  },
}

// Um estalo = clique seco (ruído filtrado com ataque de ~1ms) que decai rápido.
// Q alto faz o "corpo" da madeira ressoar; Q baixo vira só um tique.
const crackle = (audio, output, time, { freq, Q, decay, level, pan, type = 'bandpass' }) => {
  const source = audio.createBufferSource()
  source.buffer = makeNoise(audio, 'white')
  const band = filter(audio, type, freq, Q)
  const gain = audio.createGain()
  // Filtro estreito deixa passar menos energia; compensa para o nível percebido
  // não depender tanto do Q.
  const peak = level * Math.sqrt(Math.max(1, Q))
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.0008)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.0008 + decay)

  let chain = source.connect(band).connect(gain)
  if (audio.createStereoPanner) {
    const panner = audio.createStereoPanner()
    panner.pan.value = pan
    chain = chain.connect(panner)
  }
  chain.connect(output)
  source.start(time, Math.random() * (BUFFER_SECONDS - 1))
  source.stop(time + decay + 0.05)
}

// Baque grave de um tronco que cede: senoide caindo de ~150Hz para ~50Hz.
const thump = (audio, output, time, { level, pan }) => {
  const osc = audio.createOscillator()
  osc.frequency.setValueAtTime(110 + Math.random() * 60, time)
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.1)
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(level, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16)
  osc.connect(gain)
  if (audio.createStereoPanner) {
    const panner = audio.createStereoPanner()
    panner.pan.value = pan
    gain.connect(panner).connect(output)
  } else {
    gain.connect(output)
  }
  osc.start(time)
  osc.stop(time + 0.2)
}

const woodEvent = (audio, output, time) => {
  const pan = Math.random() * 1.6 - 0.8
  const roll = Math.random()

  if (roll < 0.6) {
    // Enxame de tiques: fibras estourando em sequência rápida.
    const count = 1 + Math.floor(Math.random() * 5)
    let at = time
    for (let i = 0; i < count; i++) {
      crackle(audio, output, at, {
        freq: 2500 + Math.random() * 4500,
        Q: 0.8 + Math.random() * 1.5,
        decay: 0.004 + Math.random() * 0.012,
        level: 0.1 + Math.random() * 0.25,
        pan: Math.max(-1, Math.min(1, pan + (Math.random() - 0.5) * 0.3)),
      })
      at += 0.006 + Math.random() * 0.05
    }
  } else if (roll < 0.93) {
    // Estalo médio: clique + ressonância da madeira.
    const body = 600 + Math.random() * 1800
    crackle(audio, output, time, {
      freq: 3500 + Math.random() * 3000, Q: 1, decay: 0.006,
      level: 0.2 + Math.random() * 0.2, pan,
    })
    crackle(audio, output, time, {
      freq: body, Q: 2 + Math.random() * 2.5, decay: 0.015 + Math.random() * 0.035,
      level: 0.12 + Math.random() * 0.2, pan,
    })
  } else {
    // Estalo grande de tronco: rachadura brilhante + corpo grave + baque, e
    // às vezes um tique solto logo depois (a lasca caindo).
    crackle(audio, output, time, {
      freq: 4500, Q: 0.7, decay: 0.012, level: 0.45, pan, type: 'highpass',
    })
    crackle(audio, output, time, {
      freq: 250 + Math.random() * 350, Q: 1.5 + Math.random() * 1.5,
      decay: 0.06 + Math.random() * 0.06, level: 0.35, pan,
    })
    thump(audio, output, time, { level: 0.5, pan })
    if (Math.random() < 0.6) {
      crackle(audio, output, time + 0.05 + Math.random() * 0.15, {
        freq: 3000 + Math.random() * 3000, Q: 1.5, decay: 0.01,
        level: 0.25, pan,
      })
    }
  }
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
