import { useEffect, useState } from 'react'
import { Newspaper, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import useStore from '../store/useStore'

const rssFeeds = {
  technology: 'https://feeds.feedburner.com/TechCrunch',
  science: 'https://www.sciencedaily.com/rss/all.xml',
  entertainment: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
  business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
  health: 'https://feeds.bbci.co.uk/news/health/rss.xml',
  sports: 'https://feeds.bbci.co.uk/sport/rss.xml',
}

const gnewsTopics = {
  technology: 'technology',
  science: 'science',
  entertainment: 'entertainment',
  business: 'business',
  health: 'health',
  sports: 'sports',
}

const topicLabels = {
  technology: 'Tecnologia',
  science: 'Ciência',
  entertainment: 'Entretenimento',
  business: 'Negócios',
  health: 'Saúde',
  sports: 'Esportes',
}

export default function NewsFeed() {
  const { newsProvider, newsApiKey, newsTopics, newsItems, setNewsItems, newsLoading, setNewsLoading } = useStore()
  const [error, setError] = useState(null)
  const activeTopic = newsTopics[0] || 'technology'

  const fetchNews = async () => {
    setNewsLoading(true)
    setError(null)

    try {
      if (newsProvider === 'gnews' && newsApiKey) {
        await fetchFromGNews()
      } else {
        await fetchFromRSS()
      }
    } catch (err) {
      setError('Falha ao carregar notícias')
      console.error(err)
    }

    setNewsLoading(false)
  }

  const fetchFromGNews = async () => {
    const topic = gnewsTopics[activeTopic] || 'technology'
    const url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=pt&token=${newsApiKey}&max=5`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.articles) {
      setNewsItems(data.articles.map(article => ({
        title: article.title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
      })))
    }
  }

  const fetchFromRSS = async () => {
    const topic = activeTopic
    const feedUrl = rssFeeds[topic] || rssFeeds.technology
    
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.items) {
      setNewsItems(data.items.slice(0, 5).map(item => ({
        title: item.title,
        url: item.link,
        source: item.author || new URL(feedUrl).hostname,
        publishedAt: item.pubDate,
      })))
    }
  }

  useEffect(() => {
    fetchNews()
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [newsProvider, newsApiKey, activeTopic])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text flex items-center gap-2">
          <Newspaper size={20} />
          Notícias
        </h2>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-card border border-border text-xs text-muted">
            {topicLabels[activeTopic] || 'Tecnologia'}
          </span>
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
        {newsItems.map((item, index) => (
          <a
            key={index}
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
        ))}
      </div>
    </div>
  )
}
