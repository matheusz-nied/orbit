const PREFIX = 'sp_'

// Chaves sensíveis — omitidas do export por padrão.
const SECRET_KEYS = new Set([
  'sp_deepseek_apikey',
  'sp_news_apikey',
])

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

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

  exportAll: ({ includeSecrets = false } = {}) => {
    const data = {}
    Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .forEach(key => {
        if (!includeSecrets && SECRET_KEYS.has(key)) return
        try {
          data[key] = JSON.parse(localStorage.getItem(key))
        } catch {
          data[key] = localStorage.getItem(key)
        }
      })
    return data
  },

  // Aceita só chaves sp_* e objeto plano — evita poluir localStorage com
  // chaves arbitrárias ou sobrescrever dados de outros apps.
  importAll: (data) => {
    try {
      if (!isPlainObject(data)) return false

      const entries = Object.entries(data).filter(([key]) =>
        typeof key === 'string' && key.startsWith(PREFIX)
      )

      if (entries.length === 0) return false

      entries.forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value))
      })
      return true
    } catch {
      return false
    }
  }
}

export const defaultSites = [
  { id: '1', name: 'GitHub', url: 'https://github.com', category: 'dev', order: 0, workspace: 'default' },
  { id: '2', name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'dev', order: 1, workspace: 'default' },
  { id: '3', name: 'YouTube', url: 'https://youtube.com', category: 'entretenimento', order: 2, workspace: 'default' },
  { id: '4', name: 'Twitter', url: 'https://twitter.com', category: 'social', order: 3, workspace: 'default' },
  { id: '5', name: 'Reddit', url: 'https://reddit.com', category: 'social', order: 4, workspace: 'default' },
  { id: '6', name: 'LinkedIn', url: 'https://linkedin.com', category: 'trabalho', order: 5, workspace: 'default' },
  { id: '7', name: 'Gmail', url: 'https://mail.google.com', category: 'trabalho', order: 6, workspace: 'default' },
  { id: '8', name: 'Netflix', url: 'https://netflix.com', category: 'entretenimento', order: 7, workspace: 'default' },
]

export const defaultCategories = ['dev', 'trabalho', 'social', 'entretenimento']

export const defaultNewsTopics = ['relevant']

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

// Resolve workspace ativo órfão (ex.: import parcial ou espaço removido fora do app).
export const resolveActiveWorkspace = (workspaces, savedId) => {
  const list = Array.isArray(workspaces) && workspaces.length > 0
    ? workspaces
    : defaultWorkspaces
  if (savedId && list.some((w) => w.id === savedId)) return savedId
  return list[0].id
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
