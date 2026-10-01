import { create } from "zustand";
import {
  storage,
  loadSites,
  defaultNewsTopics,
  defaultWorkspaces,
  defaultWidgets,
  DEFAULT_WORKSPACE,
  resolveActiveWorkspace,
} from "../utils/storage";
import { FREQUENT_CATEGORY } from "../utils/frequent";
import { DEFAULT_CATEGORY, normalizeCategories, mergeCategories } from "../utils/categories";
import { applyTheme, resolveTheme } from "../themes/themes";
import { resolveCardLayout } from "../utils/cardLayout";
import { applyMotion } from "../utils/motion";
import { loadAgenda, rolloverAgenda, parseAgendaInput, minutesNow, timeToMinutes } from "../utils/agenda";
import { loadActivity, bumpToday, weekKey } from "../utils/activity";
import * as ambientEngine from "../utils/ambient";

const loadTimers = () => {
  const saved = storage.get("timers");
  return Array.isArray(saved) ? saved.filter((t) => t && t.endsAt) : [];
};

const loadAmbient = () => ({ sound: "fire", volume: 50, ...(storage.get("ambient") || {}) });

// Primeira visita — usado para não cobrar backup de quem acabou de chegar.
const loadFirstSeen = () => {
  const saved = storage.get("first_seen");
  if (saved) return saved;
  const now = Date.now();
  storage.set("first_seen", now);
  return now;
};

const loadWorkspaces = () => storage.get("workspaces") || defaultWorkspaces;

