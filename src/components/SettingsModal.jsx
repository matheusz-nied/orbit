import { useState, useRef, useEffect } from 'react'
import {
  X, Palette, ChevronLeft, ChevronRight, Search, Newspaper, FolderOpen, Database,
  Plus, Trash2, Download, Upload, Check, AlertCircle, MessageSquare,
  LayoutGrid, Sparkles, Gem,
  CircleDot, Waves, Atom, ListPlus, Gauge, Layers, LayoutDashboard, Cpu, BookOpen, ScanEye, Rocket
} from 'lucide-react'
import useStore, { searchProviders } from '../store/useStore'
import { themeList } from '../themes/themes'
import { motionModes } from '../utils/motion'
import { normalizeHttpUrl } from '../utils/url'
import WorkspaceManager from './WorkspaceManager'
import WeatherLocationPicker from './WeatherLocationPicker'
import OnboardingGuide from './OnboardingGuide'
import CategorySubcategories from './CategorySubcategories'

// Seções agrupadas por assunto — com 10 itens, uma fileira de abas exigia
// rolagem horizontal e o usuário não sabia onde procurar.
const sectionGroups = [
  {
    label: null,
    items: [
      { id: 'guide', label: 'Comece por aqui', icon: Rocket, desc: 'Dicas rápidas para aproveitar o Orbit.' },
    ],
  },
  {
    label: 'Aparência',
    items: [
      { id: 'appearance', label: 'Tema e visual', icon: Palette, desc: 'Tema, estilo dos cards e animações.' },
    ],
  },
  {
    label: 'Página inicial',
    items: [
      { id: 'widgets', label: 'Widgets', icon: LayoutDashboard, desc: 'Clima, agenda, notas, pomodoro e frequentes.' },
      { id: 'news', label: 'Notícias', icon: Newspaper, desc: 'Como o feed do TabNews é ordenado.' },
    ],
  },
  {
    label: 'Busca e IA',
    items: [
      { id: 'search', label: 'Busca', icon: Search, desc: 'Provedor padrão e onde abrir links.' },
      { id: 'ai', label: 'Chat IA', icon: MessageSquare, desc: 'Chave da DeepSeek para o chat.' },
    ],
  },
  {
    label: 'Organização',
    items: [
      { id: 'workspaces', label: 'Espaços', icon: Layers, desc: 'Conjuntos separados de sites, como Pessoal e Trabalho.' },
      { id: 'categories', label: 'Categorias', icon: FolderOpen, desc: 'Categorias e subcategorias dos seus sites.' },
      { id: 'bulk', label: 'Adicionar em lote', icon: ListPlus, desc: 'Cole várias URLs de uma vez.' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { id: 'data', label: 'Backup', icon: Database, desc: 'Exporte ou restaure suas configurações.' },
    ],
  },
]

const sections = sectionGroups.flatMap(group => group.items)

const cardLayouts = [
  { id: 'classic', label: 'Clássico', Icon: LayoutGrid, desc: 'Ícones em grade' },
  { id: 'space', label: 'Space', Icon: Sparkles, desc: 'Janela para o cosmos' },
  { id: 'orbital-glass', label: 'Orbital Glass', Icon: Gem, desc: 'Planetas de vidro' },
  { id: 'singularity', label: 'Singularidade', Icon: CircleDot, desc: 'Buraco negro' },
  { id: 'wave-particle', label: 'Dualidade', Icon: Waves, desc: 'Onda-partícula' },
  { id: 'quantum-spin', label: 'Spin', Icon: Atom, desc: 'Spin quântico' },
  { id: 'cyber', label: 'Cyber', Icon: Cpu, desc: 'Slot netrunner' },
  { id: 'archive', label: 'Arquivo', Icon: BookOpen, desc: 'Placas editoriais' },
  { id: 'android', label: 'Android', Icon: ScanEye, desc: 'Scan RK800' },
]

// Estado selecionado dos cartões de opção — o fundo translúcido vem de
// `.settings-option[data-selected="true"]` em index.css (Tailwind não gera
// `bg-accent/10` porque `accent` é uma var CSS sem canal alfa).
const optionClass = (selected, extra = '') =>
  `settings-option rounded-xl border transition-colors ${
    selected ? 'border-accent' : 'border-border hover:border-accent'
  } ${extra}`

const widgetOptions = [
  { id: 'weather', label: 'Clima', desc: 'Temperatura e condição abaixo do relógio' },
  { id: 'frequent', label: 'Sites frequentes', desc: 'Aba com os sites que você mais abre' },
  { id: 'agenda', label: 'Agenda do dia', desc: 'Lista de tarefas no dock — tecla t para abrir' },
  { id: 'notes', label: 'Notas rápidas', desc: 'Bloco de anotações no canto inferior' },
  { id: 'pomodoro', label: 'Pomodoro', desc: 'Timer de foco com ciclos de 25/5 min' },
]

export default function SettingsModal() {
  const settingsOpen = useStore((state) => state.settingsOpen)
  const settingsSection = useStore((state) => state.settingsSection)
  const closeSettings = useStore((state) => state.closeSettings)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const cardLayout = useStore((state) => state.cardLayout)
  const setCardLayout = useStore((state) => state.setCardLayout)
  const motionMode = useStore((state) => state.motionMode)
  const setMotionMode = useStore((state) => state.setMotionMode)
  const widgets = useStore((state) => state.widgets)
  const setWidgetVisible = useStore((state) => state.setWidgetVisible)
  const siteStats = useStore((state) => state.siteStats)
  const resetSiteStats = useStore((state) => state.resetSiteStats)
  const searchProvider = useStore((state) => state.searchProvider)
  const setSearchProvider = useStore((state) => state.setSearchProvider)
  const openInNewTab = useStore((state) => state.openInNewTab)
  const setOpenInNewTab = useStore((state) => state.setOpenInNewTab)
  const deepseekApiKey = useStore((state) => state.deepseekApiKey)
  const setDeepseekApiKey = useStore((state) => state.setDeepseekApiKey)
  const newsTopics = useStore((state) => state.newsTopics)
  const setNewsTopics = useStore((state) => state.setNewsTopics)
  const categories = useStore((state) => state.categories)
  const addCategory = useStore((state) => state.addCategory)
  const removeCategory = useStore((state) => state.removeCategory)
  const exportData = useStore((state) => state.exportData)
  const importData = useStore((state) => state.importData)
  const addSites = useStore((state) => state.addSites)

  const [activeTab, setActiveTab] = useState('guide')
  // No celular a navegação vira lista → detalhe; no desktop as duas colunas
  // ficam sempre visíveis e isto é ignorado.
  const [mobileView, setMobileView] = useState('menu')
  const [newCategory, setNewCategory] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [includeSecrets, setIncludeSecrets] = useState(false)
  const [batchUrls, setBatchUrls] = useState('')
  const [batchCategory, setBatchCategory] = useState('')
  const [batchStatus, setBatchStatus] = useState(null)
  const fileInputRef = useRef(null)

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim().toLowerCase())
      setNewCategory('')
    }
  }

  const handleExport = () => {
    const data = exportData({ includeSecrets })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orbit-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        const success = importData(data)
        setImportStatus(success ? 'success' : 'error')
        setTimeout(() => setImportStatus(null), 3000)
      } catch {
        setImportStatus('error')
        setTimeout(() => setImportStatus(null), 3000)
      }
    }
    reader.readAsText(file)
  }

  const handleBatchImport = () => {
    if (!batchUrls.trim()) return

    const lines = batchUrls.split('\n').map(l => l.trim()).filter(l => l)
    const newSites = []

    for (const line of lines) {
      const finalUrl = normalizeHttpUrl(line)
      if (!finalUrl) continue

      let name = finalUrl
      try {
        const hostname = new URL(finalUrl).hostname.replace(/^www\./, '')
        const suggestion = hostname.split('.')[0]
        if (suggestion) {
          name = suggestion.charAt(0).toUpperCase() + suggestion.slice(1)
        }
      } catch {}

      newSites.push({
        name,
        url: finalUrl,
        category: batchCategory || categories[0] || 'geral'
      })
    }

    if (newSites.length > 0) {
      addSites(newSites)
      setBatchUrls('')
      setBatchStatus(`Foram adicionados ${newSites.length} sites com sucesso!`)
    } else {
      setBatchStatus('Nenhuma URL válida encontrada.')
    }

    setTimeout(() => setBatchStatus(null), 4000)
  }

  const selectTopic = (topicId) => {
    setNewsTopics([topicId])
  }

  // Abrir numa seção específica (ex.: "Definir cidade" → Widgets) pula o menu.
  useEffect(() => {
    if (!settingsOpen) return
    if (settingsSection && sections.some(sec => sec.id === settingsSection)) {
      setActiveTab(settingsSection)
      setMobileView('content')
    } else {
      setMobileView('menu')
    }
  }, [settingsOpen, settingsSection])

  const selectSection = (id) => {
    setActiveTab(id)
    setMobileView('content')
  }

  if (!settingsOpen) return null

  const current = sections.find(sec => sec.id === activeTab) || sections[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={closeSettings}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-4xl mx-4 h-[min(90vh,820px)] flex flex-col overflow-hidden animate-slideIn"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Configurações"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-text">Configurações</h2>
          <button onClick={closeSettings} className="text-muted hover:text-text transition-colors" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Navegação lateral */}
          <nav
            className={`${mobileView === 'menu' ? 'flex' : 'hidden'} sm:flex flex-col w-full sm:w-56 shrink-0 sm:border-r border-border overflow-y-auto p-3 gap-4`}
            aria-label="Seções das configurações"
          >
            {sectionGroups.map((group, index) => (
              <div key={group.label || index}>
                {group.label && (
                  <p className="px-3 mb-1 text-[11px] font-medium uppercase tracking-wider text-muted opacity-70">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id
                    return (
                      <button
                        key={id}
                        onClick={() => selectSection(id)}
                        aria-current={isActive ? 'page' : undefined}
                        data-selected={isActive}
                        className={`settings-nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          isActive ? 'text-accent font-medium' : 'text-muted hover:text-text hover:bg-bg'
                        }`}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="flex-1 truncate">{label}</span>
                        <ChevronRight size={14} className="sm:hidden opacity-50" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

        {/* Content */}
        <div className={`${mobileView === 'content' ? 'flex' : 'hidden'} sm:flex flex-col flex-1 min-w-0`}>
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <button
              onClick={() => setMobileView('menu')}
              className="sm:hidden flex items-center gap-1 -ml-1 mb-2 text-xs text-muted hover:text-text transition-colors"
            >
              <ChevronLeft size={14} />
              Configurações
            </button>
            <h3 className="text-base font-semibold text-text">{current.label}</h3>
            <p className="text-xs text-muted mt-0.5">{current.desc}</p>
          </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <p className="text-sm text-muted leading-relaxed">
                Um resumo rápido de como usar o Orbit — as mesmas dicas da tela de boas-vindas.
              </p>
              <OnboardingGuide />
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Tema</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {themeList.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      data-selected={theme === t.id}
                      className={optionClass(theme === t.id, 'flex items-center justify-between gap-2 px-3 py-2.5 text-left')}
                    >
                      <span className="text-sm font-medium text-text truncate">{t.name}</span>
                      {theme === t.id && <Check size={14} className="text-accent shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Layout Picker */}
              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Estilo dos cards</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cardLayouts.map(({ id, label, Icon, desc }) => (
                    <button
                      key={id}
                      onClick={() => setCardLayout(id)}
                      data-selected={cardLayout === id}
                      className={optionClass(cardLayout === id, 'flex items-center gap-2.5 px-3 py-2.5 text-left')}
                    >
                      <Icon size={18} className={`shrink-0 ${cardLayout === id ? 'text-accent' : 'text-muted'}`} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-text truncate">{label}</span>
                        <span className="block text-[11px] text-muted truncate">{desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desempenho / animações */}
              <div>
                <h4 className="text-sm font-medium text-muted mb-1 flex items-center gap-2">
                  <Gauge size={16} />
                  Animações
                </h4>
                <p className="text-xs text-muted mb-3">
                  O modo <span className="text-text font-medium">Leve</span> desliga brilhos,
                  órbitas e desfoques decorativos. Use se a página estiver pesando no seu PC.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {motionModes.map(({ id, label, desc }) => (
                    <button
                      key={id}
                      onClick={() => setMotionMode(id)}
                      data-selected={motionMode === id}
                      className={optionClass(motionMode === id, 'px-3 py-2.5 text-left')}
                    >
                      <span className="block text-sm font-medium text-text">{label}</span>
                      <span className="block text-[11px] text-muted mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Widgets Tab */}
          {activeTab === 'widgets' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted mb-3">O que mostrar</h4>
                <div className="space-y-2">
                  {widgetOptions.map(({ id, label, desc }) => (
                    <button
                      key={id}
                      onClick={() => setWidgetVisible(id, !widgets[id])}
                      role="switch"
                      aria-checked={Boolean(widgets[id])}
                      data-selected={Boolean(widgets[id])}
                      className={optionClass(widgets[id], 'w-full flex items-center justify-between gap-3 p-3 text-left')}
                    >
                      <div className="min-w-0">
                        <span className="block text-sm font-medium text-text">{label}</span>
                        <span className="block text-xs text-muted mt-0.5">{desc}</span>
                      </div>
                      <span
                        className={`shrink-0 w-10 h-6 rounded-full border flex items-center px-0.5 transition-colors ${
                          widgets[id] ? 'bg-accent border-accent justify-end' : 'bg-bg border-border justify-start'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${widgets[id] ? 'bg-bg' : 'bg-muted'}`} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <WeatherLocationPicker />

              <div>
                <h4 className="text-sm font-medium text-muted mb-1">Histórico de uso</h4>
                <p className="text-xs text-muted mb-3">
                  A aba "Frequentes" conta quantas vezes você abre cada site. Esses números ficam
                  só neste navegador e nunca saem dele.
                </p>
                <button
                  onClick={resetSiteStats}
                  disabled={Object.keys(siteStats).length === 0}
                  className="px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-muted hover:text-red-500 hover:border-red-500 transition-colors disabled:opacity-40 disabled:hover:text-muted disabled:hover:border-border"
                >
                  Zerar contadores
                  {Object.keys(siteStats).length > 0 && ` (${Object.keys(siteStats).length} sites)`}
                </button>
              </div>
            </div>
          )}

          {/* Workspaces Tab */}
          {activeTab === 'workspaces' && <WorkspaceManager />}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Provedor Padrão</h4>
                <div className="grid grid-cols-2 gap-3">
                  {searchProviders.filter(p => p.type === 'search').map((provider, index) => {
                    const actualIndex = searchProviders.findIndex(p => p.name === provider.name)
                    return (
                      <button
                        key={provider.name}
                        onClick={() => setSearchProvider(actualIndex)}
                        data-selected={searchProvider === actualIndex}
                        className={optionClass(searchProvider === actualIndex, 'p-3 flex items-center gap-3')}
                      >
                        <span
                          className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
                          style={{ backgroundColor: provider.color, color: '#fff' }}
                        >
                          {provider.icon}
                        </span>
                        <span className="text-sm font-medium text-text">{provider.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Abrir links e pesquisas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setOpenInNewTab(true)}
                    data-selected={openInNewTab}
                    className={optionClass(openInNewTab, 'p-3 text-left')}
                  >
                    <span className="text-sm font-medium text-text">Nova aba</span>
                    <p className="text-xs text-muted mt-1">Pesquisa e clique em site abrem em outra aba.</p>
                  </button>

                  <button
                    onClick={() => setOpenInNewTab(false)}
                    data-selected={!openInNewTab}
                    className={optionClass(!openInNewTab, 'p-3 text-left')}
                  >
                    <span className="text-sm font-medium text-text">Mesma aba atual</span>
                    <p className="text-xs text-muted mt-1">Pesquisa e clique em site substituem a página atual.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Chat Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted mb-3">DeepSeek API Key</h4>
                <input
                  type="password"
                  value={deepseekApiKey}
                  onChange={e => setDeepseekApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
                />
                <p className="text-xs text-muted mt-2">
                  Obtenha uma chave em <a href="https://platform.deepseek.com" target="_blank" rel="noopener" className="text-accent hover:underline">platform.deepseek.com</a>
                </p>
                <p className="text-xs text-muted mt-1">
                  Sua chave fica salva apenas no navegador (localStorage).
                </p>
              </div>

              <div className="p-4 bg-bg rounded-lg border border-border">
                <h4 className="text-sm font-medium text-text mb-2">Como usar</h4>
                <ul className="text-xs text-muted space-y-1">
                  <li>1. Pressione <kbd className="px-1 py-0.5 bg-border rounded">Tab</kbd> até chegar em "AI Chat"</li>
                  <li>2. Pressione <kbd className="px-1 py-0.5 bg-border rounded">Enter</kbd> para abrir o chat</li>
                  <li>3. Digite sua pergunta e pressione Enter</li>
                </ul>
              </div>

              {deepseekApiKey && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Check size={16} />
                  <span>API key configurada</span>
                </div>
              )}
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="p-4 bg-bg rounded-lg border border-border">
                <h4 className="text-sm font-medium text-text mb-2">Provedor Atual</h4>
                <p className="text-sm text-muted">
                  O feed de notícias usa o <span className="text-accent font-medium">TabNews</span> como fonte única.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Ordenação do Feed</h4>
                <p className="text-xs text-muted mb-3">
                  Escolha como os posts do TabNews são ordenados.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'relevant', label: 'Relevantes' },
                    { id: 'recent', label: 'Recentes' },
                  ].map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => selectTopic(topic.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        newsTopics.includes(topic.id)
                          ? 'bg-accent text-bg'
                          : 'bg-bg border border-border text-muted hover:text-text'
                      }`}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted mb-1">Categorias Existentes</h4>
                <p className="text-xs text-muted mb-3">
                  Subcategorias organizam uma categoria por dentro — por exemplo, um projeto em Trabalho.
                  Remover uma subcategoria mantém os sites na categoria.
                </p>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <CategorySubcategories
                      key={cat}
                      category={cat}
                      onRemoveCategory={() => removeCategory(cat)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Adicionar Categoria</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Nome da categoria..."
                    className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Exportar Configuração</h4>
                <p className="text-sm text-muted mb-3">
                  Exporte sites, espaços, widgets, tema e preferências para um arquivo JSON.
                  Chaves de API ficam de fora por padrão.
                </p>
                <label className="flex items-center gap-2 mb-3 text-sm text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSecrets}
                    onChange={(e) => setIncludeSecrets(e.target.checked)}
                    className="rounded border-border"
                  />
                  Incluir chaves de API (DeepSeek / legadas)
                </label>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity"
                >
                  <Download size={18} />
                  Exportar JSON
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted mb-3">Importar Configuração</h4>
                <p className="text-sm text-muted mb-3">
                  Importe um arquivo de configuração para restaurar suas preferências.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 bg-bg border border-border rounded-lg text-text font-medium hover:border-accent transition-colors"
                >
                  <Upload size={18} />
                  Importar JSON
                </button>

                {importStatus && (
                  <div className={`flex items-center gap-2 mt-3 text-sm ${importStatus === 'success' ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {importStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {importStatus === 'success' ? 'Importado com sucesso!' : 'Erro ao importar arquivo'}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Bulk add */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted mb-3">
                  Cole uma lista de URLs (uma por linha) para adicionar vários sites de uma vez. O Orbit irá extrair o nome de cada site automaticamente.
                </p>
                <textarea
                  value={batchUrls}
                  onChange={e => setBatchUrls(e.target.value)}
                  placeholder="https://github.com&#10;https://youtube.com&#10;stackoverflow.com"
                  className="w-full h-32 px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors mb-3 resize-none"
                />
                
                <div className="flex gap-3 mb-3">
                  <select
                    value={batchCategory}
                    onChange={e => setBatchCategory(e.target.value)}
                    className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleBatchImport}
                    disabled={!batchUrls.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <ListPlus size={18} />
                    Adicionar
                  </button>
                </div>
                
                {batchStatus && (
                  <div className={`flex items-center gap-2 text-sm ${batchStatus.includes('sucesso') ? 'text-green-500' : 'text-red-500'}`}>
                    {batchStatus.includes('sucesso') ? <Check size={16} /> : <AlertCircle size={16} />}
                    {batchStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}
