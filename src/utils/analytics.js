import { storage } from './storage'

const ENTRY_INTERVAL_MS = 30 * 60 * 1000
const UMAMI_RETRY_DELAY_MS = 250
const UMAMI_MAX_RETRIES = 20

let usageTracked = false

const getLocalDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getDateDiffInDays = (startDateKey, endDateKey) => {
  const [startYear, startMonth, startDay] = startDateKey.split('-').map(Number)
  const [endYear, endMonth, endDay] = endDateKey.split('-').map(Number)
  const startDate = new Date(startYear, startMonth - 1, startDay)
  const endDate = new Date(endYear, endMonth - 1, endDay)

  return Math.max(0, Math.round((endDate - startDate) / 86400000))
}

const getStoredNumber = (key, fallback = 0) => {
  const value = Number(storage.get(key))
  return Number.isFinite(value) ? value : fallback
}

const createAnalyticsId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `orbit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

const getAnalyticsId = () => {
  const existingId = storage.get('analytics_id')

  if (existingId) {
    return existingId
  }

  const analyticsId = createAnalyticsId()
  storage.set('analytics_id', analyticsId)
  return analyticsId
}

const waitForUmami = (attempt = 0) => new Promise((resolve) => {
  if (typeof window === 'undefined') {
    resolve(null)
    return
  }

  if (window.umami?.track) {
    resolve(window.umami)
    return
  }

  if (attempt >= UMAMI_MAX_RETRIES) {
    resolve(null)
    return
  }

  window.setTimeout(() => {
    waitForUmami(attempt + 1).then(resolve)
  }, UMAMI_RETRY_DELAY_MS)
})

const trackEvent = (umami, eventName, data) => {
  try {
    umami.track(eventName, data)
  } catch (error) {
    console.error('Umami track error:', error)
  }
}

export const trackOrbitUsage = async ({ theme, searchProvider } = {}) => {
  if (usageTracked || typeof window === 'undefined') {
    return
  }

  usageTracked = true

  const now = Date.now()
  const today = getLocalDateKey(new Date(now))
  const analyticsId = getAnalyticsId()
  const openCount = getStoredNumber('analytics_open_count') + 1
  const previousActiveDaysCount = getStoredNumber('analytics_active_days_count')
  const lastActiveDate = storage.get('analytics_last_active_date')
  const lastEntryAt = getStoredNumber('analytics_last_entry_at')
  const isNewActiveDay = lastActiveDate !== today
  const returnGapDays = lastActiveDate ? getDateDiffInDays(lastActiveDate, today) : 0
  const activeDaysCount = isNewActiveDay ? previousActiveDaysCount + 1 : previousActiveDaysCount
  const shouldTrackEntry = !lastEntryAt || now - lastEntryAt >= ENTRY_INTERVAL_MS

  storage.set('analytics_open_count', openCount)

  if (isNewActiveDay) {
    storage.set('analytics_active_days_count', activeDaysCount)
    storage.set('analytics_last_active_date', today)
  }

  if (shouldTrackEntry) {
    storage.set('analytics_last_entry_at', now)
  }

  const sharedData = {
    theme: theme || 'unknown',
    search_provider: searchProvider || 'unknown',
  }

  const umami = await waitForUmami()

  if (!umami) {
    return
  }

  try {
    await umami.identify(analyticsId)
  } catch (error) {
    console.error('Umami identify error:', error)
  }

  trackEvent(umami, 'orbit_pageview', sharedData)

  if (shouldTrackEntry) {
    trackEvent(umami, 'orbit_entry', {
      ...sharedData,
      open_count: openCount,
      active_days_count: activeDaysCount,
    })
  }

  if (isNewActiveDay) {
    trackEvent(umami, 'orbit_daily_active', {
      active_days_count: activeDaysCount,
    })
  }

  if (lastActiveDate && returnGapDays > 0) {
    trackEvent(umami, 'orbit_return', {
      return_gap_days: returnGapDays,
      active_days_count: activeDaysCount,
    })
  }
}