// Categorias e subcategorias são por espaço. Dados no formato antigo (global)
// são repartidos na leitura e regravados — ver `normalizeCategories`.
const loadCategoryState = (workspaces, sites) => {
  const { categories, subcategories, changed } = normalizeCategories({
    categories: storage.get("categories"),
    subcategories: storage.get("subcategories"),
    workspaces,
    sites,
  });
  if (changed) {
    storage.set("categories", categories);
    storage.set("subcategories", subcategories);
  }
  return { categories, subcategories };
};

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

  // Categories — cada espaço tem as suas:
  //   categories:    { [espaço]: ["dev", ...] }
  //   subcategories: { [espaço]: { [categoria]: ["Projeto A", ...] } }
  // Subcategoria é opcional no site.
  ...loadCategoryState(loadWorkspaces(), loadSites()),
  activeCategory: "all",
  activeSubcategory: null,

  // Workspaces — conjuntos independentes de sites, categorias e subcategorias
  // (ex.: Pessoal / Trabalho)
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

  // Histórico diário (foco, tarefas, visitas) — alimenta o resumo semanal.
  activity: loadActivity(),
  summarySeenWeek: storage.get("summary_seen_week") || null,

  // Timers avulsos: guardam o timestamp de término, então sobrevivem a reload.
  timers: loadTimers(),

  // Som ambiente — a escolha persiste, mas tocar é sempre efêmero (autoplay
  // sem gesto do usuário é bloqueado pelos navegadores).
  ambient: loadAmbient(),
  ambientPlaying: false,

  // Backup
  firstSeenAt: loadFirstSeen(),
  lastBackupAt: storage.get("last_backup") || null,
  // Nome do arquivo de backup automático — vem do handle no IndexedDB, que é
  // local a este navegador (por isso não persiste em sp_*, que vai no export).
  backupFileName: null,
  backupNeedsPermission: false,
  backupSnoozeUntil: storage.get("backup_snooze") || 0,

  // Paleta de comandos (Ctrl+K)
  paletteOpen: false,

  // Dock panel aberto (efêmero — atalho `t` abre a agenda)
  dockPanel: null,

  // Theme — valores removidos (ex.: hacking) caem no default
  theme: (() => {
    const resolved = resolveTheme(storage.get("theme"));
    if (resolved !== storage.get("theme")) {
      storage.set("theme", resolved);
    }
    return resolved;
  })(),

  // Card Layout — valores removidos (ex.: bento) caem no Clássico
  cardLayout: (() => {
    const resolved = resolveCardLayout(storage.get("card_layout"));
    if (resolved !== storage.get("card_layout")) {
      storage.set("card_layout", resolved);
    }
    return resolved;
  })(),

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
  settingsSection: null,
  addSiteOpen: false,
  editingSite: null,
  deleteConfirmId: null,
  welcomeSeen: storage.get("welcome_seen") || false,
  // Configurações abre em "Comece por aqui" só na primeira vez.
  settingsSeen: storage.get("settings_seen") || false,
  searchHintDismissed: storage.get("search_hint_dismissed") || false,

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

    get().recordActivity((day) => ({
      ...day,
      visits: day.visits + 1,
      sites: { ...day.sites, [id]: (day.sites[id] || 0) + 1 },
    }));
  },

  recordActivity: (update) => {
    const activity = bumpToday(get().activity, update);
    storage.set("activity", activity);
    set({ activity });
  },

  logFocus: (minutes) => {
    get().recordActivity((day) => ({ ...day, focus: day.focus + minutes }));
  },

  markSummarySeen: () => {
    const week = weekKey();
    if (get().summarySeenWeek === week) return;
    storage.set("summary_seen_week", week);
    set({ summarySeenWeek: week });
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
  // Todas operam num espaço só (o ativo, salvo indicação): categorias de mesmo
  // nome em espaços diferentes são independentes.
  addCategory: (category, workspace = get().activeWorkspace) => {
    const current = get().categories[workspace] || [];
    if (current.includes(category)) return;

    const categories = { ...get().categories, [workspace]: [...current, category] };
    storage.set("categories", categories);
    set({ categories });
  },

  removeCategory: (category) => {
    const ws = get().activeWorkspace;
    const remaining = (get().categories[ws] || []).filter((c) => c !== category);
    // "all" não é categoria real — sites órfãos iam sumir do filtro por categoria.
    const fallback = remaining[0] || DEFAULT_CATEGORY;
    const categories = {
      ...get().categories,
      [ws]: remaining.length > 0 ? remaining : [fallback],
    };
    storage.set("categories", categories);
    set({ categories });

    const { [category]: _removed, ...rest } = get().subcategories[ws] || {};
    const subcategories = { ...get().subcategories, [ws]: rest };
    storage.set("subcategories", subcategories);
    set({ subcategories });

    // Subcategorias pertencem à categoria antiga — não fazem sentido na nova.
    const sites = get().sites.map((s) => {
      if (s.workspace !== ws || s.category !== category) return s;
      const { subcategory: _sub, ...site } = s;
      return { ...site, category: fallback };
    });
    storage.set("sites", sites);
    set({ sites });

    if (get().activeCategory === category) {
      set({ activeCategory: "all", activeSubcategory: null });
    }
  },

  // Renomeia mantendo a posição; sites e subcategorias acompanham o novo nome.
  // Retorna o nome final, ou null se vazio/duplicado.
  renameCategory: (category, name) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return null;
    if (trimmed === category) return category;

    const ws = get().activeWorkspace;
    const current = get().categories[ws] || [];
    if (current.includes(trimmed)) return null;

    const categories = {
      ...get().categories,
      [ws]: current.map((c) => (c === category ? trimmed : c)),
    };
    storage.set("categories", categories);
    set({ categories });

    const { [category]: moved, ...rest } = get().subcategories[ws] || {};
    const subcategories = {
      ...get().subcategories,
      [ws]: moved ? { ...rest, [trimmed]: moved } : rest,
    };
    storage.set("subcategories", subcategories);
    set({ subcategories });

    const sites = get().sites.map((s) =>
      s.workspace === ws && s.category === category ? { ...s, category: trimmed } : s,
    );
    storage.set("sites", sites);
    set({ sites });

    if (get().activeCategory === category) {
      set({ activeCategory: trimmed });
    }
    return trimmed;
  },

  setActiveCategory: (category) => {
    set({ activeCategory: category, activeSubcategory: null });
  },

  // Actions — Subcategories
  addSubcategory: (category, name, workspace = get().activeWorkspace) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const own = get().subcategories[workspace] || {};
    const current = own[category] || [];
    const existing = current.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const subcategories = {
      ...get().subcategories,
      [workspace]: { ...own, [category]: [...current, trimmed] },
    };
    storage.set("subcategories", subcategories);
    set({ subcategories });
    return trimmed;
  },

  // Retorna o nome final, ou null se vazio/duplicado na mesma categoria.
  renameSubcategory: (category, name, nextName) => {
    const trimmed = nextName.trim();
    if (!trimmed) return null;
    if (trimmed === name) return name;

    const ws = get().activeWorkspace;
    const own = get().subcategories[ws] || {};
    const current = own[category] || [];
    const clash = current.some((c) => c !== name && c.toLowerCase() === trimmed.toLowerCase());
    if (clash) return null;

    const subcategories = {
      ...get().subcategories,
      [ws]: { ...own, [category]: current.map((c) => (c === name ? trimmed : c)) },
    };
    storage.set("subcategories", subcategories);
    set({ subcategories });

    const sites = get().sites.map((s) =>
      s.workspace === ws && s.category === category && s.subcategory === name
        ? { ...s, subcategory: trimmed }
        : s
    );
    storage.set("sites", sites);
    set({ sites });

    if (get().activeCategory === category && get().activeSubcategory === name) {
      set({ activeSubcategory: trimmed });
    }
    return trimmed;
  },

  removeSubcategory: (category, name) => {
    const ws = get().activeWorkspace;
    const own = get().subcategories[ws] || {};
    const subcategories = {
      ...get().subcategories,
      [ws]: { ...own, [category]: (own[category] || []).filter((c) => c !== name) },
    };
    storage.set("subcategories", subcategories);
    set({ subcategories });

    // Os sites continuam na categoria, só perdem a subcategoria.
    const sites = get().sites.map((s) => {
      if (s.workspace !== ws || s.category !== category || s.subcategory !== name) return s;
      const { subcategory: _sub, ...rest } = s;
      return rest;
    });
    storage.set("sites", sites);
    set({ sites });

    if (get().activeCategory === category && get().activeSubcategory === name) {
      set({ activeSubcategory: null });
    }
  },

  setActiveSubcategory: (name) => {
    set({ activeSubcategory: name });
  },

  // Actions — Workspaces
  setActiveWorkspace: (id) => {
    storage.set("active_workspace", id);
    // A categoria é resetada porque ela pode não existir no espaço destino,
    // o que deixaria a grade vazia sem explicação aparente.
    set({ activeWorkspace: id, activeCategory: "all", activeSubcategory: null });
  },

  addWorkspace: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const id = `ws-${Date.now()}`;
    const workspaces = [...get().workspaces, { id, name: trimmed }];
    const categories = { ...get().categories, [id]: [DEFAULT_CATEGORY] };
    const subcategories = { ...get().subcategories, [id]: {} };
    storage.set("workspaces", workspaces);
    storage.set("categories", categories);
    storage.set("subcategories", subcategories);
    set({ workspaces, categories, subcategories });
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

  // Com `moveTo`, sites e categorias vão para aquele espaço; sem ele, o espaço
  // é apagado com tudo dentro. A interface confirma antes de chamar.
  removeWorkspace: (id, moveTo) => {
    const workspaces = get().workspaces.filter((w) => w.id !== id);
    // Sempre resta pelo menos um espaço: sem nenhum, não haveria onde criar sites.
    if (workspaces.length === 0) return;
    // Destino inválido não pode virar "apagar tudo" por engano.
    if (moveTo && !workspaces.some((w) => w.id === moveTo)) return;

    const { [id]: ownCategories = [], ...categories } = get().categories;
    const { [id]: ownSubcategories = {}, ...subcategories } = get().subcategories;
    let sites = get().sites;
    let siteStats = get().siteStats;

    if (moveTo) {
      sites = sites.map((s) => (s.workspace === id ? { ...s, workspace: moveTo } : s));
      // As categorias vão junto, senão os sites chegariam sem aba no destino.
      const merged = mergeCategories(
        { categories: categories[moveTo] || [], subcategories: subcategories[moveTo] || {} },
        { categories: ownCategories, subcategories: ownSubcategories },
      );
      categories[moveTo] = merged.categories;
      subcategories[moveTo] = merged.subcategories;
    } else {
      const removedIds = new Set(sites.filter((s) => s.workspace === id).map((s) => s.id));
      sites = sites.filter((s) => s.workspace !== id);
      siteStats = Object.fromEntries(
        Object.entries(siteStats).filter(([siteId]) => !removedIds.has(siteId)),
      );
      storage.set("site_stats", siteStats);
    }

    storage.set("workspaces", workspaces);
    storage.set("sites", sites);
    storage.set("categories", categories);
    storage.set("subcategories", subcategories);

    const wasActive = get().activeWorkspace === id;
    const activeWorkspace = wasActive ? moveTo || workspaces[0].id : get().activeWorkspace;
    storage.set("active_workspace", activeWorkspace);

    set({
      workspaces,
      sites,
      siteStats,
      categories,
      subcategories,
      activeWorkspace,
      // A categoria ativa era do espaço removido.
      ...(wasActive ? { activeCategory: "all", activeSubcategory: null } : {}),
    });
  },

  // Actions — Widgets
  setWidgetVisible: (key, value) => {
    const widgets = { ...get().widgets, [key]: value };
    storage.set("widgets", widgets);

    const extra = {};
    // Painel aberto de um widget desligado ficaria órfão no dock.
    if (!value && get().dockPanel === key) {
      extra.dockPanel = null;
    }
    if (key === "ambient" && !value && get().ambientPlaying) {
      ambientEngine.stopAmbient();
      extra.ambientPlaying = false;
    }

    // Desligar Frequentes com a aba ativa deixaria a grade numa visão sem atalho.
    if (key === "frequent" && !value && get().activeCategory === FREQUENT_CATEGORY) {
      set({ widgets, activeCategory: "all", activeSubcategory: null, ...extra });
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
    const { text: parsedText, time } = parseAgendaInput(trimmed);
    const item = { id: Date.now().toString(), text: parsedText || trimmed, done: false };
    if (time) {
      item.time = time;
      // Horário que já passou hoje não dispara — seria um alarme atrasado.
      item.notified = timeToMinutes(time) <= minutesNow();
    }
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
    const target = agenda.items.find((item) => item.id === id);
    if (target) {
      const delta = target.done ? -1 : 1;
      get().recordActivity((day) => ({ ...day, tasks: Math.max(0, day.tasks + delta) }));
    }
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

  markAgendaNotified: (ids) => {
    const agenda = get().agenda;
    const next = {
      ...agenda,
      items: agenda.items.map((item) =>
        ids.includes(item.id) ? { ...item, notified: true } : item,
      ),
    };
    storage.set("agenda", next);
    set({ agenda: next });
  },

  // Actions — Timers
  addTimer: (durationMs, label = "") => {
    const timer = {
      id: Date.now().toString(),
      label: label.trim(),
      duration: durationMs,
      endsAt: Date.now() + durationMs,
    };
    const timers = [...get().timers, timer];
    storage.set("timers", timers);
    set({ timers });
    return timer;
  },

  removeTimer: (id) => {
    const timers = get().timers.filter((t) => t.id !== id);
    storage.set("timers", timers);
    set({ timers });
  },

  // Actions — Som ambiente
  playAmbient: (sound) => {
    const ambient = { ...get().ambient, sound: sound || get().ambient.sound };
    if (!ambientEngine.playAmbient(ambient.sound, ambient.volume)) return;
    storage.set("ambient", ambient);
    set({ ambient, ambientPlaying: true });
  },

  stopAmbient: () => {
    ambientEngine.stopAmbient();
    set({ ambientPlaying: false });
  },

  setAmbientVolume: (volume) => {
    const ambient = { ...get().ambient, volume };
    ambientEngine.setAmbientVolume(volume);
    storage.set("ambient", ambient);
    set({ ambient });
  },

  // Actions — Backup
  markBackup: () => {
    const now = Date.now();
    storage.set("last_backup", now);
    set({ lastBackupAt: now, backupNeedsPermission: false });
  },

  setBackupFile: (name) => set({ backupFileName: name, backupNeedsPermission: false }),

  setBackupNeedsPermission: (value) => set({ backupNeedsPermission: value }),

  snoozeBackup: (days = 7) => {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    storage.set("backup_snooze", until);
    set({ backupSnoozeUntil: until });
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
    const resolved = resolveTheme(theme);
    storage.set("theme", resolved);
    applyTheme(resolved);
    set({ theme: resolved });
  },

  setCardLayout: (layout) => {
    const resolved = resolveCardLayout(layout);
    storage.set("card_layout", resolved);
    set({ cardLayout: resolved });
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
  // Também é usado direto como onClick — o evento não pode virar seção.
  openSettings: (section) =>
    set({ settingsOpen: true, settingsSection: typeof section === "string" ? section : null }),
  closeSettings: () => set({ settingsOpen: false, settingsSection: null }),

  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),

  openAddSite: () => set({ addSiteOpen: true }),
  closeAddSite: () => set({ addSiteOpen: false }),

  setEditingSite: (site) => set({ editingSite: site }),

  confirmDeleteSite: (id) => set({ deleteConfirmId: id }),
  cancelDeleteSite: () => set({ deleteConfirmId: null }),

  markSettingsSeen: () => {
    if (get().settingsSeen) return
    storage.set("settings_seen", true)
    set({ settingsSeen: true })
  },

  dismissWelcome: () => {
    storage.set("welcome_seen", true)
    set({ welcomeSeen: true })
  },

  dismissSearchHint: () => {
    storage.set("search_hint_dismissed", true)
    set({ searchHintDismissed: true })
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

      const sites = loadSites();

      set({
        sites,
        ...loadCategoryState(workspaces, sites),
        workspaces,
        activeWorkspace,
        siteStats: storage.get("site_stats") || {},
        widgets: { ...defaultWidgets, ...(storage.get("widgets") || {}) },
        weatherLocation: storage.get("weather_location") || null,
        notes: storage.get("notes") || "",
        agenda: loadAgenda(),
        activity: loadActivity(),
        summarySeenWeek: storage.get("summary_seen_week") || null,
        timers: loadTimers(),
        ambient: loadAmbient(),
        lastBackupAt: storage.get("last_backup") || null,
        backupSnoozeUntil: storage.get("backup_snooze") || 0,
        theme: (() => {
          const resolved = resolveTheme(storage.get("theme"));
          if (resolved !== storage.get("theme")) {
            storage.set("theme", resolved);
          }
          return resolved;
        })(),
        cardLayout: (() => {
          const resolved = resolveCardLayout(storage.get("card_layout"));
          if (resolved !== storage.get("card_layout")) {
            storage.set("card_layout", resolved);
          }
          return resolved;
        })(),
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
        activeSubcategory: null,
        deepseekApiKey: storage.get("deepseek_apikey") || "",
        openInNewTab: storage.get("open_in_new_tab") !== false,
        welcomeSeen: storage.get("welcome_seen") || false,
        settingsSeen: storage.get("settings_seen") || false,
        searchHintDismissed: storage.get("search_hint_dismissed") || false,
      });
      applyTheme(get().theme);
      applyMotion(get().motionMode);
    }
    return success;
  },
}));

export { searchProviders };
export default useStore;
