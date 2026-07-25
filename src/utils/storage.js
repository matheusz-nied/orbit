const PREFIX = 'sp_'

export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(PREFIX + key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.error('localStorage error:', e)
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch (e) {
      console.error('localStorage error:', e)
    }
  },

  clear: () => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(PREFIX))
        .forEach(key => localStorage.removeItem(key))
    } catch (e) {
      console.error('localStorage error:', e)
    }
  },

  exportAll: () => {
    const data = {}
    Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .forEach(key => {
        try {
          data[key] = JSON.parse(localStorage.getItem(key))
        } catch {
          data[key] = localStorage.getItem(key)
        }
      })
    return data
  },

  importAll: (data) => {
    try {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value))
      })
      return true
    } catch {
      return false
    }
  }
}

export const defaultSites = [
  { id: '1', name: 'GitHub', url: 'https://github.com', category: 'dev', order: 0 },
  { id: '2', name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'dev', order: 1 },
  { id: '3', name: 'YouTube', url: 'https://youtube.com', category: 'entretenimento', order: 2 },
  { id: '4', name: 'Twitter', url: 'https://twitter.com', category: 'social', order: 3 },
  { id: '5', name: 'Reddit', url: 'https://reddit.com', category: 'social', order: 4 },
  { id: '6', name: 'LinkedIn', url: 'https://linkedin.com', category: 'trabalho', order: 5 },
  { id: '7', name: 'Gmail', url: 'https://mail.google.com', category: 'trabalho', order: 6 },
  { id: '8', name: 'Netflix', url: 'https://netflix.com', category: 'entretenimento', order: 7 },
]

export const defaultCategories = ['dev', 'trabalho', 'social', 'entretenimento']

export const defaultNewsTopics = ['technology', 'science']

export const DEFAULT_WORKSPACE = 'default'

export const defaultWorkspaces = [
  { id: DEFAULT_WORKSPACE, name: 'Pessoal' },
]

export const defaultWidgets = {
  weather: true,
  notes: true,
  pomodoro: true,
  frequent: true,
}

// Sites salvos antes dos workspaces não têm o campo `workspace`. Em vez de
// tratar `undefined` espalhado pelo código, normalizamos uma vez na leitura e
// regravamos — assim o resto do app pode assumir que o campo sempre existe.
export const loadSites = () => {
  const sites = storage.get('sites') || defaultSites
  let needsMigration = false

  const migrated = sites.map((site) => {
    if (site.workspace) return site
    needsMigration = true
    return { ...site, workspace: DEFAULT_WORKSPACE }
  })

  if (needsMigration) storage.set('sites', migrated)
  return migrated
}
