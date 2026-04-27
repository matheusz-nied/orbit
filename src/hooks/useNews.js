import { useState, useEffect, useCallback } from 'react'

// Hook simplificado para TabNews — estrutura extensível para futuros provedores
export function useNews({ topics }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const strategy = topics.includes('new') || topics.includes('recent') ? 'new' : 'relevant'
      const url = `https://www.tabnews.com.br/api/v1/contents?strategy=${strategy}&per_page=100`

      const response = await fetch(url)
      const data = await response.json()

      if (Array.isArray(data)) {
        const postsOnly = data.filter(item => item.parent_id === null)

        setItems(postsOnly.slice(0, 30).map(item => ({
          title: item.title,
          url: `https://www.tabnews.com.br/${item.owner_username}/${item.slug}`,
          source: `TabNews · ${item.owner_username}`,
          publishedAt: item.published_at,
        })))
      }
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }, [topics])

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  return { items, loading, error, refetch: fetchNews }
}
