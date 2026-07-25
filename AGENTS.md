# AGENTS.md — Orbit

## Visão Geral

Orbit é uma **startpage/new-tab page** para navegador — SPA client-side em React 18 com Vite 5. UI em **português brasileiro** (`lang="pt-BR"`).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 (JSX, **sem TypeScript**) |
| Build | Vite 5 |
| Estado | Zustand — store único plano em `src/store/useStore.js` |
| Estilo | Tailwind CSS 3 + CSS custom properties (variáveis temáticas) |
| Drag & Drop | @dnd-kit (core + sortable + utilities) |
| Ícones | Lucide React |
| Persistência | `localStorage` com prefixo `sp_` (`src/utils/storage.js`) |

## Estrutura de Diretórios

```
src/
  components/   # Componentes React (flat, 1 componente por arquivo)
  hooks/         # Custom hooks (useNews, useSearch)
  store/         # Zustand store (useStore.js)
  themes/        # Definições de temas (themes.js)
  utils/         # Funções utilitárias puras (favicon.js, storage.js)
```

- Sem arquivos barrel/index — imports diretos por caminho.
- Sem roteador — é página única.
- Sem autenticação — 100% client-side, dados em localStorage.

## Padrões de Código

### Exportações
- **Componentes**: `export default function Nome`
- **Utils/hooks**: `export const` / `export function`

### Estado (Zustand)
- Store único e plano em `src/store/useStore.js`.
- Toda mutação que precisa persistir chama `storage.set()` **sincronamente** dentro da ação.
- Estado inclui: `sites`, `categories`, `activeCategory`, `theme`, `searchProvider`, `searchQuery`, `newsProvider`, `newsApiKey`, `newsTopics`, `newsItems`, `newsLoading`, `settingsOpen`, `addSiteOpen`, `editingSite`.
- Exporta também o array `searchProviders` (Google, Bing, DuckDuckGo, YouTube, Brave, Ecosia).

### Temas
- 7 temas: `minimal-light`, `minimal-dark`, `space`, `hacking`, `nord`, `sunset`, `cyberpunk`.
- Temas são **CSS custom properties** aplicadas via `document.documentElement.style.setProperty()` (não classes).
- Tailwind referencia variáveis: `bg-[var(--bg)]`, etc. (configurado em `tailwind.config.js` com tokens `bg`, `card`, `text`, `accent`, `muted`, `border`, `font-theme`).
- `applyTheme()` em `src/themes/themes.js` reage a mudanças via `useEffect` em `App.jsx`.

### Componentes Principais
- `StarCanvas` — canvas animado com estrelas, renderiza **apenas** no tema `space`.
- `Clock` — relógio/data em tempo real.
- `SearchBar` — input dual: filtra sites localmente (`searchQuery`) e abre busca web (`Enter` = novo tab, `Tab` = troca provider).
- `CategoryFilter` — abas de filtro + botão "Adicionar Site".
- `SiteGrid` — grid sortable com `DndContext > SortableContext`, usa `rectSortingStrategy`.
- `SiteCard` — usa `useSortable`, ações de editar/deletar aparecem no hover.
- `NewsFeed` — feed de notícias, busca via RSS (`rss2json`) ou GNews API, auto-refresh 5min.
- `SettingsModal` — 5 abas (Geral, Sites, Categorias, Notícias, Dados).
- `AddSiteModal` — modal para adicionar/editar site.

### Desempenho / Animações

A página tem muitas animações decorativas infinitas. Regras para não regredir:

- **Nunca anime propriedades que repintam** (`border-radius`, `box-shadow`, `background`, `width/height`) em elementos com `filter: blur()` ou `backdrop-filter` — o navegador refaz o blur a cada frame. Use `transform`/`opacity` (keyframe `wobble` existe para isso).
- **Evite `transition: all`** — liste as propriedades explicitamente.
- Camadas decorativas animadas levam `data-decorative` (permite desligá-las no modo leve) e `gpu-layer` (mantém no compositor).
- Root de card leva `card-contain` (`contain: layout style` — sem `paint`, que recortaria brilhos e botões que saem da borda).
- Listas longas fora da dobra levam `deferred-paint` (`content-visibility: auto`).

**Modo de animações** (`motionMode` no store: `'auto' | 'full' | 'reduced'`, persistido em `sp_motion_mode`):
`src/utils/motion.js` escreve `data-motion="full|reduced"` no `<html>`; o bloco `[data-motion="reduced"]` em `index.css` desliga animações infinitas, blurs e `backdrop-filter`. `'auto'` segue `prefers-reduced-motion`. Aplicado antes do primeiro render em `main.jsx`. Spinners de estado usam `data-loading` para escapar da regra.

### Modais
- Controlados por booleanos no store (`settingsOpen`, `addSiteOpen`).
- Retornam `null` quando fechados.
- Backdrop com `.modal-backdrop` (blur + overlay escuro), `onClick` fecha modal, conteúdo com `e.stopPropagation()`.

### Dados Padrão (`src/utils/storage.js`)
- 8 sites preset (GitHub, Stack Overflow, YouTube, Twitter, Reddit, LinkedIn, Gmail, Netflix).
- 4 categorias: `dev`, `trabalho`, `social`, `entretenimento`.
- 2 tópicos de notícias: `technology`, `science`.

## APIs Externas (client-side)

| Serviço | URL | Uso |
|---------|-----|-----|
| Google Favicons | `https://www.google.com/s2/favicons?domain=<domain>&sz=64` | Ícone de site (fallback: primeira letra) |
| RSS2JSON | `https://api.rss2json.com/v1/api.json?rss_url=<feed>` | Notícias modo RSS |
| GNews | `https://gnews.io/api/v4/top-headlines` | Notícias modo GNews (requer API key) |

## Comandos

```bash
npm run dev      # Dev server (Vite)
npm run build    # Build de produção
npm run preview  # Preview do build
```

## Checklist ao Alterar Código

1. **Persistência**: Se alterar estado que precisa sobreviver a reload, chame `storage.set()` na ação do Zustand.
2. **Temas**: Novas cores/props devem ser adicionadas em **todos** os 7 temas em `src/themes/themes.js`.
3. **Componentes novos**: Colocar em `src/components/`, um por arquivo, default export.
4. **Estilo**: Usar classes Tailwind com tokens temáticos (`bg-card`, `text-text`, `border-border`, etc.), não cores hardcoded.
5. **Sem TypeScript**: Arquivos são `.js`/`.jsx` exclusivamente.
6. **Sem lint/format**: Não há ESLint ou Prettier configurados — manter estilo consistente manualmente.