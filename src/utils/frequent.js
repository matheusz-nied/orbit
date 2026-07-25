// Categoria virtual: não vive em `categories`, é derivada de `siteStats`.
export const FREQUENT_CATEGORY = '__frequent__'
export const FREQUENT_LIMIT = 12

// Ordena por número de aberturas e, em empate, pelo uso mais recente — assim
// o que você acabou de usar sobe entre os de mesma contagem.
export const rankByUsage = (sites, siteStats) =>
  sites
    .filter((site) => (siteStats[site.id]?.count || 0) > 0)
    .sort((a, b) => {
      const statsA = siteStats[a.id]
      const statsB = siteStats[b.id]
      if (statsB.count !== statsA.count) return statsB.count - statsA.count
      return statsB.lastUsed - statsA.lastUsed
    })

export const hasUsageData = (siteStats) => Object.keys(siteStats).length > 0
