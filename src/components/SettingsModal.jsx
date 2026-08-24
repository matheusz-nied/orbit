import { useState, useRef } from 'react'
import {
  X, Palette, Search, Newspaper, FolderOpen, Database,
  Plus, Trash2, Download, Upload, Check, AlertCircle, MessageSquare,
  LayoutGrid, Sparkles, Gem,
  CircleDot, Waves, Atom, ListPlus, ExternalLink, Gauge, Layers, LayoutDashboard, Cpu
} from 'lucide-react'
import useStore, { searchProviders } from '../store/useStore'
import { themeList } from '../themes/themes'
import { motionModes } from '../utils/motion'
import { normalizeHttpUrl } from '../utils/url'
import WorkspaceManager from './WorkspaceManager'
import WeatherLocationPicker from './WeatherLocationPicker'

const tabs = [
  { id: 'appearance', label: 'Tema', icon: Palette },
  { id: 'widgets', label: 'Widgets', icon: LayoutDashboard },
  { id: 'search', label: 'Busca', icon: Search },
  { id: 'ai', label: 'Chat IA', icon: MessageSquare },
  { id: 'news', label: 'Notícias', icon: Newspaper },
  { id: 'workspaces', label: 'Espaços', icon: Layers },
  { id: 'categories', label: 'Categorias', icon: FolderOpen },
  { id: 'data', label: 'Dados', icon: Database },
]

const widgetOptions = [
  { id: 'weather', label: 'Clima', desc: 'Temperatura e condição abaixo do relógio' },
  { id: 'frequent', label: 'Sites frequentes', desc: 'Aba com os sites que você mais abre' },
  { id: 'agenda', label: 'Agenda do dia', desc: 'Lista de tarefas no dock — tecla t para abrir' },
  { id: 'notes', label: 'Notas rápidas', desc: 'Bloco de anotações no canto inferior' },
  { id: 'pomodoro', label: 'Pomodoro', desc: 'Timer de foco com ciclos de 25/5 min' },
]

export default function SettingsModal() {
  const settingsOpen = useStore((state) => state.settingsOpen)
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

  const [activeTab, setActiveTab] = useState('appearance')
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

  if (!settingsOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={closeSettings}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text">Configurações</h2>
          <button onClick={closeSettings} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-muted hover:text-text'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <a
                href="https://chromewebstore.google.com/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-accent/10 rounded-xl border border-accent/30 hover:border-accent transition-colors"
              >
                <ExternalLink size={18} className="text-accent shrink-0" />
                <div>
                  <p className="text-sm font-medium text-accent">Abra o Orbit em cada nova aba</p>
                  <p className="text-xs text-muted mt-0.5">
                    Instale a extensão <span className="text-text font-medium">New Tab Redirect</span> (de terceiros, não é do Orbit) e configure a URL do Orbit como nova aba.
                  </p>
                </div>
              </a>

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Tema</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {themeList.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-xl border transition-all ${theme === t.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                        }`}
                    >
                      <span className="text-sm font-medium text-text">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Layout Picker */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Layout dos Cards</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'classic', label: 'Clássico', Icon: LayoutGrid, desc: 'Ícones em grade' },
                    { id: 'orbital', label: 'Orbital', Icon: Sparkles, desc: 'Planetas flutuantes' },
                    { id: 'orbital-glass', label: 'Orbital Glass', Icon: Gem, desc: 'Planetas de vidro' },
                    { id: 'singularity', label: 'Singularidade', Icon: CircleDot, desc: 'Buraco negro' },
                    { id: 'wave-particle', label: 'Dualidade', Icon: Waves, desc: 'Onda-partícula' },
                    { id: 'quantum-spin', label: 'Spin', Icon: Atom, desc: 'Spin quântico' },
                    { id: 'cyber', label: 'Cyber', Icon: Cpu, desc: 'Slot netrunner' },
                  ].map(({ id, label, Icon, desc }) => (
                    <button
                      key={id}
                      onClick={() => setCardLayout(id)}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${cardLayout === id
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                        }`}
                    >
                      <Icon size={22} className={cardLayout === id ? 'text-accent' : 'text-muted'} />
                      <span className="text-sm font-medium text-text">{label}</span>
                      <span className="text-[10px] text-muted">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desempenho / animações */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-1 flex items-center gap-2">
                  <Gauge size={16} />
                  Animações
                </h3>
                <p className="text-xs text-muted mb-3">
                  O modo <span className="text-text font-medium">Leve</span> desliga brilhos,
                  órbitas e desfoques decorativos. Use se a página estiver pesando no seu PC.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {motionModes.map(({ id, label, desc }) => (
                    <button
                      key={id}
                      onClick={() => setMotionMode(id)}
                      className={`p-3 rounded-xl border transition-colors text-left ${motionMode === id
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                        }`}
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
                <h3 className="text-sm font-medium text-muted mb-3">O que mostrar</h3>
                <div className="space-y-2">
                  {widgetOptions.map(({ id, label, desc }) => (
                    <button
                      key={id}
                      onClick={() => setWidgetVisible(id, !widgets[id])}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors text-left ${
                        widgets[id] ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                      }`}
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
                <h3 className="text-sm font-medium text-muted mb-1">Histórico de uso</h3>
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
                <h3 className="text-sm font-medium text-muted mb-3">Provedor Padrão</h3>
                <div className="grid grid-cols-2 gap-3">
                  {searchProviders.filter(p => p.type === 'search').map((provider, index) => {
                    const actualIndex = searchProviders.findIndex(p => p.name === provider.name)
                    return (
                      <button
                        key={provider.name}
                        onClick={() => setSearchProvider(actualIndex)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${searchProvider === actualIndex
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-accent/50'
                          }`}
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
                <h3 className="text-sm font-medium text-muted mb-3">Abrir links e pesquisas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setOpenInNewTab(true)}
                    className={`p-3 rounded-xl border transition-all text-left ${openInNewTab
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                      }`}
                  >
                    <span className="text-sm font-medium text-text">Nova aba</span>
                    <p className="text-xs text-muted mt-1">Pesquisa e clique em site abrem em outra aba.</p>
                  </button>

                  <button
                    onClick={() => setOpenInNewTab(false)}
                    className={`p-3 rounded-xl border transition-all text-left ${!openInNewTab
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                      }`}
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
                <h3 className="text-sm font-medium text-muted mb-3">DeepSeek API Key</h3>
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
                <h3 className="text-sm font-medium text-text mb-2">Provedor Atual</h3>
                <p className="text-sm text-muted">
                  O feed de notícias usa o <span className="text-accent font-medium">TabNews</span> como fonte única.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Ordenação do Feed</h3>
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
                <h3 className="text-sm font-medium text-muted mb-3">Categorias Existentes</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div
                      key={cat}
                      className="flex items-center gap-2 px-3 py-2 bg-bg border border-border rounded-lg"
                    >
                      <span className="text-sm text-text">{cat}</span>
                      <button
                        onClick={() => removeCategory(cat)}
                        className="text-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Adicionar Categoria</h3>
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
                <h3 className="text-sm font-medium text-muted mb-3">Exportar Configuração</h3>
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
                <h3 className="text-sm font-medium text-muted mb-3">Importar Configuração</h3>
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

              <div className="pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-muted mb-3">Adicionar Vários Sites</h3>
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
  )
}
