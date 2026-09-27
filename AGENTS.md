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
| Offline | PWA — `public/sw.js` + `manifest.webmanifest` |

## Estrutura de Diretórios

```
src/
  components/   # Componentes React (flat, 1 componente por arquivo)
  hooks/         # Custom hooks (usePomodoro, useEasterEggs, …)
  store/         # Zustand store (useStore.js)
  themes/        # Definições de temas (themes.js)
  utils/         # Funções utilitárias puras (favicon, storage, url, weather, …)
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
- Estado principal: `sites`, `categories`, `activeCategory`, `subcategories`, `activeSubcategory`, `workspaces`, `activeWorkspace`, `siteStats`, `activity`, `timers`, `ambient`, `widgets`, `weatherLocation`, `notes`, `agenda`, `theme`, `cardLayout`, `motionMode`, `searchProvider`, `searchQuery`, `newsProvider`, `newsTopics`, `newsItems`, `newsLoading`, `deepseekApiKey`, `chat*`, `openInNewTab`, `settingsOpen`, `addSiteOpen`, `editingSite`, `welcomeSeen`, `lastBackupAt`, `dockPanel` / `paletteOpen` / `ambientPlaying` (efêmeros).
- Exporta também o array `searchProviders` (Google, DuckDuckGo, YouTube, Ecosia, AI Chat).

### Temas
- 9 temas: `minimal-light`, `premium-dark`, `space`, `cyberpunk`, `macos`, `crt`, `nebula`, `nous-archive`, `detroit`.
- Temas com variáveis próprias (`--archive-*`, `--dbh-*`) só as definem no próprio tema — o CSS que as usa sempre tem fallback.
- `resolveTheme()` em `themes.js` corrige id órfão no boot e no import (cai para `premium-dark`).
- Temas são **CSS custom properties** aplicadas via `document.documentElement.style.setProperty()` (não classes).
- Tailwind referencia variáveis: `bg-[var(--bg)]`, etc. (configurado em `tailwind.config.js` com tokens `bg`, `card`, `text`, `accent`, `muted`, `border`, `font-theme`).
- `applyTheme()` em `src/themes/themes.js` reage a mudanças via `useEffect` em `App.jsx`.

### Workspaces (Espaços)

- Cada site tem `site.workspace`; `activeWorkspace` no store filtra a grade.
- **Migração**: `loadSites()` em `storage.js` normaliza sites antigos para `'default'` e regrava — o resto do código pode assumir que o campo sempre existe.
- Remover um espaço **move** os sites para o primeiro da lista, nunca apaga. Nunca é possível ficar com zero espaços.
- `resolveActiveWorkspace()` corrige id órfão no boot e no import (cai para o primeiro espaço).
- `WorkspaceSwitcher` só renderiza com 2+ espaços.

### Subcategorias

- `subcategories: { [categoria]: string[] }` em `sp_subcategories`; `site.subcategory` é **opcional** e só vale dentro de `site.category`.
- `activeSubcategory` (efêmero) filtra dentro da categoria ativa; `setActiveCategory`, troca de espaço e import o resetam para `null`.
- Remover subcategoria **mantém** os sites na categoria (só limpa o campo). Remover categoria apaga suas subcategorias e limpa `subcategory` dos sites movidos.
- `SubcategoryBar` (linha abaixo das abas) só aparece com uma categoria real ativa — fica **fora** de `.orbit-category-filter` para não herdar o estilo de aba principal dos temas. Ativo usa `.orbit-subcategory-chip[data-active="true"]` (`color-mix` do accent).
- Tailwind não gera `bg-accent/10` etc. — `accent` é `var(--accent)` sem `<alpha-value>`. Para transparência use `color-mix` no CSS.

### Uso / Frequentes

- `siteStats: { [siteId]: { count, lastUsed } }`, persistido em `sp_site_stats`.
- **Todo card deve abrir sites via `openSite(site, openInNewTab)`** (`utils/navigation.js`), não `openUrl` — é ele que registra a visita.
- `FREQUENT_CATEGORY` (`utils/frequent.js`) é uma categoria **virtual**: não existe em `categories`. Ao adicionar código que trata categorias, lembre que `'all'` e `FREQUENT_CATEGORY` não são atribuíveis a um site.
- Drag & drop fica desabilitado na visão Frequentes (a ordem é derivada do uso).
- Desligar o widget `frequent` reseta `activeCategory` se estava em Frequentes.

### Atalhos de teclado

- Cada site pode ter `shortcut` (uma tecla `a`–`z` ou `0`–`9`), configurável no modal Adicionar/Editar Site. Unicidade global entre sites.
- `useKeyboardShortcuts` (`hooks/useKeyboardShortcuts.js`): fora de inputs/modais, a tecla abre o site do **espaço ativo** via `openSite()`.
- Atalhos globais: `/` foca a busca (`orbit:focus-search` no `SearchBar`); `t` abre/fecha a Agenda no dock (se widget ligado); `Ctrl/Cmd+K` abre a paleta de comandos (funciona até dentro de inputs).

### Paleta de comandos (`CommandPalette`, Ctrl+K)

- Parsers puros em `utils/commands.js`: `parseTimer` (`10m chá`, `1h30`), `evaluateMath` (descida recursiva — **nunca `eval`**), `parseCurrency` + `fetchRate` (AwesomeAPI, sem chave, cache de 10 min em memória).
- Prefixos: `+`/`t ` = tarefa (aceita horário), `n ` = nota. Sem comando reconhecido, lista sites + ações e termina em "Pesquisar" no provedor ativo.
- As seções de Configurações estão espelhadas em `settingsSections` — ao criar seção nova em `SettingsModal`, adicione lá também.
- Pomodoro é controlado via evento `orbit:pomodoro` (`POMODORO_EVENT` em `WidgetDock`), porque o estado vive no hook do dock.

### Widgets

- Flags em `widgets` (`weather`, `notes`, `pomodoro`, `agenda`, `frequent`, `ambient`, `summary`, `tabStatus`), aba "Widgets" nas Configurações. Desligar um widget fecha o painel dele no dock.
- **Clima**: Open-Meteo, sem API key. `utils/weather.js` faz geocoding + previsão e mapeia códigos WMO. Cache de 30 min em `sp_weather_cache`, revalidado só com a aba visível (`visibilitychange` + interval). Ao trocar cidade, o widget limpa o clima antigo até a nova resposta.
- **Pomodoro**: `usePomodoro` deriva o restante de um **timestamp de término**, nunca de um contador decrementado — navegadores limitam timers em abas de segundo plano. O hook vive no `WidgetDock` para o timer sobreviver ao fechamento do painel.
- **Notas**: debounce de 400ms + flush em `pagehide` para não perder texto pendente.
- **Agenda**: `agenda: { date, items[] }` em `sp_agenda`. Rollover à meia-noite via `ensureAgendaDay()` — itens concluídos somem, pendentes carregam para o dia atual (`utils/agenda.js`).
  - Lembretes: `parseAgendaInput` extrai horário do texto (`14:30 x`, `x às 14h`, `x 16:00`; `x 3h` sem "às" com hora < 6 é duração, não horário). Item ganha `time` + `notified`; `useAgendaReminders` dispara e grava `notified` (reload não repete). Horário já passado na criação nasce `notified`. O rollover **remove** `time`/`notified`.
- **Timers avulsos**: `timers: [{ id, label, duration, endsAt }]` em `sp_timers` — timestamp de término, sobrevivem a reload. `useTimers` (no dock) avisa e remove; o botão Timers aparece com o widget `pomodoro` ou se houver timer rodando.
- **Som ambiente**: `utils/ambient.js` sintetiza chuva/ondas/lareira/ruídos com Web Audio (sem arquivos). O motor é um módulo fora do React; o store guarda só `ambient: { sound, volume }` (`sp_ambient`) e `ambientPlaying` (efêmero — autoplay sem gesto é bloqueado). Eventos curtos (gotas/estalos) são agendados no relógio do áudio com ~1s de folga para aguentar timers limitados em segundo plano.
- **Resumo semanal**: `activity: { 'YYYY-MM-DD': { focus, tasks, visits, sites: {id: n} } }` em `sp_activity`, podado a 60 dias (`utils/activity.js`). Alimentado por `registerSiteVisit`, `toggleAgendaItem` (±1) e `logFocus` (fim de ciclo do Pomodoro). Ponto no botão quando começa semana nova (`sp_summary_seen_week`).
- **Título/favicon** (`useTabStatus`, widget `tabStatus`): prioridade pomodoro → timer → lembrete em ≤60 min → `(n) Orbit` pendentes. Com pomodoro/timer, o favicon vira um anel de progresso desenhado em canvas na cor `--accent`.
- `utils/audio.js` tem o `AudioContext` único do app, `playChime()` e `notify()` (notificação + som) — use-os em vez de criar `Notification`/`AudioContext` direto.

### Backup

- `lastBackupAt` (`sp_last_backup`) é atualizado por export manual, backup automático e "Fazer backup" da paleta/aviso.
- Automático (`utils/backup.js`, só Chrome/Edge/Opera): File System Access API; o handle do arquivo fica no **IndexedDB** (`orbit/handles`), não em `sp_*`, por ser local ao navegador. `useAutoBackup` regrava 1×/dia com a aba visível; se a permissão expirou, só sinaliza `backupNeedsPermission` (pedir exige clique). O arquivo automático **nunca** inclui API keys.
- `BackupReminder` (canto inferior esquerdo; topo no celular) aparece com backup > 14 dias ou nunca feito após 7 dias de uso (`sp_first_seen`); "X" adia 7 dias (`sp_backup_snooze`).

### URLs e dados

- Validação central em `utils/url.js` (`isSafeHttpUrl` / `normalizeHttpUrl`) — **apenas `http:` e `https:`**.
- `openUrl` / `openSite` recusam schemes perigosos (`javascript:`, `data:`, etc.).
- `storage.importAll` aceita **somente** chaves com prefixo `sp_` e objeto plano.
- `storage.exportAll({ includeSecrets })` omite API keys por padrão (`sp_deepseek_apikey`, `sp_news_apikey`).

### PWA / Offline

- `public/manifest.webmanifest` + ícones PNG (`icon-192`, `icon-512`, `icon-maskable-512`).
- `public/sw.js` é escrito à mão (sem plugin de build). Estratégias: navegação = network-first; `/assets/*` = cache-first (nomes com hash são imutáveis); favicons e fontes = cache-first.
- Registrado só em produção (`utils/pwa.js`) — em dev atrapalharia o HMR.
- **Ao mudar o SW, incremente `VERSION`** — é o que invalida os caches antigos.

### Componentes Principais
- `StarCanvas` — canvas animado com estrelas, renderiza **apenas** no tema `space` (respeita modo leve).
- `Clock` — relógio/data em tempo real.
- `WeatherWidget` / `WeatherLocationPicker` — clima abaixo do relógio.
- `SearchBar` — input dual: filtra sites localmente (`searchQuery`) e abre busca web (`Enter` = novo tab, `Tab` = troca provider).
- `WorkspaceSwitcher` / `WorkspaceManager` — troca e CRUD de espaços.
- `CategoryFilter` — abas de filtro + Frequentes + botão "Adicionar Site".
- `SiteGrid` — grid sortable com `DndContext > SortableContext`, usa `rectSortingStrategy`.
- `SiteCard` — facade dos 9 layouts (`classic`, `space`, `orbital-glass`, `singularity`, `wave-particle`, `quantum-spin`, `cyber`, `archive`, `android`).
- `resolveCardLayout()` em `utils/cardLayout.js` corrige id órfão no boot e no import (cai para `classic`).
- `WidgetDock` / `NotesPanel` / `PomodoroPanel` / `AgendaPanel` / `TimersPanel` / `AmbientPanel` / `SummaryPanel` — dock inferior.
- `CommandPalette` — Ctrl+K (lazy). `BackupReminder` / `AutoBackupSettings` — backup.
- `NewsFeed` — TabNews (relevantes/recentes), auto-refresh 5min com aba visível.
- `SettingsModal` — navegação lateral agrupada (`sectionGroups`): Comece por aqui · Aparência · Página inicial · Busca e IA · Organização · Sistema. No celular vira lista → detalhe. `openSettings(secao)` abre direto numa seção (ex.: `openSettings("widgets")`).
- `AddSiteModal` — modal para adicionar/editar site.
- `AIChatModal` — chat DeepSeek (requer API key opcional).
- `WelcomeModal` — onboarding na primeira visita.
- `DetroitBoot` — sequência de boot que toca só quando o usuário **ativa** o tema `detroit` (não a cada nova aba). A varredura `.dbh-sweep` (App.jsx) e o LED do cabeçalho compartilham o ciclo de 14s.
- `DetroitHud` — periferia do tema `detroit` (colchetes nos cantos, fluxo de memória, bomba de Thirium, medidor de estabilidade). Só aparece em ≥1280px: os cantos da direita são do botão de Configurações e do `WidgetDock`, então lá só há colchetes.

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
- Controlados por booleanos no store (`settingsOpen`, `addSiteOpen`, `chatOpen`).
- Retornam `null` quando fechados.
- Backdrop com `.modal-backdrop` (blur + overlay escuro), `onClick` fecha modal, conteúdo com `e.stopPropagation()`.

### Dados Padrão (`src/utils/storage.js`)
- 8 sites preset (GitHub, Stack Overflow, YouTube, Twitter, Reddit, LinkedIn, Gmail, Netflix) no workspace `default`.
- 4 categorias: `dev`, `trabalho`, `social`, `entretenimento`.
- 1 espaço: `default` / Pessoal.
- Ordenação de notícias padrão: `relevant`.

## APIs Externas (client-side)

| Serviço | URL | Uso |
|---------|-----|-----|
| Google Favicons | `https://www.google.com/s2/favicons?domain=<domain>&sz=128` | Ícone de site (fallback: primeira letra/ícone `Globe` via `SiteIcon`) |
| TabNews | `https://www.tabnews.com.br/api/v1/contents` | Feed de notícias |
| Open-Meteo | `https://api.open-meteo.com` / geocoding | Clima (sem API key) |
| DeepSeek | API chat (opcional) | Chat IA — chave em `localStorage` |

## Comandos

```bash
npm run dev      # Dev server (Vite)
npm run build    # Build de produção
npm run preview  # Preview do build
```

## Checklist ao Alterar Código

1. **Persistência**: Se alterar estado que precisa sobreviver a reload, chame `storage.set()` na ação do Zustand.
2. **Temas**: Novas cores/props devem ser adicionadas em **todos** os 9 temas em `src/themes/themes.js`.
3. **Componentes novos**: Colocar em `src/components/`, um por arquivo, default export.
4. **Estilo**: Usar classes Tailwind com tokens temáticos (`bg-card`, `text-text`, `border-border`, etc.), não cores hardcoded.
5. **URLs**: Usar `normalizeHttpUrl` / `isSafeHttpUrl` — nunca aceitar schemes além de http(s).
6. **Cards**: Abrir sites com `openSite()` para manter o ranking de Frequentes.
7. **Sem TypeScript**: Arquivos são `.js`/`.jsx` exclusivamente.
8. **Sem lint/format**: Não há ESLint ou Prettier configurados — manter estilo consistente manualmente.
