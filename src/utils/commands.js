// Parsers da paleta de comandos (Ctrl+K). Funções puras — a paleta decide o
// que mostrar a partir do que cada uma reconhece.

/** Minúsculas e sem acentos, para comparar "Configurações" com "configuracoes". */
export const fold = (value) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const formatDuration = (ms) => {
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m} min`)
  if (s && !h) parts.push(`${s}s`)
  return parts.join(' ') || '0s'
}

export const formatCountdown = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${m}:${s}` : `${m}:${s}`
}

const UNIT_MS = { s: 1000, m: 60000, h: 3600000 }
const UNIT_ALIASES = {
  s: 's', seg: 's', segs: 's', segundo: 's', segundos: 's', sec: 's',
  m: 'm', min: 'm', mins: 'm', minuto: 'm', minutos: 'm',
  h: 'h', hr: 'h', hora: 'h', horas: 'h',
}

// "5m", "25 min", "1h30", "timer 10", "90s chá", "10m pizza no forno"
export const parseTimer = (input) => {
  const text = fold(input.trim())

  const hm = text.match(/^(?:timer\s+)?(\d{1,2})h(\d{1,2})(?:m(?:in)?)?(?:\s+(.*))?$/)
  if (hm) {
    const ms = Number(hm[1]) * UNIT_MS.h + Number(hm[2]) * UNIT_MS.m
    return ms > 0 ? { ms, label: labelFrom(input, hm[3]) } : null
  }

  const match = text.match(/^(?:timer\s+)?(\d+(?:[.,]\d+)?)\s*([a-z]+)?(?:\s+(.*))?$/)
  if (!match) return null

  const hasTimerWord = text.startsWith('timer')
  const unit = match[2] ? UNIT_ALIASES[match[2]] : hasTimerWord ? 'm' : null
  if (!unit) return null

  const ms = Math.round(Number(match[1].replace(',', '.')) * UNIT_MS[unit])
  if (ms <= 0 || ms > 24 * UNIT_MS.h) return null

  return { ms, label: labelFrom(input, match[3]) }
}

// Recupera o rótulo com a grafia original (o parser trabalha na versão sem acento).
const labelFrom = (original, foldedLabel) => {
  if (!foldedLabel) return ''
  return original.trim().slice(-foldedLabel.length).trim()
}

// Calculadora sem eval(): descida recursiva com + - * / % ^ e parênteses.
export const evaluateMath = (input) => {
  const source = input.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/')
  if (!/^[\d.,+\-*/%^()]+$/.test(source)) return null
  if (!/\d/.test(source) || !/[+\-*/%^]/.test(source.replace(/^-/, ''))) return null

  // Vírgula como decimal (pt-BR). Não há separador de milhar aqui.
  const expr = source.replace(/,/g, '.')
  let pos = 0

  const peek = () => expr[pos]
  const eat = (ch) => (expr[pos] === ch ? (pos++, true) : false)

  const number = () => {
    const start = pos
    while (/[\d.]/.test(expr[pos] || '')) pos++
    const raw = expr.slice(start, pos)
    if (!raw || raw.split('.').length > 2) throw new Error('número')
    return Number(raw)
  }

  const factor = () => {
    if (eat('-')) return -factor()
    if (eat('+')) return factor()
    if (eat('(')) {
      const value = sum()
      if (!eat(')')) throw new Error('parêntese')
      return value
    }
    return number()
  }

  const power = () => {
    const base = factor()
    return eat('^') ? base ** power() : base
  }

  const product = () => {
    let value = power()
    for (;;) {
      if (eat('*')) value *= power()
      else if (eat('/')) value /= power()
      else if (peek() === '%') {
        pos++
        // "50%" sozinho = 0.5; "10%3" = resto.
        if (/[\d(]/.test(peek() || '')) value %= power()
        else value /= 100
      } else return value
    }
  }

  const sum = () => {
    let value = product()
    for (;;) {
      if (eat('+')) value += product()
      else if (eat('-')) value -= product()
      else return value
    }
  }

  try {
    const result = sum()
    if (pos !== expr.length || !Number.isFinite(result)) return null
    return result
  } catch {
    return null
  }
}

export const formatNumber = (value, maxDigits = 10) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: maxDigits })

// Câmbio — AwesomeAPI (gratuita, sem chave, aceita CORS).
const CURRENCY_ALIASES = {
  usd: 'USD', dolar: 'USD', dolares: 'USD', '$': 'USD', us$: 'USD',
  eur: 'EUR', euro: 'EUR', euros: 'EUR', '€': 'EUR',
  gbp: 'GBP', libra: 'GBP', libras: 'GBP',
  btc: 'BTC', bitcoin: 'BTC', bitcoins: 'BTC',
  eth: 'ETH', ethereum: 'ETH',
  ars: 'ARS', peso: 'ARS', pesos: 'ARS',
  jpy: 'JPY', iene: 'JPY', ienes: 'JPY',
  cad: 'CAD', aud: 'AUD', chf: 'CHF',
  brl: 'BRL', real: 'BRL', reais: 'BRL', r$: 'BRL',
}

export const CURRENCY_SYMBOL = { BRL: 'R$', USD: 'US$', EUR: '€', GBP: '£', JPY: '¥' }

// "100 usd", "50 euros em reais", "1 btc para usd", "200 reais em dólar"
export const parseCurrency = (input) => {
  const text = fold(input.trim())
  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*([a-z$€]+)(?:\s+(?:em|para|to|in|->|=)\s+([a-z$€]+))?$/)
  if (!match) return null

  const from = CURRENCY_ALIASES[match[2]]
  if (!from) return null

  const to = match[3] ? CURRENCY_ALIASES[match[3]] : from === 'BRL' ? 'USD' : 'BRL'
  if (!to || to === from) return null

  return { amount: Number(match[1].replace(',', '.')), from, to }
}

const rateCache = new Map()
const RATE_TTL = 10 * 60 * 1000

export const fetchRate = async (from, to) => {
  const pair = `${from}-${to}`
  const cached = rateCache.get(pair)
  if (cached && Date.now() - cached.at < RATE_TTL) return cached.rate

  const res = await fetch(`https://economia.awesomeapi.com.br/json/last/${pair}`)
  if (!res.ok) throw new Error('cotação indisponível')
  const data = await res.json()
  const rate = Number(data?.[`${from}${to}`]?.bid)
  if (!Number.isFinite(rate)) throw new Error('cotação indisponível')

  rateCache.set(pair, { rate, at: Date.now() })
  return rate
}

export const formatMoney = (value, currency) => {
  const symbol = CURRENCY_SYMBOL[currency]
  const digits = value < 1 ? 6 : 2
  const number = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: digits })
  return symbol ? `${symbol} ${number}` : `${number} ${currency}`
}
