import { create } from 'zustand'
import { storage, defaultSites, defaultCategories, defaultNewsTopics } from '../utils/storage'
import { applyTheme } from '../themes/themes'

const searchProviders = [
  { name: 'Google', url: 'https://google.com/search?q=', color: '#4285F4', icon: 'G', type: 'search' },
  // { name: 'Bing', url: 'https://bing.com/search?q=', color: '#00B4F0', icon: 'B', type: 'search' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#DE5833', icon: 'D', type: 'search' },
  { name: 'YouTube', url: 'https://youtube.com/results?search_query=', color: '#FF0000', icon: 'Y', type: 'search' },
  // { name: 'Brave', url: 'https://search.brave.com/search?q=', color: '#FB542B', icon: 'Br', type: 'search' },
  { name: 'Ecosia', url: 'https://ecosia.org/search?q=', color: '#4A9C5D', icon: 'E', type: 'search' },
  { name: 'AI Chat', url: '', color: '#00D4AA', icon: 'AI', type: 'ai' },
].filter(Boolean)

const useStore = create((set, get) => ({
  // Sites
  sites: storage.get('sites') || defaultSites,
  
  // Categories
  categories: storage.get('categories') || defaultCategories,
  activeCategory: storage.get('active_category') || 'all',
  
  // Theme
  theme: storage.get('theme') || 'minimal-dark',
  
  // Search
  searchProvider: Math.min(storage.get('search_provider') || 0, searchProviders.length - 1),
  searchQuery: '',
  openInNewTab: storage.get('open_in_new_tab') ?? true,
  
  // News
  newsProvider: storage.get('news_provider') || 'rss',
  newsApiKey: storage.get('news_apikey') || '',
  newsTopics: storage.get('news_topics') || defaultNewsTopics,
  newsItems: [],
  newsLoading: false,
  
  // AI Chat
  deepseekApiKey: storage.get('deepseek_apikey') || '',
  chatOpen: false,
  chatMessages: [],
  chatLoading: false,
  initialChatMessage: null,
  
  // UI State
  settingsOpen: false,
  addSiteOpen: false,
  editingSite: null,
  deleteConfirmId: null,
  toast: null,

  // Actions
  setSites: (sites) => {
    storage.set('sites', sites)
    set({ sites })
  },
  
  addSite: (site) => {
    const sites = get().sites
    const newSite = { 
      ...site, 
      id: Date.now().toString(),
      order: sites.length 
    }
    const updatedSites = [...sites, newSite]
    storage.set('sites', updatedSites)
    set({ sites: updatedSites, toast: { message: 'Site adicionado com sucesso.', type: 'success' } })
  },
  
  updateSite: (id, updates) => {
    const sites = get().sites.map(s => s.id === id ? { ...s, ...updates } : s)
    storage.set('sites', sites)
    set({ sites, toast: { message: 'Site atualizado com sucesso.', type: 'success' } })
  },
  
  removeSite: (id) => {
    const sites = get().sites.filter(s => s.id !== id)
    storage.set('sites', sites)
    set({ sites, toast: { message: 'Site removido.', type: 'success' } })
  },
  
  reorderSites: (newOrder) => {
    const currentSites = [...get().sites].sort((a, b) => a.order - b.order)
    const reorderedVisibleSites = newOrder
      .map(id => currentSites.find(site => site.id === id))
      .filter(Boolean)

    if (reorderedVisibleSites.length === 0) return

    const reorderedVisibleIds = new Set(newOrder)
    let reorderedIndex = 0

    const mergedSites = currentSites.map(site => {
      if (!reorderedVisibleIds.has(site.id)) {
        return site
      }

      const reorderedSite = reorderedVisibleSites[reorderedIndex]
      reorderedIndex += 1
      return reorderedSite
    })

    const sites = mergedSites.map((site, index) => ({
      ...site,
      order: index,
    }))

    storage.set('sites', sites)
    set({ sites, toast: { message: 'Ordem dos sites atualizada.', type: 'success' } })
  },
  
  setCategories: (categories) => {
    storage.set('categories', categories)
    set({ categories })
  },
  
  addCategory: (category) => {
    const categories = get().categories
    if (!categories.includes(category)) {
      const updated = [...categories, category]
      storage.set('categories', updated)
      set({ categories: updated, toast: { message: 'Categoria adicionada.', type: 'success' } })
    }
  },
  
  removeCategory: (category) => {
    const categories = get().categories.filter(c => c !== category)
    storage.set('categories', categories)
    set({ categories })
    
    // Move sites from removed category to 'all'
    const sites = get().sites.map(s => 
      s.category === category ? { ...s, category: 'all' } : s
    )
    storage.set('sites', sites)
    set({ sites, toast: { message: 'Categoria removida.', type: 'success' } })
  },
  
  setActiveCategory: (category) => {
    storage.set('active_category', category)
    set({ activeCategory: category })
  },
  
  setTheme: (theme) => {
    storage.set('theme', theme)
    applyTheme(theme)
    set({ theme })
  },
  
  setSearchProvider: (provider) => {
    storage.set('search_provider', provider)
    set({ searchProvider: provider })
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setOpenInNewTab: (openInNewTab) => {
    storage.set('open_in_new_tab', openInNewTab)
    set({
      openInNewTab,
      toast: {
        message: openInNewTab
          ? 'Links serão abertos em nova aba.'
          : 'Links serão abertos na aba atual.',
        type: 'success',
      },
    })
  },
  
  cycleSearchProvider: () => {
    const current = get().searchProvider
    const next = (current + 1) % searchProviders.length
    storage.set('search_provider', next)
    set({ searchProvider: next })
    return next
  },
  
  setNewsProvider: (provider) => {
    storage.set('news_provider', provider)
    set({ newsProvider: provider })
  },
  
  setNewsApiKey: (key) => {
    storage.set('news_apikey', key)
    set({ newsApiKey: key })
  },
  
  setNewsTopics: (topics) => {
    storage.set('news_topics', topics)
    set({ newsTopics: topics })
  },
  
  setNewsItems: (items) => {
    set({ newsItems: items })
  },
  
  setNewsLoading: (loading) => {
    set({ newsLoading: loading })
  },
  
  // AI Chat Actions
  setDeepseekApiKey: (key) => {
    storage.set('deepseek_apikey', key)
    set({ deepseekApiKey: key })
  },

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } })
  },

  clearToast: () => {
    set({ toast: null })
  },
  
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  
  setInitialChatMessage: (message) => {
    set({ initialChatMessage: message })
  },
  
  clearInitialChatMessage: () => {
    set({ initialChatMessage: null })
  },
  
  addChatMessage: (message) => {
    const messages = [...get().chatMessages, message]
    set({ chatMessages: messages })
    return messages
  },
  
  setChatLoading: (loading) => {
    set({ chatLoading: loading })
  },
  
  clearChat: () => {
    set({ chatMessages: [] })
  },
  
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  
  openAddSite: () => set({ addSiteOpen: true }),
  closeAddSite: () => set({ addSiteOpen: false }),
  
  setEditingSite: (site) => set({ editingSite: site }),

  confirmDeleteSite: (id) => set({ deleteConfirmId: id }),
  cancelDeleteSite: () => set({ deleteConfirmId: null }),
  
  exportData: () => {
    return storage.exportAll()
  },
  
  importData: (data) => {
    const success = storage.importAll(data)
    if (success) {
      // Reload state from storage
      set({
        sites: storage.get('sites') || defaultSites,
        categories: storage.get('categories') || defaultCategories,
        theme: storage.get('theme') || 'minimal-dark',
        searchProvider: storage.get('search_provider') || 0,
        openInNewTab: storage.get('open_in_new_tab') ?? true,
        newsProvider: storage.get('news_provider') || 'rss',
        newsApiKey: storage.get('news_apikey') || '',
        newsTopics: storage.get('news_topics') || defaultNewsTopics,
        activeCategory: storage.get('active_category') || 'all',
        deepseekApiKey: storage.get('deepseek_apikey') || '',
        toast: { message: 'Configuração importada com sucesso.', type: 'success' },
      })
      applyTheme(get().theme)
    } else {
      set({ toast: { message: 'Não foi possível importar a configuração.', type: 'error' } })
    }
    return success
  },
}))

export { searchProviders }
export default useStore
