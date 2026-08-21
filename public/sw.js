// Service worker do Orbit — escrito à mão para não trazer uma dependência de
// build só por causa disso. Bump em VERSION invalida todos os caches.
const VERSION = 'v2'
const SHELL_CACHE = `orbit-shell-${VERSION}`
const ASSET_CACHE = `orbit-assets-${VERSION}`
const FAVICON_CACHE = `orbit-favicons-${VERSION}`
const FONT_CACHE = `orbit-fonts-${VERSION}`

const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE, FAVICON_CACHE, FONT_CACHE]

// Só o essencial para a página abrir offline. Os bundles com hash entram no
// cache sozinhos no primeiro acesso (não dá para listá-los aqui: os nomes
// mudam a cada build).
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest']

const FAVICON_HOSTS = ['www.google.com', 'icons.duckduckgo.com']
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll falha inteiro se um item falhar; aqui um recurso ausente não
      // pode impedir a instalação do worker.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('orbit-') && !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    // Respostas opacas (favicons de terceiros) têm status 0 e ainda assim são
    // úteis para exibir — por isso não filtramos por response.ok aqui.
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    // Offline e sem cache: devolve vazio em vez de quebrar o <img>.
    return new Response('', { status: 504, statusText: 'Offline' })
  }
}

const staleWhileRevalidate = async (request, cachePromise, update) => {
  const cache = await cachePromise
  const cached = await cache.match(request)

  if (cached) return cached

  const response = await update
  if (response) return response

  // Navegação offline sem cache exato: o app é uma SPA, então o index serve.
  const shell = await caches.match('/index.html')
  if (shell) return shell

  throw new TypeError('Falha ao carregar a navegação e não há cache disponível')
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Navegação: abre do cache imediatamente e atualiza em segundo plano.
  if (request.mode === 'navigate') {
    const cachePromise = caches.open(SHELL_CACHE)
    const update = fetch(request)
      .then(async (response) => {
        if (response && response.ok) {
          const cache = await cachePromise
          await cache.put(request, response.clone())
        }
        return response
      })
      .catch(() => null)

    // waitUntil precisa ser chamado durante o evento; assim a atualização do
    // cache segue mesmo depois que a resposta em cache já abriu a aba.
    event.waitUntil(update)
    event.respondWith(staleWhileRevalidate(request, cachePromise, update))
    return
  }

  // Bundles com hash no nome são imutáveis — cache primeiro é sempre correto.
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  if (url.origin === self.location.origin && SHELL.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // Favicons: a razão principal do cache. Sem isso cada abertura de aba dispara
  // uma requisição por site ao Google.
  if (FAVICON_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, FAVICON_CACHE))
    return
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, FONT_CACHE))
    return
  }

  // Clima, notícias e IA seguem direto para a rede: dados frescos importam
  // mais que funcionar offline.
})
