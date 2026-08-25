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
    '--bg': '#02030b',
    '--card': 'rgba(9, 14, 35, 0.78)',
    '--text': '#e5edff',
    '--accent': '#8ba8ff',
    '--muted': '#8492b5',
    '--border': 'rgba(139, 168, 255, 0.2)',
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
    '--bg': '#070214',
    '--card': 'rgba(24, 7, 46, 0.55)',
    '--text': '#f2e8ff',
    '--accent': '#c084fc',
    '--muted': '#9d8ec2',
    '--border': 'rgba(196, 132, 252, 0.2)',
    '--font': "'Inter', system-ui, sans-serif",
    '--star': '1',
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
