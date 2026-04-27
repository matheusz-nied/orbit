import { useEffect, useState, useCallback, useMemo } from 'react'
import { Newspaper, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import useStore from '../store/useStore'

export default function NewsFeed() {
  const newsTopics = useStore((state) => state.newsTopics)
  const setNewsTopics = useStore((state) => state.setNewsTopics)
  const newsItems = useStore((state) => state.newsItems)
  const setNewsItems = useStore((state) => state.setNewsItems)
  const newsLoading = useStore((state) => state.newsLoading)
  const setNewsLoading = useStore((state) => state.setNewsLoading)

  const [error, setError] = useState(null)
  const activeTopic = newsTopics[0] || 'relevant'

  const fetchFromTabNews = useCallback(async () => {
    const strategy = activeTopic === 'recent' ? 'new' : 'relevant'
    const url = `https://www.tabnews.com.br/api/v1/contents?strategy=${strategy}&per_page=30`

    const response = await fetch(url)
    const data = await response.json()

    if (Array.isArray(data)) {
      const postsOnly = data.filter(item => item.parent_id === null)

      setNewsItems(postsOnly.slice(0, 30).map(item => ({
        title: item.title,
        url: `https://www.tabnews.com.br/${item.owner_username}/${item.slug}`,
        source: item.owner_username,
        publishedAt: item.published_at,
      })))
    }
  }, [activeTopic, setNewsItems])

  const fetchNews = useCallback(async () => {
    setNewsLoading(true)
    setError(null)

    try {
      await fetchFromTabNews()
    } catch (err) {
      setError('Falha ao carregar notícias')
      console.error(err)
    }

    setNewsLoading(false)
  }, [fetchFromTabNews, setNewsLoading])

  useEffect(() => {
    fetchNews()
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }, [])

  const newsList = useMemo(() => {
    return newsItems.map((item, index) => (
      <a
        key={item.url + index}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-card border border-border rounded-xl p-4 hover:border-accent transition-colors group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text group-hover:text-accent transition-colors line-clamp-2">
              {item.title}
            </h3>
            <p className="text-sm text-muted mt-1">
              {item.source} · {formatDate(item.publishedAt)}
            </p>
          </div>
          <ExternalLink size={16} className="text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </a>
    ))
  }, [newsItems, formatDate])

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text flex items-center gap-2">
          <Newspaper size={20} />
          TabNews
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-card border border-border rounded-lg p-0.5">
            <button
              onClick={() => setNewsTopics(['relevant'])}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                activeTopic === 'relevant'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
            >
              Relevantes
            </button>
            <button
              onClick={() => setNewsTopics(['recent'])}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                activeTopic === 'recent'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
            >
              Recentes
            </button>
          </div>
          <button
            onClick={fetchNews}
            disabled={newsLoading}
            className="p-2 text-muted hover:text-accent transition-colors disabled:opacity-50"
            aria-label="Atualizar notícias"
          >
            <RefreshCw size={16} className={newsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-card border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!error && newsItems.length === 0 && !newsLoading && (
        <div className="bg-card border border-border rounded-xl p-4 text-center text-muted">
          Nenhuma notícia disponível
        </div>
      )}

      <div className="space-y-3">
        {newsList}
      </div>
    </div>
  )
}
