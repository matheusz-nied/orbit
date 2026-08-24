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
    '--card': '#0a0a0a',
    '--text': '#ffffff',
    '--accent': '#ffffff',
    '--muted': '#888888',
    '--border': '#222222',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
  },
  'space': {
    name: 'Space',
    '--bg': '#050510',
    '--card': '#0d0d1f',
    '--text': '#c8d8ff',
    '--accent': '#8b5cf6',
    '--muted': '#4a5568',
    '--border': '#1a1a3a',
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
  'macos': {
    name: 'macOS',
    '--bg': '#000000',
    '--card': 'rgba(30, 30, 30, 0.65)',
    '--text': '#f5f5f7',
    '--accent': '#0a84ff',
    '--muted': '#98989d',
    '--border': 'rgba(255, 255, 255, 0.15)',
    '--font': "'-apple-system', BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    '--star': '0',
  },
  'crt': {
    name: 'Retro CRT',
    '--bg': '#0a0a0a',
    '--card': '#111111',
    '--text': '#39ff14',
    '--accent': '#ff00ff',
    '--muted': '#008000',
    '--border': '#333333',
    '--font': "'JetBrains Mono', monospace",
    '--star': '0',
  },
  'nebula': {
    name: 'Nebula',
    '--bg': '#0a0014',
    '--card': 'rgba(20, 0, 40, 0.55)',
    '--text': '#ffb3ff',
    '--accent': '#00ffff',
    '--muted': '#664466',
    '--border': 'rgba(255, 0, 255, 0.12)',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '0',
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
