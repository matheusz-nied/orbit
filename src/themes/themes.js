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
    '--card': 'rgba(8, 8, 8, 0.8)',
    '--text': '#f5f1ea',
    '--accent': '#d9c39c',
    '--muted': '#7d776e',
    '--border': 'rgba(255, 240, 215, 0.07)',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
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
