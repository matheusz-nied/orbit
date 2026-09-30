export const DEFAULT_THEME = 'premium-dark'

export const themes = {
  'minimal-light': {
    name: 'Minimal Light',
    '--bg': '#f8f8f6',
    '--card': '#ffffff',
    '--text': '#1a1a1a',
    '--accent': '#6366f1',
    '--muted': '#6b7280',
    '--border': '#e5e5e5',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
  },
  'premium-dark': {
    name: 'Premium Dark',
    '--bg': '#000000',
    '--card': 'rgba(12, 11, 10, 0.82)',
    '--text': '#f5f1ea',
    '--accent': '#d9c39c',
    '--muted': '#8a8378',
    '--border': 'rgba(255, 240, 215, 0.09)',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
    // Extremos do champagne escovado (claro → sombra): só o CSS do tema usa.
    '--pd-gold-hi': '#f6e7c8',
    '--pd-gold-lo': '#a88b5a',
  },
  'space': {
    name: 'Space',
    '--bg': '#000000',
    '--card': 'rgba(10, 11, 14, 0.72)',
    '--text': '#f4f5f7',
    '--accent': '#e8ecf4',
    '--muted': '#7c828e',
    '--border': 'rgba(255, 255, 255, 0.1)',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '1',
  },
  'cyberpunk': {
    name: 'Cyberpunk',
    '--bg': '#050505',
    '--card': 'rgba(12, 8, 10, 0.82)',
    '--text': '#f2f2f2',
    '--accent': '#ff003c',
    '--muted': '#8a5560',
    '--border': 'rgba(255, 0, 60, 0.45)',
    '--font': "'Rajdhani', 'Inter', system-ui, sans-serif",
    '--star': '0',
  },
  'nous-archive': {
    name: 'Arquivo Noûs',
    '--bg': '#181d1c',
    '--card': 'rgba(25, 30, 29, 0.92)',
    '--text': '#e8dec7',
    '--accent': '#c39a5a',
    '--muted': '#a49a85',
    '--border': 'rgba(232, 222, 199, 0.24)',
    '--font': "'IBM Plex Mono', 'JetBrains Mono', monospace",
    '--star': '0',
    '--archive-paper': '#e8dec7',
    '--archive-ink': '#1c2221',
    '--archive-rust': '#9f7440',
  },
  'detroit': {
    name: 'Detroit',
    '--bg': '#060a0f',
    '--card': 'rgba(9, 16, 25, 0.86)',
    '--text': '#e6f1f8',
    '--accent': '#38b6ff',
    '--muted': '#7d93a6',
    '--border': 'rgba(56, 182, 255, 0.2)',
    '--font': "'Titillium Web', 'Inter', system-ui, sans-serif",
    '--star': '0',
    // Cores do LED de têmpora: estável, processando, instável.
    '--dbh-led': '#38b6ff',
    '--dbh-warn': '#f5b62a',
    '--dbh-alert': '#ff3b3b',
  },
  'berserk': {
    name: 'Berserk · Eclipse',
    '--bg': '#070505',
    '--card': 'rgba(14, 10, 10, 0.9)',
    '--text': '#e9e0d0',
    '--accent': '#d8262f',
    '--muted': '#8b8074',
    '--border': 'rgba(233, 224, 208, 0.16)',
    '--font': "'Cormorant Garamond', 'Times New Roman', serif",
    '--star': '0',
    // Brasa da fogueira e aço da espada: só o CSS do tema usa (com fallback).
    '--berserk-ember': '#e8590c',
    '--berserk-steel': '#6f7378',
    '--berserk-bone': '#e9e0d0',
  },
  'pop': {
    name: 'Brutalismo Pop',
    '--bg': '#fef6e4',
    '--card': '#ffffff',
    '--text': '#111111',
    '--accent': '#ff3d71',
    '--muted': '#5f574a',
    '--border': '#111111',
    '--font': "'Space Grotesk', 'Inter', system-ui, sans-serif",
    '--star': '0',
    // Cores dos adesivos.
    '--pop-yellow': '#ffd23f',
    '--pop-pink': '#ff5c8a',
    '--pop-blue': '#4cc9f0',
    '--pop-green': '#80ed99',
    '--pop-orange': '#ff9f1c',
    '--pop-lilac': '#b388ff',
  },
  'sumie': {
    name: 'Sumi-e',
    '--bg': '#efe7d6',
    '--card': 'rgba(250, 245, 233, 0.94)',
    '--text': '#1b1a17',
    '--accent': '#b3202a',
    '--muted': '#6f6656',
    '--border': 'rgba(27, 26, 23, 0.2)',
    '--font': "'Shippori Mincho', 'Cormorant Garamond', serif",
    '--star': '0',
    // Tinta sumi (mesmo preto do texto, usado em traços) e papel washi claro.
    '--sumie-ink': '#1b1a17',
    '--sumie-paper': '#f8f2e4',
  },
  'lofi': {
    name: 'Lo-fi · Quarto',
    '--bg': '#150f22',
    '--card': 'rgba(34, 22, 52, 0.85)',
    '--text': '#f3e6d4',
    '--accent': '#ffb454',
    '--muted': '#a898b8',
    '--border': 'rgba(255, 180, 84, 0.2)',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
    // Cores dos rótulos dos discos e do bokeh da cidade.
    '--lofi-lilac': '#b79cff',
    '--lofi-rose': '#ff8fab',
    '--lofi-teal': '#6fd6c8',
  },
}

// Layout de cards que "nasceu" com cada tema — Configurações oferece aplicá-lo
// com um clique. O usuário continua livre para combinar como quiser.
export const themeLayouts = {
  'minimal-light': 'classic',
  'premium-dark': 'classic',
  'space': 'space',
  'cyberpunk': 'cyber',
  'nous-archive': 'archive',
  'detroit': 'android',
  'berserk': 'berserk',
  'pop': 'adesivo',
  'sumie': 'tanzaku',
  'lofi': 'vinil',
}

export function resolveTheme(themeName) {
  return themes[themeName] ? themeName : DEFAULT_THEME
}

export const applyTheme = (themeName) => {
  const resolved = resolveTheme(themeName)
  const theme = themes[resolved]

  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    if (key !== 'name') {
      root.style.setProperty(key, value)
    }
  })

  root.setAttribute('data-theme', resolved)
}

export const themeList = Object.keys(themes).map(key => ({
  id: key,
  name: themes[key].name
}))
