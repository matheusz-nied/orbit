import { create } from "zustand";
import {
  storage,
  loadSites,
  defaultCategories,
  defaultNewsTopics,
  defaultWorkspaces,
  defaultWidgets,
  DEFAULT_WORKSPACE,
  resolveActiveWorkspace,
} from "../utils/storage";
import { FREQUENT_CATEGORY } from "../utils/frequent";
import { applyTheme } from "../themes/themes";
import { applyMotion } from "../utils/motion";
import { loadAgenda, rolloverAgenda } from "../utils/agenda";

const loadWorkspaces = () => storage.get("workspaces") || defaultWorkspaces;

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
  sites: loadSites(),

  // Categories
  categories: storage.get("categories") || defaultCategories,
  activeCategory: "all",

  // Workspaces — conjuntos independentes de sites (ex.: Pessoal / Trabalho)
  workspaces: loadWorkspaces(),
  activeWorkspace: (() => {
    const workspaces = loadWorkspaces();
    const resolved = resolveActiveWorkspace(
      workspaces,
      storage.get("active_workspace") || DEFAULT_WORKSPACE,
    );
    if (resolved !== storage.get("active_workspace")) {
      storage.set("active_workspace", resolved);
    }
    return resolved;
  })(),

  // Uso: { [siteId]: { count, lastUsed } } — alimenta a aba "Frequentes"
  siteStats: storage.get("site_stats") || {},

  // Widgets
  widgets: { ...defaultWidgets, ...(storage.get("widgets") || {}) },
  weatherLocation: storage.get("weather_location") || null,
  notes: storage.get("notes") || "",
  agenda: loadAgenda(),

  // Dock panel aberto (efêmero — atalho `t` abre a agenda)
  dockPanel: null,

  // Theme
  theme: storage.get("theme") || "premium-dark",

  // Card Layout
  cardLayout: storage.get("card_layout") || "wave-particle",

  // Motion / desempenho — 'auto' | 'full' | 'reduced'
  motionMode: storage.get("motion_mode") || "auto",

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
      workspace: get().activeWorkspace,
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
      workspace: get().activeWorkspace,
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

    // Sem isso as estatísticas de sites apagados ficariam acumulando para
    // sempre no localStorage.
    const { [id]: _removed, ...siteStats } = get().siteStats;
    storage.set("site_stats", siteStats);

    set({ sites, siteStats });
  },

  // Chamado a cada abertura de site — base da aba "Frequentes".
  registerSiteVisit: (id) => {
    const current = get().siteStats[id] || { count: 0, lastUsed: 0 };
    const siteStats = {
      ...get().siteStats,
      [id]: { count: current.count + 1, lastUsed: Date.now() },
    };
    storage.set("site_stats", siteStats);
    set({ siteStats });
  },

  resetSiteStats: () => {
    storage.set("site_stats", {});
    set({ siteStats: {} });
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
    // "all" não é categoria real — sites órfãos iam sumir do filtro por categoria.
    const fallback = categories[0] || "geral";
    const nextCategories = categories.length > 0 ? categories : [fallback];
    storage.set("categories", nextCategories);
    set({ categories: nextCategories });

    const sites = get().sites.map((s) =>
      s.category === category ? { ...s, category: fallback } : s,
    );
    storage.set("sites", sites);
    set({ sites });
  },

  setActiveCategory: (category) => {
    set({ activeCategory: category });
  },

  // Actions — Workspaces
  setActiveWorkspace: (id) => {
    storage.set("active_workspace", id);
    // A categoria é resetada porque ela pode não existir no espaço destino,
    // o que deixaria a grade vazia sem explicação aparente.
    set({ activeWorkspace: id, activeCategory: "all" });
  },

  addWorkspace: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const id = `ws-${Date.now()}`;
    const workspaces = [...get().workspaces, { id, name: trimmed }];
    storage.set("workspaces", workspaces);
    set({ workspaces });
    return id;
  },

  renameWorkspace: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const workspaces = get().workspaces.map((w) =>
      w.id === id ? { ...w, name: trimmed } : w,
    );
    storage.set("workspaces", workspaces);
    set({ workspaces });
  },

  removeWorkspace: (id) => {
    const workspaces = get().workspaces.filter((w) => w.id !== id);
    // Sempre resta pelo menos um espaço: sem nenhum, os sites ficariam órfãos
    // e invisíveis.
    if (workspaces.length === 0) return;

    const fallback = workspaces[0].id;

    // Os sites são movidos, nunca apagados — remover um espaço por engano não
    // pode custar os atalhos do usuário.
    const sites = get().sites.map((s) =>
      s.workspace === id ? { ...s, workspace: fallback } : s,
    );

    storage.set("workspaces", workspaces);
    storage.set("sites", sites);

    const activeWorkspace =
      get().activeWorkspace === id ? fallback : get().activeWorkspace;
    storage.set("active_workspace", activeWorkspace);

    set({ workspaces, sites, activeWorkspace });
  },

  // Actions — Widgets
  setWidgetVisible: (key, value) => {
    const widgets = { ...get().widgets, [key]: value };
    storage.set("widgets", widgets);

    const extra = {};
    if (key === "agenda" && !value && get().dockPanel === "agenda") {
      extra.dockPanel = null;
    }

    // Desligar Frequentes com a aba ativa deixaria a grade numa visão sem atalho.
    if (key === "frequent" && !value && get().activeCategory === FREQUENT_CATEGORY) {
      set({ widgets, activeCategory: "all", ...extra });
      return;
    }

    set({ widgets, ...extra });
  },

  setWeatherLocation: (location) => {
    storage.set("weather_location", location);
    set({ weatherLocation: location });
  },

  setNotes: (notes) => {
    storage.set("notes", notes);
    set({ notes });
  },

  setDockPanel: (panel) => set({ dockPanel: panel }),

  toggleDockPanel: (panel) => {
    set({ dockPanel: get().dockPanel === panel ? null : panel });
  },

  ensureAgendaDay: () => {
    const current = get().agenda;
    const rolled = rolloverAgenda(current);
    if (rolled.date === current.date) return;
    storage.set("agenda", rolled);
    set({ agenda: rolled });
  },

  addAgendaItem: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    get().ensureAgendaDay();
    const agenda = get().agenda;
    const item = { id: Date.now().toString(), text: trimmed, done: false };
    const next = {
      ...agenda,
      items: [...agenda.items, item],
    };
    storage.set("agenda", next);
    set({ agenda: next });
  },

  toggleAgendaItem: (id) => {
    get().ensureAgendaDay();
    const agenda = get().agenda;
    const next = {
      ...agenda,
      items: agenda.items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    };
    storage.set("agenda", next);
    set({ agenda: next });
  },

  removeAgendaItem: (id) => {
    get().ensureAgendaDay();
    const agenda = get().agenda;
    const next = {
      ...agenda,
      items: agenda.items.filter((item) => item.id !== id),
    };
    storage.set("agenda", next);
    set({ agenda: next });
  },

  editAgendaItem: (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    get().ensureAgendaDay();
    const agenda = get().agenda;
    const next = {
      ...agenda,
      items: agenda.items.map((item) =>
        item.id === id ? { ...item, text: trimmed } : item,
      ),
    };
    storage.set("agenda", next);
    set({ agenda: next });
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

  setMotionMode: (mode) => {
    storage.set("motion_mode", mode);
    applyMotion(mode);
    set({ motionMode: mode });
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
  exportData: (options) => storage.exportAll(options),

  importData: (data) => {
    const success = storage.importAll(data);
    if (success) {
      const workspaces = storage.get("workspaces") || defaultWorkspaces;
      const activeWorkspace = resolveActiveWorkspace(
        workspaces,
        storage.get("active_workspace") || DEFAULT_WORKSPACE,
      );
      storage.set("active_workspace", activeWorkspace);
      storage.set("workspaces", workspaces);

      set({
        sites: loadSites(),
        categories: storage.get("categories") || defaultCategories,
        workspaces,
        activeWorkspace,
        siteStats: storage.get("site_stats") || {},
        widgets: { ...defaultWidgets, ...(storage.get("widgets") || {}) },
        weatherLocation: storage.get("weather_location") || null,
        notes: storage.get("notes") || "",
        agenda: loadAgenda(),
        theme: storage.get("theme") || "premium-dark",
        cardLayout: storage.get("card_layout") || "wave-particle",
        motionMode: storage.get("motion_mode") || "auto",
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
        welcomeSeen: storage.get("welcome_seen") || false,
      });
      applyTheme(get().theme);
      applyMotion(get().motionMode);
    }
    return success;
  },
}));

export { searchProviders };
export default useStore;
