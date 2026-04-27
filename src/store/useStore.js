import { create } from "zustand";
import {
  storage,
  defaultSites,
  defaultCategories,
  defaultNewsTopics,
} from "../utils/storage";
import { applyTheme } from "../themes/themes";

const searchProviders = [
  {
    name: "Google",
    url: "https://google.com/search?q=",
    color: "#4285F4",
    icon: "G",
    type: "search",
  },
  {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
    color: "#DE5833",
    icon: "D",
    type: "search",
  },
  {
    name: "YouTube",
    url: "https://youtube.com/results?search_query=",
    color: "#FF0000",
    icon: "Y",
    type: "search",
  },
  {
    name: "Ecosia",
    url: "https://ecosia.org/search?q=",
    color: "#4A9C5D",
    icon: "E",
    type: "search",
  },
  { name: "AI Chat", url: "", color: "#00D4AA", icon: "AI", type: "ai" },
].filter(Boolean);

const useStore = create((set, get) => ({
  // Sites
  sites: storage.get("sites") || defaultSites,

  // Categories
  categories: storage.get("categories") || defaultCategories,
  activeCategory: "all",

  // Theme
  theme: storage.get("theme") || "minimal-dark",

  // Card Layout
  cardLayout: storage.get("card_layout") || "classic",

  // Search
  searchProvider: Math.min(
    storage.get("search_provider") || 0,
    searchProviders.length - 1,
  ),
  searchQuery: "",

  // News (fallback: provedores legados rss/gnews são resetados para tabnews)
  newsProvider: (() => {
    const saved = storage.get("news_provider")
    if (saved === "rss" || saved === "gnews") {
      storage.set("news_provider", "tabnews")
      return "tabnews"
    }
    return saved || "tabnews"
  })(),
  newsApiKey: storage.get("news_apikey") || "",
  newsTopics: storage.get("news_topics") || defaultNewsTopics,
  newsItems: [],
  newsLoading: false,

  // AI Chat
  deepseekApiKey: storage.get("deepseek_apikey") || "",
  chatOpen: false,
  chatMessages: [],
  chatLoading: false,
  initialChatMessage: null,

  // Preferences
  openInNewTab: storage.get("open_in_new_tab") !== false, // default true

  // UI State
  settingsOpen: false,
  addSiteOpen: false,
  editingSite: null,
  deleteConfirmId: null,
  welcomeSeen: storage.get("welcome_seen") || false,

  // Actions — Sites
  setSites: (sites) => {
    storage.set("sites", sites);
    set({ sites });
  },

  addSite: (site) => {
    const sites = get().sites;
    const newSite = {
      ...site,
      id: Date.now().toString(),
      order: sites.length,
    };
    const updatedSites = [...sites, newSite];
    storage.set("sites", updatedSites);
    set({ sites: updatedSites });
  },

  addSites: (newSites) => {
    const sites = get().sites;
    const timestamp = Date.now();
    const sitesToAdd = newSites.map((site, index) => ({
      ...site,
      id: `${timestamp}-${index}`,
      order: sites.length + index,
    }));
    const updatedSites = [...sites, ...sitesToAdd];
    storage.set("sites", updatedSites);
    set({ sites: updatedSites });
  },

  updateSite: (id, updates) => {
    const sites = get().sites.map((s) =>
      s.id === id ? { ...s, ...updates } : s,
    );
    storage.set("sites", sites);
    set({ sites });
  },

  removeSite: (id) => {
    const sites = get().sites.filter((s) => s.id !== id);
    storage.set("sites", sites);
    set({ sites });
  },

  reorderSites: (newOrder) => {
    const currentSites = [...get().sites].sort((a, b) => a.order - b.order);
    const reorderedVisibleSites = newOrder
      .map((id) => currentSites.find((site) => site.id === id))
      .filter(Boolean);

    if (reorderedVisibleSites.length === 0) return;

    const reorderedVisibleIds = new Set(newOrder);
    let reorderedIndex = 0;

    const mergedSites = currentSites.map((site) => {
      if (!reorderedVisibleIds.has(site.id)) return site;
      const reorderedSite = reorderedVisibleSites[reorderedIndex];
      reorderedIndex += 1;
      return reorderedSite;
    });

    const sites = mergedSites.map((site, index) => ({ ...site, order: index }));
    storage.set("sites", sites);
    set({ sites });
  },

  // Actions — Categories
  setCategories: (categories) => {
    storage.set("categories", categories);
    set({ categories });
  },

  addCategory: (category) => {
    const categories = get().categories;
    if (!categories.includes(category)) {
      const updated = [...categories, category];
      storage.set("categories", updated);
      set({ categories: updated });
    }
  },

  removeCategory: (category) => {
    const categories = get().categories.filter((c) => c !== category);
    storage.set("categories", categories);
    set({ categories });

    const sites = get().sites.map((s) =>
      s.category === category ? { ...s, category: "all" } : s,
    );
    storage.set("sites", sites);
    set({ sites });
  },

  setActiveCategory: (category) => {
    set({ activeCategory: category });
  },

  // Actions — Theme & Layout
  setTheme: (theme) => {
    storage.set("theme", theme);
    applyTheme(theme);
    set({ theme });
  },

  setCardLayout: (layout) => {
    storage.set("card_layout", layout);
    set({ cardLayout: layout });
  },

  // Actions — Search
  setSearchProvider: (provider) => {
    storage.set("search_provider", provider);
    set({ searchProvider: provider });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  cycleSearchProvider: () => {
    const current = get().searchProvider;
    const next = (current + 1) % searchProviders.length;
    storage.set("search_provider", next);
    set({ searchProvider: next });
    return next;
  },

  // Actions — News
  setNewsProvider: (provider) => {
    storage.set("news_provider", provider);
    set({ newsProvider: provider });
  },

  setNewsApiKey: (key) => {
    storage.set("news_apikey", key);
    set({ newsApiKey: key });
  },

  setNewsTopics: (topics) => {
    storage.set("news_topics", topics);
    set({ newsTopics: topics });
  },

  setNewsItems: (items) => {
    set({ newsItems: items });
  },

  setNewsLoading: (loading) => {
    set({ newsLoading: loading });
  },

  // Actions — AI Chat
  setDeepseekApiKey: (key) => {
    storage.set("deepseek_apikey", key);
    set({ deepseekApiKey: key });
  },

  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),

  setInitialChatMessage: (message) => set({ initialChatMessage: message }),
  clearInitialChatMessage: () => set({ initialChatMessage: null }),

  addChatMessage: (message) => {
    const messages = [...get().chatMessages, message];
    set({ chatMessages: messages });
    return messages;
  },

  setChatLoading: (loading) => set({ chatLoading: loading }),
  clearChat: () => set({ chatMessages: [] }),

  // Actions — Preferences
  setOpenInNewTab: (value) => {
    storage.set("open_in_new_tab", value);
    set({ openInNewTab: value });
  },

  // Actions — UI
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  openAddSite: () => set({ addSiteOpen: true }),
  closeAddSite: () => set({ addSiteOpen: false }),

  setEditingSite: (site) => set({ editingSite: site }),

  confirmDeleteSite: (id) => set({ deleteConfirmId: id }),
  cancelDeleteSite: () => set({ deleteConfirmId: null }),

  dismissWelcome: () => {
    storage.set("welcome_seen", true)
    set({ welcomeSeen: true })
  },

  // Toast
  toast: null,
  setToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),

  // Actions — Data
  exportData: () => storage.exportAll(),

  importData: (data) => {
    const success = storage.importAll(data);
    if (success) {
      set({
        sites: storage.get("sites") || defaultSites,
        categories: storage.get("categories") || defaultCategories,
        theme: storage.get("theme") || "minimal-dark",
        cardLayout: storage.get("card_layout") || "classic",
        searchProvider: storage.get("search_provider") || 0,
        newsProvider: (() => {
          const saved = storage.get("news_provider")
          if (saved === "rss" || saved === "gnews") {
            storage.set("news_provider", "tabnews")
            return "tabnews"
          }
          return saved || "tabnews"
        })(),
        newsApiKey: storage.get("news_apikey") || "",
        newsTopics: storage.get("news_topics") || defaultNewsTopics,
        activeCategory: "all",
        deepseekApiKey: storage.get("deepseek_apikey") || "",
        openInNewTab: storage.get("open_in_new_tab") !== false,
      });
      applyTheme(get().theme);
    }
    return success;
  },
}));

export { searchProviders };
export default useStore;
